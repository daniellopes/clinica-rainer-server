import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
  adjustStockSchema,
} from '../schemas/product.schema';
import { ErrorHandler } from '../utils/errorHandler';

const prisma = new PrismaClient();

export class ProductController {
  // Criar novo produto
  async create(req: Request, res: Response) {
    try {
      const validatedData = createProductSchema.parse(req.body);
      const unidade = (req as any).userUnidade!;

      // Verifica duplicidade de nome
      const existingProduct = await prisma.product.findFirst({
        where: { nome: validatedData.nome, unidade },
      });

      if (existingProduct)
        return res.status(400).json({ error: 'Já existe um produto com este nome nesta unidade' });

      // Verifica duplicidade de código de barras
      if (validatedData.codigoBarras) {
        const existingBarcode = await prisma.product.findFirst({
          where: { codigoBarras: validatedData.codigoBarras, unidade },
        });

        if (existingBarcode)
          return res.status(400).json({ error: 'Já existe um produto com este código de barras' });
      }

      const product = await prisma.product.create({
        data: {
          ...validatedData,
          unidade,
          estoqueAtual: 0,
        },
      });

      res.status(201).json({ message: 'Produto criado com sucesso', product });
    } catch (error) {
      return ErrorHandler.handleError(error, res, 'ProductController.create', 'Erro ao criar produto');
    }
  }

  // Listar produtos
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
        orderBy = 'nome',
        orderDirection = 'asc',
      } = validatedQuery;

      const skip = (page - 1) * limit;

      const where: any = { unidade };

      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
          { categoria: { contains: search, mode: 'insensitive' } },
          { codigoBarras: { contains: search } },
          { fabricante: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoria) where.categoria = { contains: categoria, mode: 'insensitive' };
      if (ativo !== undefined) where.ativo = ativo;

      const total = await prisma.product.count({ where });

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
          codigoInterno: true, 
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

      res.json({
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      return ErrorHandler.handleError(error, res, 'ProductController.list', 'Erro ao listar produtos');
    }
  }

  // Buscar produto por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;

      const product = await prisma.product.findFirst({
        where: { id, unidade },
        include: {
          lotes: { where: { ativo: true }, orderBy: { validade: 'asc' } },
          movimentacoes: {
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { criadoPor: { select: { id: true, nome: true } } },
          },
        },
      });

      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

      const stockMovements = product.movimentacoes.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        quantidade: m.quantidade,
        motivo: m.motivo,
        observacoes: m.observacoes,
        usuarioId: m.criadoPorId,
        usuarioNome: m.criadoPor?.nome || 'Desconhecido',
        createdAt: m.createdAt,
      }));

      res.json({ product: { ...product, stockMovements } });
    } catch (error) {
      return ErrorHandler.handleError(error, res, 'ProductController.getById', 'Erro ao buscar produto');
    }
  }

  // Buscar por código de barras
  async getByBarcode(req: Request, res: Response) {
    try {
      const { codigoBarras } = req.params;
      const unidade = (req as any).userUnidade!;

      const product = await prisma.product.findFirst({ where: { codigoBarras, unidade } });
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

      res.json({ product });
    } catch (error) {
      return ErrorHandler.handleError(error, res, 'ProductController.getByBarcode', 'Erro ao buscar produto por código de barras');
    }
  }

  // Atualizar produto
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateProductSchema.parse(req.body);
      const unidade = (req as any).userUnidade!;

      const existing = await prisma.product.findFirst({ where: { id, unidade } });
      if (!existing) return res.status(404).json({ error: 'Produto não encontrado' });

      if (validatedData.nome && validatedData.nome !== existing.nome) {
        const nameExists = await prisma.product.findFirst({
          where: { nome: validatedData.nome, unidade, id: { not: id } },
        });
        if (nameExists) return res.status(400).json({ error: 'Já existe outro produto com este nome' });
      }

      if (validatedData.codigoBarras && validatedData.codigoBarras !== existing.codigoBarras) {
        const barcodeExists = await prisma.product.findFirst({
          where: { codigoBarras: validatedData.codigoBarras, unidade, id: { not: id } },
        });
        if (barcodeExists) return res.status(400).json({ error: 'Já existe outro produto com este código de barras' });
      }

      const updated = await prisma.product.update({ where: { id }, data: validatedData });
      res.json({ message: 'Produto atualizado com sucesso', product: updated });
    } catch (error) {
      return ErrorHandler.handleError(error, res, 'ProductController.update', 'Erro ao atualizar produto');
    }
  }

  // Ativar / Desativar
  async toggleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;
      const product = await prisma.product.findFirst({ where: { id, unidade } });

      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

      const updated = await prisma.product.update({
        where: { id },
        data: { ativo: !product.ativo },
      });

      res.json({
        message: `Produto ${updated.ativo ? 'ativado' : 'desativado'} com sucesso`,
        product: updated,
      });
    } catch (error) {
      return ErrorHandler.handleError(error, res, 'ProductController.toggleStatus', 'Erro ao alterar status');
    }
  }

  // Ajustar estoque
  async adjustStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const unidade = (req as any).userUnidade!;
      const userId = (req as any).userId!;
      const validated = adjustStockSchema.parse(req.body);

      const product = await prisma.product.findFirst({ where: { id, unidade } });
      if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

      const novoEstoque = product.estoqueAtual + validated.quantidade;
      if (novoEstoque < 0)
        return res.status(400).json({ error: 'Estoque não pode ficar negativo', estoqueAtual: product.estoqueAtual });

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
          where: { id },
          data: { estoqueAtual: novoEstoque },
        });

        const movement = await tx.stockMovement.create({
          data: {
            productId: id,
            tipo: validated.quantidade > 0 ? 'ENTRADA' : 'SAIDA',
            quantidade: Math.abs(validated.quantidade),
            motivo: validated.motivo,
            observacoes: validated.observacoes,
            criadoPorId: userId,
            unidade,
          },
        });

        return { updated, movement };
      });

      res.json({ message: 'Estoque ajustado com sucesso', product: result.updated, movement: result.movement });
    } catch (error) {
      return ErrorHandler.handleError(error, res, 'ProductController.adjustStock', 'Erro ao ajustar estoque');
    }
  }

  // Produtos com estoque baixo
  async getLowStock(req: Request, res: Response) {
    try {
      const unidade = (req as any).userUnidade!;
      const all = await prisma.product.findMany({ where: { unidade, ativo: true } });
      const products = all.filter((p) => p.estoqueAtual <= p.estoqueMinimo);

      res.json({
        products,
        total: products.length,
        message: `${products.length} produto(s) com estoque baixo`,
      });
    } catch (error) {
      return ErrorHandler.handleError(error, res, 'ProductController.getLowStock', 'Erro ao buscar produtos com estoque baixo');
    }
  }

  // Listar categorias
  async getCategories(req: Request, res: Response) {
    try {
      const unidade = (req as any).userUnidade!;
      const categories = await prisma.product.findMany({
        where: { unidade, ativo: true },
        select: { categoria: true },
        distinct: ['categoria'],
      });

      const list = categories.map((c) => c.categoria).filter(Boolean).sort();
      res.json({ categories: list, total: list.length });
    } catch (error) {
      return ErrorHandler.handleError(error, res, 'ProductController.getCategories', 'Erro ao buscar categorias');
    }
  }
}
