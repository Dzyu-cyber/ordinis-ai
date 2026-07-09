import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[database]: DATABASE_URL environment variable is not defined. Database operations will fail.');
}

const poolConfig: PoolConfig = {
  connectionString,
  // Add SSL settings if connecting to a remote database like Supabase
  ssl: connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : undefined,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection fails
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[database]: Unexpected error on idle client', err);
});

export const db = {
  /**
   * Run a simple SQL query
   */
  query: async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      // Log queries for debugging in development mode if needed
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[database]: Executed query: ${text.substring(0, 100)}... (${duration}ms)`);
      }
      return res;
    } catch (error) {
      console.error('[database]: Query Error', { text, error });
      throw error;
    }
  },

  /**
   * Get a client from the pool for transactions
   */
  getClient: async () => {
    return await pool.connect();
  },

  /**
   * Check connection status
   */
  checkConnection: async () => {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  },

  /**
   * Run startup migrations to ensure webhook tables exist
   */
  initializeSchema: async () => {
    console.log('[database]: Running schema validation checks...');
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS webhook_subscriptions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            event_type VARCHAR(50) NOT NULL,
            url TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS webhook_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            event_type VARCHAR(50) NOT NULL,
            url TEXT NOT NULL,
            payload JSONB DEFAULT '{}'::jsonb,
            response_status INTEGER,
            response_body TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('[database]: Webhook tables validated successfully.');
    } catch (error) {
      console.error('[database]: Schema initialization failed', error);
      throw error;
    }
  }
};
