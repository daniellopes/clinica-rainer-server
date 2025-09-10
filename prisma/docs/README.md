# Documentação do Prisma - Clínica Rainer

## Visão Geral

Este diretório contém o schema do Prisma e as migrações do banco de dados para o sistema da Clínica Rainer.

## Schema Principal

O arquivo `schema.prisma` define a estrutura completa do banco de dados, incluindo:

### Modelos Principais

#### Pacientes (`Patient`)
- Informações pessoais completas
- Contatos de emergência
- Histórico médico
- Sistema de dependentes
- Documentos anexados

#### Usuários e Permissões
- `User`: Usuários do sistema
- `RolePermission`: Permissões por função
- `UserPermission`: Permissões específicas por usuário
- `AccessLog`: Log de acessos ao sistema

#### Anamnese
- `AnamnesisForm`: Templates de formulários de anamnese
- `AnamnesisResponse`: Respostas preenchidas pelos pacientes

#### Documentos
- `PatientDocument`: Documentos dos pacientes armazenados no banco

### Configuração do Banco

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Migrações

### Histórico de Migrações

1. **20250616152356_api_esthetic_pro** - Migração inicial da API
2. **20250619194843_initial_migration** - Estrutura base do sistema
3. **20250823004430_email_unico_paciente** - Adição de constraint de email único
4. **20250823015556_add_emergency_contact_fields** - Campos de contato de emergência
5. **20250823202507_add_medical_history** - Histórico médico dos pacientes
6. **20250823230129_patient_documents** - Sistema de documentos
7. **20250824024138_store_files_in_db** - Armazenamento de arquivos no banco
8. **20250824032559_add_dependents_responsaveis** - Sistema de dependentes
9. **20250829142413_add_permissions_system** - Sistema de permissões

## Comandos Úteis

### Desenvolvimento
```bash
# Gerar o cliente Prisma
npx prisma generate

# Aplicar migrações pendentes
npx prisma migrate deploy

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Resetar banco de dados (desenvolvimento)
npx prisma migrate reset
```

### Produção
```bash
# Aplicar migrações em produção
npx prisma migrate deploy

# Verificar status das migrações
npx prisma migrate status
```

### Visualização
```bash
# Abrir Prisma Studio
npx prisma studio
```

## Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis no arquivo `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/clinica_rainer"
```

## Tipos Especiais

### Campos JSON
- `campos` em `AnamnesisForm`: Estrutura dinâmica dos formulários
- `respostas` em `AnamnesisResponse`: Respostas dos pacientes
- `historico_medico` em `Patient`: Histórico médico estruturado

### Enums
- `Unidade`: BARRA, TIJUCA
- Outros enums específicos do domínio médico

## Segurança

- Todos os campos sensíveis são tratados com criptografia quando necessário
- Sistema de permissões granular implementado
- Logs de acesso para auditoria
- Documentos armazenados de forma segura no banco

## Manutenção

### Backup
Recomenda-se fazer backup regular do banco de dados antes de aplicar novas migrações.

### Monitoramento
- Verificar logs de acesso regularmente
- Monitorar performance das queries
- Acompanhar crescimento do banco de dados