import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

/**
 * Script para verificar agendamentos no banco de dados
 * Uso: ts-node src/scripts/checkAppointment.ts [id] ou [data] [hora]
 */
async function checkAppointment() {
  const args = process.argv.slice(2);

  console.log('🔍 Verificando agendamentos...\n');

  try {
    if (args.length === 1 && args[0].includes('-')) {
      // Se for um ID (UUID)
      const id = args[0];
      console.log(`📋 Buscando agendamento por ID: ${id}\n`);

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              categoria: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      if (!appointment) {
        console.log('❌ Agendamento não encontrado\n');
        process.exit(1);
      }

      console.log('✅ Agendamento encontrado:');
      console.log(JSON.stringify(appointment, null, 2));
    } else if (args.length >= 1) {
      // Buscar por data e hora
      const data = args[0] || new Date().toISOString().split('T')[0];
      const hora = args[1] ? parseInt(args[1]) : null;

      console.log(`📅 Buscando agendamentos para: ${data}${hora ? ` às ${hora}:00` : ''}\n`);

      const startDate = new Date(data);
      startDate.setHours(hora !== null ? hora : 0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      if (hora !== null) {
        endDate.setHours(hora + 1, 0, 0, 0);
      } else {
        endDate.setHours(23, 59, 59, 999);
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          dataHora: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              categoria: true,
            },
          },
          medico: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          dataHora: 'asc',
        },
      });

      if (appointments.length === 0) {
        console.log('❌ Nenhum agendamento encontrado\n');
        process.exit(1);
      }

      console.log(`✅ Encontrados ${appointments.length} agendamento(s):\n`);
      
      appointments.forEach((apt, index) => {
        const dataHora = new Date(apt.dataHora);
        console.log(`${index + 1}. ID: ${apt.id}`);
        console.log(`   Paciente: ${apt.patient.nome}`);
        console.log(`   Procedimento: ${apt.procedure.nome} (${apt.procedure.categoria})`);
        console.log(`   Data/Hora: ${dataHora.toLocaleString('pt-BR')}`);
        console.log(`   Status: ${apt.status}`);
        console.log(`   Unidade: ${apt.unidade}`);
        console.log(`   Médico: ${apt.medico?.nome || 'Não informado'}`);
        console.log('');
      });
    } else {
      // Listar todos os agendamentos do dia
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const fimDoDia = new Date(hoje);
      fimDoDia.setHours(23, 59, 59, 999);

      console.log(`📅 Buscando agendamentos de hoje (${hoje.toLocaleDateString('pt-BR')})\n`);

      const appointments = await prisma.appointment.findMany({
        where: {
          dataHora: {
            gte: hoje,
            lte: fimDoDia,
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
            },
          },
          procedure: {
            select: {
              id: true,
              nome: true,
              categoria: true,
            },
          },
        },
        orderBy: {
          dataHora: 'asc',
        },
      });

      if (appointments.length === 0) {
        console.log('❌ Nenhum agendamento encontrado para hoje\n');
        process.exit(0);
      }

      console.log(`✅ Encontrados ${appointments.length} agendamento(s) hoje:\n`);
      
      appointments.forEach((apt, index) => {
        const dataHora = new Date(apt.dataHora);
        console.log(`${index + 1}. ${dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${apt.patient.nome}`);
        console.log(`   Procedimento: ${apt.procedure.nome} (${apt.procedure.categoria})`);
        console.log(`   Status: ${apt.status} | Unidade: ${apt.unidade}`);
        console.log(`   ID: ${apt.id}`);
        console.log('');
      });
    }
  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppointment();

