import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createProcedureSchema,
  updateProcedureSchema,
  listProceduresSchema,
} from '../schemas/procedure.schema';
import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler';
import { ErrorHandler } from '../utils/errorHandler';

const prisma = new PrismaClient();

export class ProcedureController {
  // Criar novo procedimento
  // Criar novo procedimento
  async create(req: Request, res: Response) {
    try {
      const validatedData = createProcedureSchema.parse(req.body);
      const { userUnidade } = req;

      // Verificar se já existe procedimento com o mesmo nome na unidade
      const existingProcedure = await prisma.procedure.findFirst({
        where: {
          nome: validatedData.nome,
          unidade: userUnidade as any,
        },
      });

      if (existingProcedure) {
        return res.status(400).json({
          error: 'Já existe um procedimento com este nome nesta unidade',
        });
      }

      const procedure = await prisma.procedure.create({
        data: {
          nome: validatedData.nome,
          descricao: validatedData.descricao,
          categoria: validatedData.categoria,
          duracao: validatedData.duracao,
          valor: validatedData.preco,
          especialidades: validatedData.especialidades ?? [], 
          ativo: validatedData.ativo ?? true,
          unidade: userUnidade as any,
        },
      });

      res.status(201).json({
        message: 'Procedimento criado com sucesso',
        procedure,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors,
        });
      }

      return ErrorHandler.handleError(
        error,
        res,
        'ProcedureController.create',
        'Erro ao criar procedimento'
      );
    }
  }


  // Listar procedimentos com filtros e paginação
  async list(req: Request, res: Response) {
    try {
      const validatedQuery = listProceduresSchema.parse(req.query);
      const { userUnidade } = req;

      const {
        page = 1,
        limit = 10,
        search,
        categoria,
        ativo,
        orderBy = 'nome',
        orderDirection = 'asc',
      } = validatedQuery;

      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = {
        unidade: userUnidade as any,
      };

      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
          { categoria: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoria) {
        where.categoria = { contains: categoria, mode: 'insensitive' };
      }

      if (ativo !== undefined) {
        where.ativo = ativo;
      }

      // Contar total de registros
      const total = await prisma.procedure.count({ where });

      // Buscar procedimentos
      const procedures = await prisma.procedure.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy === 'preco' ? 'valor' : orderBy]: orderDirection },
        select: {
          id: true,
          nome: true,
          descricao: true,
          valor: true,
          duracao: true,
          categoria: true,
          ativo: true,
          createdAt: true,
          updatedAt: true,
          especialidades: true,
        },
      });

      const totalPages = Math.ceil(total / limit);

      res.json({
        procedures,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Parâmetros de consulta inválidos',
          details: error.errors,
        });
      }

      return ErrorHandler.handleError(
        error,
        res,
        'ProcedureController.list',
        'Erro ao listar procedimentos'
      );
    }
  }

  // Buscar procedimento por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      const procedure = await prisma.procedure.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!procedure) {
        return res.status(404).json({
          error: 'Procedimento não encontrado',
        });
      }

      res.json({ procedure });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProcedureController.getById',
        'Erro ao buscar procedimento'
      );
    }
  }

  // Buscar procedimentos por categoria
  async getByCategory(req: Request, res: Response) {
    try {
      const { categoria } = req.params;
      const { userUnidade } = req;

      const procedures = await prisma.procedure.findMany({
        where: {
          categoria: { contains: categoria, mode: 'insensitive' },
          unidade: userUnidade as any,
          ativo: true,
        },
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          nome: true,
          descricao: true,
          valor: true,
          duracao: true,
          categoria: true,
        },
      });

      res.json({
        procedures,
        categoria,
        total: procedures.length,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProcedureController.getByCategory',
        'Erro ao buscar procedimentos por categoria'
      );
    }
  }

  // Listar todas as categorias disponíveis
  async getCategories(req: Request, res: Response) {
    try {
      const { userUnidade } = req;

      const categories = await prisma.procedure.findMany({
        where: {
          unidade: userUnidade as any,
          ativo: true,
        },
        select: {
          categoria: true,
        },
        distinct: ['categoria'],
      });

      const categoryList = categories
        .map((item) => item.categoria)
        .filter((cat) => cat !== null)
        .sort();

      res.json({
        categories: categoryList,
        total: categoryList.length,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProcedureController.getCategories',
        'Erro ao buscar categorias'
      );
    }
  }

  // Atualizar procedimento
  // Atualizar procedimento
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateProcedureSchema
        .omit({ id: true })
        .parse(req.body);
      const { userUnidade } = req;

      // Verificar se procedimento existe
      const existingProcedure = await prisma.procedure.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!existingProcedure) {
        return res.status(404).json({
          error: 'Procedimento não encontrado',
        });
      }

      // Verificar nome duplicado (se está sendo alterado)
      if (validatedData.nome && validatedData.nome !== existingProcedure.nome) {
        const nameExists = await prisma.procedure.findFirst({
          where: {
            nome: validatedData.nome,
            unidade: userUnidade as any,
            id: { not: id },
          },
        });

        if (nameExists) {
          return res.status(400).json({
            error: 'Já existe outro procedimento com este nome',
          });
        }
      }

      // Mapear campos do schema para o banco
      const updateData: any = {};
      if (validatedData.nome) updateData.nome = validatedData.nome;
      if (validatedData.descricao !== undefined)
        updateData.descricao = validatedData.descricao;
      if (validatedData.categoria)
        updateData.categoria = validatedData.categoria;
      if (validatedData.duracao) updateData.duracao = validatedData.duracao;
      if (validatedData.preco) updateData.valor = validatedData.preco;
      if (validatedData.ativo !== undefined)
        updateData.ativo = validatedData.ativo;
      if (validatedData.especialidades !== undefined) // 👈 atualização
        updateData.especialidades = validatedData.especialidades;

      const updatedProcedure = await prisma.procedure.update({
        where: { id },
        data: updateData,
      });

      res.json({
        message: 'Procedimento atualizado com sucesso',
        procedure: updatedProcedure,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors,
        });
      }

      return ErrorHandler.handleError(
        error,
        res,
        'ProcedureController.update',
        'Erro ao atualizar procedimento'
      );
    }
  }


  // Excluir procedimento (lógica de negócio sem soft delete por limitação do schema)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      const procedure = await prisma.procedure.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!procedure) {
        return res.status(404).json({
          error: 'Procedimento não encontrado',
        });
      }

      // Verificar se existem agendamentos vinculados
      const linkedAppointments = await prisma.appointment.count({
        where: {
          procedureId: id,
        },
      });

      if (linkedAppointments > 0) {
        return res.status(400).json({
          error:
            'Não é possível excluir procedimento que possui agendamentos vinculados',
          suggestion: 'Desative o procedimento ao invés de excluí-lo',
        });
      }

      // Como não há soft delete no schema, vamos apenas desativar
      await prisma.procedure.update({
        where: { id },
        data: { ativo: false },
      });

      res.json({
        message: 'Procedimento desativado com sucesso',
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProcedureController.delete',
        'Erro ao desativar procedimento'
      );
    }
  }

  // Ativar/Desativar procedimento
  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { userUnidade } = req;

      const procedure = await prisma.procedure.findFirst({
        where: {
          id,
          unidade: userUnidade as any,
        },
      });

      if (!procedure) {
        return res.status(404).json({
          error: 'Procedimento não encontrado',
        });
      }

      const newStatus = !procedure.ativo;

      const updatedProcedure = await prisma.procedure.update({
        where: { id },
        data: { ativo: newStatus },
      });

      res.json({
        message: `Procedimento ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
        procedure: updatedProcedure,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProcedureController.toggleStatus',
        'Erro ao alterar status do procedimento'
      );
    }
  }

  // Buscar procedimentos mais populares
  async getMostPopular(req: Request, res: Response) {
    try {
      const { userUnidade } = req;
      const { limit = '10' } = req.query;

      // Buscar procedimentos com mais agendamentos
      const procedures = await prisma.procedure.findMany({
        where: {
          unidade: userUnidade as any,
          ativo: true,
        },
        include: {
          _count: {
            select: {
              agendamentos: {
                where: {
                  createdAt: {
                    gte: new Date(
                      new Date().setDate(new Date().getDate() - 30),
                    ), // últimos 30 dias
                  },
                },
              },
            },
          },
        },
        orderBy: {
          agendamentos: {
            _count: 'desc',
          },
        },
        take: parseInt(limit as string),
      });

      const formattedProcedures = procedures.map((procedure) => ({
        id: procedure.id,
        nome: procedure.nome,
        valor: procedure.valor,
        duracao: procedure.duracao,
        categoria: procedure.categoria,
        agendamentosCount: procedure._count.agendamentos,
      }));

      res.json({
        procedures: formattedProcedures,
        period: 'Últimos 30 dias',
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProcedureController.getMostPopular',
        'Erro ao buscar procedimentos populares'
      );
    }
  }
}
