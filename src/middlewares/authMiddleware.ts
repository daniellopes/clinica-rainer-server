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
  console.log('🔍 [AUTH DEBUG] Iniciando verificação de autenticação');
  console.log('🔍 [AUTH DEBUG] Headers recebidos:', {
    authorization: req.headers.authorization ? 'Presente' : 'Ausente',
    'x-unidade': req.headers['x-unidade'],
    'user-agent': req.headers['user-agent'],
  });

  const { authorization } = req.headers;

  if (!authorization) {
    console.log('❌ [AUTH DEBUG] Token de acesso não fornecido');
    return res.status(401).json({
      error: 'Token de acesso não fornecido',
      code: 'NO_TOKEN',
    });
  }

  const token = authorization.replace('Bearer', '').trim();

  if (!token) {
    console.log('❌ [AUTH DEBUG] Formato de token inválido');
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
    console.log('🔍 [AUTH DEBUG] Verificando token JWT...');
    const data = jwt.verify(token, jwtSecret) as TokenPayload;
    console.log('🔍 [AUTH DEBUG] Token decodificado:', {
      id: data.id,
      role: data.role,
      unidade: data.unidade,
      iat: data.iat,
      exp: data.exp,
    });

    if (!data.id || !data.role || !data.unidade) {
      console.log('❌ [AUTH DEBUG] Token com dados incompletos');
      return res.status(401).json({
        error: 'Token com dados incompletos',
        code: 'INCOMPLETE_TOKEN',
      });
    }

    req.userId = data.id;
    req.userRole = data.role;
    req.userUnidade = data.unidade;

    console.log('✅ [AUTH DEBUG] Autenticação bem-sucedida');
    return next();
  } catch (error) {
    console.log('❌ [AUTH DEBUG] Erro ao verificar token:', error);
    return res.status(401).json({
      error: 'Token inválido ou expirado',
      code: 'INVALID_TOKEN',
    });
  }
};
