# Guia Completo: Variáveis de Ambiente e Secrets Management

Documentação abrangente sobre configuração, organização e segurança de variáveis de ambiente no projeto P2P com Next.js 15.

---

## Índice

1. [Fundamentos de Variáveis de Ambiente](#fundamentos)
2. [Público vs Privado (NEXT_PUBLIC)](#publico-vs-privado)
3. [Runtime vs Build-Time](#runtime-vs-build-time)
4. [Organização Estruturada](#organizacao)
5. [Secrets Rotation](#secrets-rotation)
6. [Vercel Environment Variables](#vercel-env)
7. [Segurança Best Practices](#seguranca)
8. [Exemplos Práticos](#exemplos)
9. [CI/CD Integration](#cicd)

---

## Fundamentos de Variáveis de Ambiente {#fundamentos}

### O que são?

Variáveis de ambiente são pares chave-valor que configuram o comportamento da aplicação sem alterar o código fonte. São essenciais para manter secrets seguros.

### Arquivos de Configuração

```
projeto/
├── .env.local              # Desenvolvimento local (NÃO VERSIONADO)
├── .env.development        # Desenvolvimento compartilhado (Opcional)
├── .env.test              # Testes (Opcional)
├── .env.production        # Produção (Referência apenas, NÃO VERSIONADO)
├── .env.example           # VERSIONADO - Template de variáveis
└── .gitignore             # Deve incluir .env*
```

### .gitignore - Proteção Básica

```bash
# .gitignore
# Variáveis de ambiente - NUNCA COMMITAR
.env
.env.local
.env.*.local
.env.production
.env.production.local
.env.development.local
.env.test.local

# Nunca commitar credentials
**/secrets/
**/.credentials
**/.keys
```

---

## Público vs Privado (NEXT_PUBLIC) {#publico-vs-privado}

### Regra de Ouro

**NEXT_PUBLIC**: Exposto no navegador (JavaScript do cliente)
**Sem prefixo**: Apenas no servidor (Node.js)

### Variáveis Públicas (NEXT_PUBLIC_*)

```bash
# .env.local - Variáveis públicas (expostas no navegador)

# URLs de serviços públicos
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SUPABASE_URL=https://cnttavxhilcilcoafkgu.supabase.co
NEXT_PUBLIC_ANALYTICS_ID=UA-123456789-1

# Chaves públicas (não são secrets)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_abc123...
NEXT_PUBLIC_MAPBOX_TOKEN=pk_live_xyz789...

# Configurações de ambiente
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Variáveis Privadas (Sem Prefixo)

```bash
# .env.local - Variáveis privadas (SEGREDOS)

# Banco de dados
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# APIs internas
API_SECRET_KEY=abc123def456...
ADMIN_API_KEY=xyz789...

# Terceiros (Proteo, Pushover, etc)
PROTEO_API_KEY=sua_chave_api_proteo
PUSHOVER_APP_TOKEN=seu_app_token_pushover

# JWT e autenticação
JWT_SECRET=sua_chave_jwt_secreta_muito_segura_abc123...
SESSION_SECRET=outro_secret_para_sessoes...

# Webhooks
PROTEO_WEBHOOK_SECRET=seu_webhook_secret_proteo
STRIPE_WEBHOOK_SECRET=seu_webhook_secret_stripe

# Configurações sensíveis
ACCOUNT_CPF=00000000000
ACCOUNT_PASSWORD=senha_bancaria_cifrada
```

### Acessando Variáveis no Código

#### Server Components (Seguro)

```typescript
// app/api/posts/route.ts
export async function POST(request: Request) {
  // Aceita variáveis privadas E públicas
  const apiSecret = process.env.API_SECRET_KEY  // Private
  const publicUrl = process.env.NEXT_PUBLIC_API_URL  // Public

  // Use secrets com segurança no servidor
  const response = await fetch('https://api.internal.com', {
    headers: {
      'Authorization': `Bearer ${apiSecret}`
    }
  })

  return response
}
```

#### Route Handlers (Seguro)

```typescript
// lib/env.ts - Centralizar acesso a variáveis
export const privateEnv = {
  // Secrets (servidor apenas)
  databaseUrl: process.env.DATABASE_URL!,
  apiSecret: process.env.API_SECRET_KEY!,
  jwtSecret: process.env.JWT_SECRET!,
  proteoApiKey: process.env.PROTEO_API_KEY!,
  pushoverToken: process.env.PUSHOVER_APP_TOKEN!,
}

export const publicEnv = {
  // URLs e chaves públicas
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID!,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT!,
}

// app/api/transactions/route.ts
import { privateEnv, publicEnv } from '@/lib/env'

export async function POST(request: Request) {
  // ✅ Seguro - no servidor
  const dbUrl = privateEnv.databaseUrl
  const secret = privateEnv.apiSecret

  // ✅ Também disponível
  const clientUrl = publicEnv.apiUrl

  return new Response('OK')
}
```

#### Client Components (Apenas Público)

```typescript
// components/UserProfile.tsx
'use client'

export function UserProfile() {
  // ✅ Correto - NEXT_PUBLIC_*
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  // ❌ ERRO - Variáveis privadas NÃO estão disponíveis no cliente
  // const secret = process.env.API_SECRET_KEY // undefined!

  const handleFetch = async () => {
    const response = await fetch(`${apiUrl}/api/user`)
    return response.json()
  }

  return <button onClick={handleFetch}>Carregar Perfil</button>
}
```

---

## Runtime vs Build-Time {#runtime-vs-build-time}

### Build-Time (Hardcoded no Bundle)

Variáveis definidas em tempo de build são incorporadas ao código compilado:

```typescript
// next.config.js
const nextConfig = {
  env: {
    // ⚠️ Hardcoded em TEMPO DE BUILD
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    BUILD_ID: process.env.BUILD_ID || 'dev',
    BUILD_TIME: new Date().toISOString(),
  },
}

module.exports = nextConfig
```

**Problema**: Não muda entre deployments sem rebuild.

### Runtime (Carregado na Execução)

Variáveis acessadas direto via `process.env` em runtime:

```typescript
// app/api/config/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    // ✅ Lido EM TEMPO DE EXECUÇÃO (sempre atualizado)
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    timestamp: new Date().toISOString(),
  })
}
```

### Melhor Prática

```typescript
// lib/env.ts - Validação em tempo de build + acesso em runtime
export const getEnv = () => {
  // Validar variáveis obrigatórias
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_API_URL',
    'JWT_SECRET',
  ]

  const missing = requiredVars.filter(
    (key) => !process.env[key]
  )

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente ausentes: ${missing.join(', ')}`
    )
  }

  return {
    // Servidor
    databaseUrl: process.env.DATABASE_URL!,
    jwtSecret: process.env.JWT_SECRET!,

    // Cliente
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  }
}

// Validar no startup
if (process.env.NODE_ENV === 'production') {
  getEnv() // Lança erro se variáveis estão faltando
}
```

---

## Organização Estruturada {#organizacao}

### Estrutura Recomendada do Projeto

```
projeto/
├── .env.example              # Template (VERSIONADO)
├── .env.local                # Desenvolvimento (IGNORADO)
├── .env.production            # Referência produção (IGNORADO)
├── lib/
│   ├── env.ts                # Centraliza acesso a variáveis
│   ├── config/
│   │   ├── api.ts            # Configuração API
│   │   ├── database.ts       # Configuração BD
│   │   ├── auth.ts           # Configuração Auth
│   │   └── payments.ts       # Configuração pagamentos
│   └── security/
│       ├── secrets.ts        # Carregamento de secrets
│       └── validation.ts     # Validação de env
└── config/
    └── environment.ts        # Tipos TypeScript para env
```

### .env.example (Template)

```bash
# .env.example - VERSIONADO
# Copie para .env.local e preencha com seus valores reais

# === BANCO DE DADOS ===
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# === SUPABASE ===
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...

# === APIS EXTERNAS ===
PROTEO_API_KEY=sua_chave_api_proteo
PROTEO_API_URL=https://api.proteo.com.br
PROTEO_WEBHOOK_SECRET=seu_webhook_secret_proteo

PUSHOVER_APP_TOKEN=seu_app_token_pushover

# === PAGAMENTOS ===
STRIPE_SECRET_KEY=sk_live_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...

# === AUTENTICAÇÃO ===
JWT_SECRET=sua_chave_jwt_secreta_muito_segura
SESSION_SECRET=seu_session_secret_seguro
NEXT_PUBLIC_AUTH_URL=https://auth.example.com

# === PIX/BANCÁRIO ===
PIX_KEY=sua-chave-pix@suaempresa.com.br
BANK_NAME=Banco do Brasil
BANK_CODE=001
ACCOUNT_NUMBER=0000001
ACCOUNT_DIGIT=9
ACCOUNT_HOLDER=Sua Empresa LTDA
ACCOUNT_CPF=00000000000

# === VERCEL (Produção) ===
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ENVIRONMENT=production

# === DESENVOLVIMENTO ===
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development

# === RATE LIMITING ===
UPSTASH_REDIS_REST_URL=https://seu-redis-url
UPSTASH_REDIS_REST_TOKEN=seu_redis_token

# === CORS ===
ALLOWED_ORIGINS=http://localhost:3000,https://example.com

# === LOGGING/MONITORING ===
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_LOG_LEVEL=info
```

### lib/env.ts - Centralização com Validação

```typescript
// lib/env.ts
import { z } from 'zod'

// Esquema de validação
const envSchema = z.object({
  // Servidor (privados)
  DATABASE_URL: z.string().url().default(''),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),

  PROTEO_API_KEY: z.string().optional(),
  PROTEO_WEBHOOK_SECRET: z.string().optional(),
  PUSHOVER_APP_TOKEN: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Cliente (públicos)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Banco e PIX
  PIX_KEY: z.string().optional(),
  BANK_CODE: z.string().optional(),
  ACCOUNT_NUMBER: z.string().optional(),
  ACCOUNT_DIGIT: z.string().optional(),
  ACCOUNT_HOLDER: z.string().optional(),

  // Rate limiting
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
})

type Env = z.infer<typeof envSchema>

// Carregar e validar
export const env = envSchema.parse(process.env)

// Exportar separado por categoria
export const serverEnv = {
  // Database
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,

  // Secrets
  jwtSecret: env.JWT_SECRET,
  sessionSecret: env.SESSION_SECRET,

  // Proteo
  proteoApiKey: env.PROTEO_API_KEY,
  proteoWebhookSecret: env.PROTEO_WEBHOOK_SECRET,

  // Pushover
  pushoverToken: env.PUSHOVER_APP_TOKEN,

  // Stripe
  stripeSecretKey: env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,

  // Supabase
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,

  // Rate limiting
  upstashRedisUrl: env.UPSTASH_REDIS_REST_URL,
  upstashRedisToken: env.UPSTASH_REDIS_REST_TOKEN,
}

export const clientEnv = {
  // Supabase
  supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  // Stripe
  stripePublishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

  // API
  apiUrl: env.NEXT_PUBLIC_API_URL,
  authUrl: env.NEXT_PUBLIC_AUTH_URL,

  // Config
  environment: env.NEXT_PUBLIC_ENVIRONMENT,
  logLevel: env.NEXT_PUBLIC_LOG_LEVEL,
}

export const bankingEnv = {
  pixKey: env.PIX_KEY,
  bankCode: env.BANK_CODE,
  accountNumber: env.ACCOUNT_NUMBER,
  accountDigit: env.ACCOUNT_DIGIT,
  accountHolder: env.ACCOUNT_HOLDER,
}

export const corsEnv = {
  allowedOrigins: env.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
}
```

### Uso em Different Contexts

```typescript
// ✅ Server Component
// app/dashboard/page.tsx
import { serverEnv } from '@/lib/env'

export default async function Dashboard() {
  const userId = await validateJWT(serverEnv.jwtSecret)
  // ... resto do código
}

// ✅ Route Handler
// app/api/auth/login/route.ts
import { serverEnv } from '@/lib/env'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const jwtSecret = serverEnv.jwtSecret
  // Gerar JWT com secret
  return NextResponse.json({ token })
}

// ✅ Client Component
// components/Settings.tsx
'use client'
import { clientEnv } from '@/lib/env'

export function Settings() {
  const apiUrl = clientEnv.apiUrl
  // Fazer requests ao servidor
}

// ✅ Biblioteca compartilhada
// lib/api.ts
import { clientEnv } from '@/lib/env'

export async function fetchApi(endpoint: string) {
  const response = await fetch(`${clientEnv.apiUrl}${endpoint}`)
  return response.json()
}
```

---

## Secrets Rotation {#secrets-rotation}

### Estratégia de Rotação

```markdown
## Checklist de Rotação de Secrets

### Mensal (Mínimo Recomendado)
- [ ] JWT_SECRET
- [ ] SESSION_SECRET
- [ ] API_SECRET_KEY

### A Cada 3 Meses
- [ ] DATABASE_URL (mudar senha no banco)
- [ ] STRIPE_SECRET_KEY
- [ ] WEBHOOK_SECRETS (Proteo, Stripe)

### Anualmente
- [ ] Toda a suite de secrets
- [ ] Regenerar todas as chaves de integração

### Em Caso de Incidente
- [ ] ROTAÇÃO IMEDIATA de todos os secrets comprometidos
- [ ] Revocar todas as sessões/tokens ativas
- [ ] Auditoria de logs
```

### Implementar Rotação com Versionamento

```typescript
// lib/secrets/versioning.ts
import crypto from 'crypto'

interface SecretVersion {
  id: string
  secret: string
  createdAt: Date
  expiresAt: Date
  active: boolean
  rotatedAt?: Date
}

class SecretManager {
  private secrets: Map<string, SecretVersion[]> = new Map()

  /**
   * Cria nova versão do secret
   * A antiga continua válida por 30 dias (graceful rotation)
   */
  async rotateSecret(secretName: string): Promise<string> {
    const newSecret = crypto.randomBytes(32).toString('hex')
    const version: SecretVersion = {
      id: crypto.randomUUID(),
      secret: newSecret,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      active: true,
    }

    // Arquivar versão antiga
    const oldVersions = this.secrets.get(secretName) || []
    oldVersions.forEach(v => v.active = false)

    // Adicionar nova versão
    oldVersions.push(version)
    this.secrets.set(secretName, oldVersions)

    // Persistir em banco de dados
    await this.persistToDatabase(secretName, version)

    return newSecret
  }

  /**
   * Valida secret contra versões ativas ou expiradas recentemente
   */
  validateSecret(secretName: string, providedSecret: string): boolean {
    const versions = this.secrets.get(secretName) || []

    return versions.some(v => {
      // Aceita secret ativo OU expirado há menos de 30 dias
      const isValid = v.secret === providedSecret
      const notExpired = v.expiresAt > new Date()
      const gracePeriod = v.expiresAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      return isValid && (notExpired || gracePeriod)
    })
  }

  private async persistToDatabase(name: string, version: SecretVersion) {
    // Salvar em banco de dados seguro
    // Por exemplo, em table criptografada no Supabase
    console.log(`Secret ${name} rotacionado: ${version.id}`)
  }
}

export const secretManager = new SecretManager()
```

### Usar em Autenticação

```typescript
// lib/auth.ts
import { serverEnv } from '@/lib/env'
import { secretManager } from '@/lib/secrets/versioning'

export async function verifyToken(token: string): Promise<boolean> {
  // Tenta verificar contra todas as versões válidas de JWT_SECRET
  const currentSecret = serverEnv.jwtSecret
  const isValid = secretManager.validateSecret('JWT_SECRET', currentSecret)

  if (!isValid) {
    throw new Error('JWT_SECRET não está configurado corretamente')
  }

  // ... resto da lógica de verificação
  return true
}

// Endpoint para rotacionar (admin apenas)
export async function rotateJwtSecret() {
  const newSecret = await secretManager.rotateSecret('JWT_SECRET')

  // Atualizar variável de ambiente
  // Em Vercel: update via dashboard ou API
  // Em servidor próprio: restart aplicação com novo .env

  console.log('JWT_SECRET rotacionado com sucesso')
  return newSecret
}
```

---

## Vercel Environment Variables {#vercel-env}

### Configurar via Dashboard

1. **Dashboard Vercel** → Project → Settings → Environment Variables

2. **Adicionar variável**:
   - **Name**: `PROTEO_API_KEY`
   - **Value**: `sua_chave_api_proteo`
   - **Environments**: Production, Preview, Development

3. **Tipos de Variáveis**:
   - **Production**: Produção apenas
   - **Preview**: PRs e branches (staging)
   - **Development**: `vercel dev` local

### Configurar via API Vercel

```bash
# Instalar CLI Vercel
npm install -g vercel

# Login
vercel login

# Adicionar variável de ambiente
vercel env add PROTEO_API_KEY

# Listar variáveis
vercel env list

# Remover variável
vercel env remove PROTEO_API_KEY

# Pull variáveis para .env.local
vercel env pull

# Pull apenas variáveis de produção
vercel env pull --environment production
```

### vercel.json - Configuração de Build

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@next-public-api-url",
    "NEXT_PUBLIC_ENVIRONMENT": "@next-public-environment",
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

### .env.production - Referência Vercel

```bash
# .env.production - Referência apenas (NÃO COMMITAR)
# Valores reais devem estar em Vercel Dashboard

# Estes devem ser idênticos ao que está em Vercel
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ENVIRONMENT=production
DATABASE_URL=postgresql://...
JWT_SECRET=super_secret_key_from_vercel...
```

### Monitorar Deployments

```typescript
// app/api/health/route.ts
import { serverEnv, clientEnv } from '@/lib/env'

export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      environment: clientEnv.environment,
      apiUrl: clientEnv.apiUrl,
      timestamp: new Date().toISOString(),
      // NÃO expor secrets aqui!
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
```

---

## Segurança Best Practices {#seguranca}

### 1. Nunca Logar Secrets

```typescript
// ❌ NUNCA FAÇA ISTO
console.log('JWT_SECRET:', process.env.JWT_SECRET)
console.log('API_KEY:', apiKey)

// ✅ FAÇA ISTO
console.log('Carregando configurações...')
console.log('Ambiente:', process.env.NEXT_PUBLIC_ENVIRONMENT)
// Secrets não são logados
```

### 2. Validar em Build-Time

```typescript
// scripts/validate-env.js
const requiredEnv = [
  'JWT_SECRET',
  'DATABASE_URL',
  'NEXT_PUBLIC_API_URL',
]

const missing = requiredEnv.filter(env => !process.env[env])

if (missing.length > 0) {
  console.error(`Variáveis obrigatórias faltando: ${missing.join(', ')}`)
  process.exit(1)
}

console.log('Todas as variáveis de ambiente estão configuradas')
```

No package.json:
```json
{
  "scripts": {
    "validate": "node scripts/validate-env.js",
    "build": "npm run validate && next build",
    "dev": "npm run validate && next dev"
  }
}
```

### 3. Diferentes Secrets por Ambiente

```bash
# .env.development
DATABASE_URL=postgresql://localhost/dev_db
JWT_SECRET=development_secret_not_real
NEXT_PUBLIC_ENVIRONMENT=development

# .env.test
DATABASE_URL=postgresql://localhost/test_db
JWT_SECRET=test_secret_also_not_real
NEXT_PUBLIC_ENVIRONMENT=test

# .env.production (referência apenas)
DATABASE_URL=postgresql://prod-server/prod_db
JWT_SECRET=production_secret_from_vercel
NEXT_PUBLIC_ENVIRONMENT=production
```

### 4. Proteger Webhooks

```typescript
// lib/security/signature.ts
import crypto from 'crypto'

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  // Usar timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

// app/api/webhooks/proteo/route.ts
import { verifyWebhookSignature } from '@/lib/security/signature'
import { serverEnv } from '@/lib/env'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature')!

  if (!verifyWebhookSignature(
    body,
    signature,
    serverEnv.proteoWebhookSecret
  )) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Processar webhook
  return new Response('OK')
}
```

### 5. Rate Limiting com Redis

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { serverEnv } from '@/lib/env'

const redis = new Redis({
  url: serverEnv.upstashRedisUrl,
  token: serverEnv.upstashRedisToken,
})

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
})

export const kyoRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
})
```

### 6. Criptografia de Dados Sensíveis

```typescript
// lib/crypto.ts
import crypto from 'crypto'
import { serverEnv } from '@/lib/env'

const algorithm = 'aes-256-gcm'

export function encryptSensitiveData(data: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(serverEnv.jwtSecret.slice(0, 32)),
    iv
  )

  let encrypted = cipher.update(data, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decryptSensitiveData(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':')

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(serverEnv.jwtSecret.slice(0, 32)),
    Buffer.from(ivHex, 'hex')
  )

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
```

---

## Exemplos Práticos {#exemplos}

### Exemplo 1: API Route com Autenticação

```typescript
// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { serverEnv, clientEnv } from '@/lib/env'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 1. Extrair token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token ausente' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    // 2. Validar token (usa JWT_SECRET)
    const userId = await verifyToken(token, serverEnv.jwtSecret)
    if (!userId) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // 3. Processar requisição
    const body = await request.json()

    // 4. Salvar no banco (usa DATABASE_URL)
    const transaction = await saveTransaction(body, userId)

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

async function saveTransaction(data: any, userId: string) {
  // Usa DATABASE_URL (nunca expor no cliente)
  const db = new DatabaseConnection(serverEnv.databaseUrl)
  return db.transactions.create({ ...data, userId })
}
```

### Exemplo 2: Client Component com API

```typescript
// components/TransactionForm.tsx
'use client'

import { clientEnv } from '@/lib/env'
import { useState } from 'react'

export function TransactionForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      // Usar URL pública
      const response = await fetch(
        `${clientEnv.apiUrl}/api/transactions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: formData.get('amount'),
            method: formData.get('method'),
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao criar transação')
      }

      const data = await response.json()
      console.log('Transação criada:', data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(new FormData(e.currentTarget))
    }}>
      <input name="amount" type="number" required />
      <select name="method">
        <option>pix</option>
        <option>ted</option>
      </select>
      <button disabled={loading}>
        {loading ? 'Enviando...' : 'Criar Transação'}
      </button>
    </form>
  )
}
```

### Exemplo 3: Integração Proteo com Secrets

```typescript
// lib/proteo.ts
import { serverEnv } from '@/lib/env'

export async function submitKycVerification(userData: any) {
  const response = await fetch(
    `${serverEnv.proteoApiUrl}/v1/kyc/verify`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serverEnv.proteoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    }
  )

  if (!response.ok) {
    throw new Error('Falha na verificação KYC')
  }

  return response.json()
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  // Usar secret do webhook
  return verifyHmac(
    payload,
    signature,
    serverEnv.proteoWebhookSecret
  )
}

// app/api/webhooks/proteo/route.ts
import { submitKycVerification, verifyWebhookSignature } from '@/lib/proteo'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature')!

  if (!verifyWebhookSignature(body, signature)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = JSON.parse(body)

  // Atualizar banco de dados
  console.log('KYC atualizado:', payload)

  return new Response('OK')
}
```

---

## CI/CD Integration {#cicd}

### GitHub Actions com Variáveis de Ambiente

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    environment: production  # Usar environment secrets

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      # Secrets vêm do GitHub Secrets
      - name: Deploy
        env:
          # Variáveis globais (repositório)
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_ENVIRONMENT: production

          # Secrets sensíveis (environment secrets)
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          PROTEO_API_KEY: ${{ secrets.PROTEO_API_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
        run: |
          npm ci
          npm run build
          npm run deploy
```

### Vercel com GitHub

Vercel integra automaticamente com GitHub:
1. Pushes para `main` → Production
2. Pushes para outras branches → Preview
3. PRs → Environment específico

Secrets configurados em **Vercel Dashboard** estão disponíveis automaticamente.

---

## Checklist Final

- [ ] `.env.example` criado e versionado com todas as variáveis necessárias
- [ ] `.env.local` e `.env.*.local` adicionados ao `.gitignore`
- [ ] Arquivo `lib/env.ts` criando e excelentes validações com Zod
- [ ] Separação clara entre `NEXT_PUBLIC_*` (cliente) e privadas (servidor)
- [ ] Todas as secrets configuradas em Vercel Dashboard
- [ ] Rate limiting implementado para APIs sensíveis
- [ ] Assinatura de webhooks validada
- [ ] Criptografia para dados sensíveis (CPF, senhas)
- [ ] Logs não expõem secrets
- [ ] Plano de rotação de secrets documentado
- [ ] CI/CD configurado com variáveis de ambiente corretas
- [ ] Monitoramento de falha de autenticação/autorização

---

**Versão**: 1.0.0
**Atualizado**: Novembro 2025
**Projeto**: P2P Compra de Criptomoedas
