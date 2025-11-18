# Exemplos TypeScript - Implementação Pronta para Usar

Este documento contém exemplos TypeScript prontos para copiar e colar no seu projeto.

---

## 1. Estrutura de Tipos (src/types/api.ts)

```typescript
/**
 * Tipos compartilhados para toda a API
 */

// Autenticação
export interface AuthPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Usuário
export interface User {
  id: string;
  email: string;
  fullName: string;
  cpf: string;
  phone: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  kycApprovedAt?: Date;
  proteoVerificationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transação de Depósito
export interface DepositTransaction {
  id: string;
  userId: string;
  amount: number;
  method: 'pix' | 'ted';
  blockchain: string;
  walletAddress: string;
  status: 'pending' | 'awaiting_confirmation' | 'payment_received' | 'sending' | 'sent' | 'expired' | 'cancelled';
  pixData?: PixData;
  tedData?: TedData;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  customerConfirmedAt?: Date;
  confirmedByOperator?: string;
  confirmedAt?: Date;
  sentAt?: Date;
}

export interface PixData {
  pixKey: string; // chave PIX
  qrCode?: string; // QR code em base64
  copyPaste?: string; // dados para copiar e colar
}

export interface TedData {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountDigit: string;
  accountType: string;
  accountHolder: string;
  cpf: string;
}

// Resposta de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
  timestamp: string;
}

// Resposta de erro paginado
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Webhook
export interface WebhookPayload<T> {
  event: string;
  timestamp: string;
  data: T;
}

// Auditoria
export interface AuditLog {
  id: string;
  action: 'DEPOSIT_CREATED' | 'DEPOSIT_CONFIRMED' | 'CRYPTO_SENT' | 'KYC_SUBMITTED' | 'KYC_APPROVED' | 'KYC_REJECTED';
  userId: string;
  operatorId?: string;
  transactionId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
```

---

## 2. Cliente Supabase (src/lib/db/supabase-client.ts)

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase env vars not configured');
}

export const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Criar usuário com dados de KYC
 */
export async function createUser(userData: {
  email: string;
  fullName: string;
  cpf: string;
  phone: string;
}) {
  const { data, error } = await supabaseClient
    .from('users')
    .insert([
      {
        email: userData.email,
        full_name: userData.fullName,
        cpf: userData.cpf,
        phone: userData.phone,
        kyc_status: 'pending',
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Buscar transação por ID
 */
export async function getTransaction(transactionId: string) {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Criar transação de depósito
 */
export async function createTransaction(transactionData: {
  userId: string;
  amount: number;
  method: 'pix' | 'ted';
  blockchain: string;
  walletAddress: string;
  pixData?: any;
  tedData?: any;
}) {
  const { data, error } = await supabaseClient
    .from('transactions')
    .insert([
      {
        id: `TX-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        user_id: transactionData.userId,
        amount: transactionData.amount,
        method: transactionData.method,
        blockchain: transactionData.blockchain,
        wallet_address: transactionData.walletAddress,
        pix_data: transactionData.pixData,
        ted_data: transactionData.tedData,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Atualizar status da transação
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: string,
  operatorId?: string
) {
  const { data, error } = await supabaseClient
    .from('transactions')
    .update({
      status,
      confirmed_by: operatorId,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Registrar log de auditoria
 */
export async function logAudit(auditData: {
  action: string;
  userId?: string;
  operatorId?: string;
  transactionId?: string;
  details: any;
  ipAddress: string;
  userAgent: string;
}) {
  const { error } = await supabaseClient.from('audit_logs').insert([
    {
      action: auditData.action,
      user_id: auditData.userId,
      operator_id: auditData.operatorId,
      transaction_id: auditData.transactionId,
      details: auditData.details,
      ip_address: auditData.ipAddress,
      user_agent: auditData.userAgent,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error('Erro ao registrar auditoria:', error);
    // Não lançar erro para não impedir a requisição
  }
}

/**
 * Atualizar status KYC do usuário
 */
export async function updateUserKycStatus(
  userId: string,
  status: 'approved' | 'rejected' | 'pending' | 'expired',
  proteoVerificationId?: string
) {
  const { data, error } = await supabaseClient
    .from('users')
    .update({
      kyc_status: status,
      proteo_verification_id: proteoVerificationId,
      kyc_approved_at: status === 'approved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Listar transações por usuário
 */
export async function getUserTransactions(userId: string, limit = 20) {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Buscar transações que expiraram
 */
export async function getExpiredTransactions() {
  const now = new Date().toISOString();

  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('status', 'pending')
    .lt('expires_at', now);

  if (error) throw error;
  return data;
}
```

---

## 3. Middleware de Autenticação (src/lib/security/auth.ts)

```typescript
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'seu-secret-muito-seguro');

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'user' | 'operator' | 'admin';
}

/**
 * Verifica token JWT
 */
export async function verifyAuth(token: string): Promise<AuthPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as unknown as AuthPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Verifica token de admin
 */
export async function verifyAdminToken(token: string): Promise<AuthPayload | null> {
  const payload = await verifyAuth(token);

  if (!payload || payload.role !== 'admin') {
    return null;
  }

  return payload;
}

/**
 * Extrai IP da requisição (considerando proxies)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  return (forwarded?.split(',')[0] || realIp || 'unknown').trim();
}

/**
 * Extrai user agent
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}
```

---

## 4. Validadores (src/lib/validators/index.ts)

```typescript
/**
 * Validadores para dados de entrada
 */

export function validateCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Validação do primeiro dígito verificador
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  if (remainder !== parseInt(cleaned.substring(9, 10))) {
    return false;
  }

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  if (remainder !== parseInt(cleaned.substring(10, 11))) {
    return false;
  }

  return true;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

export function validateBrazilianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Validar formato brasileiro: 11 dígitos, começando com 0x ou xx
  return /^(\d{2})9?\d{4}\d{4}$/.test(cleaned) || /^(\d{2})\d{4}\d{4}$/.test(cleaned);
}

export function validateWalletAddress(address: string, blockchain: string): boolean {
  address = address.trim();

  switch (blockchain.toLowerCase()) {
    case 'ethereum':
    case 'eth':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'bitcoin':
    case 'btc':
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    case 'solana':
    case 'sol':
      return /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(address);
    case 'polygon':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    default:
      return address.length >= 20 && address.length <= 200;
  }
}

export function validateAmount(amount: number, min = 1, max = 100000): boolean {
  return Number.isFinite(amount) && amount >= min && amount <= max;
}

export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  // Validar que não é data futura
  return date <= new Date();
}

export function validateBirthDate(dateString: string): boolean {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  const age = new Date().getFullYear() - date.getFullYear();
  return age >= 18 && age <= 150; // Validar maioridade e limite razoável
}

/**
 * Objeto com todas as validações
 */
export const validators = {
  cpf: validateCpf,
  email: validateEmail,
  phone: validatePhone,
  brazilianPhone: validateBrazilianPhone,
  walletAddress: validateWalletAddress,
  amount: validateAmount,
  date: validateDate,
  birthDate: validateBirthDate,
};
```

---

## 5. Helpers de Resposta (src/lib/api/response.ts)

```typescript
import { NextResponse } from 'next/server';

export interface ApiResponseOptions {
  headers?: Record<string, string>;
  status?: number;
}

/**
 * Resposta de sucesso
 */
export function successResponse<T>(
  data: T,
  message?: string,
  options?: ApiResponseOptions
) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    {
      status: options?.status || 200,
      headers: options?.headers,
    }
  );
}

/**
 * Resposta de erro
 */
export function errorResponse(
  error: string,
  code?: string,
  options?: ApiResponseOptions
) {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
    {
      status: options?.status || 500,
      headers: options?.headers,
    }
  );
}

/**
 * Resposta de validação
 */
export function validationErrorResponse(
  errors: Record<string, string>,
  options?: ApiResponseOptions
) {
  return NextResponse.json(
    {
      success: false,
      error: 'Erro de validação',
      code: 'VALIDATION_ERROR',
      errors,
      timestamp: new Date().toISOString(),
    },
    {
      status: options?.status || 400,
      headers: options?.headers,
    }
  );
}

/**
 * Resposta paginada
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  total: number,
  options?: ApiResponseOptions
) {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: options?.status || 200,
      headers: options?.headers,
    }
  );
}
```

---

## 6. Middleware para CORS + Segurança (src/middleware.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware global para Next.js
 */
export function middleware(request: NextRequest) {
  // Apenas aplicar a APIs
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // CORS headers
  const origin = request.headers.get('origin');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-signature');
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
```

---

## 7. Job de Limpeza - Transações Expiradas (src/lib/cron/cleanup.ts)

```typescript
import { supabaseClient, updateTransactionStatus, logAudit } from '@/lib/db/supabase-client';

/**
 * Função para executar diariamente (via cron ou webhook)
 * Cancela transações que expiraram
 */
export async function cleanupExpiredTransactions() {
  try {
    const now = new Date().toISOString();

    // Buscar transações expiradas
    const { data: expiredTransactions, error } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('status', 'pending')
      .lt('expires_at', now);

    if (error) throw error;

    if (!expiredTransactions || expiredTransactions.length === 0) {
      console.log('Nenhuma transação expirada para limpar');
      return;
    }

    console.log(`Limpando ${expiredTransactions.length} transações expiradas`);

    // Atualizar status para cancelled
    for (const transaction of expiredTransactions) {
      await updateTransactionStatus(transaction.id, 'expired');

      // Registrar na auditoria
      await logAudit({
        action: 'TRANSACTION_EXPIRED',
        transactionId: transaction.id,
        userId: transaction.user_id,
        details: {
          amount: transaction.amount,
          method: transaction.method,
          expiredAt: now,
        },
        ipAddress: 'system',
        userAgent: 'cron-job',
      });
    }

    console.log(`${expiredTransactions.length} transações marcadas como expiradas`);
  } catch (error) {
    console.error('Erro ao limpar transações expiradas:', error);
  }
}

/**
 * Endpoint para chamar este job (via webhook externo, como EasyCron)
 * GET /api/cron/cleanup-transactions
 */
export async function handleCleanupCron(request: Request) {
  // Validar token de segurança
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  await cleanupExpiredTransactions();

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## 8. Testes Unitários (src/__tests__/validators.test.ts)

```typescript
import { validateCpf, validateEmail, validateWalletAddress } from '@/lib/validators';

describe('Validators', () => {
  describe('validateCpf', () => {
    it('deve aceitar CPF válido', () => {
      expect(validateCpf('11144477735')).toBe(true);
    });

    it('deve rejeitar CPF com dígitos repetidos', () => {
      expect(validateCpf('11111111111')).toBe(false);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validateCpf('12345678901')).toBe(false);
    });

    it('deve aceitar CPF formatado', () => {
      expect(validateCpf('111.444.777-35')).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('deve aceitar email válido', () => {
      expect(validateEmail('usuario@exemplo.com.br')).toBe(true);
    });

    it('deve rejeitar email sem @', () => {
      expect(validateEmail('usuarioexemplo.com')).toBe(false);
    });

    it('deve rejeitar email vazio', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateWalletAddress', () => {
    it('deve aceitar endereço Ethereum válido', () => {
      expect(validateWalletAddress('0x1234567890123456789012345678901234567890', 'ethereum')).toBe(true);
    });

    it('deve rejeitar endereço Ethereum inválido', () => {
      expect(validateWalletAddress('0x123', 'ethereum')).toBe(false);
    });

    it('deve aceitar endereço Bitcoin válido', () => {
      expect(validateWalletAddress('1A1z7agoat7SFkd5KSASBeUguMinVNsTn', 'bitcoin')).toBe(true);
    });
  });
});
```

---

## 9. Exemplo Completo de Route Handler (app/api/transactions/create/route.complete.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, getClientIp, getUserAgent } from '@/lib/security/auth';
import { createCorsHeaders, handleCorsPreFlight } from '@/lib/security/cors';
import { simpleRateLimit } from '@/lib/security/rate-limit';
import { createTransaction, logAudit } from '@/lib/db/supabase-client';
import { validateAmount, validateWalletAddress } from '@/lib/validators';
import { successResponse, validationErrorResponse, errorResponse } from '@/lib/api/response';

/**
 * Criar nova transação de depósito
 * POST /api/transactions/create
 */
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    const corsHeaders = createCorsHeaders(origin);
    const clientIp = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Rate limiting
    const rateLimitKey = `create-transaction:${clientIp}`;
    const { allowed, remaining } = simpleRateLimit.check(rateLimitKey);

    if (!allowed) {
      await logAudit({
        action: 'RATE_LIMIT_EXCEEDED',
        details: { endpoint: '/api/transactions/create' },
        ipAddress: clientIp,
        userAgent,
      });

      return errorResponse(
        'Muitas requisições. Tente novamente em alguns minutos.',
        'RATE_LIMIT_EXCEEDED',
        {
          status: 429,
          headers: { ...corsHeaders, 'X-RateLimit-Remaining': '0' },
        }
      );
    }

    // Autenticação
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return errorResponse('Não autorizado', 'UNAUTHORIZED', {
        status: 401,
        headers: corsHeaders,
      });
    }

    const authPayload = await verifyAuth(auth.substring(7));
    if (!authPayload) {
      return errorResponse('Token inválido', 'INVALID_TOKEN', {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Parse body
    const body = await request.json();
    const { amount, method, blockchain, walletAddress } = body;

    // Validações
    const errors: Record<string, string> = {};

    if (!amount || !validateAmount(amount, 1, 100000)) {
      errors.amount = 'Valor deve estar entre R$ 1 e R$ 100.000';
    }

    if (!method || !['pix', 'ted'].includes(method)) {
      errors.method = 'Método deve ser "pix" ou "ted"';
    }

    if (!blockchain || blockchain.trim().length === 0) {
      errors.blockchain = 'Blockchain é obrigatório';
    }

    if (!walletAddress || !validateWalletAddress(walletAddress, blockchain)) {
      errors.walletAddress = `Endereço inválido para ${blockchain}`;
    }

    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Criar transação
    const transaction = await createTransaction({
      userId: authPayload.userId,
      amount,
      method,
      blockchain,
      walletAddress,
    });

    // Registrar auditoria
    await logAudit({
      action: 'DEPOSIT_CREATED',
      userId: authPayload.userId,
      transactionId: transaction.id,
      details: {
        amount,
        method,
        blockchain,
      },
      ipAddress: clientIp,
      userAgent,
    });

    return successResponse(
      {
        transactionId: transaction.id,
        amount,
        method,
        expiresAt: transaction.expires_at,
        timeRemainingSeconds: 2400, // 40 minutos
      },
      'Transação criada com sucesso',
      {
        status: 201,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Remaining': remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Erro ao criar transação:', error);

    return errorResponse(
      'Erro interno ao processar requisição',
      'INTERNAL_ERROR',
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request) || new Response(null, { status: 204 });
}
```

---

## 10. Configuração TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

Todos esses exemplos estão prontos para serem adaptados e implementados no seu projeto P2P!
