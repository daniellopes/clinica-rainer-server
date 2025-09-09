const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Verificar se admin já existe
    const existingAdmin = await prisma.usuario.findFirst({
      where: { email: 'admin@sistema.com' }
    });

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🏷️ Role:', existingAdmin.role);
      console.log('🏢 Unidade:', existingAdmin.unidade);
      return;
    }

    // Criar hash da senha
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Criar usuário admin
    const admin = await prisma.usuario.create({
      data: {
        nome: 'Administrador do Sistema',
        email: 'admin@sistema.com',
        senha: hashedPassword,
        role: 'ADMINISTRADOR',
        unidade: 'BARRA',
        telefone: '(21) 99999-9999',
        status: 'ATIVO',
        dataUltimoAcesso: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📧 Email: admin@sistema.com');
    console.log('🔑 Senha: 123456');
    console.log('🏷️ Role: ADMINISTRADOR');
    console.log('🏢 Unidade: BARRA');
    console.log('🆔 ID:', admin.id);

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
