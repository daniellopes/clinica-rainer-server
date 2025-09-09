import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole, PermissaoTipo, Unidade } from '@prisma/client';
import { PermissionService } from '../services/PermissionService';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

export class PermissionController {
  
  /**
   * Obtém todas as permissões de um usuário específico
   */
  static async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { userUnidade } = req;

      const permissions = await PermissionService.getUserPermissions(
        userId, 
        userUnidade as Unidade
      );

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          unidade: true,
          unidadesAcesso: true,
          especialidade: true,
          ativo: true
        }
      });

      return res.json({
        success: true,
        user,
        permissions,
        totalPermissions: permissions.length
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Concede uma permissão específica a um usuário
   */
  static async grantUserPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { permission, unidade } = req.body;
      const { userId: adminId, userUnidade } = req;

      if (!permission || !unidade) {
        throw new AppError('Permissão e unidade são obrigatórias', 400, 'MISSING_FIELDS');
      }

      await PermissionService.grantUserPermission(userId, permission, unidade);

      // Log da ação
      await PermissionService.logAccess({
        userId: adminId!,
        action: 'GRANT_PERMISSION',
        resource: 'user_permissions',
        resourceId: userId,
        unidade: userUnidade as Unidade,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { permission, targetUserId: userId, grantedUnidade: unidade }
      });

      return res.json({
        success: true,
        message: 'Permissão concedida com sucesso',
        userId,
        permission,
        unidade
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoga uma permissão específica de um usuário
   */
  static async revokeUserPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { permission, unidade } = req.body;
      const { userId: adminId, userUnidade } = req;

      if (!permission || !unidade) {
        throw new AppError('Permissão e unidade são obrigatórias', 400, 'MISSING_FIELDS');
      }

      await PermissionService.revokeUserPermission(userId, permission, unidade);

      // Log da ação
      await PermissionService.logAccess({
        userId: adminId!,
        action: 'REVOKE_PERMISSION',
        resource: 'user_permissions',
        resourceId: userId,
        unidade: userUnidade as Unidade,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { permission, targetUserId: userId, revokedUnidade: unidade }
      });

      return res.json({
        success: true,
        message: 'Permissão revogada com sucesso',
        userId,
        permission,
        unidade
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém as permissões padrão de um role
   */
  static async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.params;
      const { userUnidade } = req;

      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: role as UserRole,
          unidade: userUnidade as Unidade,
          ativo: true
        },
        select: {
          id: true,
          permissao: true,
          ativo: true,
          createdAt: true
        }
      });

      return res.json({
        success: true,
        role,
        unidade: userUnidade,
        permissions: rolePermissions.map(rp => rp.permissao),
        totalPermissions: rolePermissions.length
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Configura as permissões padrão para um role
   */
  static async setupRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.params;
      const { userUnidade, userId } = req;

      await PermissionService.setupDefaultRolePermissions(
        role as UserRole, 
        userUnidade as Unidade
      );

      // Log da ação
      await PermissionService.logAccess({
        userId: userId!,
        action: 'SETUP_ROLE_PERMISSIONS',
        resource: 'role_permissions',
        resourceId: role,
        unidade: userUnidade as Unidade,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: { role, unidade: userUnidade }
      });

      return res.json({
        success: true,
        message: 'Permissões padrão configuradas com sucesso',
        role,
        unidade: userUnidade
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifica se o usuário logado tem uma permissão específica
   */
  static async checkUserPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { permission } = req.params;
      const { userId, userUnidade } = req;
      const { resourceId } = req.query;

      const hasPermission = await PermissionService.hasPermission({
        userId: userId!,
        permission: permission as PermissaoTipo,
        unidade: userUnidade as Unidade,
        resourceId: resourceId as string
      });

      return res.json({
        success: true,
        userId,
        permission,
        unidade: userUnidade,
        hasPermission,
        resourceId
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém logs de acesso para auditoria
   */
  static async getAccessLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { userUnidade } = req;
      const { 
        page = '1', 
        limit = '50', 
        userId, 
        resource, 
        action,
        startDate,
        endDate
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Construir filtros
      const where: any = {
        unidade: userUnidade as Unidade
      };

      if (userId) {
        where.userId = userId;
      }

      if (resource) {
        where.resource = { contains: resource as string, mode: 'insensitive' };
      }

      if (action) {
        where.action = { contains: action as string, mode: 'insensitive' };
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      const [logs, totalCount] = await Promise.all([
        prisma.accessLog.findMany({
          where,
          include: {
            user: {
              select: {
                nome: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum
        }),
        prisma.accessLog.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      return res.json({
        success: true,
        logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        filters: {
          userId,
          resource,
          action,
          startDate,
          endDate,
          unidade: userUnidade
        }
      });

    } catch (error) {
      next(error);
    }
  }
}
