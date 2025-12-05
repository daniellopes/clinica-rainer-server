# Regra de Separação: Consulta Médica vs Procedimento

## Visão Geral

Foi implementada uma regra no backend para diferenciar agendamentos de **Consultas Médicas** e **Procedimentos**, permitindo que o frontend direcione cada tipo para a tela apropriada.

## Como Funciona

### Definição de Tipo

O tipo é determinado pela **categoria do procedimento**:
- **Consulta Médica**: Procedimentos com `categoria = "Consulta"`
- **Procedimento**: Qualquer outra categoria (ex: "Procedimento", "Estética", etc.)

### Filtro na API

O endpoint `GET /api/appointments` agora aceita o parâmetro `tipo`:

```
GET /api/appointments?tipo=consulta      # Lista apenas consultas médicas
GET /api/appointments?tipo=procedimento  # Lista apenas procedimentos
GET /api/appointments                    # Lista todos (sem filtro)
```

**⚠️ Regra Importante:** Quando o filtro `tipo` é usado (consulta ou procedimento), apenas agendamentos com status **CONFIRMADO** ou posterior aparecem. Agendamentos com status **AGENDADO** não são retornados nesses casos, pois ainda não estão confirmados e não devem aparecer nas telas de execução ou consulta médica.

### Resposta da API

Cada agendamento retornado agora inclui campos adicionais:

```json
{
  "id": "...",
  "patient": {...},
  "procedure": {
    "id": "...",
    "nome": "CONSULTA MEDICA / EMAGRE",
    "categoria": "Consulta",
    ...
  },
  "isConsulta": true,          // Campo calculado: true se categoria = "Consulta"
  "tipo": "consulta",          // Campo calculado: "consulta" ou "procedimento"
  ...
}
```

## Exemplos de Uso

### 1. Listar Apenas Consultas Médicas

```bash
# Lista consultas confirmadas ou posteriores (não inclui AGENDADO)
GET /api/appointments?tipo=consulta

# Filtrar por status específico (deve ser CONFIRMADO, EM_ATENDIMENTO ou CONCLUIDO)
GET /api/appointments?tipo=consulta&status=CONFIRMADO
GET /api/appointments?tipo=consulta&status=CONCLUIDO
```

### 2. Listar Apenas Procedimentos

```bash
# Lista procedimentos confirmados ou posteriores (não inclui AGENDADO)
GET /api/appointments?tipo=procedimento

# Filtrar por status específico (deve ser CONFIRMADO, EM_ATENDIMENTO ou CONCLUIDO)
GET /api/appointments?tipo=procedimento&status=CONFIRMADO
GET /api/appointments?tipo=procedimento&status=CONCLUIDO
```

### 3. Combinar com Outros Filtros

```bash
# Consultas médicas agendadas para hoje
GET /api/appointments?tipo=consulta&status=AGENDADO&dataInicio=2024-01-01T00:00:00Z&dataFim=2024-01-01T23:59:59Z

# Procedimentos executados não pagos
GET /api/appointments?tipo=procedimento&status=executado_nao_pago
```

## Implementação no Frontend

### Tela de Consulta Médica

Filtrar agendamentos do tipo "consulta":

```typescript
const response = await api.get('/appointments', {
  params: {
    tipo: 'consulta',
    status: 'AGENDADO',
    // ... outros filtros
  }
});
```

### Tela de Execução

Filtrar agendamentos do tipo "procedimento":

```typescript
const response = await api.get('/appointments', {
  params: {
    tipo: 'procedimento',
    status: 'executado',
    // ... outros filtros
  }
});
```

## Categorias de Procedimentos

### Consultas Médicas (categoria = "Consulta")
- CONSULTA MEDICA / EMAGRE
- Consulta Nutricional Méd
- CONSULTA DERMATOLÓGICA
- AVALIAÇÃO DE ROTINA
- Qualquer procedimento com categoria "Consulta"

### Procedimentos (categoria != "Consulta")
- APLICAÇÃO (categoria: "Procedimento")
- LIMPEZA DE PELE (categoria: "Estética")
- PEELING QUÍMICO (categoria: "Estética")
- Qualquer procedimento que não seja categoria "Consulta"

## Roteamento Sugerido

1. **Ao criar um agendamento**: Verificar a categoria do procedimento e redirecionar automaticamente
2. **Na listagem de agendamentos**: Usar o filtro `tipo` para mostrar apenas o que é relevante para cada tela
3. **Ao abrir um agendamento**: Usar o campo `isConsulta` ou `tipo` para determinar qual tela abrir

## Regra de Status para Telas de Execução e Consulta

### Status Permitidos

Quando um agendamento é filtrado por `tipo` (consulta ou procedimento), apenas os seguintes status são retornados:

- ✅ **CONFIRMADO** - Agendamento confirmado pelo paciente
- ✅ **EM_ATENDIMENTO** - Consulta ou procedimento em andamento
- ✅ **CONCLUIDO** - Consulta ou procedimento finalizado

### Status Excluídos

- ❌ **AGENDADO** - Agendamentos ainda não confirmados **NÃO aparecem** nas telas de execução ou consulta
- ❌ **CANCELADO** - Agendamentos cancelados
- ❌ **FALTOU** - Paciente não compareceu

### Comportamento

1. **Sem filtro de tipo**: Todos os status são retornados normalmente
2. **Com filtro de tipo (`tipo=consulta` ou `tipo=procedimento`)**: Apenas status CONFIRMADO ou posterior são retornados
3. **Filtro de status personalizado**: Se você especificar um status válido (CONFIRMADO, EM_ATENDIMENTO, CONCLUIDO), ele será respeitado. Status inválidos (AGENDADO, CANCELADO, FALTOU) são ignorados quando há filtro de tipo

## Observações Importantes

- O filtro é **case-insensitive** para a categoria "Consulta"
- O campo `isConsulta` é calculado automaticamente na resposta
- O campo `tipo` também é calculado e pode ser "consulta" ou "procedimento"
- Agendamentos com status "AGENDADO" **não aparecem** nas telas de execução ou consulta médica
- Todos os outros filtros existentes continuam funcionando normalmente
