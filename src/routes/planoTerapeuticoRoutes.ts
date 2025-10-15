import { Router } from 'express';
import {
  getPlanosPorConsulta,
  criarPlano,
  atualizarPlano,
  deletarPlano,
} from '../controllers/planoTerapeuticoController';

const router = Router();

router.get('/', getPlanosPorConsulta);
router.post('/', criarPlano);
router.put('/:id', atualizarPlano);
router.delete('/:id', deletarPlano);

export default router;
