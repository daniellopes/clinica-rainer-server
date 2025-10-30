import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createOrcamentoSchema } from '../schemas/orcamento.schema';
import { z } from 'zod';
import { ErrorHandler } from '../utils/errorHandler';

const prisma = new PrismaClient();

export class OrcamentoController {
    async create(req: Request, res: Response) {
        try {
            const validated = createOrcamentoSchema.parse(req.body);

            const valorTotal = validated.itens.reduce(
                (sum, i) => sum + i.valorTotal,
                0
            );

            const numero = `ORC${Date.now()}`;

            const orcamento = await prisma.orcamento.create({
                data: {
                    numero,
                    profissional: validated.profissional,
                    paciente: validated.paciente,
                    observacoes: validated.observacoes,
                    valorTotal,
                    status: 'PENDENTE',
                    itens: {
                        create: validated.itens.map((item) => ({
                            tipo: item.tipo,
                            itemId: item.itemId,
                            itemNome: item.itemNome,
                            quantidade: item.quantidade,
                            valorUnitario: item.valorUnitario,
                            valorTotal: item.valorTotal
                        }))
                    }
                },
                include: { itens: true }
            });

            res.status(201).json({ message: 'Orçamento criado com sucesso', orcamento });
        } catch (error) {
            if (error instanceof z.ZodError)
                return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return ErrorHandler.handleError(error, res, 'OrcamentoController.create', 'Erro ao criar orçamento');
        }
    }

    async list(req: Request, res: Response) {
        try {
            const orcamentos = await prisma.orcamento.findMany({
                include: { itens: true },
                orderBy: { dataCriacao: 'desc' }
            });
            res.json({ orcamentos, total: orcamentos.length });
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'OrcamentoController.list', 'Erro ao listar orçamentos');
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const orcamento = await prisma.orcamento.findUnique({
                where: { id },
                include: { itens: true }
            });

            if (!orcamento) return res.status(404).json({ error: 'Orçamento não encontrado' });
            res.json(orcamento);
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'OrcamentoController.getById', 'Erro ao buscar orçamento');
        }
    }

    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const updated = await prisma.orcamento.update({
                where: { id },
                data: { status },
                include: { itens: true }
            });

            res.json({ message: 'Status atualizado com sucesso', orcamento: updated });
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'OrcamentoController.updateStatus', 'Erro ao atualizar status');
        }
    }

    async remove(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.orcamento.delete({ where: { id } });
            res.json({ message: 'Orçamento excluído com sucesso' });
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'OrcamentoController.remove', 'Erro ao excluir orçamento');
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = req.body;

            // 🔹 Normaliza o status para minúsculas
            const status = data.status ? data.status.toLowerCase() : 'pendente';

            // 🔹 Recalcula o total de forma segura
            const valorTotal = Array.isArray(data.itens)
                ? data.itens.reduce((sum: number, i: any) => sum + Number(i.valorTotal || 0), 0)
                : 0;

            // 🔹 Atualiza orçamento e substitui itens
            const atualizado = await prisma.orcamento.update({
                where: { id },
                data: {
                    profissional: data.profissional,
                    paciente: data.paciente,
                    observacoes: data.observacoes,
                    valorTotal,
                    status, // ✅ minúsculo e válido
                    itens: {
                        deleteMany: {}, // remove os antigos
                        create: data.itens?.map((item: any) => ({
                            tipo: item.tipo,
                            itemId: item.itemId,
                            itemNome: item.itemNome,
                            quantidade: item.quantidade,
                            valorUnitario: item.valorUnitario,
                            valorTotal: item.valorTotal,
                        })) || [],
                    },
                },
                include: { itens: true },
            });

            return res.json({
                message: "Orçamento atualizado e persistido com sucesso",
                orcamento: atualizado,
            });
        } catch (error) {
            return ErrorHandler.handleError(
                error,
                res,
                "OrcamentoController.update",
                "Erro ao atualizar orçamento"
            );
        }
    }


}
