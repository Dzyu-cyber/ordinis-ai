import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import dotenv from 'dotenv';
import { db } from '../config/db';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;

if (apiKey) {
  openai = new OpenAI({ apiKey });
} else {
  console.warn('[openai]: OPENAI_API_KEY is not defined. AI qualification will run in mock fallback mode.');
}

// Zod Schema for structured AI output BANT qualification
const QualificationResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  budget: z.string(),
  authority: z.string(),
  need: z.string(),
  timeline: z.string(),
  summary: z.string(),
});

type QualificationResult = z.infer<typeof QualificationResultSchema>;

export class AIService {
  /**
   * Qualify a CRM lead based on profile attributes and contextual notes using OpenAI Structured Outputs
   */
  static async qualifyLead(lead: {
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    notes?: string;
  }): Promise<QualificationResult> {
    const promptContext = `
      You are an elite AI Sales Qualification Assistant for Ordinis AI, a Revenue & Operations Business OS.
      Analyze the inbound lead profile information and any conversation history notes to score and qualify them.
      
      Determine the BANT parameters:
      - Budget: How much money do they have? Is it clear or undefined?
      - Authority: Who are they? Are they a Founder, Director, Manager, or generic employee?
      - Need: What problem are they trying to solve with our operating system (e.g., lead automation, unified inbox)?
      - Timeline: When do they plan to purchase or start? (Immediate, 30 days, 60 days, undefined)
      
      Calculate a composite lead score (0-100) using this metric:
      - 25 pts: Budget defined (more points for higher budget).
      - 25 pts: High Authority (Founder, C-level = 25; Manager = 15; Individual Contributor = 5).
      - 25 pts: Clear operational pain point / need specified.
      - 25 pts: Short timeline (< 30 days = 25; < 60 days = 15; undefined = 5).
      
      Output the structured parameters exactly as defined in the schema.
    `;

    const userContent = `
      Lead Profile:
      - Name: ${lead.name}
      - Company: ${lead.company || 'Not Specified'}
      - Email: ${lead.email || 'Not Specified'}
      - Phone: ${lead.phone || 'Not Specified'}
      - Interaction History / Contextual Notes: ${lead.notes || 'No notes provided yet.'}
    `;

    // Fallback Mock data if OpenAI API is unavailable
    const fallbackMockQualification = (reason: string): QualificationResult => {
      console.log(`[openai]: Generating fallback qualification details (Reason: ${reason})`);
      
      // Calculate a simple mock score based on email domain
      let mockScore = 20;
      let mockNeed = 'Requires basic operational organization';
      let mockAuthority = 'Undetermined';
      
      if (lead.email?.endsWith('.edu') || lead.email?.endsWith('.org')) {
        mockScore = 35;
      } else if (lead.email && !lead.email.includes('gmail') && !lead.email.includes('yahoo')) {
        mockScore = 65; // Corporate email domain
        mockAuthority = 'Likely Manager/Decision Maker';
        mockNeed = 'AI automated client routing and unified messaging inbox setup';
      }

      if (lead.notes && lead.notes.length > 5) {
        mockScore += 15;
      }

      return {
        score: Math.min(mockScore, 100),
        budget: 'Undetermined (Fallback Mock)',
        authority: mockAuthority,
        need: mockNeed,
        timeline: 'Within 90 days',
        summary: `Lead qualified in mock fallback mode. Name: ${lead.name}. Company: ${lead.company || 'N/A'}. Details: ${reason}`,
      };
    };

    if (!openai) {
      return fallbackMockQualification('OPENAI_API_KEY not configured');
    }

    try {
      const response = await openai.beta.chat.completions.parse({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: promptContext },
          { role: 'user', content: userContent },
        ],
        response_format: zodResponseFormat(QualificationResultSchema, 'qualification'),
        temperature: 0.1,
      });

      const result = response.choices[0].message.parsed;

      if (!result) {
        throw new Error('Parsed response returned null');
      }

      return result;
    } catch (error: any) {
      console.error('[openai]: AI Qualification failed. Falling back to mock calculation.', error);
      return fallbackMockQualification(error.message || 'API Call Exception');
    }
  }

  /**
   * Run background qualification job and update lead record
   */
  static async triggerLeadQualification(userId: string, leadId: string): Promise<void> {
    try {
      // 1. Fetch Lead
      const leadResult = await db.query(
        'SELECT * FROM leads WHERE user_id = $1 AND id = $2',
        [userId, leadId]
      );
      
      if (leadResult.rows.length === 0) {
        console.error(`[openai]: Trigger qualification failed. Lead ${leadId} not found.`);
        return;
      }

      const lead = leadResult.rows[0];

      // 2. Fetch conversation history notes to pass as context
      const messagesResult = await db.query(
        `SELECT m.direction, m.content FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.lead_id = $1
         ORDER BY m.created_at ASC`,
        [leadId]
      );

      const notes = messagesResult.rows
        .map((m: any) => `${m.direction === 'inbound' ? 'Customer' : 'Agent'}: ${m.content}`)
        .join('\n');

      // 3. Call AI Service
      const qualification = await this.qualifyLead({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        notes,
      });

      // 4. Update Database
      await db.query(
        `UPDATE leads 
         SET score = $1, qualification_details = $2, status = $3
         WHERE id = $4`,
        [
          qualification.score, 
          JSON.stringify({
            budget: qualification.budget,
            authority: qualification.authority,
            need: qualification.need,
            timeline: qualification.timeline,
            summary: qualification.summary
          }),
          qualification.score >= 70 ? 'qualified' : 'contacted',
          leadId
        ]
      );

      // Log AI qualification activity
      await db.query(
        `INSERT INTO activity_logs (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [userId, 'lead_qualified', JSON.stringify({ leadId, score: qualification.score })]
      );

      console.log(`[openai]: Successfully qualified lead ${leadId} with score ${qualification.score}`);
    } catch (error) {
      console.error(`[openai]: Background qualification job failed for lead ${leadId}`, error);
    }
  }

  /**
   * Auto-generate a reply draft based on conversation history and lead qualification details
   */
  static async generateDraftReply(
    leadName: string,
    qualificationDetails: any,
    lastMessage: string,
    historyText: string,
    channel: 'email' | 'whatsapp'
  ): Promise<string> {
    const isConfigured = !!openai;

    if (!isConfigured) {
      console.log('[openai]: OpenAI is not configured. Returning fallback mock draft reply.');
      return `Hi ${leadName},\n\nThank you for your message! This is an auto-generated draft reply. We would love to discuss how Ordinis AI can assist you with your operations. Let's schedule a call.\n\nBest regards,\nOrdinis AI Operations`;
    }

    try {
      const response = await openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
              You are an AI Business Operations Manager drafting responses for customer messages.
              
              Lead Details:
              - Name: ${leadName}
              - Qualification Context: ${JSON.stringify(qualificationDetails || {})}
              
              Channel: ${channel.toUpperCase()}
              
              Guidelines:
              - If channel is EMAIL: Draft a professional email. Include greetings, body paragraphs, and a professional sign-off.
              - If channel is WHATSAPP: Keep the message short (1-3 sentences), warm, conversational, and direct.
              - Reference qualification needs (e.g. automating forms or invoices) if it makes the message highly relevant.
              - Avoid placeholders. Generate a complete ready-to-send draft.
            `,
          },
          {
            role: 'user',
            content: `
              Conversation History:
              ${historyText || 'No previous messages.'}
              
              Last Message Received:
              "${lastMessage}"
              
              Draft a reply to this last message.
            `,
          },
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('[openai]: Failed to generate draft reply. Using mock fallback.', error);
      return `Hi ${leadName},\n\nThank you for reaching out! We received your message: "${lastMessage.substring(0, 40)}..." and are analyzing your request. We will follow up shortly.\n\nBest regards,\nOrdinis AI Operations`;
    }
  }

  /**
   * Extract structured JSON from business files (Invoices, Resumes, Contracts) using OpenAI Vision/Text parse
   */
  static async extractDocumentData(
    buffer: Buffer,
    mimetype: string,
    docType: 'invoice' | 'contract' | 'resume'
  ): Promise<any> {
    const isConfigured = !!openai;

    // Define Zod schemas for the three document types
    const InvoiceSchema = z.object({
      invoiceNumber: z.string(),
      vendor: z.string(),
      totalAmount: z.number(),
      date: z.string(),
      lineItems: z.array(z.object({ description: z.string(), amount: z.number() })),
    });

    const ContractSchema = z.object({
      parties: z.array(z.string()),
      effectiveDate: z.string(),
      keyTerms: z.string(),
    });

    const ResumeSchema = z.object({
      name: z.string(),
      experienceYears: z.number(),
      skills: z.array(z.string()),
      education: z.string(),
    });

    // Fallback Mock values if OpenAI is not configured
    const getFallbackMock = () => {
      console.log(`[openai]: Generating fallback mock document extraction for ${docType}`);
      if (docType === 'invoice') {
        return {
          invoiceNumber: 'INV-2026-0042',
          vendor: 'Supabase Inc.',
          totalAmount: 120.00,
          date: '2026-07-01',
          lineItems: [
            { description: 'Database Hosting Pro Plan', amount: 25.00 },
            { description: 'Compute Add-on (Large)', amount: 95.00 }
          ]
        };
      } else if (docType === 'contract') {
        return {
          parties: ['Acme Solutions LLC', 'Smith & Co Consulting'],
          effectiveDate: '2026-07-09',
          keyTerms: 'This agreement governs SaaS delivery and AI Operations workspace setup. Monthly subscription of $500 is due on the 1st of every month.'
        };
      } else {
        return {
          name: 'Jane Doe',
          experienceYears: 5,
          skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'OpenAI API'],
          education: 'M.S. in Computer Science - Stanford University'
        };
      }
    };

    if (!isConfigured) {
      return getFallbackMock();
    }

    try {
      let schema: any;
      let prompt = '';

      if (docType === 'invoice') {
        schema = InvoiceSchema;
        prompt = 'Extract the invoice number, vendor name, total amount, invoice date, and list of line items from this invoice.';
      } else if (docType === 'contract') {
        schema = ContractSchema;
        prompt = 'Extract the names of all parties involved, the effective contract date, and a brief description of the key terms/clauses.';
      } else {
        schema = ResumeSchema;
        prompt = 'Extract the candidate name, estimated years of experience, a list of core technical/business skills, and their highest level of education.';
      }

      // Check if file is image (Vision path) or PDF (Text path)
      const isImage = mimetype.startsWith('image/');
      
      let extractionResult: any;

      if (isImage) {
        // Encode image buffer to base64
        const base64Image = buffer.toString('base64');
        const response = await openai!.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an expert Document Processing AI. Analyze the document image and extract its structured properties according to the schema.`,
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimetype};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          response_format: zodResponseFormat(schema, 'document_extraction'),
          temperature: 0.1,
        });

        extractionResult = response.choices[0].message.parsed;
      } else {
        // PDF text extraction fallback path
        // For text-based PDFs, convert buffer to string. Even if raw PDF binary, GPT-4o can often parse readable ASCII text chunks.
        const rawText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' '); // Clean binary junk characters
        const response = await openai!.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a Document OCR Parser. Read the raw text extract from the PDF file and populate the structured schema.`,
            },
            {
              role: 'user',
              content: `Raw File Text: \n\n${rawText.substring(0, 15000)}\n\nAction: ${prompt}`,
            },
          ],
          response_format: zodResponseFormat(schema, 'document_extraction'),
          temperature: 0.1,
        });

        extractionResult = response.choices[0].message.parsed;
      }

      if (!extractionResult) {
        throw new Error('Parsed document data returned null');
      }

      return extractionResult;
    } catch (error) {
      console.error('[openai]: Document extraction failed. Falling back to mock data.', error);
      return getFallbackMock();
    }
  }

  /**
   * Auto-generate an executive summary report for business metrics
   */
  static async generateExecutiveSummary(metrics: any, recentActivity: any[]): Promise<string> {
    const isConfigured = !!openai;

    if (!isConfigured) {
      console.log('[openai]: OpenAI is not configured. Returning fallback mock executive summary.');
      return `### Executive Daily Highlights

- **Lead Pipeline Health**: Your lead list has grown to **${metrics.totalLeads} total leads** (with **${metrics.qualifiedLeads} verified qualified leads**), showing positive interest.
- **Inbox Engagement**: Customer threads remain active. There are currently **${metrics.activeThreads} active threads** across email and WhatsApp.
- **Operations Activity**: Operations teams processed **${metrics.totalDocuments} documents** (invoices, resumes, contracts) through AI Vision OCR, speeding up entry and validation.

**Recommended Next Actions**:
1. Follow up with the newly qualified leads that have high priority scores.
2. Draft response suggestions for the threads with client queries.`;
    }

    try {
      const response = await openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `
              You are an elite Business Operations Advisor. Analyze the user's business metrics and recent operations log and write a concise, premium daily executive summary.
              
              Formatting:
              - Use Markdown syntax.
              - Include an "Executive Daily Highlights" section with 3 actionable bullet points.
              - Include a "Recommended Next Actions" section with 2 prioritized next steps.
              - Keep it clean, professional, and inspiring. Avoid placeholders.
            `,
          },
          {
            role: 'user',
            content: `
              Business Metrics:
              - Total Leads: ${metrics.totalLeads}
              - Qualified Leads (BANT score >= 70): ${metrics.qualifiedLeads}
              - Total Active Threads: ${metrics.activeThreads}
              - Total Documents Uploaded: ${metrics.totalDocuments}
              - Total Document Extraction Success: ${metrics.completedDocuments}
              
              Recent System Operations:
              ${recentActivity.map((a: any) => `- [${a.action}] ${a.details ? JSON.stringify(a.details) : ''}`).join('\n')}
            `,
          },
        ],
        temperature: 0.7,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('[openai]: Failed to generate executive summary. Using mock fallback.', error);
      return `### Executive Daily Highlights

- **Lead Pipeline Health**: Your lead list has grown to **${metrics.totalLeads} total leads** (with **${metrics.qualifiedLeads} verified qualified leads**), showing positive interest.
- **Inbox Engagement**: Customer threads remain active. There are currently **${metrics.activeThreads} active threads** across email and WhatsApp.
- **Operations Activity**: Operations teams processed **${metrics.totalDocuments} documents** (invoices, resumes, contracts) through AI Vision OCR, speeding up entry and validation.

**Recommended Next Actions**:
1. Follow up with the newly qualified leads that have high priority scores.
2. Draft response suggestions for the threads with client queries.`;
    }
  }
}
