# Variáveis de Ambiente: Referência Visual e Rápida

Diagramas e tabelas para referência rápida.

---

## Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ARQUIVO .env.local (NÃO COMMITAR)                │
│                          (Desenvolvimento)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  NEXT_PUBLIC_API_URL=http://localhost:3000  ──┐                     │
│  DATABASE_URL=postgresql://...               ──┤                     │
│  JWT_SECRET=abc123...                        ──┤                     │
│  PROTEO_API_KEY=...                          ──┤                     │
│                                               ──┤                     │
└─────────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     lib/env.ts (Carregamento)                        │
│                    Validação com Zod / TypeScript                    │
├──────────────────────────────────────────────────────────────────────┤
│  • Valida tipos                                                      │
│  • Verifica obrigatórias                                             │
│  • Exporta publicEnv e privateEnv                                    │
└──────────────────────────────────────────────────────────────────────┘
       │                              │
       ▼ (Público)                    ▼ (Privado)
┌──────────────────────────┐  ┌──────────────────────────┐
│  Client Component        │  │  Server Component        │
│  Route Handler (client)  │  │  API Route               │
│  NextAuth (público)      │  │  Database Connection     │
└──────────────────────────┘  └──────────────────────────┘
```

---

## Matriz de Decisão

### Qual variável usar?

```
┌─────────────────────────────────┬──────────┬─────────┐
│ Cenário                         │ Prefixo  │ Exemplo │
├─────────────────────────────────┼──────────┼─────────┤
│ URL de API pública              │ SIM      │ NEXT_PUBLIC_API_URL │
│ Chaves de criptografia JWT      │ NÃO      │ JWT_SECRET │
│ Banco de dados                  │ NÃO      │ DATABASE_URL │
│ ID do Analytics                 │ SIM      │ NEXT_PUBLIC_GA_ID │
│ API Keys de terceiros           │ NÃO      │ STRIPE_SECRET_KEY │
│ Chaves públicas de terceiros    │ SIM      │ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY │
│ Senhas ou tokens                │ NÃO      │ API_KEY │
│ Configurações de app            │ SIM      │ NEXT_PUBLIC_ENVIRONMENT │
│ Credenciais                     │ NÃO      │ DB_PASSWORD │
└─────────────────────────────────┴──────────┴─────────┘
```

---

## Checklist Visual

### Antes de `git push`

```
[ ] .env.local existe mas não foi adicionado
[ ] .env.example foi atualizado (sem valores reais)
[ ] .gitignore inclui .env*
[ ] lib/env.ts valida as variáveis
[ ] npm run validate-env passa
[ ] Nenhum secret em arquivos versionados
[ ] Documentação atualizada
```

### Em Produção (Vercel)

```
[ ] Todos os secrets em Vercel Dashboard
[ ] Ambiente Production configurado
[ ] Preview environment (branches) configurado
[ ] Development environment configurado
[ ] Build passa com vercel build
[ ] Deploy automático funciona
[ ] Health check retorna status 200
```

---

## Tabela de Variáveis Comuns

### Banco de Dados

| Variável | Público? | Exemplo | Gerador |
|----------|----------|---------|---------|
| DATABASE_URL | Não | postgresql://user:pass@localhost:5432/db | Vercel/Supabase |
| REDIS_URL | Não | redis://localhost:6379 | Upstash |

### Autenticação

| Variável | Público? | Tamanho Mínimo | Gerador |
|----------|----------|---|---------|
| JWT_SECRET | Não | 32 chars | `openssl rand -hex 32` |
| SESSION_SECRET | Não | 32 chars | `openssl rand -hex 32` |

### APIs Externas

| Serviço | Variável (Pública) | Variável (Privada) |
|---------|----|----|
| Stripe | NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | STRIPE_SECRET_KEY |
| Supabase | NEXT_PUBLIC_SUPABASE_URL | SUPABASE_SERVICE_ROLE_KEY |
| Proteo | - | PROTEO_API_KEY |
| Pushover | - | PUSHOVER_APP_TOKEN |

---

## Comando de Referência

```bash
# Validar ambiente
npm run validate-env

# Gerar secret aleatório
openssl rand -hex 32

# Copiar do Vercel
vercel env pull .env.local

# Adicionar no Vercel
vercel env add NOME_VARIAVEL

# Testar localmente
npm run dev

# Build test
npm run build

# Verificar se variável existe
env | grep JWT_SECRET
```

---

## Estrutura lib/env.ts

```typescript
export const publicEnv = {
  apiUrl: string
  supabaseUrl: string
  environment: 'development' | 'staging' | 'production'
  gaId: string
}

export const privateEnv = {
  databaseUrl: string
  jwtSecret: string
  sessionSecret: string
  proteoApiKey: string
  stripeSecretKey: string
}

export const bankingEnv = {
  pixKey: string
  bankCode: string
  accountNumber: string
}

export const corsEnv = {
  allowedOrigins: string[]
}
```

---

## Segurança em 30 Segundos

```javascript
// ✅ FAZER
const secret = process.env.JWT_SECRET
if (!secret) throw new Error('JWT_SECRET não configurado')

// ❌ NÃO FAZER
console.log('Secret:', process.env.JWT_SECRET)
git add .env.local
const secret = 'hardcoded_secret'
```

---

## Fluxo CI/CD

```
GitHub Push
    │
    ▼
GitHub Actions
    ├─ npm install
    ├─ npm run validate-env (usa secrets do Actions)
    ├─ npm run build
    │
    ▼
Vercel
    ├─ Usa secrets do Vercel Dashboard
    ├─ Build automático
    │
    ▼
Deploy
    └─ Ambiente com variáveis de produção
```

---

## Exemplo: Adicionar Nova Variável

### 1. Atualizar .env.example

```bash
# .env.example
NOVO_SECRET=seu_valor_aqui_NAO_REAL
```

### 2. Atualizar .env.local (local)

```bash
# .env.local
NOVO_SECRET=valor_real_seu_computador
```

### 3. Atualizar lib/env.ts

```typescript
const envSchema = z.object({
  // ...
  NOVO_SECRET: z.string().optional(),
})

export const privateEnv = {
  // ...
  novoSecret: parsedEnv.NOVO_SECRET,
}
```

### 4. Usar no código

```typescript
import { privateEnv } from '@/lib/env'

// Usar em servidor
const value = privateEnv.novoSecret
```

### 5. Configurar em Vercel

```bash
vercel env add NOVO_SECRET
# Digitar valor
```

### 6. Commitar

```bash
git add .env.example lib/env.ts
git commit -m "feat: adicionar NOVO_SECRET"
git push
```

---

## Troubleshooting Rápido

| Problema | Causa | Solução |
|----------|-------|---------|
| "ENV VAR undefined" | Faltando em .env.local | Copiar de .env.example, preencher |
| Build fails no Vercel | Secret não em Dashboard | Adicionar em Vercel Settings |
| Client não vê variável | Falta NEXT_PUBLIC_ | Adicionar prefixo |
| "Invalid environment" | Validação Zod falhou | npm run validate-env para debug |
| Secret vazou | Commitou .env.local | Girar secret imediatamente |

---

## Dica Pro

### Usar .env.example como Template

```bash
# Primeira vez
cp .env.example .env.local

# Depois só precisa preencher
# Próximas vezes, verificar se há novas variáveis
git diff .env.example
```

### Automatizar Validação

```json
{
  "scripts": {
    "validate": "node scripts/validate-env.js",
    "dev": "npm run validate && next dev",
    "build": "npm run validate && next build"
  }
}
```

---

## Referência: Todos os Documentos

| Documento | Foco | Linhas |
|-----------|------|--------|
| ENV_VARIABLES_SECURITY_GUIDE.md | Guia Completo | 900+ |
| ENV_SETUP_TEMPLATES.md | Templates Prontos | 600+ |
| SECRETS_SECURITY_BEST_PRACTICES.md | Segurança Avançada | 700+ |
| ENV_VARIABLES_SUMMARY.md | Sumário Executivo | 300+ |
| ENV_VARIABLES_QUICK_REFERENCE.md | Referência Rápida | Este! |

---

**Bookmark esta página!**

Atualizado: Novembro 2025
