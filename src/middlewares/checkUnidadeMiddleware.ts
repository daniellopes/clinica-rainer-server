import { Request, Response, NextFunction } from 'express';

export const checkUnidadeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let unidadeHeader = req.headers['x-unidade'] as string | undefined;

  // Se não vier nada, aplica fallback
  if (!unidadeHeader || unidadeHeader.trim() === '') {
    unidadeHeader = 'BARRA';
  }

  // Valida unidades permitidas
  if (!['BARRA', 'TIJUCA'].includes(unidadeHeader)) {
    return res.status(400).json({
      error: 'Unidade inválida. Use BARRA ou TIJUCA',
      code: 'INVALID_UNIDADE',
    });
  }

  // Garante que a unidade esteja registrada na request para uso posterior
  (req as any).userUnidade = unidadeHeader;

  // Se houver validação de unidade do usuário (ex.: vinda do token)
  if (req.userUnidade && unidadeHeader !== req.userUnidade) {
    return res.status(403).json({
      error: 'Acesso não permitido para esta unidade',
      code: 'UNIDADE_ACCESS_DENIED',
    });
  }

  return next();
};
