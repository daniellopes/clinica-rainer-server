/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Unidade" AS ENUM ('BARRA', 'TIJUCA');

-- CreateEnum
CREATE TYPE "StatusPaciente" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "SexoPaciente" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMAR');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'FALTOU');

-- CreateEnum
CREATE TYPE "StatusConsulta" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "StatusFinanceiro" AS ENUM ('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RECEPCIONISTA',
    "unidade" "Unidade" NOT NULL,
    "cargo" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeSocial" TEXT,
    "nascimento" TIMESTAMP(3) NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "sexo" "SexoPaciente",
    "foto" TEXT,
    "prontuario" TEXT NOT NULL,
    "altura" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "telefone" TEXT NOT NULL,
    "telefone2" TEXT,
    "celular" TEXT,
    "email" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "pais" TEXT,
    "profissao" TEXT,
    "naturalidade" TEXT,
    "nacionalidade" TEXT,
    "origem" TEXT,
    "religiao" TEXT,
    "corPele" TEXT,
    "escolaridade" TEXT,
    "estadoCivil" TEXT,
    "cns" TEXT,
    "prioridade" TEXT,
    "corIdentificacao" TEXT,
    "estrangeiro" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "status" "StatusPaciente" NOT NULL DEFAULT 'ATIVO',
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_insurances" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "convenio" TEXT NOT NULL,
    "plano" TEXT,
    "matricula" TEXT,
    "tokenCarteirinha" TEXT,
    "validade" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_relatives" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_relatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "codigoBarras" TEXT,
    "fabricante" TEXT,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 0,
    "estoqueAtual" INTEGER NOT NULL DEFAULT 0,
    "localizacao" TEXT,
    "precoCusto" DOUBLE PRECISION,
    "precoVenda" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_batches" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "validade" TIMESTAMP(3),
    "quantidade" INTEGER NOT NULL,
    "precoCusto" DOUBLE PRECISION,
    "fornecedor" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "tipo" "TipoMovimentacao" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT,
    "observacoes" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedures" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "duracao" INTEGER,
    "valor" DOUBLE PRECISION,
    "especialidades" TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "medicoId" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracao" INTEGER,
    "observacoes" TEXT,
    "tipoAgendamento" TEXT,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'AGENDADO',
    "motivoCancelamento" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "dataConfirmacao" TIMESTAMP(3),
    "criadoPorId" TEXT NOT NULL,
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "patientId" TEXT NOT NULL,
    "procedureId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "dataConsulta" TIMESTAMP(3) NOT NULL,
    "queixaPrincipal" TEXT,
    "historiaDoenca" TEXT,
    "exameFisico" TEXT,
    "hipoteseDiagnostica" TEXT,
    "conduta" TEXT,
    "observacoes" TEXT,
    "status" "StatusConsulta" NOT NULL DEFAULT 'AGENDADA',
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_templates" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "especialidade" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "templateId" TEXT,
    "conteudo" TEXT NOT NULL,
    "observacoes" TEXT,
    "impressa" BOOLEAN NOT NULL DEFAULT false,
    "dataImpressao" TIMESTAMP(3),
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_forms" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "especialidade" TEXT,
    "campos" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anamnesis_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anamnesis_responses" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "respostas" JSONB NOT NULL,
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anamnesis_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoTransacao" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusFinanceiro" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "unidade" "Unidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "patients_prontuario_key" ON "patients"("prontuario");

-- CreateIndex
CREATE INDEX "products_unidade_ativo_idx" ON "products"("unidade", "ativo");

-- CreateIndex
CREATE INDEX "products_estoqueAtual_idx" ON "products"("estoqueAtual");

-- CreateIndex
CREATE INDEX "product_batches_validade_idx" ON "product_batches"("validade");

-- CreateIndex
CREATE UNIQUE INDEX "product_batches_productId_lote_key" ON "product_batches"("productId", "lote");

-- CreateIndex
CREATE INDEX "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_unidade_createdAt_idx" ON "stock_movements"("unidade", "createdAt");

-- CreateIndex
CREATE INDEX "procedures_unidade_ativo_idx" ON "procedures"("unidade", "ativo");

-- CreateIndex
CREATE INDEX "appointments_unidade_status_idx" ON "appointments"("unidade", "status");

-- CreateIndex
CREATE INDEX "appointments_dataHora_idx" ON "appointments"("dataHora");

-- CreateIndex
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");

-- CreateIndex
CREATE INDEX "appointments_medicoId_idx" ON "appointments"("medicoId");

-- CreateIndex
CREATE UNIQUE INDEX "consultations_appointmentId_key" ON "consultations"("appointmentId");

-- CreateIndex
CREATE INDEX "consultations_unidade_idx" ON "consultations"("unidade");

-- CreateIndex
CREATE INDEX "consultations_dataConsulta_idx" ON "consultations"("dataConsulta");

-- CreateIndex
CREATE INDEX "consultations_patientId_idx" ON "consultations"("patientId");

-- CreateIndex
CREATE INDEX "consultations_medicoId_idx" ON "consultations"("medicoId");

-- CreateIndex
CREATE INDEX "recipe_templates_unidade_ativo_idx" ON "recipe_templates"("unidade", "ativo");

-- CreateIndex
CREATE INDEX "recipes_consultationId_idx" ON "recipes"("consultationId");

-- CreateIndex
CREATE INDEX "anamnesis_forms_unidade_ativo_idx" ON "anamnesis_forms"("unidade", "ativo");

-- CreateIndex
CREATE INDEX "anamnesis_responses_consultationId_idx" ON "anamnesis_responses"("consultationId");

-- CreateIndex
CREATE INDEX "transactions_unidade_status_idx" ON "transactions"("unidade", "status");

-- CreateIndex
CREATE INDEX "transactions_dataVencimento_idx" ON "transactions"("dataVencimento");

-- CreateIndex
CREATE INDEX "transactions_patientId_idx" ON "transactions"("patientId");

-- AddForeignKey
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_relatives" ADD CONSTRAINT "patient_relatives_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "product_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_procedureId_fkey" FOREIGN KEY ("procedureId") REFERENCES "procedures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "recipe_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_responses" ADD CONSTRAINT "anamnesis_responses_formId_fkey" FOREIGN KEY ("formId") REFERENCES "anamnesis_forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anamnesis_responses" ADD CONSTRAINT "anamnesis_responses_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
