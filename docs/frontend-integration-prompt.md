# Prompt para Integração Frontend - APIs de Produtos e Receitas

## Contexto
O backend da clínica estética foi atualizado com implementação completa das APIs de produtos e receitas. Ambos os módulos estão funcionando corretamente e salvando dados no banco PostgreSQL.

## APIs Implementadas

### 1. API de Produtos ✅
**Base URL**: `/api/products`

#### Endpoints Disponíveis:
- `GET /api/products` - Listar produtos com filtros e paginação
- `POST /api/products` - Criar novo produto
- `GET /api/products/:id` - Buscar produto por ID
- `PUT /api/products/:id` - Atualizar produto
- `PATCH /api/products/:id/toggle-status` - Ativar/Desativar produto
- `POST /api/products/:id/adjust-stock` - Ajustar estoque
- `GET /api/products/categories` - Listar categorias
- `GET /api/products/low-stock` - Produtos com estoque baixo
- `GET /api/products/barcode/:codigoBarras` - Buscar por código de barras

#### Estrutura de Dados do Produto:
```typescript
interface Product {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  codigoBarras?: string;
  fabricante?: string;
  estoqueMinimo: number;
  estoqueAtual: number;
  localizacao?: string;
  precoCusto?: number;
  precoVenda?: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Schema de Validação para Criação:
```typescript
interface CreateProductData {
  nome: string; // obrigatório, 2-100 caracteres
  descricao?: string; // opcional, max 500 caracteres
  categoria?: string; // opcional, 2-50 caracteres
  codigoBarras?: string; // opcional, max 50 caracteres
  fabricante?: string; // opcional, max 100 caracteres
  estoqueMinimo?: number; // opcional, default 0, min 0
  localizacao?: string; // opcional, max 100 caracteres
  precoCusto?: number; // opcional, > 0, max 999999.99
  precoVenda?: number; // opcional, > 0, max 999999.99
  ativo?: boolean; // opcional, default true
}
```

### 2. API de Receitas ✅
**Base URL**: `/api/recipes`

#### Endpoints Disponíveis:
- `POST /api/recipes` - Criar nova receita
- `GET /api/recipes/consultation/:consultationId` - Listar receitas por consulta
- `GET /api/recipes/:id` - Buscar receita por ID
- `PUT /api/recipes/:id` - Atualizar receita
- `PATCH /api/recipes/:id/print` - Marcar como impressa
- `DELETE /api/recipes/:id` - Excluir receita
- `GET /api/recipes/templates/list` - Listar templates de receita
- `POST /api/recipes/templates` - Criar template de receita

#### Estrutura de Dados da Receita:
```typescript
interface Recipe {
  id: string;
  consultationId: string;
  templateId?: string;
  conteudo: string;
  observacoes?: string;
  impressa: boolean;
  dataImpressao?: string;
  unidade: 'BARRA' | 'TIJUCA';
  createdAt: string;
  updatedAt: string;
  consultation?: {
    id: string;
    patient: {
      nome: string;
      cpf: string;
    };
  };
  template?: {
    id: string;
    nome: string;
  };
}
```

#### Schema de Validação para Criação:
```typescript
interface CreateRecipeData {
  consultationId: string; // obrigatório, UUID válido
  templateId?: string; // opcional, UUID válido
  conteudo: string; // obrigatório, 10-5000 caracteres
  observacoes?: string; // opcional, max 1000 caracteres
}
```

## Autenticação e Autorização

### Headers Obrigatórios:
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  'x-unidade': 'BARRA' | 'TIJUCA'
};
```

### Fluxo de Autenticação:
1. **Login**: `POST /api/auth/login`
   ```typescript
   const loginData = {
     email: string;
     senha: string;
     unidade: 'BARRA' | 'TIJUCA';
   };
   ```

2. **Resposta do Login**:
   ```typescript
   interface LoginResponse {
     message: string;
     token: string;
     user: {
       id: string;
       nome: string;
       email: string;
       role: string;
       unidade: string;
       cargo: string;
       telefone: string;
     };
   }
   ```

## Implementações Sugeridas para o Frontend

### 1. Módulo de Produtos

#### Páginas Necessárias:
- **Lista de Produtos** (`/produtos`)
  - Tabela com paginação
  - Filtros: busca, categoria, status, estoque baixo
  - Ações: visualizar, editar, ativar/desativar, ajustar estoque
  - Botão "Novo Produto"

- **Formulário de Produto** (`/produtos/novo`, `/produtos/:id/editar`)
  - Campos do schema de validação
  - Validação em tempo real
  - Botões: Salvar, Cancelar

- **Detalhes do Produto** (`/produtos/:id`)
  - Informações completas
  - Histórico de movimentações
  - Ações: editar, ajustar estoque

#### Componentes Sugeridos:
```typescript
// Componentes principais
<ProductList />
<ProductForm />
<ProductDetails />
<StockAdjustmentModal />
<CategoryFilter />
<StockAlert />

// Hooks personalizados
const useProducts = () => {
  // Lógica para gerenciar estado dos produtos
};

const useStockAdjustment = () => {
  // Lógica para ajuste de estoque
};
```

### 2. Módulo de Receitas

#### Páginas Necessárias:
- **Receitas da Consulta** (`/consultas/:id/receitas`)
  - Lista de receitas da consulta
  - Botão "Nova Receita"
  - Ações: visualizar, editar, imprimir, excluir

- **Formulário de Receita** (`/consultas/:id/receitas/nova`, `/receitas/:id/editar`)
  - Editor de texto rico para conteúdo
  - Seleção de template (opcional)
  - Campo de observações
  - Preview da receita

- **Templates de Receita** (`/receitas/templates`)
  - Lista de templates
  - Formulário para criar/editar templates
  - Categorização por especialidade

#### Componentes Sugeridos:
```typescript
// Componentes principais
<RecipeList />
<RecipeForm />
<RecipeViewer />
<RecipeTemplateManager />
<RecipePrintModal />

// Hooks personalizados
const useRecipes = (consultationId: string) => {
  // Lógica para gerenciar receitas de uma consulta
};

const useRecipeTemplates = () => {
  // Lógica para gerenciar templates
};
```

### 3. Integração com Consultas

#### Modificações Necessárias:
- **Página de Consulta** (`/consultas/:id`)
  - Adicionar aba/seção "Receitas"
  - Lista de receitas da consulta
  - Botão "Nova Receita"

- **Formulário de Consulta**
  - Campo para anexar receitas
  - Preview de receitas existentes

## Tratamento de Erros

### Estrutura de Resposta de Erro:
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  details?: Array<{
    field: string;
    message: string;
    value: string;
  }>;
}
```

### Códigos de Status:
- `400` - Dados inválidos (validação)
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## Validações do Frontend

### Produtos:
- Nome obrigatório (2-100 caracteres)
- Código de barras único por unidade
- Preços positivos e dentro do limite
- Validação de estoque (não pode ficar negativo)

### Receitas:
- Conteúdo obrigatório (10-5000 caracteres)
- Consulta deve existir e pertencer à unidade
- Template deve existir (se fornecido)

## Funcionalidades Especiais

### Produtos:
1. **Busca por Código de Barras**
   - Scanner de código de barras
   - Busca automática ao digitar

2. **Alertas de Estoque Baixo**
   - Notificação visual
   - Lista dedicada de produtos com estoque baixo

3. **Movimentação de Estoque**
   - Histórico de entradas/saídas
   - Motivo e observações
   - Usuário responsável

### Receitas:
1. **Templates Personalizáveis**
   - Editor de templates
   - Variáveis dinâmicas (nome do paciente, data, etc.)
   - Categorização por especialidade

2. **Sistema de Impressão**
   - Preview antes da impressão
   - Marcação automática como impressa
   - Histórico de impressões

3. **Integração com Consultas**
   - Acesso direto da consulta
   - Contexto do paciente
   - Histórico de receitas

## Testes Realizados no Backend

### Produtos ✅
- ✅ Criação de produto
- ✅ Listagem com filtros
- ✅ Busca por ID
- ✅ Atualização
- ✅ Ajuste de estoque
- ✅ Validações de dados

### Receitas ✅
- ✅ Criação de receita
- ✅ Listagem por consulta
- ✅ Busca por ID
- ✅ Atualização
- ✅ Marcação como impressa
- ✅ Validações de dados

## Próximos Passos

1. **Implementar módulo de produtos no frontend**
2. **Implementar módulo de receitas no frontend**
3. **Integrar com sistema de consultas existente**
4. **Implementar sistema de templates de receita**
5. **Adicionar funcionalidades de impressão**
6. **Implementar alertas de estoque baixo**
7. **Testes de integração frontend-backend**

## Observações Importantes

- Todas as APIs requerem autenticação JWT
- Header `x-unidade` é obrigatório para todas as requisições
- Validações são feitas tanto no frontend quanto no backend
- Sistema suporta duas unidades: BARRA e TIJUCA
- Dados são isolados por unidade
- Logs de auditoria são mantidos automaticamente

## URLs de Teste

- **Health Check**: `GET http://localhost:3001/health`
- **Login**: `POST http://localhost:3001/api/auth/login`
- **Produtos**: `GET http://localhost:3001/api/products`
- **Receitas**: `GET http://localhost:3001/api/recipes/consultation/{consultationId}`

---

**Status**: ✅ Backend implementado e testado
**Próximo**: Implementação no frontend
**Prioridade**: Alta - Funcionalidades essenciais para operação da clínica
