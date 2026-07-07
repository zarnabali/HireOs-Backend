import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodTypeAny } from 'zod';

interface ValidationSchema {
  body?: AnyZodObject | ZodTypeAny;
  query?: AnyZodObject | ZodTypeAny;
  params?: AnyZodObject | ZodTypeAny;
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query) as Request['query'];
      if (schema.params) req.params = schema.params.parse(req.params) as Request['params'];
      next();
    } catch (err) {
      console.error(`[Validation] ${req.method} ${req.path} failed:`, JSON.stringify(err));
      next(err);
    }
  };
}
