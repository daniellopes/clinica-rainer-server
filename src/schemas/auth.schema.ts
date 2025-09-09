import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({
    required_error: 'Email é obrigatório'
  }).email('Email inválido'),
  senha: z.string({
    required_error: 'Senha é obrigatória'
  }).min(6, 'Senha deve ter no mínimo 6 caracteres'),
  unidade: z.enum(['BARRA', 'TIJUCA'], {
    required_error: 'Unidade é obrigatória',
    invalid_type_error: 'Unidade deve ser BARRA ou TIJUCA'
  })
});

export const registerSchema = z.object({
  nome: z.string({
    required_error: 'Nome é obrigatório'
  }),
  email: z.string({
    required_error: 'Email é obrigatório'
  }).email('Email inválido'),
  senha: z.string({
    required_error: 'Senha é obrigatória'
  }).min(6, 'Senha deve ter no mínimo 6 caracteres'),
  unidade: z.enum(['BARRA', 'TIJUCA'], {
    required_error: 'Unidade é obrigatória',
    invalid_type_error: 'Unidade deve ser BARRA ou TIJUCA'
  }),
  role: z.enum(['ADMIN', 'MEDICO', 'RECEPCIONISTA', 'ESTOQUISTA', 'FINANCEIRO']).default('RECEPCIONISTA'),
  cargo: z.string().optional(),
  telefone: z.string().optional()
});

// Tipos inferidos dos schemas
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;