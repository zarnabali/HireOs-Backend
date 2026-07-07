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

export class JobsController {
  static async listOpenJobs(req: Request, res: Response) {
    const result = await MarketplaceService.listOpenJobs(req.query);
    return sendSuccess(res, result.rows, 200, { pagination: result.pagination, requestId: req.requestId });
  }

  static async getOpenJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.getOpenJob(requireParam(req, 'jobId')));
  }

  static async applyToJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.applyToJob(requireUser(req), requireParam(req, 'jobId'), req.body), 201);
  }

  static async saveJob(req: Request, res: Response) {
    return sendSuccess(res, await MarketplaceService.saveJob(requireUser(req), requireParam(req, 'jobId')), 201);
  }
}
