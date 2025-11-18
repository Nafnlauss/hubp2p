# Secrets & Segurança: Guia Avançado para P2P

Práticas avançadas de segurança e gerenciamento de secrets para aplicação P2P com Next.js.

---

## Índice

1. [Segurança em Camadas](#seguranca-camadas)
2. [Proteção de Secrets](#protecao-secrets)
3. [Autenticação e Autorização](#auth)
4. [Criptografia de Dados](#criptografia)
5. [Validação de Webhooks](#webhooks)
6. [Prevenção de Vazamentos](#prevenção-vazamentos)
7. [Monitoramento de Segurança](#monitoramento)
8. [Compliance e Auditoria](#compliance)

---

## Segurança em Camadas {#seguranca-camadas}

### Modelo de Defesa Profunda

```
┌────────────────────────────────────────────────────────────┐
│  Camada 1: Acesso (HTTPS, Rate Limiting, CORS)             │
├────────────────────────────────────────────────────────────┤
│  Camada 2: Autenticação (JWT, Sessions)                    │
├────────────────────────────────────────────────────────────┤
│  Camada 3: Autorização (Roles, Permissões)                 │
├────────────────────────────────────────────────────────────┤
│  Camada 4: Validação (Schema, Sanitização)                 │
├────────────────────────────────────────────────────────────┤
│  Camada 5: Proteção de Dados (Criptografia, Hashing)       │
├────────────────────────────────────────────────────────────┤
│  Camada 6: Monitoramento (Logs, Alertas, Auditoria)        │
└────────────────────────────────────────────────────────────┘
```

### Camada 1: Acesso - CORS e Headers

```typescript
// lib/security/headers.ts
import { NextRequest, NextResponse } from 'next/server'
import { corsEnv } from '@/lib/env'

export function createSecurityHeaders(response: NextResponse) {
  // Prevenção de Clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevenção de MIME Type Sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Content Security Policy (forte)
  response.headers.set(
    'Content-Security-Policy',
    `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.example.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' https: data:;
      font-src 'self' https:;
      connect-src 'self' https://api.example.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ')
  )

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  )

  // HTTPS only
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  return response
}

// middleware.ts
import { createSecurityHeaders } from '@/lib/security/headers'
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  let response = NextResponse.next()
  response = createSecurityHeaders(response)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Camada 2: Autenticação - JWT com Refresh Tokens

```typescript
// lib/auth/jwt.ts
import jwt from 'jsonwebtoken'
import { privateEnv } from '@/lib/env'

interface TokenPayload {
  userId: string
  email: string
  role: 'user' | 'operator' | 'admin'
  iat: number
  exp: number
}

interface TokenPair {
  accessToken: string
  refreshToken: string
}

export class JwtManager {
  /**
   * Gera par de tokens (access + refresh)
   * - Access: 15 minutos (curta vida)
   * - Refresh: 7 dias (longa vida)
   */
  static generateTokenPair(payload: Omit<TokenPayload, 'iat' | 'exp'>): TokenPair {
    const accessToken = jwt.sign(payload, privateEnv.jwtSecret, {
      expiresIn: '15m',
      algorithm: 'HS256',
    })

    const refreshToken = jwt.sign(payload, privateEnv.jwtSecret, {
      expiresIn: '7d',
      algorithm: 'HS256',
    })

    return { accessToken, refreshToken }
  }

  /**
   * Verifica e decodifica token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, privateEnv.jwtSecret, {
        algorithms: ['HS256'],
      })

      return decoded as TokenPayload
    } catch (error) {
      console.error('Token inválido:', error)
      return null
    }
  }

  /**
   * Refreshar access token usando refresh token
   */
  static refreshAccessToken(refreshToken: string): string | null {
    const payload = this.verifyToken(refreshToken)
    if (!payload) return null

    const newAccessToken = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      },
      privateEnv.jwtSecret,
      { expiresIn: '15m' }
    )

    return newAccessToken
  }
}
```

### Camada 3: Autorização - RBAC (Role-Based Access Control)

```typescript
// lib/auth/rbac.ts
type Role = 'user' | 'operator' | 'admin' | 'superadmin'

type Permission =
  | 'read:transactions'
  | 'create:transaction'
  | 'confirm:deposit'
  | 'reject:transaction'
  | 'manage:users'
  | 'manage:operators'
  | 'view:logs'

interface RolePermissions {
  [key in Role]: Permission[]
}

const rolePermissions: RolePermissions = {
  user: [
    'read:transactions',
    'create:transaction',
  ],

  operator: [
    'read:transactions',
    'confirm:deposit',
    'reject:transaction',
    'view:logs',
  ],

  admin: [
    'read:transactions',
    'create:transaction',
    'confirm:deposit',
    'reject:transaction',
    'manage:operators',
    'view:logs',
  ],

  superadmin: [
    // Todas as permissões
    'read:transactions',
    'create:transaction',
    'confirm:deposit',
    'reject:transaction',
    'manage:users',
    'manage:operators',
    'view:logs',
  ],
}

export class AuthorizationManager {
  static hasPermission(role: Role, permission: Permission): boolean {
    return rolePermissions[role]?.includes(permission) ?? false
  }

  static requirePermission(role: Role, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new Error(`Permissão negada: ${permission}`)
    }
  }
}

// Usar em Route Handler
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request)

  AuthorizationManager.requirePermission(user.role, 'confirm:deposit')

  // Processar confirmação de depósito
}
```

---

## Proteção de Secrets {#protecao-secrets}

### 1. Detecção de Vazamentos

```typescript
// lib/security/secret-detector.ts
export class SecretDetector {
  // Padrões de regex para detectar secrets comuns
  private static patterns = {
    apiKey: /api[_-]?key[=:]\s*['"]?([a-zA-Z0-9_]{20,})/gi,
    jwt: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    privateKey: /-----BEGIN (PRIVATE|RSA) KEY-----/g,
    awsSecret: /aws_secret_access_key[=:]\s*['"]?([a-zA-Z0-9_]{40})/gi,
    stripeKey: /(sk_live_|pk_live_)[a-zA-Z0-9]{24,}/g,
    bearerToken: /Bearer\s+([a-zA-Z0-9_-]{20,})/gi,
  }

  static detectSecrets(text: string): string[] {
    const found: string[] = []

    Object.entries(this.patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern)
      if (matches) {
        console.warn(`⚠️  Possível ${type} detectado em logs`)
        found.push(type)
      }
    })

    return found
  }

  /**
   * Remove secrets de strings antes de logar
   */
  static sanitize(text: string): string {
    let sanitized = text

    // Mascarar tokens
    sanitized = sanitized.replace(
      /(Bearer\s+)([a-zA-Z0-9_-]{20,})/g,
      '$1[REDACTED]'
    )

    // Mascarar chaves API
    sanitized = sanitized.replace(
      /api[_-]?key[=:]\s*['"]?([a-zA-Z0-9_]{20,})/gi,
      'api_key=[REDACTED]'
    )

    // Mascarar senhas
    sanitized = sanitized.replace(
      /password[=:]\s*['"]?([^'"\s]+)/gi,
      'password=[REDACTED]'
    )

    return sanitized
  }
}

// Usar em logger
export const logger = {
  info: (message: string, data?: any) => {
    const sanitized = SecretDetector.sanitize(JSON.stringify(data))
    console.log(message, sanitized)
  },

  error: (message: string, error?: Error) => {
    const sanitized = SecretDetector.sanitize(error?.message || '')
    console.error(message, sanitized)
  },
}
```

### 2. Armazenamento Seguro em Banco de Dados

```typescript
// lib/crypto/sensitive-data.ts
import crypto from 'crypto'
import { privateEnv } from '@/lib/env'

export class SensitiveDataEncryption {
  private static algorithm = 'aes-256-gcm'
  private static encoding = 'hex'

  /**
   * Criptografa dados sensíveis com autenticação
   */
  static encrypt(plaintext: string): string {
    // Gerar IV aleatório
    const iv = crypto.randomBytes(16)

    // Derivar chave a partir do JWT_SECRET
    const key = crypto
      .createHash('sha256')
      .update(privateEnv.jwtSecret)
      .digest()

    // Criptografar
    const cipher = crypto.createCipheriv(this.algorithm, key, iv)
    let encrypted = cipher.update(plaintext, 'utf8', this.encoding)
    encrypted += cipher.final(this.encoding)

    // Obter authentication tag
    const authTag = cipher.getAuthTag()

    // Retornar: IV:TAG:CIPHERTEXT (base64 encoded)
    return Buffer.from(
      `${iv.toString(this.encoding)}:${authTag.toString(this.encoding)}:${encrypted}`
    ).toString('base64')
  }

  /**
   * Descriptografa dados criptografados
   */
  static decrypt(ciphertext: string): string {
    try {
      // Decodificar base64
      const decoded = Buffer.from(ciphertext, 'base64').toString('utf8')
      const [ivHex, authTagHex, encrypted] = decoded.split(':')

      // Recuperar IV e auth tag
      const iv = Buffer.from(ivHex, this.encoding)
      const authTag = Buffer.from(authTagHex, this.encoding)

      // Derivar chave
      const key = crypto
        .createHash('sha256')
        .update(privateEnv.jwtSecret)
        .digest()

      // Descriptografar
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encrypted, this.encoding, 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('Falha ao descriptografar:', error)
      throw new Error('Falha ao descriptografar dados')
    }
  }
}

// Usar em modelo de usuário
export async function saveUserCpf(userId: string, cpf: string) {
  const encrypted = SensitiveDataEncryption.encrypt(cpf)

  // Salvar no banco
  await db.users.update(
    { id: userId },
    { encrypted_cpf: encrypted }
  )
}

export async function getUserCpf(userId: string): Promise<string> {
  const user = await db.users.findUnique({ where: { id: userId } })
  return SensitiveDataEncryption.decrypt(user.encrypted_cpf)
}
```

### 3. Hashing de Senhas com Bcrypt

```typescript
// lib/auth/password.ts
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12 // Aumenta segurança mas também a latência

export class PasswordManager {
  /**
   * Hash uma senha para armazenamento seguro
   */
  static async hashPassword(password: string): Promise<string> {
    // Validação de força
    if (!this.isStrong(password)) {
      throw new Error(
        'Senha fraca. Mínimo 12 caracteres, ' +
        'incluindo maiúsculas, minúsculas, números e símbolos'
      )
    }

    return bcrypt.hash(password, SALT_ROUNDS)
  }

  /**
   * Valida uma senha contra seu hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Verifica força da senha
   */
  static isStrong(password: string): boolean {
    const hasMinLength = password.length >= 12
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

    return (
      hasMinLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSymbol
    )
  }

  /**
   * Gera sugestão de senha forte
   */
  static generateStrong(length = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{};\':"|,.<>/?'

    const all = uppercase + lowercase + numbers + symbols

    let password = ''
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]

    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)]
    }

    return password.split('').sort(() => Math.random() - 0.5).join('')
  }
}

// Usar em autenticação
export async function createUser(email: string, password: string) {
  const hashedPassword = await PasswordManager.hashPassword(password)

  return db.users.create({
    data: {
      email,
      password_hash: hashedPassword,
    },
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await db.users.findUnique({ where: { email } })

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  const isValid = await PasswordManager.verifyPassword(
    password,
    user.password_hash
  )

  if (!isValid) {
    throw new Error('Senha incorreta')
  }

  return user
}
```

---

## Autenticação e Autorização {#auth}

### Login Seguro com Rate Limiting

```typescript
// lib/security/login-attempt.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { privateEnv } from '@/lib/env'

const redis = new Redis({
  url: privateEnv.upstashRedisUrl,
  token: privateEnv.upstashRedisToken,
})

export const loginAttemptLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 tentativas em 15 minutos
})

export async function checkLoginAttempt(email: string): Promise<boolean> {
  const { success, remaining } = await loginAttemptLimit.limit(
    `login:${email.toLowerCase()}`
  )

  if (!success) {
    console.warn(`⚠️  Login attempt limit reached for ${email}`)
  }

  return success
}

// Usar em route handler
// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  // Rate limiting
  const allowed = await checkLoginAttempt(email)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
      { status: 429 }
    )
  }

  // ... autenticar usuário
}
```

### Session Management Seguro

```typescript
// lib/auth/session.ts
import { jwtVerify, SignJWT } from 'jose'
import { privateEnv } from '@/lib/env'

const secret = new TextEncoder().encode(privateEnv.sessionSecret)

interface SessionData {
  userId: string
  email: string
  role: string
  expiresAt: number
}

export async function createSession(data: Omit<SessionData, 'expiresAt'>) {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 dias

  const token = await new SignJWT({ ...data, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)

  return token
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, secret)
    return verified.payload as unknown as SessionData
  } catch (error) {
    console.error('Session verification failed:', error)
    return null
  }
}

export async function deleteSession(token: string) {
  // Adicionar token à blacklist no Redis
  // Para implementação com revogação imediata
}
```

---

## Criptografia de Dados {#criptografia}

### Dados em Trânsito (HTTPS + TLS)

```typescript
// middleware.ts - Forçar HTTPS em produção
import { NextRequest, NextResponse } from 'next/server'
import { publicEnv } from '@/lib/env'

export function middleware(request: NextRequest) {
  // Forçar HTTPS em produção
  if (publicEnv.environment === 'production') {
    if (request.headers.get('x-forwarded-proto') !== 'https') {
      const httpsUrl = new URL(request.url)
      httpsUrl.protocol = 'https:'
      return NextResponse.redirect(httpsUrl)
    }
  }

  return NextResponse.next()
}
```

### Dados em Repouso (Criptografia de Banco)

```sql
-- PostgreSQL com pgcrypto
-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Coluna criptografada
ALTER TABLE users ADD COLUMN encrypted_cpf BYTEA;

-- Inserir dados criptografados
INSERT INTO users (id, encrypted_cpf) VALUES
  (1, pgp_sym_encrypt('12345678901', 'secret_password'));

-- Descriptografar na query
SELECT
  id,
  pgp_sym_decrypt(encrypted_cpf::bytea, 'secret_password')::text as cpf
FROM users;
```

---

## Validação de Webhooks {#webhooks}

### Verificação de Assinatura com Rotação

```typescript
// lib/security/webhook-validator.ts
import crypto from 'crypto'

export interface WebhookSecret {
  id: string
  secret: string
  createdAt: Date
  active: boolean
}

export class WebhookValidator {
  private secrets: Map<string, WebhookSecret[]> = new Map()

  /**
   * Valida webhook contra todas as versões ativas do secret
   */
  validateWebhook(
    payload: string,
    signature: string,
    webhookName: string
  ): boolean {
    const secrets = this.secrets.get(webhookName) || []
    const activeSecrets = secrets.filter(s => s.active)

    return activeSecrets.some(secretObj => {
      const expected = crypto
        .createHmac('sha256', secretObj.secret)
        .update(payload)
        .digest('hex')

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      )
    })
  }

  /**
   * Rotacionar webhook secret (mantém antigo por 30 dias)
   */
  rotateWebhookSecret(webhookName: string): string {
    const newSecret = crypto.randomBytes(32).toString('hex')

    const secrets = this.secrets.get(webhookName) || []
    // Desativar secrets antigos
    secrets.forEach(s => (s.active = false))

    // Adicionar novo
    secrets.push({
      id: crypto.randomUUID(),
      secret: newSecret,
      createdAt: new Date(),
      active: true,
    })

    this.secrets.set(webhookName, secrets)
    return newSecret
  }
}

// Usar em webhook
// app/api/webhooks/proteo/route.ts
import { WebhookValidator } from '@/lib/security/webhook-validator'

const validator = new WebhookValidator()

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-signature')!

  if (!validator.validateWebhook(body, signature, 'proteo')) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Processar webhook
}
```

---

## Prevenção de Vazamentos {#prevenção-vazamentos}

### 1. Não Expor Informações em Erros

```typescript
// ❌ NUNCA faça isto
export async function POST(request: NextRequest) {
  try {
    // ... código
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message, // Expõe detalhes internos!
        stack: error.stack,   // Expõe caminho do servidor!
      },
      { status: 500 }
    )
  }
}

// ✅ Faça isto
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // ... código
  } catch (error) {
    const errorId = randomUUID()
    console.error(`[${errorId}] Error:`, error)

    return NextResponse.json(
      {
        error: 'Erro ao processar requisição',
        errorId, // Cliente pode reportar o ID para investigação
      },
      { status: 500 }
    )
  }
}
```

### 2. Validar e Sanitizar Input

```typescript
// lib/validation/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

export class InputSanitizer {
  /**
   * Remove tags HTML/XSS
   */
  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    })
  }

  /**
   * Valida e sanitiza email
   */
  static sanitizeEmail(email: string): string {
    const schema = z.string().email()
    const validated = schema.parse(email)
    return validated.toLowerCase().trim()
  }

  /**
   * Valida CPF
   */
  static validateCpf(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '')

    if (cleaned.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleaned)) return false

    // Validação de dígito verificador
    let sum = 0
    let remainder

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleaned[i - 1]) * (11 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0

    if (remainder !== parseInt(cleaned[9])) return false

    sum = 0
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleaned[i - 1]) * (12 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0

    return remainder === parseInt(cleaned[10])
  }
}

// Usar em validação
export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  cpf: z
    .string()
    .refine(
      InputSanitizer.validateCpf,
      'CPF inválido'
    ),
  email: z.string().email().transform(InputSanitizer.sanitizeEmail),
})
```

---

## Monitoramento de Segurança {#monitoramento}

### Logging de Eventos Sensíveis

```typescript
// lib/audit/audit-logger.ts
import { supabase } from '@/lib/supabase'

export interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  action: string
  resource: string
  resourceId: string
  changes?: Record<string, any>
  ipAddress: string
  userAgent: string
  result: 'success' | 'failure'
  errorMessage?: string
}

export class AuditLogger {
  static async log(request: NextRequest, data: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>) {
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ipAddress,
      userAgent,
      ...data,
    }

    // Salvar em banco de dados
    await supabase.from('audit_logs').insert(log)

    // Em caso de ações críticas, enviar alerta
    if (['delete:user', 'modify:permissions', 'rotate:secret'].includes(data.action)) {
      await this.sendAlert(log)
    }
  }

  private static async sendAlert(log: AuditLog) {
    // Enviar notificação ao admin
    console.log(`🚨 Ação crítica detectada: ${log.action}`)
    // TODO: Enviar email ou notificação
  }
}

// Usar em route handler
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const user = await getAuthenticatedUser(request)

  try {
    await db.users.delete({ where: { id: userId } })

    await AuditLogger.log(request, {
      userId: user.id,
      action: 'delete:user',
      resource: 'users',
      resourceId: userId,
      result: 'success',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await AuditLogger.log(request, {
      userId: user.id,
      action: 'delete:user',
      resource: 'users',
      resourceId: userId,
      result: 'failure',
      errorMessage: error.message,
    })

    throw error
  }
}
```

### Detecção de Anomalias

```typescript
// lib/security/anomaly-detection.ts
export class AnomalyDetector {
  /**
   * Detecta múltiplas tentativas de login falhadas
   */
  static async detectBruteForce(email: string): Promise<boolean> {
    const failedAttempts = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'login_failed')
      .eq('resource', 'users')
      .eq('resourceId', email)
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000)) // Última hora

    return (failedAttempts?.data?.length || 0) > 5
  }

  /**
   * Detecta login de IP novo
   */
  static async detectNewIp(userId: string, ipAddress: string): Promise<boolean> {
    const previousIps = await supabase
      .from('audit_logs')
      .select('ipAddress')
      .eq('userId', userId)
      .eq('action', 'login_success')
      .limit(10)

    const ips = previousIps?.data?.map((log: any) => log.ipAddress) || []

    return !ips.includes(ipAddress)
  }

  /**
   * Detecta atividade unusual (múltiplas requisições em curto período)
   */
  static async detectUnusualActivity(userId: string, windowMinutes = 5): Promise<boolean> {
    const recentActivity = await supabase
      .from('audit_logs')
      .select('*')
      .eq('userId', userId)
      .gte('timestamp', new Date(Date.now() - windowMinutes * 60 * 1000))

    const count = recentActivity?.data?.length || 0

    // Mais de 100 ações em 5 minutos é suspeito
    return count > 100
  }
}
```

---

## Compliance e Auditoria {#compliance}

### LGPD - Lei Geral de Proteção de Dados (Brasil)

```typescript
// lib/compliance/lgpd.ts
export interface ConsentRecord {
  userId: string
  consentType: 'data_processing' | 'marketing' | 'cookies'
  granted: boolean
  timestamp: Date
  ipAddress: string
}

export class LgpdCompliance {
  /**
   * Registra consentimento do usuário
   */
  static async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    ipAddress: string
  ): Promise<void> {
    await supabase.from('consent_records').insert({
      user_id: userId,
      consent_type: consentType,
      granted,
      timestamp: new Date(),
      ip_address: ipAddress,
    })
  }

  /**
   * Exporta dados do usuário (direito à portabilidade)
   */
  static async exportUserData(userId: string): Promise<any> {
    const [users, transactions, logs] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId),
      supabase.from('audit_logs').select('*').eq('userId', userId),
    ])

    return {
      user: users.data?.[0],
      transactions: transactions.data,
      auditLogs: logs.data,
      exportedAt: new Date(),
    }
  }

  /**
   * Deleta todos os dados do usuário (direito ao esquecimento)
   */
  static async deleteUserData(userId: string): Promise<void> {
    // Anonimizar ao invés de deletar (para manter registros)
    await supabase
      .from('users')
      .update({
        email: `deleted_${userId}@deleted.local`,
        name: 'Usuário Deletado',
        cpf_encrypted: null,
        updated_at: new Date(),
      })
      .eq('id', userId)

    console.log(`✅ Dados do usuário ${userId} foram anonimizados`)
  }
}
```

### PCI DSS - Segurança de Cartão de Crédito

```typescript
// Nunca armazenar dados de cartão localmente
// Sempre usar solução terceirizada (Stripe, Adyen, etc)

export async function createPayment(
  userId: string,
  stripePaymentMethodId: string,
  amount: number
) {
  // ✅ Usar Stripe (PCI DSS compliant)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'brl',
    payment_method: stripePaymentMethodId,
    customer: userId,
  })

  // ✅ Armazenar apenas referência ao payment
  await supabase.from('payments').insert({
    user_id: userId,
    stripe_payment_intent_id: paymentIntent.id,
    amount,
    status: 'processing',
  })

  // ❌ NUNCA fazer isto:
  // await supabase.from('payments').insert({
  //   user_id: userId,
  //   card_number: '1234 5678 9012 3456', // 🔴 NUNCA FAÇA ISTO!
  //   cvv: '123', // 🔴 NUNCA FAÇA ISTO!
  // })
}
```

---

## Checklist de Segurança Final

- [ ] HTTPS configurado em produção
- [ ] Headers de segurança (CSP, X-Frame-Options, etc)
- [ ] Rate limiting em endpoints sensíveis
- [ ] JWT com refresh tokens
- [ ] RBAC implementado
- [ ] Senhas com bcrypt (mínimo 12 caracteres)
- [ ] Dados sensíveis criptografados (CPF, cartão)
- [ ] Webhooks validados com HMAC
- [ ] Secrets não expostos em logs/erros
- [ ] Input validado e sanitizado
- [ ] Audit logs completos
- [ ] Detecção de anomalias
- [ ] Consentimento LGPD registrado
- [ ] Backup criptografado
- [ ] Política de rotação de secrets
- [ ] Testes de segurança regular
- [ ] Monitoramento com alertas

---

**Versão**: 1.0.0
**Atualizado**: Novembro 2025
**Projeto**: P2P Compra de Criptomoedas
