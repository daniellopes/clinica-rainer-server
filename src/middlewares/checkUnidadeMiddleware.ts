import { Request, Response, NextFunction } from 'express';

export const checkUnidadeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const unidadeHeader = (req.headers['x-unidade'] as string)?.toUpperCase();
  const tokenUnidade = req.userUnidade || 'N/A';
  const role = req.userRole || 'N/A';

  console.log('🔍 [UNIDADE DEBUG]', { unidadeHeader, tokenUnidade, role, userId: req.userId });

  if (!unidadeHeader) {
    console.log('⚠️ Header não fornecido → usando tokenUnidade:', tokenUnidade);
    return next();
  }

  if (!['BARRA', 'TIJUCA'].includes(unidadeHeader)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_UNIDADE',
      message: 'Unidade inválida. Use BARRA ou TIJUCA',
      details: { provided: unidadeHeader },
    });
  }

  if (unidadeHeader !== tokenUnidade) {
    if (role === 'ADMIN') {
      console.log('⚠️ Admin acessando outra unidade', { unidadeHeader, tokenUnidade });
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'UNIDADE_ACCESS_DENIED',
      message: 'Acesso não permitido para esta unidade',
      details: { unidadeHeader, tokenUnidade, role },
    });
  }

  console.log('✅ Unidade validada com sucesso');
  return next();
};
