# Next.js 15: Error Handling & Logging - Sumário Executivo

## Visão Geral

Este documento consolida toda a estratégia de tratamento de erros e logging para seu projeto P2P de criptomoedas em Next.js 15. Foram criados 4 documentos principais que cobrem desde conceitos até implementação prática.

---

## Documentos Criados

### 1. NEXTJS_15_ERROR_HANDLING.md
**Guia Completo teórico e prático**

Cobre:
- Error Boundaries (app router)
- Global Error Handling com classes customizadas
- Integração com Sentry
- Padrões de Logging
- Mensagens de erro amigáveis ao usuário
- Sistema de Monitoramento e Alertas
- Arquitetura recomendada
- Checklist de implementação

**Tamanho:** 1700+ linhas com exemplos completos

---

### 2. ERROR_HANDLING_EXAMPLES.md
**Exemplos práticos de implementação**

Contém:
- Sistema de autenticação com error handling
- API de depósito com integração KYC
- Client components com gerenciamento de erros
- Painel administrativo com monitoramento
- Exemplos de integração com Proteo (KYC)
- Exemplos de integração com Pushover (notificações)

**Tamanho:** 800+ linhas com código pronto para usar

---

### 3. ERROR_HANDLING_SETUP.md
**Configuração técnica e environment**

Inclui:
- Instruções de instalação de dependências
- Arquivo .env.local, production, test
- Estrutura recomendada de diretórios
- Configuração do Next.js
- Configuração do TypeScript
- Setup de Sentry
- Setup de Jest e Testing
- Package.json scripts
- Checklist de deploy

**Tamanho:** 600+ linhas com configurações prontas

---

### 4. ERROR_HANDLING_SUMMARY.md (este arquivo)
**Resumo executivo e guia de uso**

---

## Arquitetura de Erro Handling

### 1. Camada de Definição de Erros
```
lib/errors.ts
├── AppError (base)
├── ValidationError (400)
├── AuthenticationError (401)
├── AuthorizationError (403)
├── NotFoundError (404)
├── ConflictError (409)
├── RateLimitError (429)
├── InternalServerError (500)
└── ExternalServiceError (502)
```

### 2. Camada de Handling
```
lib/error-handler.ts
├── handleApiError() - normalizar erros para API
├── withErrorHandler() - wrapper de funções
├── withRetry() - retry automático com backoff
└── ErrorResponse interface
```

### 3. Camada de Logging
```
lib/logger.ts
├── debug() - info de desenvolvimento
├── info() - informações gerais
├── warn() - avisos
├── error() - erros
├── fatal() - críticos
└── measure() - medir tempo de execução
```

### 4. Camada de Monitoramento
```
lib/monitoring.ts
├── sendPushoverAlert() - notificações via Pushover
├── checkRateLimit() - verificar limite de taxa
├── alertSuspiciousActivity() - detectar atividades suspeitas
└── healthCheck() - verificar saúde da app
```

### 5. Camada de User Messages
```
lib/user-messages.ts
├── getUserFriendlyMessage() - mensagem amigável
├── buildUserErrorResponse() - resposta estruturada
└── userFriendlyMessages{} - mapeamento de mensagens
```

### 6. Camada de Tracking (Sentry)
```
lib/sentry-server.ts - configuração servidor
lib/sentry-client.tsx - configuração cliente
instrumentation.ts - inicialização
```

---

## Fluxo de Tratamento de Erro

### Exemplo: Requisição de API

```
1. Cliente envia requisição
   ↓
2. Route Handler captura erro
   ↓
3. Error Handler processa
   ├── Validar tipo de erro
   ├── Logger registra evento
   └── Sentry captura (se for crítico)
   ↓
4. Normalizar resposta
   ├── Status code correto
   ├── Mensagem amigável
   └── Request ID para rastreamento
   ↓
5. Pushover notifica operadores (se necessário)
   ↓
6. Retornar resposta formatada ao cliente
```

---

## Implementação Passo a Passo

### Fase 1: Setup Inicial (1-2 horas)

```bash
# 1. Instalar dependências
npm install @sentry/nextjs @sentry/tracing zod winston pino

# 2. Copiar arquivos do ERROR_HANDLING_EXAMPLES.md
cp lib/errors.ts .
cp lib/error-handler.ts .
cp lib/logger.ts .
cp lib/user-messages.ts .
cp lib/monitoring.ts .

# 3. Configurar .env.local (ver ERROR_HANDLING_SETUP.md)
cp .env.example .env.local

# 4. Validar variáveis de ambiente
npm run validate-env

# 5. Iniciar servidor
npm run dev
```

### Fase 2: Error Boundaries (30 minutos)

```typescript
// 1. Criar app/error.tsx (global)
// 2. Criar app/not-found.tsx
// 3. Criar app/layout.tsx com ErrorBoundary
// 4. Criar error.tsx em seções críticas
```

### Fase 3: Sentry Integration (1 hora)

```bash
# 1. Criar conta em https://sentry.io/
# 2. Copiar DSN
# 3. Configurar NEXT_PUBLIC_SENTRY_DSN em .env.local
# 4. Implementar instrumentation.ts
# 5. Testar captura de erros
```

### Fase 4: API Error Handling (2 horas)

```typescript
// Implementar em cada route handler:
// 1. try/catch com error-handler
// 2. Logging de eventos
// 3. Normalização de resposta
// 4. Sentry capture para erros críticos
```

### Fase 5: Monitoring (1 hora)

```typescript
// 1. Configurar Pushover (https://pushover.net/)
// 2. Implementar sendPushoverAlert em pontos críticos
// 3. Testar notificações
```

---

## Exemplos Rápidos

### Error Boundary em Componente

```typescript
'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Algo deu errado!</h2>
      <button onClick={() => reset()}>Tentar Novamente</button>
    </div>
  )
}
```

### Validação com Zod

```typescript
import { z } from 'zod'
import { ValidationError } from '@/lib/errors'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha muito curta'),
})

try {
  const valid = schema.parse(data)
} catch (error) {
  if (error instanceof z.ZodError) {
    throw new ValidationError('Dados inválidos', {
      errors: error.errors,
    })
  }
}
```

### Logging de Operação

```typescript
import { logger } from '@/lib/logger'

await logger.measure(
  'Processing deposit',
  async () => {
    // sua lógica aqui
  },
  { requestId, userId }
)
```

### Alertar Operadores

```typescript
import { monitoring } from '@/lib/monitoring'

await monitoring.sendPushoverAlert(
  process.env.PUSHOVER_OPERATOR_KEY!,
  'Novo Depósito',
  `Depósito de R$ 100 recebido`,
  { priority: 1, ttl: 3600 }
)
```

---

## Checklist de Implementação

### Sprint 1: Fundação (1 semana)
- [ ] Instalar e configurar dependências
- [ ] Criar classes de erro customizadas
- [ ] Implementar logger
- [ ] Criar error.tsx e not-found.tsx
- [ ] Configurar TypeScript strict mode

### Sprint 2: Integração (1 semana)
- [ ] Configurar Sentry (dev + prod)
- [ ] Implementar error-handler em route handlers
- [ ] Adicionar logging em pontos críticos
- [ ] Criar user-messages.ts
- [ ] Implementar retry logic

### Sprint 3: Monitoramento (1 semana)
- [ ] Configurar Pushover
- [ ] Implementar health checks
- [ ] Adicionar alertas de atividade suspeita
- [ ] Implementar rate limiting
- [ ] Criar dashboard de monitoramento

### Sprint 4: Testes e Deploy (1 semana)
- [ ] Testes unitários de error handling
- [ ] Testes de integração
- [ ] Testes E2E de fluxos de erro
- [ ] Validação em staging
- [ ] Deploy em produção
- [ ] Monitoramento pós-deploy

---

## Métricas e Monitoramento

### KPIs a Acompanhar

1. **Taxa de Erro**
   - % de requisições com erro
   - Tendência ao longo do tempo
   - Por endpoint

2. **Tipos de Erro Mais Comuns**
   - Erros de validação
   - Erros de autenticação
   - Erros de serviço externo
   - Erros do servidor

3. **Tempo de Resposta**
   - P95, P99 de latência
   - Por endpoint
   - Com retry vs sem

4. **Disponibilidade**
   - Uptime %
   - MTTR (Mean Time To Recovery)
   - Por serviço

### Alertas Recomendados

```
Critical:
- Taxa de erro > 5%
- Serviço externo indisponível
- Database down
- Memory usage > 80%

Warning:
- Taxa de erro > 2%
- Latência P95 > 500ms
- Rate limit próximo do limite
- Muitas atividades suspeitas
```

---

## Segurança e Conformidade

### Lei 9.613/1998 (Anti-Lavagem)
- Manter logs por 5 anos (armazenar com cuidado)
- Registrar todas as verificações KYC
- Alertar sobre atividades suspeitas
- Implementado em `lib/monitoring.ts`

### LGPD
- Mascarar dados sensíveis em logs (CPF, email)
- Permitir delete de dados
- Explicar por que dados são coletados
- Implementado em exemplos

### Autenticação e Autorização
- JWT com expiração apropriada
- Rate limiting para login
- Alertar sobre atividades suspeitas
- MFA para admin

---

## Troubleshooting Comum

### 1. Sentry não está capturando erros

**Solução:**
- Verificar NEXT_PUBLIC_SENTRY_DSN
- Verificar que instrumentation.ts está configurado
- Testar com erro manual
- Verificar sample rate (pode estar 0)

### 2. Logs não aparecem

**Solução:**
- Verificar LOG_LEVEL (deve incluir o nível do log)
- Verificar LOG_ENDPOINT está configurado
- Testar conexão de rede
- Verificar permissões do serviço

### 3. Pushover não envia notificações

**Solução:**
- Verificar PUSHOVER_APP_TOKEN e PUSHOVER_OPERATOR_KEY
- Testar com curl direto
- Verificar internet conectada
- Testar com prioridade diferente

### 4. Performance degradada com logging

**Solução:**
- Reduzir sample rate em produção
- Usar async logging
- Implementar batching
- Considerar usar Pino em vez de Winston

---

## Recursos e Links Úteis

### Documentação Oficial
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Zod Docs](https://zod.dev/)

### Ferramentas Recomendadas
- **Sentry**: Error tracking e performance monitoring
- **Pushover**: Notificações para operadores
- **Upstash**: Redis para rate limiting
- **DataDog**: APM e monitoring
- **CloudWatch**: AWS logging

### Best Practices
- [12 Factor App - Logs](https://12factor.net/logs)
- [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [OWASP - Error Handling](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)

---

## Próximos Passos

1. **Ler os documentos**
   - Começar com NEXTJS_15_ERROR_HANDLING.md
   - Depois ler ERROR_HANDLING_EXAMPLES.md
   - Setup com ERROR_HANDLING_SETUP.md

2. **Implementar gradualmente**
   - Começar com error boundaries
   - Depois logger
   - Depois Sentry
   - Finalmente monitoring

3. **Testar tudo**
   - Testes unitários
   - Testes de integração
   - Testes E2E
   - Teste com falhas reais

4. **Deploy com cuidado**
   - Deploy em staging primeiro
   - Testar fluxos críticos
   - Monitor durante deploy
   - Estar pronto para rollback

---

## Support e Dúvidas

Para dúvidas sobre implementação:
1. Consultar a documentação oficial (links acima)
2. Verificar exemplos em ERROR_HANDLING_EXAMPLES.md
3. Revisar configuração em ERROR_HANDLING_SETUP.md
4. Testar localmente antes de colocar em produção

---

## Changelog

### v1.0 (16/11/2025)
- Criação inicial dos 4 documentos
- Cobertura completa de error handling
- Exemplos práticos de implementação
- Setup de ambiente
- Checklist de deployment

---

**Última atualização:** 16 de Novembro de 2025
**Versão:** Next.js 15
**Status:** Pronto para Implementação
