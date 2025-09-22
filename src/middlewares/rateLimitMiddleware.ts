// src/middlewares/rateLimitMiddleware.ts
import rateLimit from 'express-rate-limit';

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Limite de requisições excedido. Tente novamente mais tarde.',
});

export const loginRateLimit = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos
  max: 10,
  message: 'Muitas tentativas de login. Tente novamente em 2 minutos.',
});