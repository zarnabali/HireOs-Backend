import { z } from 'zod';

export const userRoleSchema = z.enum(['candidate', 'recruiter', 'admin']);

export const registerSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8),
  fullName: z.string().min(2).max(120),
  role: z.enum(['candidate', 'recruiter']).default('candidate'),
  companyName: z.string().min(2).max(160).optional()
});

export const loginSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const logoutSchema = refreshSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
