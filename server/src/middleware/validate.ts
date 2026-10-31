import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/http';

export type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return next(ApiError.unprocessable('اطلاعات وارد شده معتبر نیست.', fieldErrors));
    }
    if (source === 'query') {
      Object.defineProperty(req, 'validatedQuery', {
        value: result.data,
        configurable: true,
        writable: true,
      });
    } else {
      req[source] = result.data as never;
    }
    return next();
  };
}

export function getQuery<T>(req: Request): T {
  const validated = (req as unknown as { validatedQuery?: T }).validatedQuery;
  return (validated ?? req.query) as T;
}
