import { Router } from 'express';
import { ProcedureController } from '../controllers/ProcedureController';
import authenticateToken from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import { auditMiddleware } from '../middlewares/auditMiddleware';
import { validateZod, validateParamsZod } from '../middlewares/validationMiddleware';
import { createProcedureSchema, updateProcedureSchema, getProcedureByIdSchema } from '../schemas/procedure.schema';

const router = Router();
const procedureController = new ProcedureController();

// Rota pública (sem token)
router.get('/public', procedureController.list);

// Rotas privadas
router.use(authenticateToken);
router.use(checkUnidadeMiddleware);

router.get('/categories', auditMiddleware('VIEW', 'PROCEDURE_CATEGORIES'), procedureController.getCategories);
router.get('/popular', auditMiddleware('VIEW', 'PROCEDURE_POPULAR'), procedureController.getMostPopular);

router.get('/', auditMiddleware('LIST', 'PROCEDURES'), procedureController.list);
router.post('/', auditMiddleware('CREATE', 'PROCEDURE'), validateZod(createProcedureSchema), procedureController.create);
router.get('/:id', auditMiddleware('VIEW', 'PROCEDURE'), validateParamsZod(getProcedureByIdSchema), procedureController.getById);
router.put('/:id', auditMiddleware('UPDATE', 'PROCEDURE'), validateParamsZod(getProcedureByIdSchema), validateZod(updateProcedureSchema), procedureController.update);
router.delete('/:id', auditMiddleware('DELETE', 'PROCEDURE'), validateParamsZod(getProcedureByIdSchema), procedureController.delete);
router.patch('/:id/toggle-status', auditMiddleware('UPDATE', 'PROCEDURE_STATUS'), validateParamsZod(getProcedureByIdSchema), procedureController.toggleStatus);

router.get('/category/:categoria', auditMiddleware('VIEW', 'PROCEDURE_CATEGORY'), procedureController.getByCategory);

export default router;
