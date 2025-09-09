const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🔍 Verificando dados existentes...');
    
    // Verificar se existe pelo menos um paciente
    const patients = await prisma.patient.findMany({
      take: 1
    });
    
    if (patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado. Criando paciente de teste...');
      
      const testPatient = await prisma.patient.create({
        data: {
          nome: 'João da Silva',
          email: 'joao.teste@email.com',
          telefone: '(11) 99999-9999',
          cpf: '123.456.789-00',
          nascimento: new Date('1990-01-15'),
          prontuario: `PRONT${Date.now()}`,
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          unidade: 'BARRA'
        }
      });
      
      console.log('✅ Paciente criado:', testPatient.nome);
    }
    
    // Pegar o primeiro paciente
    const patient = await prisma.patient.findFirst();
    console.log('👤 Usando paciente:', patient.nome);
    
    // Verificar se já existem formulários de anamnese
    let anamnesisForm = await prisma.anamnesisForm.findFirst({
      where: { especialidade: 'Médico Geral' }
    });
    
    if (!anamnesisForm) {
      console.log('📋 Criando formulário de anamnese...');
      
      anamnesisForm = await prisma.anamnesisForm.create({
        data: {
          nome: 'Anamnese Médica Geral',
          especialidade: 'Médico Geral',
          descricao: 'Formulário padrão de anamnese médica geral',
          campos: {
            sections: [
              {
                title: 'Identificação',
                fields: [
                  { id: 'queixaPrincipal', label: 'Queixa Principal', type: 'textarea', required: true },
                  { id: 'historiaDoencaAtual', label: 'História da Doença Atual', type: 'textarea', required: true }
                ]
              },
              {
                title: 'Antecedentes',
                fields: [
                  { id: 'historiaPatologicaPregressa', label: 'História Patológica Pregressa', type: 'textarea' },
                  { id: 'historicoFamiliar', label: 'Histórico Familiar', type: 'textarea' },
                  { id: 'habitosVida', label: 'Hábitos de Vida', type: 'textarea' }
                ]
              }
            ]
          },
          ativo: true,
          unidade: 'BARRA'
        }
      });
      
      console.log('✅ Formulário criado:', anamnesisForm.nome);
    }
    
    // Verificar se já existem respostas de anamnese para este paciente
    const existingResponses = await prisma.anamnesisResponse.findMany({
      where: { 
        consultation: {
          patientId: patient.id
        }
      }
    });
    
    if (existingResponses.length === 0) {
      console.log('📝 Criando respostas de anamnese de teste...');
      
      // Buscar um médico existente
      const medico = await prisma.user.findFirst({
        where: { role: 'MEDICO' }
      });
      
      // Buscar um procedimento existente
      const procedure = await prisma.procedure.findFirst();
      
      if (!medico || !procedure) {
        console.log('⚠️ Não foi possível encontrar médico ou procedimento. Criando dados básicos...');
        return;
      }
      
      // Primeiro criar uma consulta
      const consultation = await prisma.consultation.create({
        data: {
          patientId: patient.id,
          procedureId: procedure.id,
          medicoId: medico.id,
          dataConsulta: new Date(),
          status: 'AGENDADA',
          unidade: 'BARRA'
        }
      });

      const testResponse = await prisma.anamnesisResponse.create({
        data: {
          consultationId: consultation.id,
          formId: anamnesisForm.id,
          respostas: {
            queixaPrincipal: 'Dor de cabeça frequente há 3 meses',
            historiaDoencaAtual: 'Paciente relata cefaleia tensional, principalmente no final do dia. Dor em região temporal bilateral, de intensidade moderada.',
            historiaPatologicaPregressa: 'Hipertensão arterial controlada com medicação. Nega diabetes, cardiopatias ou outras comorbidades.',
            historicoFamiliar: 'Pai hipertenso, mãe diabética. Avô paterno com AVC aos 70 anos.',
            habitosVida: 'Sedentário, trabalha em escritório. Não fuma, bebe socialmente aos finais de semana. Dorme cerca de 6h por noite.'
          },
          status: 'completed',
          completedBy: 'Dr. João Silva',
          completedAt: new Date(),
          unidade: 'BARRA'
        }
      });
      
      console.log('✅ Anamnese criada para paciente:', patient.nome);
      
      // Criar uma segunda anamnese (evolução)
       const consultation2 = await prisma.consultation.create({
         data: {
           patientId: patient.id,
           procedureId: procedure.id,
           medicoId: medico.id,
           dataConsulta: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
           status: 'REALIZADA',
           unidade: 'BARRA'
         }
       });

      const evolutionResponse = await prisma.anamnesisResponse.create({
        data: {
          consultationId: consultation2.id,
          formId: anamnesisForm.id,
          respostas: {
            evolucao: 'Paciente retorna após 15 dias. Relata melhora significativa da cefaleia após início do tratamento.',
            exameFisico: 'PA: 130/85 mmHg, FC: 72 bpm, Tax: 36.5°C. Paciente consciente, orientado, sem sinais de sofrimento.',
            conduta: 'Manter medicação atual. Orientado sobre higiene do sono e atividade física regular. Retorno em 30 dias.'
          },
          status: 'completed',
          completedBy: 'Dr. João Silva',
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          unidade: 'BARRA'
        }
      });
      
      console.log('✅ Evolução criada para paciente:', patient.nome);
    } else {
      console.log('ℹ️ Já existem', existingResponses.length, 'anamneses para este paciente');
    }
    
    // Listar todas as anamneses do paciente
    const allResponses = await prisma.anamnesisResponse.findMany({
      where: { 
        consultation: {
          patientId: patient.id
        }
      },
      include: {
        form: true,
        consultation: {
          include: {
            patient: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📊 Anamneses encontradas:');
    allResponses.forEach((response, index) => {
      console.log(`${index + 1}. ${response.form.nome} - Status: ${response.status} - Criada em: ${response.createdAt.toLocaleDateString()}`);
    });
    
    console.log('\n✅ Dados de teste criados com sucesso!');
    console.log(`🔗 Teste no frontend: http://localhost:3002/consultas/${patient.id}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();