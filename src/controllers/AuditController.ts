import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Unidade } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

// Estendendo o tipo Request para incluir user
// Interface AuthenticatedRequest removida - usando Request estendido globalmente pelo authMiddleware

/**
 * Controller de Auditoria de Acesso
 * Responsável por logs de acesso e histórico de modificações
 */
const AuditController = {
  /**
   * Lista logs de acesso com filtros
   */
  listaccessLogs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        userId,
        resource,
        action,
        startDate,
        endDate,
        page = 1,
        limit = 50,
      } = req.query;
      const userUnidade = req.headers['x-unidade'] as string;

      if (!userUnidade) {
        throw new AppError('Unidade não especificada', 400, 'MISSING_UNIDADE');
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Construir filtros
      const filters: any = {
        unidade: userUnidade,
      };

      if (userId) filters.userId = userId;
      if (resource) filters.resource = resource;
      if (action) filters.action = action;

      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate as string);
        if (endDate) filters.createdAt.lte = new Date(endDate as string);
      }

      const [logs, total] = await Promise.all([
        prisma.accessLog.findMany({
          where: filters,
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                cargo: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.accessLog.count({ where: filters }),
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cria um log de acesso
   */
  createaccessLog: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        action,
        resource,
        resourceId,
        success = true,
        details,
      } = req.body;
      const userId = req.userId;
      const userUnidade = req.headers['x-unidade'] as string;
      const unidadeEnum = userUnidade as Unidade;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      if (!userId) {
        throw new AppError('Usuário não autenticado', 401, 'NOT_AUTHENTICATED');
      }

      if (!userUnidade) {
        throw new AppError('Unidade não especificada', 400, 'MISSING_UNIDADE');
      }

      const log = await prisma.accessLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          unidade: unidadeEnum,
          ipAddress,
          userAgent,
          success,
          details,
        },
        include: {
          user: {
            select: {
              nome: true,
              email: true,
              role: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Busca logs por usuário específico
   */
  getUseraccessLogs: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userUnidade = req.headers['x-unidade'] as string;
      const unidadeEnum = userUnidade as Unidade;

      if (!userUnidade) {
        throw new AppError('Unidade não especificada', 400, 'MISSING_UNIDADE');
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [logs, total] = await Promise.all([
        prisma.accessLog.findMany({
          where: {
            userId,
            unidade: unidadeEnum,
          },
          include: {
            user: {
              select: {
                nome: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.accessLog.count({
          where: {
            userId,
            unidade: unidadeEnum,
          },
        }),
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Busca logs por recurso específico
   */
  getResourceaccessLogs: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { resource, resourceId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userUnidade = req.headers['x-unidade'] as string;

      if (!userUnidade) {
        throw new AppError('Unidade não especificada', 400, 'MISSING_UNIDADE');
      }

      const skip = (Number(page) - 1) * Number(limit);

      const filters: any = {
        resource,
        unidade: userUnidade,
      };

      if (resourceId) {
        filters.resourceId = resourceId;
      }

      const [logs, total] = await Promise.all([
        prisma.accessLog.findMany({
          where: filters,
          include: {
            user: {
              select: {
                nome: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.accessLog.count({ where: filters }),
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Relatório de atividades por período
   */
  getActivityReport: async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { startDate, endDate } = req.query;
      const userUnidade = req.headers['x-unidade'] as string;
      const unidadeEnum = userUnidade as Unidade;

      if (!userUnidade) {
        throw new AppError('Unidade não especificada', 400, 'MISSING_UNIDADE');
      }

      if (!startDate || !endDate) {
        throw new AppError(
          'Período obrigatório (startDate e endDate)',
          400,
          'MISSING_PERIOD',
        );
      }

      const filters = {
        unidade: unidadeEnum,
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
      };

      // Estatísticas gerais
      const [totalLogs, uniqueUsers, topActions, topResources, failedAttempts] =
        await Promise.all([
          // Total de logs
          prisma.accessLog.count({ where: filters }),

          // Usuários únicos
          prisma.accessLog.findMany({
            where: filters,
            select: { userId: true },
            distinct: ['userId'],
          }),

          // Top ações
          prisma.accessLog.groupBy({
            by: ['action'],
            where: filters,
            _count: { _all: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
          }),

          // Top recursos
          prisma.accessLog.groupBy({
            by: ['resource'],
            where: filters,
            _count: { _all: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
          }),

          // Tentativas falhadas
          prisma.accessLog.count({
            where: {
              ...filters,
              success: false,
            },
          }),
        ]);

      res.json({
        success: true,
        data: {
          period: {
            startDate,
            endDate,
          },
          statistics: {
            totalLogs,
            uniqueUsers: uniqueUsers.length,
            failedAttempts,
            successRate:
              totalLogs > 0
                ? (((totalLogs - failedAttempts) / totalLogs) * 100).toFixed(2)
                : '0',
          },
          topActions: topActions.map((item) => ({
            action: item.action,
            count: (item._count as { _all: number })._all,
          })),
          topResources: topResources.map((item) => ({
            resource: item.resource,
            count: (item._count as { _all: number })._all,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default AuditController;
