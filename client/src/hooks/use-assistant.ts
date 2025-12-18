import { useMutation } from "@tanstack/react-query";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  includeContext?: boolean;
}

export function useAssistantChat() {
  return useMutation({
    mutationFn: async ({ messages, includeContext = true }: ChatRequest) => {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, includeContext }),
      });
      if (!res.ok) throw new Error('Failed to get AI response');
      const data = await res.json();
      return data.message as string;
    },
  });
}
