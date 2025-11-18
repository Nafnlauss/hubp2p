# Exemplos de API Routes - Next.js App Router
## Projeto P2P - Compra de Criptomoedas

Este documento contém exemplos detalhados de API routes para o projeto P2P com Next.js 13+ (App Router), cobrindo:
- Verificação de assinatura de webhooks
- Rate limiting
- Tratamento de erros
- CORS
- Integrações com Proteo (KYC) e Pushover (notificações)

---

## 1. Estrutura de Diretórios Recomendada

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── route.ts
│   │   ├── kyc/
│   │   │   ├── verify/route.ts
│   │   │   └── status/route.ts
│   │   ├── transactions/
│   │   │   ├── create/route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── status/route.ts
│   │   ├── webhooks/
│   │   │   ├── proteo/route.ts
│   │   │   └── pushover/route.ts
│   │   └── admin/
│   │       ├── deposit-confirmed/route.ts
│   │       └── transactions/route.ts
│   └── page.tsx
├── lib/
│   ├── security/
│   │   ├── signature.ts
│   │   ├── rate-limit.ts
│   │   └── cors.ts
│   ├── external-apis/
│   │   ├── proteo.ts
│   │   └── pushover.ts
│   └── db/
│       └── supabase-client.ts
└── types/
    └── api.ts
```

---

## 2. Configuração de Segurança

### 2.1 Verificação de Assinatura (lib/security/signature.ts)

```typescript
import crypto from 'crypto';

export interface SignatureConfig {
  secret: string;
  algorithm: 'sha256' | 'sha512';
}

/**
 * Gera assinatura HMAC para requisições
 * Usado para verificar webhooks autênticos da Proteo ou Pushover
 */
export function generateSignature(
  payload: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
  return crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verifica se a assinatura é válida usando comparação segura (timing-safe)
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  const expectedSignature = generateSignature(payload, secret, algorithm);

  // Usar comparação timing-safe para evitar timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Extrai e valida a assinatura do header da requisição
 */
export function extractAndVerifySignature(
  headers: Headers,
  body: string,
  secret: string,
  signatureHeaderName: string = 'x-signature',
  algorithm: 'sha256' | 'sha512' = 'sha256'
): { valid: boolean; signature?: string } {
  const signature = headers.get(signatureHeaderName);

  if (!signature) {
    return { valid: false };
  }

  try {
    const isValid = verifySignature(body, signature, secret, algorithm);
    return { valid: isValid, signature };
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return { valid: false };
  }
}
```

### 2.2 Rate Limiting (lib/security/rate-limit.ts)

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Configuração de rate limiting com Upstash Redis
 * Alternativa: usar implementação em-memory para desenvolvimento
 */
export const rateLimitRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimit = new Ratelimit({
  redis: rateLimitRedis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requisições por minuto
});

export const createDepositRateLimit = new Ratelimit({
  redis: rateLimitRedis,
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 depósitos por hora por usuário
});

/**
 * Rate limit simples em-memory para desenvolvimento
 * NÃO usar em produção
 */
class SimpleRateLimit {
  private store = new Map<string, Array<number>>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const timestamps = this.store.get(key) || [];

    // Remove timestamps fora da janela
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    validTimestamps.push(now);
    this.store.set(key, validTimestamps);

    return { allowed: true, remaining: this.maxRequests - validTimestamps.length };
  }
}

export const simpleRateLimit = new SimpleRateLimit(60000, 10);
```

### 2.3 CORS (lib/security/cors.ts)

```typescript
/**
 * Configuração de CORS para Next.js
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Verifica se a origem é permitida
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  return allowedOrigins.some(allowed => allowed.trim() === origin);
}

/**
 * Cria headers CORS seguros
 */
export function createCorsHeaders(requestOrigin: string | null) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const origin = isOriginAllowed(requestOrigin) ? requestOrigin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-signature',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Handler OPTIONS para preflight requests
 */
export function handleCorsPreFlight(request: Request) {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: createCorsHeaders(origin),
    });
  }

  return null;
}
```

---

## 3. Integrações com APIs Externas

### 3.1 Proteo KYC (lib/external-apis/proteo.ts)

```typescript
/**
 * Cliente para integração com Proteo KYC
 * Documentação: https://www.proteo.com.br/
 */

export interface ProteoKycData {
  fullName: string;
  cpf: string;
  birthDate: string; // YYYY-MM-DD
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  identityDocument?: string; // Base64 ou URL
  selfie?: string; // Base64 ou URL
}

export interface ProteoVerificationResponse {
  verificationId: string;
  status: 'approved' | 'pending' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  message?: string;
  timestamp: string;
}

export interface ProteoBackgroundCheckResponse {
  verificationId: string;
  cpfValid: boolean;
  sanctions: boolean;
  publiclyExposed: boolean;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    description: string;
  };
}

class ProteoClient {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || process.env.PROTEO_API_KEY!;
    this.apiUrl = apiUrl || process.env.PROTEO_API_URL || 'https://api.proteo.com.br';

    if (!this.apiKey) {
      throw new Error('PROTEO_API_KEY não configurado');
    }
  }

  /**
   * Submete documentos para verificação KYC
   */
  async submitKycVerification(
    data: ProteoKycData
  ): Promise<ProteoVerificationResponse> {
    try {
      const formData = new FormData();

      // Adiciona dados básicos
      formData.append('fullName', data.fullName);
      formData.append('cpf', data.cpf);
      formData.append('birthDate', data.birthDate);
      formData.append('address', data.address);
      formData.append('city', data.city);
      formData.append('state', data.state);
      formData.append('zipCode', data.zipCode);
      formData.append('phone', data.phone);
      formData.append('email', data.email);

      // Adiciona documentos se fornecidos
      if (data.identityDocument) {
        const identityBlob = await this.base64ToBlob(data.identityDocument);
        formData.append('identityDocument', identityBlob, 'identity.pdf');
      }

      if (data.selfie) {
        const selfieBlob = await this.base64ToBlob(data.selfie);
        formData.append('selfie', selfieBlob, 'selfie.jpg');
      }

      const response = await fetch(`${this.apiUrl}/v1/kyc/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Proteo API Error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar KYC na Proteo:', error);
      throw error;
    }
  }

  /**
   * Obtém status da verificação
   */
  async getVerificationStatus(verificationId: string): Promise<ProteoVerificationResponse> {
    try {
      const response = await fetch(
        `${this.apiUrl}/v1/kyc/verify/${verificationId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Proteo API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar status de verificação:', error);
      throw error;
    }
  }

  /**
   * Realiza background check (validação de CPF, listas de sanções)
   */
  async performBackgroundCheck(cpf: string): Promise<ProteoBackgroundCheckResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/background-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        throw new Error(`Proteo API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao realizar background check:', error);
      throw error;
    }
  }

  /**
   * Monitoramento contínuo de cliente
   */
  async setupContinuousMonitoring(cpf: string): Promise<{ status: string; monitoringId: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/monitoring/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        throw new Error(`Proteo API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao configurar monitoramento contínuo:', error);
      throw error;
    }
  }

  private async base64ToBlob(base64: string): Promise<Blob> {
    const binaryString = atob(base64.split(',')[1] || base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'application/octet-stream' });
  }
}

export const proteoClient = new ProteoClient();
```

### 3.2 Pushover Notificações (lib/external-apis/pushover.ts)

```typescript
/**
 * Cliente para integração com Pushover
 * Documentação: https://pushover.net/api
 */

export interface PushoverMessage {
  token: string; // APP_TOKEN
  user: string; // USER_KEY do operador
  message: string;
  title?: string;
  priority?: -2 | -1 | 0 | 1 | 2; // -2 low, -1 normal, 0 normal, 1 high, 2 emergency
  ttl?: number; // Time to live em segundos
  sound?: string; // Notificação personalizada
  url?: string;
  url_title?: string;
  html?: 0 | 1; // 1 para suportar HTML
  timestamp?: number; // Unix timestamp
}

export interface PushoverResponse {
  status: number;
  request: string;
  errors?: string[];
}

class PushoverClient {
  private apiUrl = 'https://api.pushover.net/1/messages.json';

  /**
   * Envia notificação ao operador quando cliente confirma depósito
   */
  async sendDepositNotification(
    operatorUserKey: string,
    transactionData: {
      transactionId: string;
      customerName: string;
      amount: number;
      method: 'pix' | 'ted';
      timestamp: Date;
    }
  ): Promise<PushoverResponse> {
    const appToken = process.env.PUSHOVER_APP_TOKEN;

    if (!appToken) {
      throw new Error('PUSHOVER_APP_TOKEN não configurado');
    }

    const message: PushoverMessage = {
      token: appToken,
      user: operatorUserKey,
      title: 'Novo Depósito Confirmado',
      message: this.formatDepositMessage(transactionData),
      priority: 1, // Prioridade alta
      ttl: 3600, // 1 hora de vida útil
      sound: 'cashregister', // Som de notificação
      html: 1,
      timestamp: Math.floor(transactionData.timestamp.getTime() / 1000),
    };

    return this.sendMessage(message);
  }

  /**
   * Envia notificação customizada
   */
  async sendMessage(message: PushoverMessage): Promise<PushoverResponse> {
    try {
      const formData = new URLSearchParams();

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

      if (!response.ok) {
        throw new Error(`Pushover API Error: ${data.errors?.join(', ') || response.statusText}`);
      }

      return { status: response.status, request: data.request, ...data };
    } catch (error) {
      console.error('Erro ao enviar notificação Pushover:', error);
      throw error;
    }
  }

  /**
   * Formata mensagem de depósito confirmado
   */
  private formatDepositMessage(transactionData: {
    transactionId: string;
    customerName: string;
    amount: number;
    method: 'pix' | 'ted';
    timestamp: Date;
  }): string {
    const methodLabel = transactionData.method === 'pix' ? 'PIX' : 'TED';
    const timeStr = transactionData.timestamp.toLocaleString('pt-BR');

    return `
<b>Novo Depósito!</b>
Cliente: ${transactionData.customerName}
ID Transação: <b>${transactionData.transactionId}</b>
Valor: <b>R$ ${transactionData.amount.toFixed(2)}</b>
Método: ${methodLabel}
Horário: ${timeStr}

⚠️ Verifique no banco e confirme o depósito no painel administrativo.
    `.trim();
  }

  /**
   * Envia notificação de erro crítico
   */
  async sendErrorNotification(
    adminUserKey: string,
    error: {
      title: string;
      message: string;
      severity: 'warning' | 'error';
    }
  ): Promise<PushoverResponse> {
    const appToken = process.env.PUSHOVER_APP_TOKEN;

    if (!appToken) {
      throw new Error('PUSHOVER_APP_TOKEN não configurado');
    }

    const message: PushoverMessage = {
      token: appToken,
      user: adminUserKey,
      title: `[${error.severity.toUpperCase()}] ${error.title}`,
      message: error.message,
      priority: error.severity === 'error' ? 2 : 1,
      sound: error.severity === 'error' ? 'siren' : 'alarm',
    };

    return this.sendMessage(message);
  }
}

export const pushoverClient = new PushoverClient();
```

---

## 4. API Routes

### 4.1 KYC - Enviar Verificação (app/api/kyc/verify/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createCorsHeaders, handleCorsPreFlight } from '@/lib/security/cors';
import { proteoClient } from '@/lib/external-apis/proteo';
import { simpleRateLimit } from '@/lib/security/rate-limit';

export async function OPTIONS(request: NextRequest) {
  const corsPreFlight = handleCorsPreFlight(request);
  if (corsPreFlight) return corsPreFlight;
}

export async function POST(request: NextRequest) {
  try {
    // CORS
    const origin = request.headers.get('origin');
    const corsHeaders = createCorsHeaders(origin);

    // Rate limiting por IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { allowed, remaining } = simpleRateLimit.check(`kyc:${ip}`);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Validação de corpo
    const body = await request.json();

    const validation = validateKycData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Submete para Proteo
    const result = await proteoClient.submitKycVerification(body);

    // TODO: Salvar resultado no Supabase com status 'pending'
    // await supabaseClient.from('kyc_verifications').insert({
    //   user_id: body.userId,
    //   proteo_verification_id: result.verificationId,
    //   status: result.status,
    //   risk_level: result.riskLevel,
    //   submitted_at: new Date().toISOString(),
    // });

    return NextResponse.json(
      {
        success: true,
        verificationId: result.verificationId,
        status: result.status,
        message: 'Verificação enviada. Você será notificado em breve.',
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Remaining': remaining.toString(),
        }
      }
    );
  } catch (error) {
    console.error('Erro ao processar KYC:', error);

    return NextResponse.json(
      {
        error: 'Erro ao processar verificação. Tente novamente.',
        requestId: crypto.randomUUID(),
      },
      { status: 500 }
    );
  }
}

function validateKycData(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!data.fullName || typeof data.fullName !== 'string') {
    errors.push('Nome completo é obrigatório');
  }

  if (!data.cpf || !isValidCpf(data.cpf)) {
    errors.push('CPF inválido');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Email inválido');
  }

  if (!data.phone || !isValidPhone(data.phone)) {
    errors.push('Telefone inválido');
  }

  if (!data.birthDate || !isValidDate(data.birthDate)) {
    errors.push('Data de nascimento inválida');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

function isValidCpf(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;

  // Implementar validação real de CPF se necessário
  return /^\d{11}$/.test(cleaned);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
```

### 4.2 Criar Transação de Depósito (app/api/transactions/create/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createCorsHeaders, handleCorsPreFlight } from '@/lib/security/cors';
import { createDepositRateLimit } from '@/lib/security/rate-limit';
import crypto from 'crypto';

export async function OPTIONS(request: NextRequest) {
  const corsPreFlight = handleCorsPreFlight(request);
  if (corsPreFlight) return corsPreFlight;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const corsHeaders = createCorsHeaders(origin);

    // Autenticação (bearer token)
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = auth.substring(7);
    // TODO: Validar token JWT contra Supabase

    const body = await request.json();
    const { userId, amount, method, blockchain, walletAddress } = body;

    // Validação básica
    if (!userId || !amount || !method || !blockchain || !walletAddress) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limiting por usuário (máximo 5 depósitos por hora)
    const { allowed } = await createDepositRateLimit.limit(`deposit:${userId}`);
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Você atingiu o limite de depósitos. Tente novamente em 1 hora.'
        },
        { status: 429, headers: corsHeaders }
      );
    }

    // Validação de valores
    if (method === 'pix' && amount > 1000) {
      return NextResponse.json(
        { error: 'Limite de PIX é R$ 1.000 entre 20h e 6h' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (method === 'ted' && (amount < 1 || amount > 100000)) {
      return NextResponse.json(
        { error: 'Valor TED deve estar entre R$ 1 e R$ 100.000' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Gera número único de transação
    const transactionId = generateTransactionId();
    const expiresAt = new Date(Date.now() + 40 * 60 * 1000); // 40 minutos

    // Gera dados de depósito (PIX/TED)
    const depositData = generateDepositData(method);

    // TODO: Salvar transação no Supabase
    // const { data, error } = await supabaseClient.from('transactions').insert({
    //   id: transactionId,
    //   user_id: userId,
    //   amount,
    //   method,
    //   blockchain,
    //   wallet_address: walletAddress,
    //   status: 'pending',
    //   pix_data: method === 'pix' ? depositData : null,
    //   ted_data: method === 'ted' ? depositData : null,
    //   created_at: new Date().toISOString(),
    //   expires_at: expiresAt.toISOString(),
    // });

    return NextResponse.json(
      {
        success: true,
        transactionId,
        amount,
        method,
        depositData,
        expiresAt: expiresAt.toISOString(),
        timeRemainingSeconds: 40 * 60,
        message: 'Transação criada. Complete o depósito em 40 minutos.',
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar transação' },
      { status: 500 }
    );
  }
}

function generateTransactionId(): string {
  return `TX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

interface DepositData {
  bankName: string;
  accountNumber: string;
  accountDigit: string;
  bankCode: string;
  accountType: string;
  accountHolder: string;
  cpf: string;
  pixKey?: string; // Para PIX
}

function generateDepositData(method: 'pix' | 'ted'): DepositData {
  if (method === 'pix') {
    return {
      bankName: 'Banco do Brasil',
      bankCode: '001',
      pixKey: process.env.PIX_KEY || 'sua-chave-pix@suaempresa.com.br',
      accountNumber: '',
      accountDigit: '',
      accountType: '',
      accountHolder: '',
      cpf: '',
    };
  } else {
    // TED - retorna dados da conta corrente
    return {
      bankName: process.env.BANK_NAME || 'Banco do Brasil',
      bankCode: process.env.BANK_CODE || '001',
      accountNumber: process.env.ACCOUNT_NUMBER || '0000001',
      accountDigit: process.env.ACCOUNT_DIGIT || '9',
      accountType: 'CORRENTE',
      accountHolder: process.env.ACCOUNT_HOLDER || 'Sua Empresa LTDA',
      cpf: process.env.ACCOUNT_CPF || '00000000000',
      pixKey: '',
    };
  }
}
```

### 4.3 Webhook - Proteo (app/api/webhooks/proteo/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  extractAndVerifySignature
} from '@/lib/security/signature';

/**
 * Webhook para receber atualizações de KYC da Proteo
 * Proteo enviará: verificação aprovada/rejeitada/pendente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verifica assinatura do webhook
    const signature = extractAndVerifySignature(
      request.headers,
      body,
      process.env.PROTEO_WEBHOOK_SECRET!,
      'x-proteo-signature',
      'sha256'
    );

    if (!signature.valid) {
      console.warn('Assinatura inválida no webhook da Proteo');
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);

    const {
      verificationId,
      status,
      riskLevel,
      cpf,
      customData
    } = payload;

    console.log(`Webhook Proteo recebido: ${verificationId} - ${status}`);

    // TODO: Atualizar status no Supabase
    // if (status === 'approved') {
    //   await supabaseClient.from('kyc_verifications')
    //     .update({
    //       status: 'approved',
    //       risk_level: riskLevel,
    //       completed_at: new Date().toISOString()
    //     })
    //     .eq('proteo_verification_id', verificationId);
    //
    //   // Habilitar criação de transações
    //   const userId = customData.userId;
    //   await supabaseClient.from('users')
    //     .update({ kyc_approved: true })
    //     .eq('id', userId);
    // }

    return NextResponse.json(
      {
        success: true,
        processed: true,
        verificationId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar webhook Proteo:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

// Preflight
export async function OPTIONS(request: NextRequest) {
  return new Response(null, { status: 204 });
}
```

### 4.4 Webhook - Confirmação de Depósito (app/api/webhooks/deposit-notification/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { pushoverClient } from '@/lib/external-apis/pushover';

/**
 * Webhook para cliente confirmar que realizou o depósito
 * Envia notificação ao operador via Pushover
 */
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionId, operatorUserKey } = body;

    if (!transactionId || !operatorUserKey) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // TODO: Buscar transação no Supabase
    // const { data: transaction } = await supabaseClient
    //   .from('transactions')
    //   .select('*')
    //   .eq('id', transactionId)
    //   .single();

    // Dados fictícios para exemplo
    const transactionData = {
      transactionId,
      customerName: 'João Silva',
      amount: 500,
      method: 'pix' as const,
      timestamp: new Date(),
    };

    // Envia notificação ao operador
    const pushoverResult = await pushoverClient.sendDepositNotification(
      operatorUserKey,
      transactionData
    );

    if (pushoverResult.status !== 1) {
      throw new Error('Falha ao enviar notificação Pushover');
    }

    // TODO: Atualizar status da transação para 'awaiting_confirmation'
    // await supabaseClient.from('transactions')
    //   .update({
    //     status: 'awaiting_confirmation',
    //     customer_confirmed_at: new Date().toISOString()
    //   })
    //   .eq('id', transactionId);

    return NextResponse.json(
      {
        success: true,
        message: 'Depósito confirmado. Operador foi notificado.',
        notificationSent: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao confirmar depósito:', error);

    return NextResponse.json(
      { error: 'Erro ao confirmar depósito' },
      { status: 500 }
    );
  }
}
```

### 4.5 Admin - Atualizar Status (app/api/admin/deposit-confirmed/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/security/auth';

/**
 * Endpoint para operador/admin confirmar que pagamento foi recebido
 * Atualiza status da transação e registra no log de auditoria
 */
export async function PUT(request: NextRequest) {
  try {
    // Autenticação de admin
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const token = auth.substring(7);
    const adminData = await verifyAdminToken(token);

    if (!adminData) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId obrigatório' },
        { status: 400 }
      );
    }

    // TODO: Atualizar status da transação
    // await supabaseClient.from('transactions')
    //   .update({
    //     status: 'payment_received',
    //     confirmed_by: adminData.id,
    //     confirmed_at: new Date().toISOString()
    //   })
    //   .eq('id', transactionId);

    // TODO: Registrar no log de auditoria
    // await supabaseClient.from('audit_logs').insert({
    //   action: 'DEPOSIT_CONFIRMED',
    //   transaction_id: transactionId,
    //   operator_id: adminData.id,
    //   timestamp: new Date().toISOString(),
    //   details: { status_changed_to: 'payment_received' }
    // });

    return NextResponse.json(
      {
        success: true,
        message: 'Depósito confirmado',
        status: 'payment_received',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao confirmar depósito:', error);

    return NextResponse.json(
      { error: 'Erro ao confirmar depósito' },
      { status: 500 }
    );
  }
}
```

---

## 5. Variáveis de Ambiente (.env.local)

```bash
# Proteo KYC
PROTEO_API_KEY=sua_chave_api_proteo
PROTEO_API_URL=https://api.proteo.com.br
PROTEO_WEBHOOK_SECRET=seu_webhook_secret_proteo

# Pushover
PUSHOVER_APP_TOKEN=seu_app_token_pushover

# Banco e PIX
PIX_KEY=sua-chave-pix@suaempresa.com.br
BANK_NAME=Banco do Brasil
BANK_CODE=001
ACCOUNT_NUMBER=0000001
ACCOUNT_DIGIT=9
ACCOUNT_HOLDER=Sua Empresa LTDA
ACCOUNT_CPF=00000000000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cnttavxhilcilcoafkgu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Rate Limiting (Upstash Redis - opcional)
UPSTASH_REDIS_REST_URL=https://seu-redis-url
UPSTASH_REDIS_REST_TOKEN=seu_redis_token

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://suaempresa.com.br

# JWT Secret
JWT_SECRET=sua_chave_jwt_secreta_muito_segura
```

---

## 6. Tratamento de Erros - Error Boundary

```typescript
// app/api/utils/error-handler.ts
import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        requestId: crypto.randomUUID(),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: 'JSON inválido', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      requestId: crypto.randomUUID(),
    },
    { status: 500 }
  );
}
```

---

## 7. Checklist de Segurança

- [ ] HTTPS obrigatório em produção
- [ ] Verificação de assinatura em todos os webhooks
- [ ] Rate limiting implementado
- [ ] CORS configurado corretamente
- [ ] Tokens JWT com expiração
- [ ] Autenticação multi-fator para admins
- [ ] Logs de auditoria completos (5 anos de retenção)
- [ ] Criptografia de dados sensíveis (CPF, emails)
- [ ] Validação de todas as entradas
- [ ] Tratamento de erros sem expor detalhes internos
- [ ] Variáveis de ambiente não versionadas
- [ ] Rate limiting diferenciado por endpoint
- [ ] Monitoramento de falhas em APIs externas
- [ ] Backup regular do banco de dados
- [ ] Testes de penetração periódicos

---

## 8. Próximos Passos

1. Implementar autenticação JWT completa
2. Integrar com Supabase para persistência
3. Adicionar testes unitários e de integração
4. Configurar CI/CD
5. Implementar logging estruturado (exemplo: Sentry)
6. Adicionar rate limiting distribuído em produção
7. Documentação OpenAPI/Swagger
8. Implementar webhooks retentáveis (retry logic)

---

Este documento fornece um ponto de partida sólido para a implementação de API routes seguros em seu projeto P2P.
