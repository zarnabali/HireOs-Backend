import type { Response } from 'express';

export interface ApiMeta {
  requestId?: string | undefined;
  pagination?: {
    page: number;
    limit: number;
    total?: number;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: ApiMeta) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
    error: null
  });
}

export function sendAccepted<T>(res: Response, data: T, meta?: ApiMeta) {
  return sendSuccess(res, data, 202, meta);
}
