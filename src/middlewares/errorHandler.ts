import { Request, Response, NextFunction } from 'express';

/**
 * Classe para erros customizados da aplicação
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    // Manter stack trace limpo
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware central de tratamento de erros
 * Padroniza respostas de erro e garante que detalhes sensíveis não sejam expostos
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Se resposta já foi enviada, passe para o próximo middleware
  if (res.headersSent) {
    return next(error);
  }

  // Erro customizado da aplicação
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }

  // Erros específicos do Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        return res.status(409).json({
          status: 'error',
          message: 'Registro já existe',
          code: 'DUPLICATE_RECORD',
          timestamp: new Date().toISOString()
        });
      case 'P2025':
        return res.status(404).json({
          status: 'error',
          message: 'Registro não encontrado',
          code: 'RECORD_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      default:
        break;
    }
  }

  // Erros de validação JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expirado',
      code: 'EXPIRED_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  // Log detalhado do erro para debugging (apenas em desenvolvimento)
  if (process.env.NODE_ENV !== 'production') {
    console.error('🚨 Erro não tratado:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } else {
    // Em produção, log apenas informações essenciais
    console.error('🚨 Erro interno:', {
      message: error.message,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Resposta padrão para erros não tratados
  return res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
};