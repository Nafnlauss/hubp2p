# Next.js 15: Guia de Configuração e Setup

## Tabela de Conteúdos
1. [Configuração Inicial](#configuração-inicial)
2. [next.config.js](#nextconfigjs)
3. [tsconfig.json](#tsconfigjson)
4. [Estrutura de Projeto](#estrutura-de-projeto)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [ESLint e Prettier](#eslint-e-prettier)
7. [Dependências Recomendadas](#dependências-recomendadas)

---

## Configuração Inicial

### Criar Novo Projeto Next.js 15

```bash
# Usando create-next-app
npx create-next-app@latest my-app

# Ou com pnpm
pnpm create next-app my-app

# Ou com yarn
yarn create next-app my-app
```

Quando solicitado, escolha:
- **TypeScript**: Yes
- **ESLint**: Yes
- **Tailwind CSS**: Yes (recomendado)
- **Use `src/` directory?**: No
- **Use App Router?**: Yes (para novos projetos)
- **Customize import alias**: Yes

---

## next.config.js

### Configuração Completa Recomendada

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ==========================================
  // COMPORTAMENTO E PERFORMANCE
  // ==========================================

  // Usar SWC para compilação (mais rápido que Babel)
  swcMinify: true,

  // Compressão de assets
  compress: true,

  // Habilitar revalidação incremental estática (ISR)
  isr: {
    // Configuações opcionais de ISR
  },

  // ==========================================
  // ROTEAMENTO
  // ==========================================

  // Padrão para páginas do Next.js
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],

  // Basepath se aplicação não estiver na raiz
  basePath: process.env.NEXT_PUBLIC_BASE_PATH,

  // ==========================================
  // HEADERS CUSTOMIZADOS
  // ==========================================

  headers: async () => {
    return [
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      // Cachear arquivos estáticos por mais tempo
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // ==========================================
  // REDIRECTS
  // ==========================================

  redirects: async () => {
    return [
      // Redirecionar URLs antigas para novas
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true, // HTTP 301
      },
      // Redirecionar com padrões
      {
        source: '/old-blog/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
      // Redirecionar baseado em headers
      {
        source: '/',
        destination: '/app',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'NEXT_LOCALE',
            value: 'pt',
          },
        ],
      },
    ]
  },

  // ==========================================
  // REWRITES (Internal redirects)
  // ==========================================

  rewrites: async () => {
    return {
      beforeFiles: [
        // Reescrever rutas internas mantendo URL original
        {
          source: '/docs/:path*',
          destination: 'https://docs.example.com/:path*',
        },
      ],
      afterFiles: [
        // Fallback para SPA routes
        {
          source: '/:path*',
          destination: '/404',
        },
      ],
    }
  },

  // ==========================================
  // OTIMIZAÇÃO DE IMAGENS
  // ==========================================

  images: {
    // Domínios remotos permitidos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        port: '',
        pathname: '/assets/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdnjs.com',
      },
    ],

    // Formatos de imagem otimizados
    formats: ['image/avif', 'image/webp'],

    // Tamanhos de device para otimização responsiva
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Tamanhos de imagem para otimização
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Limite de cache para imagens otimizadas
    minimumCacheTTL: 31536000, // 1 ano

    // Dangerously allow SVG
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

    // Limite de tamanho de imagem
    sizes: [
      {
        breakpoint: 640,
        size: '640px',
      },
      {
        breakpoint: 1200,
        size: '1200px',
      },
    ],
  },

  // ==========================================
  // WEBPACK E BUILD
  // ==========================================

  webpack: (config, { isServer }) => {
    // Customizar webpack se necessário
    return config
  },

  // Tamanho máximo do bundle estático
  staticPageGenerationTimeout: 120,

  // ==========================================
  // VARIÁVEIS DE AMBIENTE
  // ==========================================

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'My App',
  },

  // ==========================================
  // FEATURES EXPERIMENTAIS
  // ==========================================

  experimental: {
    // Instrumentação para observabilidade
    // instrumentationHook: true,

    // Melhorias de performance
    optimizePackageImports: [
      'lodash-es',
      'date-fns',
      '@mui/material',
      '@mui/icons-material',
    ],

    // Turbo (experimental)
    // turbo: {
    //   rules: {
    //     '*.svg': {
    //       loaders: ['@svgr/webpack'],
    //       as: '*.js',
    //     },
    //   },
    // },
  },

  // ==========================================
  // OTIMIZAÇÕES ADICIONAIS
  // ==========================================

  productionBrowserSourceMaps: false, // Desabilitar source maps em produção

  // Tratamento de links
  reactRoot: true,

  // Suporte a trailing slash
  trailingSlash: false,

  // Gerar ETags para cache
  generateEtags: true,

  // Poder usar top-level await
  experimental: {
    asyncPageRoute: false,
  },
}

module.exports = nextConfig
```

---

## tsconfig.json

### Configuração Completa com Strict Mode

```json
{
  "compilerOptions": {
    // Target e versão do JavaScript
    "target": "ES2020",
    "useDefineForClassFields": true,

    // Bibliotecas e tipos
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",

    // Resolução de módulos
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,

    // JSX
    "jsx": "react-jsx",

    // Bundler
    "isolatedModules": true,
    "moduleDetection": "force",

    // Emissão de código
    "noEmit": true,

    // Strict mode (recomendado!)
    "strict": true,
    "alwaysStrict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "exactOptionalPropertyTypes": true,

    // Verificações adicionais
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/app/*": ["./app/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/styles/*": ["./styles/*"],
      "@/types/*": ["./types/*"],
      "@/hooks/*": ["./hooks/*"],
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"],
  "ts-node": {
    "compilerOptions": {
      "module": "commonjs"
    }
  }
}
```

---

## Estrutura de Projeto

### Recomendada para App Router

```
project/
├── app/                              # App Router (Next.js 13+)
│   ├── (auth)/                       # Route group
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (marketing)/                  # Marketing pages
│   │   ├── page.tsx                  # Home
│   │   ├── about/
│   │   │   └── page.tsx
│   │   └── pricing/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/                  # Protected routes
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # /dashboard
│   │   ├── posts/
│   │   │   ├── page.tsx              # /dashboard/posts
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx          # /dashboard/posts/[slug]
│   │   │   └── layout.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/                          # API routes
│   │   ├── auth/
│   │   │   ├── route.ts              # POST /api/auth
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── posts/
│   │   │   ├── route.ts              # GET/POST /api/posts
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET/PUT/DELETE /api/posts/[id]
│   │   └── revalidate/
│   │       └── route.ts              # Revalidação de cache
│   │
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   ├── error.tsx                     # Error boundary
│   ├── not-found.tsx                 # 404 page
│   └── robots.ts                     # Robots.txt
│
├── components/                       # React components
│   ├── ui/                           # UI reusable
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Input.tsx
│   ├── layout/                       # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── Sidebar.tsx
│   ├── forms/                        # Form components
│   │   ├── LoginForm.tsx
│   │   ├── ContactForm.tsx
│   │   └── PostForm.tsx
│   └── features/                     # Feature-specific
│       ├── PostCard.tsx
│       └── UserProfile.tsx
│
├── lib/                              # Utility functions
│   ├── api.ts                        # API client functions
│   ├── auth.ts                       # Authentication logic
│   ├── db.ts                         # Database connection
│   ├── utils.ts                      # General utilities
│   ├── constants.ts                  # App constants
│   └── hooks/                        # Custom React hooks
│       ├── useAuth.ts
│       └── useFetch.ts
│
├── types/                            # TypeScript types
│   ├── index.ts
│   ├── user.ts
│   ├── post.ts
│   └── api.ts
│
├── styles/                           # Stylesheets
│   ├── globals.css
│   ├── variables.css
│   └── animations.css
│
├── public/                           # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── .env.local                        # Local env vars (não commit)
├── .env.example                      # Example env vars
├── middleware.ts                     # Middleware global
├── next.config.js                    # Next.js config
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind config (if used)
├── postcss.config.js                 # PostCSS config (if used)
└── package.json
```

---

## Variáveis de Ambiente

### .env.local (local development)

```bash
# .env.local - NUNCA fazer commit!

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
DATABASE_POOL_SIZE=10

# Authentication
NEXTAUTH_SECRET=your-secret-key-here-min-32-chars
NEXTAUTH_URL=http://localhost:3000

# APIs
API_SECRET_KEY=secret-key-for-api-routes
STRIPE_SECRET_KEY=sk_test_...

# External services
SENDGRID_API_KEY=SG.xxx
GITHUB_CLIENT_SECRET=ghp_xxx
```

### .env.example (versionar)

```bash
# .env.example - Commitar este arquivo!

# Database
DATABASE_URL=
DATABASE_POOL_SIZE=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# APIs
API_SECRET_KEY=
STRIPE_SECRET_KEY=

# External services
SENDGRID_API_KEY=
GITHUB_CLIENT_SECRET=
```

### .env.production (produção)

```bash
# .env.production

# Database (usar conexão de produção)
DATABASE_URL=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://yourdomain.com

# APIs
API_SECRET_KEY=
```

### Usar variáveis de ambiente

```typescript
// lib/env.ts
export const env = {
  // Public (disponível no navegador)
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'My App',

  // Private (apenas no servidor)
  databaseUrl: process.env.DATABASE_URL,
  apiSecret: process.env.API_SECRET_KEY,
  stripeSecret: process.env.STRIPE_SECRET_KEY,
}

// Validação
if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is not defined')
}
```

---

## ESLint e Prettier

### .eslintrc.json

```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "react/no-unescaped-entities": "off",
    "@next/next/no-html-link-for-pages": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ]
  }
}
```

### .prettierrc.json

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "proseWrap": "preserve",
  "endOfLine": "lf"
}
```

### .prettierignore

```
node_modules
.next
out
dist
build
*.min.js
*.min.css
.env*
```

---

## Dependências Recomendadas

### package.json Script

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint --fix . && prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Dependências Principais

```bash
# Next.js e React
npm install next@latest react@latest react-dom@latest

# TypeScript
npm install --save-dev typescript @types/react @types/react-dom

# Utilitários
npm install clsx class-variance-authority tailwind-merge zod

# Form handling
npm install react-hook-form @hookform/resolvers

# State management (opcional)
npm install zustand

# API/Data fetching (opcional)
npm install axios swr

# Authentication (opcional)
npm install next-auth

# Database (escolha um)
npm install prisma @prisma/client
# ou
npm install drizzle-orm

# Styling (se usar Tailwind)
npm install -D tailwindcss postcss autoprefixer

# Testing
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Linting
npm install --save-dev eslint eslint-config-next prettier eslint-plugin-react-hooks

# Build tools (dev)
npm install --save-dev ts-node
```

### Exemplo completo package.json

```json
{
  "name": "nextjs-15-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --fix && prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^15.0.0",
    "zod": "^3.22.0",
    "clsx": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.55.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
```

---

## Checklist de Setup Inicial

- [ ] Criar projeto com `create-next-app`
- [ ] Instalar dependências
- [ ] Configurar TypeScript com strict mode
- [ ] Configurar ESLint e Prettier
- [ ] Adicionar path aliases ao `tsconfig.json`
- [ ] Criar estrutura de pastas
- [ ] Configurar `.env.local` e `.env.example`
- [ ] Adicionar `middleware.ts` se necessário
- [ ] Configurar `next.config.js` com otimizações
- [ ] Adicionar componentes base (Layout, Header, Footer)
- [ ] Configurar roteamento principal
- [ ] Testar build: `npm run build`
- [ ] Documentar projeto para a equipe

---

Última atualização: Novembro 2025
Versão: Next.js 15
