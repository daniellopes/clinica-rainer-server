import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ErrorHandler } from '../utils/errorHandler';

const prisma = new PrismaClient();

export class RecipeController {
  // Criar nova receita
  async create(req: Request, res: Response) {
    try {
      const { consultationId, templateId, conteudo, observacoes } = req.body;
      const unidade = (req as any).userUnidade!;

      // Verificar se a consulta existe
      const consultation = await prisma.consultation.findFirst({
        where: {
          id: consultationId,
          unidade: unidade as any,
        },
      });

      if (!consultation) {
        return res.status(404).json({
          error: 'Consulta não encontrada',
        });
      }

      // Verificar se o template existe (se fornecido)
      if (templateId) {
        const template = await prisma.recipeTemplate.findFirst({
          where: {
            id: templateId,
            unidade: unidade as any,
          },
        });

        if (!template) {
          return res.status(404).json({
            error: 'Template de receita não encontrado',
          });
        }
      }

      const recipe = await prisma.recipe.create({
        data: {
          consultationId,
          templateId: templateId || null,
          conteudo,
          observacoes: observacoes || null,
          unidade: unidade as any,
        },
        include: {
          consultation: {
            select: {
              id: true,
              patient: {
                select: {
                  nome: true,
                  cpf: true,
                },
              },
            },
          },
          template: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      res.status(201).json({
        message: 'Receita criada com sucesso',
        recipe,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeController.create',
        'Erro ao criar receita',
      );
    }
  }

  // Listar todas as receitas com filtros e paginação
  async list(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, impressa } = req.query;
      const unidade = (req as any).userUnidade!;

      const skip = (Number(page) - 1) * Number(limit);

      // Construir filtros
      const where: any = {
        unidade: unidade as any,
      };

      if (search) {
        where.OR = [
          {
            conteudo: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            observacoes: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            consultation: {
              patient: {
                nome: {
                  contains: search as string,
                  mode: 'insensitive',
                },
              },
            },
          },
        ];
      }

      if (impressa !== undefined) {
        where.impressa = impressa === 'true';
      }

      // Contar total de registros
      const total = await prisma.recipe.count({ where });

      // Buscar receitas
      const recipes = await prisma.recipe.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          consultation: {
            select: {
              id: true,
              patient: {
                select: {
                  nome: true,
                  cpf: true,
                },
              },
            },
          },
          template: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        recipes,
        pagination: {
          currentPage: Number(page),
          totalPages,
          totalItems: total,
          itemsPerPage: Number(limit),
          hasNextPage: Number(page) < totalPages,
          hasPreviousPage: Number(page) > 1,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeController.list',
        'Erro ao listar receitas',
      );
    }
  }

  // Listar receitas de uma consulta
  async listByConsultation(req: Request, res: Response) {
    try {
      const { consultationId } = req.params;
      const unidade = (req as any).userUnidade!;

      const recipes = await prisma.recipe.findMany({
        where: {
          consultationId,
          unidade: unidade as any,
        },
        include: {
          template: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        recipes,
        total: recipes.length,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeController.listByConsultation',
        'Erro ao listar receitas da consulta',
      );
    }
  }

  // Buscar receita por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;

      const recipe = await prisma.recipe.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
        include: {
          consultation: {
            select: {
              id: true,
              patient: {
                select: {
                  nome: true,
                  cpf: true,
                },
              },
            },
          },
          template: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      if (!recipe) {
        return res.status(404).json({
          error: 'Receita não encontrada',
        });
      }

      res.json({ recipe });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeController.getById',
        'Erro ao buscar receita',
      );
    }
  }

  // Atualizar receita
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { conteudo, observacoes } = req.body;
      const unidade = (req as any).userUnidade!;

      // Verificar se a receita existe
      const existingRecipe = await prisma.recipe.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
      });

      if (!existingRecipe) {
        return res.status(404).json({
          error: 'Receita não encontrada',
        });
      }

      const updatedRecipe = await prisma.recipe.update({
        where: { id },
        data: {
          conteudo,
          observacoes,
        },
        include: {
          consultation: {
            select: {
              id: true,
              patient: {
                select: {
                  nome: true,
                  cpf: true,
                },
              },
            },
          },
          template: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      res.json({
        message: 'Receita atualizada com sucesso',
        recipe: updatedRecipe,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeController.update',
        'Erro ao atualizar receita',
      );
    }
  }

  // Marcar receita como impressa
  async markAsPrinted(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;

      const recipe = await prisma.recipe.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
      });

      if (!recipe) {
        return res.status(404).json({
          error: 'Receita não encontrada',
        });
      }

      const updatedRecipe = await prisma.recipe.update({
        where: { id },
        data: {
          impressa: true,
          dataImpressao: new Date(),
        },
      });

      res.json({
        message: 'Receita marcada como impressa',
        recipe: updatedRecipe,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeController.markAsPrinted',
        'Erro ao marcar receita como impressa',
      );
    }
  }

  // Excluir receita
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;

      const recipe = await prisma.recipe.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
      });

      if (!recipe) {
        return res.status(404).json({
          error: 'Receita não encontrada',
        });
      }

      await prisma.recipe.delete({
        where: { id },
      });

      res.json({
        message: 'Receita excluída com sucesso',
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeController.delete',
        'Erro ao excluir receita',
      );
    }
  }

  // Listar templates de receita
  async listTemplates(req: Request, res: Response) {
    try {
      const unidade = (req as any).userUnidade!;

      const templates = await prisma.recipeTemplate.findMany({
        where: {
          unidade: unidade as any,
          ativo: true,
        },
        orderBy: {
          nome: 'asc',
        },
      });

      res.json({
        templates,
        total: templates.length,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeController.listTemplates',
        'Erro ao listar templates de receita',
      );
    }
  }

  // Criar template de receita (DEPRECATED - usar RecipeTemplateController)
  async createTemplate(req: Request, res: Response) {
    try {
      const { nome, conteudo, especialidade } = req.body;
      const unidade = (req as any).userUnidade!;
      const userId = (req as any).userId!;

      const recipeTemplate = await prisma.recipeTemplate.create({
        data: {
          nome,
          conteudo,
          especialidade: especialidade || null,
          unidade: unidade as any,
          criadoPorId: userId,
        },
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

      res.status(201).json({
        message: 'Template de receita criado com sucesso',
        template: recipeTemplate,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeController.createTemplate',
        'Erro ao criar template de receita',
      );
    }
  }
}
