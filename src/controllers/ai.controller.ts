import type { Request, Response } from 'express';
import { AiOrchestrationService } from '../services/ai-orchestration.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/errors';

export class AiController {
  static async extractResume(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    return sendSuccess(res, await AiOrchestrationService.extractResume(req.user.id, req.body));
  }

  static async analyzeResume(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    return sendSuccess(res, await AiOrchestrationService.analyzeResume(req.user.id, req.body));
  }

  static async matchJobs(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    return sendSuccess(res, await AiOrchestrationService.matchJobs({ ...req.body, candidateId: req.user.id }));
  }

  static async scoreCandidates(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    return sendSuccess(res, await AiOrchestrationService.scoreCandidates(req.user, req.body));
  }

  static async generateInterview(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    const payload = req.user.role === 'candidate' && !req.body.candidateId
      ? { ...req.body, candidateId: req.user.id }
      : req.body;
    return sendSuccess(res, await AiOrchestrationService.generateInterview(req.user, payload));
  }

  static async evaluateMockInterview(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    return sendSuccess(res, await AiOrchestrationService.evaluateMockInterview({ ...req.body, candidateId: req.user.id }));
  }

  static async recruiterChat(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    return sendSuccess(res, await AiOrchestrationService.recruiterChat(req.user.id, req.body));
  }

  static async candidateChat(req: Request, res: Response) {
    if (!req.user) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
    return sendSuccess(res, await AiOrchestrationService.candidateChat(req.user.id, req.body));
  }

  static async getTask(req: Request, res: Response) {
    if (!req.params.taskId) throw new AppError(400, 'VALIDATION_ERROR', 'Task id is required');
    return sendSuccess(res, await AiOrchestrationService.getTask(req.params.taskId));
  }
}
