const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuários no banco...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        unidade: true,
        ativo: true
      }
    });

    console.log(`📊 Total de usuários: ${users.length}`);
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado!');
      console.log('💡 Precisa criar usuários primeiro');
    } else {
      console.log('👥 Usuários encontrados:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome} (${user.email}) - ${user.role} - ${user.unidade} - ${user.ativo ? 'ATIVO' : 'INATIVO'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
