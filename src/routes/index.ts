import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import patientRoutes from './patient.routes';
import patientValidateRoutes from './patient-validate.routes';
import procedureRoutes from './procedure.routes';
import productRoutes from './product.routes';
import permissionRoutes from './permission.routes';
import auditRoutes from './audit.routes';
import anamneseRoutes from './anamnese.routes';
import appointmentRoutes from './appointment.routes';
import consultationRoutes from './consultation.routes';
import recipeRoutes from './recipe.routes';
import recipeTemplateRoutes from './recipe-template.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
router.use('/patient-validate', patientValidateRoutes); // Rota independente sem autenticação
router.use('/procedures', procedureRoutes);
router.use('/products', productRoutes);
router.use('/permissions', permissionRoutes);
router.use('/audit', auditRoutes);
router.use('/anamnese', anamneseRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/consultations', consultationRoutes);
router.use('/recipes', recipeRoutes);
router.use('/recipe-templates', recipeTemplateRoutes);

export default router;
