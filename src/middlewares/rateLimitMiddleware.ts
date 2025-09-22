import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

// Rate limit geral
const apiRateLimit: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500,
  message: 'Limite de requisições excedido. Tente novamente mais tarde.',
}) as unknown as RequestHandler;

// Rate limit para login
const loginRateLimit: RequestHandler = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos
  max: 10,
  message: 'Muitas tentativas de login. Tente novamente em 2 minutos.',
}) as unknown as RequestHandler;

export { apiRateLimit, loginRateLimit };
