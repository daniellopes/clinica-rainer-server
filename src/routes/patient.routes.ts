import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import PatientController from '../controllers/PatientController';
import PatientRelativeController from '../controllers/PatientRelativeController';
import { getAnamnesesByPaciente } from '../controllers/anamneseController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import { auditMiddleware } from '../middlewares/auditMiddleware';
import {
  validateZod,
  validateParamsZod,
} from '../middlewares/validationMiddleware';
import {
  createPatientSchema,
  getPatientByIdSchema,
} from '../schemas/patient.schema';
import {
  createPatientRelativeSchema,
  updatePatientRelativeSchema,
} from '../schemas/patient-relative.schema';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();
const prisma = new PrismaClient();

// 🧾 Upload de documentos do paciente
router.post(
  '/:id/upload-document',
  upload.single('file'),
  PatientController.uploadDocument
);

// 📎 Listagem e download de documentos
router.get('/:id/documents', PatientController.listDocuments);
router.get(
  '/documents/:documentId/download',
  PatientController.downloadDocument
);

// 🔐 Todas as rotas abaixo exigem autenticação e unidade
router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// 🎂 Aniversariantes
router.get('/birthdays', PatientController.getBirthdays);

// 🧮 🔹 ROTA DE SALDOS DOS PACIENTES
router.get(
  '/saldos',
  auditMiddleware('LIST', 'TRANSFERENCIA'),
  async (req, res) => {
    try {
      const unidade = req.userUnidade;

      // Busca todos os pacientes da unidade
      const pacientes = await prisma.patient.findMany({
        where: { unidade: unidade as any }, // Cast to 'any' or replace with the correct enum if available
      });

      // Calcula o saldo de cada paciente com base nas transações
      const saldos = await Promise.all(
        pacientes.map(async (p) => {
          const receitas = await prisma.transaction.aggregate({
            where: { patientId: p.id, tipo: 'RECEITA' },
            _sum: { valor: true },
          });
          const despesas = await prisma.transaction.aggregate({
            where: { patientId: p.id, tipo: 'DESPESA' },
            _sum: { valor: true },
          });

          const saldo = (receitas._sum.valor || 0) - (despesas._sum.valor || 0);
          return { id: p.id, nome: p.nome, saldo };
        })
      );

      // Retorna apenas pacientes com saldo positivo
      res.json(saldos.filter((s) => s.saldo > 0));
    } catch (error) {
      console.error('Erro ao calcular saldos:', error);
      res.status(500).json({ error: 'Erro ao calcular saldos dos pacientes' });
    }
  }
);

// 🧠 Rotas para anamneses do paciente
router.get('/:id/anamneses', getAnamnesesByPaciente);

// 👨‍👩‍👧‍👦 Rotas para dependentes/responsáveis
router.get('/:id/relatives', PatientRelativeController.list);
router.post(
  '/:id/relatives',
  validateZod(createPatientRelativeSchema),
  PatientRelativeController.create
);
router.get('/:id/relatives/:relativeId', PatientRelativeController.getById);
router.put(
  '/:id/relatives/:relativeId',
  validateZod(updatePatientRelativeSchema),
  PatientRelativeController.update
);
router.delete('/:id/relatives/:relativeId', PatientRelativeController.delete);
router.get(
  '/:id/responsaveis-legais',
  PatientRelativeController.getResponsaveisLegais
);

// 📋 Rotas principais
router.get('/', PatientController.list);
router.post('/', validateZod(createPatientSchema), PatientController.create);
router.get(
  '/:id',
  validateParamsZod(getPatientByIdSchema),
  PatientController.getById
);
router.put(
  '/:id',
  validateParamsZod(getPatientByIdSchema),
  PatientController.update
);
router.delete(
  '/:id',
  validateParamsZod(getPatientByIdSchema),
  PatientController.delete
);

export default router;
