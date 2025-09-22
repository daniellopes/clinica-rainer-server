/*
  Warnings:

  - The values [RECEPCIONISTA,ESTOQUISTA] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "EspecialidadeMedica" AS ENUM ('GINECOLOGISTA', 'ORTOMOLECULAR', 'CARDIOLOGIA', 'NUTRICIONISTA', 'BIOMEDICA', 'ESTETICA');

-- CreateEnum
CREATE TYPE "PermissaoTipo" AS ENUM ('PACIENTES_VISUALIZAR', 'PACIENTES_CRIAR', 'PACIENTES_EDITAR_BASICO', 'PACIENTES_EDITAR_COMPLETO', 'PACIENTES_EXCLUIR', 'PACIENTES_PRONTUARIO_VISUALIZAR', 'PACIENTES_PRONTUARIO_EDITAR', 'AGENDAMENTOS_VISUALIZAR', 'AGENDAMENTOS_CRIAR', 'AGENDAMENTOS_EDITAR', 'AGENDAMENTOS_CANCELAR', 'AGENDAMENTOS_REAGENDAR', 'AGENDAMENTOS_OUTROS_MEDICOS', 'FINANCEIRO_VISUALIZAR', 'FINANCEIRO_CRIAR', 'FINANCEIRO_EDITAR', 'FINANCEIRO_RELATORIOS', 'FINANCEIRO_EXCLUIR', 'ESTOQUE_VISUALIZAR', 'ESTOQUE_CRIAR', 'ESTOQUE_EDITAR', 'ESTOQUE_MOVIMENTAR', 'ESTOQUE_RELATORIOS', 'USUARIOS_VISUALIZAR', 'USUARIOS_CRIAR', 'USUARIOS_EDITAR', 'USUARIOS_EXCLUIR', 'RELATORIOS_GERAL', 'RELATORIOS_FINANCEIRO', 'RELATORIOS_ESTOQUE', 'RELATORIOS_PRODUTIVIDADE', 'SISTEMA_CONFIGURAR', 'SISTEMA_AUDITORIA', 'SISTEMA_BACKUP');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'MEDICO', 'NUTRICIONISTA', 'TECNICO_ENFERMAGEM', 'RECEPCAO', 'ESTETICA', 'BIOMEDICO', 'ADMINISTRATIVO', 'FINANCEIRO');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "role_permissions" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'RECEPCAO';
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "especialidade" "EspecialidadeMedica",
ADD COLUMN     "unidadesAcesso" "Unidade"[],
ALTER COLUMN "role" SET DEFAULT 'RECEPCAO';

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissao" "PermissaoTipo" NOT NULL,
    "unidade" "Unidade" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissao" "PermissaoTipo" NOT NULL,
    "unidade" "Unidade" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
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

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissao_unidade_key" ON "role_permissions"("role", "permissao", "unidade");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissao_unidade_key" ON "user_permissions"("userId", "permissao", "unidade");

-- CreateIndex
CREATE INDEX "access_logs_userId_createdAt_idx" ON "access_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "access_logs_resource_createdAt_idx" ON "access_logs"("resource", "createdAt");

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
