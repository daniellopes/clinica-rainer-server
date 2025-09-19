import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middlewares/errorHandler';

// Extensão da interface Request para incluir userUnidade
declare global {
  namespace Express {
    interface Request {
      userUnidade?: string;
      userId?: string;
    }
  }
}

const prisma = new PrismaClient();

/**
 * Controller para gerenciamento de usuários
 * Todas as operações respeitam a segregação por unidade
 */
export class UserController {
  /**
   * Lista todos os usuários da unidade logada
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        where: { unidade: req.userUnidade as any },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          unidade: true,
          cargo: true,
          telefone: true,
          ativo: true,
          ultimoAcesso: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { nome: 'asc' },
      });

      return res.json({
        success: true,
        users,                
        total: users.length,
        unidade: req.userUnidade,
        message: `${users.length} usuário(s) encontrado(s)`,
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * Busca usuário por ID
   */
  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new AppError('ID do usuário é obrigatório', 400);

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          unidade: true,
          cargo: true,
          telefone: true,
          ativo: true,
          ultimoAcesso: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) throw new AppError('Usuário não encontrado', 404);
      if (user.unidade !== req.userUnidade)
        throw new AppError('Acesso não permitido para esta unidade', 403);

      return res.json({
        success: true,
        data: user,
        message: 'Usuário encontrado',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria novo usuário
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { nome, email, senha, role, cargo, telefone } = req.body;
      if (!nome || !email || !senha)
        throw new AppError('Nome, email e senha são obrigatórios', 400);

      // Verificar se já existe
      const exists = await prisma.user.findFirst({
        where: { email: email.toLowerCase().trim(), unidade: req.userUnidade as any },
      });
      if (exists)
        throw new AppError('Usuário já existe nesta unidade', 409);

      const hashedPassword = await bcrypt.hash(senha, 12);

      const user = await prisma.user.create({
        data: {
          nome: nome.trim(),
          email: email.toLowerCase().trim(),
          senha: hashedPassword,
          unidade: req.userUnidade as any,
          role: role || 'RECEPCIONISTA',
          cargo,
          telefone,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          unidade: true,
          ativo: true,
          createdAt: true,
        },
      });

      return res.status(201).json({
        success: true,
        data: user,
        message: 'Usuário criado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza usuário existente
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { nome, email, senha, role, cargo, telefone, ativo } = req.body;

      if (!id) throw new AppError('ID do usuário é obrigatório', 400);

      const updateData: any = {};
      if (nome) updateData.nome = nome.trim();
      if (email) updateData.email = email.toLowerCase().trim();
      if (senha) updateData.senha = await bcrypt.hash(senha, 12);
      if (role) updateData.role = role;
      if (cargo) updateData.cargo = cargo;
      if (telefone) updateData.telefone = telefone;
      if (typeof ativo === 'boolean') updateData.ativo = ativo;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          unidade: true,
          ativo: true,
          updatedAt: true,
        },
      });

      return res.json({
        success: true,
        data: updatedUser,
        message: 'Usuário atualizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete (desativar usuário)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new AppError('ID do usuário é obrigatório', 400);

      await prisma.user.update({
        where: { id },
        data: { ativo: false },
      });

      return res.json({
        success: true,
        message: 'Usuário desativado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
