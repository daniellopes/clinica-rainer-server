const { createPatientSchema } = require('../src/schemas/patient.schema');

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
  const result = createPatientSchema.parse(testData);
  console.log('✅ Validação passou!');
} catch (error) {
  console.error('❌ Erro de validação:');
  error.errors.forEach((err, index) => {
    console.error(`${index + 1}. Campo: ${err.path.join('.')}`);
    console.error(`   Erro: ${err.message}`);
    console.error(`   Valor recebido: ${err.received}`);
    console.error('');
  });
}
