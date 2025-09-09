# API Clínica Rainer

Sistema completo de gerenciamento para clínicas médicas e estéticas.

## Sobre

Esta API gerencia todo o ecossistema da Clínica Rainer, incluindo pacientes, consultas, anamneses, procedimentos, estoque, financeiro e sistema de permissões. Foi desenvolvida com foco na segurança, escalabilidade e facilidade de manutenção.

**Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL

## Instalação

```bash
npm install
```

Configure o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Execute as migrações do banco:

```bash
npx prisma migrate dev
```

Inicie o servidor:

```bash
npm run dev
```

A API estará disponível em `http://localhost:3001`

## Autenticação

### Login

**POST** `/api/auth/login`

```json
{
  "email": "admin@barra.com",
  "senha": "123456", 
  "unidade": "BARRA"
}
```

Retorna:
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
  "token": "jwt_token_aqui"
}
```

Use o token nas próximas requisições:
```
Authorization: Bearer jwt_token_aqui
```

## Usuários

### Listar usuários

**GET** `/api/users`

Retorna todos os usuários da unidade do usuário logado.

### Criar usuário

**POST** `/api/users`

```json
{
  "nome": "João Silva",
  "email": "joao@clinica.com",
  "senha": "senha123",
  "role": "RECEPCIONISTA",
  "cargo": "Recepcionista",
  "telefone": "(21) 99999-9999"
}
```

### Atualizar usuário

**PUT** `/api/users/:id`

Mesmos campos do criar, todos opcionais.

### Desativar usuário

**DELETE** `/api/users/:id`

Remove o usuário (soft delete).

## Roles disponíveis

- `ADMIN` - Acesso total ao sistema
- `MEDICO` - Acesso a consultas e pacientes  
- `RECEPCIONISTA` - Acesso a agendamentos e cadastros
- `ENFERMEIRO` - Acesso limitado a procedimentos

## Unidades

O sistema trabalha com duas unidades isoladas:
- `BARRA` - Unidade da Barra da Tijuca
- `TIJUCA` - Unidade da Tijuca

Cada usuário pertence a uma unidade e só pode ver dados da sua unidade.

## Scripts úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run start        # Executar produção
npm run create-admin # Criar usuários teste
```

## Saúde da API

**GET** `/health`

Verifica se a API está funcionando e conectada ao banco.

## Ambiente de desenvolvimento

Para criar usuários de teste:

```bash
npm run create-admin
```

Isso criará usuários padrão para as duas unidades com senha `123456`.

## Rate Limiting

- Login: máximo 5 tentativas por 15 minutos
- API geral: máximo 100 requisições por 15 minutos

## Funcionalidades Principais

### Gestão de Pacientes
- Cadastro completo com dados pessoais e médicos
- Sistema de dependentes e responsáveis
- Contatos de emergência
- Histórico médico estruturado
- Upload e gerenciamento de documentos

### Sistema de Anamnese
- Templates dinâmicos de formulários
- Respostas estruturadas em JSON
- Duplicação e versionamento de templates
- Integração com consultas médicas

### Controle de Acesso
- Sistema de permissões granular
- Roles hierárquicos (ADMIN, MEDICO, RECEPCIONISTA, ENFERMEIRO)
- Logs de auditoria de acesso
- Autenticação JWT segura

### Gestão Financeira
- Controle de transações
- Relatórios financeiros
- Integração com procedimentos

### Controle de Estoque
- Movimentações de produtos
- Controle de validade
- Relatórios de estoque

## Estrutura do Banco

O sistema utiliza PostgreSQL com Prisma ORM. Principais entidades:

- **Pacientes**: `Patient`, `PatientDocument`
- **Usuários**: `User`, `RolePermission`, `UserPermission`, `AccessLog`
- **Anamnese**: `AnamnesisForm`, `AnamnesisResponse`
- **Consultas**: `Consultation`, `Appointment`
- **Produtos**: `Product`, `StockMovement`
- **Financeiro**: `Transaction`

Veja `prisma/README.md` e `prisma/schema.prisma` para documentação completa.

## Contribuição

1. Faça um fork
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

