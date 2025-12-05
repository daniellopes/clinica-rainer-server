import { Request, Response } from 'express';
import { PrismaClient, StatusFinanceiro, Unidade } from '@prisma/client';
import { createContaPagarSchema, updateContaPagarSchema } from '../schemas/contas-pagar.schema';
import { z } from 'zod';
import { ErrorHandler } from '../utils/errorHandler';

const prisma = new PrismaClient();

export class ContaPagarController {
    async create(req: Request, res: Response) {
        try {
            const validated = createContaPagarSchema.parse(req.body);
            const unidade = req.userUnidade;
            const userId = req.userId;

            const contaPagar = await prisma.contaPagar.create({
                data: {
                    fornecedor: validated.fornecedor,
                    descricao: validated.descricao,
                    categoria: validated.categoria,
                    valor: validated.valor,
                    dataVencimento: new Date(validated.dataVencimento),
                    dataPagamento: validated.dataPagamento ? new Date(validated.dataPagamento) : null,
                    status: validated.status as StatusFinanceiro,
                    formaPagamento: validated.formaPagamento,
                    observacoes: validated.observacoes,
                    numeroNota: validated.numeroNota,
                    unidade: unidade as Unidade,
                    criadoPorId: userId,
                },
            });

            res.status(201).json({ message: 'Conta a pagar criada com sucesso', contaPagar });
        } catch (error) {
            if (error instanceof z.ZodError)
                return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return ErrorHandler.handleError(error, res, 'ContaPagarController.create', 'Erro ao criar conta a pagar');
        }
    }

    async list(req: Request, res: Response) {
        try {
            const unidade = req.userUnidade;
            const { status, dataInicio, dataFim, fornecedor } = req.query;

            const where: any = {
                unidade: unidade as Unidade,
            };

            if (status) {
                where.status = status as StatusFinanceiro;
            }

            if (fornecedor) {
                where.fornecedor = {
                    contains: fornecedor as string,
                    mode: 'insensitive',
                };
            }

            if (dataInicio || dataFim) {
                where.dataVencimento = {};
                if (dataInicio) {
                    where.dataVencimento.gte = new Date(dataInicio as string);
                }
                if (dataFim) {
                    where.dataVencimento.lte = new Date(dataFim as string);
                }
            }

            const contasPagar = await prisma.contaPagar.findMany({
                where,
                include: {
                    criadoPor: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                        },
                    },
                },
                orderBy: { dataVencimento: 'asc' },
            });

            res.json({ contasPagar, total: contasPagar.length });
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'ContaPagarController.list', 'Erro ao listar contas a pagar');
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const unidade = req.userUnidade;

            const contaPagar = await prisma.contaPagar.findFirst({
                where: { id, unidade: unidade as Unidade },
                include: {
                    criadoPor: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                        },
                    },
                },
            });

            if (!contaPagar) return res.status(404).json({ error: 'Conta a pagar não encontrada' });
            res.json(contaPagar);
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'ContaPagarController.getById', 'Erro ao buscar conta a pagar');
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const unidade = req.userUnidade;
            const validated = updateContaPagarSchema.parse(req.body);

            const contaPagar = await prisma.contaPagar.findFirst({
                where: { id, unidade: unidade as Unidade },
            });

            if (!contaPagar) return res.status(404).json({ error: 'Conta a pagar não encontrada' });

            const updateData: any = {};
            if (validated.fornecedor) updateData.fornecedor = validated.fornecedor;
            if (validated.descricao) updateData.descricao = validated.descricao;
            if (validated.categoria !== undefined) updateData.categoria = validated.categoria;
            if (validated.valor) updateData.valor = validated.valor;
            if (validated.dataVencimento) updateData.dataVencimento = new Date(validated.dataVencimento);
            if (validated.dataPagamento !== undefined) {
                updateData.dataPagamento = validated.dataPagamento ? new Date(validated.dataPagamento) : null;
            }
            if (validated.status) updateData.status = validated.status as StatusFinanceiro;
            if (validated.formaPagamento !== undefined) updateData.formaPagamento = validated.formaPagamento;
            if (validated.observacoes !== undefined) updateData.observacoes = validated.observacoes;
            if (validated.numeroNota !== undefined) updateData.numeroNota = validated.numeroNota;

            const updated = await prisma.contaPagar.update({
                where: { id },
                data: updateData,
            });

            res.json({ message: 'Conta a pagar atualizada com sucesso', contaPagar: updated });
        } catch (error) {
            if (error instanceof z.ZodError)
                return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return ErrorHandler.handleError(error, res, 'ContaPagarController.update', 'Erro ao atualizar conta a pagar');
        }
    }

    async remove(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const unidade = req.userUnidade;

            const contaPagar = await prisma.contaPagar.findFirst({
                where: { id, unidade: unidade as Unidade },
            });

            if (!contaPagar) return res.status(404).json({ error: 'Conta a pagar não encontrada' });

            await prisma.contaPagar.delete({ where: { id } });
            res.json({ message: 'Conta a pagar excluída com sucesso' });
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'ContaPagarController.remove', 'Erro ao excluir conta a pagar');
        }
    }

    async marcarComoPago(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { dataPagamento, formaPagamento } = req.body;
            const unidade = req.userUnidade;

            const contaPagar = await prisma.contaPagar.findFirst({
                where: { id, unidade: unidade as Unidade },
            });

            if (!contaPagar) return res.status(404).json({ error: 'Conta a pagar não encontrada' });

            const updated = await prisma.contaPagar.update({
                where: { id },
                data: {
                    status: 'PAGO',
                    dataPagamento: dataPagamento ? new Date(dataPagamento) : new Date(),
                    formaPagamento: formaPagamento || contaPagar.formaPagamento,
                },
            });

            res.json({ message: 'Conta a pagar marcada como paga', contaPagar: updated });
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'ContaPagarController.marcarComoPago', 'Erro ao marcar conta como paga');
        }
    }
}

