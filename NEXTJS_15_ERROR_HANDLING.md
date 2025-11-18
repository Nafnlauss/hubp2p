# Next.js 15: Guia Completo de Error Handling e Logging

## Índice
1. [Error Boundaries](#error-boundaries)
2. [Global Error Handling](#global-error-handling)
3. [Error Tracking com Sentry](#error-tracking-com-sentry)
4. [Padrões de Logging](#padrões-de-logging)
5. [Mensagens de Erro Amigáveis](#mensagens-de-erro-amigáveis)
6. [Monitoring e Alertas](#monitoring-e-alertas)
7. [Arquitetura Recomendada](#arquitetura-recomendada)
8. [Checklist de Implementação](#checklist-de-implementação)

---

## Error Boundaries

### Error Boundaries no App Router (Next.js 15)

Error boundaries são componentes que captura erros de seus filhos, exibem uma interface de fallback e permitem que o usuário tente novamente.

#### Arquivo: `app/error.tsx` - Error Boundary Raiz

```typescript
'use client'

import { useEffect } from 'react'
import { Metadata } from 'next'

// Esta interface é específica do Next.js 15+
interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para serviço externo (Sentry, etc.)
    console.error('Global error caught:', error)

    // Enviar para serviço de monitoramento
    if (typeof window !== 'undefined') {
      // Notificar serviço de erro
      captureException(error)
    }
  }, [error])

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">
              Algo deu errado!
            </h1>
            <p className="text-gray-700 mb-4">
              Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada.
            </p>
            {error.message && (
              <details className="mb-4 text-sm text-gray-600">
                <summary>Detalhes técnicos</summary>
                <pre className="text-left mt-2 p-2 bg-gray-100 rounded">
                  {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </pre>
              </details>
            )}
            <div className="space-x-4">
              <button
                onClick={() => reset()}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Tentar Novamente
              </button>
              <a
                href="/"
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Voltar para Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

// Função auxiliar para capturar exceções
function captureException(error: Error) {
  // Será implementada com Sentry ou similar
  // import * as Sentry from "@sentry/nextjs"
  // Sentry.captureException(error)
}
```

#### Arquivo: `app/layout.tsx` - Error Boundary Aninhado

```typescript
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: 'P2P Crypto',
  description: 'Plataforma P2P de compra de criptomoedas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  )
}
```

#### Arquivo: `app/dashboard/error.tsx` - Error Boundary Segmentado

```typescript
'use client'

import { useEffect } from 'react'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Log específico para dashboard
    console.error('Dashboard error:', error)

    // Enviar para Sentry com contexto específico
    // Sentry.captureException(error, {
    //   tags: {
    //     section: 'dashboard',
    //   },
    // })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Erro no Painel
        </h2>
        <p className="text-gray-600 mb-4">
          Ocorreu um erro ao carregar o painel. Tente novamente.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Recarregar
        </button>
      </div>
    </div>
  )
}
```

#### Arquivo: `app/not-found.tsx` - Página 404

```typescript
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">
          Página não encontrada
        </p>
        <p className="text-gray-500 mb-8">
          Desculpe, a página que você está procurando não existe.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  )
}
```

---

## Global Error Handling

### Arquivo: `lib/errors.ts` - Classe Base de Erros

```typescript
/**
 * Classe base para erros customizados da aplicação
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * Erros de validação (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, true, context)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Erros de autenticação (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado', context?: Record<string, any>) {
    super(message, 401, true, context)
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

/**
 * Erros de autorização (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Não autorizado', context?: Record<string, any>) {
    super(message, 403, true, context)
    Object.setPrototypeOf(this, AuthorizationError.prototype)
  }
}

/**
 * Erros de recurso não encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} não encontrado`, 404, true, context)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * Erros de conflito (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, true, context)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

/**
 * Erros de rate limit (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Muitas requisições', context?: Record<string, any>) {
    super(message, 429, true, context)
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

/**
 * Erros de servidor interno (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Erro interno do servidor', context?: Record<string, any>) {
    super(message, 500, true, context)
    Object.setPrototypeOf(this, InternalServerError.prototype)
  }
}

/**
 * Erros de serviço externo
 */
export class ExternalServiceError extends AppError {
  constructor(
    public service: string,
    message: string,
    public originalError?: Error,
    context?: Record<string, any>
  ) {
    super(`Erro ao conectar com ${service}: ${message}`, 502, true, context)
    Object.setPrototypeOf(this, ExternalServiceError.prototype)
  }
}

/**
 * Erros de timeout
 */
export class TimeoutError extends AppError {
  constructor(message: string = 'Requisição expirou', context?: Record<string, any>) {
    super(message, 408, true, context)
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

/**
 * Tipo guard para verificar se erro é AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Função para extrair mensagem de erro
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Um erro desconhecido ocorreu'
}

/**
 * Função para extrair status code
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode
  }
  return 500
}
```

### Arquivo: `lib/error-handler.ts` - Handler Global

```typescript
import { AppError, isAppError } from './errors'
import { logger } from './logger'

/**
 * Interface para resposta de erro
 */
export interface ErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    statusCode: number
    details?: Record<string, any>
    requestId?: string
    timestamp: string
  }
}

/**
 * Interface para resposta de sucesso
 */
export interface SuccessResponse<T> {
  success: true
  data: T
  timestamp: string
}

/**
 * Tipo union para resposta
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

/**
 * Handler global de erros para API Routes
 */
export async function handleApiError(
  error: unknown,
  context: {
    requestId?: string
    userId?: string
    endpoint?: string
    method?: string
  } = {}
): Promise<ErrorResponse> {
  const requestId = context.requestId || crypto.randomUUID()
  const timestamp = new Date().toISOString()

  // Log do erro
  if (isAppError(error)) {
    logger.warn('Application Error', {
      requestId,
      error: error.message,
      statusCode: error.statusCode,
      context: error.context,
      ...context,
    })
  } else {
    logger.error('Unhandled Error', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    })
  }

  // Determinar mensagem e status
  if (isAppError(error)) {
    return {
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode,
        details: error.context,
        requestId,
        timestamp,
      },
    }
  }

  // Erros não operacionais (não esperados)
  return {
    success: false,
    error: {
      message: 'Erro interno do servidor. Nossa equipe foi notificada.',
      statusCode: 500,
      requestId,
      timestamp,
    },
  }
}

/**
 * Wrapper para handlers de API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      const errorResponse = await handleApiError(error)
      throw errorResponse
    }
  }
}

/**
 * Wrapper para operações assíncronas com retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    delayMs?: number
    backoffMultiplier?: number
    onRetry?: (attempt: number, error: Error) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options

  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)
        onRetry?.(attempt, lastError)
        logger.debug(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`, {
          error: lastError.message,
        })
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}
```

---

## Error Tracking com Sentry

### Setup Básico do Sentry

#### Arquivo: `instrumentation.ts` (configuração)

```typescript
// instrumentation.ts - na raiz do projeto

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeServerSentrySDK } = await import('./lib/sentry-server')
    initializeServerSentrySDK()
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initializeEdgeSentrySDK } = await import('./lib/sentry-edge')
    initializeEdgeSentrySDK()
  }
}
```

#### Arquivo: `lib/sentry-server.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

export function initializeServerSentrySDK() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Replays
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Setup
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],

    // Filtros
    beforeSend(event, hint) {
      // Ignorar erros de desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        return null
      }

      // Ignorar certos tipos de erro
      if (event.exception) {
        const error = hint.originalException
        if (error instanceof Error) {
          // Ignorar erros de network normais
          if (error.message.includes('Network')) {
            return null
          }
        }
      }

      return event
    },
  })
}
```

#### Arquivo: `lib/sentry-client.tsx`

```typescript
'use client'

import * as Sentry from '@sentry/nextjs'

export function SentryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={<ErrorFallback />}
      showDialog
      dialogOptions={{
        title: 'Erro encontrado',
        subtitle: 'Ocorreu um erro inesperado',
        subtitle2: 'Nossas equipes foram notificadas. Obrigado!',
        labelComments: 'O que aconteceu?',
        labelClose: 'Fechar',
        labelSubmit: 'Enviar Relatório',
        onSubmit: () => {
          // Lógica adicional
        },
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}

function ErrorFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Algo deu errado</h2>
        <p className="text-gray-600 mb-4">
          Estamos trabalhando para resolver isso. Tente recarregar a página.
        </p>
      </div>
    </div>
  )
}
```

#### Arquivo: `app/api/route-handler.ts` - Com Sentry em Route Handlers

```typescript
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AppError, ValidationError } from '@/lib/errors'
import { handleApiError } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  const transaction = Sentry.startTransaction({
    op: 'http.request',
    name: `GET ${request.nextUrl.pathname}`,
  })

  try {
    // Sua lógica aqui
    const data = await fetchData()

    return NextResponse.json({ success: true, data })
  } catch (error) {
    // Capturar com contexto
    Sentry.captureException(error, {
      tags: {
        endpoint: request.nextUrl.pathname,
        method: request.method,
      },
      contexts: {
        request: {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers),
        },
      },
    })

    const errorResponse = await handleApiError(error)
    const statusCode = errorResponse.error.statusCode

    return NextResponse.json(errorResponse, { status: statusCode })
  } finally {
    transaction.finish()
  }
}
```

### Instalação do Sentry

```bash
npm install @sentry/nextjs @sentry/tracing
# ou
yarn add @sentry/nextjs @sentry/tracing
```

### Arquivo: `.env.local`

```
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

---

## Padrões de Logging

### Arquivo: `lib/logger.ts` - Sistema de Logging

```typescript
/**
 * Níveis de log
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * Interface de entrada de log
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: {
    message: string
    stack?: string
    code?: string
  }
  requestId?: string
  userId?: string
  duration?: number
}

/**
 * Logger principal
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log formatado para console
   */
  private formatLog(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString()
    return `[${timestamp}] ${entry.level}: ${entry.message}`
  }

  /**
   * Enviar log para serviço externo
   */
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Implementar envio para CloudWatch, DataDog, etc.
    if (process.env.LOG_ENDPOINT) {
      try {
        await fetch(process.env.LOG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
      } catch (error) {
        // Não lançar erro se falhar logging externo
        console.error('Failed to send log to external service', error)
      }
    }
  }

  /**
   * Executar log
   */
  private async log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
        },
      }),
      requestId: context?.requestId,
      userId: context?.userId,
      duration: context?.duration,
    }

    // Log para console em desenvolvimento
    if (this.isDevelopment) {
      console[level.toLowerCase() as any](
        this.formatLog(entry),
        context || ''
      )
    }

    // Enviar para serviço externo
    await this.sendToExternalService(entry)
  }

  /**
   * Debug - informações de desenvolvimento
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context)
    }
  }

  /**
   * Info - informações gerais
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Warn - avisos
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Error - erros
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * Fatal - erros críticos
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error)
  }

  /**
   * Medir tempo de execução
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now()
    try {
      return await fn()
    } finally {
      const duration = Date.now() - startTime
      this.info(`${label} completed in ${duration}ms`, {
        ...context,
        duration,
      })
    }
  }
}

// Exportar singleton
export const logger = new Logger()
```

### Uso do Logger em Componentes

#### Arquivo: `app/dashboard/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const requestId = crypto.randomUUID()

      try {
        logger.info('Iniciando carregamento de dados do dashboard', {
          requestId,
        })

        const response = await fetch('/api/dashboard', {
          headers: { 'X-Request-Id': requestId },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        setData(result)

        logger.info('Dados do dashboard carregados com sucesso', {
          requestId,
          itemCount: result.items?.length,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        logger.error('Erro ao carregar dados do dashboard',
          err instanceof Error ? err : new Error(message),
          { requestId }
        )
        setError(message)
      }
    }

    loadData()
  }, [])

  if (error) {
    return <div>Erro: {error}</div>
  }

  return <div>{/* Renderizar dados */}</div>
}
```

#### Arquivo: `app/api/transactions/route.ts` - Com Logging

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { ValidationError } from '@/lib/errors'
import { handleApiError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const userId = request.headers.get('x-user-id')

  try {
    logger.info('Creating transaction', {
      requestId,
      userId,
      method: 'POST',
    })

    const body = await request.json()

    // Validação
    if (!body.amount || body.amount <= 0) {
      throw new ValidationError('Amount must be greater than 0', {
        received: body.amount,
      })
    }

    // Operação de longa duração
    const result = await logger.measure(
      'Processing transaction',
      async () => {
        // Sua lógica aqui
        return { id: '123', status: 'pending' }
      },
      { requestId, userId }
    )

    logger.info('Transaction created successfully', {
      requestId,
      userId,
      transactionId: result.id,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    logger.error('Error creating transaction',
      error instanceof Error ? error : new Error(String(error)),
      { requestId, userId }
    )

    const errorResponse = await handleApiError(error, { requestId, userId })
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    })
  }
}
```

---

## Mensagens de Erro Amigáveis

### Arquivo: `lib/user-messages.ts` - Mensagens de Erro para Usuário

```typescript
/**
 * Mapeamento de erros para mensagens amigáveis
 */
export const userFriendlyMessages: Record<string, string> = {
  // Validação
  'INVALID_EMAIL': 'O e-mail fornecido é inválido',
  'INVALID_CPF': 'O CPF fornecido é inválido',
  'PASSWORD_TOO_SHORT': 'A senha deve ter pelo menos 8 caracteres',
  'PASSWORDS_DO_NOT_MATCH': 'As senhas não coincidem',

  // Autenticação
  'INVALID_CREDENTIALS': 'E-mail ou senha incorretos',
  'ACCOUNT_LOCKED': 'Sua conta foi bloqueada por segurança',
  'SESSION_EXPIRED': 'Sua sessão expirou. Faça login novamente',

  // Autorização
  'INSUFFICIENT_PERMISSIONS': 'Você não tem permissão para acessar isto',
  'ACCOUNT_NOT_VERIFIED': 'Sua conta não foi verificada ainda',

  // Recursos
  'USER_NOT_FOUND': 'Usuário não encontrado',
  'TRANSACTION_NOT_FOUND': 'Transação não encontrada',
  'INSUFFICIENT_BALANCE': 'Saldo insuficiente',

  // Operações
  'DEPOSIT_ALREADY_EXISTS': 'Já existe um depósito pendente',
  'INVALID_WALLET_ADDRESS': 'Endereço de carteira inválido',
  'NETWORK_ERROR': 'Erro de conexão. Por favor, verifique sua internet',
  'TIMEOUT': 'A operação demorou muito tempo. Tente novamente',

  // Externo
  'KYC_PENDING': 'Sua verificação de identidade está pendente',
  'KYC_FAILED': 'Sua verificação de identidade foi rejeitada',
  'KYC_SERVICE_ERROR': 'Erro ao verificar identidade. Tente novamente mais tarde',

  // Servidor
  'INTERNAL_ERROR': 'Ocorreu um erro no servidor. Nossa equipe foi notificada',
  'SERVICE_UNAVAILABLE': 'Serviço indisponível. Tente novamente em alguns minutos',
}

/**
 * Obter mensagem amigável para o usuário
 */
export function getUserFriendlyMessage(
  errorCode: string,
  fallback: string = 'Ocorreu um erro. Tente novamente'
): string {
  return userFriendlyMessages[errorCode] || fallback
}

/**
 * Construir objeto de erro com mensagem amigável
 */
export function buildUserErrorResponse(
  errorCode: string,
  details?: Record<string, any>
) {
  return {
    code: errorCode,
    message: getUserFriendlyMessage(errorCode),
    details,
    timestamp: new Date().toISOString(),
  }
}
```

### Uso em Client Component

```typescript
'use client'

import { useState } from 'react'
import { getUserFriendlyMessage } from '@/lib/user-messages'

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          cpf: formData.get('cpf'),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Mostrar mensagem amigável
        const friendlyMessage = getUserFriendlyMessage(
          data.error?.code || 'INTERNAL_ERROR'
        )
        setError(friendlyMessage)
        return
      }

      onSuccess?.()
    } catch (err) {
      setError(
        'Erro de conexão. Verifique sua internet e tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Form fields */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Registrando...' : 'Registrar'}
      </button>
    </form>
  )
}
```

---

## Monitoring e Alertas

### Arquivo: `lib/monitoring.ts` - Sistema de Monitoramento

```typescript
import { logger } from './logger'

/**
 * Tipos de alerta
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Interface de alerta
 */
export interface Alert {
  id: string
  title: string
  message: string
  severity: AlertSeverity
  timestamp: string
  context?: Record<string, any>
  resolved?: boolean
}

/**
 * Sistema de monitoramento
 */
class MonitoringService {
  /**
   * Enviar alerta ao Pushover (para operadores)
   */
  async sendPushoverAlert(
    userKey: string,
    title: string,
    message: string,
    options?: {
      priority?: number
      ttl?: number
      sound?: string
      url?: string
    }
  ): Promise<void> {
    const appToken = process.env.PUSHOVER_APP_TOKEN

    if (!appToken) {
      logger.warn('PUSHOVER_APP_TOKEN não configurado')
      return
    }

    try {
      const formData = new FormData()
      formData.append('token', appToken)
      formData.append('user', userKey)
      formData.append('title', title)
      formData.append('message', message)

      if (options?.priority) {
        formData.append('priority', String(options.priority))
      }
      if (options?.ttl) {
        formData.append('ttl', String(options.ttl))
      }
      if (options?.sound) {
        formData.append('sound', options.sound)
      }
      if (options?.url) {
        formData.append('url', options.url)
      }

      const response = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Pushover error: ${response.statusText}`)
      }

      logger.info('Alerta enviado via Pushover', {
        userKey,
        title,
      })
    } catch (error) {
      logger.error(
        'Erro ao enviar alerta Pushover',
        error instanceof Error ? error : new Error(String(error)),
        { userKey, title }
      )
    }
  }

  /**
   * Monitorar limites de taxa (rate limiting)
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    // Implementar com Redis/Upstash
    // Esta é uma implementação simplificada

    const key = `ratelimit:${identifier}`
    const now = Date.now()

    // Aqui você integraria com Redis
    // const count = await redis.get(key)

    return {
      allowed: true,
      remaining: limit,
      resetAt: new Date(now + windowMs),
    }
  }

  /**
   * Alertar sobre atividades suspeitas
   */
  async alertSuspiciousActivity(
    userId: string,
    activity: string,
    details: Record<string, any>
  ): Promise<void> {
    logger.warn('Atividade suspeita detectada', {
      userId,
      activity,
      ...details,
    })

    // Aqui você poderia:
    // 1. Enviar alerta para operadores via Pushover
    // 2. Bloquear conta temporariamente
    // 3. Exigir verificação adicional
  }

  /**
   * Monitorar saúde da aplicação
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, boolean>
    timestamp: string
  }> {
    const checks: Record<string, boolean> = {
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      externalServices: await this.checkExternalServices(),
    }

    const allHealthy = Object.values(checks).every(check => check === true)
    const status = allHealthy ? 'healthy' : 'degraded'

    logger.info('Health check completed', {
      status,
      checks,
    })

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    }
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      // Implementar verificação de banco de dados
      return true
    } catch {
      return false
    }
  }

  private async checkCache(): Promise<boolean> {
    try {
      // Implementar verificação de cache
      return true
    } catch {
      return false
    }
  }

  private async checkExternalServices(): Promise<boolean> {
    try {
      // Implementar verificação de serviços externos (Proteo, etc.)
      return true
    } catch {
      return false
    }
  }
}

export const monitoring = new MonitoringService()
```

### Usar Monitoramento em API Routes

```typescript
// app/api/deposits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { monitoring } from '@/lib/monitoring'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')!
  const ip = request.ip || 'unknown'

  try {
    // Verificar rate limit
    const rateLimit = await monitoring.checkRateLimit(
      `deposit:${userId}`,
      10, // 10 depósitos
      3600000 // por hora
    )

    if (!rateLimit.allowed) {
      logger.warn('Rate limit excedido', {
        userId,
        ip,
        resetAt: rateLimit.resetAt,
      })

      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    // Sua lógica aqui...

    // Notificar operadores de depósito recebido
    await monitoring.sendPushoverAlert(
      process.env.PUSHOVER_OPERATOR_KEY!,
      'Novo Depósito',
      `Novo depósito de R$ 100 de ${userId}`,
      {
        priority: 1,
        ttl: 3600,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    // Verificar atividades suspeitas
    await monitoring.alertSuspiciousActivity(userId, 'deposit_error', {
      ip,
      error: error instanceof Error ? error.message : 'unknown',
    })

    return NextResponse.json(
      { error: 'Erro ao processar depósito' },
      { status: 500 }
    )
  }
}
```

---

## Arquitetura Recomendada

### Estrutura de Diretórios com Error Handling

```
projeto/
├── app/
│   ├── (auth)/
│   │   ├── register/
│   │   │   ├── page.tsx
│   │   │   └── error.tsx
│   │   └── login/
│   │       ├── page.tsx
│   │       └── error.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   └── deposits/
│   │       ├── page.tsx
│   │       └── error.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── register/
│   │   │       └── route.ts
│   │   ├── deposits/
│   │   │   └── route.ts
│   │   ├── health/
│   │   │   └── route.ts
│   │   └── errors/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── error.tsx           # Error boundary raiz
│   └── not-found.tsx       # Página 404
│
├── lib/
│   ├── errors.ts           # Definições de erro
│   ├── error-handler.ts    # Handler global
│   ├── logger.ts           # Sistema de logging
│   ├── user-messages.ts    # Mensagens para usuário
│   ├── monitoring.ts       # Monitoramento
│   ├── sentry-server.ts    # Sentry (servidor)
│   ├── sentry-client.tsx   # Sentry (cliente)
│   └── api.ts              # Funções de API com tratamento de erro
│
├── components/
│   └── error-boundary.tsx
│
├── instrumentation.ts      # Inicialização de Sentry
├── middleware.ts
├── next.config.js
└── tsconfig.json
```

---

## Checklist de Implementação

### Fase 1: Setup Básico

- [ ] Criar classes de erro customizadas (`lib/errors.ts`)
- [ ] Implementar error handler global (`lib/error-handler.ts`)
- [ ] Criar error.tsx na raiz do app
- [ ] Criar not-found.tsx
- [ ] Configurar TypeScript strict mode

### Fase 2: Logging

- [ ] Implementar logger (`lib/logger.ts`)
- [ ] Configurar logging externo (CloudWatch, DataDog, etc.)
- [ ] Adicionar logging em route handlers
- [ ] Adicionar logging em componentes críticos
- [ ] Implementar request IDs

### Fase 3: Sentry Integration

- [ ] Criar conta no Sentry
- [ ] Configurar SDK Sentry (`lib/sentry-server.ts`, `lib/sentry-client.tsx`)
- [ ] Implementar instrumentation.ts
- [ ] Adicionar beforeSend hooks para filtros
- [ ] Testar error tracking

### Fase 4: User Experience

- [ ] Mapear erros para mensagens amigáveis (`lib/user-messages.ts`)
- [ ] Implementar error boundaries segmentadas
- [ ] Adicionar retry logic
- [ ] Criar páginas de erro customizadas
- [ ] Implementar loading states

### Fase 5: Monitoramento

- [ ] Configurar Pushover para operadores (`lib/monitoring.ts`)
- [ ] Implementar health checks
- [ ] Configurar alertas de atividade suspeita
- [ ] Implementar rate limiting
- [ ] Adicionar métricas de performance

### Fase 6: Testes

- [ ] Testar error boundaries
- [ ] Testar API error responses
- [ ] Testar logging e Sentry
- [ ] Testar alertas Pushover
- [ ] Testar retry logic

### Fase 7: Deployment

- [ ] Configurar variáveis de ambiente
- [ ] Verificar HTTPS em produção
- [ ] Testar com real Sentry DSN
- [ ] Monitorar erros em produção
- [ ] Criar runbooks para resposta a erros

---

## Environment Variables

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://key@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-token

# Pushover (Notifications)
PUSHOVER_APP_TOKEN=your-app-token
PUSHOVER_OPERATOR_KEY=operator-key

# Logging
LOG_ENDPOINT=https://logs.example.com
LOG_LEVEL=INFO

# Outros
NODE_ENV=production
DEBUG=false
```

---

## Recursos Úteis

### Documentação Oficial
- **Next.js Error Handling**: https://nextjs.org/docs/app/building-your-application/routing/error-handling
- **Sentry Next.js**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Winston Logger**: https://github.com/winstonjs/winston
- **Pino Logger**: https://getpino.io/

### Ferramentas de Monitoramento
- **Sentry**: https://sentry.io/
- **DataDog**: https://www.datadoghq.com/
- **CloudWatch**: https://aws.amazon.com/cloudwatch/
- **New Relic**: https://newrelic.com/
- **Pushover**: https://pushover.net/

### Best Practices
- Sempre usar error boundaries em componentes críticos
- Nunca expor stack traces ao usuário final
- Implementar retry logic para operações falíveis
- Monitorar performance e erros em produção
- Manter logs por 30-90 dias no mínimo
- Testar fluxos de erro regularmente

---

Criado em: Novembro 16, 2025
Versão: Next.js 15
Última atualização: Novembro 2025
