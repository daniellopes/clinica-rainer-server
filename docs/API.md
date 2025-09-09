# Documentação da API - Clínica Rainer

## Visão Geral

A API da Clínica Rainer é uma REST API desenvolvida em Node.js com Express e TypeScript, utilizando Prisma como ORM para PostgreSQL.

**Base URL**: `http://localhost:3001/api`

## Autenticação

Todas as rotas protegidas requerem um token JWT no header:

```
Authorization: Bearer <token>
```

### Login

**POST** `/auth/login`

```json
{
  "email": "admin@barra.com",
  "senha": "123456",
  "unidade": "BARRA"
}
```

**Resposta:**
```json
{
  "message": "Login realizado com sucesso",
  "user": {
    "id": "uuid",
    "nome": "Admin Barra",
    "email": "admin@barra.com",
    "role": "ADMIN",
    "unidade": "BARRA"
  },
  "token": "jwt_token"
}
```

## Endpoints Principais

### Pacientes

#### Listar Pacientes
**GET** `/patients`

Query Parameters:
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `search`: Busca por nome, email ou CPF
- `unidade`: Filtro por unidade

#### Criar Paciente
**POST** `/patients`

```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "cpf": "12345678901",
  "telefone": "(21) 99999-9999",
  "data_nascimento": "1990-01-01",
  "endereco": {
    "rua": "Rua das Flores, 123",
    "bairro": "Centro",
    "cidade": "Rio de Janeiro",
    "cep": "20000-000"
  },
  "unidade": "BARRA"
}
```

#### Buscar Paciente
**GET** `/patients/:id`

#### Atualizar Paciente
**PUT** `/patients/:id`

#### Deletar Paciente
**DELETE** `/patients/:id`

### Anamnese

#### Listar Templates de Anamnese
**GET** `/anamnese/forms`

Query Parameters:
- `unidade`: Filtro por unidade
- `especialidade`: Filtro por especialidade
- `ativo`: Filtro por status ativo

#### Criar Template de Anamnese
**POST** `/anamnese/templates`

```json
{
  "nome": "Anamnese Dermatológica",
  "descricao": "Formulário para consultas dermatológicas",
  "especialidade": "DERMATOLOGIA",
  "campos": {
    "sections": [
      {
        "title": "Dados Pessoais",
        "fields": [
          {
            "id": "idade",
            "type": "number",
            "label": "Idade",
            "required": true
          }
        ]
      }
    ]
  },
  "unidade": "BARRA"
}
```

#### Duplicar Template
**POST** `/anamnese/templates/:id/duplicate`

#### Criar Resposta de Anamnese
**POST** `/anamnese`

```json
{
  "formId": "uuid-do-template",
  "consultationId": "uuid-da-consulta",
  "respostas": {
    "idade": 30,
    "sintomas": "Dor de cabeça frequente",
    "medicamentos": ["Paracetamol", "Ibuprofeno"]
  },
  "unidade": "BARRA"
}
```

### Usuários

#### Listar Usuários
**GET** `/users`

#### Criar Usuário
**POST** `/users`

```json
{
  "nome": "Dr. João Silva",
  "email": "joao@clinica.com",
  "senha": "senha123",
  "role": "MEDICO",
  "cargo": "Dermatologista",
  "telefone": "(21) 99999-9999",
  "unidade": "BARRA"
}
```

#### Atualizar Usuário
**PUT** `/users/:id`

#### Desativar Usuário
**DELETE** `/users/:id`

### Consultas

#### Listar Consultas
**GET** `/consultations`

#### Criar Consulta
**POST** `/consultations`

#### Buscar Consulta
**GET** `/consultations/:id`

### Agendamentos

#### Listar Agendamentos
**GET** `/appointments`

#### Criar Agendamento
**POST** `/appointments`

### Estoque

#### Listar Produtos
**GET** `/products`

#### Movimentações de Estoque
**GET** `/stock/movements`

**POST** `/stock/movements`

### Financeiro

#### Listar Transações
**GET** `/transactions`

#### Criar Transação
**POST** `/transactions`

## Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autorizado
- `403` - Acesso negado
- `404` - Não encontrado
- `409` - Conflito (ex: email já existe)
- `500` - Erro interno do servidor

## Rate Limiting

- **Login**: 5 tentativas por 15 minutos
- **API Geral**: 100 requisições por 15 minutos por IP

## Validação

Todos os endpoints utilizam validação com Zod. Erros de validação retornam:

```json
{
  "error": "Dados inválidos",
  "details": [
    {
      "field": "email",
      "message": "Email é obrigatório"
    }
  ]
}
```

## Paginação

Endpoints que retornam listas suportam paginação:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Filtros e Busca

Muitos endpoints suportam filtros via query parameters:

- `search`: Busca textual
- `unidade`: Filtro por unidade (BARRA, TIJUCA)
- `ativo`: Filtro por status ativo (true/false)
- `startDate` / `endDate`: Filtro por período

## Logs e Auditoria

Todas as ações importantes são registradas na tabela `AccessLog` para auditoria.

## Saúde da API

**GET** `/health`

Retorna o status da API e conexão com o banco de dados.

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```