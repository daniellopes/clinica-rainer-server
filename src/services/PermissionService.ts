import { PrismaClient, UserRole, PermissaoTipo, Unidade } from '@prisma/client';

const prisma = new PrismaClient();

export interface PermissionCheck {
  userId: string;
  permission: PermissaoTipo;
  unidade: Unidade;
  resourceId?: string;
}

export class PermissionService {
  /**
   * Verifica se um usuário tem uma permissão específica
   */
  static async hasPermission({
    userId,
    permission,
    unidade,
    resourceId: _resourceId,
  }: PermissionCheck): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          permissoes: true,
        },
      });

      if (!user || !user.ativo) {
        return false;
      }

      // Administradores têm acesso total
      if (user.role === UserRole.ADMIN) {
        return true;
      }

      // Verificar se usuário tem acesso à unidade
      if (!user.unidadesAcesso.includes(unidade) && user.unidade !== unidade) {
        return false;
      }

      // Verificar permissão específica do usuário
      const userPermission = user.permissoes.find(
        (p) => p.permissao === permission && p.unidade === unidade && p.ativo,
      );

      if (userPermission) {
        return true;
      }

      // Verificar permissão do role
      const rolePermission = await prisma.rolePermission.findFirst({
        where: {
          role: user.role,
          permissao: permission,
          unidade,
          ativo: true,
        },
      });

      return !!rolePermission;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  /**
   * Obtém todas as permissões de um usuário
   */
  static async getUserPermissions(
    userId: string,
    unidade: Unidade,
  ): Promise<PermissaoTipo[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          permissoes: {
            where: { unidade, ativo: true },
          },
        },
      });

      if (!user || !user.ativo) {
        return [];
      }

      // Administradores têm todas as permissões
      if (user.role === UserRole.ADMIN) {
        return Object.values(PermissaoTipo);
      }

      // Verificar se usuário tem acesso à unidade
      if (!user.unidadesAcesso.includes(unidade) && user.unidade !== unidade) {
        return [];
      }

      // Combinar permissões do role e específicas do usuário
      const [rolePermissions, userPermissions] = await Promise.all([
        prisma.rolePermission.findMany({
          where: {
            role: user.role,
            unidade,
            ativo: true,
          },
          select: { permissao: true },
        }),
        user.permissoes.map((p) => p.permissao),
      ]);

      const allPermissions = new Set([
        ...rolePermissions.map((rp) => rp.permissao),
        ...userPermissions,
      ]);

      return Array.from(allPermissions);
    } catch (error) {
      console.error('Erro ao obter permissões do usuário:', error);
      return [];
    }
  }

  /**
   * Configura permissões padrão para um role
   */
  static async setupDefaultRolePermissions(
    role: UserRole,
    unidade: Unidade,
  ): Promise<void> {
    const permissions = this.getDefaultPermissionsByRole(role);

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissao_unidade: {
            role,
            permissao: permission,
            unidade,
          },
        },
        update: { ativo: true },
        create: {
          role,
          permissao: permission,
          unidade,
          ativo: true,
        },
      });
    }
  }

  /**
   * Define permissões padrão baseadas no briefing
   */
  private static getDefaultPermissionsByRole(role: UserRole): PermissaoTipo[] {
    switch (role) {
      case UserRole.ADMIN:
        return Object.values(PermissaoTipo); // Todas as permissões

      case UserRole.MEDICO:
        return [
          PermissaoTipo.PACIENTES_VISUALIZAR,
          PermissaoTipo.PACIENTES_PRONTUARIO_VISUALIZAR,
          PermissaoTipo.PACIENTES_PRONTUARIO_EDITAR,
          PermissaoTipo.AGENDAMENTOS_VISUALIZAR,
          PermissaoTipo.AGENDAMENTOS_CRIAR,
          PermissaoTipo.AGENDAMENTOS_EDITAR,
          // NÃO pode: editar dados básicos pacientes, agendar para outros médicos,
          // ver financeiro, editar estoque
        ];

      case UserRole.RECEPCIONISTA:
      case UserRole.RECEPCAO:
        return [
          PermissaoTipo.PACIENTES_VISUALIZAR,
          PermissaoTipo.PACIENTES_CRIAR,
          PermissaoTipo.PACIENTES_EDITAR_BASICO,
          PermissaoTipo.PACIENTES_PRONTUARIO_VISUALIZAR, // Apenas receitas
          PermissaoTipo.AGENDAMENTOS_VISUALIZAR,
          PermissaoTipo.AGENDAMENTOS_CRIAR,
          PermissaoTipo.AGENDAMENTOS_EDITAR,
          PermissaoTipo.AGENDAMENTOS_REAGENDAR,
          PermissaoTipo.FINANCEIRO_VISUALIZAR,
          PermissaoTipo.ESTOQUE_MOVIMENTAR, // Apenas se paciente utilizar produto
        ];

      case UserRole.TECNICO_ENFERMAGEM:
        return [
          PermissaoTipo.PACIENTES_VISUALIZAR,
          PermissaoTipo.PACIENTES_PRONTUARIO_VISUALIZAR, // Apenas receitas
          // Pode fazer anotações no "registro de atendimento"
          // NÃO pode: agendar consultas
        ];

      case UserRole.FINANCEIRO:
        return [
          PermissaoTipo.FINANCEIRO_VISUALIZAR,
          PermissaoTipo.FINANCEIRO_CRIAR,
          PermissaoTipo.FINANCEIRO_EDITAR,
          PermissaoTipo.FINANCEIRO_RELATORIOS,
          PermissaoTipo.RELATORIOS_FINANCEIRO,
        ];

      case UserRole.NUTRICIONISTA:
      case UserRole.BIOMEDICO:
      case UserRole.ESTETICA:
        return [
          PermissaoTipo.PACIENTES_VISUALIZAR,
          PermissaoTipo.PACIENTES_PRONTUARIO_VISUALIZAR,
          PermissaoTipo.PACIENTES_PRONTUARIO_EDITAR,
          PermissaoTipo.AGENDAMENTOS_VISUALIZAR,
          PermissaoTipo.AGENDAMENTOS_CRIAR,
          PermissaoTipo.AGENDAMENTOS_EDITAR,
        ];

      case UserRole.ADMINISTRATIVO:
        return [
          PermissaoTipo.USUARIOS_VISUALIZAR,
          PermissaoTipo.USUARIOS_CRIAR,
          PermissaoTipo.USUARIOS_EDITAR,
          PermissaoTipo.RELATORIOS_GERAL,
          PermissaoTipo.SISTEMA_CONFIGURAR,
        ];

      default:
        return [];
    }
  }

  /**
   * Adiciona permissão específica para um usuário
   */
  static async grantUserPermission(
    userId: string,
    permission: PermissaoTipo,
    unidade: Unidade,
  ): Promise<void> {
    await prisma.userPermission.upsert({
      where: {
        userId_permissao_unidade: {
          userId,
          permissao: permission,
          unidade,
        },
      },
      update: { ativo: true },
      create: {
        userId,
        permissao: permission,
        unidade,
        ativo: true,
      },
    });
  }

  /**
   * Remove permissão específica de um usuário
   */
  static async revokeUserPermission(
    userId: string,
    permission: PermissaoTipo,
    unidade: Unidade,
  ): Promise<void> {
    await prisma.userPermission.updateMany({
      where: {
        userId,
        permissao: permission,
        unidade,
      },
      data: { ativo: false },
    });
  }

  /**
   * Log de acesso para auditoria
   */
  static async logAccess(params: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    unidade: Unidade;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    details?: any;
  }): Promise<void> {
    try {
      await prisma.accessLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          unidade: params.unidade,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          success: params.success ?? true,
          details: params.details,
        },
      });
    } catch (error) {
      console.error('Erro ao registrar log de acesso:', error);
    }
  }
}
