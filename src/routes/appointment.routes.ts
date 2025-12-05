import { Router } from 'express';
import appointmentController from '../controllers/AppointmentController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';

const router = Router();

// Rotas de agendamentos
// IMPORTANTE: Rotas específicas devem vir ANTES das rotas genéricas com :id
router.get(
  '/',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.list.bind(appointmentController),
);
router.get(
  '/today',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.getToday.bind(appointmentController),
);
router.post(
  '/',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.create.bind(appointmentController),
);
// Rotas específicas (devem vir antes de /:id)
router.patch(
  '/:id/confirm',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.confirm.bind(appointmentController),
);
router.patch(
  '/:id/cancel',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.cancel.bind(appointmentController),
);
router.post(
  '/:id/start-consultation',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.startConsultation.bind(appointmentController),
);
// Rotas genéricas (devem vir depois das rotas específicas)
router.get(
  '/:id',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.getById.bind(appointmentController),
);
router.put(
  '/:id',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.update.bind(appointmentController),
);
router.delete(
  '/:id',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.delete.bind(appointmentController),
);

export default router;
