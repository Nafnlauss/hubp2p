# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral do Projeto

Este é um projeto P2P (peer-to-peer) de compra de criptomoedas totalmente automatizado para o mercado brasileiro. O sistema permite que clientes comprem criptomoedas através de depósitos via Pix ou TED, com verificação KYC obrigatória via Proteo.

**Stack Tecnológica:**

- Next.js 15 (App Router)
- React 19 RC
- TypeScript
- Supabase (PostgreSQL + Auth)
- TailwindCSS + shadcn/ui
- next-intl (i18n)
- Zod (validação)
- React Hook Form
- Vitest + Playwright (testes)

## Quick Start (Novo no Projeto?)

Se você é novo no projeto, siga estes passos:

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**

   ```bash
   cp .env.example .env.local
   # Edite .env.local com suas credenciais (Supabase, Proteo, Pushover)
   npm run validate-env  # Validar configuração
   ```

3. **Iniciar servidor de desenvolvimento:**

   ```bash
   npm run dev
   ```

   Acesse http://localhost:3000

4. **Rodar testes para verificar que tudo funciona:**

   ```bash
   npm run test:run      # Testes unitários
   npm run test:e2e      # Testes E2E (certifique-se que npm run dev está rodando)
   ```

5. **Ler documentação importante:**
   - Este arquivo (CLAUDE.md) para arquitetura geral
   - `estrategia.md` para contexto de negócio
   - `I18N_GUIDE.md` para internacionalização
   - `README_NOTIFICATIONS.md` para configurar Pushover

## Comandos de Desenvolvimento

### Execução

```bash
npm run dev              # Inicia servidor de desenvolvimento (porta 3000)
npm run build            # Build de produção
npm start                # Inicia servidor de produção
```

### Qualidade de Código

```bash
npm run lint             # Executa ESLint
npm run lint:fix         # Corrige problemas de linting automaticamente
npm run format           # Formata código com Prettier
npm run type-check       # Verifica tipos TypeScript sem gerar arquivos
```

### Testes

```bash
npm run test             # Executa testes unitários em modo watch (Vitest)
npm run test:run         # Executa testes unitários uma vez
npm run test:coverage    # Executa testes com relatório de cobertura
npm run test:ui          # Abre interface UI do Vitest
npm run test:e2e         # Executa testes E2E (Playwright)
npm run test:e2e:ui      # Executa testes E2E com UI do Playwright
npm run test-all         # Executa lint + type-check + testes

# Executar teste específico
npx vitest run src/lib/utils/format.test.ts           # Teste unitário específico
npx playwright test tests/testCryptoSentButton.spec.ts # Teste E2E específico
npx playwright test --headed                            # Testes E2E com navegador visível (debug)
```

### Utilitários

```bash
npm run validate-env     # Valida variáveis de ambiente
npm run prepare          # Configura Husky (executado automaticamente após npm install)
```

## Arquitetura do Código

### Estrutura de Diretórios

```
src/
├── app/                          # App Router do Next.js
│   ├── [locale]/                 # Rotas com internacionalização
│   │   ├── admin/                # Painel administrativo (rotas protegidas)
│   │   │   ├── transactions/     # Gestão de transações
│   │   │   └── layout.tsx        # Layout com autenticação admin
│   │   ├── dashboard/            # Dashboard do usuário (rotas protegidas)
│   │   │   └── deposit/          # Página de depósito
│   │   ├── login/                # Autenticação
│   │   └── register/             # Registro de usuário
│   ├── actions/                  # Server Actions
│   │   ├── admin.ts              # Ações administrativas (usa createAdminClient)
│   │   ├── admin-auth.ts         # Autenticação admin (cookie admin_session)
│   │   ├── auth.ts               # Ações de autenticação de usuário
│   │   ├── get-admin-transactions.ts  # Buscar transações (admin)
│   │   ├── get-transaction-detail.ts  # Detalhes de transação
│   │   └── onboarding.ts         # Ações de cadastro/KYC
│   └── api/                      # API Routes
│       ├── proteo/webhook/       # Webhook para callbacks da Proteo
│       └── test-helpers/         # Helpers para testes E2E
├── components/                   # Componentes React
│   ├── ui/                       # Componentes do shadcn/ui
│   └── providers/                # Context providers
├── hooks/                        # Hooks customizados
│   ├── use-user.ts               # Hook para dados do usuário
│   ├── use-toast.ts              # Hook para notificações toast
│   ├── useFormattingUtils.ts     # Formatação de datas/números/moeda
│   └── useLocaleInfo.ts          # Informações de locale
├── lib/                          # Bibliotecas e utilitários
│   ├── supabase/                 # Configuração do Supabase
│   │   ├── client.ts             # Cliente Supabase (client-side)
│   │   ├── server.ts             # createClient + createAdminClient (bypassa RLS)
│   │   └── middleware.ts         # Middleware de autenticação
│   ├── utils/                    # Funções utilitárias
│   │   └── format.ts             # Formatação de números e moeda
│   ├── validations/              # Schemas de validação Zod
│   │   └── auth.ts               # Validações de autenticação
│   ├── utils.ts                  # Funções utilitárias gerais (cn, etc)
│   ├── cep.ts                    # Validação/busca de CEP
│   ├── masks.ts                  # Máscaras de input (CPF, telefone, etc)
│   ├── bitget.ts                 # Cliente para API Bitget (exchange)
│   └── i18n-utils.ts             # Utilitários de internacionalização
├── types/                        # Definições de tipos TypeScript
│   ├── supabase.ts               # Tipos do banco Supabase (gerados)
│   ├── auth.ts                   # Tipos de autenticação
│   └── transactions.ts           # Tipos de transações
├── i18n/                         # Configuração de internacionalização
│   └── request.ts                # Configuração central do next-intl
└── middleware.ts                 # Middleware de i18n + autenticação
```

### Padrões de Arquitetura Importantes

**Admin vs. User Access:**

- **User actions**: Usam `createClient()` do `@/lib/supabase/server` - respeitam RLS
- **Admin actions**: Usam `createAdminClient()` - bypassa RLS usando SUPABASE_SERVICE_ROLE_KEY
- **Admin auth**: Sistema separado com cookie `admin_session` e tabela `admin_users`
- Sempre verificar `checkAdminAccess()` antes de operações administrativas

**Middleware Flow:**

1. Request → `middleware.ts`
2. Para rotas admin/API: apenas `updateSession()` (Supabase auth)
3. Para rotas localizadas: `updateSession()` + `intlMiddleware` (next-intl)
4. Cookies do Supabase são preservados na resposta do intl middleware

### Fluxo de Autenticação

O projeto usa **Supabase Auth** com dois sistemas distintos:

**1. Autenticação de Usuários (Cliente Final):**

- Via Supabase Auth padrão (JWT tokens em cookies)
- Middleware atualiza sessão automaticamente (refresh de tokens)
- Server Actions em `src/app/actions/auth.ts`
- Usa `createClient()` para operações que respeitam RLS

**2. Autenticação Administrativa:**

- Sistema separado com cookie `admin_session`
- Tabela `admin_users` no banco
- Server Actions em `src/app/actions/admin-auth.ts`
- Usa `createAdminClient()` para bypass de RLS
- Função `checkAdminAccess()` valida sessão admin

**Arquivos principais:**

- `src/lib/supabase/middleware.ts` - Lógica de atualização de sessão
- `src/middleware.ts` - Combina auth + i18n, trata rotas admin/API separadamente
- `src/app/actions/auth.ts` - Server Actions de login/logout de usuário
- `src/app/actions/admin-auth.ts` - Server Actions de login admin
- `src/app/actions/admin.ts` - Operações admin (usa checkAdminAccess)

### Internacionalização (i18n)

- **Biblioteca:** next-intl
- **Locales suportadas:** pt-BR (padrão), en, es
- **Roteamento:** Path prefix (`/pt-BR/`, `/en/`, `/es/`)
- **Arquivos de mensagens:** `/messages/{locale}.json`
- **Detecção:** Automática via Accept-Language header

### API Routes

O projeto tem as seguintes rotas de API:

- `src/app/api/auth/login/route.ts` - Login de usuários via API
- `src/app/api/proteo/webhook/route.ts` - Webhook para callbacks da Proteo (KYC)
- `src/app/api/proteo/webhook-debug/route.ts` - Debug de webhooks da Proteo
- `src/app/api/test-helpers/reset-transaction/route.ts` - Helper para resetar transações (apenas em testes E2E)

**Nota:** A maioria das operações usa Server Actions (`src/app/actions/`) em vez de API Routes para melhor integração com o App Router do Next.js 15.

### Componentes UI

Usa **shadcn/ui** com TailwindCSS:

- Componentes em `src/components/ui/`
- Configuração em `tailwind.config.ts`
- Tema com suporte a dark mode (via next-themes)

### Validação de Dados

- **Biblioteca:** Zod
- **Schemas:** `src/lib/validations/`
- **Integração:** React Hook Form com @hookform/resolvers

### Server Actions

Next.js Server Actions para operações do servidor:

- `src/app/actions/auth.ts` - Login, logout, registro de usuários
- `src/app/actions/admin.ts` - Operações administrativas (updateTransactionStatus, approveKYC, etc)
- `src/app/actions/admin-auth.ts` - Login/logout de admin
- `src/app/actions/get-admin-transactions.ts` - Buscar lista de transações (admin)
- `src/app/actions/get-transaction-detail.ts` - Detalhes de uma transação específica
- `src/app/actions/onboarding.ts` - KYC e onboarding
- `src/app/actions/payment-accounts.ts` - Gerenciar contas de pagamento (CRUD)
- `src/app/actions/get-active-accounts.ts` - Buscar contas de pagamento ativas
- `src/app/actions/api-payment-accounts.ts` - API para contas de pagamento
- `src/app/actions/api-transactions.ts` - API para transações (criar, confirmar, etc)

**Padrão crítico - Admin vs User Client:**

```typescript
// ❌ ERRADO - Em operação admin
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient() // Respeita RLS - não terá acesso a dados de outros usuários

// ✅ CORRETO - Em operação admin
import { createAdminClient } from '@/lib/supabase/server'
const supabase = await createAdminClient() // Bypassa RLS - acesso total

// ✅ CORRETO - Em operação de usuário
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient() // Respeita RLS - usuário vê apenas seus dados
```

## Requisitos de Conformidade

- **Lei 9.613/1998 e Circular BC 3.978/2020**: Sistema deve implementar KYC completo com validação de CPF na Receita Federal
- **LGPD**: Coletar apenas dados necessários, informar uso e implementar retenção/exclusão apropriada
- **Retenção de dados**: Todos os registros (KYC, transações, logs) devem ser mantidos por no mínimo 5 anos

## Integrações Externas

### Proteo KYC (https://www.proteo.com.br/)

- Módulos: Central de Riscos, Background Check, Monitoramento Contínuo
- Validação obrigatória antes de permitir qualquer transação
- Armazenar ID de verificação retornado pela Proteo
- Dados necessários: nome completo, CPF, data de nascimento, endereço, telefone, e-mail, documento de identidade e selfie

### Pushover (https://api.pushover.net/1/messages.json)

- Notificações para operadores quando cliente confirma depósito
- Parâmetros: token (APP_TOKEN), user (USER_KEY), message, title, priority, ttl
- Cada operador deve fornecer sua USER_KEY do Pushover

### Supabase

- Projeto configurado: `cnttavxhilcilcoafkgu`
- MCP server já configurado em `.mcp.json`
- **IMPORTANTE:** Usar ferramentas MCP do Supabase (prefixadas com `mcp__supabase__`) para todas as operações de banco de dados
- Clientes Supabase disponíveis:
  - `src/lib/supabase/client.ts` - Para Client Components
  - `src/lib/supabase/server.ts` - Para Server Components e Server Actions
  - `src/lib/supabase/middleware.ts` - Para middleware

## Métodos de Depósito

### Pix

- Instantâneo (24x7)
- Gratuito para pessoa física
- Limite recomendado: R$ 1.000 entre 20h-6h
- Ideal para valores menores e rapidez

### TED

- Mesmo dia útil (dentro do horário limite do banco)
- Taxas até R$ 50
- Sem limite de valor
- Recomendado para valores acima do limite diário de Pix

## Fluxo Principal do Usuário

1. **Cadastro e KYC**: Cliente registra dados → envio para Proteo → aprovação obrigatória
2. **Escolha de depósito**: Cliente seleciona Pix/TED, informa valor, rede blockchain e endereço de carteira
3. **Geração de transação**: Sistema gera número único e exibe dados bancários/QR Code com timer de 40 minutos
4. **Notificação**: Cliente confirma depósito → Pushover notifica operador
5. **Confirmação manual**: Operador verifica banco → marca "Pagamento recebido" → envia cripto → marca "Valor enviado"

## Padrões de Código

### ESLint

Configurado com regras rigorosas:

- Unicorn plugin para melhores práticas
- Import sorting automático (simple-import-sort)
- Prettier integrado
- Regras de acessibilidade (jsx-a11y)
- Filename case enforcement (camelCase/PascalCase)
- **Executar antes de commits:** `npm run lint:fix` para corrigir automaticamente

### TypeScript

- Strict mode habilitado
- Path alias: `@/*` → `./src/*`
- Tipos gerados do Supabase em `src/types/supabase.ts`
- **Regenerar tipos:** Usar ferramentas MCP do Supabase: `mcp__supabase__generate_typescript_types`

### Convenções de Nomenclatura

- **Client Components:** Usar `'use client'` no topo do arquivo
- **Server Components:** Padrão (sem diretiva)
- **Server Actions:** Usar `'use server'` no topo do arquivo ou função
- **Nomes de arquivo:** camelCase para utilitários, PascalCase para componentes
- **Imports:** Ordenação automática via eslint-plugin-simple-import-sort

### Padrões de Desenvolvimento Importantes

**1. Operações de Banco de Dados:**

- Usar ferramentas MCP do Supabase (prefixadas com `mcp__supabase__`) quando possível
- Para DDL (CREATE, ALTER, DROP): Usar `mcp__supabase__apply_migration` com nome descritivo
- Para consultas SELECT/INSERT/UPDATE/DELETE: Usar `mcp__supabase__execute_sql`
- Sempre validar com `mcp__supabase__get_advisors` após mudanças de schema (verifica RLS, performance, etc)

**2. Segurança:**

- NUNCA usar `SUPABASE_SERVICE_ROLE_KEY` em código client-side
- NUNCA fazer commit de `.env.local` (já está no `.gitignore`)
- Validar todos os inputs do usuário com Zod antes de processar
- Usar HTTPS em produção (obrigatório para compliance)

**3. Autenticação:**

```typescript
// Client-side (componentes)
import { createClient } from '@/lib/supabase/client'

// Server-side (Server Components, Server Actions de usuário)
import { createClient } from '@/lib/supabase/server'

// Admin-only (Server Actions administrativas)
import { createAdminClient } from '@/lib/supabase/server'
import { checkAdminAccess } from '@/app/actions/admin' // Sempre validar primeiro
```

**4. Internacionalização:**

- Todas as strings visíveis ao usuário devem estar em `/messages/{locale}.json`
- Usar hook `useTranslations()` em Client Components
- Usar função `getTranslations()` em Server Components
- Nunca fazer hardcode de strings em português/inglês/espanhol no código

## Painel Administrativo

### Sistema de Autenticação Separado

O painel admin usa autenticação própria:

- Cookie `admin_session` com ID do admin
- Tabela `admin_users` no banco
- Login/logout via `src/app/actions/admin-auth.ts`
- Verificação via `checkAdminAccess()` em todas as operações

### Rotas Administrativas

Rotas em `src/app/[locale]/admin/`:

- `/admin` - Dashboard com visão geral
- `/admin/transactions` - Gerenciamento de transações
- `/admin/transactions/[id]` - Detalhes de transação específica
- `/admin/kyc` - Aprovação de KYC
- `/admin/users` - Gerenciamento de usuários
- `/admin/notifications` - Configuração de notificações Pushover
- `/admin/payment-accounts` - Gerenciar contas de pagamento

**IMPORTANTE:** Todas as rotas admin devem validar autenticação via `checkAdminAccess()` antes de realizar operações

## Requisitos de Segurança

- HTTPS obrigatório em todas as comunicações
- Criptografia de dados sensíveis em repouso
- Autenticação via Supabase Auth com middleware
- Logs de auditoria completos
- Validação de endereços de carteira blockchain
- Isolamento de dados por usuário via Row Level Security (RLS)
- **CRÍTICO:** Nunca expor credenciais (tokens, service role keys) em código-fonte
- Validação de inputs com Zod em todos os formulários

## Variáveis de Ambiente

Consultar `.env.example` para lista completa. Principais variáveis:

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima (client-side safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (APENAS server-side, bypassa RLS)

### Proteo KYC

- `PROTEO_API_KEY` - Chave da API Proteo
- `PROTEO_WEBHOOK_SECRET` - Secret para validar webhooks da Proteo
- `NEXT_PUBLIC_PROTEO_KYC_URL` - URL do iframe de KYC (inclui tenant e background_check_id)

### Pushover (Notificações)

- `PUSHOVER_APP_TOKEN` - Token do app Pushover
- `PUSHOVER_USER_KEY` - Chave do usuário que receberá notificações

### Dados Bancários

- `PIX_KEY` - Chave Pix para receber depósitos
- `BANK_NAME` - Nome do banco
- `BANK_ACCOUNT_HOLDER` - Titular da conta
- `BANK_ACCOUNT_NUMBER` - Número da conta
- `BANK_ACCOUNT_AGENCY` - Agência

### Segurança

- `JWT_SECRET` - Secret para assinar JWTs (mínimo 32 caracteres)
- `CRON_SECRET` - Secret para proteger endpoints de cron jobs
- `ALLOWED_ORIGINS` - Domínios permitidos para CORS (separados por vírgula)

### Rate Limiting (Opcional - Upstash)

- `UPSTASH_REDIS_REST_URL` - URL do Redis Upstash
- `UPSTASH_REDIS_REST_TOKEN` - Token do Redis Upstash

### Configurações Gerais

- `NEXT_PUBLIC_APP_URL` - URL base da aplicação
- `TRANSACTION_EXPIRY_MINUTES` - Tempo de expiração da transação (padrão: 40)

## Testes

### Testes Unitários (Vitest)

- Framework: Vitest com @testing-library/react
- Configuração: Automática via Next.js
- Localização: Arquivos `*.test.ts` ou `*.test.tsx` ao lado do código testado
- Exemplo: `src/lib/utils/format.test.ts`

### Testes E2E (Playwright)

- Framework: Playwright
- Configuração: `playwright.config.ts`
- Localização: Pasta `tests/` na raiz
- Exemplos:
  - `tests/testCryptoSentButton.spec.ts` - Testa fluxo de envio de cripto
  - `tests/debugAdminAccess.spec.ts` - Debug de acesso admin
  - `tests/testAdminLoginSimple.spec.ts` - Teste de login admin

**Padrões de Teste:**

- Use helper routes em `src/app/api/test-helpers/` para resetar estado
- Exemplo: `/api/test-helpers/reset-transaction/route.ts` para resetar transações em testes

## Troubleshooting Comum

### Problemas de Autenticação Admin

- **Sintoma**: "Não autenticado" ao acessar rotas admin
- **Causa**: Cookie `admin_session` não está presente ou inválido
- **Solução**:
  1. Verificar se `checkAdminAccess()` está sendo chamado
  2. Verificar se cookie foi setado corretamente no login
  3. Verificar se admin existe na tabela `admin_users`

### Problemas com RLS (Row Level Security)

- **Sintoma**: Operações admin não funcionam ou retornam dados vazios
- **Causa**: Usando `createClient()` em vez de `createAdminClient()`
- **Solução**: Server Actions de admin DEVEM usar `createAdminClient()` para bypass de RLS

### Problemas de Middleware

- **Sintoma**: Rotas admin sendo redirecionadas incorretamente
- **Causa**: Middleware de i18n está sendo aplicado a rotas admin
- **Solução**: Verificar que `middleware.ts` está skipando intl para rotas `/admin` e `/api`

### Problemas de Variáveis de Ambiente

- **Sintoma**: Erros relacionados a variáveis não definidas
- **Causa**: Arquivo `.env.local` não está configurado corretamente
- **Solução**:
  1. Copiar `.env.example` para `.env.local`
  2. Preencher todas as variáveis necessárias
  3. Reiniciar o servidor de desenvolvimento
  4. Usar `npm run validate-env` para validar configuração

### Problemas com Testes E2E

- **Sintoma**: Testes Playwright falhando com timeouts
- **Causa**: Servidor de desenvolvimento não está rodando ou estado do banco está inconsistente
- **Solução**:
  1. Garantir que `npm run dev` está rodando
  2. Usar helper routes em `/api/test-helpers/` para resetar estado
  3. Executar com `npx playwright test --headed` para debug visual

## Documentação de Referência

### APIs Externas

- Backpack: https://docs.backpack.exchange/
- MiniMax M2: https://platform.minimax.io/docs/api-reference/text-anthropic-api
- MiniMax Text Generation: https://platform.minimax.io/docs/guides/text-generation
- Bitget: Cliente em `src/lib/bitget.ts`

### Documentação do Projeto

- Next.js 15: Consultar `NEXTJS_15_BEST_PRACTICES.md` e `NEXTJS_15_CONFIGURATION.md`
- Internacionalização: Consultar `README_I18N.md` e `I18N_GUIDE.md`
- shadcn/ui: Consultar `SHADCN_README.md` e `SHADCN_QUICK_START.md`
- Notificações: Consultar `README_NOTIFICATIONS.md`
- Estratégia geral: Consultar `estrategia.md` para contexto de negócio
