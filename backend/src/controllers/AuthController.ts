import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { signToken } from '../utils/jwt';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate payload
      const validatedData = registerSchema.parse(req.body);

      // Execute service
      const user = await AuthService.register(validatedData);

      // Generate token and set cookie
      const token = signToken(user);
      res.cookie('token', token, COOKIE_OPTIONS);

      return res.status(201).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log in an existing user
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate payload
      const validatedData = loginSchema.parse(req.body);

      // Execute service
      const user = await AuthService.login(validatedData);

      // Generate token and set cookie
      const token = signToken(user);
      res.cookie('token', token, COOKIE_OPTIONS);

      return res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log out the current user session
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('token', {
        ...COOKIE_OPTIONS,
        maxAge: 0
      });

      return res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch current authenticated user
   */
  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Not authenticated',
            code: 'UNAUTHENTICATED'
          }
        });
      }

      const user = await AuthService.getUserProfile(req.user.id);

      return res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }
}
