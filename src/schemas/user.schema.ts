import { z } from 'zod';

export const createUserSchema = z.object({
  nome: z.string({
    required_error: 'Nome é obrigatório',
  }),
  email: z
    .string({
      required_error: 'Email é obrigatório',
    })
    .email('Email inválido'),
  senha: z
    .string({
      required_error: 'Senha é obrigatória',
    })
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z
    .enum(['ADMIN', 'MEDICO', 'RECEPCIONISTA', 'ESTOQUISTA', 'FINANCEIRO'])
    .default('RECEPCIONISTA'),
  cargo: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  especialidade: z
    .enum([
      'GINECOLOGISTA',
      'ORTOMOLECULAR',
      'CARDIOLOGIA',
      'NUTRICIONISTA',
      'BIOMEDICA',
      'ESTETICA',
    ])
    .nullable()
    .optional(),
  unidadesAcesso: z
    .array(z.enum(['BARRA', 'TIJUCA']))
    .nullable()
    .optional(),
  permissoesEspecificas: z.array(z.string()).nullable().optional(),
});

export const updateUserSchema = z.object({
  nome: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  role: z
    .enum(['ADMIN', 'MEDICO', 'RECEPCIONISTA', 'ESTOQUISTA', 'FINANCEIRO'])
    .optional(),
  cargo: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  ativo: z.boolean().optional(),
  especialidade: z
    .enum([
      'GINECOLOGISTA',
      'ORTOMOLECULAR',
      'CARDIOLOGIA',
      'NUTRICIONISTA',
      'BIOMEDICA',
      'ESTETICA',
    ])
    .nullable()
    .optional(),
  unidadesAcesso: z
    .array(z.enum(['BARRA', 'TIJUCA']))
    .nullable()
    .optional(),
  permissoesEspecificas: z.array(z.string()).nullable().optional(),
});

// Tipos inferidos dos schemas
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
