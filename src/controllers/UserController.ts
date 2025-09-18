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
   * Lista todos os usuários da unidade do usuário logado
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        where: {
          unidade: req.userUnidade as any,
        },
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
        orderBy: {
          nome: 'asc',
        },
      });

      return res.json({
        users,
        total: users.length,
        unidade: req.userUnidade,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um usuário específico por ID
   */
  async show(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError(
          'ID do usuário é obrigatório',
          400,
          'MISSING_USER_ID',
        );
      }

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

      if (!user) {
        throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
      }

      // Verificar se usuário pertence à mesma unidade
      if (user.unidade !== req.userUnidade) {
        throw new AppError(
          'Acesso não permitido para esta unidade',
          403,
          'UNIT_ACCESS_DENIED',
        );
      }

      return res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria um novo usuário
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        nome,
        email,
        senha,
        role,
        cargo,
        telefone,
        especialidade,
        unidadesAcesso,
      } = req.body;

      // Validações básicas
      if (!nome || !email || !senha) {
        throw new AppError(
          'Nome, email e senha são obrigatórios',
          400,
          'MISSING_REQUIRED_FIELDS',
        );
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError(
          'Formato de email inválido',
          400,
          'INVALID_EMAIL_FORMAT',
        );
      }

      // Validar senha
      if (senha.length < 6) {
        throw new AppError(
          'Senha deve ter pelo menos 6 caracteres',
          400,
          'WEAK_PASSWORD',
        );
      }

      // Verificar se usuário já existe
      const userExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          unidade: req.userUnidade as any,
        },
      });

      if (userExists) {
        throw new AppError(
          'Usuário já existe nesta unidade',
          409,
          'USER_ALREADY_EXISTS',
        );
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(senha, 12);

      // Criar usuário
      const userData: any = {
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha: hashedPassword,
        unidade: req.userUnidade as any,
        role: role || 'RECEPCIONISTA',
        cargo: cargo?.trim(),
        telefone: telefone?.trim(),
      };

      // Adicionar campos opcionais se fornecidos
      if (especialidade) {
        userData.especialidade = especialidade;
      }
      if (unidadesAcesso && Array.isArray(unidadesAcesso)) {
        userData.unidadesAcesso = unidadesAcesso;
      }

      const user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          unidade: true,
          cargo: true,
          telefone: true,
          ativo: true,
          createdAt: true,
        },
      });

      // User created successfully

      return res.status(201).json({
        message: 'Usuário criado com sucesso',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um usuário existente
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        nome,
        email,
        senha,
        role,
        cargo,
        telefone,
        ativo,
        especialidade,
        unidadesAcesso,
      } = req.body;

      if (!id) {
        throw new AppError(
          'ID do usuário é obrigatório',
          400,
          'MISSING_USER_ID',
        );
      }

      // Buscar usuário atual
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
      }

      // Verificar acesso à unidade
      if (user.unidade !== req.userUnidade) {
        throw new AppError(
          'Acesso não permitido para esta unidade',
          403,
          'UNIT_ACCESS_DENIED',
        );
      }

      // Preparar dados para atualização
      const updateData: any = {};

      if (nome) updateData.nome = nome.trim();
      if (email) {
        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new AppError(
            'Formato de email inválido',
            400,
            'INVALID_EMAIL_FORMAT',
          );
        }
        updateData.email = email.toLowerCase().trim();
      }
      if (senha) {
        if (senha.length < 6) {
          throw new AppError(
            'Senha deve ter pelo menos 6 caracteres',
            400,
            'WEAK_PASSWORD',
          );
        }
        updateData.senha = await bcrypt.hash(senha, 12);
      }
      if (role) updateData.role = role;
      if (cargo) updateData.cargo = cargo.trim();
      if (telefone) updateData.telefone = telefone.trim();
      if (typeof ativo === 'boolean') updateData.ativo = ativo;

      // Adicionar novos campos
      if (especialidade !== undefined) updateData.especialidade = especialidade;
      if (unidadesAcesso !== undefined)
        updateData.unidadesAcesso = unidadesAcesso;

      // Atualizar usuário
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
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

      // User updated successfully

      return res.json({
        message: 'Usuário atualizado com sucesso',
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove um usuário (soft delete recomendado)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError(
          'ID do usuário é obrigatório',
          400,
          'MISSING_USER_ID',
        );
      }

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
      }

      // Verificar acesso à unidade
      if (user.unidade !== req.userUnidade) {
        throw new AppError(
          'Acesso não permitido para esta unidade',
          403,
          'UNIT_ACCESS_DENIED',
        );
      }

      // Impedir que usuário delete a si mesmo
      if (user.id === req.userId) {
        throw new AppError(
          'Não é possível deletar seu próprio usuário',
          400,
          'CANNOT_DELETE_SELF',
        );
      }

      // Soft delete (desativar) ao invés de deletar fisicamente
      await prisma.user.update({
        where: { id },
        data: { ativo: false },
      });

      // User deactivated successfully

      return res.json({
        message: 'Usuário desativado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  }
}
