import { Router } from 'express';
import PatientController from '../controllers/PatientController';
import PatientRelativeController from '../controllers/PatientRelativeController';
import { getAnamnesesByPaciente } from '../controllers/anamneseController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import {
  validateZod,
  validateParamsZod,
} from '../middlewares/validationMiddleware';
import {
  createPatientSchema,
  updatePatientSchema,
  listPatientsSchema,
  getPatientByIdSchema,
} from '../schemas/patient.schema';
import {
  createPatientRelativeSchema,
  updatePatientRelativeSchema,
} from '../schemas/patient-relative.schema';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();
// Upload de documentos do paciente
router.post(
  '/:id/upload-document',
  upload.single('file'),
  PatientController.uploadDocument,
);
// Listagem de documentos do paciente
router.get('/:id/documents', PatientController.listDocuments);
// Download de documento do paciente
router.get(
  '/documents/:documentId/download',
  PatientController.downloadDocument,
);

// Todas as rotas requerem autenticação
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// Rotas especiais
router.get('/birthdays', PatientController.getBirthdays);

// Rotas para anamneses do paciente
router.get('/:id/anamneses', getAnamnesesByPaciente);

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

// Rotas principais
router.get('/', PatientController.list); // Query validation será feita no controller
router.post('/', validateZod(createPatientSchema), PatientController.create);
router.get(
  '/:id',
  validateParamsZod(getPatientByIdSchema),
  PatientController.getById,
);
router.put(
  '/:id',
  validateParamsZod(getPatientByIdSchema),
  PatientController.update,
); // Removido validateZod - validação será feita no controller
router.delete(
  '/:id',
  validateParamsZod(getPatientByIdSchema),
  PatientController.delete,
);

export default router;
