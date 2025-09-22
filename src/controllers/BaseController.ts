import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

/**
 * Interface para configuração de filtros de listagem
 */
export interface ListFilters {
  [key: string]: any;
}

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
  createSchema: z.ZodSchema<any>;
  /** Schema de validação para atualização */
  updateSchema: z.ZodSchema<any>;
  /** Campos únicos para verificação de duplicidade */
  uniqueFields?: string[];
  /** Campos padrão para ordenação */
  defaultSort?: SortConfig;
  /** Limite padrão de itens por página */
  defaultLimit?: number;
  /** Campos permitidos para filtro */
  filterableFields?: string[];
  /** Campos permitidos para ordenação */
  sortableFields?: string[];
}

/**
 * Controller base abstrato com operações CRUD padrão
 *
 * Fornece implementações reutilizáveis para:
 * - Criação com validação e verificação de duplicidade
 * - Listagem com filtros, paginação e ordenação
 * - Busca por ID
 * - Atualização com validação
 * - Exclusão (soft delete quando aplicável)
 *
 * @example
 * ```typescript
 * class ProductController extends BaseController<Product> {
 *   constructor() {
 *     super({
 *       entityName: 'Produto',
 *       createSchema: createProductSchema,
 *       updateSchema: updateProductSchema,
 *       uniqueFields: ['name', 'barcode'],
 *       filterableFields: ['name', 'category', 'active'],
 *       sortableFields: ['name', 'createdAt', 'price']
 *     });
 *   }
 *
 *   protected getModel() {
 *     return this.prisma.product;
 *   }
 * }
 * ```
 */
export abstract class BaseController<T> {
  protected prisma: PrismaClient;
  protected config: BaseControllerConfig<T>;

  constructor(config: BaseControllerConfig<T>) {
    this.prisma = new PrismaClient();
    this.config = {
      defaultSort: { field: 'createdAt', direction: 'desc' },
      defaultLimit: 10,
      filterableFields: [],
      sortableFields: ['createdAt', 'updatedAt'],
      ...config,
    };
  }

  /**
   * Método abstrato que deve retornar o modelo Prisma correspondente
   */
  protected abstract getModel(): any;

  /**
   * Extrai e valida parâmetros de paginação da query
   */
  protected extractPaginationParams(query: Record<string, unknown>): PaginationConfig {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit as string) || this.config.defaultLimit!),
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Extrai e valida parâmetros de ordenação da query
   */
  protected extractSortParams(query: Record<string, unknown>): SortConfig {
    const field = (query.sortBy as string) || this.config.defaultSort!.field;
    const direction = query.sortOrder === 'asc' ? 'asc' : 'desc';

    // Valida se o campo é permitido para ordenação
    if (!this.config.sortableFields!.includes(field)) {
      return this.config.defaultSort!;
    }

    return { field, direction };
  }

  /**
   * Extrai filtros válidos da query
   */
  protected extractFilters(query: Record<string, unknown>): ListFilters {
    const filters: ListFilters = {};

    this.config.filterableFields!.forEach((field) => {
      if (query[field] !== undefined && query[field] !== '') {
        // Para campos de texto, usa busca parcial (contains)
        if (typeof query[field] === 'string') {
          filters[field] = {
            contains: query[field],
            mode: 'insensitive',
          };
        } else {
          filters[field] = query[field];
        }
      }
    });

    return filters;
  }

  /**
   * Verifica duplicidade baseada nos campos únicos configurados
   */
  protected async checkDuplicates(
    data: Record<string, unknown>,
    excludeId?: string,
  ): Promise<string[]> {
    if (!this.config.uniqueFields || this.config.uniqueFields.length === 0) {
      return [];
    }

    const errors: string[] = [];
    const model = this.getModel();

    for (const field of this.config.uniqueFields) {
      if (data[field]) {
        const whereClause: Record<string, unknown> = { [field]: data[field] };

        // Exclui o próprio registro em caso de atualização
        if (excludeId) {
          whereClause.id = { not: excludeId };
        }

        const existing = await model.findFirst({ where: whereClause });

        if (existing) {
          errors.push(
            `${this.config.entityName} com ${field} '${data[field]}' já existe`,
          );
        }
      }
    }

    return errors;
  }

  /**
   * Cria um novo registro
   */
  public async create(req: Request, res: Response): Promise<Response> {
    try {
      // Validação dos dados
      const validationResult = this.config.createSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;

      // Verificação de duplicidade
      const duplicateErrors = await this.checkDuplicates(data);
      if (duplicateErrors.length > 0) {
        return res.status(409).json({
          error: 'Conflito de dados',
          details: duplicateErrors,
        });
      }

      // Criação do registro
      const model = this.getModel();
      const created = await model.create({ data });

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

  /**
   * Lista registros com filtros, paginação e ordenação
   */
  public async list(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = this.extractPaginationParams(req.query);
      const sort = this.extractSortParams(req.query);
      const filters = this.extractFilters(req.query);

      const model = this.getModel();

      // Busca os dados
      const [data, total] = await Promise.all([
        model.findMany({
          where: filters,
          orderBy: { [sort.field]: sort.direction },
          skip: pagination.skip,
          take: pagination.limit,
        }),
        model.count({ where: filters }),
      ]);

      const totalPages = Math.ceil(total / pagination.limit);

      const response: PaginatedResponse<T> = {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1,
        },
      };

      return res.json(response);
    } catch (error) {
      console.error(`Erro ao listar ${this.config.entityName}:`, error);
      return res.status(500).json({
        error: `Erro interno do servidor ao listar ${this.config.entityName}`,
      });
    }
  }

  /**
   * Busca um registro por ID
   */
  public async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID é obrigatório',
        });
      }

      const model = this.getModel();
      const record = await model.findUnique({ where: { id } });

      if (!record) {
        return res.status(404).json({
          error: `${this.config.entityName} não encontrado`,
        });
      }

      return res.json({ data: record });
    } catch (error) {
      console.error(`Erro ao buscar ${this.config.entityName}:`, error);
      return res.status(500).json({
        error: `Erro interno do servidor ao buscar ${this.config.entityName}`,
      });
    }
  }

  /**
   * Atualiza um registro
   */
  public async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID é obrigatório',
        });
      }

      // Validação dos dados
      const validationResult = this.config.updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validationResult.error.errors,
        });
      }

      const data = validationResult.data;

      // Verificação se o registro existe
      const model = this.getModel();
      const existing = await model.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({
          error: `${this.config.entityName} não encontrado`,
        });
      }

      // Verificação de duplicidade (excluindo o próprio registro)
      const duplicateErrors = await this.checkDuplicates(data, id);
      if (duplicateErrors.length > 0) {
        return res.status(409).json({
          error: 'Conflito de dados',
          details: duplicateErrors,
        });
      }

      // Atualização do registro
      const updated = await model.update({
        where: { id },
        data,
      });

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

  /**
   * Remove um registro (soft delete se o campo 'active' existir)
   */
  public async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID é obrigatório',
        });
      }

      const model = this.getModel();
      const existing = await model.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({
          error: `${this.config.entityName} não encontrado`,
        });
      }

      // Verifica se tem campo 'active' para soft delete
      if ('active' in existing) {
        await model.update({
          where: { id },
          data: { active: false },
        });

        return res.json({
          message: `${this.config.entityName} desativado com sucesso`,
        });
      } else {
        // Hard delete
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

  /**
   * Alterna o status ativo/inativo (apenas para entidades com campo 'active')
   */
  public async toggleStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'ID é obrigatório',
        });
      }

      const model = this.getModel();
      const existing = await model.findUnique({ where: { id } });

      if (!existing) {
        return res.status(404).json({
          error: `${this.config.entityName} não encontrado`,
        });
      }

      if (!('active' in existing)) {
        return res.status(400).json({
          error: `${this.config.entityName} não possui controle de status`,
        });
      }

      const updated = await model.update({
        where: { id },
        data: { active: !existing.active },
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
