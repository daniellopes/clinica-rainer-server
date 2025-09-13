import { Request, Response, NextFunction } from 'express';

export const checkUnidadeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log('🔍 [UNIDADE DEBUG] Iniciando verificação de unidade');
  console.log('🔍 [UNIDADE DEBUG] Headers e dados do usuário:', {
    'x-unidade': req.headers['x-unidade'],
    userUnidade: req.userUnidade,
    userId: req.userId,
  });

  const unidadeHeader = req.headers['x-unidade'] as string;

  if (!unidadeHeader) {
    console.log('❌ [UNIDADE DEBUG] Unidade não especificada no header');
    return res.status(400).json({
      error: 'Unidade não especificada no header',
      code: 'MISSING_UNIDADE_HEADER',
    });
  }

  if (!['BARRA', 'TIJUCA'].includes(unidadeHeader)) {
    console.log('❌ [UNIDADE DEBUG] Unidade inválida:', unidadeHeader);
    return res.status(400).json({
      error: 'Unidade inválida. Use BARRA ou TIJUCA',
      code: 'INVALID_UNIDADE',
    });
  }

  if (unidadeHeader !== req.userUnidade) {
    console.log('❌ [UNIDADE DEBUG] Unidade do header não confere com a do token:', {
      headerUnidade: unidadeHeader,
      tokenUnidade: req.userUnidade,
    });
    return res.status(403).json({
      error: 'Acesso não permitido para esta unidade',
      code: 'UNIDADE_ACCESS_DENIED',
    });
  }

  console.log('✅ [UNIDADE DEBUG] Verificação de unidade bem-sucedida');
  return next();
};
