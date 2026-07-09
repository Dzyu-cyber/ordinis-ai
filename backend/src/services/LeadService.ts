import { db } from '../config/db';
import { CreateLeadInput, UpdateLeadInput } from '../validators/leadValidator';
import { AutomationService } from './AutomationService';

export class LeadService {
  /**
   * Create a new lead for a specific user business
   */
  static async createLead(userId: string, input: CreateLeadInput): Promise<any> {
    const { name, email, phone, company } = input;

    const result = await db.query(
      `INSERT INTO leads (user_id, name, email, phone, company, status, score, qualification_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, name, email || null, phone || null, company || null, 'new', 0, '{}']
    );

    const newLead = result.rows[0];

    // Log lead creation event
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [userId, 'lead_created', JSON.stringify({ leadId: newLead.id, name: newLead.name, company: newLead.company })]
    );

    // Trigger webhook event
    AutomationService.triggerWebhook(userId, 'lead_created', newLead).catch((err) => {
      console.error('[lead-service]: Webhook trigger failure for lead_created', err);
    });

    return newLead;
  }

  /**
   * List all leads with pagination, search, and filtering
   */
  static async getLeads(userId: string, filters: { status?: string; search?: string }): Promise<any[]> {
    let queryText = 'SELECT * FROM leads WHERE user_id = $1';
    const queryParams: any[] = [userId];

    if (filters.status) {
      queryParams.push(filters.status);
      queryText += ` AND status = $${queryParams.length}`;
    }

    if (filters.search) {
      queryParams.push(`%${filters.search}%`);
      queryText += ` AND (name ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length} OR company ILIKE $${queryParams.length})`;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await db.query(queryText, queryParams);
    return result.rows;
  }

  /**
   * Fetch lead by ID
   */
  static async getLeadById(userId: string, leadId: string): Promise<any> {
    const result = await db.query(
      'SELECT * FROM leads WHERE user_id = $1 AND id = $2',
      [userId, leadId]
    );

    if (result.rows.length === 0) {
      const error: any = new Error('Lead not found');
      error.statusCode = 404;
      error.code = 'LEAD_NOT_FOUND';
      throw error;
    }

    return result.rows[0];
  }

  /**
   * Update lead properties
   */
  static async updateLead(userId: string, leadId: string, input: UpdateLeadInput): Promise<any> {
    // Check if lead exists
    const currentLead = await this.getLeadById(userId, leadId);

    const fields = ['name', 'email', 'phone', 'company', 'status', 'score', 'qualification_details'];
    const updates: string[] = [];
    const values: any[] = [userId, leadId];

    fields.forEach((field) => {
      const value = (input as any)[field];
      if (value !== undefined) {
        values.push(value);
        updates.push(`${field} = $${values.length}`);
      }
    });

    if (updates.length === 0) {
      return currentLead;
    }

    const queryText = `
      UPDATE leads 
      SET ${updates.join(', ')} 
      WHERE user_id = $1 AND id = $2 
      RETURNING *
    `;

    const result = await db.query(queryText, values);
    const updatedLead = result.rows[0];

    // Log update
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [userId, 'lead_updated', JSON.stringify({ leadId: updatedLead.id, updates: Object.keys(input) })]
    );

    return updatedLead;
  }

  /**
   * Delete lead
   */
  static async deleteLead(userId: string, leadId: string): Promise<void> {
    // Verify lead exists first
    await this.getLeadById(userId, leadId);

    await db.query(
      'DELETE FROM leads WHERE user_id = $1 AND id = $2',
      [userId, leadId]
    );

    // Log deletion
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [userId, 'lead_deleted', JSON.stringify({ leadId })]
    );
  }
}
