import type { Request, Response } from 'express';
import { MarketplaceService } from '../services/marketplace.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/errors';

function requireUser(req: Request) {
  if (!req.user) throw new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required');
  return req.user;
}

function requireParam(req: Request, name: string) {
  const value = req.params[name];
  if (!value) throw new AppError(400, 'VALIDATION_ERROR', `${name} is required`);
  return value;
}

export class CandidateController {
  static async getProfile(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.getCandidateProfile(requireUser(req)));
  }

  static async updateProfile(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.updateCandidateProfile(requireUser(req), req.body));
  }

  static async listApplications(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.listCandidateApplications(requireUser(req)));
  }

  static async listResumes(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.listCandidateResumes(requireUser(req)));
  }

  static async createResume(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.createCandidateResume(requireUser(req), req.body), 201);
  }

  static async getResume(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.getCandidateResume(requireUser(req), requireParam(req, 'resumeId')));
  }

  static async updateResume(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.updateCandidateResume(requireUser(req), requireParam(req, 'resumeId'), req.body));
  }

  static async deleteResume(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.deleteCandidateResume(requireUser(req), requireParam(req, 'resumeId')));
  }

  static async setPrimaryResume(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.setPrimaryResume(requireUser(req), requireParam(req, 'resumeId')));
  }

  static async updateApplication(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.updateCandidateApplication(requireUser(req), requireParam(req, 'applicationId'), req.body));
  }

  static async withdrawApplication(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.withdrawCandidateApplication(requireUser(req), requireParam(req, 'applicationId')));
  }

  static async listSavedJobs(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.listSavedJobs(requireUser(req)));
  }

  static async unsaveJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.unsaveJob(requireUser(req), requireParam(req, 'jobId')));
  }
}
