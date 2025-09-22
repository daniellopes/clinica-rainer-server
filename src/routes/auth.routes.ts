import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { validateZod } from '../middlewares/validationMiddleware';
import {
  loginRateLimit,
  apiRateLimit,
} from '../middlewares/rateLimitMiddleware';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const router = Router();

/**
 * Rotas de autenticação
 * Aplicam rate limiting mais rigoroso para segurança
 */

// Login com rate limiting específico
router.post(
  '/login',
  loginRateLimit,
  validateZod(loginSchema),
  AuthController.login,
);

// Registro com rate limiting geral
router.post(
  '/register',
  apiRateLimit,
  validateZod(registerSchema),
  AuthController.register,
);

export default router;
