# Guia Completo: Integração Pushover e Padrões de Notificação

Documentação completa sobre integração com Pushover API, estratégias de notificação, níveis de prioridade, retry logic e fallbacks para SMS/Email.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Integração com Pushover](#integração-com-pushover)
3. [Níveis de Prioridade](#níveis-de-prioridade)
4. [Retry Logic com Exponential Backoff](#retry-logic-com-exponential-backoff)
5. [Error Handling](#error-handling)
6. [Serviços de Notificação Alternativos](#serviços-de-notificação-alternativos)
7. [SMS/Email Fallbacks](#smsmail-fallbacks)
8. [Implementação Completa](#implementação-completa)
9. [Exemplos de Uso](#exemplos-de-uso)
10. [Checklist de Produção](#checklist-de-produção)

---

## Visão Geral

### O que é Pushover?

Pushover é um serviço de notificação push em tempo real que permite enviar notificações para dispositivos móveis (iOS e Android) e desktop (Windows e macOS).

### Casos de Uso no P2P

- **Notificações de Depósitos**: Alertar operadores quando cliente confirma depósito
- **Notificações de Transações**: Status de transações, falhas, conclusões
- **Alertas Críticos**: Erros no sistema, atividades suspeitas, limit reached
- **Monitoramento**: Health checks, degradação de serviço
- **On-call Rotation**: Escalação automática para equipe de suporte

### Fluxo Recomendado

```
Evento → Notificação Service → Pushover (Primary)
                              ↓
                        [Falha ou Fallback]
                              ↓
                        Email/SMS (Secondary)
```

---

## Integração com Pushover

### API Pushover

**Documentação**: https://pushover.net/api

#### Endpoints Principais

```
POST https://api.pushover.net/1/messages.json
POST https://api.pushover.net/1/sounds.json
GET  https://api.pushover.net/1/devices.json
```

### Setup Inicial

#### 1. Obter Credenciais

```bash
# 1. Criar conta em https://pushover.net/
# 2. Criar aplicação em https://pushover.net/apps/build
# 3. Registrar dispositivos em https://pushover.net/devices

# Variáveis de ambiente necessárias:
PUSHOVER_APP_TOKEN=abc123...     # Token da aplicação
PUSHOVER_OPERATOR_KEY=user123... # Chave do operador
PUSHOVER_ADMIN_KEY=admin456...   # Chave do admin
```

#### 2. Arquivo: `lib/external-apis/pushover.ts`

```typescript
/**
 * Cliente para integração com Pushover
 * Documentação: https://pushover.net/api
 *
 * Níveis de Prioridade:
 * -2: sem som ou vibração
 * -1: com som de notificação
 *  0: normal (padrão)
 *  1: priority (bypass do silencioso)
 *  2: emergency (exige confirmação)
 */

export interface PushoverMessage {
  token: string;              // APP_TOKEN
  user: string;               // USER_KEY do destinatário
  message: string;            // Mensagem (até 1024 caracteres)
  title?: string;             // Título (até 250 caracteres)
  priority?: -2 | -1 | 0 | 1 | 2; // Nível de prioridade
  ttl?: number;               // Time to live em segundos (máx 86400)
  sound?: string;             // Som customizado (ver lista)
  url?: string;               // URL para abrir ao clicar
  url_title?: string;         // Texto do botão URL
  html?: 0 | 1;               // 1 para suportar HTML na mensagem
  timestamp?: number;         // Unix timestamp
  retry?: number;             // Segundos entre retentativas (priority=2)
  expire?: number;            // Segundos para expirar (priority=2)
}

export interface PushoverResponse {
  status: number;             // 1 = sucesso, 0 = erro
  request: string;            // ID da requisição
  receipt?: string;           // Para priority=2 (confirmação)
  errors?: string[];          // Lista de erros
}

export interface NotificationOptions {
  priority?: -2 | -1 | 0 | 1 | 2;
  ttl?: number;
  sound?: string;
  url?: string;
  urlTitle?: string;
  html?: boolean;
  timestamp?: Date;
  retry?: number;
  expire?: number;
}

class PushoverClient {
  private apiUrl = 'https://api.pushover.net/1/messages.json';
  private appToken: string;
  private logger: any; // substituir por seu logger

  constructor(appToken?: string) {
    this.appToken = appToken || process.env.PUSHOVER_APP_TOKEN!;
    if (!this.appToken) {
      throw new Error('PUSHOVER_APP_TOKEN não configurado');
    }
  }

  /**
   * Envia notificação de novo depósito confirmado
   */
  async sendDepositNotification(
    operatorUserKey: string,
    transactionData: {
      transactionId: string;
      customerName: string;
      amount: number;
      method: 'pix' | 'ted' | 'transferencia';
      timestamp: Date;
    }
  ): Promise<PushoverResponse> {
    const message: PushoverMessage = {
      token: this.appToken,
      user: operatorUserKey,
      title: '💰 Novo Depósito Confirmado',
      message: this.formatDepositMessage(transactionData),
      priority: 1, // Alta prioridade
      ttl: 3600,   // 1 hora de vida útil
      sound: 'cashregister', // Som de caixa registradora
      html: 1,
      timestamp: Math.floor(transactionData.timestamp.getTime() / 1000),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/transactions/${transactionData.transactionId}`,
      url_title: 'Ver Transação',
    };

    return this.sendMessage(message);
  }

  /**
   * Envia alerta crítico (prioridade máxima)
   */
  async sendCriticalAlert(
    adminUserKey: string,
    alertData: {
      title: string;
      message: string;
      severity: 'warning' | 'critical';
      context?: Record<string, any>;
    }
  ): Promise<PushoverResponse> {
    const message: PushoverMessage = {
      token: this.appToken,
      user: adminUserKey,
      title: `🚨 [${alertData.severity.toUpperCase()}] ${alertData.title}`,
      message: alertData.message,
      priority: alertData.severity === 'critical' ? 2 : 1,
      sound: alertData.severity === 'critical' ? 'siren' : 'alarm',
      retry: alertData.severity === 'critical' ? 60 : undefined,
      expire: alertData.severity === 'critical' ? 3600 : undefined,
      html: 1,
    };

    return this.sendMessage(message);
  }

  /**
   * Envia notificação customizada
   */
  async sendMessage(message: PushoverMessage): Promise<PushoverResponse> {
    try {
      const formData = new URLSearchParams();

      // Adicionar cada campo ao formulário
      Object.entries(message).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok || data.status !== 1) {
        const errorMessage = data.errors?.join(', ') || response.statusText;
        throw new Error(`Pushover API Error: ${errorMessage}`);
      }

      return {
        status: data.status,
        request: data.request,
        receipt: data.receipt,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Formata mensagem de depósito com HTML
   */
  private formatDepositMessage(transactionData: {
    transactionId: string;
    customerName: string;
    amount: number;
    method: 'pix' | 'ted' | 'transferencia';
    timestamp: Date;
  }): string {
    const methodLabel = {
      pix: '📱 PIX',
      ted: '🏦 TED',
      transferencia: '💳 Transferência',
    }[transactionData.method];

    const timeStr = transactionData.timestamp.toLocaleString('pt-BR');

    return `
<b>Cliente:</b> ${transactionData.customerName}
<b>ID Transação:</b> ${transactionData.transactionId}
<b>Valor:</b> R$ ${transactionData.amount.toFixed(2)}
<b>Método:</b> ${methodLabel}
<b>Horário:</b> ${timeStr}

⚠️ Verifique no banco e confirme no painel administrativo.
    `.trim();
  }

  /**
   * Verifica somente os sons disponíveis
   */
  async checkAvailableSounds(): Promise<string[]> {
    try {
      const response = await fetch(
        `https://api.pushover.net/1/sounds.json?token=${this.appToken}`
      );
      const data = await response.json();
      return Object.keys(data.sounds || {});
    } catch (error) {
      console.error('Erro ao buscar sons disponíveis:', error);
      return ['cashregister', 'alarm', 'siren']; // Fallback
    }
  }
}

export const pushoverClient = new PushoverClient();
```

---

## Níveis de Prioridade

### Tabela de Prioridades

| Prioridade | Valor | Comportamento | Caso de Uso |
|-----------|-------|---------------|------------|
| Low | -2 | Sem som ou vibração | Notificações silenciosas, histórico |
| Normal-1 | -1 | Som de notificação | Atualizações normais |
| Normal | 0 | Normal (padrão) | Informações gerais |
| Priority | 1 | Bypass do silencioso | Alertas importantes |
| Emergency | 2 | Exige confirmação do usuário | Emergências, críticos |

### Exemplo com Diferentes Prioridades

```typescript
// Notificação silenciosa (não perturbar)
await pushoverClient.sendMessage({
  token: appToken,
  user: userKey,
  message: 'Seu saldo foi atualizado',
  priority: -2,
});

// Notificação normal
await pushoverClient.sendMessage({
  token: appToken,
  user: userKey,
  message: 'Nova transação pendente',
  priority: 0,
});

// Notificação com prioridade (desativa silencioso)
await pushoverClient.sendMessage({
  token: appToken,
  user: userKey,
  message: 'Alerta de segurança: novo device',
  priority: 1,
  sound: 'alarm',
});

// Emergência (exige confirmação)
await pushoverClient.sendMessage({
  token: appToken,
  user: userKey,
  message: 'Tentativa de acesso não autorizado detectada!',
  priority: 2,
  sound: 'siren',
  retry: 60,      // Repetir a cada 60 segundos
  expire: 3600,   // Expirar em 1 hora
});
```

---

## Retry Logic com Exponential Backoff

### Implementação Robusta

#### Arquivo: `lib/notifications/notification-service.ts`

```typescript
import { logger } from '@/lib/logger';
import { pushoverClient } from '@/lib/external-apis/pushover';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean; // Adicionar aleatoriedade para evitar thundering herd
}

export interface NotificationResult {
  success: boolean;
  attempts: number;
  lastError?: string;
  sentAt?: Date;
  receipt?: string;
}

class NotificationService {
  private maxRetries = 3;
  private initialDelayMs = 1000;
  private maxDelayMs = 30000;
  private backoffMultiplier = 2;

  /**
   * Envia notificação com retry automático
   */
  async sendWithRetry(
    userKey: string,
    title: string,
    message: string,
    options: {
      priority?: number;
      sound?: string;
      url?: string;
      retryOptions?: RetryOptions;
    } = {}
  ): Promise<NotificationResult> {
    const retryOptions = options.retryOptions || {};
    const maxRetries = retryOptions.maxRetries ?? this.maxRetries;
    const initialDelayMs = retryOptions.initialDelayMs ?? this.initialDelayMs;
    const maxDelayMs = retryOptions.maxDelayMs ?? this.maxDelayMs;
    const backoffMultiplier = retryOptions.backoffMultiplier ?? this.backoffMultiplier;
    const useJitter = retryOptions.jitter ?? true;

    let lastError: string | undefined;
    let attempts = 0;
    let receipt: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      attempts = attempt;

      try {
        logger.info(`Tentativa ${attempt}/${maxRetries} de enviar notificação`, {
          userKey,
          title,
        });

        const response = await pushoverClient.sendMessage({
          token: process.env.PUSHOVER_APP_TOKEN!,
          user: userKey,
          title,
          message,
          priority: options.priority,
          sound: options.sound,
          url: options.url,
          html: 1,
        });

        receipt = response.receipt;

        logger.info('Notificação enviada com sucesso', {
          userKey,
          title,
          receipt,
        });

        return {
          success: true,
          attempts,
          sentAt: new Date(),
          receipt,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);

        if (attempt < maxRetries) {
          // Calcular delay com backoff exponencial
          let delay = initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);

          // Capping do delay máximo
          delay = Math.min(delay, maxDelayMs);

          // Adicionar jitter (aleatoriedade) para evitar thundering herd
          if (useJitter) {
            delay = delay * (0.5 + Math.random()); // ±50% de variação
          }

          logger.warn(
            `Falha ao enviar notificação. Retentando em ${Math.round(delay)}ms`,
            {
              userKey,
              title,
              attempt,
              error: lastError,
            }
          );

          // Aguardar antes de retry
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          logger.error(
            'Falha ao enviar notificação após todas as tentativas',
            {
              userKey,
              title,
              attempts,
              lastError,
            }
          );
        }
      }
    }

    return {
      success: false,
      attempts,
      lastError,
    };
  }

  /**
   * Envia com fallback para email
   */
  async sendWithFallback(
    userKey: string,
    email: string,
    title: string,
    message: string,
    options: any = {}
  ): Promise<NotificationResult> {
    // Tentar Pushover primeiro
    const pushoverResult = await this.sendWithRetry(
      userKey,
      title,
      message,
      {
        ...options,
        retryOptions: {
          maxRetries: 2, // Menos tentativas antes de fallback
        },
      }
    );

    if (pushoverResult.success) {
      return pushoverResult;
    }

    // Fallback para Email
    logger.warn('Pushover falhou. Tentando email como fallback', {
      userKey,
      email,
    });

    try {
      await this.sendEmailNotification(email, title, message);
      return {
        success: true,
        attempts: pushoverResult.attempts + 1,
        sentAt: new Date(),
      };
    } catch (emailError) {
      logger.error('Também falhou ao enviar email', {
        userKey,
        email,
        error: emailError,
      });

      return {
        success: false,
        attempts: pushoverResult.attempts + 1,
        lastError: 'Pushover e Email falharam',
      };
    }
  }

  /**
   * Enviar notificação por email (implementar com Resend, SendGrid, etc)
   */
  private async sendEmailNotification(
    email: string,
    title: string,
    message: string
  ): Promise<void> {
    // Implementar com seu serviço de email preferido
    // Exemplo com Resend:
    // const { data, error } = await resend.emails.send({
    //   from: 'notificacoes@seu-app.com',
    //   to: email,
    //   subject: title,
    //   html: message,
    // });
  }
}

export const notificationService = new NotificationService();
```

---

## Error Handling

### Tratamento de Erros Pushover

```typescript
/**
 * Arquivo: lib/notifications/pushover-errors.ts
 */

export interface PushoverError {
  code: string;
  message: string;
  statusCode: number;
  retryable: boolean;
}

export const PUSHOVER_ERRORS: Record<string, PushoverError> = {
  INVALID_TOKEN: {
    code: 'INVALID_TOKEN',
    message: 'Token/chave inválidos',
    statusCode: 400,
    retryable: false,
  },
  INVALID_USER_KEY: {
    code: 'INVALID_USER_KEY',
    message: 'Chave de usuário inválida',
    statusCode: 400,
    retryable: false,
  },
  INVALID_MESSAGE: {
    code: 'INVALID_MESSAGE',
    message: 'Mensagem inválida',
    statusCode: 400,
    retryable: false,
  },
  INVALID_PRIORITY: {
    code: 'INVALID_PRIORITY',
    message: 'Prioridade inválida',
    statusCode: 400,
    retryable: false,
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Rate limit excedido',
    statusCode: 429,
    retryable: true,
  },
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Erro no servidor Pushover',
    statusCode: 500,
    retryable: true,
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Erro de conexão',
    statusCode: 0,
    retryable: true,
  },
};

export function mapPushoverError(
  error: any
): PushoverError {
  if (error.response?.status === 429) {
    return PUSHOVER_ERRORS.RATE_LIMITED;
  }

  if (error.response?.status >= 500) {
    return PUSHOVER_ERRORS.SERVER_ERROR;
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return PUSHOVER_ERRORS.NETWORK_ERROR;
  }

  return {
    code: 'UNKNOWN',
    message: error.message || 'Erro desconhecido',
    statusCode: error.response?.status || 0,
    retryable: (error.response?.status || 0) >= 500,
  };
}

/**
 * Determinar se deve fazer retry baseado no erro
 */
export function shouldRetry(error: any): boolean {
  const pushoverError = mapPushoverError(error);
  return pushoverError.retryable;
}
```

---

## Serviços de Notificação Alternativos

### Comparação de Serviços

| Serviço | Push | SMS | Email | Preço | Caso de Uso |
|---------|------|-----|-------|-------|------------|
| **Pushover** | ✅ | ❌ | ❌ | $5 one-time | Mobile push notifications |
| **Firebase Cloud Messaging** | ✅ | ❌ | ❌ | Grátis | Push genérico |
| **Twilio** | ✅ | ✅ | ✅ | Pay-as-you-go | SMS/Whatsapp crítico |
| **AWS SNS** | ✅ | ✅ | ✅ | Pay-as-you-go | Escalável |
| **SendGrid** | ❌ | ❌ | ✅ | $14.95+/mês | Email marketing |
| **Mailgun** | ❌ | ❌ | ✅ | $25+/mês | Email transacional |
| **ResendAPI** | ❌ | ❌ | ✅ | Free tier | Email moderno |

### Implementação Multi-Canal

```typescript
/**
 * Arquivo: lib/notifications/multi-channel-service.ts
 */

export interface NotificationChannelConfig {
  channel: 'pushover' | 'email' | 'sms' | 'whatsapp';
  enabled: boolean;
  priority: number; // 1 = principal, 2 = secondary
  maxRetries?: number;
}

export interface MultiChannelOptions {
  channels: NotificationChannelConfig[];
  fallbackStrategy: 'sequential' | 'parallel'; // Sequential = esperar falha, Parallel = enviar todos
  timeout?: number; // Timeout em ms
}

class MultiChannelNotificationService {
  /**
   * Envia notificação através de múltiplos canais com estratégia de fallback
   */
  async sendMultiChannel(
    recipient: {
      pushoverKey?: string;
      email?: string;
      phone?: string;
      whatsapp?: string;
    },
    notification: {
      title: string;
      message: string;
      type: 'info' | 'warning' | 'critical';
    },
    options: MultiChannelOptions
  ): Promise<{
    results: Record<string, boolean>;
    fallbackUsed: string[];
  }> {
    const results: Record<string, boolean> = {};
    const fallbackUsed: string[] = [];

    // Ordenar canais por prioridade
    const sortedChannels = options.channels
      .sort((a, b) => a.priority - b.priority)
      .filter(c => c.enabled);

    if (options.fallbackStrategy === 'sequential') {
      // Tentar cada canal sequencialmente até sucesso
      for (const channel of sortedChannels) {
        try {
          const sent = await this.sendToChannel(
            recipient,
            notification,
            channel
          );
          results[channel.channel] = sent;

          if (sent) {
            break; // Sucesso, parar aqui
          }
        } catch (error) {
          results[channel.channel] = false;
          fallbackUsed.push(channel.channel);
        }
      }
    } else {
      // Enviar para todos os canais em paralelo
      const promises = sortedChannels.map(async (channel) => {
        try {
          const sent = await this.sendToChannel(
            recipient,
            notification,
            channel
          );
          return { channel: channel.channel, sent };
        } catch (error) {
          return { channel: channel.channel, sent: false };
        }
      });

      const parallelResults = await Promise.allSettled(promises);
      parallelResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results[result.value.channel] = result.value.sent;
        } else {
          fallbackUsed.push((result.value as any)?.channel);
        }
      });
    }

    return { results, fallbackUsed };
  }

  private async sendToChannel(
    recipient: any,
    notification: any,
    config: NotificationChannelConfig
  ): Promise<boolean> {
    switch (config.channel) {
      case 'pushover':
        if (!recipient.pushoverKey) return false;
        const pushoverResult = await notificationService.sendWithRetry(
          recipient.pushoverKey,
          notification.title,
          notification.message
        );
        return pushoverResult.success;

      case 'email':
        if (!recipient.email) return false;
        // Implementar envio de email
        return true;

      case 'sms':
        if (!recipient.phone) return false;
        // Implementar SMS via Twilio
        return true;

      case 'whatsapp':
        if (!recipient.whatsapp) return false;
        // Implementar WhatsApp via Twilio
        return true;

      default:
        return false;
    }
  }
}

export const multiChannelService = new MultiChannelNotificationService();
```

---

## SMS/Email Fallbacks

### Email Fallback com ResendAPI

```typescript
/**
 * Arquivo: lib/notifications/email-service.ts
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailNotificationTemplate {
  type: 'deposit' | 'alert' | 'transaction_status' | 'security';
  recipientEmail: string;
  subject: string;
  data: Record<string, any>;
}

class EmailNotificationService {
  /**
   * Envia notificação por email com template
   */
  async sendEmailNotification(
    template: EmailNotificationTemplate,
    retryOptions?: {
      maxRetries?: number;
      delayMs?: number;
    }
  ): Promise<{ success: boolean; messageId?: string }> {
    const maxRetries = retryOptions?.maxRetries ?? 3;
    const delayMs = retryOptions?.delayMs ?? 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const emailBody = this.buildEmailBody(template);

        const response = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: template.recipientEmail,
          subject: template.subject,
          html: emailBody,
        });

        if (response.data?.id) {
          return {
            success: true,
            messageId: response.data.id,
          };
        }

        if (attempt < maxRetries) {
          await new Promise(resolve =>
            setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
          );
        }
      } catch (error) {
        if (attempt === maxRetries) {
          return { success: false };
        }
      }
    }

    return { success: false };
  }

  /**
   * Construir corpo do email baseado no template
   */
  private buildEmailBody(template: EmailNotificationTemplate): string {
    switch (template.type) {
      case 'deposit':
        return `
          <h1>Novo Depósito Confirmado</h1>
          <p><strong>Cliente:</strong> ${template.data.customerName}</p>
          <p><strong>Valor:</strong> R$ ${template.data.amount.toFixed(2)}</p>
          <p><strong>Método:</strong> ${template.data.method}</p>
          <p><strong>ID Transação:</strong> ${template.data.transactionId}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/transactions/${template.data.transactionId}">
            Ver Transação
          </a></p>
        `;

      case 'alert':
        return `
          <h1>Alerta de Segurança</h1>
          <p>${template.data.message}</p>
          <p><strong>Severidade:</strong> ${template.data.severity}</p>
        `;

      case 'transaction_status':
        return `
          <h1>Status da Transação</h1>
          <p><strong>Transação:</strong> ${template.data.transactionId}</p>
          <p><strong>Status:</strong> ${template.data.status}</p>
          <p>${template.data.message}</p>
        `;

      default:
        return template.data.html || template.data.message || '';
    }
  }
}

export const emailService = new EmailNotificationService();
```

### SMS Fallback com Twilio

```typescript
/**
 * Arquivo: lib/notifications/sms-service.ts
 */

import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface SMSNotification {
  phoneNumber: string;
  message: string;
  priority?: 'normal' | 'high';
}

class SMSNotificationService {
  /**
   * Envia SMS com retry
   */
  async sendSMS(
    notification: SMSNotification,
    retryOptions?: {
      maxRetries?: number;
      delayMs?: number;
    }
  ): Promise<{ success: boolean; messageSid?: string }> {
    const maxRetries = retryOptions?.maxRetries ?? 3;
    const delayMs = retryOptions?.delayMs ?? 1000;

    // Validar numero de telefone (deve estar em formato E.164: +5511999999999)
    if (!this.validatePhoneNumber(notification.phoneNumber)) {
      return { success: false };
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const message = await twilioClient.messages.create({
          body: notification.message,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: notification.phoneNumber,
        });

        return {
          success: true,
          messageSid: message.sid,
        };
      } catch (error) {
        if (attempt < maxRetries) {
          await new Promise(resolve =>
            setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
          );
        }
      }
    }

    return { success: false };
  }

  /**
   * Validar formato E.164 do número
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    const e164Regex = /^\+\d{1,15}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Converter número brasileiro para formato E.164
   * Exemplo: 11999999999 -> +5511999999999
   */
  static formatBrazilianPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('55')) {
      return `+${cleaned}`;
    }

    return `+55${cleaned}`;
  }
}

export const smsService = new SMSNotificationService();
```

---

## Implementação Completa

### API Route com Notificação Multi-Canal

```typescript
/**
 * Arquivo: app/api/deposits/confirm/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications/notification-service';
import { multiChannelService } from '@/lib/notifications/multi-channel-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionId, operatorUserKey, operatorEmail } = body;

    if (!transactionId || (!operatorUserKey && !operatorEmail)) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    logger.info('Iniciando confirmação de depósito', {
      requestId,
      transactionId,
    });

    // Buscar dados da transação (implementar com seu DB)
    const transactionData = {
      transactionId,
      customerName: 'João Silva',
      amount: 500,
      method: 'pix' as const,
      timestamp: new Date(),
    };

    // Estratégia 1: Usando retry automático com fallback
    if (operatorUserKey) {
      const result = await notificationService.sendWithFallback(
        operatorUserKey,
        operatorEmail || '',
        '💰 Novo Depósito Confirmado',
        `Cliente: ${transactionData.customerName}\nValor: R$ ${transactionData.amount.toFixed(2)}`,
        {
          priority: 1,
          sound: 'cashregister',
          retryOptions: {
            maxRetries: 2,
            initialDelayMs: 500,
            backoffMultiplier: 2,
            jitter: true,
          },
        }
      );

      logger.info('Notificação enviada', {
        requestId,
        success: result.success,
        attempts: result.attempts,
      });
    }

    // Estratégia 2: Multi-canal com fallback sequencial
    await multiChannelService.sendMultiChannel(
      {
        pushoverKey: operatorUserKey,
        email: operatorEmail,
      },
      {
        title: 'Novo Depósito',
        message: `Cliente: ${transactionData.customerName}\nValor: R$ ${transactionData.amount.toFixed(2)}`,
        type: 'warning',
      },
      {
        channels: [
          { channel: 'pushover', enabled: !!operatorUserKey, priority: 1 },
          { channel: 'email', enabled: !!operatorEmail, priority: 2 },
        ],
        fallbackStrategy: 'sequential',
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Depósito confirmado. Operador foi notificado.',
      requestId,
    });
  } catch (error) {
    logger.error(
      'Erro ao confirmar depósito',
      error instanceof Error ? error : new Error(String(error)),
      { requestId }
    );

    return NextResponse.json(
      { error: 'Erro ao confirmar depósito' },
      { status: 500 }
    );
  }
}
```

---

## Exemplos de Uso

### 1. Notificação Simples

```typescript
import { pushoverClient } from '@/lib/external-apis/pushover';

// Enviar notificação simples
await pushoverClient.sendMessage({
  token: process.env.PUSHOVER_APP_TOKEN!,
  user: operatorKey,
  title: 'Novo Pedido',
  message: 'Você tem um novo pedido para processar',
  priority: 0,
});
```

### 2. Notificação com Retry

```typescript
import { notificationService } from '@/lib/notifications/notification-service';

// Envia com retry automático (3 tentativas)
const result = await notificationService.sendWithRetry(
  userKey,
  'Alerta Crítico',
  'Falha detectada no sistema',
  {
    priority: 2,
    sound: 'siren',
    retryOptions: {
      maxRetries: 3,
      initialDelayMs: 1000,
      backoffMultiplier: 2,
      jitter: true,
    },
  }
);

console.log(`Enviado em ${result.attempts} tentativas`);
```

### 3. Fallback Email

```typescript
const result = await notificationService.sendWithFallback(
  operatorKey,
  operatorEmail,
  'Novo Depósito',
  'Um cliente confirmou depósito',
  {
    priority: 1,
    retryOptions: {
      maxRetries: 2,
    },
  }
);

if (!result.success) {
  // Email também falhou
  console.error('Falha ao notificar por todos os canais');
}
```

### 4. Multi-Canal

```typescript
const { results, fallbackUsed } = await multiChannelService.sendMultiChannel(
  {
    pushoverKey: userKey,
    email: userEmail,
    phone: userPhone,
  },
  {
    title: 'Alerta de Segurança',
    message: 'Tentativa de acesso não autorizado detectada',
    type: 'critical',
  },
  {
    channels: [
      { channel: 'pushover', enabled: true, priority: 1 },
      { channel: 'email', enabled: true, priority: 2 },
      { channel: 'sms', enabled: true, priority: 3 },
    ],
    fallbackStrategy: 'sequential',
  }
);

console.log('Canais com falha:', fallbackUsed);
```

---

## Checklist de Produção

### Antes de Deploy

- [ ] Chaves de API configuradas em `.env.production`
- [ ] Logging implementado para rastrear notificações
- [ ] Retry logic testado com diferentes cenários de falha
- [ ] Rate limiting verificado (não exceder limites Pushover)
- [ ] Fallbacks testados (email, SMS)
- [ ] Monitoramento de falhas configurado
- [ ] Alertas críticos testados (priority=2)
- [ ] Sentry/logging externo configurado
- [ ] Database de notificações para auditoria

### Monitoramento

```typescript
/**
 * Arquivo: app/api/health/notifications/route.ts
 */

export async function GET() {
  const health = {
    pushover: await checkPushoverAPI(),
    email: await checkEmailService(),
    sms: await checkSMSService(),
    timestamp: new Date().toISOString(),
  };

  const allHealthy = Object.values(health).every(
    (status) => status === 'ok'
  );

  return NextResponse.json(health, {
    status: allHealthy ? 200 : 503,
  });
}
```

### Logging de Notificações

```typescript
// Antes de enviar, registrar no banco
await db.notifications.create({
  id: uuid(),
  userId: operatorKey,
  type: 'deposit',
  channel: 'pushover',
  status: 'pending',
  createdAt: new Date(),
});

// Após sucesso
await db.notifications.update(
  { id: notificationId },
  {
    status: 'sent',
    sentAt: new Date(),
    receipt: receipt,
  }
);

// Após falha
await db.notifications.update(
  { id: notificationId },
  {
    status: 'failed',
    failedAt: new Date(),
    error: errorMessage,
    attempts: 3,
  }
);
```

---

## Recursos Úteis

### Documentação

- **Pushover API**: https://pushover.net/api
- **Twilio**: https://www.twilio.com/docs
- **SendGrid**: https://docs.sendgrid.com
- **Resend**: https://resend.com/docs
- **Firebase Cloud Messaging**: https://firebase.google.com/docs/cloud-messaging

### Ferramentas

- **Postman Collection** para Pushover API
- **Twilio Console** para debug de SMS
- **Sentry** para monitoramento de erros

### Best Practices

1. **Sempre usar retry com jitter** para evitar thundering herd
2. **Implementar rate limiting** cliente-side
3. **Log de auditoria** de todas as notificações
4. **Monitoramento de falhas** em tempo real
5. **Alertas de escalação** para críticos
6. **Testing** de todos os canais antes de produção
7. **Segregação de chaves** por ambiente
8. **Timeout adequado** para chamadas externas

---

Criado em: Novembro 16, 2025
Versão: 1.0
Última atualização: Novembro 2025
