# Variáveis de Ambiente: Templates Prontos para Usar

Exemplos prontos para copiar e adaptar em seu projeto P2P.

---

## 1. .env.example (Template Completo)

```bash
# ==============================================================================
# VARIÁVEIS DE AMBIENTE - Template para desenvolvimento e produção
# ==============================================================================
# IMPORTANTE: Copie este arquivo para .env.local e preencha com seus valores
# NUNCA commite .env.local no repositório - adicione ao .gitignore

# ==============================================================================
# 1. BANCO DE DADOS E CACHE
# ==============================================================================

# PostgreSQL (Supabase)
DATABASE_URL=postgresql://user:password@localhost:5432/p2p_db

# Redis para cache e rate limiting
REDIS_URL=redis://localhost:6379

# ==============================================================================
# 2. SUPABASE (Backend as a Service)
# ==============================================================================

# URLs e chaves públicas (expor no cliente)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Chave de serviço (SERVIDOR APENAS)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==============================================================================
# 3. AUTENTICAÇÃO E SEGURANÇA
# ==============================================================================

# JWT Secret (MÍNIMO 32 caracteres, gerar com: openssl rand -hex 32)
JWT_SECRET=seu_jwt_secret_super_seguro_32_caracteres_minimo_abc123xyz789

# Session Secret
SESSION_SECRET=seu_session_secret_super_seguro_32_caracteres_minimo

# ==============================================================================
# 4. INTEGRAÇÕES EXTERNAS - PROTEO (KYC)
# ==============================================================================

PROTEO_API_KEY=sua_chave_api_proteo_aqui
PROTEO_API_URL=https://api.proteo.com.br
PROTEO_WEBHOOK_SECRET=seu_webhook_secret_proteo_aqui

# ==============================================================================
# 5. INTEGRAÇÕES EXTERNAS - PUSHOVER (Notificações)
# ==============================================================================

PUSHOVER_APP_TOKEN=seu_app_token_pushover_aqui

# ==============================================================================
# 6. INTEGRAÇÕES EXTERNAS - STRIPE (Pagamentos)
# ==============================================================================

# Chave pública (cliente)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_abc123...

# Chave secreta (servidor)
STRIPE_SECRET_KEY=sk_live_xyz789...
STRIPE_WEBHOOK_SECRET=whsec_abc123...

# ==============================================================================
# 7. INFORMAÇÕES BANCÁRIAS E PIX
# ==============================================================================

# Chave PIX (pode ser CPF, CNPJ, email, telefone ou chave aleatória)
PIX_KEY=sua-chave-pix@suaempresa.com.br
# PIX_KEY=12345678901234  # Alternativa: CPF

# Dados da conta bancária (para TED)
BANK_NAME=Banco do Brasil
BANK_CODE=001
ACCOUNT_NUMBER=0000001
ACCOUNT_DIGIT=9
ACCOUNT_TYPE=CORRENTE
ACCOUNT_HOLDER=Sua Empresa LTDA
ACCOUNT_CPF=00000000000

# ==============================================================================
# 8. CONFIGURAÇÃO DA APLICAÇÃO
# ==============================================================================

# Ambiente (development, staging, production)
NEXT_PUBLIC_ENVIRONMENT=development

# URL da aplicação
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_URL=http://localhost:3000/auth

# Versão da aplicação
NEXT_PUBLIC_APP_VERSION=1.0.0

# Nível de log (debug, info, warn, error)
NEXT_PUBLIC_LOG_LEVEL=info

# ==============================================================================
# 9. RATE LIMITING - UPSTASH REDIS
# ==============================================================================

UPSTASH_REDIS_REST_URL=https://seu-redis-rest-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_redis_rest_token_aqui

# ==============================================================================
# 10. CORS - ORIGENS PERMITIDAS
# ==============================================================================

# Separar múltiplas origens com vírgula
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://example.com

# ==============================================================================
# 11. MONITORAMENTO E LOGGING
# ==============================================================================

# Sentry (erro tracking)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Google Analytics
NEXT_PUBLIC_GA_ID=UA-123456789-1

# ==============================================================================
# 12. DESENVOLVIMENTO LOCAL (NÃO USAR EM PRODUÇÃO)
# ==============================================================================

# Desabilitar verificações de segurança em desenvolvimento
SKIP_ENV_VALIDATION=false

# Port do servidor de desenvolvimento
PORT=3000

# ==============================================================================
# 13. SECRETS ESPECÍFICOS DO PROJETO P2P
# ==============================================================================

# Limite mínimo de transação (em centavos)
MIN_TRANSACTION_AMOUNT=100  # R$ 1.00

# Limite máximo de transação
MAX_TRANSACTION_AMOUNT=100000000  # R$ 1.000.000,00

# Tempo de expiração de transação pendente (minutos)
TRANSACTION_EXPIRATION_MINUTES=40

# Limite de KYC por hora
KYC_RATE_LIMIT_PER_HOUR=5

# Limite de depósito por hora
DEPOSIT_RATE_LIMIT_PER_HOUR=5

# ==============================================================================
```

---

## 2. lib/env.ts (Setup Completo com Validação Zod)

```typescript
// lib/env.ts
import { z } from 'zod'

/**
 * Esquema de validação para variáveis de ambiente
 * Lançará erro se variáveis obrigatórias estão faltando em tempo de build
 */
const envSchema = z.object({
  // ========== BANCO DE DADOS ==========
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida'),
  REDIS_URL: z.string().url().optional(),

  // ========== SUPABASE ==========
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  // ========== AUTENTICAÇÃO ==========
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
  SESSION_SECRET: z.string().min(32),

  // ========== PROTEO ==========
  PROTEO_API_KEY: z.string().optional(),
  PROTEO_API_URL: z.string().url().optional(),
  PROTEO_WEBHOOK_SECRET: z.string().optional(),

  // ========== PUSHOVER ==========
  PUSHOVER_APP_TOKEN: z.string().optional(),

  // ========== STRIPE ==========
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ========== BANCO E PIX ==========
  PIX_KEY: z.string().optional(),
  BANK_NAME: z.string().optional(),
  BANK_CODE: z.string().optional(),
  ACCOUNT_NUMBER: z.string().optional(),
  ACCOUNT_DIGIT: z.string().optional(),
  ACCOUNT_HOLDER: z.string().optional(),
  ACCOUNT_CPF: z.string().optional(),

  // ========== CONFIGURAÇÃO ==========
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'staging', 'production']),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),
  NEXT_PUBLIC_LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),

  // ========== RATE LIMITING ==========
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ========== CORS ==========
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // ========== MONITORAMENTO ==========
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // ========== DESENVOLVIMENTO ==========
  SKIP_ENV_VALIDATION: z
    .enum(['true', 'false'])
    .transform(v => v === 'true')
    .default('false'),
  PORT: z.string().default('3000'),

  // ========== P2P ESPECÍFICOS ==========
  MIN_TRANSACTION_AMOUNT: z.string().default('100'),
  MAX_TRANSACTION_AMOUNT: z.string().default('100000000'),
  TRANSACTION_EXPIRATION_MINUTES: z.string().default('40'),
  KYC_RATE_LIMIT_PER_HOUR: z.string().default('5'),
  DEPOSIT_RATE_LIMIT_PER_HOUR: z.string().default('5'),
})

type Environment = z.infer<typeof envSchema>

// Validar e parsear
let parsedEnv: Environment

try {
  parsedEnv = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Erro nas variáveis de ambiente:')
    error.errors.forEach(err => {
      console.error(`  ${err.path.join('.')}: ${err.message}`)
    })
  }
  throw new Error('Variáveis de ambiente inválidas')
}

// ============================================================================
// EXPORTS ESTRUTURADOS POR CONTEXTO
// ============================================================================

/**
 * Variáveis públicas (disponíveis no cliente)
 */
export const publicEnv = {
  // Supabase
  supabaseUrl: parsedEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: parsedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  // Stripe
  stripePublishableKey: parsedEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

  // API
  apiUrl: parsedEnv.NEXT_PUBLIC_API_URL,
  authUrl: parsedEnv.NEXT_PUBLIC_AUTH_URL || parsedEnv.NEXT_PUBLIC_API_URL,

  // Config
  environment: parsedEnv.NEXT_PUBLIC_ENVIRONMENT,
  appVersion: parsedEnv.NEXT_PUBLIC_APP_VERSION,
  logLevel: parsedEnv.NEXT_PUBLIC_LOG_LEVEL,

  // Monitoramento
  gaId: parsedEnv.NEXT_PUBLIC_GA_ID,
} as const

/**
 * Variáveis privadas (apenas servidor)
 */
export const privateEnv = {
  // Banco de dados
  databaseUrl: parsedEnv.DATABASE_URL,
  redisUrl: parsedEnv.REDIS_URL,

  // Supabase
  supabaseServiceRoleKey: parsedEnv.SUPABASE_SERVICE_ROLE_KEY,

  // Autenticação
  jwtSecret: parsedEnv.JWT_SECRET,
  sessionSecret: parsedEnv.SESSION_SECRET,

  // Proteo
  proteoApiKey: parsedEnv.PROTEO_API_KEY,
  proteoApiUrl: parsedEnv.PROTEO_API_URL || 'https://api.proteo.com.br',
  proteoWebhookSecret: parsedEnv.PROTEO_WEBHOOK_SECRET,

  // Pushover
  pushoverToken: parsedEnv.PUSHOVER_APP_TOKEN,

  // Stripe
  stripeSecretKey: parsedEnv.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsedEnv.STRIPE_WEBHOOK_SECRET,

  // Upstash
  upstashRedisUrl: parsedEnv.UPSTASH_REDIS_REST_URL,
  upstashRedisToken: parsedEnv.UPSTASH_REDIS_REST_TOKEN,

  // Sentry
  sentryDsn: parsedEnv.SENTRY_DSN,
} as const

/**
 * Informações bancárias
 */
export const bankingEnv = {
  pixKey: parsedEnv.PIX_KEY,
  bankName: parsedEnv.BANK_NAME || 'Banco do Brasil',
  bankCode: parsedEnv.BANK_CODE || '001',
  accountNumber: parsedEnv.ACCOUNT_NUMBER || '0000001',
  accountDigit: parsedEnv.ACCOUNT_DIGIT || '9',
  accountHolder: parsedEnv.ACCOUNT_HOLDER,
  accountCpf: parsedEnv.ACCOUNT_CPF,
} as const

/**
 * CORS
 */
export const corsEnv = {
  allowedOrigins: parsedEnv.ALLOWED_ORIGINS
    .split(',')
    .map(origin => origin.trim()),
} as const

/**
 * Limites de transação P2P
 */
export const p2pEnv = {
  minAmount: parseInt(parsedEnv.MIN_TRANSACTION_AMOUNT),
  maxAmount: parseInt(parsedEnv.MAX_TRANSACTION_AMOUNT),
  expirationMinutes: parseInt(parsedEnv.TRANSACTION_EXPIRATION_MINUTES),
  kycRateLimitPerHour: parseInt(parsedEnv.KYC_RATE_LIMIT_PER_HOUR),
  depositRateLimitPerHour: parseInt(parsedEnv.DEPOSIT_RATE_LIMIT_PER_HOUR),
} as const

/**
 * Exportar tudo como um objeto unificado (opcional)
 */
export const env = {
  public: publicEnv,
  private: privateEnv,
  banking: bankingEnv,
  cors: corsEnv,
  p2p: p2pEnv,
} as const

// ============================================================================
// VALIDAÇÕES ADICIONAIS
// ============================================================================

// Validar que JWT_SECRET é suficientemente longo
if (parsedEnv.JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET deve ter no mínimo 32 caracteres. ' +
    'Gere com: openssl rand -hex 32'
  )
}

// Validar que em produção, secrets sensíveis estão configurados
if (parsedEnv.NEXT_PUBLIC_ENVIRONMENT === 'production') {
  const requiredSecrets = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'SESSION_SECRET',
  ]

  requiredSecrets.forEach(secret => {
    if (!parsedEnv[secret as keyof Environment]) {
      throw new Error(
        `${secret} é obrigatório em produção`
      )
    }
  })
}

console.log(`✅ Variáveis de ambiente validadas (${parsedEnv.NEXT_PUBLIC_ENVIRONMENT})`)
```

---

## 3. .gitignore (Proteção de Secrets)

```bash
# .gitignore

# ============================================================================
# VARIÁVEIS DE AMBIENTE - CRÍTICO: NÃO COMMITAR
# ============================================================================
.env
.env.local
.env.*.local
.env.production
.env.production.local
.env.development.local
.env.test.local
.env.*.example.local

# ============================================================================
# SECRETS E CREDENTIALS
# ============================================================================
.secrets/
.credentials/
secrets.json
credentials.json
*.pem
*.key
*.p8
*.p12
*.pfx
.aws/credentials

# ============================================================================
# DEPENDÊNCIAS
# ============================================================================
node_modules/
package-lock.json
pnpm-lock.yaml
yarn.lock

# ============================================================================
# BUILD
# ============================================================================
.next/
dist/
build/
.vercel/
.turbo/

# ============================================================================
# IDE
# ============================================================================
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# ============================================================================
# LOGS
# ============================================================================
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ============================================================================
# TESTES
# ============================================================================
.coverage/
coverage/
.nyc_output/

# ============================================================================
# VARIÁVEIS QUE NUNCA DEVEM SER COMMITADAS
# ============================================================================
!.env.example
!.env.example.development
!.env.example.production
```

---

## 4. scripts/validate-env.js (Validação em Build)

```javascript
// scripts/validate-env.js
const fs = require('fs')
const path = require('path')

console.log('🔍 Validando variáveis de ambiente...')

const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.local'

const envPath = path.join(process.cwd(), envFile)

// Verificar se arquivo existe
if (!fs.existsSync(envPath)) {
  console.warn(`⚠️  Arquivo ${envFile} não encontrado`)
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Arquivo .env.production é obrigatório em produção!')
    process.exit(1)
  }
}

// Variáveis obrigatórias
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

// Variáveis opcionais (para aviso)
const optionalVars = [
  'PROTEO_API_KEY',
  'PUSHOVER_APP_TOKEN',
  'STRIPE_SECRET_KEY',
  'SENTRY_DSN',
]

const missing = requiredVars.filter(v => !process.env[v])
const missingOptional = optionalVars.filter(v => !process.env[v])

if (missing.length > 0) {
  console.error(`\n❌ Variáveis OBRIGATÓRIAS faltando:`)
  missing.forEach(v => console.error(`   - ${v}`))
  process.exit(1)
}

if (missingOptional.length > 0) {
  console.warn(`\n⚠️  Variáveis OPCIONAIS não configuradas:`)
  missingOptional.forEach(v => console.warn(`   - ${v}`))
}

// Validação de segurança
const jwtSecret = process.env.JWT_SECRET
if (jwtSecret && jwtSecret.length < 32) {
  console.error('❌ JWT_SECRET deve ter no mínimo 32 caracteres')
  process.exit(1)
}

console.log('\n✅ Todas as variáveis de ambiente estão corretas!\n')
```

No `package.json`:
```json
{
  "scripts": {
    "validate-env": "node scripts/validate-env.js",
    "dev": "npm run validate-env && next dev",
    "build": "npm run validate-env && next build",
    "start": "npm run validate-env && next start"
  }
}
```

---

## 5. Exemplos de Uso em Código

### Route Handler com Autenticação

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { privateEnv, publicEnv } from '@/lib/env'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validar credenciais (exemplo simplificado)
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Gerar JWT usando o secret (privado)
    const token = jwt.sign(
      { email, iat: Math.floor(Date.now() / 1000) },
      privateEnv.jwtSecret,
      { expiresIn: '24h' }
    )

    // Retornar response com URL pública
    return NextResponse.json({
      success: true,
      token,
      redirectUrl: publicEnv.authUrl,
    })
  } catch (error) {
    console.error('Erro ao fazer login:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
```

### Client Component

```typescript
// components/Dashboard.tsx
'use client'

import { publicEnv } from '@/lib/env'
import { useEffect, useState } from 'react'

export function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    // Usar URL pública para fetch
    fetch(`${publicEnv.apiUrl}/api/user`)
      .then(r => r.json())
      .then(setData)
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>
      <p>API: {publicEnv.apiUrl}</p>
      <p>Env: {publicEnv.environment}</p>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
```

### Integração com Proteo

```typescript
// lib/proteo-client.ts
import { privateEnv } from '@/lib/env'

export async function submitKycVerification(userData: any) {
  const response = await fetch(
    `${privateEnv.proteoApiUrl}/v1/kyc/verify`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${privateEnv.proteoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`KYC Error: ${error.message}`)
  }

  return response.json()
}

// Uso no API Route
// app/api/kyc/submit/route.ts
import { submitKycVerification } from '@/lib/proteo-client'

export async function POST(request: NextRequest) {
  const userData = await request.json()
  const result = await submitKycVerification(userData)
  return NextResponse.json(result)
}
```

---

## 6. Vercel Deployment

### Configurar via Dashboard

1. Ir para **Project Settings** → **Environment Variables**
2. Adicionar cada variável:

```
Name: NEXT_PUBLIC_API_URL
Value: https://api.example.com
Environments: Production, Preview, Development
```

### Usar Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Pull variáveis para .env.local
vercel env pull .env.local

# Adicionar nova variável
vercel env add PROTEO_API_KEY

# Listar todas as variáveis
vercel env list
```

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

---

## 7. GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Install Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run validation
        run: npm run validate-env

      - name: Build
        run: npm run build

      - name: Deploy
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 8. Gerador de Secrets Seguros

```bash
# Gerar JWT_SECRET (32+ caracteres)
openssl rand -hex 32
# Resultado: 4a7f8c2e9b3d1a6f8c2e9b3d1a6f8c2e9b3d1a6f8c2e9b3d1a6f8c2e9b3d1a

# Gerar SESSION_SECRET
openssl rand -hex 32

# Gerar API_KEY (alternativa)
openssl rand -base64 32
```

---

## Checklist de Implementação

- [ ] Copiar `.env.example` e criar `.env.local`
- [ ] Implementar `lib/env.ts` com validação Zod
- [ ] Adicionar `.env*` ao `.gitignore`
- [ ] Executar `scripts/validate-env.js` no build
- [ ] Configurar variáveis em Vercel Dashboard
- [ ] Testar localmente com `npm run dev`
- [ ] Fazer push e verificar deploy automatizado
- [ ] Documentar todas as variáveis em `.env.example`
- [ ] Implementar rotação de secrets
- [ ] Configurar monitoramento (Sentry)

---

Estes templates estão prontos para usar em seu projeto P2P!

**Última atualização**: Novembro 2025
