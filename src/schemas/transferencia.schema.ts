import { z } from "zod";

export const createTransferenciaSchema = z.object({
  pacienteOrigemId: z.string().uuid(),
  pacienteDestinoId: z.string().uuid(),
  pacienteOrigem: z.string().min(1),
  pacienteDestino: z.string().min(1),
  valor: z.number().positive(),
  observacoes: z.string().optional(),
});

export type CreateTransferenciaDTO = z.infer<typeof createTransferenciaSchema>;
