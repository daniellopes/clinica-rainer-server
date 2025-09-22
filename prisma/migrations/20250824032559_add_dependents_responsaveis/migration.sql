/*
  Warnings:

  - Changed the type of `parentesco` on the `patient_relatives` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TipoRelacionamento" AS ENUM ('PAI', 'MAE', 'RESPONSAVEL_LEGAL', 'CONJUGE', 'FILHO', 'FILHA', 'IRMAO', 'IRMA', 'AVO', 'AVA', 'TIO', 'TIA', 'PRIMO', 'PRIMA', 'AMIGO', 'CUIDADOR', 'OUTRO');

-- AlterTable
ALTER TABLE "patient_relatives" ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "isContatoEmergencia" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDependente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isResponsavel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nascimento" TIMESTAMP(3),
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "profissao" TEXT,
ADD COLUMN     "rg" TEXT,
DROP COLUMN "parentesco",
ADD COLUMN     "parentesco" "TipoRelacionamento" NOT NULL;
