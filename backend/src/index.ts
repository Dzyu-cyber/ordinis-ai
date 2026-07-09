import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { db } from './config/db';
import authRoutes from './routes/authRoutes';
import leadRoutes from './routes/leadRoutes';
import communicationRoutes from './routes/communicationRoutes';
import documentRoutes from './routes/documentRoutes';
import reportingRoutes from './routes/reportingRoutes';
import automationRoutes from './routes/automationRoutes';
import { errorMiddleware } from './middleware/errorMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Standard Security & Utility Middleware
app.use(helmet());
app.use(cookieParser());
app.use(morgan('dev'));

// CORS configuration to allow credentials (cookies)
app.use(cors({
  origin: process.env.VITE_API_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/reports', reportingRoutes);
app.use('/api/automations', automationRoutes);

// Basic health check route verifying DB connection
app.get('/health', async (req: Request, res: Response) => {
  let dbHealthy = false;
  try {
    dbHealthy = await db.checkConnection();
  } catch (error) {
    console.error('[health]: Database check failed', error);
  }

  res.status(dbHealthy ? 200 : 500).json({
    success: dbHealthy,
    message: dbHealthy 
      ? 'Ordinis AI Backend and Database are healthy' 
      : 'Database connection failed',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handling Middleware (Must be last)
app.use(errorMiddleware);

// Start server
app.listen(PORT, async () => {
  console.log(`[server]: Ordinis AI Server is running at http://localhost:${PORT}`);
  
  // Test DB connection on start
  try {
    await db.checkConnection();
    console.log('[server]: Database connected successfully');
    
    // Initialize/validate schema tables
    await db.initializeSchema();
  } catch (err) {
    console.error('[server]: Database connection failed on startup. Make sure DATABASE_URL is set correctly.');
  }
});
