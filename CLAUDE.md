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
│   │   ├── dashboard/            # Dashboard do usuário (rotas protegidas)
│   │   ├── login/                # Autenticação
│   │   └── register/             # Registro de usuário
│   └── actions/                  # Server Actions
│       ├── admin.ts              # Ações administrativas
│       ├── auth.ts               # Ações de autenticação
│       └── onboarding.ts         # Ações de cadastro/KYC
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
│   │   ├── server.ts             # Cliente Supabase (server-side)
│   │   └── middleware.ts         # Middleware de autenticação
│   ├── utils/                    # Funções utilitárias
│   ├── validations/              # Schemas de validação Zod
│   │   └── auth.ts               # Validações de autenticação
│   ├── utils.ts                  # Funções utilitárias gerais
│   ├── cep.ts                    # Validação/busca de CEP
│   ├── masks.ts                  # Máscaras de input (CPF, telefone, etc)
│   └── i18n-utils.ts             # Utilitários de internacionalização
├── types/                        # Definições de tipos TypeScript
│   ├── supabase.ts               # Tipos do banco Supabase
│   ├── auth.ts                   # Tipos de autenticação
│   └── transactions.ts           # Tipos de transações
├── i18n/                         # Configuração de internacionalização
│   └── request.ts                # Configuração central do next-intl
└── middleware.ts                 # Middleware de i18n + autenticação
```

### Fluxo de Autenticação

O projeto usa **Supabase Auth** com middleware customizado que:
1. Atualiza sessão automaticamente (refresh de tokens)
2. Aplica roteamento de internacionalização
3. Protege rotas administrativas e de dashboard

**Arquivos principais:**
- `src/lib/supabase/middleware.ts` - Lógica de autenticação
- `src/middleware.ts` - Combina auth + i18n
- `src/app/actions/auth.ts` - Server Actions de login/logout

### Internacionalização (i18n)

- **Biblioteca:** next-intl
- **Locales suportadas:** pt-BR (padrão), en, es
- **Roteamento:** Path prefix (`/pt-BR/`, `/en/`, `/es/`)
- **Arquivos de mensagens:** `/messages/{locale}.json`
- **Detecção:** Automática via Accept-Language header

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
- `src/app/actions/auth.ts` - Login, logout, registro
- `src/app/actions/admin.ts` - Operações administrativas
- `src/app/actions/onboarding.ts` - KYC e onboarding

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

### TypeScript
- Strict mode habilitado
- Path alias: `@/*` → `./src/*`
- Tipos gerados do Supabase em `src/types/supabase.ts`

### Convenções
- **Client Components:** Usar `'use client'` no topo do arquivo
- **Server Components:** Padrão (sem diretiva)
- **Server Actions:** Usar `'use server'` no topo do arquivo ou função
- **Nomes de arquivo:** camelCase para utilitários, PascalCase para componentes
- **Imports:** Ordenação automática via eslint-plugin-simple-import-sort

## Painel Administrativo

Rotas em `src/app/[locale]/admin/`:
- `/admin` - Dashboard com visão geral
- `/admin/transactions` - Gerenciamento de transações
- `/admin/kyc` - Aprovação de KYC
- `/admin/users` - Gerenciamento de usuários
- `/admin/notifications` - Configuração de notificações Pushover

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

Consultar `.env.local.example` para lista completa. Principais:
- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço (apenas server-side)
- `PROTEO_API_KEY` - Chave da API Proteo KYC
- `PUSHOVER_APP_TOKEN` - Token do app Pushover
- `PUSHOVER_USER_KEY` - Chave de usuário Pushover
- `TRANSACTION_EXPIRY_MINUTES` - Tempo de expiração da transação (padrão: 40)

## Documentação de Referência

- Backpack: https://docs.backpack.exchange/
- MiniMax M2: https://platform.minimax.io/docs/api-reference/text-anthropic-api
- MiniMax Text Generation: https://platform.minimax.io/docs/guides/text-generation
- Next.js 15: Consultar `NEXTJS_15_BEST_PRACTICES.md` e `NEXTJS_15_CONFIGURATION.md`
- Internacionalização: Consultar `README_I18N.md` e `I18N_GUIDE.md`
- shadcn/ui: Consultar `SHADCN_README.md` e `SHADCN_QUICK_START.md`
- Notificações: Consultar `README_NOTIFICATIONS.md`
