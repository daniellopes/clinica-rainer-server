import { Router } from 'express';
import { RecipeController } from '../controllers/RecipeController';
import authMiddleware from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import {
  validateZod,
  validateParamsZod,
} from '../middlewares/validationMiddleware';
import {
  createRecipeSchema,
  updateRecipeSchema,
  createRecipeTemplateSchema,
  getRecipeByIdSchema,
  getRecipesByConsultationSchema,
} from '../schemas/recipe.schema';

const router = Router();
const recipeController = new RecipeController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// Rotas para receitas
router.get('/', recipeController.list);
router.post('/', validateZod(createRecipeSchema), recipeController.create);
router.get(
  '/consultation/:consultationId',
  validateParamsZod(getRecipesByConsultationSchema),
  recipeController.listByConsultation,
);
router.get(
  '/:id',
  validateParamsZod(getRecipeByIdSchema),
  recipeController.getById,
);
router.put(
  '/:id',
  validateParamsZod(getRecipeByIdSchema),
  validateZod(updateRecipeSchema),
  recipeController.update,
);
router.patch(
  '/:id/print',
  validateParamsZod(getRecipeByIdSchema),
  recipeController.markAsPrinted,
);
router.delete(
  '/:id',
  validateParamsZod(getRecipeByIdSchema),
  recipeController.delete,
);

// Rotas para templates de receita
router.get('/templates/list', recipeController.listTemplates);
router.post(
  '/templates',
  validateZod(createRecipeTemplateSchema),
  recipeController.createTemplate,
);

export default router;
