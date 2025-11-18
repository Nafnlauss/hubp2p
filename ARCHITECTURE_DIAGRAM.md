# Arquitetura e Fluxos - API Routes P2P

Diagramas visuais e fluxos dos processos principais.

---

## 1. Arquitetura Geral do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Cadastro    │  │  KYC Upload  │  │  Depósito    │          │
│  │  & Dados     │  │  (Selfie +   │  │  (PIX/TED)   │          │
│  │  Básicos     │  │   Docs)      │  │  & Timer     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.js API Routes (Backend)                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Middleware de Segurança                        │  │
│  │  • CORS validation  • Rate Limiting  • Auth Verification │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Route Handlers (/api)                           │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ /kyc/verify │  │/transactions│  │ /webhooks   │      │  │
│  │  │             │  │   /create   │  │             │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  Validação Input + Rate Limit + Verificação Sig │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Integrações com APIs Externas                  │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │   Proteo     │  │   Pushover   │  │   Supabase   │   │  │
│  │  │   (KYC)      │  │ (Notificaçõs)│  │   (DB)       │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
        ┌─────────────┐  ┌──────────┐  ┌──────────┐
        │   Proteo    │  │ Pushover │  │ Supabase │
        │   Servers   │  │  Servers │  │  (PG)    │
        └─────────────┘  └──────────┘  └──────────┘
```

---

## 2. Fluxo Completo: Cadastro até Envio de Cripto

```
USUÁRIO                    BACKEND API                  PROTEO          PUSHOVER        SUPABASE
   │                            │                         │                 │               │
   ├─ Preenchimento Dados ─────>│                         │                 │               │
   │                            │                         │                 │               │
   │                    POST /api/kyc/verify              │                 │               │
   │<──── Validação Input ──────┤                         │                 │               │
   │<──── Rate Limit Check ─────┤                         │                 │               │
   │                            │                         │                 │               │
   │                    ┌─────────── Enviar KYC ────────>│                 │               │
   │                    │         (CPF + Docs)           │                 │               │
   │                    │                                 │                 │               │
   │<─── ID Verificação ────────│<───── Retorna ID ──────│                 │               │
   │<── "Pendente" Status ──────┤                         │                 │               │
   │                            │                         │                 │               │
   │                            │      Webhook Proteo     │                 │               │
   │                            │<────────────────────────│                 │               │
   │                            │ (Aprovado/Rejeitado)    │                 │               │
   │                            ├─ Atualizar Status ─────────────────────────────────────>│
   │                            │                         │                 │               │
   │<── "Aprovado" Status ──────┤                         │                 │               │
   │                            │                         │                 │               │
   ├─ Escolhe: PIX/TED ────────>│                         │                 │               │
   ├─ Valor + Blockchain ──────>│ POST /api/trans/create  │                 │               │
   │                            │                         │                 │               │
   │<─ Gera Transação ID ───────┤─ Validação ────────────────────────────────────────────>│
   │<─ QR Code / Dados ─────────┤─ Insere TX ────────────────────────────────────────────>│
   │<─ Timer 40 min ────────────┤                         │                 │               │
   │                            │                         │                 │               │
   ├─ Faz PIX/TED ─────────────>│ [Aguardando]            │                 │               │
   │                            │                         │                 │               │
   ├─ Confirma Depósito ──────>│ POST /webhooks/notify   │                 │               │
   │                            │                         │                 │               │
   │                    ┌─────────────────────────────────────────── Envia Notificação ──>│
   │                    │                                 │                 │               │
   │                    │                            [OPERADOR RECEBE ALERTA NO CELULAR]   │
   │                    │                                 │                 │               │
   │                    └─ Atualiza Status ──────────────────────────────────────────────>│
   │<─ "Aguardando Confirmação" ┤                         │                 │               │
   │                            │                         │                 │               │
   │ [OPERADOR ACESSA PAINEL]   │                         │                 │               │
   │                            │ PUT /admin/confirm      │                 │               │
   │                    ┌───────>│ (Verifica no Banco)    │                 │               │
   │                    │        ├─ Atualiza Status ─────────────────────────────────────>│
   │                    │        │                         │                 │               │
   │                    │        ├─ Log Auditoria ────────────────────────────────────────>│
   │                    │        │                         │                 │               │
   │                    │        │ [Envia cripto]          │                 │               │
   │                    │        │                         │                 │               │
   │                    │        ├─ Marca "Enviado" ─────────────────────────────────────>│
   │<─ "Enviado" Status ────────┤                         │                 │               │
   │<─ TX Completa ─────────────┤                         │                 │               │
   │                            │                         │                 │               │
```

---

## 3. Fluxo de Segurança - Verificação de Webhook

```
┌─────────────────────────────────────┐
│   Webhook da Proteo (https)         │
│                                     │
│  Body: {...payload...}              │
│  Header: x-proteo-signature: xxxxx  │
│  Header: x-signature-timestamp: TTT │
└──────────────────┬──────────────────┘
                   │
                   ▼
        ┌─────────────────────────┐
        │  API Route Handler      │
        │  /api/webhooks/proteo   │
        └─────────────────────────┘
                   │
                   ▼
        ┌─────────────────────────────────┐
        │  Função de Verificação          │
        │  extractAndVerifySignature()    │
        └─────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌─────────┐         ┌─────────────────┐
   │ Extrai  │         │  Gera HMAC com  │
   │ Signatu │         │  PROTEO_WEBHOOK │
   │ re do   │         │  _SECRET        │
   │ header  │         └─────────────────┘
   └─────────┘              │
        │                   ▼
        │          ┌──────────────────┐
        │          │ Compara Timing   │
        │          │ Safe (Buffer)    │
        │          └──────────────────┘
        │                   │
        └───────┬───────────┘
                │
        ┌───────▼──────────┐
        │  Assinatura OK?  │
        └───────┬──────────┘
                │
        ┌───────┴──────────┐
        │                  │
    NÃO │                  │ SIM
        │                  │
        ▼                  ▼
   ┌─────────┐      ┌─────────────────┐
   │ Retorna │      │ Processa Evento │
   │ 401     │      │ e Atualiza DB   │
   └─────────┘      └─────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Retorna 200 │
                    │ (Success)   │
                    └─────────────┘
```

---

## 4. Fluxo de Rate Limiting

```
┌─────────────────────────────────────┐
│    Requisição Entra na API          │
│                                     │
│  GET /api/kyc/verify               │
│  From IP: 192.168.1.100            │
└──────────────────┬──────────────────┘
                   │
                   ▼
        ┌─────────────────────────┐
        │ Middleware Check        │
        │ Extrai IP               │
        └──────────────┬──────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Rate Limit Store (Redis ou   │
        │ In-Memory)                   │
        │                              │
        │ Map: {                       │
        │   "kyc:192.168.1.100": [     │
        │     timestamp1,              │
        │     timestamp2               │
        │   ]                          │
        │ }                            │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Verificar:                   │
        │ - Remove timestamps antigos  │
        │ - Conta requisições válidas  │
        │ - Compara com limite (10/min)│
        └──────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
    > Limite │                     <= Limite
        │                             │
        ▼                             ▼
   ┌─────────────┐         ┌────────────────┐
   │ Retorna 429 │         │ Permite Request│
   │ (Too Many)  │         │ Incrementa     │
   │             │         │ timestamp[]    │
   │ X-Remaining │         └────────────────┘
   │ = 0         │                │
   └─────────────┘                ▼
                          ┌────────────────┐
                          │ Processa Request│
                          │ Adiciona Header │
                          │ X-Remaining: 7  │
                          └────────────────┘
```

---

## 5. Estrutura de Dados - Transação

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRANSACTION (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  id: "TX-1732289432-a4f2b3c"  ◄── Único, gerado no backend     │
│  user_id: "550e8400-e29b"      ◄── Vinculado ao usuário         │
│  amount: 500.00                ◄── Valor em reais               │
│  method: "pix"                 ◄── "pix" ou "ted"               │
│  blockchain: "ethereum"        ◄── Qual blockchain              │
│  wallet_address: "0x1234..."   ◄── Carteira de recebimento      │
│                                                                  │
│  Status: "pending"             ◄── Ciclo de vida:               │
│                                    1. pending (aguardando)      │
│                                    2. awaiting_confirmation      │
│                                    3. payment_received           │
│                                    4. sending                    │
│                                    5. sent (completo)           │
│                                    X. expired (timeout)         │
│                                    X. cancelled (cancelada)     │
│                                                                  │
│  pix_data: {                   ◄── Dados para PIX (se aplicável)
│    "pixKey": "chave@empresa",                                   │
│    "qrCode": "...base64...",                                    │
│    "copyPaste": "00020126..."                                   │
│  }                                                               │
│                                                                  │
│  ted_data: {                   ◄── Dados para TED (se aplicável)
│    "bankCode": "001",                                           │
│    "accountNumber": "0000001",                                  │
│    "accountDigit": "9",                                         │
│    "cpf": "00000000000"                                         │
│  }                                                               │
│                                                                  │
│  created_at: "2024-11-22T14:30:00Z"                             │
│  updated_at: "2024-11-22T14:35:00Z"                             │
│  expires_at: "2024-11-22T15:10:00Z"  ◄── 40 minutos após criação│
│  customer_confirmed_at: "2024-11-22T14:45:00Z"                  │
│  confirmed_by: "admin-uuid"                                     │
│  confirmed_at: "2024-11-22T14:50:00Z"                           │
│  sent_at: "2024-11-22T15:00:00Z"                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Fluxo de Autenticação JWT

```
┌─────────────────────────────────────────┐
│   Usuário Faz Login                     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ Valida Credenciais           │
        │ (Supabase Auth ou Custom)    │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Cria Payload JWT             │
        │                              │
        │ {                            │
        │   userId: "uuid",            │
        │   email: "user@email.com",   │
        │   role: "user",              │
        │   iat: 1732289432,           │
        │   exp: 1732375832            │
        │ }                            │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Assina com JWT Secret        │
        │ (algorithm: HS256)           │
        │                              │
        │ token = "eyJhbGciOi..."      │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Retorna Token ao Cliente     │
        │                              │
        │ {                            │
        │   access_token: "...",       │
        │   expires_in: 86400,         │
        │   token_type: "Bearer"       │
        │ }                            │
        └──────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────┐
│  Cliente Envia Token em Próximas Requisições  │
│                                                │
│  Authorization: Bearer eyJhbGciOi...           │
└────────────────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Backend Recebe Requisição    │
        │ Extrai Token do Header       │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ verifyAuth(token)            │
        │                              │
        │ - Valida Signature           │
        │ - Verifica Expiração         │
        │ - Decodifica Payload         │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┴────────────────┐
        │                               │
    Inválido │                       Válido
        │                               │
        ▼                               ▼
   ┌─────────┐                 ┌──────────────────┐
   │ 401     │                 │ Acessa payload   │
   │ Unauth  │                 │ userId/email/role│
   └─────────┘                 │                  │
                               │ Processa Request │
                               │ com autenticação │
                               └──────────────────┘
```

---

## 7. Stack de Segurança

```
┌──────────────────────────────────────────────────────────┐
│                   REQUEST CHEGANDO                        │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Middleware Global             │
        │ (middleware.ts)               │
        │                               │
        │ ✓ CORS validation             │
        │ ✓ Security Headers            │
        │ ✓ HSTS setup                  │
        │ ✓ XSS protection              │
        │ ✓ Clickjacking defense        │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Route Handler Específica      │
        │ (app/api/...)                 │
        │                               │
        │ ✓ Rate Limit Check            │
        │ ✓ Signature Verify (webhook)  │
        │ ✓ Auth Token Verify           │
        │ ✓ Input Validation            │
        │ ✓ Sanitization                │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ API External Call             │
        │ (Proteo, Pushover)            │
        │                               │
        │ ✓ HTTPS obrigatório           │
        │ ✓ Timeout config              │
        │ ✓ Error handling              │
        │ ✓ Signature generation        │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Database Operation            │
        │ (Supabase/PostgreSQL)         │
        │                               │
        │ ✓ Row Level Security (RLS)    │
        │ ✓ SQL Injection Prevention    │
        │ ✓ Prepared Statements         │
        │ ✓ User isolation              │
        │ ✓ Audit Logging               │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ Resposta Retorna ao Cliente   │
        │                               │
        │ ✓ Sem dados sensíveis         │
        │ ✓ Com CORS headers            │
        │ ✓ Com security headers        │
        │ ✓ Código de status correto    │
        └───────────────────────────────┘
```

---

## 8. Ciclo de Vida de uma Transação (Estado/Máquina)

```
                    ┌─────────────┐
                    │   CRIADA    │
                    │  "pending"  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         │          (40 minutos)             │
         │          Sem confirmação          │
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐    ┌────────────────┐   ┌─────────┐
    │ EXPIRADA│    │AGUARDANDO CONF.│   │ (outro) │
    │"expired"│    │"awaiting_conf" │   │         │
    └─────────┘    └────────┬───────┘   └─────────┘
         │                  │
         │                  ▼ Cliente confirma depósito
         │           ┌──────────────────────┐
         │           │ PAGTO CONFIRMADO     │
         │           │ "payment_received"   │
         │           └──────────┬───────────┘
         │                      │
         │                      ▼ Operador marca como recebido
         │                ┌──────────────┐
         │                │   ENVIANDO   │
         │                │  "sending"   │
         │                └──────┬───────┘
         │                       │
         │                       ▼ Operador marca como enviado
         │                ┌──────────────┐
         │                │    ENVIADA   │
         │                │    "sent"    │
         │                └──────────────┘
         │                       │
         │                       ▼ FIM NORMAL
         │
         └──────────────┬───────────────┐
                        │               │
                        ▼ AUTO-CANCEL   ▼ Cancelamento Manual
                   ┌──────────┐    ┌─────────────┐
                   │CANCELADA │    │ CANCELADA   │
                   │"cancelled│    │ "cancelled" │
                   └──────────┘    └─────────────┘
```

---

## 9. Modelo de Segurança - Layers

```
┌─────────────────────────────────────────────────────┐
│ 1. HTTPS/TLS                                        │
│    Criptografia em trânsito (transit)              │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ 2. CORS + Security Headers                         │
│    Prevenir requisições não autorizadas            │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ 3. Rate Limiting                                    │
│    DDoS protection, abuso prevention               │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ 4. Autenticação (JWT)                              │
│    Verificar identidade do usuário                 │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ 5. Autorização (RBAC)                              │
│    Verificar permissões (user vs admin vs operator)│
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ 6. Validação de Entrada                            │
│    Sanitizar e validar todos os dados              │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ 7. Verificação de Assinatura (Webhook)             │
│    HMAC SHA-256 para integridade                   │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ 8. Row Level Security (Database)                   │
│    Cada usuário vê só seus dados                   │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ 9. Criptografia em Repouso (at Rest)               │
│    CPF, dados sensíveis criptografados no DB       │
└─────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────┐
│ 10. Auditoria Completa                             │
│     Logs de todas ações por 5 anos (Lei 9.613)     │
└─────────────────────────────────────────────────────┘
```

---

## 10. Integração com Proteo - Fluxo Completo

```
┌────────────────┐
│  FRONTEND      │
│  KYC Form      │
└────────┬───────┘
         │
         │ POST /api/kyc/verify
         ├─ fullName: "João"
         ├─ cpf: "12345678901"
         ├─ birthDate: "1990-01-15"
         ├─ email: "joao@email.com"
         ├─ identityDocument: (base64)
         └─ selfie: (base64)
         │
         ▼
┌─────────────────────────────────┐
│  BACKEND (Next.js API Route)    │
│  POST /api/kyc/verify           │
│                                 │
│  ✓ Validação input              │
│  ✓ Rate limiting check          │
│  ✓ Formata dados                │
└────────────┬────────────────────┘
             │
             │ HTTPS POST
             │ https://api.proteo.com.br/v1/kyc/verify
             ├─ Authorization: Bearer PROTEO_API_KEY
             ├─ Content-Type: multipart/form-data
             ├─ Form: {...dados...}
             │
             ▼
    ┌──────────────────┐
    │  PROTEO API      │
    │                  │
    │  ✓ Valida CPF    │
    │  ✓ Antecedentes  │
    │  ✓ Sanções       │
    │  ✓ Extrai Selfie │
    └────────┬─────────┘
             │
             │ HTTPS Response
             ├─ verificationId: "proteo-xxx"
             ├─ status: "pending"
             ├─ riskLevel: "low"
             │
             ▼
┌─────────────────────────────────┐
│  BACKEND (salva dados)          │
│                                 │
│  ✓ Insere em kyc_verifications  │
│  ✓ Marca users como "pending"   │
│  ✓ Retorna verificationId       │
└────────────┬────────────────────┘
             │
             │ Response ao Cliente
             ├─ success: true
             ├─ verificationId: "proteo-xxx"
             └─ status: "pending"
             │
             ▼
┌──────────────────────────────────┐
│  CLIENTE AGUARDA                 │
│                                  │
│  Backend monitora webhook Proteo │
│  ou faz polling /kyc/status      │
└──────────────────────────────────┘
             │
             │ [HORAS DEPOIS]
             │
             │ Webhook Proteo enviado
             │ https://seu-site.com/api/webhooks/proteo
             │
             │ POST
             ├─ verificationId: "proteo-xxx"
             ├─ status: "approved"
             ├─ riskLevel: "low"
             └─ x-proteo-signature: "hmac-sha256"
             │
             ▼
┌──────────────────────────────────┐
│  WEBHOOK HANDLER                 │
│  POST /api/webhooks/proteo       │
│                                  │
│  ✓ Verifica Signature            │
│  ✓ Atualiza users.kyc_status     │
│  ✓ Libera criação de transações  │
│  ✓ Retorna 200 OK                │
└──────────────────────────────────┘
             │
             ▼
    ┌────────────────┐
    │  USUÁRIO AGORA │
    │  PODE COMPRAR  │
    │  CRIPTO!       │
    └────────────────┘
```

---

Esses diagramas ajudam a visualizar:
- Arquitetura geral do sistema
- Fluxos de requisição/resposta
- Camadas de segurança
- Estados das transações
- Integrações externas

Use como referência ao implementar!
