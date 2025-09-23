import { z } from 'zod';

// Schema para criação de procedimento
export const createProcedureSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),

  preco: z
    .number()
    .positive('Preço deve ser maior que zero')
    .max(99999.99, 'Preço muito alto'),

  duracao: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(5, 'Duração mínima de 5 minutos')
    .max(480, 'Duração máxima de 8 horas'),

  categoria: z.string().min(2, 'Categoria é obrigatória'),

  especialidades: z
    .array(z.string().min(2, 'Especialidade deve ter pelo menos 2 caracteres'))
    .optional()
    .default([]),

  ativo: z.boolean().optional().default(true),
});

// Schema para atualização (todos os campos opcionais)
export const updateProcedureSchema = createProcedureSchema.partial().extend({
  id: z.string().uuid('ID inválido').optional(),
});

// Schema para listagem com filtros
export const listProceduresSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  search: z.string().optional(),
  categoria: z.string().optional(),
  ativo: z
    .string()
    .optional()
    .transform((val) =>
      val === 'true' ? true : val === 'false' ? false : undefined,
    ),
  orderBy: z
    .enum(['nome', 'preco', 'duracao', 'categoria', 'createdAt'])
    .optional()
    .default('nome'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Schema para busca por ID
export const getProcedureByIdSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// Schema para busca por categoria
export const getProceduresByCategorySchema = z.object({
  categoria: z.string().min(1, 'Categoria é obrigatória'),
});

// Tipos TypeScript derivados dos schemas
export type CreateProcedureData = z.infer<typeof createProcedureSchema>;
export type UpdateProcedureData = z.infer<typeof updateProcedureSchema>;
export type ListProceduresQuery = z.infer<typeof listProceduresSchema>;
export type GetProcedureByIdParams = z.infer<typeof getProcedureByIdSchema>;
export type GetProceduresByCategoryParams = z.infer<
  typeof getProceduresByCategorySchema
>;
