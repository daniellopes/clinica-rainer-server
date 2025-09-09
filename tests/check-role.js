const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserRole() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@barra.com' }
    });
    
    console.log('🔍 Usuário encontrado:');
    console.log('Email:', user?.email);
    console.log('Role:', user?.role);
    console.log('Nome:', user?.nome);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRole();
