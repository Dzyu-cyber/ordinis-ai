import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;

export class GmailService {
  /**
   * Helper to retrieve a new OAuth2 Access Token using the Client ID, Secret, and Refresh Token
   */
  private static async getAccessToken(): Promise<string> {
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
      throw new Error('Gmail OAuth environment variables are missing');
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    });

    return response.data.access_token;
  }

  /**
   * Send an email using direct Google Gmail REST API calls
   */
  static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    const isConfigured = GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN;

    if (!isConfigured) {
      console.log(`[mock-gmail]: Mocking outbound email send:
        To: ${to}
        Subject: ${subject}
        Body: ${body}
      `);
      return true;
    }

    try {
      const accessToken = await this.getAccessToken();

      // Create MIME Message
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body,
      ];
      const message = messageParts.join('\n');

      // Encode base64url format
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send via Gmail API
      await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: encodedMessage },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`[gmail]: Successfully sent email to ${to}`);
      return true;
    } catch (error: any) {
      console.error('[gmail]: Outbound Gmail API send failed:', error.response?.data || error.message);
      throw new Error(`Failed to send email to ${to}: ${error.message}`);
    }
  }
}
