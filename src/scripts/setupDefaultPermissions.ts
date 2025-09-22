import { PrismaClient, UserRole, Unidade } from '@prisma/client';
import { PermissionService } from '../services/PermissionService';

const prisma = new PrismaClient();

async function setupDefaultPermissions() {
  try {
    console.log('🔐 Configurando permissões padrão...');

    const roles = Object.values(UserRole);
    const unidades = Object.values(Unidade);

    for (const role of roles) {
      for (const unidade of unidades) {
        console.log(
          `Configurando permissões para ${role} na unidade ${unidade}...`,
        );
        await PermissionService.setupDefaultRolePermissions(role, unidade);
      }
    }

    // Verificar usuários existentes e dar permissões
    const users = await prisma.user.findMany({
      select: { id: true, nome: true, role: true, unidade: true },
    });

    console.log(
      `📋 Encontrados ${users.length} usuários para configurar permissões...`,
    );

    for (const user of users) {
      console.log(
        `Configurando permissões para usuário: ${user.nome} (${user.role})`,
      );

      // Se o usuário não tem unidadesAcesso configuradas, usar a unidade principal
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { unidadesAcesso: true },
      });

      if (
        !currentUser?.unidadesAcesso ||
        currentUser.unidadesAcesso.length === 0
      ) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            unidadesAcesso: [user.unidade], // Dar acesso à unidade principal
          },
        });
      }
    }

    console.log('✅ Permissões padrão configuradas com sucesso!');
    console.log('📊 Resumo das permissões configuradas:');

    // Mostrar resumo
    for (const role of roles) {
      const permissions = await PermissionService.getUserPermissions(
        '00000000-0000-0000-0000-000000000000', // ID fake para teste
        Unidade.BARRA,
      );
      console.log(`   ${role}: Configurado para todas as unidades`);
    }
  } catch (error) {
    console.error('❌ Erro ao configurar permissões padrão:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDefaultPermissions();
