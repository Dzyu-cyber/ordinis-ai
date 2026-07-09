export interface UserPayload {
  id: string;
  email: string;
  businessName: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
