import { Router } from 'express';
import { env } from '../config/env';
import { SystemDiagnosticsService } from '../services/system-diagnostics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';

export const systemRouter = Router();

systemRouter.get(
  '/status',
  asyncHandler(async (req, res) => {
    const deep = req.query.deep === 'true';

    if (deep) {
      const diagnosticsKey = req.header('x-diagnostics-key');
      if (env.NODE_ENV === 'production' && !env.DIAGNOSTICS_API_KEY) {
        throw new AppError(503, 'INTERNAL_ERROR', 'Deep diagnostics are disabled until DIAGNOSTICS_API_KEY is configured.');
      }
      if (env.DIAGNOSTICS_API_KEY && diagnosticsKey !== env.DIAGNOSTICS_API_KEY) {
        throw new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid diagnostics key.');
      }
    }

    const result = await SystemDiagnosticsService.getStatus({ deep });
    const httpStatus = result.status === 'fail' ? 503 : 200;

    res.status(httpStatus).json({
      success: result.status !== 'fail',
      data: result,
      error: null
    });
  })
);
