import type { Request, Response } from 'express';
import type { BaseService } from '../services/base.service';
import { sendSuccess } from '../utils/apiResponse';
import { AppError } from '../utils/errors';

export class CrudController {
  constructor(private readonly service: BaseService<Record<string, unknown>, Record<string, unknown>>) {}

  list = async (req: Request, res: Response) => {
    const result = await this.service.list({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      filters: this.extractFilters(req)
    });

    return sendSuccess(res, result.rows, 200, { pagination: result.pagination, requestId: req.requestId });
  };

  get = async (req: Request, res: Response) => {
    const row = await this.service.getById(this.requireId(req));
    return sendSuccess(res, row, 200, { requestId: req.requestId });
  };

  create = async (req: Request, res: Response) => {
    const row = await this.service.create(req.body);
    return sendSuccess(res, row, 201, { requestId: req.requestId });
  };

  update = async (req: Request, res: Response) => {
    const row = await this.service.update(this.requireId(req), req.body);
    return sendSuccess(res, row, 200, { requestId: req.requestId });
  };

  delete = async (req: Request, res: Response) => {
    const row = await this.service.delete(this.requireId(req));
    return sendSuccess(res, row, 200, { requestId: req.requestId });
  };

  private extractFilters(req: Request) {
    const filters: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (['page', 'limit', 'search'].includes(key)) continue;
      if (typeof value === 'string' && value.length > 0) filters[key] = value;
    }
    return filters;
  }

  private requireId(req: Request) {
    const id = req.params.id;
    if (!id) throw new AppError(400, 'VALIDATION_ERROR', 'Resource id is required');
    return id;
  }
}
