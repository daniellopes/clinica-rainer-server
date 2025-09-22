import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    status: 'error',
    message: `Rota ${req.originalUrl} não encontrada`,
  });
};
