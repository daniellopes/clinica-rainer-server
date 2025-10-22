import { z } from 'zod';

export const repasseItemSchema = z.object({
  tipo: z.enum(['procedimento', 'produto']),
  itemId: z.string(),
  itemNome: z.string(),
  valorBase: z.number(),
  percentualProcedimento: z.number(),
  valorProcedimento: z.number(),
  percentualProduto: z.number(),
  valorProduto: z.number(),
  flagIndividual: z.array(z.string()).default([]),
});

export const createRepasseSchema = z.object({
  medico: z.string().min(1, 'Médico é obrigatório'),
  grupo: z.string().min(1, 'Grupo é obrigatório'),
  dataRepasse: z.string(),
  observacoes: z.string().optional(),
  status: z.enum(["pendente", "pago", "cancelado"]).default("pendente"),
  itens: z.array(repasseItemSchema).min(1, 'Adicione pelo menos um item'),
});
