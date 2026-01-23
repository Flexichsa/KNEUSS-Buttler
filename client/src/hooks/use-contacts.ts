import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface ContactPerson {
  id: number;
  contactId: number;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

interface Contact {
  id: number;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  persons: ContactPerson[];
}

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json() as Promise<Contact[]>;
    },
  });
}

export function useContact(id: number) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch contact');
      return res.json() as Promise<Contact>;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { type: string; name: string; email?: string; phone?: string; address?: string; notes?: string; logoUrl?: string }) => {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create contact');
      return res.json() as Promise<Contact>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Kontakt konnte nicht erstellt werden",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; email?: string; phone?: string; address?: string; notes?: string; logoUrl?: string }) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update contact');
      return res.json() as Promise<Contact>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Kontakt konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete contact');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Kontakt konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });
}

export function useCreateContactPerson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ contactId, ...data }: { contactId: number; name: string; role?: string; email?: string; phone?: string }) => {
      const res = await fetch(`/api/contacts/${contactId}/persons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create contact person');
      return res.json() as Promise<ContactPerson>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Ansprechpartner konnte nicht hinzugefügt werden",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateContactPerson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; role?: string; email?: string; phone?: string }) => {
      const res = await fetch(`/api/contact-persons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update contact person');
      return res.json() as Promise<ContactPerson>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Ansprechpartner konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteContactPerson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/contact-persons/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete contact person');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Ansprechpartner konnte nicht gelöscht werden",
        variant: "destructive",
      });
    },
  });
}
