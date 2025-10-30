import { Router } from 'express';
import { PrismaClient, Unidade } from '@prisma/client';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// 📋 Listar procedimentos (somente ativos)
router.get('/procedimentos', async (req, res) => {
  try {
    const unidade = req.userUnidade as Unidade;

    // Procedure não tem relação com Patient, então não incluir 'patient'
    const procedimentos = await prisma.procedure.findMany({
      where: { unidade, ativo: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(procedimentos);
  } catch (error) {
    console.error('Erro ao listar procedimentos:', error);
    res.status(500).json({ error: 'Erro ao listar procedimentos' });
  }
});

// 💰 Registrar pagamento
router.post('/', async (req, res) => {
  try {
    const { procedureId, patientId, formasPagamento, observacoes } = req.body;
    const unidade = req.userUnidade as Unidade;

    const procedimento = await prisma.procedure.findUnique({
      where: { id: procedureId },
    });

    if (!procedimento) {
      return res.status(404).json({ error: 'Procedimento não encontrado' });
    }

    const valorProcedimento = procedimento.valor ?? 0;

    const totalPago = formasPagamento.reduce(
      (sum: number, fp: { valor: number }) => sum + Number(fp.valor || 0),
      0
    );

    const saldoRestante = valorProcedimento - totalPago;

    // ✅ Cria o pagamento
    const pagamento = await prisma.payment.create({
      data: {
        procedureId,
        patientId,
        valorTotal: totalPago,
        formasPagamento,
        metodoResumo: formasPagamento
          .map((f: any) => `${f.metodo}: ${f.valor}`)
          .join(', '),
        observacoes,
        unidade,
      },
    });

    // ⚙️ Se sobrar saldo, lança uma transação
    if (saldoRestante > 0) {
      await prisma.transaction.create({
        data: {
          patientId,
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
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    res.status(500).json({ error: 'Erro ao registrar pagamento' });
  }
});

export default router;
