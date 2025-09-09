import { Router } from 'express';
import {
  getAnamnesesByPaciente,
  createAnamnese,
  updateAnamnese,
  deleteAnamnese,
  getAnamneseForms,
  saveAnamneseTemplate,
  updateAnamneseTemplate,
  duplicateAnamneseTemplate
} from '../controllers/anamneseController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

// Rotas para anamneses
router.get('/patient/:patientId', getAnamnesesByPaciente); // GET /api/anamneses/patient/:patientId
router.post('/', createAnamnese);                    // POST /api/anamneses
router.put('/:id', updateAnamnese);                 // PUT /api/anamneses/:id
router.delete('/:id', deleteAnamnese);              // DELETE /api/anamneses/:id

// Rotas para formulários
router.get('/forms', getAnamneseForms);             // GET /api/anamneses/forms
router.post('/forms', saveAnamneseTemplate);        // POST /api/anamneses/forms
router.put('/forms/:id', updateAnamneseTemplate);   // PUT /api/anamneses/forms/:id
router.post('/forms/:id/duplicate', duplicateAnamneseTemplate); // POST /api/anamneses/forms/:id/duplicate

export default router;