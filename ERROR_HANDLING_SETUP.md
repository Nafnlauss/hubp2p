# Next.js 15: Setup e Configuração de Error Handling

## 1. Instalação de Dependências

### Passo 1: Instalar pacotes principais

```bash
npm install @sentry/nextjs @sentry/tracing \
            zod \
            winston \
            pino \
            dotenv

# ou com yarn
yarn add @sentry/nextjs @sentry/tracing zod winston pino dotenv
```

### Passo 2: Instalar ferramentas de monitoramento (opcional)

```bash
# Para Pushover (notificações)
npm install @pushover/node

# Para upstash (rate limiting)
npm install @upstash/ratelimit @upstash/redis

# Para DataDog
npm install dd-trace

# Para CloudWatch
npm install aws-sdk
```

---

## 2. Arquivo de Variáveis de Ambiente

### Arquivo: `.env.local`

```bash
# Ambiente
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === SENTRY ===
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# === PUSHOVER (Notificações) ===
PUSHOVER_APP_TOKEN=your-app-token
PUSHOVER_OPERATOR_KEY=your-operator-key

# === LOGGING EXTERNO ===
LOG_ENDPOINT=https://logs.example.com/api/logs
LOG_LEVEL=DEBUG

# === BANCO DE DADOS ===
DATABASE_URL=postgresql://user:password@localhost:5432/p2p_db

# === KYC (Proteo) ===
PROTEO_API_URL=https://api.proteo.com.br
PROTEO_API_KEY=your-proteo-api-key

# === UPSTASH (Rate Limiting) ===
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# === Email ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# === JWT ===
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d
```

### Arquivo: `.env.production`

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# SENTRY
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# PUSHOVER
PUSHOVER_APP_TOKEN=your-app-token
PUSHOVER_OPERATOR_KEY=your-operator-key

# LOG_LEVEL=INFO (produção)
LOG_LEVEL=WARN

# URLs de produção
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/p2p_prod
PROTEO_API_URL=https://api.proteo.com.br
```

### Arquivo: `.env.test`

```bash
NODE_ENV=test

# Mock services
SENTRY_DSN=test
PROTEO_API_URL=http://localhost:3001/mock/proteo

DATABASE_URL=postgresql://test:test@localhost:5432/p2p_test

# Desabilitar logs em testes
LOG_LEVEL=ERROR
```

---

## 3. Estrutura de Diretórios Recomendada

```
projeto/
├── app/
│   ├── (auth)/
│   │   ├── register/
│   │   │   ├── page.tsx          # Página de registro
│   │   │   └── error.tsx         # Error boundary
│   │   └── login/
│   │       ├── page.tsx
│   │       └── error.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── deposits/
│   │   │   ├── page.tsx
│   │   │   ├── error.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── error.tsx
│   │   │       └── confirm/
│   │   │           ├── page.tsx
│   │   │           └── error.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       └── error.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── deposits/
│   │   │   ├── page.tsx
│   │   │   ├── error.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── error.tsx
│   │   └── users/
│   │       ├── page.tsx
│   │       └── error.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   │   └── route.ts
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── deposits/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   └── confirm/
│   │   │   │       └── route.ts
│   │   │   └── health/
│   │   │       └── route.ts
│   │   ├── admin/
│   │   │   ├── deposits/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   └── users/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       ├── proteo/
│   │       │   └── route.ts
│   │       └── pushover/
│   │           └── route.ts
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # 404 page
│   └── loading.tsx             # Global loading
│
├── lib/
│   ├── errors.ts               # Definições de erro
│   ├── error-handler.ts        # Handler global de erros
│   ├── logger.ts               # Sistema de logging
│   ├── monitoring.ts           # Monitoramento e alertas
│   ├── user-messages.ts        # Mensagens amigáveis
│   ├── auth-errors.ts          # Erros específicos de auth
│   ├── kyc-service.ts          # Integração KYC
│   ├── sentry-server.ts        # Sentry (servidor)
│   ├── sentry-client.tsx       # Sentry (cliente)
│   ├── api.ts                  # Funções de API
│   ├── auth.ts                 # Lógica de autenticação
│   ├── db.ts                   # Conexão com banco
│   ├── env.ts                  # Variáveis de ambiente validadas
│   └── utils.ts                # Funções utilitárias
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── ErrorAlert.tsx      # Componente de erro
│   ├── forms/
│   │   ├── RegisterForm.tsx
│   │   ├── LoginForm.tsx
│   │   └── DepositForm.tsx
│   ├── deposits/
│   │   └── deposit-form.tsx
│   └── admin/
│       ├── deposits-list.tsx
│       └── users-list.tsx
│
├── hooks/
│   ├── useAsync.ts
│   ├── useError.ts             # Hook para tratamento de erro
│   └── usePushNotification.ts
│
├── types/
│   ├── index.ts
│   ├── user.ts
│   ├── deposit.ts
│   └── api.ts
│
├── __tests__/
│   ├── api/
│   │   ├── auth.test.ts
│   │   └── deposits.test.ts
│   ├── lib/
│   │   ├── errors.test.ts
│   │   ├── logger.test.ts
│   │   └── error-handler.test.ts
│   └── components/
│       └── DepositForm.test.tsx
│
├── middleware.ts               # Middleware global
├── instrumentation.ts          # Inicialização de Sentry
├── next.config.js
├── tsconfig.json
├── jest.config.js
├── .env.local                  # Variáveis de ambiente (local)
├── .env.production             # Variáveis de ambiente (prod)
└── package.json
```

---

## 4. Configuração do Next.js

### Arquivo: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */

const nextConfig = {
  // Habilitador de experimental features
  experimental: {
    // instrumentationHook para Sentry
    instrumentationHook: true,
  },

  // Configurações de segurança
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        },
      ],
    },
  ],

  // Performance
  swcMinify: true,
  compress: true,

  // Imagens
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'P2P Crypto',
  },
}

module.exports = nextConfig
```

### Arquivo: `tsconfig.json`

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
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/app/*": ["./app/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"],
      "@/hooks/*": ["./hooks/*"],
    },
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"],
}
```

---

## 5. Inicialização de Sentry

### Arquivo: `instrumentation.ts` (raiz do projeto)

```typescript
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

### Arquivo: `lib/sentry-server.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

export function initializeServerSentrySDK() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('NEXT_PUBLIC_SENTRY_DSN not configured')
    return
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],

    beforeSend(event, hint) {
      // Ignorar em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        return null
      }

      // Ignorar certos tipos de erro
      if (event.exception) {
        const error = hint.originalException
        if (error instanceof Error) {
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

### Arquivo: `lib/sentry-edge.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

export function initializeEdgeSentrySDK() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  })
}
```

---

## 6. Configuração de TypeScript para Environment Variables

### Arquivo: `lib/env.ts`

```typescript
/**
 * Validar e expor variáveis de ambiente
 * Usar este arquivo para acessar env vars com type safety
 */

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key]

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`Environment variable ${key} is not set`)
  }

  return value
}

export const env = {
  // App
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'P2P Crypto',

  // Sentry
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'INFO',
  logEndpoint: process.env.LOG_ENDPOINT,

  // Database
  databaseUrl: getEnv('DATABASE_URL'),

  // KYC
  proteoApiUrl: getEnv('PROTEO_API_URL'),
  proteoApiKey: getEnv('PROTEO_API_KEY'),

  // Pushover
  pushoverAppToken: getEnv('PUSHOVER_APP_TOKEN'),
  pushoverOperatorKey: getEnv('PUSHOVER_OPERATOR_KEY'),

  // Redis
  redisUrl: process.env.UPSTASH_REDIS_REST_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,

  // Email
  smtpHost: getEnv('SMTP_HOST'),
  smtpPort: parseInt(getEnv('SMTP_PORT', '587')),
  smtpUser: getEnv('SMTP_USER'),
  smtpPassword: getEnv('SMTP_PASSWORD'),

  // JWT
  jwtSecret: getEnv('JWT_SECRET'),
  jwtExpiration: getEnv('JWT_EXPIRATION', '7d'),

  // Feature flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
}

// Validar config em startup
export function validateEnv() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'PROTEO_API_URL',
    'PROTEO_API_KEY',
    'JWT_SECRET',
  ]

  const missing = requiredEnvVars.filter(v => !process.env[v])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}
```

---

## 7. Testing Setup

### Arquivo: `jest.config.js`

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### Arquivo: `jest.setup.js`

```javascript
// Configuração de testes
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test'
process.env.PROTEO_API_URL = 'http://localhost:3001/mock'
process.env.PROTEO_API_KEY = 'test-key'
```

---

## 8. Arquivo de Scripts do Package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "validate-env": "node -e \"require('./lib/env').validateEnv()\""
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@sentry/nextjs": "^7.91.0",
    "@sentry/tracing": "^7.91.0",
    "zod": "^3.22.0",
    "winston": "^3.11.0",
    "pino": "^8.17.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "jest": "^29.7.0",
    "jest-environment-node": "^29.7.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
```

---

## 9. Checklist de Deploy em Produção

### Antes de fazer deploy:

- [ ] Validar todas as variáveis de ambiente
- [ ] Testar error handling em produção
- [ ] Configurar Sentry com DSN correto
- [ ] Testar Pushover com chave real
- [ ] Verificar HTTPS em produção
- [ ] Rodar testes (`npm test`)
- [ ] Build sem erros (`npm run build`)
- [ ] Verificar performance com Lighthouse
- [ ] Configurar backups do banco de dados
- [ ] Planejar rollback strategy
- [ ] Testar recuperação de falhas
- [ ] Monitorar logs em produção

### Após deploy:

- [ ] Monitorar Sentry por novos erros
- [ ] Verificar status do health check (`/api/health`)
- [ ] Testar fluxos críticos (registro, depósito)
- [ ] Monitorar performance
- [ ] Revisar logs
- [ ] Estar pronto para responder a alertas

---

## 10. Úteis Links e Referências

### Documentação
- https://nextjs.org/docs/app/building-your-application/routing/error-handling
- https://docs.sentry.io/platforms/javascript/guides/nextjs/
- https://zod.dev/
- https://github.com/winstonjs/winston

### Ferramentas
- https://sentry.io/
- https://pushover.net/
- https://upstash.com/

### Best Practices
- Sempre use error boundaries em componentes críticos
- Log de cada operação importante
- Teste fluxos de erro
- Monitore performance em produção
- Mantenha historico de logs

---

Criado em: Novembro 16, 2025
Versão: Next.js 15
