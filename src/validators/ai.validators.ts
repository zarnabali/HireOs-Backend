import { z } from 'zod';
import { jsonObjectSchema, uuidSchema } from './common.validators';

export const extractResumeRequestSchema = z.object({
  resumeId: uuidSchema.optional(),
  documentId: uuidSchema.optional(),
  fileId: uuidSchema.optional(),
  candidateId: uuidSchema.optional(),
  title: z.string().max(160).optional(),
  setPrimary: z.boolean().optional(),
  options: jsonObjectSchema.default({})
}).refine((value) => value.documentId || value.fileId, {
  message: 'documentId is required',
  path: ['documentId']
});

export const analyzeResumeRequestSchema = z.object({
  resumeId: uuidSchema,
  targetRole: z.string().max(160).optional(),
  targetJobDescription: z.string().optional()
});

export const matchJobsRequestSchema = z.object({
  candidateId: uuidSchema.optional(),
  resumeId: uuidSchema,
  filters: jsonObjectSchema.default({}),
  limit: z.number().int().positive().max(100).default(100)
});

export const scoreCandidatesRequestSchema = z.object({
  jobId: uuidSchema,
  candidateIds: z.array(uuidSchema).optional()
});

export const generateInterviewRequestSchema = z.object({
  candidateId: uuidSchema.optional(),
  resumeId: uuidSchema.optional(),
  jobId: uuidSchema.optional(),
  focusAreas: z.array(z.string()).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionCount: z.number().int().positive().max(15).default(10)
});

export const evaluateMockInterviewRequestSchema = z.object({
  interviewSessionId: z.string().min(1),
  questionId: z.string().optional(),
  question: z.string().min(1),
  answer: z.string().min(1)
});

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(8000),
  context: jsonObjectSchema.default({})
});

export const taskParamSchema = z.object({
  taskId: z.string().min(1)
});
