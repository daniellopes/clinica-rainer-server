import { z } from 'zod';

// Enum para especialidades de template
export const especialidadeTemplateEnum = z.enum([
  'ESTETICA',
  'DERMATOLOGIA', 
  'CIRURGIA',
  'NUTRICIONISTA',
  'BIOMEDICA',
  'ORTOMOLECULAR',
]);

// Schema para criação de template de receita
export const createRecipeTemplateSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),

  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),

  conteudo: z
    .string()
    .min(10, 'Conteúdo deve ter pelo menos 10 caracteres')
    .max(10000, 'Conteúdo deve ter no máximo 10000 caracteres'),

  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),

  especialidade: especialidadeTemplateEnum.optional(),
});

// Schema para atualização de template (todos os campos opcionais)
export const updateRecipeTemplateSchema = createRecipeTemplateSchema.partial();

// Schema para listagem com filtros
export const listRecipeTemplatesSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  search: z.string().optional(),
  especialidade: especialidadeTemplateEnum.optional(),
  ativo: z
    .string()
    .optional()
    .transform((val) =>
      val === 'true' ? true : val === 'false' ? false : undefined,
    ),
  orderBy: z
    .enum(['nome', 'especialidade', 'createdAt', 'updatedAt'])
    .optional()
    .default('nome'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Schema para busca por ID
export const getRecipeTemplateByIdSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// Tipos TypeScript derivados dos schemas
export type CreateRecipeTemplateData = z.infer<typeof createRecipeTemplateSchema>;
export type UpdateRecipeTemplateData = z.infer<typeof updateRecipeTemplateSchema>;
export type ListRecipeTemplatesQuery = z.infer<typeof listRecipeTemplatesSchema>;
export type GetRecipeTemplateByIdParams = z.infer<typeof getRecipeTemplateByIdSchema>;
export type EspecialidadeTemplate = z.infer<typeof especialidadeTemplateEnum>;
