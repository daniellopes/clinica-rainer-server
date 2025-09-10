import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import {
  validateZod,
  validateParamsZod,
} from '../middlewares/validationMiddleware';
import {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
  adjustStockSchema,
} from '../schemas/product.schema';

const router = Router();
const productController = new ProductController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// Rotas especiais (devem vir antes das rotas com parâmetros)
router.get('/categories', productController.getCategories);
router.get('/low-stock', productController.getLowStock);

// Rotas principais
router.get('/', productController.list);
router.post('/', validateZod(createProductSchema), productController.create);
router.get(
  '/:id',
  validateParamsZod(getProductByIdSchema),
  productController.getById,
);
router.put(
  '/:id',
  validateParamsZod(getProductByIdSchema),
  validateZod(updateProductSchema),
  productController.update,
);
router.patch(
  '/:id/toggle-status',
  validateParamsZod(getProductByIdSchema),
  productController.toggleStatus,
);
router.post(
  '/:id/adjust-stock',
  validateZod(adjustStockSchema),
  productController.adjustStock,
);

// Rota por código de barras
router.get('/barcode/:codigoBarras', productController.getByBarcode);

export default router;
