import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createPermissionsTables() {
  try {
    console.log('Criando tabelas de permissões...');

    // Criar enum PermissaoTipo se não existir
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "PermissaoTipo" AS ENUM (
          'PACIENTES_VISUALIZAR',
          'PACIENTES_CRIAR', 
          'PACIENTES_EDITAR_BASICO',
          'PACIENTES_EDITAR_COMPLETO',
          'PACIENTES_EXCLUIR',
          'PACIENTES_PRONTUARIO_VISUALIZAR',
          'PACIENTES_PRONTUARIO_EDITAR',
          'AGENDAMENTOS_VISUALIZAR',
          'AGENDAMENTOS_CRIAR',
          'AGENDAMENTOS_EDITAR', 
          'AGENDAMENTOS_CANCELAR',
          'AGENDAMENTOS_REAGENDAR',
          'AGENDAMENTOS_OUTROS_MEDICOS',
          'FINANCEIRO_VISUALIZAR',
          'FINANCEIRO_CRIAR',
          'FINANCEIRO_EDITAR',
          'FINANCEIRO_RELATORIOS',
          'FINANCEIRO_EXCLUIR',
          'ESTOQUE_VISUALIZAR',
          'ESTOQUE_CRIAR',
          'ESTOQUE_EDITAR',
          'ESTOQUE_MOVIMENTAR',
          'ESTOQUE_RELATORIOS',
          'USUARIOS_VISUALIZAR',
          'USUARIOS_CRIAR',
          'USUARIOS_EDITAR',
          'USUARIOS_EXCLUIR',
          'RELATORIOS_GERAL',
          'RELATORIOS_FINANCEIRO',
          'RELATORIOS_ESTOQUE',
          'RELATORIOS_PRODUTIVIDADE',
          'SISTEMA_CONFIGURAR',
          'SISTEMA_AUDITORIA',
          'SISTEMA_BACKUP'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Criar enum EspecialidadeMedica se não existir
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "EspecialidadeMedica" AS ENUM (
          'GINECOLOGISTA',
          'ORTOMOLECULAR', 
          'CARDIOLOGIA',
          'NUTRICIONISTA',
          'BIOMEDICA',
          'ESTETICA'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Adicionar novos valores ao enum UserRole
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'NUTRICIONISTA';
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TECNICO_ENFERMAGEM';
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'RECEPCAO';
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ESTETICA';
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'BIOMEDICO';
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMINISTRATIVO';
      EXCEPTION
        WHEN others THEN null;
      END $$;
    `;

    // Adicionar colunas à tabela users
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "especialidade" "EspecialidadeMedica";
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "unidadesAcesso" "Unidade"[];
      EXCEPTION
        WHEN others THEN null;
      END $$;
    `;

    // Criar tabela role_permissions se não existir
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" TEXT NOT NULL,
        "role" "UserRole" NOT NULL,
        "permissao" "PermissaoTipo" NOT NULL,
        "unidade" "Unidade" NOT NULL,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
      );
    `;

    // Criar índice único se não existir
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_permissao_unidade_key" 
        ON "role_permissions"("role", "permissao", "unidade");
      EXCEPTION
        WHEN others THEN null;
      END $$;
    `;

    // Criar tabela user_permissions se não existir
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "user_permissions" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "permissao" "PermissaoTipo" NOT NULL,
        "unidade" "Unidade" NOT NULL,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
      );
    `;

    // Criar FK para user_permissions se não existir
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "user_permissions" 
        ADD CONSTRAINT "user_permissions_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Criar índice único se não existir
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE UNIQUE INDEX IF NOT EXISTS "user_permissions_userId_permissao_unidade_key" 
        ON "user_permissions"("userId", "permissao", "unidade");
      EXCEPTION
        WHEN others THEN null;
      END $$;
    `;

    // Criar tabela access_logs se não existir
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "access_logs" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "resource" TEXT NOT NULL,
        "resourceId" TEXT,
        "unidade" "Unidade" NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "success" BOOLEAN NOT NULL DEFAULT true,
        "details" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
      );
    `;

    // Criar FK para access_logs se não existir
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "access_logs" 
        ADD CONSTRAINT "access_logs_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Criar índices para access_logs se não existirem
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE INDEX IF NOT EXISTS "access_logs_userId_createdAt_idx" 
        ON "access_logs"("userId", "createdAt");
        CREATE INDEX IF NOT EXISTS "access_logs_resource_createdAt_idx" 
        ON "access_logs"("resource", "createdAt");
      EXCEPTION
        WHEN others THEN null;
      END $$;
    `;

    console.log('✅ Tabelas de permissões criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas de permissões:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPermissionsTables();
