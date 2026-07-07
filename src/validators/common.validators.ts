import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid()
});

export const companyParamSchema = z.object({
  companyId: z.string().uuid()
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.string().trim().optional()
});

export const jsonObjectSchema = z.record(z.unknown());
export const uuidSchema = z.string().uuid();
