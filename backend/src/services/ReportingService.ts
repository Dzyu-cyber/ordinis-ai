import { db } from '../config/db';
import { AIService } from './AIService';

export class ReportingService {
  /**
   * Fetch aggregated analytics metrics for the business workspace
   */
  static async getAnalytics(userId: string): Promise<any> {
    // 1. Leads aggregates
    const leadsResult = await db.query(
      `SELECT 
        COUNT(*)::int as total_leads,
        COUNT(CASE WHEN score >= 70 THEN 1 END)::int as qualified_leads,
        COUNT(CASE WHEN status = 'new' THEN 1 END)::int as new_leads,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END)::int as contacted_leads
       FROM leads 
       WHERE user_id = $1`,
      [userId]
    );

    const leadStats = leadsResult.rows[0];
    const totalLeads = leadStats.total_leads || 0;
    const qualifiedLeads = leadStats.qualified_leads || 0;
    const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

    // 2. Documents aggregates
    const docsResult = await db.query(
      `SELECT 
        COUNT(*)::int as total_documents,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::int as completed_documents,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::int as failed_documents,
        COUNT(CASE WHEN status = 'processing' OR status = 'pending' THEN 1 END)::int as active_documents
       FROM documents 
       WHERE user_id = $1`,
      [userId]
    );

    const docStats = docsResult.rows[0];

    // 3. Communication aggregates
    const threadsResult = await db.query(
      `SELECT 
        COUNT(*)::int as active_threads,
        COUNT(CASE WHEN channel = 'email' THEN 1 END)::int as email_threads,
        COUNT(CASE WHEN channel = 'whatsapp' THEN 1 END)::int as whatsapp_threads
       FROM conversations c
       JOIN leads l ON c.lead_id = l.id
       WHERE l.user_id = $1`,
      [userId]
    );

    const threadStats = threadsResult.rows[0];

    return {
      totalLeads,
      qualifiedLeads,
      newLeads: leadStats.new_leads || 0,
      contactedLeads: leadStats.contacted_leads || 0,
      conversionRate,
      
      totalDocuments: docStats.total_documents || 0,
      completedDocuments: docStats.completed_documents || 0,
      failedDocuments: docStats.failed_documents || 0,
      activeDocuments: docStats.active_documents || 0,

      activeThreads: threadStats.active_threads || 0,
      emailThreads: threadStats.email_threads || 0,
      whatsappThreads: threadStats.whatsapp_threads || 0,
    };
  }

  /**
   * Compile and generate AI executive highlights
   */
  static async getExecutiveSummary(userId: string): Promise<string> {
    // 1. Fetch metrics
    const metrics = await this.getAnalytics(userId);

    // 2. Fetch recent operations activity logs
    const activitiesResult = await db.query(
      `SELECT action, details, created_at 
       FROM activity_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 8`,
      [userId]
    );

    const recentActivity = activitiesResult.rows;

    // 3. Trigger AI summary generation
    const summary = await AIService.generateExecutiveSummary(metrics, recentActivity);

    return summary;
  }
}
