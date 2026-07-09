import { db } from '../config/db';
import { AIService } from './AIService';

export class DocumentService {
  /**
   * Insert a new pending document record into the database
   */
  static async createDocumentRecord(
    userId: string,
    filename: string,
    documentType: 'invoice' | 'contract' | 'resume'
  ): Promise<any> {
    const fileUrl = `uploads/${Date.now()}_${filename}`;

    const result = await db.query(
      `INSERT INTO documents (user_id, filename, file_url, document_type, status, parsed_content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, filename, fileUrl, documentType, 'pending', '{}']
    );

    const doc = result.rows[0];

    // Log upload activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [userId, 'document_uploaded', JSON.stringify({ documentId: doc.id, filename: doc.filename, documentType: doc.document_type })]
    );

    return doc;
  }

  /**
   * Retrieve all uploaded documents for a user
   */
  static async getDocuments(userId: string): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM documents 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Fetch a single document by ID
   */
  static async getDocumentById(userId: string, documentId: string): Promise<any> {
    const result = await db.query(
      'SELECT * FROM documents WHERE user_id = $1 AND id = $2',
      [userId, documentId]
    );

    if (result.rows.length === 0) {
      const error: any = new Error('Document not found');
      error.statusCode = 404;
      error.code = 'DOCUMENT_NOT_FOUND';
      throw error;
    }

    return result.rows[0];
  }

  /**
   * Process a document asynchronously using GPT-4o-mini Vision and update PostgreSQL
   */
  static async processDocument(
    userId: string,
    documentId: string,
    buffer: Buffer,
    mimetype: string
  ): Promise<void> {
    try {
      // 1. Fetch document and update status to processing
      const doc = await this.getDocumentById(userId, documentId);
      
      await db.query(
        "UPDATE documents SET status = 'processing' WHERE id = $1",
        [documentId]
      );

      console.log(`[vision]: Starting document parsing for ${doc.filename} (Type: ${doc.document_type})`);

      // 2. Call AI extraction service
      const parsedContent = await AIService.extractDocumentData(
        buffer,
        mimetype,
        doc.document_type
      );

      // 3. Update database with results and mark completed
      await db.query(
        `UPDATE documents 
         SET status = 'completed', parsed_content = $1
         WHERE id = $2`,
        [JSON.stringify(parsedContent), documentId]
      );

      // Log extraction completion
      await db.query(
        `INSERT INTO activity_logs (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [userId, 'document_processed', JSON.stringify({ documentId, filename: doc.filename, status: 'completed' })]
      );

      console.log(`[vision]: Completed document extraction for ${doc.filename}`);
    } catch (error: any) {
      console.error(`[vision]: Extraction job failed for document ${documentId}`, error);

      // Mark document as failed
      await db.query(
        `UPDATE documents 
         SET status = 'failed', parsed_content = $1
         WHERE id = $2`,
        [JSON.stringify({ error: error.message || 'Unknown extraction error' }), documentId]
      );

      // Log failure
      await db.query(
        `INSERT INTO activity_logs (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [userId, 'document_failed', JSON.stringify({ documentId, error: error.message })]
      );
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(userId: string, documentId: string): Promise<void> {
    // Verify ownership
    await this.getDocumentById(userId, documentId);

    await db.query(
      'DELETE FROM documents WHERE user_id = $1 AND id = $2',
      [userId, documentId]
    );

    // Log deletion
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [userId, 'document_deleted', JSON.stringify({ documentId })]
    );
  }
}
