import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ErrorHandler } from '../utils/errorHandler';

const prisma = new PrismaClient();

class RecipeTemplateController {
  // Criar novo template de receita
  async create(req: Request, res: Response) {
    try {
      const { nome, descricao, conteudo, observacoes, especialidade } =
        req.body;
      const unidade = (req as any).userUnidade!;

      // Verificar se já existe template com o mesmo nome na unidade
      const existingTemplate = await prisma.recipeTemplate.findFirst({
        where: {
          nome,
          unidade: unidade as any,
        },
      });

      if (existingTemplate) {
        return res.status(400).json({
          error: 'Já existe um template com este nome nesta unidade',
        });
      }

      const template = await prisma.recipeTemplate.create({
        data: {
          nome,
          descricao: descricao || null,
          conteudo,
          observacoes: observacoes || null,
          especialidade: especialidade || null,
          unidade: unidade as any,
          criadoPorId: (req as any).userId,
        },
      });

      res.status(201).json({
        message: 'Template de receita criado com sucesso',
        template,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeTemplateController.create',
        'Erro ao criar template de receita',
      );
    }
  }

  // Listar templates com filtros e paginação
  async list(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        especialidade,
        ativo,
        orderBy = 'nome',
        orderDirection = 'asc',
      } = req.query;
      const unidade = (req as any).userUnidade!;

      const skip = (Number(page) - 1) * Number(limit);

      // Construir filtros
      const where: any = {
        unidade: unidade as any,
      };

      if (search) {
        where.OR = [
          { nome: { contains: search as string, mode: 'insensitive' } },
          { descricao: { contains: search as string, mode: 'insensitive' } },
          { conteudo: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (especialidade) {
        where.especialidade = especialidade;
      }

      if (ativo !== undefined) {
        where.ativo = ativo === 'true';
      }

      // Contar total de registros
      const total = await prisma.recipeTemplate.count({ where });

      // Buscar templates
      const templates = await prisma.recipeTemplate.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [orderBy as string]: orderDirection },
        include: {
          _count: {
            select: {
              receitas: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        templates,
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
        'RecipeTemplateController.list',
        'Erro ao listar templates de receita',
      );
    }
  }

  // Buscar template por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;

      const template = await prisma.recipeTemplate.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
        include: {
          receitas: {
            select: {
              id: true,
              createdAt: true,
              consultation: {
                select: {
                  patient: {
                    select: {
                      nome: true,
                    },
                  },
                },
              },
            },
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              receitas: true,
            },
          },
        },
      });

      if (!template) {
        return res.status(404).json({
          error: 'Template não encontrado',
        });
      }

      res.json({ template });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeTemplateController.getById',
        'Erro ao buscar template',
      );
    }
  }

  // Atualizar template
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, descricao, conteudo, observacoes, especialidade } =
        req.body;
      const unidade = (req as any).userUnidade!;

      // Verificar se template existe
      const existingTemplate = await prisma.recipeTemplate.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
      });

      if (!existingTemplate) {
        return res.status(404).json({
          error: 'Template não encontrado',
        });
      }

      // Verificar nome duplicado (se está sendo alterado)
      if (nome && nome !== existingTemplate.nome) {
        const nameExists = await prisma.recipeTemplate.findFirst({
          where: {
            nome,
            unidade: unidade as any,
            id: { not: id },
          },
        });

        if (nameExists) {
          return res.status(400).json({
            error: 'Já existe outro template com este nome',
          });
        }
      }

      const updatedTemplate = await prisma.recipeTemplate.update({
        where: { id },
        data: {
          nome,
          descricao,
          conteudo,
          observacoes,
          especialidade,
        },
        include: {},
      });

      res.json({
        message: 'Template atualizado com sucesso',
        template: updatedTemplate,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeTemplateController.update',
        'Erro ao atualizar template',
      );
    }
  }

  // Ativar/Desativar template
  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;

      const template = await prisma.recipeTemplate.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
      });

      if (!template) {
        return res.status(404).json({
          error: 'Template não encontrado',
        });
      }

      const newStatus = !template.ativo;

      const updatedTemplate = await prisma.recipeTemplate.update({
        where: { id },
        data: { ativo: newStatus },
      });

      res.json({
        message: `Template ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
        template: updatedTemplate,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeTemplateController.toggleStatus',
        'Erro ao alterar status do template',
      );
    }
  }

  // Excluir template (soft delete)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;

      const template = await prisma.recipeTemplate.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
        include: {
          _count: {
            select: {
              receitas: true,
            },
          },
        },
      });

      if (!template) {
        return res.status(404).json({
          error: 'Template não encontrado',
        });
      }

      // Verificar se template está sendo usado
      if (template._count.receitas > 0) {
        return res.status(400).json({
          error:
            'Não é possível excluir template que está sendo usado em receitas',
          receitasCount: template._count.receitas,
        });
      }

      // Soft delete - desativar ao invés de excluir
      await prisma.recipeTemplate.update({
        where: { id },
        data: { ativo: false },
      });

      res.json({
        message: 'Template excluído com sucesso',
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeTemplateController.delete',
        'Erro ao excluir template',
      );
    }
  }

  // Listar especialidades disponíveis
  async getEspecialidades(req: Request, res: Response) {
    try {
      const unidade = (req as any).userUnidade!;

      const especialidades = await prisma.recipeTemplate.findMany({
        where: {
          unidade: unidade as any,
          ativo: true,
          especialidade: { not: null },
        },
        select: {
          especialidade: true,
        },
        distinct: ['especialidade'],
      });

      const especialidadeList = especialidades
        .map((item) => item.especialidade)
        .filter((esp) => esp !== null)
        .sort();

      res.json({
        especialidades: especialidadeList,
        total: especialidadeList.length,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeTemplateController.getEspecialidades',
        'Erro ao buscar especialidades',
      );
    }
  }

  // Duplicar template
  async duplicate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;
      const userId = (req as any).userId!;

      const originalTemplate = await prisma.recipeTemplate.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
      });

      if (!originalTemplate) {
        return res.status(404).json({
          error: 'Template não encontrado',
        });
      }

      const duplicatedTemplate = await prisma.recipeTemplate.create({
        data: {
          nome: `${originalTemplate.nome} (Cópia)`,
          descricao: originalTemplate.descricao,
          conteudo: originalTemplate.conteudo,
          observacoes: originalTemplate.observacoes,
          especialidade: originalTemplate.especialidade,
          unidade: unidade as any,
          criadoPorId: userId,
        },
      });

      res.status(201).json({
        message: 'Template duplicado com sucesso',
        template: duplicatedTemplate,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'RecipeTemplateController.duplicate',
        'Erro ao duplicar template',
      );
    }
  }
}

export default RecipeTemplateController;
