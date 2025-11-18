# Guia de Implementação - API Routes Next.js P2P

Passo a passo prático para implementar as API routes no seu projeto.

---

## Parte 1: Configuração Inicial

### 1.1 Instalar Dependências

```bash
cd seu-projeto-p2p

# Dependências principais
npm install next@latest react@latest react-dom@latest
npm install @supabase/supabase-js
npm install jose # Para JWT
npm install @upstash/ratelimit @upstash/redis # Para rate limiting

# Dependências de desenvolvimento
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D eslint prettier
```

### 1.2 Estrutura de Pasta

Crie a seguinte estrutura a partir de `src/`:

```
src/
├── app/
│   ├── api/
│   │   ├── kyc/
│   │   │   ├── verify/
│   │   │   │   └── route.ts
│   │   │   └── status/
│   │   │       └── route.ts
│   │   ├── transactions/
│   │   │   ├── create/
│   │   │   │   └── route.ts
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── list/
│   │   │       └── route.ts
│   │   ├── webhooks/
│   │   │   ├── proteo/
│   │   │   │   └── route.ts
│   │   │   └── deposit-notification/
│   │   │       └── route.ts
│   │   ├── admin/
│   │   │   ├── deposit-confirmed/
│   │   │   │   └── route.ts
│   │   │   └── transactions/
│   │   │       └── route.ts
│   │   └── cron/
│   │       └── cleanup-transactions/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── security/
│   │   ├── signature.ts
│   │   ├── rate-limit.ts
│   │   ├── cors.ts
│   │   └── auth.ts
│   ├── external-apis/
│   │   ├── proteo.ts
│   │   └── pushover.ts
│   ├── api/
│   │   ├── response.ts
│   │   └── error-handler.ts
│   ├── db/
│   │   └── supabase-client.ts
│   ├── validators/
│   │   └── index.ts
│   └── cron/
│       └── cleanup.ts
├── types/
│   ├── api.ts
│   └── database.ts
├── middleware.ts
└── env.example
```

---

## Parte 2: Arquivos de Configuração

### 2.1 .env.local (não versione!)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cnttavxhilcilcoafkgu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Proteo KYC
PROTEO_API_KEY=sua_chave_api_proteo
PROTEO_API_URL=https://api.proteo.com.br
PROTEO_WEBHOOK_SECRET=seu_webhook_secret_da_proteo

# Pushover
PUSHOVER_APP_TOKEN=seu_token_app_pushover

# Dados Bancários (PIX/TED)
PIX_KEY=sua-chave-pix@suaempresa.com.br
BANK_NAME=Banco do Brasil
BANK_CODE=001
ACCOUNT_NUMBER=0000001
ACCOUNT_DIGIT=9
ACCOUNT_HOLDER=Sua Empresa LTDA
ACCOUNT_CPF=00000000000

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://seu-redis-url
UPSTASH_REDIS_REST_TOKEN=seu_token

# JWT
JWT_SECRET=uma_chave_secreta_muito_segura_min_32_caracteres

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://seudominio.com.br

# Cron Jobs
CRON_SECRET=seu_secret_para_jobs_cron
```

### 2.2 env.example (versione este!)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Proteo KYC
PROTEO_API_KEY=your-proteo-api-key
PROTEO_API_URL=https://api.proteo.com.br
PROTEO_WEBHOOK_SECRET=your-webhook-secret

# Pushover
PUSHOVER_APP_TOKEN=your-pushover-app-token

# Dados Bancários
PIX_KEY=sua-chave-pix@empresa.com.br
BANK_NAME=Seu Banco
BANK_CODE=000
ACCOUNT_NUMBER=0000000
ACCOUNT_DIGIT=0
ACCOUNT_HOLDER=Nome da Conta
ACCOUNT_CPF=00000000000

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://redis-url
UPSTASH_REDIS_REST_TOKEN=token

# JWT
JWT_SECRET=change-me-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yoursite.com

# Cron
CRON_SECRET=change-me-in-production
```

### 2.3 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      allowedOrigins: (process.env.ALLOWED_ORIGINS || 'localhost:3000').split(','),
    },
  },
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## Parte 3: Implementação Passo a Passo

### 3.1 Começar com Tipos (src/types/api.ts)

Copie todo o conteúdo de "Exemplos TypeScript" > "1. Estrutura de Tipos"

```typescript
// Copie desde o arquivo TYPESCRIPT_EXAMPLES.md
```

### 3.2 Cliente Supabase (src/lib/db/supabase-client.ts)

Copie todo o conteúdo de "Exemplos TypeScript" > "2. Cliente Supabase"

### 3.3 Segurança - Módulos

#### src/lib/security/signature.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 2.1
```

#### src/lib/security/rate-limit.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 2.2
```

#### src/lib/security/cors.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 2.3
```

#### src/lib/security/auth.ts
```typescript
// De: TYPESCRIPT_EXAMPLES.md > 3
```

### 3.4 APIs Externas

#### src/lib/external-apis/proteo.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 3.1
```

#### src/lib/external-apis/pushover.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 3.2
```

### 3.5 Helpers

#### src/lib/validators/index.ts
```typescript
// De: TYPESCRIPT_EXAMPLES.md > 4
```

#### src/lib/api/response.ts
```typescript
// De: TYPESCRIPT_EXAMPLES.md > 5
```

### 3.6 Middleware Global (src/middleware.ts)
```typescript
// De: TYPESCRIPT_EXAMPLES.md > 6
```

### 3.7 Route Handlers (Comece com o mais simples)

#### app/api/kyc/verify/route.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 4.1
```

#### app/api/transactions/create/route.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 4.2 ou TYPESCRIPT_EXAMPLES.md > 9
```

#### app/api/webhooks/proteo/route.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 4.3
```

#### app/api/webhooks/deposit-notification/route.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 4.4
```

#### app/api/admin/deposit-confirmed/route.ts
```typescript
// De: API_ROUTES_EXAMPLES.md > 4.5
```

---

## Parte 4: Banco de Dados Supabase

### 4.1 Criar Tabelas (SQL)

Execute isso no Supabase SQL Editor:

```sql
-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  cpf VARCHAR UNIQUE NOT NULL,
  phone VARCHAR NOT NULL,
  kyc_status VARCHAR DEFAULT 'pending',
  proteo_verification_id VARCHAR,
  kyc_approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id VARCHAR PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  method VARCHAR NOT NULL, -- 'pix' ou 'ted'
  blockchain VARCHAR NOT NULL,
  wallet_address VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  pix_data JSONB,
  ted_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  customer_confirmed_at TIMESTAMP,
  confirmed_by UUID REFERENCES public.users(id),
  confirmed_at TIMESTAMP,
  sent_at TIMESTAMP
);

-- Tabela de Verificações KYC
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  proteo_verification_id VARCHAR UNIQUE,
  status VARCHAR DEFAULT 'pending',
  risk_level VARCHAR,
  submitted_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action VARCHAR NOT NULL,
  user_id UUID REFERENCES public.users(id),
  operator_id UUID REFERENCES public.users(id),
  transaction_id VARCHAR,
  details JSONB,
  ip_address VARCHAR,
  user_agent VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_expires_at ON public.transactions(expires_at);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_cpf ON public.users(cpf);

-- RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies básicas (IMPORTANTE: Adapte para sua segurança)
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can read own transactions" ON public.transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);
```

### 4.2 Configurar RLS Corretamente

No dashboard Supabase:
1. Vá para Authentication > Policies
2. Configure permissões para cada tabela
3. Diferentes políticas para usuários normais vs operadores/admins

---

## Parte 5: Testando Localmente

### 5.1 Teste da API KYC

```bash
curl -X POST http://localhost:3000/api/kyc/verify \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "João Silva",
    "cpf": "12345678901",
    "email": "joao@exemplo.com",
    "phone": "11999999999",
    "birthDate": "1990-01-15",
    "address": "Rua Exemplo, 123"
  }'
```

### 5.2 Teste de Criação de Transação

```bash
curl -X POST http://localhost:3000/api/transactions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_token_jwt" \
  -d '{
    "amount": 500,
    "method": "pix",
    "blockchain": "ethereum",
    "walletAddress": "0x1234567890123456789012345678901234567890"
  }'
```

### 5.3 Teste do Webhook (com signature)

```bash
# Gerar assinatura
SECRET="seu_webhook_secret"
PAYLOAD='{"verificationId":"123","status":"approved"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Enviar webhook
curl -X POST http://localhost:3000/api/webhooks/proteo \
  -H "Content-Type: application/json" \
  -H "x-proteo-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## Parte 6: Deploy e Produção

### 6.1 Variáveis em Produção

Defina no seu provedor (Vercel, Heroku, etc):

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PROTEO_API_KEY=...
PROTEO_WEBHOOK_SECRET=...
PUSHOVER_APP_TOKEN=...
JWT_SECRET=... (use openssl rand -hex 32)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
ALLOWED_ORIGINS=https://seusite.com.br
```

### 6.2 HTTPS Obrigatório

No Vercel/produção, HTTPS é automático. Certifique-se de:
- Usar `https://` em ALLOWED_ORIGINS
- Configurar headers de segurança (já feito no next.config.js)

### 6.3 Monitoramento

Adicione logging:

```typescript
// src/lib/logging.ts
import { createClient } from '@supabase/supabase-js';

export const logEvent = async (event: {
  level: 'info' | 'warning' | 'error';
  message: string;
  context?: any;
}) => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('logs').insert([
      {
        level: event.level,
        message: event.message,
        context: event.context,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};
```

---

## Parte 7: Checklist de Implementação

- [ ] Variáveis de ambiente configuradas
- [ ] Estrutura de pastas criada
- [ ] Tipos TypeScript definidos
- [ ] Cliente Supabase funcionando
- [ ] Tabelas de banco de dados criadas
- [ ] Middleware de CORS configurado
- [ ] Route handler de KYC implementado
- [ ] Route handler de transações implementado
- [ ] Webhooks Proteo testados
- [ ] Notificações Pushover testadas
- [ ] Rate limiting funcionando
- [ ] Assinatura de webhooks verificada
- [ ] Logs de auditoria registrando
- [ ] Testes locais passando
- [ ] Deploy em staging
- [ ] Testes em staging
- [ ] Deploy em produção
- [ ] Monitoramento configurado
- [ ] Backup automático habilitado
- [ ] Conformidade com LGPD/Lei 9.613

---

## Parte 8: Troubleshooting Comum

### Erro: "SUPABASE_SERVICE_ROLE_KEY não configurado"

**Solução:** Verifique se `.env.local` está correto e reinicie o servidor (`npm run dev`)

### Erro: "Unauthorized" em webhooks

**Solução:** Verifique se a assinatura é gerada com o secret correto. Compare com o secret configurado na Proteo.

### Rate limiting não funciona

**Solução:** Se usar Upstash, teste a conexão. Se usar implementação em-memory, saiba que ela reseta quando o servidor reinicia.

### Transações não salvam no Supabase

**Solução:** Verifique se RLS está corretamente configurado. Teste inserção manual na dashboard Supabase.

### CORS bloqueando requisições

**Solução:** Adicione origem ao `ALLOWED_ORIGINS` em .env.local

---

## Próximas Etapas Após Implementação Básica

1. Adicionar teste automatizado (Jest + Supertest)
2. Implementar gráficos no painel administrativo
3. Adicionar análise de conformidade regulatória
4. Criar sistema de notificações mais robusto
5. Implementar cache com Redis
6. Adicionar webhooks com retry automático
7. Criar documentação OpenAPI
8. Implementar 2FA/MFA para admins

---

Boa sorte com sua implementação! 🚀
