import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";

interface Password {
  id: number;
  name: string;
  username: string | null;
  encryptedPassword: string;
  url: string | null;
  notes: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreatePasswordInput {
  name: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
}

interface UpdatePasswordInput {
  name?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  category?: string;
}

export function usePasswords() {
  return useQuery<Password[]>({
    queryKey: ["/api/passwords"],
    queryFn: async () => {
      const res = await fetch("/api/passwords", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch passwords");
      return res.json();
    },
  });
}

export function usePassword(id: number) {
  return useQuery<Password>({
    queryKey: ["/api/passwords", id],
    queryFn: async () => {
      const res = await fetch(`/api/passwords/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch password");
      return res.json();
    },
    enabled: !!id,
  });
}

export async function decryptPassword(id: number): Promise<string> {
  const res = await fetch(`/api/passwords/${id}/decrypt`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to decrypt password");
  const data = await res.json();
  return data.password;
}

function handleAuthError(error: Error) {
  if (isUnauthorizedError(error)) {
    throw new Error("Bitte melden Sie sich zuerst an, um Passwörter zu speichern.");
  }
  throw error;
}

export function useCreatePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePasswordInput) => {
      const res = await apiRequest("POST", "/api/passwords", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passwords"] });
    },
    onError: handleAuthError,
  });
}

export function useUpdatePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdatePasswordInput) => {
      const res = await apiRequest("PATCH", `/api/passwords/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passwords"] });
    },
    onError: handleAuthError,
  });
}

export function useDeletePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/passwords/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passwords"] });
    },
    onError: handleAuthError,
  });
}
