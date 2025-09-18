import { Router } from 'express';
import consultationController from '../controllers/ConsultationController';
import authMiddleware from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';

const router = Router();

// Listar consultas
router.get(
  '/',
  authMiddleware,
  checkUnidadeMiddleware,
  consultationController.list,
);

// Buscar consultas em andamento
router.get(
  '/in-progress',
  authMiddleware,
  checkUnidadeMiddleware,
  consultationController.getInProgress,
);

// Buscar consulta por ID
router.get(
  '/:id',
  authMiddleware,
  checkUnidadeMiddleware,
  consultationController.getById,
);

// Atualizar consulta
router.put(
  '/:id',
  authMiddleware,
  checkUnidadeMiddleware,
  consultationController.update,
);

// Finalizar consulta
router.patch(
  '/:id/finish',
  authMiddleware,
  checkUnidadeMiddleware,
  consultationController.finish,
);

// Cancelar consulta
router.patch(
  '/:id/cancel',
  authMiddleware,
  checkUnidadeMiddleware,
  consultationController.cancel,
);

export default router;
