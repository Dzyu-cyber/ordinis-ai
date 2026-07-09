import { db } from '../config/db';
import axios from 'axios';

export class AutomationService {
  /**
   * Fetch all webhook subscriptions for a user
   */
  static async getSubscriptions(userId: string): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM webhook_subscriptions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Register a new webhook url for business automation triggers (e.g. n8n listener nodes)
   */
  static async createSubscription(
    userId: string,
    eventType: string,
    url: string
  ): Promise<any> {
    const result = await db.query(
      `INSERT INTO webhook_subscriptions (user_id, event_type, url, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [userId, eventType, url]
    );
    return result.rows[0];
  }

  /**
   * Delete a webhook subscription
   */
  static async deleteSubscription(userId: string, subscriptionId: string): Promise<void> {
    await db.query(
      `DELETE FROM webhook_subscriptions 
       WHERE user_id = $1 AND id = $2`,
      [userId, subscriptionId]
    );
  }

  /**
   * Retrieve all webhook executions logs
   */
  static async getWebhookLogs(userId: string): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM webhook_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Dispatch an outbound event trigger payload to all registered webhook URLs (e.g. n8n listeners)
   * Runs in the background and writes execution details to webhook_logs
   */
  static async triggerWebhook(userId: string, eventType: string, payload: any): Promise<void> {
    try {
      // Find active subscriptions
      const subsResult = await db.query(
        `SELECT id, url FROM webhook_subscriptions 
         WHERE user_id = $1 AND event_type = $2 AND is_active = TRUE`,
        [userId, eventType]
      );

      const subscriptions = subsResult.rows;

      if (subscriptions.length === 0) {
        return;
      }

      console.log(`[automation]: Dispatching ${eventType} event to ${subscriptions.length} subscriptions`);

      // Fire POST request to all registered webhooks asynchronously
      for (const sub of subscriptions) {
        // Fire request and log results asynchronously
        this.fireRequestAndLog(userId, eventType, sub.url, payload).catch((err) => {
          console.error(`[automation]: Webhook dispatch failed for URL: ${sub.url}`, err);
        });
      }
    } catch (error) {
      console.error(`[automation]: Failed to trigger webhooks for event ${eventType}`, error);
    }
  }

  /**
   * Internal helper to make the HTTP request and write audit trails to database
   */
  private static async fireRequestAndLog(
    userId: string,
    eventType: string,
    url: string,
    payload: any
  ): Promise<void> {
    let responseStatus = 0;
    let responseBody = '';

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Ordiniss-Event': eventType,
        },
        timeout: 5000, // 5 seconds timeout limit
      });

      responseStatus = response.status;
      responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (error: any) {
      responseStatus = error.response?.status || 500;
      responseBody = error.response?.data
        ? (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data))
        : error.message || 'Request connection failed';
    } finally {
      // Write log to DB
      await db.query(
        `INSERT INTO webhook_logs (user_id, event_type, url, payload, response_status, response_body)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, eventType, url, JSON.stringify(payload), responseStatus, responseBody.substring(0, 1000)]
      );
    }
  }
}
