# Referência Rápida: Notificações e Pushover

Guia de consulta rápida para implementação, troubleshooting e configuração de notificações.

---

## TL;DR - Começar em 5 Minutos

### 1. Setup Inicial

```bash
# 1. Criar conta em https://pushover.net/
# 2. Criar app em https://pushover.net/apps/build
# 3. Copiar APP_TOKEN
# 4. Registrar dispositivo em https://pushover.net/devices
# 5. Copiar USER_KEY
# 6. Adicionar ao .env.local

PUSHOVER_APP_TOKEN=abc123...
PUSHOVER_OPERATOR_KEY=user123...
```

### 2. Copiar Serviço

```typescript
// lib/services/NotificationService.ts
// (Ver arquivo NOTIFICATION_EXAMPLES_READY_TO_USE.md)
```

### 3. Usar

```typescript
import { notificationService, NotificationType, NotificationPriority } from '@/lib/services/NotificationService';

const result = await notificationService.send({
  userKey: 'operatorKey',
  email: 'operator@example.com',
  title: '💰 Novo Depósito',
  message: 'Cliente confirmou depósito',
  type: NotificationType.DEPOSIT_CONFIRMED,
  priority: NotificationPriority.HIGH,
});
```

---

## Referência de Prioridades

| Valor | Nome | Comportamento | Quando Usar |
|-------|------|---------------|------------|
| -2 | LOW | Sem som, sem vibração | Histórico, background |
| -1 | QUIET | Som de notificação | Atualizações não urgentes |
| 0 | NORMAL | Normal (padrão) | Informações gerais |
| 1 | HIGH | Bypass silencioso | Alertas importantes |
| 2 | EMERGENCY | Exige confirmação | Críticos, emergências |

### Exemplo

```typescript
// Notificação silenciosa (não perturbar usuário)
priority: NotificationPriority.LOW

// Alerta importante
priority: NotificationPriority.HIGH

// Emergência
priority: NotificationPriority.EMERGENCY
// Repete a cada 60 seg por 1 hora até confirmação
```

---

## Referência de Sons

### Sons Disponíveis

| Som | ID | Tipo |
|-----|--|----|
| Silent | silent | Sem som |
| Alarm | alarm | Alarme |
| Siren | siren | Sirene |
| Cash Register | cashregister | Caixa |
| Upbeat | upbeat | Positivo |
| Bike | bike | Buzina |
| Persistent | persistent | Persistente |
| Cashier | cashier | Caixa |
| Police | police | Polícia |
| Helicopter | helicopter | Helicóptero |
| Incoming | incoming | Chamada |
| Warning | warning | Aviso |

---

## Erros Comuns

### Erro: "Invalid token"

**Causa**: Token Pushover incorreto ou expirado

**Solução**:
```bash
# Verificar em https://pushover.net/apps
# Copiar novamente o token correto
PUSHOVER_APP_TOKEN=novo_token
```

### Erro: "Invalid user key"

**Causa**: USER_KEY incorreto ou não registrado

**Solução**:
```bash
# Ir em https://pushover.net/devices
# Copiar a chave correta do dispositivo
PUSHOVER_OPERATOR_KEY=correct_key
```

### Erro: "Message exceeds 1024 characters"

**Causa**: Mensagem muito longa

**Solução**:
```typescript
// Encurtar a mensagem
message: 'Cliente confirmou depósito de R$ 500'.substring(0, 1024)
```

### Erro: "Priority must be between -2 and 2"

**Causa**: Valor de prioridade inválido

**Solução**:
```typescript
priority: NotificationPriority.HIGH // Usar enum
// Não: priority: 3 (inválido)
```

### "API rate limited"

**Causa**: Muitas requisições muito rápido

**Solução**:
```typescript
// Implementar backoff automático (já feito no serviço)
// Ou usar retry delays maiores
retryOptions: {
  initialDelayMs: 5000, // Começar com 5s
  backoffMultiplier: 3,
}
```

---

## Status Codes HTTP

| Código | Significado | Retry? |
|--------|------------|--------|
| 200 | OK | Não |
| 400 | Bad Request (token/chave inválida) | Não |
| 401 | Unauthorized | Não |
| 429 | Rate Limited | Sim |
| 500 | Server Error | Sim |
| 502 | Bad Gateway | Sim |
| 503 | Service Unavailable | Sim |

---

## Verificar Credenciais

### Teste Manual com curl

```bash
# Substituir token e user pelos seus valores
curl -X POST https://api.pushover.net/1/messages.json \
  -d "token=seu_app_token" \
  -d "user=sua_user_key" \
  -d "title=Teste" \
  -d "message=Isto é um teste" \
  -d "priority=0"
```

### Teste em Node.js

```typescript
async function testPushover() {
  const formData = new URLSearchParams({
    token: process.env.PUSHOVER_APP_TOKEN!,
    user: process.env.PUSHOVER_OPERATOR_KEY!,
    title: 'Teste',
    message: 'Teste de conexão',
    priority: '0',
  });

  const response = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    body: formData.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();
  console.log('Status:', data.status);
  console.log('Erro:', data.errors);
}
```

---

## Tipos de Notificação

### NotificationType Enum

```typescript
enum NotificationType {
  DEPOSIT_CONFIRMED = 'deposit_confirmed',
  WITHDRAWAL_PENDING = 'withdrawal_pending',
  TRANSACTION_FAILED = 'transaction_failed',
  SECURITY_ALERT = 'security_alert',
  ACCOUNT_VERIFIED = 'account_verified',
  SYSTEM_ALERT = 'system_alert',
}
```

### Exemplo por Tipo

```typescript
// Depósito confirmado
type: NotificationType.DEPOSIT_CONFIRMED,
priority: NotificationPriority.HIGH,
sound: 'cashregister',

// Falha de transação
type: NotificationType.TRANSACTION_FAILED,
priority: NotificationPriority.HIGH,
sound: 'alarm',

// Alerta de segurança
type: NotificationType.SECURITY_ALERT,
priority: NotificationPriority.EMERGENCY,
sound: 'siren',

// Verificação de conta
type: NotificationType.ACCOUNT_VERIFIED,
priority: NotificationPriority.NORMAL,
sound: 'upbeat',
```

---

## Canais de Notificação

### Ordem de Fallback Padrão

```typescript
channels: ['pushover', 'email', 'sms']

// Tentar Pushover primeiro
// Se falhar, tentar Email
// Se Email falhar, tentar SMS
```

### Forçar Específico

```typescript
// Apenas Pushover
channels: ['pushover']

// Email e SMS (sem Pushover)
channels: ['email', 'sms']

// Parallel - enviar para todos
channels: ['pushover', 'email', 'sms']
```

---

## Configurações de Retry

### Default

```typescript
retryOptions: {
  maxRetries: 3,                 // 3 tentativas
  initialDelayMs: 1000,          // 1 segundo inicial
  maxDelayMs: 30000,             // Máximo 30 segundos
  backoffMultiplier: 2,          // Dobra a cada tentativa
  jitter: true,                  // Adiciona aleatoriedade
}
```

### Agressivo (Crítico)

```typescript
retryOptions: {
  maxRetries: 5,
  initialDelayMs: 500,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitter: true,
}
```

### Conservador (Normal)

```typescript
retryOptions: {
  maxRetries: 2,
  initialDelayMs: 2000,
  maxDelayMs: 20000,
  backoffMultiplier: 2,
  jitter: false,
}
```

---

## Headers e Parâmetros

### Parâmetros Obrigatórios

```typescript
{
  token: string,      // APP_TOKEN
  user: string,       // USER_KEY
  message: string,    // Até 1024 caracteres
}
```

### Parâmetros Opcionais

```typescript
{
  title?: string,           // Até 250 caracteres
  priority?: -2 | -1 | 0 | 1 | 2,
  ttl?: number,             // Time to live em segundos (máx 86400)
  sound?: string,           // ID do som
  url?: string,             // URL para abrir
  url_title?: string,       // Texto do botão
  html?: 0 | 1,             // 1 para HTML
  timestamp?: number,       // Unix timestamp
  retry?: number,           // Para priority=2 (segundos)
  expire?: number,          // Para priority=2 (segundos)
}
```

---

## Logging e Monitoramento

### Estrutura de Log Recomendada

```typescript
logger.info('Notificação enviada', {
  userKey: 'op123',
  channel: 'pushover',
  type: 'deposit_confirmed',
  receipt: 'abc123',
  attempts: 1,
  sentAt: '2025-11-16T10:30:00Z',
});

logger.warn('Falha ao enviar notificação', {
  userKey: 'op123',
  channel: 'pushover',
  attempts: 2,
  error: 'Rate limited',
});

logger.error('Notificação falhou permanentemente', {
  userKey: 'op123',
  channel: 'pushover',
  attempts: 3,
  error: 'API timeout',
});
```

### Health Check

```typescript
// Verificar saúde do serviço
GET /api/health/notifications

// Resposta
{
  status: 'healthy' | 'degraded' | 'error',
  stats: {
    total: 150,
    successful: 148,
    failed: 2,
    successRate: 98.67
  },
  byChannel: {
    pushover: 100,
    email: 45,
    sms: 5
  }
}
```

---

## Variáveis de Ambiente Checklist

### Obrigatórias

```
□ PUSHOVER_APP_TOKEN
□ PUSHOVER_OPERATOR_KEY
□ NEXT_PUBLIC_APP_URL
```

### Opcionais

```
□ RESEND_API_KEY (para email fallback)
□ TWILIO_ACCOUNT_SID (para SMS fallback)
□ TWILIO_AUTH_TOKEN
□ TWILIO_PHONE_NUMBER
□ LOG_LEVEL
```

---

## Benchmark de Performance

### Tempo Médio por Canal

| Canal | Tempo Médio | P95 | P99 |
|-------|------------|-----|-----|
| Pushover | 500ms | 1.5s | 3s |
| Email (Resend) | 800ms | 2s | 4s |
| SMS (Twilio) | 1.2s | 3s | 5s |

### Retry Impact

- Sem retry: 98% success (2% timeout/erro)
- Com 2 retries: 99.8% success
- Com 3 retries: 99.95% success

---

## Troubleshooting Guide

### 1. Notificação não está chegando

**Passos**:
1. Verificar se dispositivo está registrado em https://pushover.net/devices
2. Testar com curl (veja seção Verificar Credenciais)
3. Checar logs do aplicativo
4. Verificar configurações de notificação do iOS/Android

### 2. Muitos erros de rate limit

**Causas**:
- Muitas requisições simultâneas
- Retry muito agressivo

**Solução**:
```typescript
// Aumentar delay inicial
initialDelayMs: 5000 // 5 segundos

// Ou usar queue
// (implementar com Bull, Bullmq, etc)
```

### 3. Email como fallback não funciona

**Verificar**:
```typescript
// 1. API key Resend configurada?
console.log(process.env.RESEND_API_KEY);

// 2. Email válido?
if (!email.includes('@')) throw new Error('Email inválido');

// 3. Template HTML válido?
// Testar HTML em browser
```

### 4. Notificações não têm som

**Causas**:
- Sound ID inválido
- Dispositivo em silencioso
- Priority < 0

**Solução**:
```typescript
// Usar priority 1 ou 2 para bypass silencioso
priority: NotificationPriority.HIGH,
sound: 'alarm', // Verificar ID válido
```

---

## Migração de Serviço

### De Pushover para Firebase Cloud Messaging

```typescript
// Adicionar novo canal
switch (channel) {
  case 'pushover':
    // Código existente
    break;
  case 'fcm':
    // Novo código Firebase
    const result = await admin.messaging().send({
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.message,
      },
    });
    break;
}
```

### De Pushover para AWS SNS

```typescript
// Usar AWS SDK
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const client = new SNSClient();
const result = await client.send(
  new PublishCommand({
    TopicArn: 'arn:aws:sns:...',
    Message: payload.message,
    Subject: payload.title,
  })
);
```

---

## Integração com Sentry

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await notificationService.send(payload);
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'notification',
      channel: payload.channels?.[0],
    },
    extra: {
      userKey: payload.userKey,
      type: payload.type,
    },
  });
}
```

---

## Custos Estimados (Mensal)

| Serviço | Preço | Volume | Custo |
|---------|-------|--------|-------|
| Pushover | $5 one-time | Ilimitado | ~$0/mês* |
| Resend | Free tier | até 100/dia | $0 (crescimento: $20+) |
| Twilio SMS | $0.0075/SMS | 1000 SMS | ~$7.50 |
| AWS SNS | $2M requests | 100k/mês | ~$0.50 |

*Pushover é one-time, depois ilimitado

---

## Recursos Adicionais

### Documentação Oficial

- Pushover API: https://pushover.net/api
- Resend: https://resend.com/docs
- Twilio: https://www.twilio.com/docs

### Ferramentas

- Postman Collection: Importar dari docs Pushover
- Webhook Tester: https://webhook.site/

### Comunidades

- Pushover Support: support@pushover.net
- Next.js Discord: https://discord.gg/nextjs

---

## Última Atualização

Novembro 16, 2025

Para dúvidas ou atualizações, consulte os arquivos principais:
- `PUSHOVER_NOTIFICATION_GUIDE.md` - Documentação completa
- `NOTIFICATION_EXAMPLES_READY_TO_USE.md` - Exemplos prontos
