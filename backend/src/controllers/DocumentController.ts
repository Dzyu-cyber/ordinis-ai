import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/DocumentService';
import { z } from 'zod';

const uploadSchema = z.object({
  documentType: z.enum(['invoice', 'contract', 'resume']),
});

export class DocumentController {
  /**
   * List all uploaded documents for the user
   */
  static async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const documents = await DocumentService.getDocuments(req.user.id);

      return res.status(200).json({
        success: true,
        data: { documents }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch specific document parsing data by ID
   */
  static async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const document = await DocumentService.getDocumentById(req.user.id, req.params.id);

      return res.status(200).json({
        success: true,
        data: { document }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload file and enqueue extraction task
   */
  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      const anyReq = req as any;

      if (!anyReq.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file uploaded. Please select a document to upload.', code: 'FILE_MISSING' }
        });
      }

      // Validate query/form metadata
      const validatedData = uploadSchema.parse(anyReq.body);

      // Create pending document row in database
      const document = await DocumentService.createDocumentRecord(
        anyReq.user.id,
        anyReq.file.originalname,
        validatedData.documentType
      );

      // Spawn background AI extraction without awaiting (non-blocking)
      DocumentService.processDocument(
        anyReq.user.id,
        document.id,
        anyReq.file.buffer,
        anyReq.file.mimetype
      ).catch((err) => {
        console.error(`[controller]: Async extraction failure for doc ${document.id}`, err);
      });

      return res.status(201).json({
        success: true,
        data: { document }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete uploaded document
   */
  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }
        });
      }

      await DocumentService.deleteDocument(req.user.id, req.params.id);

      return res.status(200).json({
        success: true,
        data: { message: 'Document deleted successfully' }
      });
    } catch (error) {
      next(error);
    }
  }
}
