// src/middlewares/rateLimitMiddleware.ts
import rateLimit from 'express-rate-limit';

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Limite de requisições excedido. Tente novamente mais tarde.',
});
