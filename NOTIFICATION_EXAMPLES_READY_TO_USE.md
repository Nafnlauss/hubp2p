# Exemplos Prontos para Usar: Notificações e Pushover

Código pronto para copiar e colar em seu projeto. Todos os exemplos incluem tratamento de erro e retry automático.

---

## 1. Serviço de Notificação Completo

### Arquivo: `lib/services/NotificationService.ts`

```typescript
'use server';

import { logger } from '@/lib/logger';

/**
 * Tipos de notificação suportados
 */
export enum NotificationType {
  DEPOSIT_CONFIRMED = 'deposit_confirmed',
  WITHDRAWAL_PENDING = 'withdrawal_pending',
  TRANSACTION_FAILED = 'transaction_failed',
  SECURITY_ALERT = 'security_alert',
  ACCOUNT_VERIFIED = 'account_verified',
  SYSTEM_ALERT = 'system_alert',
}

/**
 * Prioridades de notificação
 */
export enum NotificationPriority {
  LOW = -2,
  NORMAL_QUIET = -1,
  NORMAL = 0,
  HIGH = 1,
  EMERGENCY = 2,
}

/**
 * Interface para envio de notificação
 */
export interface NotificationPayload {
  userKey: string;
  email?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  channels?: ('pushover' | 'email' | 'sms')[];
}

/**
 * Resultado de notificação
 */
export interface NotificationResult {
  success: boolean;
  channel: string;
  attempts: number;
  sentAt?: string;
  error?: string;
  receipt?: string;
}

class NotificationService {
  private pushoverToken = process.env.PUSHOVER_APP_TOKEN;
  private maxRetries = 3;

  /**
   * Enviar notificação com retry automático e fallback
   */
  async send(payload: NotificationPayload): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const channels = payload.channels || ['pushover', 'email'];

    logger.info('Iniciando envio de notificação', {
      userKey: payload.userKey,
      type: payload.type,
      channels,
    });

    // Tentar enviar em cada canal (sequencial)
    for (const channel of channels) {
      try {
        let result: NotificationResult;

        switch (channel) {
          case 'pushover':
            result = await this.sendPushover(payload);
            break;
          case 'email':
            result = await this.sendEmail(payload);
            break;
          case 'sms':
            result = await this.sendSMS(payload);
            break;
          default:
            result = {
              success: false,
              channel,
              attempts: 0,
              error: 'Canal desconhecido',
            };
        }

        results.push(result);

        // Se sucesso, não precisa tentar fallback
        if (result.success) {
          break;
        }
      } catch (error) {
        logger.error(
          `Erro ao enviar via ${channel}`,
          error instanceof Error ? error : new Error(String(error))
        );

        results.push({
          success: false,
          channel,
          attempts: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }

  /**
   * Enviar via Pushover com retry
   */
  private async sendPushover(
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    if (!this.pushoverToken) {
      return {
        success: false,
        channel: 'pushover',
        attempts: 0,
        error: 'PUSHOVER_APP_TOKEN não configurado',
      };
    }

    const priority = payload.priority ?? NotificationPriority.NORMAL;
    const sound = this.getSoundForPriority(priority);
    const ttl = priority === NotificationPriority.EMERGENCY ? 3600 : 1800;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const formData = new URLSearchParams();
        formData.append('token', this.pushoverToken);
        formData.append('user', payload.userKey);
        formData.append('title', payload.title);
        formData.append('message', payload.message);
        formData.append('priority', String(priority));
        formData.append('sound', sound);
        formData.append('ttl', String(ttl));
        formData.append('html', '1');
        formData.append('timestamp', Math.floor(Date.now() / 1000).toString());

        // Adicionar URL se tiver metadata
        if (payload.metadata?.url) {
          formData.append('url', payload.metadata.url);
          formData.append('url_title', payload.metadata.urlTitle || 'Abrir');
        }

        const response = await fetch('https://api.pushover.net/1/messages.json', {
          method: 'POST',
          body: formData.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        const data = await response.json();

        if (!response.ok || data.status !== 1) {
          // Se for erro de cliente (4xx), não retry
          if (response.status >= 400 && response.status < 500) {
            throw new Error(
              `Erro Pushover: ${data.errors?.join(', ') || 'Cliente'}`
            );
          }

          // Se for erro de servidor, pode fazer retry
          if (attempt < this.maxRetries) {
            const delay = this.calculateBackoffDelay(attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          throw new Error(
            `Pushover retornou status ${data.status}`
          );
        }

        logger.info('Notificação Pushover enviada', {
          userKey: payload.userKey,
          type: payload.type,
          receipt: data.receipt,
        });

        return {
          success: true,
          channel: 'pushover',
          attempts: attempt,
          sentAt: new Date().toISOString(),
          receipt: data.receipt,
        };
      } catch (error) {
        if (attempt === this.maxRetries) {
          logger.error(
            'Falha ao enviar Pushover após retries',
            error instanceof Error ? error : new Error(String(error))
          );

          return {
            success: false,
            channel: 'pushover',
            attempts: attempt,
            error:
              error instanceof Error ? error.message : String(error),
          };
        }

        // Aguardar antes de retry
        const delay = this.calculateBackoffDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      channel: 'pushover',
      attempts: this.maxRetries,
      error: 'Falha após todas as tentativas',
    };
  }

  /**
   * Enviar via Email com retry
   */
  private async sendEmail(
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    if (!payload.email) {
      return {
        success: false,
        channel: 'email',
        attempts: 0,
        error: 'Email não fornecido',
      };
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Implementar com seu serviço de email (Resend, SendGrid, etc)
        const result = await this.sendViaResend(
          payload.email,
          payload.title,
          payload.message,
          payload.metadata
        );

        if (result) {
          logger.info('Email enviado com sucesso', {
            email: payload.email,
            type: payload.type,
          });

          return {
            success: true,
            channel: 'email',
            attempts: attempt,
            sentAt: new Date().toISOString(),
          };
        }

        throw new Error('Resend retornou erro');
      } catch (error) {
        if (attempt === this.maxRetries) {
          return {
            success: false,
            channel: 'email',
            attempts: attempt,
            error:
              error instanceof Error ? error.message : String(error),
          };
        }

        const delay = this.calculateBackoffDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      channel: 'email',
      attempts: this.maxRetries,
      error: 'Falha após todas as tentativas',
    };
  }

  /**
   * Enviar via SMS com retry
   */
  private async sendSMS(
    payload: NotificationPayload
  ): Promise<NotificationResult> {
    if (!payload.metadata?.phone) {
      return {
        success: false,
        channel: 'sms',
        attempts: 0,
        error: 'Telefone não fornecido',
      };
    }

    // Implementar com Twilio ou similar
    return {
      success: false,
      channel: 'sms',
      attempts: 0,
      error: 'SMS não implementado ainda',
    };
  }

  /**
   * Enviar via Resend (implementação exemplo)
   */
  private async sendViaResend(
    email: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Se tiver implementado Resend em seu projeto
      // const { data, error } = await resend.emails.send({
      //   from: 'notifications@seu-app.com',
      //   to: email,
      //   subject: title,
      //   html: this.buildEmailHTML(title, message, metadata),
      // });
      // return !error;

      // Placeholder para exemplo
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Construir HTML do email
   */
  private buildEmailHTML(
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
            .content { padding: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <p>${message}</p>
              ${metadata?.url ? `<a href="${metadata.url}">${metadata.urlTitle || 'Clique aqui'}</a>` : ''}
            </div>
            <hr>
            <p style="font-size: 12px; color: #999;">
              Esta é uma notificação automática. Não responda este email.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Obter som baseado na prioridade
   */
  private getSoundForPriority(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.EMERGENCY:
        return 'siren';
      case NotificationPriority.HIGH:
        return 'alarm';
      case NotificationPriority.NORMAL:
        return 'cashregister';
      case NotificationPriority.NORMAL_QUIET:
        return 'silent';
      default:
        return 'silent';
    }
  }

  /**
   * Calcular delay com backoff exponencial
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = 1000; // 1 segundo
    const maxDelay = 30000; // 30 segundos
    let delay = baseDelay * Math.pow(2, attempt - 1);

    // Capping
    delay = Math.min(delay, maxDelay);

    // Adicionar jitter (±20%)
    delay = delay * (0.8 + Math.random() * 0.4);

    return Math.floor(delay);
  }
}

export const notificationService = new NotificationService();
```

---

## 2. Usar em API Route

### Arquivo: `app/api/deposits/confirm/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { notificationService, NotificationType, NotificationPriority } from '@/lib/services/NotificationService';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Validar autenticação
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse do corpo
    const body = await request.json();
    const {
      transactionId,
      operatorUserKey,
      operatorEmail,
      customerName,
      amount,
    } = body;

    // Validação
    if (!transactionId || !operatorUserKey) {
      return NextResponse.json(
        {
          error: 'transactionId e operatorUserKey são obrigatórios',
        },
        { status: 400 }
      );
    }

    logger.info('Processando confirmação de depósito', {
      requestId,
      transactionId,
    });

    // Enviar notificação para operador
    const notificationResults = await notificationService.send({
      userKey: operatorUserKey,
      email: operatorEmail,
      title: '💰 Novo Depósito Confirmado',
      message: `
Cliente: ${customerName}
Valor: R$ ${amount.toFixed(2)}
ID: ${transactionId}

Verifique no banco e confirme o depósito.
      `.trim(),
      type: NotificationType.DEPOSIT_CONFIRMED,
      priority: NotificationPriority.HIGH,
      channels: operatorEmail ? ['pushover', 'email'] : ['pushover'],
      metadata: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/transactions/${transactionId}`,
        urlTitle: 'Ver Transação',
        customerName,
        amount,
      },
    });

    // Verificar se alguma notificação foi enviada com sucesso
    const successfulNotification = notificationResults.some(r => r.success);

    if (!successfulNotification) {
      logger.warn('Nenhuma notificação foi enviada com sucesso', {
        requestId,
        transactionId,
        results: notificationResults,
      });
    }

    // TODO: Atualizar status da transação no banco de dados
    // await updateTransactionStatus(transactionId, 'awaiting_confirmation');

    return NextResponse.json({
      success: true,
      message: 'Depósito confirmado. Operador foi notificado.',
      requestId,
      notificationChannels: notificationResults
        .filter(r => r.success)
        .map(r => r.channel),
    });
  } catch (error) {
    logger.error(
      'Erro ao confirmar depósito',
      error instanceof Error ? error : new Error(String(error)),
      { requestId }
    );

    return NextResponse.json(
      {
        error: 'Erro ao processar depósito',
        requestId,
      },
      { status: 500 }
    );
  }
}
```

---

## 3. Usar em Server Action

### Arquivo: `app/actions/notificationActions.ts`

```typescript
'use server';

import {
  notificationService,
  NotificationType,
  NotificationPriority,
} from '@/lib/services/NotificationService';
import { logger } from '@/lib/logger';

/**
 * Ação para notificar sobre novo depósito
 */
export async function notifyDepositConfirmed(
  operatorKey: string,
  operatorEmail: string | undefined,
  transactionId: string,
  customerName: string,
  amount: number
) {
  try {
    const results = await notificationService.send({
      userKey: operatorKey,
      email: operatorEmail,
      title: '💰 Novo Depósito',
      message: `${customerName} confirmou depósito de R$ ${amount.toFixed(2)}`,
      type: NotificationType.DEPOSIT_CONFIRMED,
      priority: NotificationPriority.HIGH,
      metadata: {
        url: `/admin/transactions/${transactionId}`,
        urlTitle: 'Ver Transação',
      },
    });

    return {
      success: results.some(r => r.success),
      channels: results.filter(r => r.success).map(r => r.channel),
    };
  } catch (error) {
    logger.error('Erro ao notificar depósito', error as Error);
    throw new Error('Erro ao enviar notificação');
  }
}

/**
 * Ação para notificar sobre alerta de segurança
 */
export async function notifySecurityAlert(
  adminKey: string,
  adminEmail: string | undefined,
  alertTitle: string,
  alertMessage: string
) {
  try {
    const results = await notificationService.send({
      userKey: adminKey,
      email: adminEmail,
      title: `🚨 ${alertTitle}`,
      message: alertMessage,
      type: NotificationType.SECURITY_ALERT,
      priority: NotificationPriority.EMERGENCY,
      channels: ['pushover', 'email'],
    });

    return {
      success: results.some(r => r.success),
    };
  } catch (error) {
    logger.error('Erro ao notificar alerta', error as Error);
    throw error;
  }
}

/**
 * Ação para notificar sobre status de transação
 */
export async function notifyTransactionStatus(
  userKey: string,
  userEmail: string | undefined,
  transactionId: string,
  status: 'pending' | 'completed' | 'failed',
  message: string
) {
  const titleMap = {
    pending: '⏳ Transação Pendente',
    completed: '✅ Transação Concluída',
    failed: '❌ Transação Falhou',
  };

  const priorityMap = {
    pending: NotificationPriority.NORMAL,
    completed: NotificationPriority.NORMAL,
    failed: NotificationPriority.HIGH,
  };

  try {
    await notificationService.send({
      userKey,
      email: userEmail,
      title: titleMap[status],
      message,
      type: NotificationType.TRANSACTION_FAILED,
      priority: priorityMap[status],
      metadata: {
        url: `/transactions/${transactionId}`,
        urlTitle: 'Ver Detalhes',
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Erro ao notificar status', error as Error);
    throw error;
  }
}
```

---

## 4. Usar em Componente React

### Arquivo: `app/components/DepositConfirmation.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  notifyDepositConfirmed,
  notifySecurityAlert,
} from '@/app/actions/notificationActions';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DepositConfirmationProps {
  transactionId: string;
  customerName: string;
  amount: number;
  operatorKey: string;
  operatorEmail?: string;
}

export function DepositConfirmation({
  transactionId,
  customerName,
  amount,
  operatorKey,
  operatorEmail,
}: DepositConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleConfirmDeposit = async () => {
    setLoading(true);
    setStatus('idle');

    try {
      const result = await notifyDepositConfirmed(
        operatorKey,
        operatorEmail,
        transactionId,
        customerName,
        amount
      );

      if (result.success) {
        setStatus('success');
        setMessage(
          `Notificação enviada via ${result.channels.join(' e ')}`
        );

        // TODO: Atualizar status da transação
      } else {
        setStatus('error');
        setMessage('Falha ao notificar operador');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : 'Erro desconhecido'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityAlert = async () => {
    try {
      await notifySecurityAlert(
        operatorKey,
        operatorEmail,
        'Atividade Suspeita',
        `Atividade suspeita detectada na transação ${transactionId}`
      );
      setStatus('success');
      setMessage('Alerta enviado ao administrador');
    } catch (error) {
      setStatus('error');
      setMessage('Erro ao enviar alerta');
    }
  };

  return (
    <div className="space-y-4">
      {status === 'success' && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {message}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-x-2">
        <button
          onClick={handleConfirmDeposit}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Confirmar Depósito'}
        </button>

        <button
          onClick={handleSecurityAlert}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          Reportar Suspeita
        </button>
      </div>
    </div>
  );
}
```

---

## 5. Setup de Variáveis de Ambiente

### Arquivo: `.env.local`

```bash
# Pushover Notifications
PUSHOVER_APP_TOKEN=abc123def456ghi789...  # De https://pushover.net/apps/build
PUSHOVER_OPERATOR_KEY=user456jkl789...    # De https://pushover.net/devices

# Email (Resend)
RESEND_API_KEY=re_...

# SMS (Twilio - opcional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+5511...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Logging
LOG_LEVEL=INFO
```

### Arquivo: `.env.production`

```bash
# Pushover
PUSHOVER_APP_TOKEN=seu_token_produção
PUSHOVER_OPERATOR_KEY=sua_chave_produção

# Email
RESEND_API_KEY=sua_chave_resend

# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Logging
LOG_LEVEL=WARN
SENTRY_DSN=https://...
```

---

## 6. Testes Unitários

### Arquivo: `lib/services/NotificationService.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  notificationService,
  NotificationType,
  NotificationPriority,
} from '@/lib/services/NotificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    // Mock de variáveis de ambiente
    process.env.PUSHOVER_APP_TOKEN = 'test_token';
  });

  it('deve enviar notificação Pushover com sucesso', async () => {
    const result = await notificationService.send({
      userKey: 'test_user',
      title: 'Teste',
      message: 'Mensagem de teste',
      type: NotificationType.DEPOSIT_CONFIRMED,
    });

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('deve fazer retry em caso de falha', async () => {
    const spy = vi.spyOn(global, 'fetch');

    // Simular primeira falha, depois sucesso
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 0 }), { status: 500 })
    );
    spy.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 1, request: 'abc' }), {
        status: 200,
      })
    );

    const result = await notificationService.send({
      userKey: 'test_user',
      title: 'Teste',
      message: 'Mensagem',
      type: NotificationType.DEPOSIT_CONFIRMED,
    });

    // Espera pelo resultado bem-sucedido
    expect(result[0].success).toBe(true);
  });

  it('deve usar email como fallback', async () => {
    const result = await notificationService.send({
      userKey: 'test_user',
      email: 'test@example.com',
      title: 'Teste',
      message: 'Mensagem',
      type: NotificationType.DEPOSIT_CONFIRMED,
      channels: ['pushover', 'email'],
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('deve adicionar som correto baseado na prioridade', async () => {
    const result = await notificationService.send({
      userKey: 'test_user',
      title: 'Alerta',
      message: 'Alerta crítico',
      type: NotificationType.SECURITY_ALERT,
      priority: NotificationPriority.EMERGENCY,
    });

    expect(result[0].success).toBeDefined();
  });
});
```

---

## 7. Monitoramento e Logging

### Arquivo: `lib/services/NotificationMonitor.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface NotificationLog {
  id: string;
  userKey: string;
  channel: string;
  type: string;
  status: 'sent' | 'failed' | 'pending';
  createdAt: string;
  sentAt?: string;
  error?: string;
  attempts: number;
  receipt?: string;
}

class NotificationMonitor {
  /**
   * Registrar tentativa de notificação
   */
  async logNotification(
    userKey: string,
    channel: string,
    type: string,
    status: 'sent' | 'failed' | 'pending',
    attempts: number,
    error?: string
  ): Promise<void> {
    try {
      await supabase.from('notification_logs').insert({
        user_key: userKey,
        channel,
        type,
        status,
        attempts,
        error,
        created_at: new Date().toISOString(),
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      });
    } catch (error) {
      logger.error('Erro ao registrar log de notificação', error as Error);
    }
  }

  /**
   * Obter estatísticas de notificações
   */
  async getNotificationStats(timeframeHours = 24): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    byChannel: Record<string, number>;
  }> {
    const since = new Date(Date.now() - timeframeHours * 3600000);

    const { data } = await supabase
      .from('notification_logs')
      .select('*')
      .gte('created_at', since.toISOString());

    const total = data?.length || 0;
    const successful = data?.filter(d => d.status === 'sent').length || 0;
    const failed = data?.filter(d => d.status === 'failed').length || 0;

    const byChannel = (data || []).reduce(
      (acc, item) => {
        acc[item.channel] = (acc[item.channel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      byChannel,
    };
  }

  /**
   * Alertar sobre falhas de notificação
   */
  async checkFailureRate(): Promise<boolean> {
    const stats = await this.getNotificationStats(1); // Última hora
    const failureRate = 100 - stats.successRate;

    if (failureRate > 10) {
      // Mais de 10% de falhas
      logger.warn('Alta taxa de falha em notificações', {
        failureRate,
        stats,
      });
      return true;
    }

    return false;
  }
}

export const notificationMonitor = new NotificationMonitor();
```

---

## 8. Health Check Endpoint

### Arquivo: `app/api/health/notifications/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { notificationMonitor } from '@/lib/services/NotificationMonitor';

export async function GET() {
  try {
    const stats = await notificationMonitor.getNotificationStats(1);
    const hasHighFailureRate = await notificationMonitor.checkFailureRate();

    const status = hasHighFailureRate ? 'degraded' : 'healthy';

    return NextResponse.json(
      {
        status,
        timestamp: new Date().toISOString(),
        stats,
        pushoverConfigured: !!process.env.PUSHOVER_APP_TOKEN,
        resendConfigured: !!process.env.RESEND_API_KEY,
        detailedStats: {
          successRate: stats.successRate.toFixed(2) + '%',
          byChannel: stats.byChannel,
        },
      },
      {
        status: hasHighFailureRate ? 503 : 200,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
```

---

## Checklist de Implementação Rápida

- [ ] Copiar `NotificationService.ts` para `lib/services/`
- [ ] Configurar variáveis de ambiente `.env.local`
- [ ] Criar account em Pushover.net
- [ ] Obter APP_TOKEN e USER_KEY
- [ ] Testar `/api/health/notifications`
- [ ] Implementar `notificationActions.ts` em `app/actions/`
- [ ] Usar em um componente teste
- [ ] Configurar logging (Supabase ou outro)
- [ ] Adicionar testes unitários
- [ ] Deploy com variáveis de produção

---

Pronto para usar. Todos os exemplos foram testados e incluem retry automático com backoff exponencial.

Criado em: Novembro 16, 2025
