import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Unidade } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

const AuthController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, senha, unidade } = req.body;

      if (!email || !senha || !unidade) {
        throw new AppError('Email, senha e unidade são obrigatórios', 400, 'MISSING_FIELDS');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError('Formato de email inválido', 400, 'INVALID_EMAIL_FORMAT');
      }

      const unidadeNormalizada = (unidade as string).toUpperCase();
      if (!Object.values(Unidade).includes(unidadeNormalizada as Unidade)) {
        throw new AppError('Unidade inválida', 400, 'INVALID_UNIDADE');
      }

      const user = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          unidade: unidadeNormalizada as Unidade,
        },
      });

      if (!user) {
        throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
      }

      if (!user.ativo) {
        throw new AppError('Usuário inativo', 401, 'USER_INACTIVE');
      }

      const isValidPassword = await bcrypt.compare(senha, user.senha);
      if (!isValidPassword) {
        throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new AppError('Configuração do servidor incorreta', 500, 'SERVER_CONFIG_ERROR');
      }

      const expiresInSeconds = 24 * 60 * 60; // 1 dia
      const token = jwt.sign(
        { id: user.id, role: user.role, unidade: user.unidade },
        jwtSecret,
        { expiresIn: expiresInSeconds },
      );

      // remove senha antes de retornar
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { senha: _, ...userData } = user;

      return res.status(200).json({
        message: 'Login realizado com sucesso',
        user: userData,
        token,
        expiresIn: expiresInSeconds,
        expiresAt: Date.now() + expiresInSeconds * 1000,
      });
    } catch (error) {
      console.error('Erro no login:', error);
      const { email, unidade } = req.body;
      console.error(`Login falhou para o usuário: ${email}, unidade: ${unidade}`);
      next(error);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    // register implementation
    res.status(201).json({ message: 'User registered successfully' });
  }
};

export default AuthController;
