const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAnamneseForms() {
  try {
    console.log('🔍 Verificando formulários existentes...');
    
    const existingForms = await prisma.anamnesisForm.findMany();
    console.log(`📋 Encontrados ${existingForms.length} formulários existentes`);
    
    if (existingForms.length === 0) {
      console.log('📝 Criando formulários de anamnese...');
      
      // Formulário básico de anamnese
      const basicForm = await prisma.anamnesisForm.create({
        data: {
          nome: 'Anamnese Básica',
          descricao: 'Formulário básico de anamnese para consultas gerais',
          especialidade: 'Geral',
          campos: {
            sections: [
              {
                title: 'Dados Pessoais',
                fields: [
                  { id: 'nome', label: 'Nome completo', type: 'text', required: true },
                  { id: 'idade', label: 'Idade', type: 'number', required: true },
                  { id: 'profissao', label: 'Profissão', type: 'text' }
                ]
              },
              {
                title: 'Queixa Principal',
                fields: [
                  { id: 'queixa', label: 'Qual o motivo da consulta?', type: 'textarea', required: true },
                  { id: 'duracao', label: 'Há quanto tempo?', type: 'text' }
                ]
              },
              {
                title: 'História da Doença Atual',
                fields: [
                  { id: 'historia', label: 'Descreva os sintomas', type: 'textarea' },
                  { id: 'medicamentos', label: 'Medicamentos em uso', type: 'textarea' }
                ]
              }
            ]
          },
          ativo: true,
          unidade: 'BARRA'
        }
      });
      
      console.log('✅ Formulário básico criado:', basicForm.nome);
      
      // Formulário de cardiologia
      const cardioForm = await prisma.anamnesisForm.create({
        data: {
          nome: 'Anamnese Cardiológica',
          descricao: 'Formulário específico para consultas cardiológicas',
          especialidade: 'Cardiologia',
          campos: {
            sections: [
              {
                title: 'Sintomas Cardiovasculares',
                fields: [
                  { id: 'dor_peito', label: 'Dor no peito?', type: 'radio', options: ['Sim', 'Não'] },
                  { id: 'falta_ar', label: 'Falta de ar?', type: 'radio', options: ['Sim', 'Não'] },
                  { id: 'palpitacoes', label: 'Palpitações?', type: 'radio', options: ['Sim', 'Não'] }
                ]
              },
              {
                title: 'Fatores de Risco',
                fields: [
                  { id: 'hipertensao', label: 'Hipertensão?', type: 'radio', options: ['Sim', 'Não'] },
                  { id: 'diabetes', label: 'Diabetes?', type: 'radio', options: ['Sim', 'Não'] },
                  { id: 'tabagismo', label: 'Fumante?', type: 'radio', options: ['Sim', 'Não', 'Ex-fumante'] }
                ]
              }
            ]
          },
          ativo: true,
          unidade: 'BARRA'
        }
      });
      
      console.log('✅ Formulário cardiológico criado:', cardioForm.nome);
    }
    
    // Listar todos os formulários
    const allForms = await prisma.anamnesisForm.findMany({
      select: {
        id: true,
        nome: true,
        especialidade: true,
        ativo: true
      }
    });
    
    console.log('\n📋 Formulários disponíveis:');
    allForms.forEach(form => {
      console.log(`- ${form.nome} (${form.especialidade}) - ${form.ativo ? 'Ativo' : 'Inativo'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAnamneseForms();