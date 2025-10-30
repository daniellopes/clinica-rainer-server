import { Router } from 'express';
import { PrismaClient, Unidade } from '@prisma/client';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Listar procedimentos executados (não pagos)
router.get('/procedimentos', async (req, res) => {
  const unidade = req.userUnidade as Unidade; // Ensure unidade is of the correct enum type

  const procedimentos = await prisma.procedure.findMany({
    where: { unidade },
    include: { patient: true },
  });

  res.json(procedimentos);
});

// Registrar pagamento
router.post('/', async (req, res) => {
  const { procedureId, formasPagamento, observacoes } = req.body;
  const unidade = req.userUnidade;

  const procedimento = await prisma.procedure.findUnique({ where: { id: procedureId } });
  if (!procedimento) return res.status(404).json({ error: 'Procedimento não encontrado' });

  const totalPago = formasPagamento.reduce((sum, fp) => sum + Number(fp.valor), 0);
  const saldoRestante = procedimento.valor - totalPago;

  // 1️⃣ Cria o registro de pagamento
  const pagamento = await prisma.payment.create({
    data: {
      procedureId,
      patientId: procedimento.patientId,
      valorTotal: totalPago,
      formasPagamento,
      metodoResumo: formasPagamento.map((f: any) => `${f.metodo}: ${f.valor}`).join(', '),
      observacoes,
      unidade,
    },
  });

  // 2️⃣ Atualiza status do procedimento
  await prisma.procedure.update({
    where: { id: procedureId },
    data: { status: 'PAGO' },
  });

  // 3️⃣ Se sobrar saldo, lança em transactions
  if (saldoRestante > 0) {
    await prisma.transaction.create({
      data: {
        patientId: procedimento.patientId,
        descricao: `Crédito residual de pagamento parcial do procedimento ${procedimento.nome}`,
        tipo: 'RECEITA',
        valor: saldoRestante,
        dataVencimento: new Date(),
        status: 'PAGO',
        criadoPorId: req.userId,
        unidade,
      },
    });
  }

  res.json({ pagamento, saldoRestante });
});

export default router;
