import { Router } from 'express';
import { RepasseController } from '../controllers/RepasseController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import { auditMiddleware } from '../middlewares/auditMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { createRepasseSchema } from '../schemas/repasse.schema';

const router = Router();
const repasseController = new RepasseController();

// 🔐 todas as rotas exigem autenticação e unidade
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// 📋 rotas principais
router.get(
  '/',
  auditMiddleware('LIST', 'REPASSE'),
  repasseController.list
);
router.get(
  '/:id',
  auditMiddleware('VIEW', 'REPASSE'),
  repasseController.getById
);
router.post(
  '/',
  auditMiddleware('CREATE', 'REPASSE'),
  validateZod(createRepasseSchema),
  repasseController.create
);
router.put(
  '/:id',
  auditMiddleware('UPDATE', 'REPASSE'),
  validateZod(createRepasseSchema),
  repasseController.update
);
router.delete(
  '/:id',
  auditMiddleware('DELETE', 'REPASSE'),
  repasseController.remove
);

export default router;
