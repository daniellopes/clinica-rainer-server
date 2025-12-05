import { PrismaClient, Unidade, StatusAgendamento } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Script para criar dados de teste para o módulo de execuções
 * Cria pacientes, procedimentos e appointments com diferentes statuses
 */
async function createExecucoesTestData() {
  console.log('🚀 Iniciando criação de dados de teste para execuções...\n');

  try {
    // 1. Verificar ou criar usuários
    console.log('1️⃣ Verificando/criando usuários...');
    const unidades: Unidade[] = ['BARRA', 'TIJUCA'];
    
    let users: any[] = [];
    for (const unidade of unidades) {
      // Verificar se já existe admin para a unidade
      let admin = await prisma.user.findFirst({
        where: {
          email: `admin@${unidade.toLowerCase()}.com`,
          unidade: unidade,
        }
      });

      if (!admin) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        admin = await prisma.user.create({
          data: {
            nome: `Admin ${unidade}`,
            email: `admin@${unidade.toLowerCase()}.com`,
            senha: hashedPassword,
            role: 'ADMIN',
            unidade: unidade,
            cargo: 'Administrador',
          }
        });
        console.log(`   ✅ Usuário admin criado para ${unidade}`);
      } else {
        console.log(`   ✅ Usuário admin já existe para ${unidade}`);
      }

      // Criar médico
      let medico = await prisma.user.findFirst({
        where: {
          email: `medico@${unidade.toLowerCase()}.com`,
          unidade: unidade,
        }
      });

      if (!medico) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        medico = await prisma.user.create({
          data: {
            nome: `Dr. Rainer Moreira - ${unidade}`,
            email: `medico@${unidade.toLowerCase()}.com`,
            senha: hashedPassword,
            role: 'MEDICO',
            unidade: unidade,
            cargo: 'Médico',
            especialidade: 'ESTETICA',
          }
        });
        console.log(`   ✅ Médico criado para ${unidade}`);
      } else {
        console.log(`   ✅ Médico já existe para ${unidade}`);
      }

      users.push(admin, medico);
    }

    // 2. Verificar ou criar pacientes
    console.log('\n2️⃣ Verificando/criando pacientes...');
    const pacientesData = [
      {
        nome: 'João Silva',
        cpfBase: '123456789',
        email: 'joao.silva@email.com',
        telefone: '(21) 99999-9999',
        nascimento: new Date('1985-05-15'),
      },
      {
        nome: 'Maria Santos',
        cpfBase: '987654321',
        email: 'maria.santos@email.com',
        telefone: '(21) 88888-8888',
        nascimento: new Date('1990-08-22'),
      },
      {
        nome: 'Pedro Oliveira',
        cpfBase: '111222333',
        email: 'pedro.oliveira@email.com',
        telefone: '(21) 77777-7777',
        nascimento: new Date('1992-12-10'),
      },
    ];

    let patients: any[] = [];
    for (const pacienteData of pacientesData) {
      for (const unidade of unidades) {
        // Criar um CPF único por unidade (adiciona sufixo)
        const unidadeIndex = unidades.indexOf(unidade) + 1;
        const cpfUnidade = pacienteData.cpfBase + unidadeIndex.toString();
        // Criar email único por unidade (adiciona sufixo antes do @)
        const emailParts = pacienteData.email.split('@');
        const emailUnidade = `${emailParts[0]}.${unidade.toLowerCase()}@${emailParts[1]}`;
          
        let patient = await prisma.patient.findUnique({
          where: {
            cpf: cpfUnidade,
          }
        });

        if (!patient) {
          // Gerar prontuário único
          const year = new Date().getFullYear();
          const lastPatient = await prisma.patient.findFirst({
            where: {
              prontuario: {
                startsWith: year.toString(),
              },
            },
            orderBy: { prontuario: 'desc' },
          });

          const nextNumber = lastPatient
            ? parseInt(lastPatient.prontuario.slice(-4)) + 1
            : 1;

          const prontuario = `${year}${nextNumber.toString().padStart(4, '0')}`;

          patient = await prisma.patient.create({
            data: {
              nome: pacienteData.nome,
              cpf: cpfUnidade,
              email: emailUnidade,
              telefone: pacienteData.telefone,
              nascimento: pacienteData.nascimento,
              prontuario: prontuario,
              unidade: unidade,
              status: 'ATIVO',
            }
          });
          console.log(`   ✅ Paciente ${pacienteData.nome} criado para ${unidade}`);
        } else {
          console.log(`   ✅ Paciente ${pacienteData.nome} já existe para ${unidade}`);
        }
        patients.push(patient);
      }
    }

    // 3. Verificar ou criar procedimentos
    console.log('\n3️⃣ Verificando/criando procedimentos...');
    const procedimentosData = [
      {
        nome: 'CONSULTA MEDICA / EMAGRE',
        descricao: 'Consulta médica para emagrecimento',
        categoria: 'Consulta',
        duracao: 60,
        valor: 800.00,
        especialidades: ['DERMATOLOGIA'],
      },
      {
        nome: 'Consulta Nutricional Méd',
        descricao: 'Consulta nutricional médica',
        categoria: 'Consulta',
        duracao: 45,
        valor: 80.00,
        especialidades: ['NUTRIÇÃO'],
      },
      {
        nome: 'APLICAÇÃO',
        descricao: 'Aplicação de procedimento',
        categoria: 'Procedimento',
        duracao: 30,
        valor: 20.00,
        especialidades: ['ESTÉTICA'],
      },
      {
        nome: 'LIMPEZA DE PELE',
        descricao: 'Limpeza de pele facial',
        categoria: 'Estética',
        duracao: 60,
        valor: 180.00,
        especialidades: ['ESTÉTICA'],
      },
      {
        nome: 'CONSULTA DERMATOLÓGICA',
        descricao: 'Consulta dermatológica',
        categoria: 'Consulta',
        duracao: 45,
        valor: 250.00,
        especialidades: ['DERMATOLOGIA'],
      },
      {
        nome: 'PEELING QUÍMICO',
        descricao: 'Peeling químico facial',
        categoria: 'Estética',
        duracao: 45,
        valor: 450.00,
        especialidades: ['ESTÉTICA'],
      },
      {
        nome: 'AVALIAÇÃO DE ROTINA',
        descricao: 'Avaliação de rotina',
        categoria: 'Consulta',
        duracao: 30,
        valor: 180.00,
        especialidades: ['GERAL'],
      },
    ];

    let procedures: any[] = [];
    for (const procData of procedimentosData) {
      for (const unidade of unidades) {
        let procedure = await prisma.procedure.findFirst({
          where: {
            nome: procData.nome,
            unidade: unidade,
          }
        });

        if (!procedure) {
          procedure = await prisma.procedure.create({
            data: {
              ...procData,
              unidade: unidade,
              ativo: true,
            }
          });
          console.log(`   ✅ Procedimento ${procData.nome} criado para ${unidade} - R$ ${procData.valor.toFixed(2)}`);
        } else {
          // Atualizar valor se estiver diferente ou null
          if (!procedure.valor || procedure.valor !== procData.valor) {
            procedure = await prisma.procedure.update({
              where: { id: procedure.id },
              data: { valor: procData.valor }
            });
            console.log(`   ✅ Procedimento ${procData.nome} atualizado para ${unidade} - R$ ${procData.valor.toFixed(2)}`);
          } else {
            console.log(`   ✅ Procedimento ${procData.nome} já existe para ${unidade} - R$ ${procData.valor.toFixed(2)}`);
          }
        }
        procedures.push(procedure);
      }
    }

    // 4. Criar appointments (agendamentos) com diferentes statuses
    console.log('\n4️⃣ Criando appointments de teste...');
    
    const barraUsers = users.filter(u => u.unidade === 'BARRA');
    const tijucaUsers = users.filter(u => u.unidade === 'TIJUCA');
    const barraPatients = patients.filter(p => p.unidade === 'BARRA');
    const tijucaPatients = patients.filter(p => p.unidade === 'TIJUCA');
    const barraProcedures = procedures.filter(p => p.unidade === 'BARRA');
    const tijucaProcedures = procedures.filter(p => p.unidade === 'TIJUCA');

    const appointmentsData: Array<{
      unidade: Unidade;
      patient: any;
      procedure: any;
      medico: any;
      criadoPor: any;
      dataHora: Date;
      status: StatusAgendamento;
      tipoAgendamento: string;
      observacoes: string;
      criarConsulta?: boolean;
    }> = [
      // BARRA - Executados não pagos
      {
        unidade: 'BARRA' as Unidade,
        patient: barraPatients[0],
        procedure: barraProcedures[0],
        medico: barraUsers.find((u: any) => u.role === 'MEDICO'),
        criadoPor: barraUsers[0],
        dataHora: new Date('2024-09-30T10:00:00'),
        status: 'CONCLUIDO' as StatusAgendamento,
        tipoAgendamento: 'Particular',
        observacoes: 'Consulta realizada com sucesso',
        criarConsulta: false, // Não pago
      },
      {
        unidade: 'BARRA' as Unidade,
        patient: barraPatients[0],
        procedure: barraProcedures[1],
        medico: barraUsers.find((u: any) => u.role === 'MEDICO'),
        criadoPor: barraUsers[0],
        dataHora: new Date('2024-09-30T14:00:00'),
        status: 'CONCLUIDO' as StatusAgendamento,
        tipoAgendamento: 'Particular',
        observacoes: 'Consulta nutricional realizada',
        criarConsulta: false, // Não pago
      },
      // BARRA - Executado e pago
      {
        unidade: 'BARRA' as Unidade,
        patient: barraPatients[1],
        procedure: barraProcedures[2],
        medico: barraUsers.find((u: any) => u.role === 'MEDICO'),
        criadoPor: barraUsers[0],
        dataHora: new Date('2024-10-08T09:00:00'),
        status: 'CONCLUIDO' as StatusAgendamento,
        tipoAgendamento: 'Particular',
        observacoes: 'Aplicação realizada',
        criarConsulta: true, // Pago (tem consulta)
      },
      {
        unidade: 'BARRA' as Unidade,
        patient: barraPatients[1],
        procedure: barraProcedures[3],
        medico: barraUsers.find((u: any) => u.role === 'MEDICO'),
        criadoPor: barraUsers[0],
        dataHora: new Date('2024-10-10T10:00:00'),
        status: 'CONCLUIDO' as StatusAgendamento,
        tipoAgendamento: 'Particular',
        observacoes: 'Limpeza de pele realizada',
        criarConsulta: true, // Pago (tem consulta)
      },
      // BARRA - Pendentes
      {
        unidade: 'BARRA' as Unidade,
        patient: barraPatients[2],
        procedure: barraProcedures[4],
        medico: barraUsers.find((u: any) => u.role === 'MEDICO'),
        criadoPor: barraUsers[0],
        dataHora: new Date('2024-12-15T11:00:00'),
        status: 'AGENDADO' as StatusAgendamento,
        tipoAgendamento: 'Particular',
        observacoes: 'Agendamento pendente',
      },
      {
        unidade: 'BARRA' as Unidade,
        patient: barraPatients[2],
        procedure: barraProcedures[5],
        medico: barraUsers.find((u: any) => u.role === 'MEDICO'),
        criadoPor: barraUsers[0],
        dataHora: new Date('2024-12-12T15:00:00'),
        status: 'AGENDADO' as StatusAgendamento,
        tipoAgendamento: 'Particular',
        observacoes: 'Agendamento pendente',
      },
      {
        unidade: 'BARRA' as Unidade,
        patient: barraPatients[2],
        procedure: barraProcedures[6],
        medico: barraUsers.find((u: any) => u.role === 'MEDICO'),
        criadoPor: barraUsers[0],
        dataHora: new Date('2024-12-15T16:00:00'),
        status: 'AGENDADO' as StatusAgendamento,
        tipoAgendamento: 'Particular',
        observacoes: 'Avaliação de rotina',
      },
      // TIJUCA - Repetir alguns dados para teste
      {
        unidade: 'TIJUCA' as Unidade,
        patient: tijucaPatients[0],
        procedure: tijucaProcedures[0],
        medico: tijucaUsers.find((u: any) => u.role === 'MEDICO'),
        criadoPor: tijucaUsers[0],
        dataHora: new Date('2024-11-01T10:00:00'),
        status: 'CONCLUIDO' as StatusAgendamento,
        tipoAgendamento: 'Particular',
        observacoes: 'Consulta realizada',
        criarConsulta: true,
      },
      {
        unidade: 'TIJUCA' as Unidade,
        patient: tijucaPatients[1],
        procedure: tijucaProcedures[3],
        medico: tijucaUsers.find((u: any) => u.role === 'MEDICO'),
        criadoPor: tijucaUsers[0],
        dataHora: new Date('2024-12-20T14:00:00'),
        status: 'AGENDADO' as StatusAgendamento,
        tipoAgendamento: 'Particular',
        observacoes: 'Agendamento pendente',
      },
    ];

    let createdCount = 0;
    for (const aptData of appointmentsData) {
      // Verificar se já existe
      const existing = await prisma.appointment.findFirst({
        where: {
          patientId: aptData.patient.id,
          procedureId: aptData.procedure.id,
          dataHora: aptData.dataHora,
          unidade: aptData.unidade,
        }
      });

      if (!existing) {
        const appointment = await prisma.appointment.create({
          data: {
            patientId: aptData.patient.id,
            procedureId: aptData.procedure.id,
            medicoId: aptData.medico?.id,
            criadoPorId: aptData.criadoPor.id,
            dataHora: aptData.dataHora,
            duracao: aptData.procedure.duracao,
            status: aptData.status,
            tipoAgendamento: aptData.tipoAgendamento,
            observacoes: aptData.observacoes,
            unidade: aptData.unidade,
            confirmado: aptData.status === 'CONFIRMADO',
          }
        });

        // Se deve criar consulta (executado e pago)
        if (aptData.criarConsulta) {
          await prisma.consultation.create({
            data: {
              appointmentId: appointment.id,
              patientId: appointment.patientId,
              procedureId: appointment.procedureId,
              medicoId: appointment.medicoId || aptData.criadoPor.id,
              dataConsulta: appointment.dataHora,
              status: 'CONCLUIDA',
              unidade: aptData.unidade,
              observacoes: aptData.observacoes,
            }
          });
        }

        createdCount++;
        console.log(`   ✅ Appointment criado: ${aptData.patient.nome} - ${aptData.procedure.nome} (${aptData.status})`);
      } else {
        console.log(`   ⏭️  Appointment já existe: ${aptData.patient.nome} - ${aptData.procedure.nome}`);
      }
    }

    console.log(`\n✅ Criados ${createdCount} novos appointments!`);
    console.log('\n🎉 Dados de teste criados com sucesso!\n');

    // Resumo
    const totalAppointments = await prisma.appointment.count();
    const totalPatients = await prisma.patient.count();
    const totalProcedures = await prisma.procedure.count();

    console.log('📊 Resumo:');
    console.log(`   - Pacientes: ${totalPatients}`);
    console.log(`   - Procedimentos: ${totalProcedures}`);
    console.log(`   - Appointments: ${totalAppointments}`);
    console.log('\n💡 Use os seguintes dados para login:');
    console.log('   Email: admin@barra.com ou admin@tijuca.com');
    console.log('   Senha: 123456');
    console.log('   Unidade: BARRA ou TIJUCA\n');

  } catch (error: any) {
    console.error('\n❌ ERRO ao criar dados de teste:');
    console.error(`   Tipo: ${error.name}`);
    console.error(`   Mensagem: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão fechada.');
  }
}

// Executar
createExecucoesTestData()
  .then(() => {
    console.log('✨ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });

