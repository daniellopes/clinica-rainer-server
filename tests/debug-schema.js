import { z } from 'zod';

// Schema simplificado para debug
const debugSchema = z.object({
  nome: z.string().min(2),
  cpf: z.string().length(11),
  telefone: z.string().min(10).max(15),
  email: z.string().email().optional().or(z.literal('')),
  nascimento: z.string(),
  sexo: z.enum(['MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMAR']).optional(),
});

// Teste com os dados recebidos
const testData = {
  "nome": "Sergio Gabriel Soares Costa",
  "cpf": "15274363733",
  "telefone": "21976958970",
  "email": "scosta.developer@gmail.com",
  "nascimento": "1994-12-30",
  "sexo": "MASCULINO",
  "endereco": "R ZIZINHA PEREIRA",
  "numero": "66",
  "complemento": "casa",
  "bairro": "Paciência",
  "cidade": "Rio de Janeiro",
  "estado": "RJ",
  "pais": "Brasil",
  "cep": "23573-260",
  "altura": 1,
  "peso": 89,
  "imc": null,
  "observacoes": "afsfasfasf"
};

try {
  const result = debugSchema.parse(testData);
  console.log('✅ Validação passou:', result);
} catch (error) {
  console.error('❌ Erro de validação:', error);
}
