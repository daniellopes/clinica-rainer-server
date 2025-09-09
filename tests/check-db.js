const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando dados no banco Neon...');
    
    // Verificar formulários de anamnese
    const anamnesisFormsCount = await prisma.anamnesisForm.count();
    console.log(`📋 Formulários de anamnese: ${anamnesisFormsCount}`);
    
    if (anamnesisFormsCount > 0) {
      const forms = await prisma.anamnesisForm.findMany({
        take: 5,
        select: {
          id: true,
          nome: true,
          especialidade: true,
          ativo: true,
          createdAt: true
        }
      });
      console.log('📝 Primeiros 5 formulários:');
      forms.forEach(form => {
        console.log(`  - ${form.nome} (${form.especialidade}) - ${form.ativo ? 'Ativo' : 'Inativo'}`);
      });
    }
    
    // Verificar respostas de anamnese
    const anamnesisResponsesCount = await prisma.anamnesisResponse.count();
    console.log(`📊 Respostas de anamnese: ${anamnesisResponsesCount}`);
    
    // Verificar pacientes
    const patientsCount = await prisma.patient.count();
    console.log(`👥 Pacientes: ${patientsCount}`);
    
    // Verificar consultas
    const consultationsCount = await prisma.consultation.count();
    console.log(`🏥 Consultas: ${consultationsCount}`);
    
    // Verificar usuários
    const usersCount = await prisma.user.count();
    console.log(`👤 Usuários: ${usersCount}`);
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();