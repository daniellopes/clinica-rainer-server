import { z } from 'zod';

// Schema para criação de receita
export const createRecipeSchema = z.object({
  consultationId: z
    .string()
    .uuid('ID da consulta inválido')
    .min(1, 'ID da consulta é obrigatório'),

  templateId: z
    .string()
    .uuid('ID do template inválido')
    .optional(),

  conteudo: z
    .string()
    .min(10, 'Conteúdo da receita deve ter pelo menos 10 caracteres')
    .max(5000, 'Conteúdo da receita deve ter no máximo 5000 caracteres'),

  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
});

// Schema para atualização de receita
export const updateRecipeSchema = z.object({
  conteudo: z
    .string()
    .min(10, 'Conteúdo da receita deve ter pelo menos 10 caracteres')
    .max(5000, 'Conteúdo da receita deve ter no máximo 5000 caracteres')
    .optional(),

  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
});

// Schema para criação de template de receita (DEPRECATED - usar recipe-template.schema.ts)
export const createRecipeTemplateSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome do template deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do template deve ter no máximo 100 caracteres'),

  conteudo: z
    .string()
    .min(10, 'Conteúdo deve ter pelo menos 10 caracteres')
    .max(5000, 'Conteúdo deve ter no máximo 5000 caracteres'),

  especialidade: z
    .string()
    .max(50, 'Especialidade deve ter no máximo 50 caracteres')
    .optional(),
});

// Schema para atualização de template de receita
export const updateRecipeTemplateSchema = createRecipeTemplateSchema.partial();

// Schema para busca por ID
export const getRecipeByIdSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// Schema para busca por consulta
export const getRecipesByConsultationSchema = z.object({
  consultationId: z.string().uuid('ID da consulta inválido'),
});

// Tipos TypeScript derivados dos schemas
export type CreateRecipeData = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeData = z.infer<typeof updateRecipeSchema>;
export type CreateRecipeTemplateData = z.infer<typeof createRecipeTemplateSchema>;
export type UpdateRecipeTemplateData = z.infer<typeof updateRecipeTemplateSchema>;
export type GetRecipeByIdParams = z.infer<typeof getRecipeByIdSchema>;
export type GetRecipesByConsultationParams = z.infer<typeof getRecipesByConsultationSchema>;
