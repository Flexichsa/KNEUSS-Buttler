// Outlook integration using Microsoft Graph API via Replit connection
import { Client } from '@microsoft/microsoft-graph-client';
import { getValidAccessToken } from './oauth';

let connectionSettings: any;

async function getAccessToken() {
  // Force refresh token each time to avoid stale data
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=outlook',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken,
        'Cache-Control': 'no-cache'
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Outlook not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableOutlookClient() {
  const accessToken = await getAccessToken();

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function isOutlookConnected(): Promise<boolean> {
  try {
    await getAccessToken();
    return true;
  } catch (error) {
    return false;
  }
}

export interface OutlookEmail {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  folder?: string;
}

export interface OutlookEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  location?: string;
  isOnlineMeeting: boolean;
  onlineMeetingUrl?: string;
}

export async function getEmails(limit: number = 20): Promise<OutlookEmail[]> {
  const client = await getUncachableOutlookClient();
  
  try {
    // Try to get all recent messages from all folders, sorted by date
    // This bypasses any folder-specific issues
    const messages = await client
      .api('/me/messages')
      .header('Prefer', 'outlook.body-content-type="text"')
      .top(limit)
      .select('id,subject,from,bodyPreview,receivedDateTime,isRead,hasAttachments,parentFolderId')
      .orderby('receivedDateTime DESC')
      .get();

    console.log(`[Outlook] Fetched ${messages.value?.length || 0} emails, newest: ${messages.value?.[0]?.receivedDateTime}`);

    return messages.value.map((msg: any) => ({
      id: msg.id,
      subject: msg.subject || '(Kein Betreff)',
      sender: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unbekannt',
      preview: msg.bodyPreview || '',
      receivedDateTime: msg.receivedDateTime,
      isRead: msg.isRead,
      hasAttachments: msg.hasAttachments,
      folder: msg.parentFolderId
    }));
  } catch (error: any) {
    console.error('[Outlook] Error fetching emails:', error.message);
    throw error;
  }
}

export async function getTodayEvents(): Promise<OutlookEvent[]> {
  const client = await getUncachableOutlookClient();
  
  // Use timezone-aware date range for today
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  try {
    // Use calendarView with proper timezone header
    const events = await client
      .api('/me/calendarView')
      .header('Prefer', 'outlook.timezone="Europe/Zurich"')
      .query({
        startDateTime: startOfDay.toISOString(),
        endDateTime: endOfDay.toISOString()
      })
      .select('id,subject,start,end,location,isOnlineMeeting,onlineMeetingUrl')
      .orderby('start/dateTime')
      .top(20)
      .get();

    console.log(`[Outlook] Fetched ${events.value?.length || 0} events for today`);

    return events.value.map((event: any) => ({
      id: event.id,
      subject: event.subject,
      start: event.start.dateTime,
      end: event.end.dateTime,
      location: event.location?.displayName,
      isOnlineMeeting: event.isOnlineMeeting,
      onlineMeetingUrl: event.onlineMeetingUrl
    }));
  } catch (error: any) {
    console.error('[Outlook] Error fetching calendar events:', error.message);
    return [];
  }
}

// Get upcoming events for the next 7 days
export async function getUpcomingEvents(days: number = 7): Promise<OutlookEvent[]> {
  const client = await getUncachableOutlookClient();
  
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 23, 59, 59);

  try {
    const events = await client
      .api('/me/calendarView')
      .header('Prefer', 'outlook.timezone="Europe/Zurich"')
      .query({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString()
      })
      .select('id,subject,start,end,location,isOnlineMeeting,onlineMeetingUrl')
      .orderby('start/dateTime')
      .top(50)
      .get();

    console.log(`[Outlook] Fetched ${events.value?.length || 0} upcoming events`);

    return events.value.map((event: any) => ({
      id: event.id,
      subject: event.subject,
      start: event.start.dateTime,
      end: event.end.dateTime,
      location: event.location?.displayName,
      isOnlineMeeting: event.isOnlineMeeting,
      onlineMeetingUrl: event.onlineMeetingUrl
    }));
  } catch (error: any) {
    console.error('[Outlook] Error fetching upcoming events:', error.message);
    return [];
  }
}

// Debug function to get user info and available calendars
export async function getOutlookUserInfo(): Promise<{ email: string; displayName: string; calendars: string[] }> {
  const client = await getUncachableOutlookClient();
  
  try {
    const [user, calendars] = await Promise.all([
      client.api('/me').select('mail,displayName').get(),
      client.api('/me/calendars').select('id,name').get()
    ]);

    console.log(`[Outlook] Connected as: ${user.mail} (${user.displayName})`);
    console.log(`[Outlook] Available calendars:`, calendars.value?.map((c: any) => c.name));

    return {
      email: user.mail || 'unknown',
      displayName: user.displayName || 'Unknown User',
      calendars: calendars.value?.map((c: any) => c.name) || []
    };
  } catch (error: any) {
    console.error('[Outlook] Error fetching user info:', error.message);
    throw error;
  }
}

// Per-user functions using custom OAuth tokens
function getClientForUser(accessToken: string): Client {
  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => accessToken
    }
  });
}

export async function getEmailsForUser(sessionId: string, limit: number = 20): Promise<OutlookEmail[]> {
  const accessToken = await getValidAccessToken(sessionId);
  if (!accessToken) {
    throw new Error('User not connected to Outlook');
  }
  
  const client = getClientForUser(accessToken);
  
  try {
    const messages = await client
      .api('/me/messages')
      .header('Prefer', 'outlook.body-content-type="text"')
      .top(limit)
      .select('id,subject,from,bodyPreview,receivedDateTime,isRead,hasAttachments,parentFolderId')
      .orderby('receivedDateTime DESC')
      .get();

    console.log(`[Outlook] Fetched ${messages.value?.length || 0} emails for session ${sessionId}`);

    return messages.value.map((msg: any) => ({
      id: msg.id,
      subject: msg.subject || '(Kein Betreff)',
      sender: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unbekannt',
      preview: msg.bodyPreview || '',
      receivedDateTime: msg.receivedDateTime,
      isRead: msg.isRead,
      hasAttachments: msg.hasAttachments,
      folder: msg.parentFolderId
    }));
  } catch (error: any) {
    console.error('[Outlook] Error fetching emails for user:', error.message);
    throw error;
  }
}

export async function getTodayEventsForUser(sessionId: string): Promise<OutlookEvent[]> {
  const accessToken = await getValidAccessToken(sessionId);
  if (!accessToken) {
    throw new Error('User not connected to Outlook');
  }
  
  const client = getClientForUser(accessToken);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  try {
    const events = await client
      .api('/me/calendarView')
      .header('Prefer', 'outlook.timezone="Europe/Zurich"')
      .query({
        startDateTime: startOfDay.toISOString(),
        endDateTime: endOfDay.toISOString()
      })
      .select('id,subject,start,end,location,isOnlineMeeting,onlineMeetingUrl')
      .orderby('start/dateTime')
      .top(20)
      .get();

    console.log(`[Outlook] Fetched ${events.value?.length || 0} events for session ${sessionId}`);

    return events.value.map((event: any) => ({
      id: event.id,
      subject: event.subject,
      start: event.start.dateTime,
      end: event.end.dateTime,
      location: event.location?.displayName,
      isOnlineMeeting: event.isOnlineMeeting,
      onlineMeetingUrl: event.onlineMeetingUrl
    }));
  } catch (error: any) {
    console.error('[Outlook] Error fetching events for user:', error.message);
    return [];
  }
}

export async function getOutlookUserInfoForUser(sessionId: string): Promise<{ email: string; displayName: string; calendars: string[] }> {
  const accessToken = await getValidAccessToken(sessionId);
  if (!accessToken) {
    throw new Error('User not connected to Outlook');
  }
  
  const client = getClientForUser(accessToken);
  
  try {
    const [user, calendars] = await Promise.all([
      client.api('/me').select('mail,displayName').get(),
      client.api('/me/calendars').select('id,name').get()
    ]);

    return {
      email: user.mail || 'unknown',
      displayName: user.displayName || 'Unknown User',
      calendars: calendars.value?.map((c: any) => c.name) || []
    };
  } catch (error: any) {
    console.error('[Outlook] Error fetching user info:', error.message);
    throw error;
  }
}
