import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  id: string;
  role: UserRole;
  unidade?: string; // pode ser opcional
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      userId: string;
      userRole: UserRole;
      userUnidade: string;
    }
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

  // Verificar se o token foi fornecido
  if (!authorization) {
    return res.status(401).json({
      error: 'Token de acesso não fornecido',
      code: 'NO_TOKEN',
    });
  }

  // Extrair token (formato esperado: "Bearer <token>")
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Formato de token inválido. Use: Bearer <token>',
      code: 'INVALID_TOKEN_FORMAT',
    });
  }
  const token = parts[1].trim();

  // Verificar se JWT_SECRET existe
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET não configurado');
    return res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'SERVER_CONFIG_ERROR',
    });
  }

  try {
    // Verificar e decodificar token
    const data = jwt.verify(token, jwtSecret) as TokenPayload;

    // Validar payload do token
    if (!data.id || !data.role) {
      return res.status(401).json({
        error: 'Token com dados incompletos',
        code: 'INCOMPLETE_TOKEN',
      });
    }

    // Adicionar dados do usuário ao request
    req.userId = data.id;
    req.userRole = data.role;
    req.userUnidade = data.unidade || 'BARRA'; // 👈 fallback seguro

    return next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.warn('⚠️ Token expirado');
      return res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED',
      });
    }

    console.error('❌ Erro ao verificar token:', error.message);
    return res.status(401).json({
      error: 'Token inválido ou corrompido',
      code: 'INVALID_TOKEN',
    });
  }
};
