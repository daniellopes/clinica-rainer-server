# Correção: Rota /api/contas-pagar retornando 404

## ✅ Status do Backend

A rota `/api/contas-pagar` está **funcionando corretamente** no backend:
- ✅ Servidor rodando na porta **3001**
- ✅ Rota registrada em `src/routes/index.ts`
- ✅ Controller implementado
- ✅ Tabela `contas_pagar` criada no banco de dados
- ✅ Rota retorna 401 quando não autenticada (comportamento esperado)

## ❌ Problema no Frontend

O frontend está tentando acessar:
```
GET http://localhost:3000/api/contas-pagar
```

Mas o backend está em:
```
http://localhost:3001/api/contas-pagar
```

## 🔧 Soluções

### Opção 1: Configurar Proxy no Next.js (Recomendado)

Crie ou edite o arquivo `next.config.js` no frontend:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*', // Backend URL
      },
    ];
  },
};

module.exports = nextConfig;
```

Depois, reinicie o servidor do frontend.

### Opção 2: Usar Variável de Ambiente

1. Crie/edite o arquivo `.env.local` no frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

2. Atualize o serviço de API para usar essa variável:

```typescript
// src/services/api.ts ou similar
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: apiUrl,
  // ... outras configurações
});
```

### Opção 3: Configurar Axios com URL Base Correta

No arquivo onde o axios está configurado (provavelmente `src/services/api.ts` ou `contasPagarService.ts`):

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api', // ✅ Porta correta do backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

## 🧪 Teste Manual

Após corrigir, teste a rota:

```bash
# Com autenticação (no Postman ou similar)
GET http://localhost:3001/api/contas-pagar
Headers:
  Authorization: Bearer <seu-token>
  x-unidade: BARRA
```

## 📝 Notas Importantes

1. **Backend na porta 3001**: O servidor backend está configurado para rodar na porta 3001
2. **Frontend na porta 3000**: Next.js normalmente roda na porta 3000
3. **Autenticação obrigatória**: A rota requer token JWT válido no header `Authorization`
4. **Unidade obrigatória**: Header `x-unidade` deve ser `BARRA` ou `TIJUCA`

## 🚀 Próximos Passos

1. Ajustar configuração do frontend (escolha uma das opções acima)
2. Reiniciar o servidor do frontend
3. Testar novamente a funcionalidade de contas a pagar

