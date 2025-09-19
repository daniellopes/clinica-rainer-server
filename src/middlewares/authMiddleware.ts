import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  nome: string;
  email: string;
  role: string;
  unidade: string;
  iat?: number;
  exp?: number;
}


declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userUnidade?: string;
      userRole?: string;
      user?: JwtPayload;
    }
  }
}

export default function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET não configurado no servidor' });
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    req.userId = decoded.id;
    req.userUnidade = decoded.unidade;
    req.userRole = decoded.role;
    req.user = decoded;

    next();
  } catch (err) {
    console.error('❌ Erro ao validar token:', err);
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}
