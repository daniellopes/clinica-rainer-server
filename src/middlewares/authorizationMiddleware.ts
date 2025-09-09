import { Request, Response, NextFunction } from 'express';
import { PermissaoTipo } from '@prisma/client';
import { PermissionService } from '../services/PermissionService';
import { AppError } from './errorHandler';

export interface AuthorizeOptions {
  permission: PermissaoTipo;
  resource?: string;
  allowSameUser?: boolean; // Permite se for o próprio usuário
}

/**
 * Middleware de autorização baseado em permissões
 */
export function authorize(options: AuthorizeOptions | PermissaoTipo) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, userUnidade } = req;

      if (!userId || !userUnidade) {
        throw new AppError('Usuário não autenticado', 401, 'UNAUTHORIZED');
      }

      // Se opções foram passadas como string, converter para objeto
      const authorizeOptions: AuthorizeOptions = typeof options === 'string' 
        ? { permission: options }
        : options;

      const { permission, resource, allowSameUser } = authorizeOptions;

      // Se permitir mesmo usuário, verificar se é o próprio usuário
      if (allowSameUser && req.params.id === userId) {
        return next();
      }

      // Verificar permissão
      const hasPermission = await PermissionService.hasPermission({
        userId,
        permission,
        unidade: userUnidade as any,
        resourceId: req.params.id
      });

      if (!hasPermission) {
        // Log da tentativa de acesso não autorizado
        await PermissionService.logAccess({
          userId,
          action: `${req.method} ${req.path}`,
          resource: resource || req.path.split('/')[1],
          resourceId: req.params.id,
          unidade: userUnidade as any,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          details: { permission, reason: 'PERMISSION_DENIED' }
        });

        throw new AppError('Acesso negado: permissão insuficiente', 403, 'PERMISSION_DENIED');
      }

      // Log do acesso autorizado
      await PermissionService.logAccess({
        userId,
        action: `${req.method} ${req.path}`,
        resource: resource || req.path.split('/')[1],
        resourceId: req.params.id,
        unidade: userUnidade as any,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true,
        details: { permission }
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para verificar múltiplas permissões (OR - qualquer uma)
 */
export function authorizeAny(permissions: PermissaoTipo[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, userUnidade } = req;

      if (!userId || !userUnidade) {
        throw new AppError('Usuário não autenticado', 401, 'UNAUTHORIZED');
      }

      // Verificar se tem pelo menos uma permissão
      const permissionChecks = permissions.map(permission =>
        PermissionService.hasPermission({
          userId,
          permission,
          unidade: userUnidade as any,
          resourceId: req.params.id
        })
      );

      const results = await Promise.all(permissionChecks);
      const hasAnyPermission = results.some(result => result);

      if (!hasAnyPermission) {
        await PermissionService.logAccess({
          userId,
          action: `${req.method} ${req.path}`,
          resource: req.path.split('/')[1],
          resourceId: req.params.id,
          unidade: userUnidade as any,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          details: { permissions, reason: 'INSUFFICIENT_PERMISSIONS' }
        });

        throw new AppError('Acesso negado: permissões insuficientes', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para verificar múltiplas permissões (AND - todas)
 */
export function authorizeAll(permissions: PermissaoTipo[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, userUnidade } = req;

      if (!userId || !userUnidade) {
        throw new AppError('Usuário não autenticado', 401, 'UNAUTHORIZED');
      }

      // Verificar se tem todas as permissões
      const permissionChecks = permissions.map(permission =>
        PermissionService.hasPermission({
          userId,
          permission,
          unidade: userUnidade as any,
          resourceId: req.params.id
        })
      );

      const results = await Promise.all(permissionChecks);
      const hasAllPermissions = results.every(result => result);

      if (!hasAllPermissions) {
        await PermissionService.logAccess({
          userId,
          action: `${req.method} ${req.path}`,
          resource: req.path.split('/')[1],
          resourceId: req.params.id,
          unidade: userUnidade as any,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          details: { permissions, reason: 'MISSING_REQUIRED_PERMISSIONS' }
        });

        throw new AppError('Acesso negado: nem todas as permissões necessárias foram encontradas', 403, 'MISSING_REQUIRED_PERMISSIONS');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para filtrar dados baseado nas permissões do usuário
 */
export function filterByPermissions() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, userUnidade } = req;

      if (!userId || !userUnidade) {
        throw new AppError('Usuário não autenticado', 401, 'UNAUTHORIZED');
      }

      // Obter todas as permissões do usuário
      const userPermissions = await PermissionService.getUserPermissions(
        userId,
        userUnidade as any
      );

      // Adicionar permissões ao request para uso nos controllers
      (req as any).userPermissions = userPermissions;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Helper para verificar permissão diretamente em controllers
 */
export async function checkPermission(
  req: Request,
  permission: PermissaoTipo,
  resourceId?: string
): Promise<boolean> {
  const { userId, userUnidade } = req;

  if (!userId || !userUnidade) {
    return false;
  }

  return PermissionService.hasPermission({
    userId,
    permission,
    unidade: userUnidade as any,
    resourceId
  });
}
