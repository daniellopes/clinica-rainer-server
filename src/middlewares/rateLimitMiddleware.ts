import rateLimit from 'express-rate-limit';

// Limite geral da API
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500,
  message: 'Limite de requisições excedido. Tente novamente mais tarde.',
});

// Limite mais rigoroso para login
export const loginRateLimit = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos
  max: 10,
  message: 'Muitas tentativas de login. Tente novamente em 2 minutos.',
});
