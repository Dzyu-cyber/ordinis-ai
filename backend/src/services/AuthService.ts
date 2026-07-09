import bcrypt from 'bcryptjs';
import { db } from '../config/db';
import { RegisterInput, LoginInput } from '../validators/authValidator';
import { UserPayload } from '../types/express';

export class AuthService {
  /**
   * Register a new user business account
   */
  static async register(input: RegisterInput): Promise<UserPayload> {
    const { email, password, businessName } = input;

    // Check if email already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      const error: any = new Error('A user account with this email already exists');
      error.statusCode = 400;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user into DB
    const insertResult = await db.query(
      `INSERT INTO users (email, password_hash, business_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, business_name, role`,
      [email, passwordHash, businessName, 'admin']
    );

    const newUser = insertResult.rows[0];

    // Log the user registration activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [newUser.id, 'user_signup', JSON.stringify({ email: newUser.email, businessName: newUser.business_name })]
    );

    return {
      id: newUser.id,
      email: newUser.email,
      businessName: newUser.business_name,
      role: newUser.role,
    };
  }

  /**
   * Authenticate a user and verify credentials
   */
  static async login(input: LoginInput): Promise<UserPayload> {
    const { email, password } = input;

    // Query user
    const result = await db.query(
      'SELECT id, email, password_hash, business_name, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Log user login activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [user.id, 'user_login', JSON.stringify({ email: user.email })]
    );

    return {
      id: user.id,
      email: user.email,
      businessName: user.business_name,
      role: user.role,
    };
  }

  /**
   * Get user profile by ID
   */
  static async getUserProfile(userId: string): Promise<UserPayload> {
    const result = await db.query(
      'SELECT id, email, business_name, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      businessName: user.business_name,
      role: user.role,
    };
  }
}
