import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Função validate removida - migrada para validateZod

// Middleware para validar com Zod
export const validateZod = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result; // Atualiza req.body com dados validados
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          error: 'VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.code,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro interno de validação',
        error: 'INTERNAL_VALIDATION_ERROR',
      });
    }
  };
};

// Função validateParams removida - migrada para validateParamsZod

// Middleware para validar parâmetros com Zod
export const validateParamsZod = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      req.params = result;
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros inválidos',
          error: 'PARAMS_VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.code,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro interno de validação',
        error: 'INTERNAL_VALIDATION_ERROR',
      });
    }
  };
};

// Função validateQuery removida - usar validateQueryZod quando necessário
