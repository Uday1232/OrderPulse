import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict with existing resource') {
    super(message, 409);
  }
}

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn('Request validation failed', {
      method: req.method,
      url: req.originalUrl,
      errors: formattedErrors,
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
    });
    return;
  }

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`Prisma error [${err.code}]:`, {
      code: err.code,
      meta: err.meta,
      message: err.message,
    });

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Record not found in database',
      });
      return;
    }

    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Unique constraint violation',
        details: err.meta,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Database operation failed',
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Operational server error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
      });
    } else {
      logger.warn(`Operational client error [${err.statusCode}]: ${err.message}`, {
        url: req.originalUrl,
      });
    }

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Handle Unknown / Internal Errors
  const genericError = err instanceof Error ? err : new Error(String(err));
  logger.error('Unhandled Exception:', {
    message: genericError.message,
    stack: genericError.stack,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(500).json({
    success: false,
    error: 'An internal server error occurred',
  });
};
