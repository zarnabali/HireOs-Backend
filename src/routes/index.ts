import { Router } from 'express';
import { aiRouter } from './ai.routes';
import { authRouter } from './auth.routes';
import { candidateRouter } from './candidate.routes';
import { createCrudRouter } from './crudRouteFactory';
import { jobsRouter } from './jobs.routes';
import { recruiterRouter } from './recruiter.routes';
import {
  applicationsService,
  candidateJobMatchesService,
  candidateJobScoresService,
  candidateProfilesService,
  companiesService,
  companyMembersService,
  conversationMessagesService,
  conversationsService,
  documentExtractionsService,
  documentsService,
  interviewQuestionsService,
  mockInterviewEvaluationsService,
  mockInterviewMessagesService,
  mockInterviewsService,
  notificationsService,
  recruiterProfilesService,
  resumeScoresService,
  resumeVersionsService,
  resumesService,
  savedJobsService,
  skillsService,
  usersService
} from '../services/domain.service';
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  candidateProfileUpdateSchema,
  companyCreateSchema,
  companyMemberCreateSchema,
  companyUpdateSchema,
  conversationCreateSchema,
  conversationMessageCreateSchema,
  documentCreateSchema,
  interviewQuestionCreateSchema,
  mockInterviewCreateSchema,
  notificationCreateSchema,
  partialJsonUpdateSchema,
  recruiterProfileUpdateSchema,
  resumeCreateSchema,
  resumeScoreCreateSchema,
  resumeUpdateSchema,
  savedJobCreateSchema,
  skillCreateSchema
} from '../validators/domain.validators';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'hireos-backend' }, error: null });
});

router.use('/auth', authRouter);
router.use('/ai', aiRouter);
router.use('/jobs', jobsRouter);
router.use('/candidate', candidateRouter);
router.use('/recruiter', recruiterRouter);

router.use('/users', createCrudRouter(usersService));
router.use('/companies', createCrudRouter(companiesService, { createSchema: companyCreateSchema, updateSchema: companyUpdateSchema }));
router.use('/company-members', createCrudRouter(companyMembersService, { createSchema: companyMemberCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/candidate-profiles', createCrudRouter(candidateProfilesService, { updateSchema: candidateProfileUpdateSchema }));
router.use('/recruiter-profiles', createCrudRouter(recruiterProfilesService, { updateSchema: recruiterProfileUpdateSchema }));
router.use('/applications', createCrudRouter(applicationsService, { createSchema: applicationCreateSchema, updateSchema: applicationUpdateSchema }));
import { documentsRouter } from './documents.routes';
import { systemRouter } from './system.routes';

router.use('/system', systemRouter);
router.use('/documents', documentsRouter);
router.use('/documents', createCrudRouter(documentsService, { createSchema: documentCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/document-extractions', createCrudRouter(documentExtractionsService, { updateSchema: partialJsonUpdateSchema }));
router.use('/resumes', createCrudRouter(resumesService, { createSchema: resumeCreateSchema, updateSchema: resumeUpdateSchema }));
router.use('/resume-versions', createCrudRouter(resumeVersionsService, { createSchema: resumeCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/resume-scores', createCrudRouter(resumeScoresService, { createSchema: resumeScoreCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/candidate-job-scores', createCrudRouter(candidateJobScoresService, { updateSchema: partialJsonUpdateSchema }));
router.use('/candidate-job-matches', createCrudRouter(candidateJobMatchesService, { updateSchema: partialJsonUpdateSchema }));
router.use('/interview-questions', createCrudRouter(interviewQuestionsService, { createSchema: interviewQuestionCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/mock-interviews', createCrudRouter(mockInterviewsService, { createSchema: mockInterviewCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/mock-interview-messages', createCrudRouter(mockInterviewMessagesService, { createSchema: conversationMessageCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/mock-interview-evaluations', createCrudRouter(mockInterviewEvaluationsService, { updateSchema: partialJsonUpdateSchema }));
router.use('/conversations', createCrudRouter(conversationsService, { createSchema: conversationCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/conversation-messages', createCrudRouter(conversationMessagesService, { createSchema: conversationMessageCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/saved-jobs', createCrudRouter(savedJobsService, { createSchema: savedJobCreateSchema }));
router.use('/notifications', createCrudRouter(notificationsService, { createSchema: notificationCreateSchema, updateSchema: partialJsonUpdateSchema }));
router.use('/skills', createCrudRouter(skillsService, { createSchema: skillCreateSchema, updateSchema: partialJsonUpdateSchema }));
