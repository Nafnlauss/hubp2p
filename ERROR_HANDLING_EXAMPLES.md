# Next.js 15: Exemplos Práticos de Error Handling

## 1. Sistema de Autenticação com Error Handling

### Arquivo: `lib/auth-errors.ts`

```typescript
import { AppError, ValidationError, AuthenticationError } from './errors'

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('E-mail ou senha incorretos')
  }
}

export class AccountLockedError extends AuthenticationError {
  constructor(unlocksAt: Date) {
    super('Sua conta foi bloqueada por segurança', {
      unlocksAt,
    })
  }
}

export class EmailAlreadyRegisteredError extends AppError {
  constructor(email: string) {
    super(`E-mail ${email} já está registrado`, 409, true, { email })
  }
}

export class InvalidCPFError extends ValidationError {
  constructor(cpf: string) {
    super('CPF inválido', { cpf })
  }
}
```

### Arquivo: `app/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'
import { monitoring } from '@/lib/monitoring'
import {
  InvalidCPFError,
  EmailAlreadyRegisteredError,
} from '@/lib/auth-errors'
import { handleApiError } from '@/lib/error-handler'

// Schema de validação
const RegisterSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  birthDate: z.string().datetime('Data de nascimento inválida'),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido'),
})

/**
 * Validar CPF usando algoritmo padrão
 */
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '')

  if (cleanCPF.length !== 11) return false

  // Verificar dígitos verificadores
  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false

  return true
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const ip = request.ip || 'unknown'

  const transaction = Sentry.startTransaction({
    op: 'api.auth.register',
    name: 'POST /api/auth/register',
  })

  try {
    logger.info('Registration attempt', {
      requestId,
      ip,
    })

    // Parsear e validar body
    const body = await request.json()
    const validatedData = RegisterSchema.parse(body)

    // Validar CPF específicamente
    if (!validateCPF(validatedData.cpf)) {
      throw new InvalidCPFError(validatedData.cpf)
    }

    // Verificar se email já existe
    const existingUser = await checkUserExists(validatedData.email)
    if (existingUser) {
      throw new EmailAlreadyRegisteredError(validatedData.email)
    }

    // Verificar limite de taxa (máximo 5 registros por IP por hora)
    const rateLimit = await monitoring.checkRateLimit(
      `register:${ip}`,
      5,
      3600000
    )

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de registro. Tente novamente mais tarde.' },
        { status: 429 }
      )
    }

    // Iniciar processo de KYC
    logger.info('Iniciando KYC', {
      requestId,
      cpf: validatedData.cpf,
    })

    const kycResult = await performKYC(validatedData)

    // Criar usuário
    const user = await createUser({
      email: validatedData.email,
      password: validatedData.password,
      fullName: validatedData.fullName,
      cpf: validatedData.cpf,
      kycStatus: kycResult.status,
      kycVerificationId: kycResult.verificationId,
    })

    logger.info('User registered successfully', {
      requestId,
      userId: user.id,
      kycStatus: kycResult.status,
    })

    // Enviar email de confirmação
    await sendConfirmationEmail(user.email)

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          kycStatus: user.kycStatus,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // Log de erro com contexto
    if (error instanceof z.ZodError) {
      logger.warn('Validation error during registration', {
        requestId,
        ip,
        errors: error.errors,
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados fornecidos são inválidos',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      )
    }

    // Tratamento de erros específicos
    if (error instanceof InvalidCPFError) {
      logger.warn('Invalid CPF during registration', {
        requestId,
        ip,
      })

      Sentry.captureMessage('Invalid CPF validation', 'warning', {
        tags: { requestId, type: 'cpf_validation' },
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CPF',
            message: 'CPF fornecido é inválido',
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof EmailAlreadyRegisteredError) {
      logger.info('Duplicate email registration attempt', {
        requestId,
        ip,
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_REGISTERED',
            message: 'Este e-mail já está registrado',
          },
        },
        { status: 409 }
      )
    }

    // Erros desconhecidos
    logger.error('Unexpected error during registration',
      error instanceof Error ? error : new Error(String(error)),
      { requestId, ip }
    )

    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/auth/register',
        requestId,
      },
      contexts: {
        registration: { ip },
      },
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao registrar. Nossa equipe foi notificada.',
          requestId,
        },
      },
      { status: 500 }
    )
  } finally {
    transaction.finish()
  }
}

// Funções auxiliares (stub)
async function checkUserExists(email: string): Promise<boolean> {
  // Implementar check no banco de dados
  return false
}

async function performKYC(data: any): Promise<any> {
  // Implementar integração com Proteo
  return { status: 'pending', verificationId: '123' }
}

async function createUser(data: any): Promise<any> {
  // Implementar criação de usuário
  return { id: '123', email: data.email }
}

async function sendConfirmationEmail(email: string): Promise<void> {
  // Implementar envio de email
}
```

---

## 2. API de Depósito com KYC Integration

### Arquivo: `lib/kyc-service.ts`

```typescript
import { ExternalServiceError, AppError } from './errors'
import { logger } from './logger'

export interface KYCData {
  cpf: string
  fullName: string
  birthDate: string
  address: string
  phoneNumber: string
  documentPhoto?: string
  selfiePhoto?: string
}

export interface KYCResult {
  status: 'approved' | 'rejected' | 'pending'
  verificationId: string
  message?: string
  riskScore?: number
}

class KYCService {
  private baseUrl = process.env.PROTEO_API_URL
  private apiKey = process.env.PROTEO_API_KEY

  async verifyIdentity(data: KYCData): Promise<KYCResult> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('KYC service not properly configured')
    }

    try {
      logger.info('Iniciando verificação KYC', {
        cpf: data.cpf.substring(0, 3) + '***', // Mascarar CPF no log
      })

      const payload = {
        cpf: data.cpf,
        fullName: data.fullName,
        birthDate: data.birthDate,
        address: data.address,
        phone: data.phoneNumber,
        document: data.documentPhoto,
        selfie: data.selfiePhoto,
      }

      const response = await fetch(`${this.baseUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        if (response.status === 400) {
          const error = await response.json()
          logger.warn('KYC validation failed', {
            cpf: data.cpf.substring(0, 3) + '***',
            reason: error.message,
          })

          return {
            status: 'rejected',
            verificationId: '',
            message: error.message,
          }
        }

        throw new ExternalServiceError(
          'Proteo KYC',
          `HTTP ${response.status}`,
          undefined,
          { endpoint: '/verify' }
        )
      }

      const result = await response.json()

      logger.info('KYC verification completed', {
        cpf: data.cpf.substring(0, 3) + '***',
        status: result.status,
        verificationId: result.id,
      })

      return {
        status: result.status,
        verificationId: result.id,
        riskScore: result.riskScore,
      }
    } catch (error) {
      if (error instanceof ExternalServiceError) {
        throw error
      }

      logger.error('Error during KYC verification',
        error instanceof Error ? error : new Error(String(error)),
        { cpf: data.cpf.substring(0, 3) + '***' }
      )

      throw new ExternalServiceError(
        'Proteo KYC',
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined
      )
    }
  }

  async checkStatus(verificationId: string): Promise<KYCResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/verify/${verificationId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`KYC check failed with status ${response.status}`)
      }

      const result = await response.json()

      return {
        status: result.status,
        verificationId: result.id,
        riskScore: result.riskScore,
      }
    } catch (error) {
      throw new ExternalServiceError(
        'Proteo KYC',
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error : undefined
      )
    }
  }
}

export const kycService = new KYCService()
```

### Arquivo: `app/api/deposits/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/logger'
import { monitoring } from '@/lib/monitoring'
import { kycService } from '@/lib/kyc-service'
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ExternalServiceError,
} from '@/lib/errors'
import { handleApiError } from '@/lib/error-handler'

const DepositSchema = z.object({
  amount: z.number().min(10, 'Valor mínimo é R$ 10').max(50000, 'Valor máximo é R$ 50.000'),
  method: z.enum(['pix', 'ted']),
  network: z.enum(['ethereum', 'polygon', 'solana']),
  walletAddress: z.string().min(10, 'Endereço de carteira inválido'),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const userId = request.headers.get('x-user-id')
  const ip = request.ip || 'unknown'

  if (!userId) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  const transaction = Sentry.startTransaction({
    op: 'api.deposits.create',
    name: 'POST /api/deposits',
  })

  try {
    logger.info('Deposit request received', {
      requestId,
      userId,
      ip,
    })

    // Parsear e validar body
    const body = await request.json()
    const validatedData = DepositSchema.parse(body)

    // Buscar usuário e verificar KYC status
    const user = await fetchUser(userId)

    if (!user) {
      throw new NotFoundError('Usuário')
    }

    if (user.kycStatus !== 'approved') {
      throw new ValidationError('KYC não foi aprovado', {
        currentStatus: user.kycStatus,
      })
    }

    // Verificar limite de transações ativas
    const activeDeposits = await countActiveDeposits(userId)
    if (activeDeposits > 0) {
      throw new ValidationError(
        'Você já possui um depósito pendente',
        { activeDeposits }
      )
    }

    // Validar endereço de carteira
    if (!isValidWalletAddress(validatedData.walletAddress, validatedData.network)) {
      throw new ValidationError('Endereço de carteira inválido', {
        network: validatedData.network,
      })
    }

    // Criar transação
    const deposit = await createDeposit({
      userId,
      amount: validatedData.amount,
      method: validatedData.method,
      network: validatedData.network,
      walletAddress: validatedData.walletAddress,
      ip,
      requestId,
    })

    logger.info('Deposit created successfully', {
      requestId,
      userId,
      depositId: deposit.id,
      amount: deposit.amount,
      method: deposit.method,
    })

    // Notificar operadores
    try {
      await monitoring.sendPushoverAlert(
        process.env.PUSHOVER_OPERATOR_KEY!,
        'Novo Depósito',
        `Novo depósito de R$ ${deposit.amount.toFixed(2)} do usuário ${user.fullName}`,
        {
          priority: 1,
          ttl: 3600,
          url: `/admin/deposits/${deposit.id}`,
        }
      )
    } catch (error) {
      logger.warn('Erro ao enviar Pushover alert', {
        requestId,
        depositId: deposit.id,
      })
      // Não falhar o endpoint se Pushover falhar
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          depositId: deposit.id,
          amount: deposit.amount,
          method: deposit.method,
          bankData: getDepositInstructions(deposit),
          expiresAt: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // Tratamento de erros de validação
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in deposit', {
        requestId,
        userId,
        errors: error.errors,
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados fornecidos são inválidos',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      )
    }

    // Erros de aplicação customizados
    if (error instanceof ValidationError) {
      logger.warn('Business validation error', {
        requestId,
        userId,
        message: error.message,
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.context,
          },
        },
        { status: 400 }
      )
    }

    // Erros de serviço externo
    if (error instanceof ExternalServiceError) {
      logger.error('External service error',
        error.originalError || new Error(error.message),
        {
          requestId,
          userId,
          service: error.service,
        }
      )

      Sentry.captureException(error, {
        tags: {
          service: error.service,
          type: 'external_service',
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_ERROR',
            message: `Erro ao conectar com serviço. Tente novamente em alguns minutos.`,
          },
        },
        { status: 502 }
      )
    }

    // Erros não tratados
    logger.error('Unexpected error in deposit creation',
      error instanceof Error ? error : new Error(String(error)),
      { requestId, userId }
    )

    Sentry.captureException(error, {
      tags: {
        endpoint: '/api/deposits',
        userId,
      },
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro ao criar depósito. Nossa equipe foi notificada.',
          requestId,
        },
      },
      { status: 500 }
    )
  } finally {
    transaction.finish()
  }
}

// Funções auxiliares
function isValidWalletAddress(address: string, network: string): boolean {
  // Validar formato de endereço por rede
  const addressPatterns: Record<string, RegExp> = {
    ethereum: /^0x[a-fA-F0-9]{40}$/,
    polygon: /^0x[a-fA-F0-9]{40}$/,
    solana: /^[1-9A-HJ-NP-Z]{32,44}$/,
  }

  const pattern = addressPatterns[network]
  if (!pattern) return false

  return pattern.test(address)
}

function getDepositInstructions(deposit: any) {
  if (deposit.method === 'pix') {
    return {
      pixKey: 'xxx@example.com',
      pixQrCode: 'data:image/png;base64,...',
      hint: 'Escaneie o código QR ou copie a chave Pix',
    }
  } else if (deposit.method === 'ted') {
    return {
      bankCode: '001',
      accountNumber: '1234567',
      accountDigit: '8',
      transferCode: 'TED',
      hint: 'Use os dados acima para fazer a transferência TED',
    }
  }
}

async function fetchUser(userId: string): Promise<any> {
  // Implementar fetch no banco
  return null
}

async function countActiveDeposits(userId: string): Promise<number> {
  // Implementar contagem de depósitos ativos
  return 0
}

async function createDeposit(data: any): Promise<any> {
  // Implementar criação de depósito
  return { id: '123', ...data }
}
```

---

## 3. Client Component com Error Handling

### Arquivo: `components/deposits/deposit-form.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserFriendlyMessage } from '@/lib/user-messages'

interface DepositFormProps {
  userId: string
}

export function DepositForm({ userId }: DepositFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const requestId = crypto.randomUUID()

    try {
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          amount: parseFloat(formData.get('amount') as string),
          method: formData.get('method'),
          network: formData.get('network'),
          walletAddress: formData.get('walletAddress'),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Tratamento de erros específicos
        if (data.error?.code === 'VALIDATION_ERROR') {
          // Erros de validação - mostrar campos específicos
          const messages = data.error.details
            ?.map((d: any) => `${d.field}: ${d.message}`)
            .join(', ')

          setError(messages || 'Dados inválidos fornecidos')
        } else {
          // Erros gerais - usar mensagem amigável
          const friendlyMessage = getUserFriendlyMessage(
            data.error?.code || 'INTERNAL_ERROR'
          )
          setError(friendlyMessage)
        }
        return
      }

      setSuccess(true)

      // Redirecionar para página de confirmação
      setTimeout(() => {
        router.push(`/deposits/${data.data.depositId}/confirm`)
      }, 1500)
    } catch (err) {
      console.error('Erro ao criar depósito:', err)
      setError(
        'Erro de conexão. Verifique sua internet e tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-700 font-medium">
          Depósito criado com sucesso! Redirecionando...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-2">
          Valor (R$)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="10"
          max="50000"
          required
          disabled={loading}
          className="w-full px-4 py-2 border rounded disabled:opacity-50"
          placeholder="Ex: 100.00"
        />
        <p className="text-sm text-gray-500 mt-1">
          Mínimo: R$ 10 | Máximo: R$ 50.000
        </p>
      </div>

      <div>
        <label htmlFor="method" className="block text-sm font-medium mb-2">
          Método de Pagamento
        </label>
        <select
          id="method"
          name="method"
          required
          disabled={loading}
          className="w-full px-4 py-2 border rounded disabled:opacity-50"
        >
          <option value="">Selecione um método</option>
          <option value="pix">Pix (Instantâneo)</option>
          <option value="ted">TED (Mesmo dia)</option>
        </select>
      </div>

      <div>
        <label htmlFor="network" className="block text-sm font-medium mb-2">
          Rede (Blockchain)
        </label>
        <select
          id="network"
          name="network"
          required
          disabled={loading}
          className="w-full px-4 py-2 border rounded disabled:opacity-50"
        >
          <option value="">Selecione uma rede</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="solana">Solana</option>
        </select>
      </div>

      <div>
        <label htmlFor="walletAddress" className="block text-sm font-medium mb-2">
          Endereço da Carteira
        </label>
        <input
          id="walletAddress"
          name="walletAddress"
          type="text"
          required
          disabled={loading}
          className="w-full px-4 py-2 border rounded disabled:opacity-50 font-mono text-sm"
          placeholder="Ex: 0x742d35Cc6634C0532925a3b844Bc9e7595f3"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Processando...' : 'Criar Depósito'}
      </button>
    </form>
  )
}
```

---

## 4. Painel de Administrador com Error Handling

### Arquivo: `app/admin/deposits/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { monitoring } from '@/lib/monitoring'

interface Deposit {
  id: string
  userId: string
  userName: string
  amount: number
  method: 'pix' | 'ted'
  status: 'pending' | 'received' | 'converting' | 'sent'
  walletAddress: string
  network: string
  createdAt: string
  expiresAt: string
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<any>(null)

  useEffect(() => {
    loadDeposits()
    checkHealth()

    // Recarregar a cada 30 segundos
    const interval = setInterval(loadDeposits, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDeposits = async () => {
    const requestId = crypto.randomUUID()

    try {
      logger.info('Loading deposits for admin panel', { requestId })

      const response = await fetch('/api/admin/deposits', {
        headers: { 'X-Request-Id': requestId },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setDeposits(data.data || [])
      setError(null)

      logger.info('Deposits loaded successfully', {
        requestId,
        count: data.data?.length || 0,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Error loading deposits',
        err instanceof Error ? err : new Error(message),
        { requestId }
      )
      setError('Erro ao carregar depósitos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const checkHealth = async () => {
    try {
      const healthStatus = await monitoring.healthCheck()
      setHealth(healthStatus)

      if (healthStatus.status !== 'healthy') {
        logger.warn('System health degraded', healthStatus)
      }
    } catch (error) {
      logger.error('Error checking health',
        error instanceof Error ? error : new Error('Unknown error')
      )
    }
  }

  const handleMarkAsReceived = async (depositId: string) => {
    const requestId = crypto.randomUUID()

    try {
      const response = await fetch(`/api/admin/deposits/${depositId}/received`, {
        method: 'POST',
        headers: { 'X-Request-Id': requestId },
      })

      if (!response.ok) {
        throw new Error('Failed to update deposit status')
      }

      // Recarregar depósitos
      await loadDeposits()

      logger.info('Deposit marked as received', {
        requestId,
        depositId,
      })
    } catch (error) {
      logger.error('Error updating deposit status',
        error instanceof Error ? error : new Error('Unknown error'),
        { requestId, depositId }
      )
      alert('Erro ao atualizar status do depósito')
    }
  }

  return (
    <div className="space-y-6">
      {/* Health Status */}
      {health && health.status !== 'healthy' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-700 font-medium">
            ⚠️ Sistema com degradação: {
              Object.entries(health.checks)
                .filter(([_, v]) => !v)
                .map(([k]) => k)
                .join(', ')
            }
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadDeposits}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Carregando depósitos...</p>
        </div>
      ) : (
        <>
          {/* Deposits Table */}
          <table className="w-full border-collapse border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Usuário</th>
                <th className="border p-3 text-left">Valor</th>
                <th className="border p-3 text-left">Método</th>
                <th className="border p-3 text-left">Status</th>
                <th className="border p-3 text-left">Ação</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map(deposit => (
                <tr key={deposit.id} className="border">
                  <td className="border p-3 font-mono text-sm">{deposit.id}</td>
                  <td className="border p-3">{deposit.userName}</td>
                  <td className="border p-3">R$ {deposit.amount.toFixed(2)}</td>
                  <td className="border p-3">
                    {deposit.method === 'pix' ? 'Pix' : 'TED'}
                  </td>
                  <td className="border p-3">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      deposit.status === 'received' ? 'bg-blue-100 text-blue-800' :
                      deposit.status === 'sent' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {deposit.status}
                    </span>
                  </td>
                  <td className="border p-3">
                    {deposit.status === 'pending' && (
                      <button
                        onClick={() => handleMarkAsReceived(deposit.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Pagamento Recebido
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {deposits.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              Nenhum depósito pendente
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

---

Criado em: Novembro 16, 2025
Versão: Next.js 15
