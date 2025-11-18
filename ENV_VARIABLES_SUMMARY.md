# Sumário Executivo: Variáveis de Ambiente e Secrets Management

Guia rápido com tudo que você precisa saber sobre variáveis de ambiente no projeto P2P.

---

## Arquivos Criados

Foram gerados 4 documentos completos no seu repositório:

1. **ENV_VARIABLES_SECURITY_GUIDE.md** - Guia completo de 900+ linhas cobrindo:
   - Fundamentos de variáveis de ambiente
   - Público vs Privado (NEXT_PUBLIC_*)
   - Runtime vs Build-time
   - Organização estruturada com Zod
   - Secrets Rotation
   - Vercel Environment Variables
   - Segurança Best Practices
   - CI/CD Integration

2. **ENV_SETUP_TEMPLATES.md** - Templates prontos para usar:
   - `.env.example` completo
   - `lib/env.ts` com validação Zod
   - `.gitignore` apropriado
   - Scripts de validação
   - Exemplos de código
   - Geradores de secrets
   - Checklist de implementação

3. **SECRETS_SECURITY_BEST_PRACTICES.md** - Segurança avançada:
   - Segurança em camadas
   - Proteção de secrets
   - Autenticação/Autorização (RBAC)
   - Criptografia de dados
   - Validação de webhooks
   - Prevenção de vazamentos
   - Monitoramento
   - Compliance (LGPD, PCI DSS)

4. **ENV_VARIABLES_SUMMARY.md** - Este arquivo de referência rápida

---

## Referência Rápida

### Variáveis Públicas (NEXT_PUBLIC_*)

Expostas no navegador, NÃO incluir secrets:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_GA_ID=UA-123...
```

### Variáveis Privadas (Sem Prefixo)

Apenas no servidor, armazenar secrets aqui:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=abc123... (mínimo 32 caracteres)
SESSION_SECRET=xyz789... (mínimo 32 caracteres)
API_SECRET_KEY=...
STRIPE_SECRET_KEY=sk_live_...
PROTEO_API_KEY=...
PUSHOVER_APP_TOKEN=...
```

---

## Setup Rápido (5 Passos)

### 1. Criar `.env.local` a partir do template

```bash
cp ENV_SETUP_TEMPLATES.md
# Copiar a seção ".env.example" para .env.local
# Preencher com seus valores reais
```

### 2. Implementar validação

```bash
# Copiar o código de lib/env.ts do template
# Adaptar para seu projeto
```

### 3. Adicionar ao .gitignore

```bash
cat >> .gitignore << 'EOF'
.env
.env.local
.env.*.local
.env.production
EOF
```

### 4. Validar em build

```bash
# Copiar scripts/validate-env.js do template
# Atualizar package.json:
# "build": "npm run validate-env && next build"
```

### 5. Configurar em Vercel

```bash
# Via dashboard: Settings → Environment Variables
# Ou via CLI:
vercel env add JWT_SECRET
vercel env add DATABASE_URL
# ... adicione todos os secrets
```

---

## Onde Usar Cada Tipo

| Tipo | Servidor | Cliente | Exemplo |
|------|----------|---------|---------|
| **NEXT_PUBLIC_*** | ✅ Sim | ✅ Sim | API_URL, GA_ID |
| **Sem prefixo** | ✅ Sim | ❌ Não | JWT_SECRET, API_KEY |
| **Em .env.example** | ✅ Template | ✅ Referência | Valores dummy |
| **Em .env.local** | ✅ Reais | ✅ Reais | NÃO COMMITAR |

---

## Estrutura Recomendada

```
projeto/
├── .env.example                    # Template versionado
├── .env.local                      # Valores reais (ignorado)
├── lib/
│   ├── env.ts                      # Carregamento centralizado
│   ├── config/                     # Configurações por serviço
│   │   ├── api.ts
│   │   ├── database.ts
│   │   └── auth.ts
│   └── security/
│       ├── headers.ts
│       ├── rate-limit.ts
│       └── signature.ts
├── middleware.ts                   # Middleware global
├── scripts/
│   └── validate-env.js             # Validação de env
└── vercel.json                     # Config Vercel
```

---

## Checklist Rápido

### Desenvolvimento Local
- [ ] `.env.local` criado com valores reais
- [ ] `.env.local` adicionado ao `.gitignore`
- [ ] `lib/env.ts` implementado com Zod
- [ ] `npm run dev` funciona sem erros de env

### Antes de Commitar
- [ ] `npm run validate-env` passa
- [ ] Nenhum secret em arquivos versionados
- [ ] `.env.example` atualizado (sem valores reais)
- [ ] Documentação atualizada

### Em Produção (Vercel)
- [ ] Todos os secrets em Vercel Dashboard
- [ ] Variáveis públicas têm valores corretos
- [ ] Build passa com `npm run build`
- [ ] Deployment automático via GitHub

---

## Exemplos Rápidos

### Acessar em Server Component

```typescript
import { privateEnv } from '@/lib/env'

export async function getUserData(userId: string) {
  const db = new Database(privateEnv.databaseUrl)
  // ...
}
```

### Acessar em Client Component

```typescript
'use client'
import { publicEnv } from '@/lib/env'

export function Settings() {
  const apiUrl = publicEnv.apiUrl
  // Fazer fetch
}
```

### Em API Route

```typescript
import { privateEnv, publicEnv } from '@/lib/env'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')
  // Usar privateEnv.jwtSecret para validar
  // Retornar publicEnv.apiUrl para cliente
}
```

---

## Gerar Secrets Seguros

```bash
# JWT_SECRET e SESSION_SECRET (32 caracteres hexadecimais)
openssl rand -hex 32

# API_KEY (32 caracteres base64)
openssl rand -base64 32

# Senhas fortes
openssl rand -base64 16
```

---

## Rotação de Secrets

### Mensal
- JWT_SECRET
- SESSION_SECRET
- API_SECRET_KEY

### A Cada 3 Meses
- DATABASE_URL (mudar senha)
- Webhook secrets (Proteo, Stripe)

### Anualmente
- Todos os secrets

### Em Caso de Vazamento
- ROTAÇÃO IMEDIATA
- Revogar todas as sessões
- Auditoria de logs

---

## Proteger contra Vazamentos

### ✅ Fazer

```typescript
// Salvar secrets em .env.local
// Não logar secrets
console.log('Iniciando...')

// Validar em runtime
const secret = process.env.JWT_SECRET
if (!secret) throw new Error('JWT_SECRET ausente')

// Mascarar em logs
const masked = secret.slice(0, 5) + '...' + secret.slice(-5)
console.log('Secret:', masked)
```

### ❌ NÃO Fazer

```typescript
// Hardcoding
const secret = 'abc123def456'

// Commitar .env
git add .env.local

// Logar secrets
console.log('Secret:', process.env.JWT_SECRET)

// Expor em erro
throw new Error(`DB error: ${process.env.DATABASE_URL}`)
```

---

## Troubleshooting

### "Variável de ambiente não definida"

```bash
# Verificar se existe em .env.local
grep JWT_SECRET .env.local

# Verificar se está no .gitignore
cat .gitignore | grep ".env"

# Em Vercel, verificar dashboard Settings
```

### "Variável não está disponível no cliente"

```typescript
// ❌ Errado - sem NEXT_PUBLIC_
const apiUrl = process.env.API_URL // undefined no cliente

// ✅ Correto
const apiUrl = process.env.NEXT_PUBLIC_API_URL // funciona
```

### "Build falha sem variáveis"

```bash
# Verificar validação
npm run validate-env

# Copiar do template
cp .env.example .env.local

# Preencher valores reais
# Refazer build
npm run build
```

---

## Documentação Completa

Para informações detalhadas, consulte:

- **ENV_VARIABLES_SECURITY_GUIDE.md** - Guia completo (900+ linhas)
- **ENV_SETUP_TEMPLATES.md** - Templates prontos (600+ linhas)
- **SECRETS_SECURITY_BEST_PRACTICES.md** - Segurança avançada (700+ linhas)

---

## Links Úteis

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Zod Documentation](https://zod.dev)

---

## Suporte

Dúvidas? Consulte:
1. A seção relevante do guia completo
2. Os templates prontos para copiar
3. O arquivo de segurança avançada

---

**Última atualização**: Novembro 2025
**Versão**: 1.0.0
**Projeto**: P2P Compra de Criptomoedas
