import { Router } from 'express';
import { JobsController } from '../controllers/jobs.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { candidateApplicationCreateSchema, jobIdParamSchema, publicJobSearchQuerySchema } from '../validators/marketplace.validators';

export const jobsRouter = Router();

jobsRouter.get('/', validateRequest({ query: publicJobSearchQuerySchema }), asyncHandler(JobsController.listOpenJobs));
jobsRouter.get('/:jobId', validateRequest({ params: jobIdParamSchema }), asyncHandler(JobsController.getOpenJob));
jobsRouter.post('/:jobId/apply', authenticate, requireRole('candidate', 'admin'), validateRequest({ params: jobIdParamSchema, body: candidateApplicationCreateSchema }), asyncHandler(JobsController.applyToJob));
jobsRouter.post('/:jobId/save', authenticate, requireRole('candidate', 'admin'), validateRequest({ params: jobIdParamSchema }), asyncHandler(JobsController.saveJob));
