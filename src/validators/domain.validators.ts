import { z } from 'zod';
import { jsonObjectSchema, uuidSchema } from './common.validators';

export const companyCreateSchema = z.object({
  name: z.string().min(2).max(160),
  website: z.string().url().optional(),
  industry: z.string().max(120).optional(),
  sizeRange: z.string().max(60).optional(),
  description: z.string().max(4000).optional()
});

export const companyUpdateSchema = companyCreateSchema.partial();

export const companyMemberCreateSchema = z.object({
  companyId: uuidSchema,
  userId: uuidSchema,
  role: z.enum(['owner', 'admin', 'recruiter', 'viewer']).default('recruiter')
});

export const jobCreateSchema = z.object({
  companyId: uuidSchema,
  title: z.string().min(2).max(180),
  description: z.string().min(10),
  department: z.string().max(120).optional(),
  location: z.string().max(160).optional(),
  remoteType: z.enum(['onsite', 'hybrid', 'remote']).default('onsite'),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship']).default('full_time'),
  seniority: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'principal']).optional(),
  minSalary: z.number().int().nonnegative().optional(),
  maxSalary: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).default('USD'),
  requiredSkills: z.array(z.string().min(1)).default([]),
  niceToHaveSkills: z.array(z.string().min(1)).default([]),
  status: z.enum(['draft', 'open', 'paused', 'closed']).default('draft')
});

export const jobUpdateSchema = jobCreateSchema.partial().omit({ companyId: true });

export const candidateProfileUpdateSchema = z.object({
  headline: z.string().max(180).optional(),
  summary: z.string().max(4000).optional(),
  location: z.string().max(160).optional(),
  openToRemote: z.boolean().optional(),
  desiredRole: z.string().max(160).optional(),
  desiredSalaryMin: z.number().int().nonnegative().optional(),
  desiredSalaryMax: z.number().int().nonnegative().optional(),
  portfolioUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional()
});

export const recruiterProfileUpdateSchema = z.object({
  title: z.string().max(160).optional(),
  phone: z.string().max(60).optional(),
  timezone: z.string().max(80).optional()
});

export const applicationCreateSchema = z.object({
  jobId: uuidSchema,
  candidateId: uuidSchema.optional(),
  resumeId: uuidSchema.optional(),
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']).default('applied'),
  source: z.string().max(120).optional()
});

export const applicationUpdateSchema = z.object({
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']).optional(),
  recruiterNotes: z.string().max(5000).optional(),
  coverLetter: z.string().max(6000).optional(),
  resumeId: uuidSchema.optional()
});

export const documentCreateSchema = z.object({
  ownerUserId: uuidSchema.optional(),
  companyId: uuidSchema.optional(),
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().nonnegative(),
  documentType: z.enum(['resume', 'cover_letter', 'offer_letter', 'other']).default('resume')
});

export const resumeCreateSchema = z.object({
  candidateId: uuidSchema,
  documentId: uuidSchema.optional(),
  title: z.string().min(1).max(160),
  structuredData: jsonObjectSchema.default({}),
  rawText: z.string().optional(),
  isPrimary: z.boolean().default(false)
});

export const resumeUpdateSchema = resumeCreateSchema.partial().omit({ candidateId: true });

export const resumeScoreCreateSchema = z.object({
  resumeId: uuidSchema,
  targetRole: z.string().max(160).optional(),
  score: z.number().min(0).max(100),
  breakdown: jsonObjectSchema,
  suggestions: z.array(jsonObjectSchema).default([]),
  warnings: z.array(z.string()).default([])
});

export const savedJobCreateSchema = z.object({
  jobId: uuidSchema,
  candidateId: uuidSchema.optional()
});

export const interviewQuestionCreateSchema = z.object({
  jobId: uuidSchema.optional(),
  candidateId: uuidSchema.optional(),
  resumeId: uuidSchema.optional(),
  question: z.string().min(2),
  questionType: z.enum(['technical', 'behavioral', 'system_design', 'coding', 'company']).default('technical'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  rubric: jsonObjectSchema.default({}),
  expectedSignals: z.array(z.string()).default([])
});

export const mockInterviewCreateSchema = z.object({
  candidateId: uuidSchema,
  jobId: uuidSchema.optional(),
  resumeId: uuidSchema.optional(),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).default('active')
});

export const conversationCreateSchema = z.object({
  ownerUserId: uuidSchema.optional(),
  companyId: uuidSchema.optional(),
  conversationType: z.enum(['candidate_career', 'recruiter_hiring']),
  title: z.string().max(180).optional()
});

export const conversationMessageCreateSchema = z.object({
  conversationId: uuidSchema,
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().min(1),
  metadata: jsonObjectSchema.default({})
});

export const notificationCreateSchema = z.object({
  userId: uuidSchema,
  type: z.string().min(1).max(100),
  title: z.string().min(1).max(180),
  body: z.string().min(1).max(2000),
  metadata: jsonObjectSchema.default({})
});

export const skillCreateSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().max(120).optional(),
  aliases: z.array(z.string()).default([])
});

export const partialJsonUpdateSchema = jsonObjectSchema;
