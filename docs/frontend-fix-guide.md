# Guia de Correção - Frontend Receitas

## Problema Identificado
O componente `CadastroReceita` estava falhando porque o frontend estava tentando acessar rotas de API que não existiam.

## Erros Corrigidos no Backend ✅

### 1. Rota de Listagem Geral de Receitas
**Problema**: `GET /api/recipes?page=1&limit=10` retornava 404
**Solução**: Implementada rota de listagem geral com filtros e paginação

**Nova Rota**:
```
GET /api/recipes?page=1&limit=10&search=termo&impressa=true
```

**Resposta**:
```json
{
  "recipes": [
    {
      "id": "uuid",
      "consultationId": "uuid",
      "templateId": "uuid",
      "conteudo": "Conteúdo da receita",
      "observacoes": "Observações",
      "impressa": false,
      "dataImpressao": null,
      "createdAt": "2024-01-15T10:00:00Z",
      "consultation": {
        "id": "uuid",
        "patient": {
          "nome": "Nome do Paciente",
          "cpf": "12345678901"
        }
      },
      "template": {
        "id": "uuid",
        "nome": "Nome do Template"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### 2. Rota de Templates de Receita
**Problema**: `GET /api/recipes/templates/list` retornava 404
**Solução**: Rota já existia, mas estava sendo acessada incorretamente

**Rota Correta**:
```
GET /api/recipes/templates/list
```

**Resposta**:
```json
{
  "templates": [
    {
      "id": "uuid",
      "nome": "Nome do Template",
      "template": "Conteúdo do template",
      "especialidade": "Especialidade",
      "ativo": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

## APIs de Receitas Disponíveis ✅

### Rotas Principais
1. `GET /api/recipes` - Listar todas as receitas (com filtros e paginação)
2. `POST /api/recipes` - Criar nova receita
3. `GET /api/recipes/:id` - Buscar receita por ID
4. `PUT /api/recipes/:id` - Atualizar receita
5. `DELETE /api/recipes/:id` - Excluir receita
6. `PATCH /api/recipes/:id/print` - Marcar como impressa

### Rotas por Consulta
7. `GET /api/recipes/consultation/:consultationId` - Listar receitas de uma consulta

### Rotas de Templates
8. `GET /api/recipes/templates/list` - Listar templates
9. `POST /api/recipes/templates` - Criar template

## Correções Necessárias no Frontend

### 1. Componente CadastroReceita
**Arquivo**: `src/pages/cadastro/cadastro-receita.tsx`

**Problemas a corrigir**:
- Verificar se está usando a URL correta para listar receitas
- Implementar tratamento de erro adequado
- Adicionar loading states

**Exemplo de uso correto**:
```typescript
// Listar receitas
const fetchRecipes = async () => {
  try {
    const response = await api.get('/recipes', {
      params: { page: 1, limit: 10 }
    });
    setRecipes(response.data.recipes);
  } catch (error) {
    console.error('Erro ao carregar receitas:', error);
  }
};

// Listar templates
const fetchTemplates = async () => {
  try {
    const response = await api.get('/recipes/templates/list');
    setTemplates(response.data.templates);
  } catch (error) {
    console.error('Erro ao carregar templates:', error);
  }
};
```

### 2. Configuração da API
**Verificar se o baseURL está correto**:
```typescript
// Exemplo de configuração do axios
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
    'x-unidade': 'BARRA' // ou 'TIJUCA'
  }
});
```

### 3. Interceptadores de Autenticação
**Adicionar token automaticamente**:
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Estrutura de Dados para o Frontend

### Interface Recipe
```typescript
interface Recipe {
  id: string;
  consultationId: string;
  templateId?: string;
  conteudo: string;
  observacoes?: string;
  impressa: boolean;
  dataImpressao?: string;
  createdAt: string;
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

### Interface RecipeTemplate
```typescript
interface RecipeTemplate {
  id: string;
  nome: string;
  template: string;
  especialidade?: string;
  ativo: boolean;
  createdAt: string;
}
```

## Testes Realizados ✅

### Backend
- ✅ `GET /api/recipes?page=1&limit=10` - 200 OK
- ✅ `GET /api/recipes/templates/list` - 200 OK
- ✅ `POST /api/recipes` - 201 Created
- ✅ `GET /api/recipes/consultation/:id` - 200 OK

### Status das APIs
- **Produtos**: ✅ Funcionando
- **Receitas**: ✅ Funcionando
- **Templates**: ✅ Funcionando

## Próximos Passos

1. **Atualizar o frontend** para usar as rotas corretas
2. **Implementar tratamento de erro** adequado
3. **Adicionar loading states** para melhor UX
4. **Testar integração** completa frontend-backend

## URLs de Teste

- **Health Check**: `GET http://localhost:3001/health`
- **Listar Receitas**: `GET http://localhost:3001/api/recipes?page=1&limit=10`
- **Templates**: `GET http://localhost:3001/api/recipes/templates/list`

---

**Status**: ✅ Backend corrigido e funcionando
**Próximo**: Atualizar frontend para usar as rotas corretas
