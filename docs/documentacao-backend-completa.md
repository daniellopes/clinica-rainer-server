# Documentação Completa do Backend - Sistema Clínica Rainer

## Visão Geral

O backend da Clínica Rainer é uma API REST robusta construída com Express.js, TypeScript e Prisma ORM, projetada para gerenciar todas as operações de uma clínica médica moderna. O sistema oferece funcionalidades completas para gestão de pacientes, agendamentos, consultas, estoque, financeiro e usuários.

### Tecnologias Principais

- **Framework**: Express.js com TypeScript
- **ORM**: Prisma com PostgreSQL
- **Autenticação**: JWT (JSON Web Tokens)
- **Validação**: Zod para validação de schemas
- **Segurança**: Middlewares de autenticação e autorização
- **Documentação**: Swagger/OpenAPI

### Arquitetura do Sistema

O sistema segue uma arquitetura em camadas bem definida:

- **Controllers**: Gerenciam as requisições HTTP e respostas
- **Services**: Contêm a lógica de negócio
- **Middlewares**: Tratam autenticação, validação e logs
- **Routes**: Definem os endpoints da API
- **Schemas**: Validação de dados com Zod
- **Utils**: Funções utilitárias e helpers

## Estrutura do Banco de Dados

### Modelos Principais

#### Usuários (User)
Gerencia todos os usuários do sistema com diferentes perfis e permissões:
- Informações pessoais e profissionais
- Sistema de roles (ADMIN, MEDICO, RECEPCIONISTA, etc.)
- Especialidades médicas
- Controle de acesso por unidade
- Logs de acesso e auditoria

#### Pacientes (Patient)
Armazena dados completos dos pacientes:
- Informações pessoais e demográficas
- Dados de contato e endereço
- Informações médicas (alergias, cirurgias, medicamentos)
- Histórico familiar e condições médicas
- Convênios e seguros de saúde
- Parentes e contatos de emergência
- Status e observações

#### Produtos (Product)
Controle completo do estoque:
- Informações básicas do produto
- Controle de lotes com validade
- Estoque mínimo e atual
- Preços de custo e venda
- Localização no estoque
- Movimentações detalhadas

#### Procedimentos (Procedure)
Catálogo de serviços oferecidos:
- Descrição e categoria
- Duração estimada
- Valores dos procedimentos
- Especialidades relacionadas
- Status ativo/inativo

#### Agendamentos (Appointment)
Gestão completa de agendamentos:
- Vinculação paciente-procedimento-médico
- Data, hora e duração
- Status do agendamento
- Confirmações e cancelamentos
- Observações e motivos

#### Consultas (Consultation)
Registro detalhado das consultas:
- Dados da consulta médica
- Queixa principal e história da doença
- Exame físico e hipóteses diagnósticas
- Condutas e observações
- Receitas médicas
- Anamneses estruturadas

#### Transações (Transaction)
Controle financeiro completo:
- Receitas e despesas
- Datas de vencimento e pagamento
- Status financeiro
- Vinculação com pacientes
- Observações e detalhes

### Enumerações do Sistema

#### Tipos de Usuário
- ADMIN: Administrador do sistema
- MEDICO: Profissionais médicos
- RECEPCIONISTA: Atendimento e agendamentos
- ESTOQUISTA: Gestão de estoque
- FINANCEIRO: Controle financeiro
- NUTRICIONISTA: Especialista em nutrição
- TECNICO_ENFERMAGEM: Técnicos de enfermagem
- BIOMEDICO: Profissionais biomédicos
- ESTETICA: Procedimentos estéticos

#### Especialidades Médicas
- GINECOLOGISTA
- ORTOMOLECULAR
- CARDIOLOGIA
- NUTRICIONISTA
- BIOMEDICA
- ESTETICA

#### Status de Agendamento
- AGENDADO: Agendamento criado
- CONFIRMADO: Paciente confirmou presença
- EM_ATENDIMENTO: Consulta em andamento
- CONCLUIDO: Atendimento finalizado
- CANCELADO: Agendamento cancelado
- FALTOU: Paciente não compareceu

#### Status de Consulta
- AGENDADA: Consulta agendada
- EM_ANDAMENTO: Consulta em andamento
- CONCLUIDA: Consulta finalizada
- CANCELADA: Consulta cancelada

#### Status Financeiro
- PENDENTE: Aguardando pagamento
- PAGO: Pagamento realizado
- VENCIDO: Pagamento em atraso
- CANCELADO: Transação cancelada

## Controllers Implementados

### AuthController
**Status**: Totalmente implementado e integrado
- Login de usuários com validação
- Geração de tokens JWT
- Middleware de autenticação
- Controle de sessões

### PatientController
**Status**: Totalmente implementado e integrado
- Listagem com paginação e filtros
- Criação de novos pacientes
- Busca por ID, CPF ou nome
- Atualização de dados
- Exclusão lógica
- Gestão de convênios e parentes

### ProductController
**Status**: Totalmente implementado e integrado
- Listagem de produtos com filtros
- Criação e edição de produtos
- Controle de estoque
- Gestão de lotes e validades
- Relatórios de estoque

### ProcedureController
**Status**: Totalmente implementado e integrado
- Catálogo de procedimentos
- Criação e edição
- Filtros por especialidade
- Controle de valores
- Status ativo/inativo

### UserController
**Status**: Totalmente implementado e integrado
- Gestão de usuários do sistema
- Controle de permissões
- Perfis e especialidades
- Ativação/desativação
- Logs de acesso

## Controllers em Desenvolvimento

### AppointmentController
**Status**: Backend implementado, frontend em desenvolvimento
- Endpoints básicos funcionais
- Integração com calendário pendente
- Notificações automáticas em desenvolvimento
- Validações de conflito implementadas

### ConsultationController
**Status**: Backend implementado, frontend mockado
- CRUD completo implementado
- Integração com anamneses
- Receitas médicas funcionais
- Interface frontend em desenvolvimento

### StockMovementController
**Status**: Backend implementado, frontend mockado
- Movimentações de entrada e saída
- Controle de lotes
- Relatórios de movimentação
- Interface de usuário pendente

### TransactionController
**Status**: Backend implementado, frontend mockado
- Gestão financeira completa
- Controle de recebimentos
- Relatórios financeiros
- Dashboard financeiro em desenvolvimento

### ReportController
**Status**: Estrutura criada, implementação pendente
- Relatórios gerenciais
- Dashboards analíticos
- Exportação de dados
- Métricas de performance

## Segurança e Autenticação

### Middlewares de Segurança
- **Autenticação JWT**: Validação de tokens em rotas protegidas
- **Autorização por Role**: Controle de acesso baseado em perfis
- **Validação de Dados**: Schemas Zod para todas as entradas
- **Rate Limiting**: Proteção contra ataques de força bruta
- **CORS**: Configuração adequada para frontend
- **Logs de Auditoria**: Registro de todas as ações importantes

### Sistema de Permissões
O sistema implementa um controle granular de permissões:
- Visualização, criação, edição e exclusão por módulo
- Permissões específicas para prontuários médicos
- Controle de acesso a relatórios financeiros
- Gestão de configurações do sistema
- Auditoria e logs de acesso

## Validação e Tratamento de Erros

### Schemas de Validação
Todos os endpoints utilizam schemas Zod para validação:
- Validação de entrada de dados
- Sanitização automática
- Mensagens de erro padronizadas
- Validação de tipos TypeScript

### Tratamento de Erros
- Middleware global de tratamento de erros
- Logs estruturados de erros
- Respostas padronizadas para o frontend
- Códigos de status HTTP apropriados

## API Endpoints

### Autenticação
- POST /auth/login - Login de usuários
- POST /auth/refresh - Renovação de token
- POST /auth/logout - Logout do sistema

### Pacientes
- GET /patients - Listar pacientes com filtros
- POST /patients - Criar novo paciente
- GET /patients/:id - Buscar paciente por ID
- PUT /patients/:id - Atualizar dados do paciente
- DELETE /patients/:id - Excluir paciente
- GET /patients/search - Busca avançada

### Agendamentos
- GET /appointments - Listar agendamentos
- POST /appointments - Criar agendamento
- GET /appointments/:id - Buscar agendamento
- PUT /appointments/:id - Atualizar agendamento
- DELETE /appointments/:id - Cancelar agendamento
- PUT /appointments/:id/confirm - Confirmar agendamento

### Consultas
- GET /consultations - Listar consultas
- POST /consultations - Criar consulta
- GET /consultations/:id - Buscar consulta
- PUT /consultations/:id - Atualizar consulta
- POST /consultations/:id/recipes - Criar receita

### Produtos e Estoque
- GET /products - Listar produtos
- POST /products - Criar produto
- PUT /products/:id - Atualizar produto
- GET /stock/movements - Movimentações de estoque
- POST /stock/movements - Registrar movimentação

### Financeiro
- GET /transactions - Listar transações
- POST /transactions - Criar transação
- PUT /transactions/:id - Atualizar transação
- PUT /transactions/:id/pay - Registrar pagamento

### Usuários
- GET /users - Listar usuários
- POST /users - Criar usuário
- PUT /users/:id - Atualizar usuário
- PUT /users/:id/deactivate - Desativar usuário

## Status de Integração Frontend-Backend

### Totalmente Integrado
- **Autenticação**: Login, logout e controle de sessão
- **Gestão de Pacientes**: CRUD completo com interface
- **Produtos**: Listagem e gestão básica
- **Procedimentos**: Catálogo completo
- **Usuários**: Gestão de usuários do sistema

### Backend Implementado, Frontend em Desenvolvimento
- **Agendamentos**: Endpoints funcionais, interface em desenvolvimento
- **Estoque por Validade**: Backend pronto, frontend básico
- **Termos de Consentimento**: Estrutura criada

### Totalmente Mockado (Prioridade de Implementação)
- **Consultas**: Interface mockada, backend funcional
- **Movimentação de Estoque**: Telas mockadas
- **Sistema Financeiro**: Dashboard mockado
- **Relatórios**: Estrutura básica criada

## Configurações e Ambiente

### Variáveis de Ambiente Necessárias
- DATABASE_URL: String de conexão PostgreSQL
- JWT_SECRET: Chave secreta para tokens JWT
- JWT_EXPIRES_IN: Tempo de expiração dos tokens
- PORT: Porta do servidor (padrão 3001)
- NODE_ENV: Ambiente de execução
- CORS_ORIGIN: Origem permitida para CORS

### Scripts de Desenvolvimento
- npm run dev: Servidor de desenvolvimento
- npm run build: Build de produção
- npm run start: Servidor de produção
- npm run db:migrate: Executar migrações
- npm run db:seed: Popular banco com dados iniciais
- npm run test: Executar testes

## Próximos Passos de Desenvolvimento

### Fase 1 - Prioridade Alta
1. **Finalizar Integração de Agendamentos**
   - Completar interface de calendário
   - Implementar notificações automáticas
   - Validações de conflito de horário

2. **Sistema de Consultas**
   - Interface completa de consultas
   - Integração com anamneses
   - Geração de receitas

3. **Dashboard Financeiro**
   - Relatórios de receitas e despesas
   - Gráficos de performance
   - Controle de inadimplência

### Fase 2 - Prioridade Média
1. **Relatórios Gerenciais**
   - Relatórios de produtividade
   - Análises de agendamentos
   - Métricas de atendimento

2. **Melhorias de Estoque**
   - Alertas de validade
   - Controle de fornecedores
   - Relatórios de consumo

3. **Sistema de Notificações**
   - Lembretes de consulta
   - Alertas de sistema
   - Notificações por email/SMS

### Fase 3 - Melhorias Futuras
1. **Integração com Equipamentos**
   - Balanças e medidores
   - Equipamentos de diagnóstico
   - Sincronização automática

2. **Telemedicina**
   - Consultas online
   - Prescrições digitais
   - Prontuário eletrônico

3. **Business Intelligence**
   - Dashboards avançados
   - Análises preditivas
   - Relatórios customizados

## Considerações Técnicas

### Pontos de Atenção
- **Performance**: Índices otimizados no banco de dados
- **Segurança**: Validação rigorosa de dados de entrada
- **Escalabilidade**: Arquitetura preparada para crescimento
- **Manutenibilidade**: Código bem estruturado e documentado
- **Backup**: Estratégias de backup automático
- **Monitoramento**: Logs estruturados e métricas

### Melhorias Futuras
- **Cache**: Implementação de Redis para performance
- **Microserviços**: Divisão em serviços especializados
- **API Gateway**: Centralização de autenticação e roteamento
- **Containerização**: Docker para deploy e desenvolvimento
- **CI/CD**: Pipeline automatizado de deploy
- **Testes**: Cobertura completa de testes automatizados

## Conclusão

O backend da Clínica Rainer está em um estado avançado de desenvolvimento, com a maioria dos módulos principais implementados e funcionais. O sistema oferece uma base sólida para operações clínicas completas, com foco em segurança, performance e escalabilidade.

As próximas etapas envolvem principalmente a finalização das integrações frontend-backend e a implementação de funcionalidades avançadas como relatórios gerenciais e dashboards analíticos.

O sistema está preparado para suportar o crescimento da clínica e pode ser facilmente expandido com novas funcionalidades conforme necessário.