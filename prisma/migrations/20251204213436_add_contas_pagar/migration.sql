-- CreateTable
CREATE TABLE "contas_pagar" (
    "id" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusFinanceiro" NOT NULL DEFAULT 'PENDENTE',
    "formaPagamento" TEXT,
    "observacoes" TEXT,
    "numeroNota" TEXT,
    "unidade" "Unidade" NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_pagar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contas_pagar_unidade_status_idx" ON "contas_pagar"("unidade", "status");

-- CreateIndex
CREATE INDEX "contas_pagar_dataVencimento_idx" ON "contas_pagar"("dataVencimento");

-- AddForeignKey
ALTER TABLE "contas_pagar" ADD CONSTRAINT "contas_pagar_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

