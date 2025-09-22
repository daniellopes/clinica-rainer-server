import { Request, Response, NextFunction } from 'express';

export const checkUnidadeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const unidadeHeader = req.headers['x-unidade'] as string;

  if (!unidadeHeader) {
    return res.status(400).json({
      error: 'Unidade não especificada no header',
      code: 'MISSING_UNIDADE_HEADER',
    });
  }

  if (!['BARRA', 'TIJUCA'].includes(unidadeHeader)) {
    return res.status(400).json({
      error: 'Unidade inválida. Use BARRA ou TIJUCA',
      code: 'INVALID_UNIDADE',
    });
  }

  if (unidadeHeader !== req.userUnidade) {
    return res.status(403).json({
      error: 'Acesso não permitido para esta unidade',
      code: 'UNIDADE_ACCESS_DENIED',
    });
  }

  return next();
};
