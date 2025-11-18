# Documentação Completa - Next.js API Routes para Sistema P2P

Esta documentação fornece um guia completo para implementar routes de API seguras, integradas com Proteo KYC, Pushover e Supabase para seu sistema P2P de compra de criptomoedas.

---

## Documentos Disponíveis

### 1. **API_ROUTES_EXAMPLES.md** - Exemplos Detalhados
O documento mais abrangente com explicação de cada conceito.

**Contém:**
- Estrutura recomendada de diretórios
- Configuração de segurança (CORS, rate limiting, webhook verification)
- Clientes para Proteo KYC e Pushover
- Exemplos de todos os route handlers principais
- Variáveis de ambiente
- Tratamento de erros
- Checklist de segurança

**Quando usar:** Para entender a arquitetura completa e aprender cada componente.

---

### 2. **TYPESCRIPT_EXAMPLES.md** - Código Pronto para Copiar
Exemplos de código TypeScript prontos para serem copiados e colados diretamente no projeto.

**Contém:**
- Tipos compartilhados (`src/types/api.ts`)
- Cliente Supabase com funções úteis
- Middleware de autenticação
- Validadores (CPF, email, endereço de carteira, etc)
- Helpers de resposta de API
- Middleware global CORS
- Job de limpeza (transações expiradas)
- Testes unitários com Jest
- Exemplo completo de route handler

**Quando usar:** Quando você está pronto para implementar e quer código que funciona.

---

### 3. **IMPLEMENTATION_GUIDE.md** - Passo a Passo Prático
Guia passo a passo para implementar tudo na prática.

**Contém:**
- Instalação de dependências
- Estrutura de pastas (copiar/colar)
- Como implementar cada arquivo
- Criar tabelas no Supabase (SQL)
- Configurar RLS (Row Level Security)
- Testes locais com curl
- Deploy em produção
- Troubleshooting comum
- Checklist de implementação

**Quando usar:** Quando está implementando e precisa de instruções passo a passo.

---

### 4. **ARCHITECTURE_DIAGRAM.md** - Diagramas e Fluxos
Diagramas visuais de arquitetura e fluxos do sistema.

**Contém:**
- Arquitetura geral (frontend → API → APIs externas → BD)
- Fluxo completo: cadastro até envio de cripto
- Fluxo de segurança (verificação de webhook)
- Fluxo de rate limiting
- Estrutura de dados (tabela de transações)
- Fluxo de autenticação JWT
- Stack de segurança (10 camadas)
- Ciclo de vida de transações (máquina de estados)
- Integração com Proteo

**Quando usar:** Para visualizar como tudo funciona junto.

---

## Arquitetura Geral

```
Frontend (Next.js)
    ↓ HTTPS
Next.js API Routes (Segurança + Rate Limit + Auth)
    ↓ APIs Externas
Proteo (KYC) | Pushover (Notificações) | Supabase (Database)
```

---

## Fluxo de Usuário Simplificado

1. **Cadastro e KYC**
   - Usuário preenche dados
   - Envia documentos para Proteo
   - Sistema aguarda aprovação via webhook

2. **Criação de Transação**
   - Usuário escolhe PIX ou TED
   - Sistema gera ID único
   - Retorna dados bancários com QR Code
   - Timer de 40 minutos começam

3. **Confirmação do Cliente**
   - Cliente faz PIX/TED
   - Confirma depósito no sistema
   - Sistema notifica operador via Pushover

4. **Confirmação do Operador**
   - Operador recebe alerta
   - Verifica depósito no banco
   - Marca como "Pagamento Recebido"
   - Envia criptomoedas
   - Marca como "Enviado"

---

## Segurança - Checklist Rápido

- [x] HTTPS em todas as comunicações
- [x] CORS restrito a domínios autorizados
- [x] Rate limiting implementado
- [x] JWT para autenticação
- [x] Verificação de assinatura em webhooks (HMAC)
- [x] Validação de entrada em todos os endpoints
- [x] Row Level Security (RLS) no banco
- [x] Logs de auditoria completos
- [x] Criptografia de dados sensíveis
- [x] Headers de segurança (HSTS, X-Content-Type-Options, etc)

---

## Integrações

### Proteo KYC
- **Propósito:** Verificação de identidade (Lei 9.613)
- **Endpoints principais:**
  - POST `/v1/kyc/verify` - Submeter KYC
  - GET `/v1/kyc/verify/{id}` - Status
  - POST `/v1/background-check` - Validar CPF
  - POST `/v1/monitoring/setup` - Monitoramento contínuo

### Pushover
- **Propósito:** Notificações para operadores
- **Dados necessários:**
  - APP_TOKEN (seu app)
  - USER_KEY (de cada operador)
  - Mensagem customizável

### Supabase
- **Propósito:** Banco de dados PostgreSQL
- **Tabelas principais:**
  - `users` - Usuários + status KYC
  - `transactions` - Depósitos PIX/TED
  - `kyc_verifications` - Histórico de KYC
  - `audit_logs` - Logs de auditoria (5 anos)

---

## Rotas da API

```
POST   /api/kyc/verify                 - Enviar KYC
GET    /api/kyc/status/:id             - Status do KYC

POST   /api/transactions/create         - Criar transação
GET    /api/transactions/:id            - Detalhe transação
GET    /api/transactions/list           - Listar minhas transações

POST   /api/webhooks/proteo             - Webhook Proteo
POST   /api/webhooks/deposit-notification - Confirmar depósito

PUT    /api/admin/deposit-confirmed     - Admin marca como recebido
GET    /api/admin/transactions          - Admin lista transações

GET    /api/cron/cleanup-transactions   - Job de limpeza (invocado por cron)
```

---

## Variáveis de Ambiente Necessárias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Proteo
PROTEO_API_KEY=...
PROTEO_WEBHOOK_SECRET=...

# Pushover
PUSHOVER_APP_TOKEN=...

# Dados Bancários
PIX_KEY=...
BANK_NAME=...
ACCOUNT_NUMBER=...

# Segurança
JWT_SECRET=... (min 32 chars)

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://seu-site.com

# Rate Limiting (opcional - Upstash)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Cron Jobs
CRON_SECRET=...
```

---

## Dependências Principais

```json
{
  "next": "^13.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "jose": "^4.0.0",
  "@upstash/ratelimit": "^1.0.0",
  "@upstash/redis": "^1.0.0"
}
```

---

## Estrutura de Pastas Recomendada

```
src/
├── app/
│   ├── api/
│   │   ├── kyc/
│   │   │   ├── verify/route.ts
│   │   │   └── status/route.ts
│   │   ├── transactions/
│   │   │   ├── create/route.ts
│   │   │   ├── [id]/route.ts
│   │   │   └── list/route.ts
│   │   ├── webhooks/
│   │   │   ├── proteo/route.ts
│   │   │   └── deposit-notification/route.ts
│   │   ├── admin/
│   │   │   ├── deposit-confirmed/route.ts
│   │   │   └── transactions/route.ts
│   │   └── cron/
│   │       └── cleanup-transactions/route.ts
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
├── __tests__/
│   └── validators.test.ts
├── middleware.ts
├── env.example
└── .env.local (NÃO VERSIONE)
```

---

## Começar Implementação

### Passo 1: Leia ARCHITECTURE_DIAGRAM.md
Entenda como tudo funciona junto.

### Passo 2: Siga IMPLEMENTATION_GUIDE.md
Crie a estrutura de pastas e arquivos.

### Passo 3: Copie de TYPESCRIPT_EXAMPLES.md
Implemente cada módulo seguindo a ordem.

### Passo 4: Consulte API_ROUTES_EXAMPLES.md
Para detalhes de cada implementação.

### Passo 5: Teste Localmente
Use os exemplos de curl em IMPLEMENTATION_GUIDE.md.

---

## Conformidade Regulatória

Este sistema foi projetado para estar em conformidade com:

- **Lei 9.613/1998** (Prevenção à Lavagem de Dinheiro)
  - KYC obrigatório via Proteo
  - Validação de CPF
  - Retenção de dados por 5 anos

- **Circular BC 3.978/2020**
  - Abordagem baseada em risco
  - Monitoramento contínuo via Proteo
  - Dados obrigatórios coletados

- **LGPD (Lei Geral de Proteção de Dados)**
  - Coleta apenas dados necessários
  - Consentimento informado
  - Direito à exclusão respeitado
  - Criptografia de dados sensíveis

---

## Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "SUPABASE_SERVICE_ROLE_KEY não configurado" | Verifique .env.local e reinicie servidor |
| "Unauthorized" em webhooks | Verifique se secret da Proteo está correto |
| Rate limiting não funciona | Use Upstash em produção, in-memory em dev |
| CORS bloqueando | Adicione origem em ALLOWED_ORIGINS |
| Transações não salvam | Verifique RLS no Supabase |
| JWT expirado | Implemente refresh token |

---

## Próximos Passos Recomendados

1. Implementar autenticação completa (login/logout)
2. Adicionar refresh tokens
3. Implementar 2FA para admins
4. Testes automatizados (Jest)
5. CI/CD pipeline (GitHub Actions)
6. Monitoring (Sentry, DataDog)
7. Painel administrativo frontend
8. Notificações SMS/Email adicionais
9. Análise de conformidade regulatória
10. Testes de penetração

---

## Contato e Suporte

Se tiver dúvidas:
1. Consulte os documentos em ordem
2. Verifique exemplos de código
3. Teste localmente com curl
4. Monitore logs no Supabase

---

## Versão da Documentação

**Versão:** 1.0
**Data:** Novembro 2024
**Status:** Pronto para Implementação

---

**Bom desenvolvimento! 🚀**
