# Next.js 15: Error Handling - Quick Reference (Folha de Cola)

## Instalação Rápida

```bash
npm install @sentry/nextjs @sentry/tracing zod winston pino dotenv

# Opcional (monitoramento)
npm install @upstash/ratelimit @upstash/redis @pushover/node
```

---

## Environment Variables Essenciais

```bash
NEXT_PUBLIC_SENTRY_DSN=https://key@sentry.io/id
PUSHOVER_APP_TOKEN=token
PUSHOVER_OPERATOR_KEY=key
DATABASE_URL=postgresql://...
PROTEO_API_URL=https://api.proteo.com.br
PROTEO_API_KEY=key
JWT_SECRET=super-secret-key
```

---

## 1. Error Boundaries

### Global (app/error.tsx)
```typescript
'use client'

export default function Error({ error, reset }) {
  return (
    <div>
      <h1>Algo deu errado!</h1>
      <button onClick={() => reset()}>Tentar Novamente</button>
    </div>
  )
}
```

### Segmentado (app/dashboard/error.tsx)
```typescript
'use client'

export default function DashboardError({ error, reset }) {
  return <div>Erro no Dashboard: {error.message}</div>
}
```

### 404 (app/not-found.tsx)
```typescript
export default function NotFound() {
  return <div>Página não encontrada</div>
}
```

---

## 2. Classes de Erro

### Criar Erro
```typescript
import { ValidationError, AuthenticationError } from '@/lib/errors'

// Validação
throw new ValidationError('Valor inválido', { field: 'amount' })

// Autenticação
throw new AuthenticationError('Credenciais inválidas')

// Não encontrado
throw new NotFoundError('Usuário')

// Conflito
throw new ConflictError('Email já registrado')

// Rate Limit
throw new RateLimitError('Muitas requisições')
```

---

## 3. Logger

### Debug
```typescript
import { logger } from '@/lib/logger'

logger.debug('Debug message', { data: 'value' })
```

### Info
```typescript
logger.info('Ação importante', { userId: '123', action: 'deposit' })
```

### Warn
```typescript
logger.warn('Aviso', { issue: 'problema' })
```

### Error
```typescript
logger.error('Erro ocorreu', error, { context: 'data' })
```

### Medir Tempo
```typescript
await logger.measure('Operação', async () => {
  // fazer algo
}, { context: 'data' })
```

---

## 4. Route Handler com Error

### Template Básico
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const body = await request.json()

    // Sua lógica aqui

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erro ao processar', error, { requestId })
    const errorResponse = await handleApiError(error, { requestId })
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode
    })
  }
}
```

### Com Validação (Zod)
```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
})

try {
  const data = schema.parse(body)
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validação falhou', details: error.errors },
      { status: 400 }
    )
  }
}
```

---

## 5. Mensagens Amigáveis ao Usuário

### Mapeamento Básico
```typescript
import { getUserFriendlyMessage } from '@/lib/user-messages'

const message = getUserFriendlyMessage('INVALID_EMAIL')
// "O e-mail fornecido é inválido"
```

### Códigos Disponíveis
```typescript
'INVALID_EMAIL'           // "O e-mail fornecido é inválido"
'INVALID_CPF'            // "O CPF fornecido é inválido"
'INVALID_CREDENTIALS'    // "E-mail ou senha incorretos"
'ACCOUNT_LOCKED'         // "Sua conta foi bloqueada"
'SESSION_EXPIRED'        // "Sua sessão expirou"
'KYC_PENDING'           // "Sua verificação está pendente"
'KYC_FAILED'            // "Sua verificação foi rejeitada"
'INSUFFICIENT_BALANCE'   // "Saldo insuficiente"
'NETWORK_ERROR'         // "Erro de conexão"
'TIMEOUT'               // "A operação demorou muito"
'INTERNAL_ERROR'        // "Erro no servidor"
```

---

## 6. Sentry - Tracking

### Capturar Exceção
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.captureException(error, {
  tags: { section: 'dashboard' },
  contexts: { user: { id: userId } }
})
```

### Capturar Mensagem
```typescript
Sentry.captureMessage('Algo anormal', 'warning', {
  tags: { type: 'business_logic' }
})
```

### Transaction (Performance)
```typescript
const transaction = Sentry.startTransaction({
  op: 'api.deposit',
  name: 'POST /api/deposits'
})

try {
  // fazer algo
} finally {
  transaction.finish()
}
```

---

## 7. Monitoring

### Pushover (Notificar Operador)
```typescript
import { monitoring } from '@/lib/monitoring'

await monitoring.sendPushoverAlert(
  process.env.PUSHOVER_OPERATOR_KEY!,
  'Novo Depósito',
  'R$ 100 recebido',
  { priority: 1, ttl: 3600 }
)
```

### Rate Limiting
```typescript
const rateLimit = await monitoring.checkRateLimit(
  `user:${userId}`,
  10,      // máximo 10
  3600000  // por hora
)

if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Muitas requisições' },
    { status: 429 }
  )
}
```

### Health Check
```typescript
const health = await monitoring.healthCheck()

if (health.status !== 'healthy') {
  logger.warn('Sistema degradado', health)
}
```

### Atividade Suspeita
```typescript
await monitoring.alertSuspiciousActivity(
  userId,
  'multiple_failed_logins',
  { attempts: 5, ip: '192.168.1.1' }
)
```

---

## 8. Client Component com Erro

### Fetch com Erro
```typescript
'use client'

import { useState } from 'react'
import { getUserFriendlyMessage } from '@/lib/user-messages'

export function MyForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const data = await response.json()

      if (!response.ok) {
        const msg = getUserFriendlyMessage(data.error?.code)
        setError(msg)
        return
      }

      // sucesso
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <button disabled={loading}>
        {loading ? 'Processando...' : 'Enviar'}
      </button>
    </form>
  )
}
```

---

## 9. Retry com Backoff

### Automaticamente
```typescript
import { withRetry } from '@/lib/error-handler'

const result = await withRetry(
  async () => {
    return await fetch('/api/endpoint').then(r => r.json())
  },
  {
    maxRetries: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    onRetry: (attempt) => logger.info(`Retry ${attempt}`)
  }
)
```

---

## 10. Estrutura de Resposta API

### Sucesso
```json
{
  "success": true,
  "data": {
    "id": "123",
    "amount": 100.50
  },
  "timestamp": "2025-11-16T10:30:00Z"
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados fornecidos são inválidos",
    "statusCode": 400,
    "details": {
      "field": "email",
      "message": "Email inválido"
    },
    "requestId": "123e4567-e89b",
    "timestamp": "2025-11-16T10:30:00Z"
  }
}
```

---

## 11. Status Codes HTTP

| Código | Erro | Quando Usar |
|--------|------|-------------|
| 400 | ValidationError | Dados inválidos |
| 401 | AuthenticationError | Não autenticado |
| 403 | AuthorizationError | Não autorizado |
| 404 | NotFoundError | Recurso não existe |
| 409 | ConflictError | Email já existe |
| 429 | RateLimitError | Muitas requisições |
| 500 | InternalServerError | Erro inesperado |
| 502 | ExternalServiceError | Serviço externo falhou |

---

## 12. Checklist Antes de Produção

```
Código:
- [ ] Todos error.tsx implementados
- [ ] Logging em pontos críticos
- [ ] Validação com Zod
- [ ] Mensagens amigáveis
- [ ] Retry logic onde necessário

Testes:
- [ ] Testes unitários de erros
- [ ] Testes de validação
- [ ] Testes E2E de fluxos
- [ ] Teste com Sentry Mock

Configuração:
- [ ] .env.local completo
- [ ] SENTRY_DSN correto
- [ ] PUSHOVER keys corretas
- [ ] DATABASE_URL válido
- [ ] Todas env vars obrigatórias

Deploy:
- [ ] npm run build sem erros
- [ ] npm run test passing
- [ ] Sentry conectado
- [ ] Pushover testado
- [ ] Health check funcionando

Monitoramento:
- [ ] Dashboard Sentry ativo
- [ ] Alertas configurados
- [ ] Logs sendo salvos
- [ ] Pushover testado
- [ ] Health check respondendo
```

---

## 13. Comandos Úteis

```bash
# Validar environment
npm run validate-env

# Rodar testes
npm run test
npm run test:coverage

# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Desenvolvimento
npm run dev

# Produção
npm run start
```

---

## 14. Console Útil para Debug

```typescript
// Listar todas variáveis de ambiente
console.log(process.env)

// Verificar se em produção
console.log(process.env.NODE_ENV === 'production')

// Sentry status
console.log(Sentry.getClient()?.isEnabled())

// Logger test
logger.info('Test message', { data: 'test' })
```

---

## 15. Erros Comuns e Soluções

| Erro | Solução |
|------|---------|
| "SENTRY_DSN is not set" | Configurar NEXT_PUBLIC_SENTRY_DSN |
| "DATABASE_URL is not set" | Configurar DATABASE_URL no .env |
| "Pushover not sending" | Verificar tokens e internet |
| "Logs not appearing" | Verificar LOG_LEVEL e endpoint |
| "Build fails with error.tsx" | Certificar que é 'use client' |
| "Zod parse error" | Verificar schema vs dados |

---

## 16. Arquivos Principais

```
lib/errors.ts               # Definições de erro
lib/error-handler.ts        # Handler global
lib/logger.ts              # Logging
lib/monitoring.ts          # Monitoramento
lib/user-messages.ts       # Mensagens amigáveis
lib/sentry-server.ts       # Sentry servidor
instrumentation.ts         # Init Sentry

app/error.tsx              # Global error boundary
app/not-found.tsx          # 404 page
app/[section]/error.tsx    # Segmentados

middleware.ts              # Middleware global
```

---

## 17. Atalhos Importantes

### Importar logger
```typescript
import { logger } from '@/lib/logger'
```

### Importar erros
```typescript
import { ValidationError, AppError } from '@/lib/errors'
```

### Importar user messages
```typescript
import { getUserFriendlyMessage } from '@/lib/user-messages'
```

### Importar monitoring
```typescript
import { monitoring } from '@/lib/monitoring'
```

### Importar error handler
```typescript
import { handleApiError } from '@/lib/error-handler'
```

---

## 18. Regex Útil para Validação

```typescript
// CPF (11 dígitos)
/^\d{11}$/

// Email
/^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Telefone (10-11 dígitos)
/^\d{10,11}$/

// Carteira Ethereum (42 caracteres com 0x)
/^0x[a-fA-F0-9]{40}$/

// Carteira Solana (32-44 caracteres)
/^[1-9A-HJ-NP-Z]{32,44}$/

// URL
/^https?:\/\/[^\s]+$/
```

---

## 19. Exemplo Completo Minimalista

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { ValidationError } from '@/lib/errors'
import { handleApiError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const body = await request.json()

    if (!body.email) {
      throw new ValidationError('Email é obrigatório')
    }

    logger.info('Criando usuário', { requestId, email: body.email })

    // Sua lógica aqui
    const user = { id: '123', email: body.email }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    logger.error('Erro ao criar usuário', error, { requestId })
    const errorResponse = await handleApiError(error, { requestId })
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode
    })
  }
}
```

---

## 20. Links Rápidos

- [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Zod Docs](https://zod.dev/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Pushover API](https://pushover.net/api)

---

**Última atualização:** 16 de Novembro de 2025

Dúvidas? Consulte os documentos principais:
1. NEXTJS_15_ERROR_HANDLING.md
2. ERROR_HANDLING_EXAMPLES.md
3. ERROR_HANDLING_SETUP.md
