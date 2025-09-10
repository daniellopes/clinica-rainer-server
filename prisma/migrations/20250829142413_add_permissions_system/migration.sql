-- CreateEnum (somente se não existir)
DO $$
BEGIN
    CREATE TYPE "EspecialidadeMedica" AS ENUM (
        'GINECOLOGISTA', 'ORTOMOLECULAR', 'CARDIOLOGIA',
        'NUTRICIONISTA', 'BIOMEDICA', 'ESTETICA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END$$;

DO $$
BEGIN
    CREATE TYPE "PermissaoTipo" AS ENUM (
        'PACIENTES_VISUALIZAR','PACIENTES_CRIAR','PACIENTES_EDITAR_BASICO',
        'PACIENTES_EDITAR_COMPLETO','PACIENTES_EXCLUIR','PACIENTES_PRONTUARIO_VISUALIZAR',
        'PACIENTES_PRONTUARIO_EDITAR','AGENDAMENTOS_VISUALIZAR','AGENDAMENTOS_CRIAR',
        'AGENDAMENTOS_EDITAR','AGENDAMENTOS_CANCELAR','AGENDAMENTOS_REAGENDAR',
        'AGENDAMENTOS_OUTROS_MEDICOS','FINANCEIRO_VISUALIZAR','FINANCEIRO_CRIAR',
        'FINANCEIRO_EDITAR','FINANCEIRO_RELATORIOS','FINANCEIRO_EXCLUIR',
        'ESTOQUE_VISUALIZAR','ESTOQUE_CRIAR','ESTOQUE_EDITAR','ESTOQUE_MOVIMENTAR',
        'ESTOQUE_RELATORIOS','USUARIOS_VISUALIZAR','USUARIOS_CRIAR','USUARIOS_EDITAR',
        'USUARIOS_EXCLUIR','RELATORIOS_GERAL','RELATORIOS_FINANCEIRO','RELATORIOS_ESTOQUE',
        'RELATORIOS_PRODUTIVIDADE','SISTEMA_CONFIGURAR','SISTEMA_AUDITORIA','SISTEMA_BACKUP'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END$$;

-- AlterEnum UserRole (seguro contra valores antigos)
DO $$
BEGIN
    CREATE TYPE "UserRole_new" AS ENUM (
        'ADMIN','MEDICO','NUTRICIONISTA','TECNICO_ENFERMAGEM',
        'RECEPCAO','ESTETICA','BIOMEDICO','ADMINISTRATIVO','FINANCEIRO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END$$;

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");

-- Troca dos enums antigos
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'RECEPCAO';

-- AlterTable users
ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "especialidade" "EspecialidadeMedica",
    ADD COLUMN IF NOT EXISTS "unidadesAcesso" "Unidade"[];

-- CreateTables com IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" TEXT PRIMARY KEY,
    "role" "UserRole" NOT NULL,
    "permissao" "PermissaoTipo" NOT NULL,
    "unidade" "Unidade" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_permissions" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permissao" "PermissaoTipo" NOT NULL,
    "unidade" "Unidade" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "access_logs" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "unidade" "Unidade" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes com IF NOT EXISTS
CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_permissao_unidade_key"
    ON "role_permissions"("role", "permissao", "unidade");

CREATE UNIQUE INDEX IF NOT EXISTS "user_permissions_userId_permissao_unidade_key"
    ON "user_permissions"("userId", "permissao", "unidade");

CREATE INDEX IF NOT EXISTS "access_logs_userId_createdAt_idx"
    ON "access_logs"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "access_logs_resource_createdAt_idx"
    ON "access_logs"("resource", "createdAt");

-- Foreign keys (seguro contra duplicação)
ALTER TABLE "user_permissions"
    ADD CONSTRAINT IF NOT EXISTS "user_permissions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_logs"
    ADD CONSTRAINT IF NOT EXISTS "access_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
