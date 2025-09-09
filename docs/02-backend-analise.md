# Documentação do Backend - API Clínica Rainer Moreira

## Visão Geral

O backend é uma **API REST** construída com Express.js e TypeScript, utilizando Prisma ORM para gerenciamento de banco de dados PostgreSQL. A API implementa autenticação JWT e segregação por unidades.

## Tecnologias Utilizadas

- **Framework**: Express.js
- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (jsonwebtoken)
- **Validação**: Zod
- **Segurança**: Helmet, CORS, Rate Limiting
- **Hash**: bcryptjs
- **Logs**: Morgan
- **Testes**: Jest

## Estrutura do Projeto

```
src/
├── controllers/         # Controllers da API
│   ├── AuthController.ts    # Autenticação
│   ├── PatientController.ts # Gestão de pacientes
│   ├── ProductController.ts # Gestão de produtos
│   ├── ProcedureController.ts # Gestão de procedimentos
│   └── UserController.ts    # Gestão de usuários
├── middlewares/        # Middlewares
│   └── errorHandler.ts # Tratamento de erros
├── routes/            # Definição de rotas
│   └── index.ts       # Centralizador de rotas
├── schemas/           # Schemas de validação Zod
│   ├── product.schema.ts
│   └── procedure.schema.ts
├── scripts/           # Scripts utilitários
├── utils/             # Utilitários
└── server.ts          # Configuração do servidor
```

## Modelo de Dados (Prisma Schema)

### Enums Definidos
```prisma
enum UserRole {
  ADMIN
  MANAGER
  DOCTOR
  NURSE
  RECEPTIONIST
}

enum Unidade {
  UNIDADE_1
  UNIDADE_2
  UNIDADE_3
}

enum StatusPaciente {
  ATIVO
  INATIVO
  BLOQUEADO
}

enum SexoPaciente {
  MASCULINO
  FEMININO
  OUTRO
}

enum TipoMovimentacao {
  ENTRADA
  SAIDA
  AJUSTE
  TRANSFERENCIA
}

enum StatusAgendamento {
  AGENDADO
  CONFIRMADO
  EM_ANDAMENTO
  CONCLUIDO
  CANCELADO
  FALTOU
}

enum StatusConsulta {
  AGENDADA
  EM_ANDAMENTO
  CONCLUIDA
  CANCELADA
}

enum TipoTransacao {
  RECEITA
  DESPESA
}

enum StatusFinanceiro {
  PENDENTE
  PAGO
  VENCIDO
  CANCELADO
}
```

### Principais Modelos

#### User
- Gestão de usuários do sistema
- Roles diferenciados (ADMIN, DOCTOR, etc.)
- Segregação por unidade
- Campos: nome, email, senha, role, unidade, cargo, telefone, etc.

#### Patient
- Gestão completa de pacientes
- Dados pessoais, contato, endereço
- Status e observações
- Relacionamentos com consultas e agendamentos

#### Product
- Gestão de produtos/medicamentos
- Controle de estoque
- Categorização e preços
- Códigos de barras

#### Service/Procedure
- Gestão de procedimentos/serviços
- Categorização e preços
- Duração dos procedimentos

#### Appointment
- Sistema de agendamentos
- Relacionamento com pacientes e serviços
- Status de agendamento

#### Consultation
- Gestão de consultas
- Relacionamento com agendamentos
- Observações e diagnósticos

#### StockMovement
- Controle de movimentação de estoque
- Tipos de movimentação (entrada, saída, ajuste)
- Rastreabilidade completa

#### Transaction
- Sistema financeiro
- Receitas e despesas
- Status de pagamento

## Controllers Implementados

### 1. AuthController ✅ **IMPLEMENTADO**

**Endpoints:**
- `POST /auth/login` - Login do usuário

**Funcionalidades:**
- Validação de credenciais (email, senha, unidade)
- Verificação de status do usuário
- Geração de token JWT
- Atualização do último acesso

**Status:** Totalmente funcional

### 2. PatientController ✅ **IMPLEMENTADO**

**Endpoints:**
- `GET /patients` - Listar pacientes com filtros e paginação
- `GET /patients/:id` - Buscar paciente por ID
- `POST /patients` - Criar novo paciente
- `PUT /patients/:id` - Atualizar paciente
- `DELETE /patients/:id` - Deletar paciente
- `GET /patients/aniversariantes` - Listar aniversariantes
- `POST /patients/validate` - Validar dados do paciente

**Funcionalidades:**
- CRUD completo de pacientes
- Filtros avançados (nome, CPF, status, etc.)
- Paginação
- Validação de CPF único por unidade
- Busca de aniversariantes
- Segregação por unidade

**Status:** Totalmente funcional e integrado com frontend

### 3. ProductController ✅ **IMPLEMENTADO**

**Endpoints:**
- `POST /products` - Criar produto
- `GET /products` - Listar produtos com filtros
- `GET /products/:id` - Buscar produto por ID
- `GET /products/barcode/:barcode` - Buscar por código de barras
- `PUT /products/:id` - Atualizar produto
- `PATCH /products/:id/status` - Alterar status (ativo/inativo)
- `POST /products/:id/adjust-stock` - Ajustar estoque
- `GET /products/low-stock` - Produtos com estoque baixo
- `GET /products/categories` - Listar categorias

**Funcionalidades:**
- CRUD completo de produtos
- Controle de estoque
- Validação de código de barras único
- Filtros avançados
- Gestão de categorias
- Alertas de estoque baixo
- Segregação por unidade

**Status:** Totalmente implementado, **NÃO integrado com frontend**

### 4. ProcedureController ✅ **IMPLEMENTADO**

**Endpoints:**
- `POST /procedures` - Criar procedimento
- `GET /procedures` - Listar procedimentos com filtros
- `GET /procedures/:id` - Buscar procedimento por ID
- `GET /procedures/category/:category` - Buscar por categoria
- `GET /procedures/categories` - Listar categorias
- `PUT /procedures/:id` - Atualizar procedimento
- `DELETE /procedures/:id` - Deletar procedimento
- `PATCH /procedures/:id/status` - Alterar status
- `GET /procedures/popular` - Procedimentos mais populares

**Funcionalidades:**
- CRUD completo de procedimentos
- Gestão de categorias
- Filtros avançados
- Relatórios de popularidade
- Segregação por unidade

**Status:** Totalmente implementado, **NÃO integrado com frontend**

### 5. UserController ✅ **IMPLEMENTADO**

**Endpoints:**
- `GET /users` - Listar usuários da unidade
- `GET /users/:id` - Buscar usuário por ID
- `POST /users` - Criar novo usuário
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

**Funcionalidades:**
- CRUD completo de usuários
- Validação de email único por unidade
- Hash de senhas com bcrypt
- Segregação por unidade
- Controle de roles/permissões

**Status:** Totalmente implementado, **NÃO integrado com frontend**

## Controllers NÃO Implementados

### 1. AppointmentController ❌ **NÃO IMPLEMENTADO**
- Sistema de agendamentos
- Necessário para funcionalidade de agendamentos do frontend

### 2. ConsultationController ❌ **NÃO IMPLEMENTADO**
- Gestão de consultas
- Anamnese, diagnósticos, prescrições
- Necessário para funcionalidade de consultas do frontend

### 3. StockMovementController ❌ **NÃO IMPLEMENTADO**
- Controle de movimentação de estoque
- Necessário para funcionalidade de estoque do frontend

### 4. TransactionController ❌ **NÃO IMPLEMENTADO**
- Sistema financeiro
- Receitas e despesas
- Necessário para funcionalidade financeira do frontend

### 5. ReportController ❌ **NÃO IMPLEMENTADO**
- Relatórios e dashboards
- Necessário para dados reais no dashboard

## Configurações de Segurança

### Middlewares Implementados
- **Helmet**: Proteção de headers HTTP
- **CORS**: Configuração de CORS
- **Rate Limiting**: Limitação de requisições
- **Compression**: Compressão de respostas
- **Morgan**: Logs de requisições

### Autenticação JWT
- Token gerado no login
- Middleware de verificação de token
- Extração automática de dados do usuário e unidade

## Validação de Dados

### Schemas Zod Implementados
- **Product Schema**: Validação completa de produtos
- **Procedure Schema**: Validação de procedimentos
- **Patient Schema**: Validação de pacientes (implícita no controller)

### Tratamento de Erros
- Middleware centralizado de tratamento de erros
- Respostas padronizadas
- Logs detalhados

## Próximos Passos para Desenvolvimento

### Prioridade Alta
1. **AppointmentController**: Implementar sistema de agendamentos
2. **StockMovementController**: Implementar controle de estoque
3. **ReportController**: Implementar relatórios para dashboard

### Prioridade Média
1. **ConsultationController**: Implementar gestão de consultas
2. **TransactionController**: Implementar sistema financeiro
3. **Schemas de validação**: Completar schemas faltantes

### Prioridade Baixa
1. **Testes unitários**: Implementar cobertura de testes
2. **Documentação API**: Gerar documentação Swagger
3. **Logs avançados**: Implementar sistema de logs mais robusto

## Observações Técnicas

- Todos os controllers implementados seguem o padrão de segregação por unidade
- Validação rigorosa de dados com Zod
- Tratamento de erros padronizado
- Estrutura preparada para escalabilidade
- Banco de dados bem modelado com relacionamentos adequados
- Sistema de autenticação robusto e seguro