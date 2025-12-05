import { Router } from 'express';
import { ContaPagarController } from '../controllers/ContaPagarController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import { auditMiddleware } from '../middlewares/auditMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { createContaPagarSchema, updateContaPagarSchema } from '../schemas/contas-pagar.schema';

const router = Router();
const contaPagarController = new ContaPagarController();

// 🔐 todas as rotas exigem autenticação e unidade
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// 📋 rotas principais
router.get(
  '/',
  auditMiddleware('LIST', 'CONTA_PAGAR'),
  contaPagarController.list
);
router.get(
  '/:id',
  auditMiddleware('VIEW', 'CONTA_PAGAR'),
  contaPagarController.getById
);
router.post(
  '/',
  auditMiddleware('CREATE', 'CONTA_PAGAR'),
  validateZod(createContaPagarSchema),
  contaPagarController.create
);
router.put(
  '/:id',
  auditMiddleware('UPDATE', 'CONTA_PAGAR'),
  validateZod(updateContaPagarSchema),
  contaPagarController.update
);
router.delete(
  '/:id',
  auditMiddleware('DELETE', 'CONTA_PAGAR'),
  contaPagarController.remove
);
router.patch(
  '/:id/marcar-pago',
  auditMiddleware('UPDATE', 'CONTA_PAGAR'),
  contaPagarController.marcarComoPago
);

export default router;

