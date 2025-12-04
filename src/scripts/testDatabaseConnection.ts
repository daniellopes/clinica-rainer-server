import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const prisma = new PrismaClient();

/**
 * Script para testar a conexão com o banco de dados
 * Verifica se a conexão está funcionando e mostra informações básicas
 */
async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com o banco de dados...\n');

  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERRO: DATABASE_URL não está configurada no arquivo .env');
    console.log('\nPor favor, configure a variável DATABASE_URL no arquivo .env:');
    console.log('DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"');
    process.exit(1);
  }

  // Mostrar informações da conexão (sem senha)
  const dbUrl = process.env.DATABASE_URL;
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`📝 URL de conexão: ${maskedUrl}\n`);

  try {
    // Teste 1: Conectar ao banco
    console.log('1️⃣ Testando conexão básica...');
    await prisma.$connect();
    console.log('   ✅ Conexão estabelecida com sucesso!\n');

    // Teste 2: Executar query simples
    console.log('2️⃣ Testando query simples...');
    const result = await prisma.$queryRaw`SELECT version() as version, current_database() as database, current_user as user;`;
    console.log('   ✅ Query executada com sucesso!');
    
    if (Array.isArray(result) && result.length > 0) {
      const info = result[0] as {
        version: string;
        database: string;
        user: string;
      };
      console.log(`   📊 Versão PostgreSQL: ${info.version.split(' ')[0]} ${info.version.split(' ')[1]}`);
      console.log(`   📊 Banco de dados: ${info.database}`);
      console.log(`   📊 Usuário: ${info.user}\n`);
    }

    // Teste 3: Verificar se as tabelas principais existem
    console.log('3️⃣ Verificando tabelas principais...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    console.log(`   ✅ Encontradas ${tables.length} tabelas no banco:`);
    const tableNames = tables.map(t => t.tablename);
    tableNames.forEach(table => {
      console.log(`      - ${table}`);
    });
    console.log();

    // Teste 4: Contar registros em algumas tabelas principais
    console.log('4️⃣ Contando registros nas tabelas principais...');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`   👥 Usuários: ${userCount}`);
    } catch (error) {
      console.log(`   ⚠️  Erro ao contar usuários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    try {
      const patientCount = await prisma.patient.count();
      console.log(`   🏥 Pacientes: ${patientCount}`);
    } catch (error) {
      console.log(`   ⚠️  Erro ao contar pacientes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    try {
      const appointmentCount = await prisma.appointment.count();
      console.log(`   📅 Agendamentos: ${appointmentCount}`);
    } catch (error) {
      console.log(`   ⚠️  Erro ao contar agendamentos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    console.log('\n✅ Todos os testes de conexão foram concluídos com sucesso!');
    console.log('🎉 O banco de dados está acessível e funcionando corretamente.\n');

  } catch (error) {
    console.error('\n❌ ERRO ao testar conexão com o banco de dados:');
    
    if (error instanceof Error) {
      console.error(`   Mensagem: ${error.message}`);
      
      // Mensagens de erro comuns e suas soluções
      if (error.message.includes('P1001')) {
        console.error('\n💡 Dica: Não foi possível conectar ao servidor de banco de dados.');
        console.error('   Verifique se:');
        console.error('   - O PostgreSQL está rodando');
        console.error('   - A URL de conexão está correta');
        console.error('   - O host e porta estão acessíveis');
      } else if (error.message.includes('P1000')) {
        console.error('\n💡 Dica: Falha na autenticação.');
        console.error('   Verifique se:');
        console.error('   - O usuário e senha estão corretos');
        console.error('   - O usuário tem permissões para acessar o banco');
      } else if (error.message.includes('P1003')) {
        console.error('\n💡 Dica: O banco de dados não existe.');
        console.error('   Verifique se:');
        console.error('   - O nome do banco está correto');
        console.error('   - O banco foi criado');
      }
    } else {
      console.error(`   Erro: ${error}`);
    }
    
    console.error('');
    process.exit(1);
  } finally {
    // Fechar conexão
    await prisma.$disconnect();
    console.log('🔌 Conexão fechada.');
  }
}

// Executar o teste
testDatabaseConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });

