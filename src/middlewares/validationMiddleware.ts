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
          error: 'Dados inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.code
          })),
          timestamp: new Date().toISOString()
        });
      }
      return res.status(500).json({
        error: 'Erro interno de validação',
        timestamp: new Date().toISOString()
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
          error: 'Parâmetros inválidos',
          code: 'PARAMS_VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: err.code
          })),
          timestamp: new Date().toISOString()
        });
      }
      return res.status(500).json({
        error: 'Erro interno de validação',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Função validateQuery removida - usar validateQueryZod quando necessário