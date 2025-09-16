import { Router } from 'express';
import RecipeTemplateController from '../controllers/RecipeTemplateController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import {
  validateZod,
  validateParamsZod,
} from '../middlewares/validationMiddleware';
import {
  createRecipeTemplateSchema,
  updateRecipeTemplateSchema,
  getRecipeTemplateByIdSchema,
  listRecipeTemplatesSchema,
} from '../schemas/recipe-template.schema';

const router = Router();
const recipeTemplateController = new RecipeTemplateController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// Rotas para templates de receita
router.get('/', recipeTemplateController.list);
router.post('/', validateZod(createRecipeTemplateSchema), recipeTemplateController.create);
router.get(
  '/especialidades',
  recipeTemplateController.getEspecialidades,
);
router.get(
  '/:id',
  validateParamsZod(getRecipeTemplateByIdSchema),
  recipeTemplateController.getById,
);
router.put(
  '/:id',
  validateParamsZod(getRecipeTemplateByIdSchema),
  validateZod(updateRecipeTemplateSchema),
  recipeTemplateController.update,
);
router.patch(
  '/:id/toggle-status',
  validateParamsZod(getRecipeTemplateByIdSchema),
  recipeTemplateController.toggleStatus,
);
router.post(
  '/:id/duplicate',
  validateParamsZod(getRecipeTemplateByIdSchema),
  recipeTemplateController.duplicate,
);
router.delete(
  '/:id',
  validateParamsZod(getRecipeTemplateByIdSchema),
  recipeTemplateController.delete,
);

export default router;
