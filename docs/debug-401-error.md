# Diagnóstico do Erro 401 - Start Consultation

## Problema
O endpoint `POST /api/appointments/{id}/start-consultation` está retornando erro 401 (Unauthorized).

## Logs de Debug Adicionados

Foram adicionados logs de debug nos seguintes arquivos para identificar a causa do erro:

### 1. `src/middlewares/authMiddleware.ts`
- Logs mostram se o token está sendo enviado
- Verificação do formato do token
- Decodificação do JWT
- Validação dos dados do token

### 2. `src/middlewares/checkUnidadeMiddleware.ts`
- Verificação do header `x-unidade`
- Comparação entre unidade do header e do token
- Validação de unidade válida (BARRA ou TIJUCA)

### 3. `src/controllers/AppointmentController.ts`
- Logs no método `startConsultation`
- Verificação dos parâmetros recebidos
- Validação de autenticação

## Como Testar

1. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

2. **Faça uma requisição para o endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/appointments/1b5f6d15-681f-4c6b-a0e4-aedc047b8e2b/start-consultation \
     -H "Authorization: Bearer SEU_TOKEN_AQUI" \
     -H "x-unidade: BARRA" \
     -H "Content-Type: application/json"
   ```

3. **Verifique os logs no console do servidor** para identificar onde está falhando.

## Possíveis Causas do Erro 401

### 1. Token não enviado
- **Log:** `❌ [AUTH DEBUG] Token de acesso não fornecido`
- **Solução:** Verificar se o header `Authorization` está sendo enviado

### 2. Formato de token inválido
- **Log:** `❌ [AUTH DEBUG] Formato de token inválido`
- **Solução:** Verificar se o token está no formato `Bearer TOKEN`

### 3. Token inválido ou expirado
- **Log:** `❌ [AUTH DEBUG] Erro ao verificar token: [erro]`
- **Solução:** Gerar um novo token através do login

### 4. Token com dados incompletos
- **Log:** `❌ [AUTH DEBUG] Token com dados incompletos`
- **Solução:** Verificar se o token contém id, role e unidade

### 5. Unidade não especificada
- **Log:** `❌ [UNIDADE DEBUG] Unidade não especificada no header`
- **Solução:** Adicionar header `x-unidade: BARRA` ou `x-unidade: TIJUCA`

### 6. Unidade inválida
- **Log:** `❌ [UNIDADE DEBUG] Unidade inválida: [unidade]`
- **Solução:** Usar apenas `BARRA` ou `TIJUCA`

### 7. Conflito de unidade
- **Log:** `❌ [UNIDADE DEBUG] Unidade do header não confere com a do token`
- **Solução:** Verificar se a unidade do header corresponde à unidade do token

## Headers Necessários

Para que o endpoint funcione, são necessários os seguintes headers:

```http
Authorization: Bearer <token_jwt>
x-unidade: BARRA ou TIJUCA
Content-Type: application/json
```

## Exemplo de Requisição Válida

```javascript
const response = await fetch('http://localhost:3000/api/appointments/1b5f6d15-681f-4c6b-a0e4-aedc047b8e2b/start-consultation', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-unidade': 'BARRA',
    'Content-Type': 'application/json'
  }
});
```

## Próximos Passos

1. Execute o servidor e faça a requisição
2. Verifique os logs no console
3. Identifique qual validação está falhando
4. Corrija o problema baseado nos logs
5. Remova os logs de debug após resolver o problema
