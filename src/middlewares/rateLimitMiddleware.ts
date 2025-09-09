import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiting simples em memória
 * Para produção, considere usar Redis
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Middleware de rate limiting
 * Limita número de requisições por IP em um período de tempo
 */
export const rateLimit = (options: {
  windowMs: number; // Janela de tempo em ms
  max: number; // Máximo de requisições
  message?: string;
}) => {
  const { windowMs, max, message = 'Muitas requisições. Tente novamente mais tarde.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Desabilitar rate limiting durante os testes
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Limpar entradas antigas
    cleanupStore(now, windowMs);

    // Verificar se existe entrada para este IP
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    // Verificar se precisa resetar contador
    if (now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    // Incrementar contador
    store[key].count++;

    // Verificar se ultrapassou limite
    if (store[key].count > max) {
      const remaining = Math.ceil((store[key].resetTime - now) / 1000);
      
      return res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: remaining,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Limpa entradas antigas do store
 */
function cleanupStore(now: number, windowMs: number) {
  // Limpar a cada 10 minutos
  if (Math.random() < 0.01) {
    Object.keys(store).forEach(key => {
      if (now > store[key].resetTime + windowMs) {
        delete store[key];
      }
    });
  }
}

/**
 * Rate limiting específico para login
 * Configuração mais permissiva para desenvolvimento
 */
export const loginRateLimit = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos (reduzido de 15)
  max: 20, // 20 tentativas por IP (aumentado de 5)
  message: 'Muitas tentativas de login. Tente novamente em 2 minutos.'
});

/**
 * Rate limiting geral para API
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // 500 requisições por IP (aumentado de 100)
  message: 'Limite de requisições excedido. Tente novamente mais tarde.'
});
