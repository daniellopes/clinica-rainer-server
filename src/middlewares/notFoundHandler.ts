import { Request, Response } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
): void => {
  const url = req.originalUrl;
  
  // Detectar URLs malformadas que parecem ser comandos curl
  const isMalformedUrl = url.includes('%20-H') || url.includes('Bearer%20') || 
                         url.includes('x-unidade%3A') || url.includes('/ -H');
  
  let message = `Rota ${url} não encontrada`;
  
  if (isMalformedUrl) {
    message = `Rota não encontrada. A URL parece estar malformada. Verifique se não copiou um comando curl como URL. Use apenas o path: /api/contas-pagar`;
  }
  
  res.status(404).json({
    status: 'error',
    message,
    path: req.path,
    originalUrl: req.originalUrl,
    hint: isMalformedUrl ? 'Use apenas o caminho da rota, sem incluir headers ou comandos curl' : undefined,
  });
};  