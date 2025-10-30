import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createTransferenciaSchema } from "../schemas/transferencia.schema";
import { ErrorHandler } from "../utils/errorHandler";

const prisma = new PrismaClient();

export class TransferenciaController {
  async list(req: Request, res: Response) {
    try {
      const unidade = req.userUnidade;

      const transferencias = await prisma.transferencia.findMany({
        where: { unidade },
        orderBy: { dataTransferencia: "desc" },
      });

      res.json(transferencias);
    } catch (error) {
      return ErrorHandler.handleError(error, res, "TransferenciaController.list");
    }
  }

  async create(req: Request, res: Response) {
    try {
      const validated = createTransferenciaSchema.parse(req.body);
      const unidade = req.userUnidade;

      // 🔹 Validar se pacientes existem
      const pacienteOrigem = await prisma.patient.findUnique({
        where: { id: validated.pacienteOrigemId },
      });
      const pacienteDestino = await prisma.patient.findUnique({
        where: { id: validated.pacienteDestinoId },
      });

      if (!pacienteOrigem || !pacienteDestino) {
        return res.status(404).json({ error: "Paciente não encontrado" });
      }

      // 🔹 Calcular saldo atual (transações RECEITA - DESPESA)
      const calcularSaldo = async (pacienteId: string) => {
        const receitas = await prisma.transaction.aggregate({
          where: { patientId: pacienteId, tipo: "RECEITA" },
          _sum: { valor: true },
        });
        const despesas = await prisma.transaction.aggregate({
          where: { patientId: pacienteId, tipo: "DESPESA" },
          _sum: { valor: true },
        });
        return (receitas._sum.valor || 0) - (despesas._sum.valor || 0);
      };

      const saldoOrigem = await calcularSaldo(validated.pacienteOrigemId);

      if (validated.valor > saldoOrigem) {
        return res.status(400).json({
          error: `Saldo insuficiente. Saldo atual: R$ ${saldoOrigem.toFixed(2)}`,
        });
      }

      // 🔹 Gerar número sequencial
      const total = await prisma.transferencia.count();
      const numero = `TRF-${new Date().getFullYear()}-${(total + 1)
        .toString()
        .padStart(3, "0")}`;

      // 🔹 Criar registro da transferência
      const transferencia = await prisma.transferencia.create({
        data: {
          numero,
          pacienteOrigemId: validated.pacienteOrigemId,
          pacienteDestinoId: validated.pacienteDestinoId,
          pacienteOrigem: validated.pacienteOrigem,
          pacienteDestino: validated.pacienteDestino,
          valor: validated.valor,
          observacoes: validated.observacoes,
          unidade,
        },
      });

      // 🔹 Criar transações financeiras (débito e crédito)
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            patientId: validated.pacienteOrigemId,
            descricao: `Transferência para ${validated.pacienteDestino}`,
            tipo: "DESPESA",
            valor: validated.valor,
            dataVencimento: new Date(),
            dataPagamento: new Date(),
            status: "PAGO",
            criadoPorId: req.userId,
            unidade,
          },
        }),
        prisma.transaction.create({
          data: {
            patientId: validated.pacienteDestinoId,
            descricao: `Transferência recebida de ${validated.pacienteOrigem}`,
            tipo: "RECEITA",
            valor: validated.valor,
            dataVencimento: new Date(),
            dataPagamento: new Date(),
            status: "PAGO",
            criadoPorId: req.userId,
            unidade,
          },
        }),
      ]);

      res.status(201).json({
        message: "Transferência realizada com sucesso",
        transferencia,
      });
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return ErrorHandler.handleError(error, res, "TransferenciaController.create");
    }
  }
}
