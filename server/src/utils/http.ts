import type { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }
  static unauthorized(message = 'برای ادامه باید وارد شوید.') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }
  static forbidden(message = 'شما به این بخش دسترسی ندارید.') {
    return new ApiError(403, message, 'FORBIDDEN');
  }
  static notFound(message = 'رکورد مورد نظر یافت نشد.') {
    return new ApiError(404, message, 'NOT_FOUND');
  }
  static conflict(message: string, details?: unknown) {
    return new ApiError(409, message, 'CONFLICT', details);
  }
  static unprocessable(message: string, details?: unknown) {
    return new ApiError(422, message, 'VALIDATION_ERROR', details);
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function paginate(
  page?: number | string,
  pageSize?: number | string,
): { page: number; pageSize: number; skip: number; take: number } {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.min(200, Math.max(1, Number(pageSize) || 20));
  return { page: p, pageSize: size, skip: (p - 1) * size, take: size };
}
