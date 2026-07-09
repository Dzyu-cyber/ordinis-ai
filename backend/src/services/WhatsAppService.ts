import dotenv from 'dotenv';

dotenv.config();

export class WhatsAppService {
  /**
   * Send a WhatsApp message (currently Mocked behind a clean adapter interface)
   */
  static async sendMessage(to: string, content: string): Promise<boolean> {
    console.log(`[mock-whatsapp]: Outbound WhatsApp message:
      To: ${to}
      Content: ${content}
    `);

    // Simulate network delay and return success
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }

  /**
   * Simulate receiving a WhatsApp message (used for local testing / webhooks)
   */
  static simulateInboundMessage(from: string, text: string) {
    return {
      event: 'whatsapp_received',
      from,
      text,
      timestamp: new Date().toISOString(),
    };
  }
}
