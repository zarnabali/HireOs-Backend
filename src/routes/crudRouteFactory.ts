import { Router } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';
import { CrudController } from '../controllers/crud.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import type { BaseService } from '../services/base.service';
import { asyncHandler } from '../utils/asyncHandler';
import { paginationQuerySchema, uuidParamSchema } from '../validators/common.validators';

interface CrudRouteOptions {
  createSchema?: AnyZodObject | ZodTypeAny;
  updateSchema?: AnyZodObject | ZodTypeAny;
}

export function createCrudRouter(
  service: BaseService<Record<string, unknown>, Record<string, unknown>>,
  options: CrudRouteOptions = {}
) {
  const router = Router();
  const controller = new CrudController(service);

  router.use(authenticate, requireRole('admin'));
  router.get('/', validateRequest({ query: paginationQuerySchema }), asyncHandler(controller.list));
  router.get('/:id', validateRequest({ params: uuidParamSchema }), asyncHandler(controller.get));
  router.post('/', options.createSchema ? validateRequest({ body: options.createSchema }) : [], asyncHandler(controller.create));
  router.patch(
    '/:id',
    validateRequest({ params: uuidParamSchema, ...(options.updateSchema ? { body: options.updateSchema } : {}) }),
    asyncHandler(controller.update)
  );
  router.delete('/:id', validateRequest({ params: uuidParamSchema }), asyncHandler(controller.delete));

  return router;
}
