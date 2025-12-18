// Outlook integration using Microsoft Graph API via Replit connection
import { Client } from '@microsoft/microsoft-graph-client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
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
        'X_REPLIT_TOKEN': xReplitToken
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

export async function getEmails(limit: number = 10): Promise<OutlookEmail[]> {
  const client = await getUncachableOutlookClient();
  
  // Query the inbox folder explicitly for most recent emails
  const messages = await client
    .api('/me/mailFolders/inbox/messages')
    .top(limit)
    .select('id,subject,from,bodyPreview,receivedDateTime,isRead,hasAttachments')
    .orderby('receivedDateTime DESC')
    .get();

  return messages.value.map((msg: any) => ({
    id: msg.id,
    subject: msg.subject,
    sender: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || 'Unbekannt',
    preview: msg.bodyPreview || '',
    receivedDateTime: msg.receivedDateTime,
    isRead: msg.isRead,
    hasAttachments: msg.hasAttachments
  }));
}

export async function getTodayEvents(): Promise<OutlookEvent[]> {
  const client = await getUncachableOutlookClient();
  
  // Use timezone-aware date range for today
  // Get start and end of day in ISO format with timezone
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

    return events.value.map((event: any) => ({
      id: event.id,
      subject: event.subject,
      start: event.start.dateTime,
      end: event.end.dateTime,
      location: event.location?.displayName,
      isOnlineMeeting: event.isOnlineMeeting,
      onlineMeetingUrl: event.onlineMeetingUrl
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
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

    return events.value.map((event: any) => ({
      id: event.id,
      subject: event.subject,
      start: event.start.dateTime,
      end: event.end.dateTime,
      location: event.location?.displayName,
      isOnlineMeeting: event.isOnlineMeeting,
      onlineMeetingUrl: event.onlineMeetingUrl
    }));
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
}
