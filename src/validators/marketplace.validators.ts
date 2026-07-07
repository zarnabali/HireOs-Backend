import { z } from 'zod';
import { uuidSchema } from './common.validators';
import {
  applicationUpdateSchema,
  candidateProfileUpdateSchema,
  companyCreateSchema,
  companyUpdateSchema,
  jobCreateSchema,
  jobUpdateSchema,
  recruiterProfileUpdateSchema,
  resumeCreateSchema,
  resumeUpdateSchema
} from './domain.validators';

export const publicJobSearchQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(100),
  q: z.string().trim().max(160).optional(),
  location: z.string().trim().max(160).optional(),
  remoteType: z.enum(['onsite', 'hybrid', 'remote']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'internship']).optional(),
  seniority: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'principal']).optional(),
  minSalary: z.coerce.number().int().nonnegative().optional(),
  skill: z.string().trim().max(80).optional()
});

export const recruiterJobQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  companyId: uuidSchema.optional(),
  status: z.enum(['draft', 'open', 'paused', 'closed']).optional()
});

export const candidateApplicationCreateSchema = z.object({
  resumeId: uuidSchema.optional(),
  coverLetter: z.string().max(6000).optional(),
  source: z.string().max(120).default('hireos')
});

export const candidateApplicationUpdateSchema = z.object({
  resumeId: uuidSchema.optional(),
  coverLetter: z.string().max(6000).optional()
});

export const jobIdParamSchema = z.object({
  jobId: uuidSchema
});

export const applicationIdParamSchema = z.object({
  applicationId: uuidSchema
});

export const resumeIdParamSchema = z.object({
  resumeId: uuidSchema
});

export const companyIdParamSchema = z.object({
  companyId: uuidSchema
});

export {
  applicationUpdateSchema,
  candidateProfileUpdateSchema,
  companyCreateSchema,
  companyUpdateSchema,
  jobCreateSchema,
  jobUpdateSchema,
  recruiterProfileUpdateSchema,
  resumeCreateSchema,
  resumeUpdateSchema
};
