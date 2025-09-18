import { Router } from 'express';
import { PermissionController } from '../controllers/PermissionController';
import authMiddleware from '../middlewares/authMiddleware';
import { authorize } from '../middlewares/authorizationMiddleware';
import { PermissaoTipo } from '@prisma/client';

const router = Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

// Rotas de permissões (apenas admins)
router.get(
  '/user/:userId',
  authorize(PermissaoTipo.USUARIOS_VISUALIZAR),
  PermissionController.getUserPermissions,
);

router.post(
  '/user/:userId/grant',
  authorize(PermissaoTipo.USUARIOS_EDITAR),
  PermissionController.grantUserPermission,
);

router.post(
  '/user/:userId/revoke',
  authorize(PermissaoTipo.USUARIOS_EDITAR),
  PermissionController.revokeUserPermission,
);

router.get(
  '/role/:role',
  authorize(PermissaoTipo.SISTEMA_CONFIGURAR),
  PermissionController.getRolePermissions,
);

router.post(
  '/role/:role/setup',
  authorize(PermissaoTipo.SISTEMA_CONFIGURAR),
  PermissionController.setupRolePermissions,
);

router.get('/check/:permission', PermissionController.checkUserPermission);

router.get(
  '/audit/logs',
  authorize(PermissaoTipo.SISTEMA_AUDITORIA),
  PermissionController.getAccessLogs,
);

export default router;
