import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createInitialUsers() {
  try {
    console.log('🔄 Criando usuários iniciais...');

    // Admin Barra
    const adminBarra = await prisma.user.upsert({
      where: { email: 'admin@barra.com' },
      update: {},
      create: {
        nome: 'Admin Barra',
        email: 'admin@barra.com',
        senha: await bcrypt.hash('123456', 10),
        role: 'ADMIN',
        unidade: 'BARRA',
        cargo: 'Administrador',
        telefone: '(21) 99999-0001',
        ativo: true,
      },
    });

    // Admin Tijuca
    const adminTijuca = await prisma.user.upsert({
      where: { email: 'admin@tijuca.com' },
      update: {},
      create: {
        nome: 'Admin Tijuca',
        email: 'admin@tijuca.com',
        senha: await bcrypt.hash('123456', 10),
        role: 'ADMIN',
        unidade: 'TIJUCA',
        cargo: 'Administrador',
        telefone: '(21) 99999-0002',
        ativo: true,
      },
    });

    // Recepcionista Barra
    const recepBarra = await prisma.user.upsert({
      where: { email: 'recepcao@barra.com' },
      update: {},
      create: {
        nome: 'Maria Silva',
        email: 'recepcao@barra.com',
        senha: await bcrypt.hash('123456', 10),
        role: 'RECEPCIONISTA',
        unidade: 'BARRA',
        cargo: 'Recepcionista',
        telefone: '(21) 99999-0003',
        ativo: true,
      },
    });

    // Médico Barra
    const medicoBarra = await prisma.user.upsert({
      where: { email: 'medico@barra.com' },
      update: {},
      create: {
        nome: 'Dr. João Santos',
        email: 'medico@barra.com',
        senha: await bcrypt.hash('123456', 10),
        role: 'MEDICO',
        unidade: 'BARRA',
        cargo: 'Dermatologista',
        telefone: '(21) 99999-0004',
        ativo: true,
      },
    });

    console.log('✅ Usuários criados com sucesso!');
    console.log('');
    // Mensagem removida para ambiente de produção
    console.log('👤 Admin Barra:', adminBarra.email, '| Senha: 123456');
    console.log('👤 Admin Tijuca:', adminTijuca.email, '| Senha: 123456');
    console.log('👤 Recepcionista:', recepBarra.email, '| Senha: 123456');
    console.log('👤 Médico:', medicoBarra.email, '| Senha: 123456');
    console.log('');
    console.log('🚀 Agora você pode testar o login no frontend!');
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialUsers();
