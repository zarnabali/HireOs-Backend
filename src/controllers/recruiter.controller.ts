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

export class RecruiterController {
  static async getProfile(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.getRecruiterProfile(requireUser(req)));
  }

  static async updateProfile(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.updateRecruiterProfile(requireUser(req), req.body));
  }

  static async listCompanies(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.listRecruiterCompanies(requireUser(req)));
  }

  static async updateCompany(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.updateRecruiterCompany(requireUser(req), requireParam(req, 'companyId'), req.body));
  }

  static async listJobs(req: Request, res: Response) {
    const result = await MarketplaceService.listRecruiterJobs(requireUser(req), req.query);
    return sendSuccess(res, result.rows, 200, { pagination: result.pagination, requestId: req.requestId });
  }

  static async createJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.createRecruiterJob(requireUser(req), req.body), 201);
  }

  static async updateJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.updateRecruiterJob(requireUser(req), requireParam(req, 'jobId'), req.body));
  }

  static async publishJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.setRecruiterJobStatus(requireUser(req), requireParam(req, 'jobId'), 'open'));
  }

  static async pauseJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.setRecruiterJobStatus(requireUser(req), requireParam(req, 'jobId'), 'paused'));
  }

  static async closeJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.setRecruiterJobStatus(requireUser(req), requireParam(req, 'jobId'), 'closed'));
  }

  static async deleteJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.deleteRecruiterJob(requireUser(req), requireParam(req, 'jobId')));
  }

  static async listApplicants(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.listJobApplicants(requireUser(req), requireParam(req, 'jobId')));
  }

  static async updateApplicationStatus(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.updateApplicationStatus(requireUser(req), requireParam(req, 'applicationId'), req.body));
  }
}
