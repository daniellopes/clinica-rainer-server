import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
  adjustStockSchema,
} from '../schemas/product.schema';
import { z } from 'zod';
import { AppError } from '../middlewares/errorHandler';
import { ErrorHandler } from '../utils/errorHandler';

const prisma = new PrismaClient();

export class ProductController {
  // Criar novo produto
  async create(req: Request, res: Response) {
    try {
      const validatedData = createProductSchema.parse(req.body);
      const unidade = (req as any).userUnidade!;

      // Verificar se já existe produto com o mesmo nome na unidade
      const existingProduct = await prisma.product.findFirst({
        where: {
          nome: validatedData.nome,
          unidade: unidade as any,
        },
      });

      if (existingProduct) {
        return res.status(400).json({
          error: 'Já existe um produto com este nome nesta unidade',
        });
      }

      // Verificar código de barras se fornecido
      if (validatedData.codigoBarras) {
        const existingBarcode = await prisma.product.findFirst({
          where: {
            codigoBarras: validatedData.codigoBarras,
            unidade: unidade as any,
          },
        });

        if (existingBarcode) {
          return res.status(400).json({
            error: 'Já existe um produto com este código de barras',
          });
        }
      }

      const product = await prisma.product.create({
        data: {
          ...validatedData,
          unidade: unidade as any,
          estoqueAtual: 0, // Iniciar com estoque zerado
        },
      });

      res.status(201).json({
        message: 'Produto criado com sucesso',
        product,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProductController.create',
        'Erro ao criar produto'
      );
    }
  }

  // Listar produtos com filtros
  async list(req: Request, res: Response) {
    try {
      const validatedQuery = listProductsSchema.parse(req.query);
      const unidade = (req as any).userUnidade!;

      const {
        page = 1,
        limit = 10,
        search,
        categoria,
        ativo,
        estoqueMinimo,
        orderBy = 'nome',
        orderDirection = 'asc',
      } = validatedQuery;

      const skip = (page - 1) * limit;

      // Construir filtros
      const where: any = {
        unidade: unidade as any,
      };

      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
          { categoria: { contains: search, mode: 'insensitive' } },
          { codigoBarras: { contains: search } },
          { fabricante: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoria) {
        where.categoria = { contains: categoria, mode: 'insensitive' };
      }

      if (ativo !== undefined) {
        where.ativo = ativo;
      }

      if (estoqueMinimo) {
        where.estoqueAtual = { lte: prisma.product.fields.estoqueMinimo };
      }

      // Contar total de registros
      const total = await prisma.product.count({ where });

      // Buscar produtos
      const products = await prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: orderDirection },
        select: {
          id: true,
          nome: true,
          descricao: true,
          categoria: true,
          codigoBarras: true,
          fabricante: true,
          estoqueMinimo: true,
          estoqueAtual: true,
          localizacao: true,
          precoCusto: true,
          precoVenda: true,
          ativo: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const totalPages = Math.ceil(total / limit);

      res.json({
        products,
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
      return ErrorHandler.handleError(
        error,
        res,
        'ProductController.list',
        'Erro ao listar produtos'
      );
    }
  }

  // Buscar produto por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;

      const product = await prisma.product.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
        include: {
          lotes: {
            where: { ativo: true },
            orderBy: { validade: 'asc' },
          },
          movimentacoes: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              criadoPor: {
                select: { nome: true },
              },
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({
          error: 'Produto não encontrado',
        });
      }

      res.json({ product });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProductController.getById',
        'Erro ao buscar produto'
      );
    }
  }

  // Buscar produto por código de barras
  async getByBarcode(req: Request, res: Response) {
    try {
      const { codigoBarras } = req.params;
      const unidade = (req as any).userUnidade!;

      const product = await prisma.product.findFirst({
        where: {
          codigoBarras,
          unidade: unidade as any,
        },
      });

      if (!product) {
        return res.status(404).json({
          error: 'Produto não encontrado',
        });
      }

      res.json({ product });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProductController.getByBarcode',
        'Erro ao buscar produto por código de barras'
      );
    }
  }

  // Atualizar produto
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateProductSchema.parse(req.body);
      const unidade = (req as any).userUnidade!;

      // Verificar se produto existe
      const existingProduct = await prisma.product.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
      });

      if (!existingProduct) {
        return res.status(404).json({
          error: 'Produto não encontrado',
        });
      }

      // Verificar nome duplicado (se está sendo alterado)
      if (validatedData.nome && validatedData.nome !== existingProduct.nome) {
        const nameExists = await prisma.product.findFirst({
          where: {
            nome: validatedData.nome,
            unidade: unidade as any,
            id: { not: id },
          },
        });

        if (nameExists) {
          return res.status(400).json({
            error: 'Já existe outro produto com este nome',
          });
        }
      }

      // Verificar código de barras duplicado (se está sendo alterado)
      if (
        validatedData.codigoBarras &&
        validatedData.codigoBarras !== existingProduct.codigoBarras
      ) {
        const barcodeExists = await prisma.product.findFirst({
          where: {
            codigoBarras: validatedData.codigoBarras,
            unidade: unidade as any,
            id: { not: id },
          },
        });

        if (barcodeExists) {
          return res.status(400).json({
            error: 'Já existe outro produto com este código de barras',
          });
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: validatedData,
      });

      res.json({
        message: 'Produto atualizado com sucesso',
        product: updatedProduct,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProductController.update',
        'Erro ao atualizar produto'
      );
    }
  }

  // Ativar/Desativar produto
  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;

      const product = await prisma.product.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
      });

      if (!product) {
        return res.status(404).json({
          error: 'Produto não encontrado',
        });
      }

      const newStatus = !product.ativo;

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { ativo: newStatus },
      });

      res.json({
        message: `Produto ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
        product: updatedProduct,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProductController.toggleStatus',
        'Erro ao alterar status do produto'
      );
    }
  }

  // Ajustar estoque
  async adjustStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = adjustStockSchema.parse(req.body);
      const unidade = (req as any).userUnidade!;
      const userId = (req as any).userId!;

      const product = await prisma.product.findFirst({
        where: {
          id,
          unidade: unidade as any,
        },
      });

      if (!product) {
        return res.status(404).json({
          error: 'Produto não encontrado',
        });
      }

      const novoEstoque = product.estoqueAtual + validatedData.quantidade;

      if (novoEstoque < 0) {
        return res.status(400).json({
          error: 'Estoque não pode ficar negativo',
          estoqueAtual: product.estoqueAtual,
          tentativaAjuste: validatedData.quantidade,
        });
      }

      // Transação para atualizar estoque e criar movimentação
      const result = await prisma.$transaction(async (tx) => {
        // Atualizar estoque do produto
        const updatedProduct = await tx.product.update({
          where: { id },
          data: { estoqueAtual: novoEstoque },
        });

        // Criar movimentação
        const movement = await tx.stockMovement.create({
          data: {
            productId: id,
            tipo: validatedData.quantidade > 0 ? 'ENTRADA' : 'SAIDA',
            quantidade: Math.abs(validatedData.quantidade),
            motivo: validatedData.motivo,
            observacoes: validatedData.observacoes,
            criadoPorId: userId,
            unidade: unidade as any,
          },
        });

        return { product: updatedProduct, movement };
      });

      res.json({
        message: 'Estoque ajustado com sucesso',
        product: result.product,
        movement: result.movement,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProductController.adjustStock',
        'Erro ao ajustar estoque'
      );
    }
  }

  // Listar produtos com estoque baixo
  async getLowStock(req: Request, res: Response) {
    try {
      const unidade = (req as any).userUnidade!;

      const products = await prisma.product.findMany({
        where: {
          unidade: unidade as any,
          ativo: true,
          estoqueAtual: {
            lte: prisma.product.fields.estoqueMinimo,
          },
        },
        orderBy: [{ estoqueAtual: 'asc' }, { nome: 'asc' }],
        select: {
          id: true,
          nome: true,
          categoria: true,
          estoqueAtual: true,
          estoqueMinimo: true,
          localizacao: true,
        },
      });

      res.json({
        products,
        total: products.length,
        message: `${products.length} produto(s) com estoque baixo`,
      });
    } catch (error) {
      return ErrorHandler.handleError(
        error,
        res,
        'ProductController.getLowStock',
        'Erro ao buscar produtos com estoque baixo'
      );
    }
  }

  // Listar categorias de produtos
  async getCategories(req: Request, res: Response) {
    try {
      const unidade = (req as any).userUnidade!;

      const categories = await prisma.product.findMany({
        where: {
          unidade: unidade as any,
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
        'ProductController.getCategories',
        'Erro ao buscar categorias'
      );
    }
  }
}
