# Correção do Erro de RLS ao Criar Novos Usuários

## Problema

Erro ao criar novos usuários:

```
Erro ao criar perfil: new row violates row-level security policy for table "profiles"
```

## Causa Raiz

O `createAdminClient()` estava usando `createServerClient` da biblioteca `@supabase/ssr`, que mantém lógica de cookies e sessão mesmo ao usar a `service_role` key. Isso impedia que o RLS fosse bypassado corretamente.

## Solução Implementada

### Arquivo modificado: `src/lib/supabase/server.ts`

**Antes:**

```typescript
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // ... lógica de cookies
      },
    },
  )
}
```

**Depois:**

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada')
  }

  // Usar createClient puro (sem SSR) para garantir que bypasse RLS
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
```

### Mudanças principais:

1. **Import adicionado:** `createClient` da biblioteca `@supabase/supabase-js` (client "puro")
2. **Sem lógica de cookies:** Usa client puro sem SSR que realmente bypassa RLS
3. **Validação de env:** Verifica se a variável está configurada antes de usar
4. **Sem sessão:** Desabilita auto-refresh e persistência de sessão

## Arquivos Afetados

Esta mudança beneficia todos os lugares que usam `createAdminClient()`:

1. ✅ `src/app/actions/auth.ts` - Criação de novos usuários (onde o erro ocorria)
2. ✅ `src/app/api/proteo/webhook/route.ts` - Webhook do Proteo (atualização de KYC)
3. ✅ `src/app/actions/onboarding.ts` - Ações de onboarding

## Verificação Necessária

### 1. Ambiente de Desenvolvimento Local

A variável `SUPABASE_SERVICE_ROLE_KEY` já está configurada no `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Ambiente de Produção (Vercel)

**⚠️ IMPORTANTE:** Verifique se a variável está configurada no Vercel:

1. Acesse https://vercel.com/seu-projeto/settings/environment-variables
2. Confirme que existe a variável `SUPABASE_SERVICE_ROLE_KEY`
3. Se não existir, adicione com o valor do arquivo `.env.local`
4. Redeploy a aplicação após adicionar

### 3. Ambiente de Produção Alternativo (Railway)

Se estiver usando Railway, verifique também lá:

1. Acesse o dashboard do projeto no Railway
2. Vá em Variables
3. Confirme que `SUPABASE_SERVICE_ROLE_KEY` está configurada
4. Se não existir, adicione e redeploy

## Como Testar

### Teste 1: Criar Novo Usuário (Desenvolvimento)

1. Acesse `http://localhost:3000/pt-BR/register`
2. Preencha o formulário de cadastro
3. Clique em "Criar conta"
4. **Resultado esperado:** Conta criada com sucesso, sem erro de RLS

### Teste 2: Criar Novo Usuário (Produção)

1. Acesse `https://hubp2p.com/pt-BR/register`
2. Preencha o formulário de cadastro
3. Clique em "Criar conta"
4. **Resultado esperado:** Conta criada com sucesso, sem erro de RLS

### Teste 3: Webhook do Proteo

1. Complete um KYC no Proteo
2. Verifique os logs do webhook em Railway/Vercel
3. **Resultado esperado:** Webhook atualiza status do KYC sem erros de RLS

## Logs de Debug

Se ainda houver problemas, adicione logs no `signUp` em `src/app/actions/auth.ts`:

```typescript
console.log(
  '🔍 [DEBUG] SUPABASE_SERVICE_ROLE_KEY está configurada?',
  !!process.env.SUPABASE_SERVICE_ROLE_KEY,
)
```

## Próximos Passos

1. ✅ Correção implementada em `src/lib/supabase/server.ts`
2. ⏳ Verificar variável de ambiente no Vercel
3. ⏳ Fazer deploy da correção
4. ⏳ Testar criação de novo usuário em produção
5. ⏳ Testar webhook do Proteo

## Benefícios Adicionais

Esta correção também:

- ✅ Melhora a segurança (validação de env var)
- ✅ Garante que o webhook do Proteo funcione corretamente
- ✅ Previne futuros problemas de RLS em operações admin
- ✅ Usa a abordagem correta recomendada pela Supabase para service_role
