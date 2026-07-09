import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z.string().trim().min(1, 'Lead name is required'),
  email: z.string().trim().email('Invalid email address format').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'lost', 'won']).optional(),
  score: z.number().int().min(0).max(100).optional(),
  qualification_details: z.record(z.any()).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
