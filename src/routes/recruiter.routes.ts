import { Router } from 'express';
import { RecruiterController } from '../controllers/recruiter.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  applicationIdParamSchema,
  applicationUpdateSchema,
  companyIdParamSchema,
  companyUpdateSchema,
  jobCreateSchema,
  jobIdParamSchema,
  jobUpdateSchema,
  recruiterJobQuerySchema,
  recruiterProfileUpdateSchema
} from '../validators/marketplace.validators';

export const recruiterRouter = Router();

recruiterRouter.use(authenticate, requireRole('recruiter', 'admin'));

recruiterRouter.get('/profile', asyncHandler(RecruiterController.getProfile));
recruiterRouter.patch('/profile', validateRequest({ body: recruiterProfileUpdateSchema }), asyncHandler(RecruiterController.updateProfile));
recruiterRouter.get('/companies', asyncHandler(RecruiterController.listCompanies));
recruiterRouter.patch('/companies/:companyId', validateRequest({ params: companyIdParamSchema, body: companyUpdateSchema }), asyncHandler(RecruiterController.updateCompany));
recruiterRouter.get('/jobs', validateRequest({ query: recruiterJobQuerySchema }), asyncHandler(RecruiterController.listJobs));
recruiterRouter.post('/jobs', validateRequest({ body: jobCreateSchema }), asyncHandler(RecruiterController.createJob));
recruiterRouter.patch('/jobs/:jobId', validateRequest({ params: jobIdParamSchema, body: jobUpdateSchema }), asyncHandler(RecruiterController.updateJob));
recruiterRouter.post('/jobs/:jobId/publish', validateRequest({ params: jobIdParamSchema }), asyncHandler(RecruiterController.publishJob));
recruiterRouter.post('/jobs/:jobId/pause', validateRequest({ params: jobIdParamSchema }), asyncHandler(RecruiterController.pauseJob));
recruiterRouter.post('/jobs/:jobId/close', validateRequest({ params: jobIdParamSchema }), asyncHandler(RecruiterController.closeJob));
recruiterRouter.delete('/jobs/:jobId', validateRequest({ params: jobIdParamSchema }), asyncHandler(RecruiterController.deleteJob));
recruiterRouter.get('/jobs/:jobId/applicants', validateRequest({ params: jobIdParamSchema }), asyncHandler(RecruiterController.listApplicants));
recruiterRouter.patch('/applications/:applicationId', validateRequest({ params: applicationIdParamSchema, body: applicationUpdateSchema }), asyncHandler(RecruiterController.updateApplicationStatus));
