import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

/**
 * Controller de autenticação
 * Responsável por login e registro de usuários
 */
const AuthController = {
  /**
   * Realiza login do usuário
   * Valida credenciais e retorna token JWT
   */
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 🔎 Debug: logar tudo que chega
      console.log("📥 [LOGIN] Body recebido:", req.body);
      console.log("📥 [LOGIN] Headers recebidos:", req.headers);

      const { email, senha, unidade } = req.body;

      // Validação básica de entrada
      if (!email || !senha || !unidade) {
        throw new AppError(
          'Email, senha e unidade são obrigatórios',
          400,
          'MISSING_FIELDS',
        );
      }

      // Validação de formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError(
          'Formato de email inválido',
          400,
          'INVALID_EMAIL_FORMAT',
        );
      }

      // Buscar usuário no banco
      const user = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          unidade,
        },
      });

      if (!user) {
        console.warn("⚠️ [LOGIN] Usuário não encontrado:", { email, unidade });
        throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
      }

      // Verificar se usuário está ativo
      if (!user.ativo) {
        console.warn("⚠️ [LOGIN] Usuário inativo:", { email, unidade });
        throw new AppError('Usuário inativo', 401, 'USER_INACTIVE');
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(senha, user.senha);
      if (!isValidPassword) {
        console.warn("⚠️ [LOGIN] Senha incorreta para:", { email, unidade });
        throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
      }

      // Gerar token JWT
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError(
          'Configuração do servidor incorreta',
          500,
          'SERVER_CONFIG_ERROR',
        );
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          unidade: user.unidade,
        },
        jwtSecret,
        { expiresIn: '8h' },
      );

      // Remover senha dos dados do usuário
      const { senha: _, ...userData } = user;

      console.log("✅ [LOGIN] Sucesso:", { id: user.id, email: user.email, unidade: user.unidade });

      return res.status(200).json({
        message: 'Login realizado com sucesso',
        user: userData,
        token,
        expiresIn: '1d',
      });
    } catch (error) {
      // 🔴 Debug: log do erro
      console.error("❌ [LOGIN] Erro no login:", error);
      next(error);
    }
  },

  /**
   * Registra novo usuário (apenas para admins)
   * TODO: Implementar lógica completa de registro
   */
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      throw new AppError(
        'Funcionalidade em desenvolvimento',
        501,
        'NOT_IMPLEMENTED',
      );
    } catch (error) {
      next(error);
    }
  },
};

export default AuthController;
