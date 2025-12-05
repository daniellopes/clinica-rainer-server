import { PrismaClient, Unidade } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Script para atualizar valores de procedimentos existentes no banco de dados
 */
async function updateProcedureValues() {
  console.log('💰 Iniciando atualização de valores dos procedimentos...\n');

  try {
    // Lista de procedimentos com seus valores padrão
    const procedimentosValores: Array<{
      nome: string;
      valor: number;
    }> = [
      {
        nome: 'CONSULTA MEDICA / EMAGRE',
        valor: 800.00,
      },
      {
        nome: 'Consulta Nutricional Méd',
        valor: 80.00,
      },
      {
        nome: 'APLICAÇÃO',
        valor: 20.00,
      },
      {
        nome: 'LIMPEZA DE PELE',
        valor: 180.00,
      },
      {
        nome: 'CONSULTA DERMATOLÓGICA',
        valor: 250.00,
      },
      {
        nome: 'PEELING QUÍMICO',
        valor: 450.00,
      },
      {
        nome: 'AVALIAÇÃO DE ROTINA',
        valor: 180.00,
      },
      {
        nome: 'Consulta Médica',
        valor: 300.00,
      },
      {
        nome: 'Consulta Estética',
        valor: 200.00,
      },
      {
        nome: 'Consulta Dermatológica',
        valor: 250.00,
      },
      {
        nome: 'Procedimento Estético',
        valor: 150.00,
      },
    ];

    const unidades: Unidade[] = ['BARRA', 'TIJUCA'];
    let updatedCount = 0;
    let createdCount = 0;

    for (const unidade of unidades) {
      console.log(`\n📋 Processando unidade: ${unidade}`);
      
      for (const procData of procedimentosValores) {
        // Buscar procedimento por nome e unidade
        const procedure = await prisma.procedure.findFirst({
          where: {
            nome: {
              contains: procData.nome,
              mode: 'insensitive',
            },
            unidade: unidade,
          }
        });

        if (procedure) {
          // Se o procedimento existe mas não tem valor ou tem valor diferente, atualizar
          if (!procedure.valor || procedure.valor !== procData.valor) {
            await prisma.procedure.update({
              where: { id: procedure.id },
              data: { valor: procData.valor }
            });
            console.log(`   ✅ Atualizado: ${procedure.nome} - R$ ${procData.valor.toFixed(2)}`);
            updatedCount++;
          } else {
            console.log(`   ⏭️  Já atualizado: ${procedure.nome} - R$ ${procedure.valor.toFixed(2)}`);
          }
        } else {
          console.log(`   ⚠️  Não encontrado: ${procData.nome} na unidade ${unidade}`);
        }
      }
    }

    // Atualizar todos os procedimentos sem valor com um valor padrão
    console.log('\n🔍 Verificando procedimentos sem valor...');
    for (const unidade of unidades) {
      const proceduresWithoutValue = await prisma.procedure.findMany({
        where: {
          unidade: unidade,
          OR: [
            { valor: null },
            { valor: 0 },
          ],
        }
      });

      if (proceduresWithoutValue.length > 0) {
        console.log(`\n   📝 Encontrados ${proceduresWithoutValue.length} procedimentos sem valor na unidade ${unidade}:`);
        for (const proc of proceduresWithoutValue) {
          // Definir um valor padrão baseado na categoria ou nome
          let valorPadrao = 150.00; // Valor padrão genérico
          
          if (proc.nome.toLowerCase().includes('consulta')) {
            valorPadrao = 200.00;
          } else if (proc.nome.toLowerCase().includes('aplicação')) {
            valorPadrao = 20.00;
          } else if (proc.nome.toLowerCase().includes('limpeza')) {
            valorPadrao = 180.00;
          } else if (proc.nome.toLowerCase().includes('peeling')) {
            valorPadrao = 450.00;
          }

          await prisma.procedure.update({
            where: { id: proc.id },
            data: { valor: valorPadrao }
          });
          console.log(`      ✅ ${proc.nome} - Valor definido: R$ ${valorPadrao.toFixed(2)}`);
          updatedCount++;
        }
      }
    }

    console.log(`\n✅ Atualização concluída!`);
    console.log(`   - ${updatedCount} procedimento(s) atualizado(s)`);
    console.log(`   - ${createdCount} procedimento(s) criado(s)`);

    // Resumo final
    const totalProcedures = await prisma.procedure.count();
    const proceduresWithValue = await prisma.procedure.count({
      where: {
        valor: {
          not: null,
          gt: 0,
        }
      }
    });

    console.log(`\n📊 Resumo:`);
    console.log(`   - Total de procedimentos: ${totalProcedures}`);
    console.log(`   - Procedimentos com valor: ${proceduresWithValue}`);
    console.log(`   - Procedimentos sem valor: ${totalProcedures - proceduresWithValue}\n`);

  } catch (error: any) {
    console.error('\n❌ ERRO ao atualizar valores dos procedimentos:');
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
updateProcedureValues()
  .then(() => {
    console.log('✨ Script concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });

