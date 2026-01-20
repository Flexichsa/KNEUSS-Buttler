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

export interface DocumentAnalysis {
  companyName: string;
  documentType: string;
  subject: string;
  date: string;
  suggestedName: string;
}

export async function analyzeDocument(textContent: string, originalFileName: string): Promise<DocumentAnalysis> {
  const today = new Date().toISOString().split('T')[0];
  
  const fallbackResult = {
    companyName: 'Unbekannt',
    documentType: 'Dokument',
    subject: '',
    date: today,
    suggestedName: `${today}_Unbekannt_Dokument`,
  };
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a document analysis assistant. Analyze the document content and extract:
1. Company/Organization name (the sender or issuer of the document)
2. Document type (e.g., Rechnung, Vertrag, Offerte, Angebot, Lieferschein, Brief, Bericht, etc.)
3. Subject - the SPECIFIC product name or model number mentioned (e.g., "SQUIX 4.3/300P", "iPhone 15 Pro", "ThinkPad T480")
4. Document date (if found in content, otherwise use today's date)

Respond in JSON format only:
{
  "companyName": "extracted company name",
  "documentType": "document type in German",
  "subject": "specific product model or name",
  "date": "YYYY-MM-DD format"
}

Rules:
- Use the company that SENT or ISSUED the document, not the recipient
- If company name not found, use "Unbekannt"
- If document type unclear, use "Dokument"
- IMPORTANT for subject: Use the EXACT product name/model number from the document, NOT generic categories. Examples:
  * "CAB Etikettendrucker SQUIX 4.3/300P" → subject should be "SQUIX_4.3-300P"
  * "HP LaserJet Pro M404dn" → subject should be "LaserJet_Pro_M404dn"  
  * "Microsoft Surface Pro 9" → subject should be "Surface_Pro_9"
  * Do NOT use generic terms like "Drucker", "Etikettendrucker", "Computer" - use the specific model!
- Replace spaces and special characters in subject with underscores
- If no date in content, use today's date: ${today}
- Keep company names short and clean (no "GmbH", "AG", etc.)
- German document types preferred`
        },
        {
          role: 'user',
          content: `Original filename: ${originalFileName}\n\nDocument content:\n${textContent.slice(0, 4000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const companyName = (parsed.companyName || 'Unbekannt').replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim();
      const documentType = (parsed.documentType || 'Dokument').replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim();
      const subject = (parsed.subject || '').replace(/[^a-zA-Z0-9äöüÄÖÜß\s\-\(\)\"\.]/g, '').trim();
      const date = parsed.date || today;
      
      let suggestedName = `${date}_${companyName}_${documentType}`;
      if (subject) {
        suggestedName += ` ${subject}`;
      }
      suggestedName = suggestedName.replace(/\s+/g, '-').replace(/--+/g, '-');
      
      return {
        companyName,
        documentType,
        subject,
        date,
        suggestedName,
      };
    }
    
    console.warn('[OpenAI] Could not parse response, using fallback');
    return fallbackResult;
  } catch (error: any) {
    console.error('[OpenAI] Document analysis failed:', error?.message || error);
    return fallbackResult;
  }
}
