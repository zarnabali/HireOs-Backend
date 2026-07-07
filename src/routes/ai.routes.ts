import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  analyzeResumeRequestSchema,
  chatRequestSchema,
  evaluateMockInterviewRequestSchema,
  extractResumeRequestSchema,
  generateInterviewRequestSchema,
  matchJobsRequestSchema,
  scoreCandidatesRequestSchema,
  taskParamSchema
} from '../validators/ai.validators';

export const aiRouter = Router();

aiRouter.use(authenticate);

aiRouter.post('/resumes/extract', validateRequest({ body: extractResumeRequestSchema }), asyncHandler(AiController.extractResume));
aiRouter.post('/resumes/analyze', validateRequest({ body: analyzeResumeRequestSchema }), asyncHandler(AiController.analyzeResume));
aiRouter.post('/jobs/match', requireRole('candidate', 'admin'), validateRequest({ body: matchJobsRequestSchema }), asyncHandler(AiController.matchJobs));
aiRouter.post('/candidates/score', requireRole('recruiter', 'admin'), validateRequest({ body: scoreCandidatesRequestSchema }), asyncHandler(AiController.scoreCandidates));
aiRouter.post('/interviews/generate', validateRequest({ body: generateInterviewRequestSchema }), asyncHandler(AiController.generateInterview));
aiRouter.post('/interviews/mock/evaluate', validateRequest({ body: evaluateMockInterviewRequestSchema }), asyncHandler(AiController.evaluateMockInterview));
aiRouter.post('/recruiter/chat', requireRole('recruiter', 'admin'), validateRequest({ body: chatRequestSchema }), asyncHandler(AiController.recruiterChat));
aiRouter.post('/candidate/chat', requireRole('candidate', 'admin'), validateRequest({ body: chatRequestSchema }), asyncHandler(AiController.candidateChat));
aiRouter.get('/tasks/:taskId', validateRequest({ params: taskParamSchema }), asyncHandler(AiController.getTask));
