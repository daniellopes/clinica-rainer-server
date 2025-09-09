import { z } from 'zod';

// Schema para validação de CPF
const cpfSchema = z.string().refine((cpf) => {
  // Remove caracteres não numéricos
  const cleanCpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCpf.length !== 11) return false;
  
  // Verifica se não são todos iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  // Validação do CPF (algoritmo oficial)
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return cleanCpf.charAt(9) == digit1.toString() && cleanCpf.charAt(10) == digit2.toString();
}, 'CPF inválido');

// Schema para telefone brasileiro
const phoneSchema = z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').max(15, 'Telefone deve ter no máximo 15 dígitos');

// Schema principal para criação de paciente
export const createPatientSchema = z.object({
  // Dados obrigatórios conforme requisitos do cliente
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  cpf: cpfSchema,
  telefone: phoneSchema,
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  nascimento: z.string().or(z.date()),
  
  // Dados opcionais do formulário
  nomeSocial: z.string().optional(),
  rg: z.string().optional(),
  sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMAR']).optional(),
  foto: z.string().optional().or(z.literal('')),
  prontuario: z.string().optional(), // Será gerado automaticamente se não fornecido
  
  // Dados físicos
  altura: z.union([z.number().positive(), z.string()]).optional(),
  peso: z.union([z.number().positive(), z.string()]).optional(),
  imc: z.union([z.number().positive(), z.string()]).optional(),
  
  // Contato adicional
  telefone2: z.string().optional(),
  celular: z.string().optional(),
  
  // Endereço
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  pais: z.string().optional(),
  
  // Dados pessoais adicionais
  profissao: z.string().optional(),
  naturalidade: z.string().optional(),
  nacionalidade: z.string().optional(),
  origem: z.string().optional(),
  religiao: z.string().optional(),
  corPele: z.string().optional(),
  escolaridade: z.string().optional(),
  estadoCivil: z.string().optional(),
  cns: z.string().optional(), // Cartão Nacional de Saúde
  
  // Configurações
  prioridade: z.string().optional(),
  corIdentificacao: z.string().optional(),
  estrangeiro: z.boolean().optional(),
  observacoes: z.string().optional(),
  
  // Unidade (obrigatório - baseado nos requisitos)
  unidade: z.enum(['BARRA', 'TIJUCA']),
});

// Schema para atualização (todos os campos opcionais exceto ID)
export const updatePatientSchema = createPatientSchema.partial().extend({
  id: z.string().uuid('ID inválido')
});

// Schema para listagem com filtros
export const listPatientsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  unidade: z.enum(['BARRA', 'TIJUCA']).optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']).optional(),
  orderBy: z.enum(['nome', 'nascimento', 'createdAt']).optional().default('nome'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('asc')
});

// Schema para busca por ID
export const getPatientByIdSchema = z.object({
  id: z.string().uuid('ID inválido')
});

// Tipos TypeScript derivados dos schemas
export type CreatePatientData = z.infer<typeof createPatientSchema>;
export type UpdatePatientData = z.infer<typeof updatePatientSchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsSchema>;
export type GetPatientByIdParams = z.infer<typeof getPatientByIdSchema>;
