import { Router } from 'express';
import PatientRelativeController from '../controllers/PatientRelativeController';
import authMiddleware from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import {
  createPatientRelativeSchema,
  updatePatientRelativeSchema,
} from '../schemas/patient-relative.schema';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// Rotas para dependentes/responsáveis
router.get('/:id/relatives', PatientRelativeController.list);
router.post(
  '/:id/relatives',
  validateZod(createPatientRelativeSchema),
  PatientRelativeController.create,
);
router.get('/:id/relatives/:relativeId', PatientRelativeController.getById);
router.put(
  '/:id/relatives/:relativeId',
  validateZod(updatePatientRelativeSchema),
  PatientRelativeController.update,
);
router.delete('/:id/relatives/:relativeId', PatientRelativeController.delete);
router.get(
  '/:id/responsaveis-legais',
  PatientRelativeController.getResponsaveisLegais,
);

export default router;
