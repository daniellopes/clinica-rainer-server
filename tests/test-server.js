#!/usr/bin/env node

/**
 * Script para iniciar o servidor em modo de teste
 * Este script define NODE_ENV=test antes de iniciar o servidor
 */

// Definir ambiente de teste ANTES de importar qualquer coisa
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';

console.log('🧪 Iniciando servidor em modo de teste...');
console.log(`📊 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`🚪 PORT: ${process.env.PORT}`);
console.log('⚠️  Rate limiting DESABILITADO para testes');

// Importar e iniciar o servidor
require('ts-node/register');
require('../src/server.ts');