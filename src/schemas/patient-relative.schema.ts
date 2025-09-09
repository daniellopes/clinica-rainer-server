import { z } from 'zod';

// Enum para tipos de relacionamento
export const TipoRelacionamentoEnum = z.enum([
  'PAI',
  'MAE', 
  'RESPONSAVEL_LEGAL',
  'CONJUGE',
  'FILHO',
  'FILHA',
  'IRMAO',
  'IRMA',
  'AVO',
  'AVA',
  'TIO',
  'TIA',
  'PRIMO',
  'PRIMA',
  'AMIGO',
  'CUIDADOR',
  'OUTRO'
]);

// Schema para criar dependente/responsável
export const createPatientRelativeSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  parentesco: TipoRelacionamentoEnum,
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  nascimento: z.string().optional(), // Será convertido para Date no controller
  profissao: z.string().optional(),
  isResponsavel: z.boolean().default(false),
  isDependente: z.boolean().default(false),
  isContatoEmergencia: z.boolean().default(false),
  observacoes: z.string().optional()
});

// Schema para atualizar dependente/responsável
export const updatePatientRelativeSchema = createPatientRelativeSchema.partial();

// Schema para listar dependentes/responsáveis
export const listPatientRelativesSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  tipo: z.enum(['dependentes', 'responsaveis', 'todos']).optional()
});

// Schema para parâmetros de rota
export const patientRelativeParamsSchema = z.object({
  id: z.string().uuid('ID do paciente deve ser um UUID válido'),
  relativeId: z.string().uuid('ID do dependente/responsável deve ser um UUID válido').optional()
});

// Tipos TypeScript
export type CreatePatientRelativeData = z.infer<typeof createPatientRelativeSchema>;
export type UpdatePatientRelativeData = z.infer<typeof updatePatientRelativeSchema>;
export type ListPatientRelativesQuery = z.infer<typeof listPatientRelativesSchema>;
export type PatientRelativeParams = z.infer<typeof patientRelativeParamsSchema>;
export type TipoRelacionamento = z.infer<typeof TipoRelacionamentoEnum>;

// Labels para os tipos de relacionamento
export const relacionamentoLabels: Record<TipoRelacionamento, string> = {
  PAI: 'Pai',
  MAE: 'Mãe',
  RESPONSAVEL_LEGAL: 'Responsável Legal',
  CONJUGE: 'Cônjuge',
  FILHO: 'Filho',
  FILHA: 'Filha',
  IRMAO: 'Irmão',
  IRMA: 'Irmã',
  AVO: 'Avô',
  AVA: 'Avó',
  TIO: 'Tio',
  TIA: 'Tia',
  PRIMO: 'Primo',
  PRIMA: 'Prima',
  AMIGO: 'Amigo',
  CUIDADOR: 'Cuidador',
  OUTRO: 'Outro'
};
