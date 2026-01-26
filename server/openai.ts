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
  
  // Extract base filename without extension for better analysis
  const baseFileName = originalFileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  
  // Check if we have meaningful text content - only treat as minimal if:
  // 1. Content starts with "Dateiname:" (our fallback marker) OR
  // 2. Content is very short AND has low alphabetic content ratio
  const trimmedContent = textContent.trim();
  const startsWithFilename = trimmedContent.startsWith('Dateiname:');
  const alphabeticChars = (trimmedContent.match(/[a-zA-ZäöüÄÖÜß]/g) || []).length;
  const alphabeticRatio = trimmedContent.length > 0 ? alphabeticChars / trimmedContent.length : 0;
  const hasMinimalContent = startsWithFilename || (trimmedContent.length < 50 && alphabeticRatio < 0.3);
  
  // Document type keywords for smart detection
  const docTypeKeywords: Record<string, string> = {
    'invoice': 'Rechnung', 'rechnung': 'Rechnung', 'bill': 'Rechnung',
    'contract': 'Vertrag', 'vertrag': 'Vertrag', 'agreement': 'Vertrag',
    'report': 'Bericht', 'bericht': 'Bericht',
    'quote': 'Angebot', 'angebot': 'Angebot', 'offer': 'Angebot', 'offerte': 'Offerte',
    'delivery': 'Lieferschein', 'lieferschein': 'Lieferschein',
    'order': 'Bestellung', 'bestellung': 'Bestellung',
    'letter': 'Brief', 'brief': 'Brief',
    'process': 'Dokument', 'solutions': 'Dokument', 'manual': 'Handbuch'
  };
  
  // Parse filename parts, excluding pure numeric tokens and short words
  const fileNameParts = baseFileName.split(' ')
    .filter(p => p.length > 2 && !/^\d+$/.test(p));
  
  // Detect document type from filename
  let detectedDocType = 'Dokument';
  for (const part of fileNameParts) {
    const lowerPart = part.toLowerCase();
    if (docTypeKeywords[lowerPart]) {
      detectedDocType = docTypeKeywords[lowerPart];
      break;
    }
  }
  
  // Filter out document type keywords from parts to get company/subject
  const nonDocTypeParts = fileNameParts.filter(p => !docTypeKeywords[p.toLowerCase()]);
  const fallbackCompany = nonDocTypeParts.length > 0 ? nonDocTypeParts[0] : 'Unbekannt';
  const fallbackSubject = nonDocTypeParts.length > 1 ? nonDocTypeParts.slice(1).join('_') : '';
  
  const fallbackResult = {
    companyName: fallbackCompany,
    documentType: detectedDocType,
    subject: fallbackSubject,
    date: today,
    suggestedName: `${today}_${fallbackCompany}_${detectedDocType}${fallbackSubject ? '-' + fallbackSubject : ''}`,
  };
  
  try {
    // Adjust the prompt based on whether we have content or just filename
    const systemPrompt = hasMinimalContent 
      ? `You are a document analysis assistant. The document content could not be extracted, so you must analyze based on the FILENAME only.

IMPORTANT: When only the filename is available, extract as much information as possible from it:
1. Company/Organization name - Look for company names, brand names, or organization identifiers in the filename
2. Document type - Infer from context (e.g., "Invoice" → "Rechnung", "Report" → "Bericht", "Solutions" → "Dokument")
3. Subject - Extract the main topic or product name from the filename
4. Date - Use today's date: ${today}

Respond in JSON format only:
{
  "companyName": "extracted or inferred company name",
  "documentType": "document type in German",
  "subject": "main topic from filename",
  "date": "YYYY-MM-DD format"
}

Rules:
- NEVER return "Unbekannt" if the filename contains identifiable words - use those words!
- For filenames like "Feather_Shredding_Process_Solutions" → companyName: "Feather", subject: "Shredding_Process_Solutions"
- For filenames like "Company_Invoice_2024" → companyName: "Company", documentType: "Rechnung"
- Convert English terms to German: Invoice→Rechnung, Contract→Vertrag, Report→Bericht, Quote→Angebot
- Keep extracted names clean (remove underscores, capitalize properly)
- If truly no company identifiable, use the first meaningful word from filename
- German document types preferred`
      : `You are a document analysis assistant. Analyze the document content and extract:
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
- If company name not found in content, try to extract from filename
- If document type unclear, use "Dokument"
- IMPORTANT for subject: Use the EXACT product name/model number from the document, NOT generic categories. Examples:
  * "CAB Etikettendrucker SQUIX 4.3/300P" → subject should be "SQUIX_4.3-300P"
  * "HP LaserJet Pro M404dn" → subject should be "LaserJet_Pro_M404dn"  
  * "Microsoft Surface Pro 9" → subject should be "Surface_Pro_9"
  * Do NOT use generic terms like "Drucker", "Etikettendrucker", "Computer" - use the specific model!
- Replace spaces and special characters in subject with underscores
- If no date in content, use today's date: ${today}
- Keep company names short and clean (no "GmbH", "AG", etc.)
- German document types preferred`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: hasMinimalContent 
            ? `Filename to analyze: ${originalFileName}\n\nNote: Document content could not be extracted. Please analyze based on filename only.`
            : `Original filename: ${originalFileName}\n\nDocument content:\n${textContent.slice(0, 4000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '{}';
    console.log(`[OpenAI] Document analysis mode: ${hasMinimalContent ? 'filename-only' : 'full-content'}`);
    console.log(`[OpenAI] Raw response: ${content}`);
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      let companyName = (parsed.companyName || '').replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim();
      let documentType = (parsed.documentType || 'Dokument').replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '').trim();
      let subject = (parsed.subject || '').replace(/[^a-zA-Z0-9äöüÄÖÜß\s\-\(\)\"\.]/g, '').trim();
      const date = parsed.date || today;
      
      // Use smart fallback values if OpenAI still returned empty/Unbekannt
      if (!companyName || companyName.toLowerCase() === 'unbekannt') {
        companyName = fallbackResult.companyName;
        console.log(`[OpenAI] Using fallback company name: ${companyName}`);
      }
      if (!subject && fallbackResult.subject) {
        subject = fallbackResult.subject;
        console.log(`[OpenAI] Using fallback subject: ${subject}`);
      }
      
      let suggestedName = `${date}_${companyName}_${documentType}`;
      if (subject) {
        suggestedName += `-${subject}`;
      }
      suggestedName = suggestedName.replace(/\s+/g, '-').replace(/--+/g, '-');
      
      console.log(`[OpenAI] Final suggested name: ${suggestedName}`);
      
      return {
        companyName,
        documentType,
        subject,
        date,
        suggestedName,
      };
    }
    
    console.warn('[OpenAI] Could not parse response, using smart fallback:', fallbackResult);
    return fallbackResult;
  } catch (error: any) {
    console.error('[OpenAI] Document analysis failed:', error?.message || error);
    console.log('[OpenAI] Using smart fallback:', fallbackResult);
    return fallbackResult;
  }
}
