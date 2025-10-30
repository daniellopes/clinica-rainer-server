import { Router } from 'express';
import { PrismaClient, Unidade } from '@prisma/client';
import { authMiddleware } from '../middlewares/authMiddleware';
import { checkUnidadeMiddleware } from '../middlewares/checkUnidadeMiddleware';
import { auditMiddleware } from '../middlewares/auditMiddleware';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(checkUnidadeMiddleware);

// 📋 Listar transferências
router.get('/', auditMiddleware('LIST', 'TRANSFERENCIA'), async (req, res) => {
  try {
    const unidade = req.userUnidade as Unidade;

    const transferencias = await prisma.transferencia.findMany({
      where: { unidade },
      orderBy: { dataTransferencia: 'desc' },
    });

    res.json(transferencias);
  } catch (error) {
    console.error('Erro ao listar transferências:', error);
    res.status(500).json({ error: 'Erro ao listar transferências' });
  }
});

// ➕ Criar nova transferência
router.post('/', auditMiddleware('CREATE', 'TRANSFERENCIA'), async (req, res) => {
  try {
    const { pacienteOrigemId, pacienteDestinoId, pacienteOrigem, pacienteDestino, valor, observacoes } = req.body;
    const unidade = req.userUnidade as Unidade;

    if (!pacienteOrigemId || !pacienteDestinoId) {
      return res.status(400).json({ error: 'Pacientes origem e destino são obrigatórios' });
    }

    if (pacienteOrigemId === pacienteDestinoId) {
      return res.status(400).json({ error: 'Origem e destino devem ser diferentes' });
    }

    // 🔢 Gerar número sequencial
    const count = await prisma.transferencia.count();
    const numero = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    // ✅ Criar registro
    const transferencia = await prisma.transferencia.create({
      data: {
        numero,
        pacienteOrigemId,
        pacienteDestinoId,
        pacienteOrigem,
        pacienteDestino,
        valor,
        observacoes,
        unidade,
      },
    });

    // 🔄 Registrar transações financeiras
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          patientId: pacienteOrigemId,
          descricao: `Transferência de saldo para ${pacienteDestino}`,
          tipo: 'DESPESA',
          valor: Number(valor),
          dataVencimento: new Date(),
          status: 'PAGO',
          unidade,
          criadoPorId: req.userId,
        },
      }),
      prisma.transaction.create({
        data: {
          patientId: pacienteDestinoId,
          descricao: `Crédito recebido de ${pacienteOrigem}`,
          tipo: 'RECEITA',
          valor: Number(valor),
          dataVencimento: new Date(),
          status: 'PAGO',
          unidade,
          criadoPorId: req.userId,
        },
      }),
    ]);

    res.status(201).json({ message: 'Transferência criada com sucesso', transferencia });
  } catch (error) {
    console.error('Erro ao criar transferência:', error);
    res.status(500).json({ error: 'Erro ao criar transferência' });
  }
});

// 📊 Endpoint de saldos
router.get('/saldos', auditMiddleware('LIST', 'TRANSFERENCIA'), async (req, res) => {
  try {
    const unidade = req.userUnidade as Unidade;

    const pacientes = await prisma.patient.findMany({
      where: { unidade },
      select: { id: true, nome: true },
    });

    const saldos = await Promise.all(
      pacientes.map(async (p) => {
        const receitas = await prisma.transaction.aggregate({
          where: { patientId: p.id, tipo: 'RECEITA', unidade },
          _sum: { valor: true },
        });
        const despesas = await prisma.transaction.aggregate({
          where: { patientId: p.id, tipo: 'DESPESA', unidade },
          _sum: { valor: true },
        });

        const receitaTotal = Number(receitas._sum?.valor || 0);
        const despesaTotal = Number(despesas._sum?.valor || 0);
        const saldo = receitaTotal - despesaTotal;

        return { id: p.id, nome: p.nome, saldo };
      })
    );

    res.json(saldos.filter((s) => s.saldo > 0));
  } catch (error) {
    console.error('Erro ao calcular saldos:', error);
    res.status(500).json({ error: 'Erro ao calcular saldos' });
  }
});

export default router;
