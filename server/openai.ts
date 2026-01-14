// OpenAI integration using Replit AI integration
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  context?: string
): Promise<string> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are a helpful personal assistant integrated into a productivity dashboard. You have access to the user's Outlook emails and calendar events. ${context || ''}
    
Be concise and helpful. When suggesting actions, be specific. If asked about emails or calendar, use the provided context to answer accurately.`
  };

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || 'I apologize, I could not generate a response.';
}

export async function generateEmailDraft(subject: string, context: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a professional email writing assistant. Write clear, concise, and professional emails.'
      },
      {
        role: 'user',
        content: `Write a professional email with the subject "${subject}". Context: ${context}`
      }
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || '';
}

export async function summarizeEmails(emails: Array<{subject: string, sender: string, preview: string}>): Promise<string> {
  const emailList = emails.map((e, i) => `${i + 1}. From ${e.sender}: ${e.subject}\n   ${e.preview}`).join('\n\n');
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes emails concisely.'
      },
      {
        role: 'user',
        content: `Summarize these emails briefly, highlighting any important or urgent items:\n\n${emailList}`
      }
    ],
    temperature: 0.5,
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content || 'No summary available.';
}
