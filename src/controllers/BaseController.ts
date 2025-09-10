import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

/**
 * Interface para configuração de filtros de listagem
 */
export type ListFilters = Record<string, unknown>;

/**
 * Interface para configuração de ordenação
 */
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Interface para configuração de paginação
 */
export interface PaginationConfig {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Interface para resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Interface para configuração do controller base
 */
export interface BaseControllerConfig<T> {
  /** Nome da entidade (usado em mensagens de erro) */
  entityName: string;
  /** Schema de validação para criação */
  createSchema: z.ZodSchema<T>;
  /** Schema de validação para atualização */
  updateSchema: z.ZodSchema<Partial<T>>;
  /** Campos únicos para verificação de duplicidade */
  uniqueFields?: (keyof T)[];
  /** Campos padrão para ordenação */
  defaultSort?: SortConfig;
  /** Limite padrão de itens por página */
  defaultLimit?: number;
  /** Campos permitidos para filtro */
  filterableFields?: (keyof T)[];
  /** Campos permitidos para ordenação */
  sortableFields?: (keyof T)[];
}

/**
 * Controller base abstrato com operações CRUD padrão
 */
export abstract class BaseController<
  T extends { id: string; active?: boolean },
> {
  protected prisma: PrismaClient;
  protected config: BaseControllerConfig<T>;

  constructor(config: BaseControllerConfig<T>) {
    this.prisma = new PrismaClient();
    this.config = {
      defaultSort: { field: 'createdAt', direction: 'desc' },
      defaultLimit: 10,
      filterableFields: [],
      sortableFields: ['createdAt', 'updatedAt'] as (keyof T)[],
      ...config,
    };
  }

  /**
   * Método abstrato que deve retornar o delegate Prisma correspondente
   */
  protected abstract getModel(): {
    findMany: (args?: any) => Promise<T[]>;
    findUnique: (args: { where: { id: string } }) => Promise<T | null>;
    findFirst: (args: { where: Record<string, unknown> }) => Promise<T | null>;
    create: (args: { data: T | Partial<T> }) => Promise<T>;
    update: (args: { where: { id: string }; data: Partial<T> }) => Promise<T>;
    delete: (args: { where: { id: string } }) => Promise<T>;
    count: (args: { where?: Record<string, unknown> }) => Promise<number>;
  };

  protected extractPaginationParams(
    query: Record<string, unknown>,
  ): PaginationConfig {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit as string) || this.config.defaultLimit!),
    );
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  protected extractSortParams(query: Record<string, unknown>): SortConfig {
    const field =
      (query.sortBy as string) || (this.config.defaultSort!.field as string);
    const direction = query.sortOrder === 'asc' ? 'asc' : 'desc';

    if (!(this.config.sortableFields! as string[]).includes(field)) {
      return this.config.defaultSort!;
    }

    return { field, direction };
  }

  protected extractFilters(query: Record<string, unknown>): ListFilters {
    const filters: ListFilters = {};
    this.config.filterableFields!.forEach((field) => {
      if (
        query[field as string] !== undefined &&
        query[field as string] !== ''
      ) {
        if (typeof query[field as string] === 'string') {
          filters[field as string] = {
            contains: query[field as string],
            mode: 'insensitive',
          };
        } else {
          filters[field as string] = query[field as string];
        }
      }
    });
    return filters;
  }

  protected async checkDuplicates(
    data: Partial<T>,
    excludeId?: string,
  ): Promise<string[]> {
    if (!this.config.uniqueFields || this.config.uniqueFields.length === 0) {
      return [];
    }

    const errors: string[] = [];
    const model = this.getModel();

    for (const field of this.config.uniqueFields) {
      if (data[field] !== undefined) {
        const whereClause: Record<string, unknown> = {
          [field as string]: data[field],
        };

        if (excludeId) {
          whereClause.id = { not: excludeId };
        }

        const existing = await model.findFirst({ where: whereClause });
        if (existing) {
          errors.push(
            `${this.config.entityName} com ${String(field)} '${data[field]}' já existe`,
          );
        }
      }
    }

    return errors;
  }

  public async create(req: Request, res: Response): Promise<Response> {
    try {
      const validationResult = this.config.createSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;
      const duplicateErrors = await this.checkDuplicates(data);
      if (duplicateErrors.length > 0) {
        return res
          .status(409)
          .json({ error: 'Conflito de dados', details: duplicateErrors });
      }

      const created = await this.getModel().create({ data });
      return res.status(201).json({
        message: `${this.config.entityName} criado com sucesso`,
        data: created,
      });
    } catch (error) {
      console.error(`Erro ao criar ${this.config.entityName}:`, error);
      return res.status(500).json({
        error: `Erro interno do servidor ao criar ${this.config.entityName}`,
      });
    }
  }

  public async list(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = this.extractPaginationParams(req.query);
      const sort = this.extractSortParams(req.query);
      const filters = this.extractFilters(req.query);
      const model = this.getModel();

      const [data, total] = await Promise.all([
        model.findMany({
          where: filters,
          orderBy: { [sort.field]: sort.direction },
          skip: pagination.skip,
          take: pagination.limit,
        }) as Promise<T[]>,
        model.count({ where: filters }),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      return res.json({
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      } as PaginatedResponse<T>);
    } catch (error) {
      console.error(`Erro ao listar ${this.config.entityName}:`, error);
      return res.status(500).json({
        error: `Erro interno do servidor ao listar ${this.config.entityName}`,
      });
    }
  }

  public async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

      const record = await this.getModel().findUnique({ where: { id } });
      if (!record)
        return res
          .status(404)
          .json({ error: `${this.config.entityName} não encontrado` });

      return res.json({ data: record });
    } catch (error) {
      console.error(`Erro ao buscar ${this.config.entityName}:`, error);
      return res.status(500).json({
        error: `Erro interno do servidor ao buscar ${this.config.entityName}`,
      });
    }
  }

  public async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

      const validationResult = this.config.updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;
      const model = this.getModel();
      const existing = await model.findUnique({ where: { id } });
      if (!existing)
        return res
          .status(404)
          .json({ error: `${this.config.entityName} não encontrado` });

      const duplicateErrors = await this.checkDuplicates(data, id);
      if (duplicateErrors.length > 0) {
        return res
          .status(409)
          .json({ error: 'Conflito de dados', details: duplicateErrors });
      }

      const updated = await model.update({ where: { id }, data });
      return res.json({
        message: `${this.config.entityName} atualizado com sucesso`,
        data: updated,
      });
    } catch (error) {
      console.error(`Erro ao atualizar ${this.config.entityName}:`, error);
      return res.status(500).json({
        error: `Erro interno do servidor ao atualizar ${this.config.entityName}`,
      });
    }
  }

  public async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

      const model = this.getModel();
      const existing = await model.findUnique({ where: { id } });
      if (!existing)
        return res
          .status(404)
          .json({ error: `${this.config.entityName} não encontrado` });

      if ('active' in existing) {
        await model.update({
          where: { id },
          data: { active: false } as Partial<T>,
        });
        return res.json({
          message: `${this.config.entityName} desativado com sucesso`,
        });
      } else {
        await model.delete({ where: { id } });
        return res.json({
          message: `${this.config.entityName} removido com sucesso`,
        });
      }
    } catch (error) {
      console.error(`Erro ao remover ${this.config.entityName}:`, error);
      return res.status(500).json({
        error: `Erro interno do servidor ao remover ${this.config.entityName}`,
      });
    }
  }

  public async toggleStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório' });

      const model = this.getModel();
      const existing = await model.findUnique({ where: { id } });
      if (!existing)
        return res
          .status(404)
          .json({ error: `${this.config.entityName} não encontrado` });

      if (!('active' in existing)) {
        return res.status(400).json({
          error: `${this.config.entityName} não possui controle de status`,
        });
      }

      const updated = await model.update({
        where: { id },
        data: { active: !existing.active } as Partial<T>,
      });
      return res.json({
        message: `${this.config.entityName} ${updated.active ? 'ativado' : 'desativado'} com sucesso`,
        data: updated,
      });
    } catch (error) {
      console.error(
        `Erro ao alterar status do ${this.config.entityName}:`,
        error,
      );
      return res.status(500).json({
        error: `Erro interno do servidor ao alterar status do ${this.config.entityName}`,
      });
    }
  }
}

export default BaseController;
