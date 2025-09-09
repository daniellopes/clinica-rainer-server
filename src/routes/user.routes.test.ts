import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import { validateZod } from '../middlewares/validationMiddleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

const router = Router();
const userController = new UserController();

// Rota de teste sem autenticação para criação
router.post('/test', validateZod(createUserSchema), userController.create);

// Aplica o middleware de autenticação e verificação de unidade nas demais rotas
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// Rotas de usuário
router.get('/', userController.list);
router.get('/:id', userController.show);
router.post('/', validateZod(createUserSchema), userController.create);
router.put('/:id', validateZod(updateUserSchema), userController.update);
router.delete('/:id', userController.delete);

export default router;
