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

  // Se não há header x-unidade, usar a unidade do token JWT
  if (!unidadeHeader) {
    console.log('⚠️ [UNIDADE DEBUG] Header x-unidade não fornecido, usando unidade do token:', req.userUnidade);
    // Não retornar erro, apenas usar a unidade do token
    return next();
  }

  if (!['BARRA', 'TIJUCA'].includes(unidadeHeader)) {
    console.log('❌ [UNIDADE DEBUG] Unidade inválida:', unidadeHeader);
    return res.status(400).json({
      success: false,
      message: 'Unidade inválida. Use BARRA ou TIJUCA',
      error: 'INVALID_UNIDADE',
      details: {
        provided: unidadeHeader,
        valid: ['BARRA', 'TIJUCA']
      }
    });
  }

  if (unidadeHeader !== req.userUnidade) {
    if ((req as any).user?.role === 'ADMIN') {
      console.log('⚠️ [UNIDADE DEBUG] Admin acessando outra unidade:', {
        headerUnidade: unidadeHeader,
        tokenUnidade: req.userUnidade,
      });
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Acesso não permitido para esta unidade',
      error: 'UNIDADE_ACCESS_DENIED',
      details: {
        headerUnidade: unidadeHeader,
        tokenUnidade: req.userUnidade,
      },
    });
  }


  console.log('✅ [UNIDADE DEBUG] Verificação de unidade bem-sucedida');
  return next();
};
