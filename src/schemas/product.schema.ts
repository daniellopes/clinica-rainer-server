import { z } from 'zod';

// Schema para criação de produto
export const createProductSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),

  categoria: z
    .string()
    .min(2, 'Categoria é obrigatória')
    .max(50, 'Categoria deve ter no máximo 50 caracteres')
    .optional(),

  codigoBarras: z
    .string()
    .max(50, 'Código de barras deve ter no máximo 50 caracteres')
    .optional(),

  fabricante: z
    .string()
    .max(100, 'Fabricante deve ter no máximo 100 caracteres')
    .optional(),

  estoqueMinimo: z
    .number()
    .int('Estoque mínimo deve ser um número inteiro')
    .min(0, 'Estoque mínimo não pode ser negativo')
    .default(0),

  localizacao: z
    .string()
    .max(100, 'Localização deve ter no máximo 100 caracteres')
    .optional(),

  precoCusto: z
    .number()
    .positive('Preço de custo deve ser maior que zero')
    .max(999999.99, 'Preço de custo muito alto')
    .optional(),

  precoVenda: z
    .number()
    .positive('Preço de venda deve ser maior que zero')
    .max(999999.99, 'Preço de venda muito alto')
    .optional(),

  ativo: z.boolean().optional().default(true),
});

// Schema para atualização (todos os campos opcionais)
export const updateProductSchema = createProductSchema.partial();

// Schema para listagem com filtros
export const listProductsSchema = z.object({
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
  estoqueMinimo: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  orderBy: z
    .enum([
      'nome',
      'categoria',
      'estoqueAtual',
      'precoCusto',
      'precoVenda',
      'createdAt',
    ])
    .optional()
    .default('nome'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Schema para busca por ID
export const getProductByIdSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

// Schema para busca por código de barras
export const getProductByBarcodeSchema = z.object({
  codigoBarras: z.string().min(1, 'Código de barras é obrigatório'),
});

// Schema para ajuste de estoque
export const adjustStockSchema = z.object({
  quantidade: z.number().int('Quantidade deve ser um número inteiro'),
  motivo: z.string().min(3, 'Motivo é obrigatório'),
  observacoes: z
    .string()
    .max(200, 'Observações devem ter no máximo 200 caracteres')
    .optional(),
});

// Tipos TypeScript derivados dos schemas
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsSchema>;
export type GetProductByIdParams = z.infer<typeof getProductByIdSchema>;
export type GetProductByBarcodeParams = z.infer<
  typeof getProductByBarcodeSchema
>;
export type AdjustStockData = z.infer<typeof adjustStockSchema>;
