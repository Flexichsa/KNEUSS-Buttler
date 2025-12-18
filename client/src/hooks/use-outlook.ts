import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

export function useOAuthConfig() {
  return useQuery({
    queryKey: ['oauth', 'config'],
    queryFn: async () => {
      const res = await fetch('/api/auth/oauth-config');
      if (!res.ok) throw new Error('Failed to check OAuth config');
      return res.json() as Promise<{ configured: boolean }>;
    },
  });
}

export function useUserOutlookStatus(sessionId: string | null) {
  return useQuery({
    queryKey: ['oauth', 'outlook', 'status', sessionId],
    queryFn: async () => {
      if (!sessionId) return { connected: false };
      const res = await fetch(`/api/auth/outlook/status/${sessionId}`);
      if (!res.ok) throw new Error('Failed to check user Outlook status');
      return res.json() as Promise<{ connected: boolean; email?: string; displayName?: string }>;
    },
    enabled: !!sessionId,
    refetchInterval: 30000,
  });
}

export function useConnectOutlook() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/auth/outlook/login?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Failed to start OAuth');
      const data = await res.json();
      window.location.href = data.authUrl;
    },
  });
}

export function useDisconnectOutlook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch('/api/auth/outlook/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oauth'] });
    },
  });
}
