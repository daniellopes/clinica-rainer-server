/*
  Warnings:

  - You are about to drop the column `path` on the `patient_documents` table. All the data in the column will be lost.
  - Added the required column `data` to the `patient_documents` table without a default value. This is not possible if the table is not empty.

*/

-- Deletar registros existentes pois não temos mais os arquivos físicos
DELETE FROM "patient_documents";

-- AlterTable
ALTER TABLE "patient_documents" DROP COLUMN "path",
ADD COLUMN     "data" BYTEA NOT NULL;
