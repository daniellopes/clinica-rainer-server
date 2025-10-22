import { Router } from 'express';
import { OrcamentoController } from '../controllers/OrcamentoController';

const router = Router();
const controller = new OrcamentoController();

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.patch('/:id/status', controller.updateStatus);
router.delete('/:id', controller.remove);

export default router;
