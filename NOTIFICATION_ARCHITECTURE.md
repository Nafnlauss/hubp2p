# Arquitetura de Notificações - Diagrama e Fluxos

Visualização da arquitetura, fluxos de dados e padrões de integração.

---

## 1. Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        APLICAÇÃO (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Triggers de Notificação                      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • API Routes (/api/deposits/confirm)                     │  │
│  │ • Server Actions (notifyDepositConfirmed)                │  │
│  │ • Webhooks (webhooks/deposit-notification)               │  │
│  │ • Event Listeners (on transaction.confirmed)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                ↓                ↓                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         NotificationService (Orquestrador)               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • Validação de payload                                   │  │
│  │ • Routing de canal                                       │  │
│  │ • Retry logic com backoff exponencial                    │  │
│  │ • Logging e auditoria                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│           ↓                ↓                ↓                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐  │
│  │ Pushover Client │ │ Email Service   │ │ SMS Service      │  │
│  │ (Primary)       │ │ (Fallback 1)    │ │ (Fallback 2)     │  │
│  └─────────────────┘ └─────────────────┘ └──────────────────┘  │
│           ↓                ↓                ↓                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Notification Monitor (Logging)                   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ • Supabase notification_logs                             │  │
│  │ • Sentry para erros críticos                             │  │
│  │ • Métricas de sucesso/falha                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         ↓                ↓                ↓
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │  Pushover    │ │ Resend/      │ │  Twilio      │
   │  (Mobile)    │ │ SendGrid     │ │  (SMS)       │
   │              │ │ (Email)      │ │              │
   └──────────────┘ └──────────────┘ └──────────────┘
         ↓                ↓                ↓
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │   iOS/       │ │   Email      │ │ Celular SMS  │
   │   Android    │ │   Inbox      │ │              │
   └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 2. Fluxo de Notificação com Retry

```
Evento (ex: Novo Depósito)
    │
    ↓
┌─────────────────────────────────────────┐
│ NotificationService.send({...})         │
│ - Validar payload                       │
│ - Determinar canais                     │
│ - Definir prioridade e retry            │
└─────────────────────────────────────────┘
    │
    ├─→ Tentativa 1 (Pushover)
    │   ├─→ Sucesso? SIM → Log sucesso, return
    │   ├─→ Sucesso? NÃO → Verificar erro
    │   │
    │   ├─→ Erro Retry-able? (5xx, timeout, rate limit)
    │   │   ├─→ SIM → Aguardar delay exponencial
    │   │   │        Delay = 1000 * 2^(attempt-1)
    │   │   │        Com jitter (±20%)
    │   │   │        Voltar para Tentativa 2
    │   │   │
    │   ├─→ Erro Não-Retry-able? (4xx, invalid token)
    │   │   └─→ Falhar imediatamente
    │   │
    │   └─→ Max retries atingido?
    │       └─→ Fallback para próximo canal
    │
    ├─→ Tentativa 2 (Email - Resend)
    │   └─→ [mesmo fluxo acima]
    │
    ├─→ Tentativa 3 (SMS - Twilio)
    │   └─→ [mesmo fluxo acima]
    │
    └─→ Resultado Final
        ├─→ Sucesso em algum canal: return {success: true}
        └─→ Falha em todos: return {success: false, attempts: 3}
        
        ↓
    Log resultado em notification_logs
    └─→ Se crítico: Alertar em Sentry
```

---

## 3. Estrutura de Dados

### Entrada: NotificationPayload

```typescript
{
  userKey: string;                    // Pushover user key
  email?: string;                     // Email de fallback
  title: string;                      // Título da notificação
  message: string;                    // Corpo da mensagem
  type: NotificationType;             // Tipo de notificação
  priority?: NotificationPriority;    // Nível (-2 a 2)
  metadata?: {                        // Dados contextuais
    url?: string;                     // URL para abrir
    urlTitle?: string;                // Texto do botão
    customerName?: string;            // Nome do cliente
    amount?: number;                  // Valor da transação
    transactionId?: string;           // ID da transação
  };
  channels?: string[];                // ['pushover', 'email', 'sms']
  retryOptions?: {
    maxRetries?: number;              // 1-5
    initialDelayMs?: number;          // 500-5000
    backoffMultiplier?: number;       // 1.5-3
  };
}
```

### Saída: NotificationResult[]

```typescript
[
  {
    success: true;
    channel: 'pushover';
    attempts: 1;
    sentAt: '2025-11-16T10:30:00Z';
    receipt: 'abc123def456';          // Para priority=2
  },
  // Se algum falhar:
  {
    success: false;
    channel: 'email';
    attempts: 3;
    error: 'Rate limited';
  }
]
```

### Banco de Dados: notification_logs

```typescript
{
  id: string;                 // UUID
  user_key: string;           // Pushover key
  channel: string;            // 'pushover' | 'email' | 'sms'
  type: string;               // 'deposit_confirmed' etc
  status: string;             // 'sent' | 'failed' | 'pending'
  attempts: number;           // Número de tentativas
  error?: string;             // Mensagem de erro
  receipt?: string;           // Pushover receipt ID
  created_at: string;         // ISO timestamp
  sent_at?: string;           // ISO timestamp
}
```

---

## 4. Prioridades e Comportamento

```
Priority -2 (LOW)
  ├─ Sem som
  ├─ Sem vibração
  ├─ Sem LED
  └─ Use case: Background updates

Priority -1 (NORMAL_QUIET)
  ├─ Com som de notificação
  ├─ Com vibração
  ├─ Não perturba silencioso
  └─ Use case: Updates normais

Priority 0 (NORMAL) - Default
  ├─ Som normal
  ├─ Vibração
  ├─ Respeita modo silencioso
  └─ Use case: Informações gerais

Priority 1 (HIGH)
  ├─ Som alto
  ├─ Vibração forte
  ├─ Bypass do silencioso
  ├─ Exibe notificação em lock screen
  └─ Use case: Alertas importantes

Priority 2 (EMERGENCY)
  ├─ Sirene contínua
  ├─ Vibração pulsante
  ├─ Bypass completo
  ├─ Exige confirmação do usuário
  ├─ Repete a cada 60 segundos (retry)
  ├─ Expira em 1 hora (expire)
  └─ Use case: Emergências críticas
```

---

## 5. Tabela de Decisão de Canais

```
┌────────────────────┬──────────────┬────────────┬─────────┐
│ Tipo Notificação   │ Canal 1      │ Canal 2    │ Canal 3 │
├────────────────────┼──────────────┼────────────┼─────────┤
│ Novo Depósito      │ Pushover (1) │ Email (2)  │ -       │
│ Transação Falhou   │ Pushover (1) │ Email (2)  │ -       │
│ Alerta Segurança   │ Pushover (2) │ SMS (3)    │ Email   │
│ Verificação OK     │ Pushover (0) │ Email (2)  │ -       │
│ Sistema Down       │ Pushover (2) │ SMS (2)    │ Email   │
│ Rate Limit         │ Email (0)    │ -          │ -       │
└────────────────────┴──────────────┴────────────┴─────────┘

Número entre parênteses = Priority do canal
```

---

## 6. Fluxo de Fallback Sequencial

```
                  Enviar via Pushover
                         │
                         ↓
                 Sucesso? ✓ YES → FIM
                         │
                        NO ↓
                         
            Registrar falha, aguardar delay
                         │
                         ↓
            Retry esgotado? ✗ MAX RETRIES
                         │
                        SIM ↓
                         
                  Tentar Email (Fallback 1)
                         │
                         ↓
                 Sucesso? ✓ YES → FIM
                         │
                        NO ↓
                         
            Registrar falha, aguardar delay
                         │
                         ↓
            Retry esgotado? ✗ MAX RETRIES
                         │
                        SIM ↓
                         
                  Tentar SMS (Fallback 2)
                         │
                         ↓
                 Sucesso? ✓ YES → FIM
                         │
                        NO ↓
                         
            Registrar falha, aguardar delay
                         │
                         ↓
            Retry esgotado? ✗ MAX RETRIES
                         │
                        SIM ↓
                         
                  Retornar {success: false}
                         │
                         ↓
                    Log em Sentry
```

---

## 7. Mapeamento de Erros

```
HTTP 2xx (Sucesso)
  └─ Status 200/201: Registrar sucesso

HTTP 4xx (Erro de Cliente)
  ├─ 400 Bad Request: Não retry (validar payload)
  ├─ 401 Unauthorized: Não retry (verificar token)
  ├─ 403 Forbidden: Não retry (verificar permissões)
  ├─ 404 Not Found: Não retry (verificar URL)
  └─ 429 Too Many Requests: RETRY (esperar e tentar novamente)

HTTP 5xx (Erro de Servidor)
  ├─ 500 Internal Server Error: RETRY
  ├─ 502 Bad Gateway: RETRY
  ├─ 503 Service Unavailable: RETRY
  └─ 504 Gateway Timeout: RETRY

Network Errors
  ├─ ECONNREFUSED: RETRY
  ├─ ETIMEDOUT: RETRY
  ├─ ENOTFOUND: NÃO retry (DNS problema)
  └─ Other: RETRY (para ser seguro)
```

---

## 8. Monitoramento em Tempo Real

```
┌──────────────────────────────────────────────────────────┐
│           Health Check Endpoint                          │
│         /api/health/notifications                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ GET /api/health/notifications → {                       │
│   status: 'healthy' | 'degraded' | 'error',             │
│   timestamp: '2025-11-16T10:30:00Z',                   │
│   stats: {                                               │
│     total: 150,                 // Total último 1h       │
│     successful: 148,            // Sucesso               │
│     failed: 2,                  // Falha                 │
│     successRate: 98.67,         // %                     │
│     byChannel: {                                         │
│       pushover: 100,                                     │
│       email: 45,                                         │
│       sms: 5                                             │
│     }                                                    │
│   },                                                     │
│   pushoverConfigured: true,                              │
│   resendConfigured: true                                 │
│ }                                                        │
│                                                          │
│ Alerts:                                                  │
│ - Se successRate < 90%: Status = degraded               │
│ - Se successRate < 50%: Status = error                  │
│ - Enviar para Sentry se error                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Integração com Sentry

```
NotificationService
    │
    ├─→ Sucesso? ✓ YES → Continuar
    │
    └─→ Erro Crítico? ✗ SIM
            │
            ↓
        Sentry.captureException(error, {
            tags: {
                component: 'notification',
                channel: 'pushover',
                notificationType: 'deposit_confirmed'
            },
            extra: {
                userKey: '...',
                attempts: 3,
                lastError: '...'
            }
        })
```

---

## 10. Queue de Notificações (Opcional)

Para casos de alto volume, implementar com Bull/BullMQ:

```
API Route
    ↓
┌────────────────────────────┐
│  Notification Queue (Redis)│
├────────────────────────────┤
│ job_1: {payload}           │
│ job_2: {payload}           │
│ job_3: {payload}           │
│ ...                        │
└────────────────────────────┘
    ↓
┌────────────────────────────┐
│  Worker (Consumer)         │
│  - Processar jobs          │
│  - Retry automático        │
│  - Logging                 │
│  - Dead Letter Queue       │
└────────────────────────────┘
    ↓
NotificationService
    ↓
Enviar para Pushover/Email/SMS
```

---

## 11. Fluxo Completo de Exemplo

```
USUÁRIO
  │
  ├─→ Confirma Depósito na UI
  │
  └─→ POST /api/deposits/confirm
         │
         ├─→ Validar autenticação
         │
         ├─→ Atualizar status transação
         │
         └─→ await notificationService.send({
              userKey: 'op_123',
              email: 'op@example.com',
              title: '💰 Novo Depósito',
              message: 'João Silva - R$ 500 PIX',
              type: NotificationType.DEPOSIT_CONFIRMED,
              priority: NotificationPriority.HIGH,
              channels: ['pushover', 'email'],
              metadata: {
                url: '/admin/transactions/tx_123',
                customerName: 'João Silva',
                amount: 500
              }
            })
            
            ├─→ Pushover (Primary)
            │   ├─→ Tentativa 1 ✓ Sucesso → receipt: 'abc123'
            │   │
            │   └─→ Retornar result[0] = {success: true, ...}
            
            └─→ Email (Não necessário, Pushover sucedeu)
                
         └─→ Retornar API Response
            {
              success: true,
              message: 'Depósito confirmado',
              notificationChannels: ['pushover']
            }

OPERADOR RECEBE
  ├─→ Notificação Push no celular (som: cashregister)
  │   Título: "💰 Novo Depósito"
  │   Mensagem: "João Silva - R$ 500 PIX"
  │   Clica para abrir: /admin/transactions/tx_123
  │
  └─→ (Se tivesse falhado, receberia email)
```

---

## 12. Diagrama de Estados

```
                        ┌─────────────┐
                        │   IDLE      │
                        └──────┬──────┘
                               │
                        (Novo evento)
                               │
                               ↓
                        ┌──────────────┐
                        │   PENDING    │
                        │ - Validando  │
                        └──────┬───────┘
                               │
                               ↓
                        ┌──────────────┐
                        │   RETRYING   │
                        │ - Tentando   │
                        │   envio      │
                        └──────┬───────┘
                               │
                ┌──────────────┬──────────────┐
                │              │              │
              ✓ YES           NO           TIMEOUT
                │              │              │
                ↓              ↓              ↓
          ┌──────────┐  ┌──────────┐  ┌──────────┐
          │ SENT     │  │ FALLBACK │  │ RETRY    │
          │ (Log OK) │  │ (Próximo │  │ (Aguard) │
          │          │  │  canal)  │  │          │
          └──────────┘  └──────┬───┘  └────┬─────┘
                               │           │
                               ↓           │
                        ┌──────────┐       │
                        │ FAILED   │←──────┘
                        │ (Log err)│
                        └──────────┘
```

---

## 13. Características de Cada Canal

### Pushover
```
Latência:       ~500ms
Confiabilidade: 99.9%
Custo:          $5 one-time
Limite:         Ilimitado
Retry:          Manual via app
Prioridades:    -2 a 2
Confirmação:    Para priority=2
```

### Email (Resend)
```
Latência:       ~800ms
Confiabilidade: 99.5%
Custo:          Free (100/dia) + $20+
Limite:         Limitado por plano
Retry:          2-3 tentativas
Prioridades:    Não tem
Confirmação:    Nenhuma
```

### SMS (Twilio)
```
Latência:       ~1.2s
Confiabilidade: 99%
Custo:          $0.0075 por SMS
Limite:         Limitado por crédito
Retry:          Manual
Prioridades:    Não tem
Confirmação:    Delivery report
```

---

Criado em: Novembro 16, 2025
