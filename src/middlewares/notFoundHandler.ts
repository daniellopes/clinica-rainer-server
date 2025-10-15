import { Request, Response } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
): void => {
  res.status(404).json({
    status: 'error',
    message: `Rota ${req.originalUrl} não encontrada`,
  });
};  