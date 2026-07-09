import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.token;

    // Fallback: Check Authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No authentication token provided.',
          code: 'UNAUTHORIZED',
        },
      });
    }

    // Verify and decode token
    const decoded = verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired authentication token.',
        code: 'INVALID_TOKEN',
      },
    });
  }
};
