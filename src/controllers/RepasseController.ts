import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createRepasseSchema } from '../schemas/repasse.schema';
import { z } from 'zod';
import { ErrorHandler } from '../utils/errorHandler';
import { Unidade } from '@prisma/client';

const prisma = new PrismaClient();

export class RepasseController {
    async create(req: Request, res: Response) {
        try {
            const validated = createRepasseSchema.parse(req.body);
            const unidade = req.userUnidade;
            const userId = req.userId;

            const total = validated.itens.reduce(
                (sum, i) => sum + (i.tipo === 'procedimento' ? i.valorProcedimento : i.valorProduto),
                0
            );

            const repasse = await prisma.repasse.create({
                data: {
                    medico: validated.medico,
                    grupo: validated.grupo,
                    datarepasse: new Date(validated.dataRepasse),
                    observacoes: validated.observacoes,
                    total,
                    unidade: unidade as Unidade,
                    createdById: userId,
                    RepasseItem: {
                        create: validated.itens.map((i) => ({
                            tipo: i.tipo,
                            itemId: i.itemId,
                            itemNome: i.itemNome,
                            valorBase: i.valorBase,
                            percentualProcedimento: i.percentualProcedimento,
                            valorProcedimento: i.valorProcedimento,
                            percentualProduto: i.percentualProduto,
                            valorProduto: i.valorProduto,
                            flagIndividual: i.flagIndividual,
                        })),
                    },
                },
                include: { RepasseItem: true },
            });


            res.status(201).json({ message: 'Repasse criado com sucesso', repasse });
        } catch (error) {
            if (error instanceof z.ZodError)
                return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return ErrorHandler.handleError(error, res, 'RepasseController.create', 'Erro ao criar repasse');
        }
    }

    async list(req: Request, res: Response) {
        try {
            const unidade = req.userUnidade;
            const repasses = await prisma.repasse.findMany({
                where: { unidade: unidade as Unidade },
                include: { RepasseItem: true },
                orderBy: { createdAt: 'desc' },
            });
            res.json({ repasses, total: repasses.length });
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'RepasseController.list', 'Erro ao listar repasses');
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const unidade = req.userUnidade;

            const repasse = await prisma.repasse.findFirst({
                where: { id, unidade: unidade as Unidade },
                include: { RepasseItem: true },
            });

            if (!repasse) return res.status(404).json({ error: 'Repasse não encontrado' });
            res.json(repasse);
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'RepasseController.getById', 'Erro ao buscar repasse');
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const unidade = req.userUnidade;
            const validated = createRepasseSchema.parse(req.body);

            const total = validated.itens.reduce((sum, i) => {
                return sum + (i.tipo === 'procedimento' ? i.valorProcedimento : i.valorProduto);
            }, 0);

            const updated = await prisma.repasse.update({
                where: { id },
                data: {
                    medico: validated.medico,
                    grupo: validated.grupo,
                    datarepasse: new Date(validated.dataRepasse),
                    observacoes: validated.observacoes,
                    total,
                    unidade: unidade as Unidade,
                    RepasseItem: {
                        deleteMany: {},
                        create: validated.itens.map((i) => ({
                            tipo: i.tipo,
                            itemId: i.itemId,
                            itemNome: i.itemNome,
                            valorBase: i.valorBase,
                            percentualProcedimento: i.percentualProcedimento,
                            valorProcedimento: i.valorProcedimento,
                            percentualProduto: i.percentualProduto,
                            valorProduto: i.valorProduto,
                            flagIndividual: i.flagIndividual,
                        })),
                    },
                },
                include: { RepasseItem: true },
            });

            res.json({ message: 'Repasse atualizado com sucesso', repasse: updated });
        } catch (error) {
            if (error instanceof z.ZodError)
                return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            return ErrorHandler.handleError(error, res, 'RepasseController.update', 'Erro ao atualizar repasse');
        }
    }

    async remove(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const unidade = req.userUnidade;

            const repasse = await prisma.repasse.findFirst({ where: { id, unidade: unidade as Unidade } });
            if (!repasse) return res.status(404).json({ error: 'Repasse não encontrado' });

            await prisma.repasse.delete({ where: { id } });
            res.json({ message: 'Repasse excluído com sucesso' });
        } catch (error) {
            return ErrorHandler.handleError(error, res, 'RepasseController.remove', 'Erro ao excluir repasse');
        }
    }
}
