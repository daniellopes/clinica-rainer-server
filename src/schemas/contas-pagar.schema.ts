import { z } from 'zod';

export const createContaPagarSchema = z.object({
  fornecedor: z.string().min(1, 'Fornecedor é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  categoria: z.string().optional(),
  valor: z.number().positive('Valor deve ser maior que zero'),
  dataVencimento: z.string().or(z.date()),
  dataPagamento: z.string().or(z.date()).optional(),
  status: z.enum(['PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).default('PENDENTE'),
  formaPagamento: z.string().optional(),
  observacoes: z.string().optional(),
  numeroNota: z.string().optional(),
});

export const updateContaPagarSchema = createContaPagarSchema.partial();

