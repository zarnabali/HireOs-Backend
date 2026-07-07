import { Router } from 'express';
import { CandidateController } from '../controllers/candidate.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  applicationIdParamSchema,
  candidateApplicationUpdateSchema,
  candidateProfileUpdateSchema,
  jobIdParamSchema,
  resumeCreateSchema,
  resumeIdParamSchema,
  resumeUpdateSchema
} from '../validators/marketplace.validators';

export const candidateRouter = Router();

candidateRouter.use(authenticate, requireRole('candidate', 'admin'));

candidateRouter.get('/profile', asyncHandler(CandidateController.getProfile));
candidateRouter.patch('/profile', validateRequest({ body: candidateProfileUpdateSchema }), asyncHandler(CandidateController.updateProfile));
candidateRouter.get('/resumes', asyncHandler(CandidateController.listResumes));
candidateRouter.post('/resumes', validateRequest({ body: resumeCreateSchema.omit({ candidateId: true }) }), asyncHandler(CandidateController.createResume));
candidateRouter.get('/resumes/:resumeId', validateRequest({ params: resumeIdParamSchema }), asyncHandler(CandidateController.getResume));
candidateRouter.patch('/resumes/:resumeId', validateRequest({ params: resumeIdParamSchema, body: resumeUpdateSchema }), asyncHandler(CandidateController.updateResume));
candidateRouter.delete('/resumes/:resumeId', validateRequest({ params: resumeIdParamSchema }), asyncHandler(CandidateController.deleteResume));
candidateRouter.post('/resumes/:resumeId/set-primary', validateRequest({ params: resumeIdParamSchema }), asyncHandler(CandidateController.setPrimaryResume));
candidateRouter.get('/applications', asyncHandler(CandidateController.listApplications));
candidateRouter.patch('/applications/:applicationId', validateRequest({ params: applicationIdParamSchema, body: candidateApplicationUpdateSchema }), asyncHandler(CandidateController.updateApplication));
candidateRouter.post('/applications/:applicationId/withdraw', validateRequest({ params: applicationIdParamSchema }), asyncHandler(CandidateController.withdrawApplication));
candidateRouter.get('/saved-jobs', asyncHandler(CandidateController.listSavedJobs));
candidateRouter.delete('/saved-jobs/:jobId', validateRequest({ params: jobIdParamSchema }), asyncHandler(CandidateController.unsaveJob));
