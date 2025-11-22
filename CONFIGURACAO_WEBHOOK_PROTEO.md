# 🔗 Configuração do Webhook Proteo

## Informações para Adicionar no Painel do Proteo

### 📍 URL do Webhook

```
https://hubp2p.com/api/proteo/webhook?secret=2e6c1508e42ee764beafac09c08ccd1234e0ae7da1b98d787a4e3e2ad429f7ae
```

### 🔐 Autenticação

O webhook aceita autenticação de duas formas (use a que o Proteo suportar):

**Opção 1 (Preferencial)**: Header de Autorização

```
Authorization: Bearer 2e6c1508e42ee764beafac09c08ccd1234e0ae7da1b98d787a4e3e2ad429f7ae
```

**Opção 2 (Fallback)**: Query Parameter

```
?secret=2e6c1508e42ee764beafac09c08ccd1234e0ae7da1b98d787a4e3e2ad429f7ae
```

### 📤 Método HTTP

```
POST
```

### 📋 Formato do Payload (JSON)

O webhook é **extremamente flexível** e aceita várias estruturas de dados. Envie no mínimo o **status** e uma forma de **identificar o usuário**.

#### Exemplo Simples (Mínimo Necessário)

```json
{
  "status": "approved",
  "document": "12345678900"
}
```

#### Exemplo Completo (Recomendado)

```json
{
  "status": "approved",
  "proteo_verification_id": "3c35bb87-0b04-4130-a026-e4ee9f8ce2c4",
  "document": "12345678900",
  "user_id": "uuid-do-usuario-supabase",
  "timestamp": "2025-11-21T10:30:00Z"
}
```

#### Exemplo com Estrutura Aninhada (Também Aceito)

```json
{
  "event": {
    "type": "kyc_completed",
    "status": "approved",
    "user_id": "uuid-do-usuario-supabase",
    "document": "12345678900"
  },
  "background_check_id": "3c35bb87-0b04-4130-a026-e4ee9f8ce2c4"
}
```

### 📊 Campos Aceitos pelo Webhook

#### Status do KYC (OBRIGATÓRIO)

O webhook procura o status em qualquer um destes campos:

- `status`
- `event.status`
- `kyc_status`

Valores aceitos para **aprovado**:

- `approved`, `aprovado`, `success`, `ok`

Valores aceitos para **rejeitado**:

- `rejected`, `rejeitado`, `reproved`, `failed`

Valores aceitos para **em análise**:

- `in_review`, `in-review`, `review`, `em_analise`, `em-analise`, `analysing`

Valores aceitos para **pendente**:

- `pending`, `pendente`, `waiting`

#### Identificadores do Usuário (enviar pelo menos UM)

**Opção 1 - User ID do Supabase** (mais confiável):

- `user_id`
- `supabase_user_id`
- `event.user_id`

**Opção 2 - ID de Verificação do Proteo**:

- `proteo_verification_id`
- `verification_id`
- `background_check_id`
- `kyc_id`
- `id`

**Opção 3 - CPF do Usuário**:

- `document`
- `cpf`
- `event.document`

### 🎯 Eventos que Devem Disparar o Webhook

Configure o webhook para ser chamado quando:

1. ✅ **KYC é aprovado** (`status: approved`)
2. ❌ **KYC é rejeitado** (`status: rejected`)
3. 🔄 **Status muda para "em análise"** (`status: in_review`)
4. ⏸️ **Status muda para "pendente"** (`status: pending`)

**IMPORTANTE**: O webhook deve ser chamado **automaticamente** quando o Proteo finaliza a análise dos documentos, NÃO quando o usuário completa o preenchimento do formulário.

### 🧪 Como Testar

1. **Teste Manual no Painel do Proteo**:
   - Use o botão "Testar Webhook" se disponível
   - Verifique se retorna `{"success": true}`

2. **Teste com cURL**:

```bash
curl -X POST https://hubp2p.com/api/proteo/webhook?secret=2e6c1508e42ee764beafac09c08ccd1234e0ae7da1b98d787a4e3e2ad429f7ae \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "document": "12345678900",
    "proteo_verification_id": "3c35bb87-0b04-4130-a026-e4ee9f8ce2c4"
  }'
```

3. **Resposta Esperada**:

```json
{
  "success": true
}
```

### ❌ Possíveis Erros

#### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**Solução**: Verifique se o secret está correto.

#### 400 Bad Request - Status Inválido

```json
{
  "success": false,
  "error": "Missing or invalid KYC status"
}
```

**Solução**: Certifique-se de enviar um status válido (approved, rejected, in_review, pending).

#### 400 Bad Request - Usuário Não Encontrado

```json
{
  "success": false,
  "error": "Unable to resolve user_id. Send user_id or a known proteo_verification_id."
}
```

**Solução**: Envie pelo menos um identificador válido (user_id, proteo_verification_id, ou CPF).

### 🔒 Segurança

- ✅ O webhook valida o secret antes de processar qualquer dado
- ✅ Apenas requisições autenticadas são processadas
- ✅ O webhook usa Supabase Service Role (admin) para atualizar dados
- ✅ Todas as operações são logadas para auditoria

### 📝 O Que o Webhook Faz

Quando recebe uma requisição válida:

1. ✅ Valida o secret de autenticação
2. 🔍 Identifica o usuário (por user_id, proteo_verification_id, ou CPF)
3. 💾 Atualiza/cria registro na tabela `kyc_verifications`
4. 👤 Atualiza o campo `kyc_status` na tabela `profiles`
5. 📅 Define `kyc_completed_at` se status for `approved`
6. ✅ Retorna `{"success": true}`

### 🆘 Suporte

Se o webhook não funcionar após configuração:

1. Verifique os logs do Proteo para ver se está enviando requisições
2. Verifique os logs do Railway/Vercel para ver se está recebendo
3. Confirme se o secret está correto em ambos os lados
4. Teste com cURL para isolar problemas

---

**Última atualização**: 2025-11-21
**Ambiente**: Produção (https://hubp2p.com)
