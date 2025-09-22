import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Estendendo o tipo Request para incluir user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    nome: string;
    email: string;
    role: string;
    unidade: string;
  };
}

/**
 * Middleware de auditoria de acesso
 * Registra automaticamente todas as ações dos usuários
 */
export const auditMiddleware = (action: string, resource: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.id;
      const userUnidade = req.headers['x-unidade'] as string;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Capturar ID do recurso se estiver nos parâmetros
      const resourceId = req.params.id || req.body.id || null;

      if (userId && userUnidade) {
        // Salvar o método original de res.json para interceptar a resposta
        const originalJson = res.json;
        let responseLogged = false;

        res.json = function (body: any) {
          if (!responseLogged) {
            responseLogged = true;
            const success = res.statusCode >= 200 && res.statusCode < 300;

            // Log da atividade de forma assíncrona
            setImmediate(async () => {
              try {
                await prisma.accessLog.create({
                  data: {
                    userId,
                    action,
                    resource,
                    resourceId,
                    unidade: userUnidade as any,
                    ipAddress,
                    userAgent,
                    success,
                    details: {
                      method: req.method,
                      url: req.originalUrl,
                      statusCode: res.statusCode,
                      userAgent: req.get('User-Agent'),
                      timestamp: new Date().toISOString(),
                    },
                  },
                });
              } catch (error) {
                console.error('Erro ao registrar log de auditoria:', error);
              }
            });
          }

          return originalJson.call(this, body);
        };
      }

      next();
    } catch (error) {
      // Não bloquear a requisição por erro de auditoria
      console.error('Erro no middleware de auditoria:', error);
      next();
    }
  };
};

/**
 * Função utilitária para registrar logs de acesso manuais
 */
export const logAccess = async (
  userId: string,
  action: string,
  resource: string,
  unidade: string,
  options: {
    resourceId?: string;
    success?: boolean;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  } = {},
) => {
  try {
    return await prisma.accessLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: options.resourceId || null,
        unidade: unidade as any,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        success: options.success !== undefined ? options.success : true,
        details: options.details || null,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar log de acesso:', error);
    throw error;
  }
};

/**
 * Função para buscar logs de acesso
 */
export const getAccessLogs = async (filters: {
  userId?: string;
  resource?: string;
  action?: string;
  unidade: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) => {
  try {
    const { page = 1, limit = 50, unidade, ...otherFilters } = filters;
    const skip = (page - 1) * limit;

    const whereClause: any = { unidade };

    if (otherFilters.userId) whereClause.userId = otherFilters.userId;
    if (otherFilters.resource) whereClause.resource = otherFilters.resource;
    if (otherFilters.action) whereClause.action = otherFilters.action;

    if (otherFilters.startDate || otherFilters.endDate) {
      whereClause.createdAt = {};
      if (otherFilters.startDate)
        whereClause.createdAt.gte = otherFilters.startDate;
      if (otherFilters.endDate)
        whereClause.createdAt.lte = otherFilters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.accessLog.findMany({
        where: whereClause,
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
        take: limit,
      }),
      prisma.accessLog.count({ where: whereClause }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Erro ao buscar logs de acesso:', error);
    throw error;
  }
};
