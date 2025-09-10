import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  id: string;
  role: UserRole;
  unidade: string;
  iat: number;
  exp: number;
}

// 🔑 Forma correta de estender o tipo do Express.Request
declare module 'express-serve-static-core' {
  interface Request {
    userId: string;
    userRole: UserRole;
    userUnidade: string;
  }
}

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e extrai informações do usuário
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({
      error: 'Token de acesso não fornecido',
      code: 'NO_TOKEN',
    });
  }

  const token = authorization.replace('Bearer', '').trim();

  if (!token) {
    return res.status(401).json({
      error: 'Formato de token inválido',
      code: 'INVALID_TOKEN_FORMAT',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET não configurado');
    return res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'SERVER_CONFIG_ERROR',
    });
  }

  try {
    const data = jwt.verify(token, jwtSecret) as TokenPayload;

    if (!data.id || !data.role || !data.unidade) {
      return res.status(401).json({
        error: 'Token com dados incompletos',
        code: 'INCOMPLETE_TOKEN',
      });
    }

    req.userId = data.id;
    req.userRole = data.role;
    req.userUnidade = data.unidade;

    return next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido ou expirado',
      code: 'INVALID_TOKEN',
    });
  }
};
