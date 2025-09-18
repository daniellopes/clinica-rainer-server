import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import authMiddleware from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';

const router = Router();
const userController = new UserController();

// Aplica os middlewares globais
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// Rotas de usuário
router.get('/', (req, res, next) => userController.list(req, res, next));
router.post('/', (req, res, next) => userController.create(req, res, next));
router.get('/:id', (req, res, next) => userController.show(req, res, next));
router.put('/:id', (req, res, next) => userController.update(req, res, next));
router.delete('/:id', (req, res, next) => userController.delete(req, res, next));

export default router;
