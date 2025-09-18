import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { validateZod } from '../middlewares/validationMiddleware';
// Rate limiting removido das rotas de autenticação
import { loginSchema } from '../schemas/auth.schema';

const router = Router();

/**
 * Rotas de autenticação
 * Rate limiting removido para desenvolvimento
 */

// Login sem rate limiting
router.post(
  '/login',
  validateZod(loginSchema),
  AuthController.login,
);

export default router;
