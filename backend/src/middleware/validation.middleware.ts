import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

export const validateRequest = (schema: ZodSchema) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const zodError = error as any;
      logger.warn(`Validation error: ${JSON.stringify(zodError.errors)}`);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: zodError.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};
