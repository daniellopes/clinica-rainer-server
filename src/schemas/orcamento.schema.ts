import { z } from 'zod';

export const orcamentoItemSchema = z.object({
  tipo: z.enum(['procedimento', 'produto']),
  itemId: z.string(),
  itemNome: z.string(),
  quantidade: z.number().min(1),
  valorUnitario: z.number().min(0),
  valorTotal: z.number().min(0)
});

export const createOrcamentoSchema = z.object({
  profissional: z.string().min(1),
  paciente: z.string().min(1),
  observacoes: z.string().optional(),
  itens: z.array(orcamentoItemSchema).nonempty()
});
