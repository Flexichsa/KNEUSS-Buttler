import { useQuery } from "@tanstack/react-query";

interface OutlookEmail {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
}

interface OutlookEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  location?: string;
  isOnlineMeeting: boolean;
  onlineMeetingUrl?: string;
}

export function useOutlookStatus() {
  return useQuery({
    queryKey: ['outlook', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/outlook/status');
      if (!res.ok) throw new Error('Failed to check Outlook status');
      return res.json() as Promise<{ connected: boolean }>;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useOutlookEmails(limit: number = 10) {
  const { data: status } = useOutlookStatus();
  
  return useQuery({
    queryKey: ['outlook', 'emails', limit],
    queryFn: async () => {
      const res = await fetch(`/api/outlook/emails?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch emails');
      return res.json() as Promise<OutlookEmail[]>;
    },
    enabled: status?.connected ?? false,
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useOutlookEvents() {
  const { data: status } = useOutlookStatus();
  
  return useQuery({
    queryKey: ['outlook', 'events', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/outlook/events/today');
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json() as Promise<OutlookEvent[]>;
    },
    enabled: status?.connected ?? false,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

interface OutlookUserInfo {
  email: string;
  displayName: string;
  calendars: string[];
}

export function useOutlookUserInfo() {
  const { data: status } = useOutlookStatus();
  
  return useQuery({
    queryKey: ['outlook', 'user'],
    queryFn: async () => {
      const res = await fetch('/api/outlook/user');
      if (!res.ok) throw new Error('Failed to fetch user info');
      return res.json() as Promise<OutlookUserInfo>;
    },
    enabled: status?.connected ?? false,
  });
}
