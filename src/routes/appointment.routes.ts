import { Router } from 'express';
import appointmentController from '../controllers/AppointmentController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';

const router = Router();

// Rotas de agendamentos
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
router.get(
  '/:id',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.getById.bind(appointmentController),
);
router.post(
  '/',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.create.bind(appointmentController),
);
router.put(
  '/:id',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.update.bind(appointmentController),
);
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
router.delete(
  '/:id',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.delete.bind(appointmentController),
);
router.post(
  '/:id/start-consultation',
  authMiddleware,
  checkUnidadeMiddleware,
  appointmentController.startConsultation.bind(appointmentController),
);

export default router;
