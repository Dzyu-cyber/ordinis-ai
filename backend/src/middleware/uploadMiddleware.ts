import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Use memory storage to preserve buffers for direct OpenAI Vision ingestion
const storage = multer.memoryStorage();

// File type filter validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PDF, PNG, and JPEG documents are allowed.');
    (error as any).statusCode = 400;
    (error as any).code = 'INVALID_FILE_TYPE';
    cb(error as any, false);
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size limit
  },
});
