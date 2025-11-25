# Templates de Email - HubP2P

Este diretorio contem os templates de email para o HubP2P.

## Templates Disponiveis

1. **welcome.html** - Email de boas-vindas/confirmacao de cadastro
2. **reset-password.html** - Email de recuperacao de senha

## Como Configurar no Supabase

### 1. Acesse o Painel do Supabase

1. Va para [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto (p2p)
3. No menu lateral, clique em **Authentication**
4. Clique na aba **Email Templates**

### 2. Configurar Template de Confirmacao (Welcome)

1. Selecione **Confirm signup** no dropdown
2. Copie o conteudo de `welcome.html`
3. Cole no campo **Body**
4. No campo **Subject**, coloque: `Bem-vindo ao HubP2P - Confirme seu email`
5. Clique em **Save**

### 3. Configurar Template de Reset de Senha

1. Selecione **Reset password** no dropdown
2. Copie o conteudo de `reset-password.html`
3. Cole no campo **Body**
4. No campo **Subject**, coloque: `Redefinir sua senha - HubP2P`
5. Clique em **Save**

## Variaveis Disponiveis nos Templates

O Supabase disponibiliza as seguintes variaveis que podem ser usadas nos templates:

| Variavel                 | Descricao                                          |
| ------------------------ | -------------------------------------------------- |
| `{{ .ConfirmationURL }}` | URL completa para confirmar email ou resetar senha |
| `{{ .Token }}`           | Token de confirmacao (6 digitos)                   |
| `{{ .TokenHash }}`       | Hash do token                                      |
| `{{ .Email }}`           | Email do usuario                                   |
| `{{ .SiteURL }}`         | URL do site (configurada nas settings)             |
| `{{ .RedirectTo }}`      | URL de redirecionamento apos confirmacao           |

## Configurar SMTP Personalizado (Recomendado para Producao)

O Supabase tem um limite de 4 emails por hora no plano gratuito. Para producao, configure um SMTP personalizado:

### Opcao 1: Resend (Recomendado)

1. Crie uma conta em [resend.com](https://resend.com)
2. Verifique seu dominio (hubp2p.com)
3. Gere uma API Key
4. No Supabase, va em **Project Settings** > **Auth** > **SMTP Settings**
5. Configure:
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Password: `sua_api_key`
   - Sender email: `noreply@hubp2p.com`

### Opcao 2: SendGrid

1. Crie uma conta em [sendgrid.com](https://sendgrid.com)
2. Verifique seu dominio
3. Gere uma API Key
4. Configure SMTP:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - User: `apikey`
   - Password: `sua_api_key`

### Opcao 3: AWS SES

1. Configure o SES na AWS
2. Verifique seu dominio
3. Gere credenciais SMTP
4. Configure no Supabase

## Testando os Emails

1. Crie uma conta de teste no HubP2P
2. Verifique se o email de confirmacao chegou
3. Teste a recuperacao de senha clicando em "Esqueci minha senha"
4. Verifique se o email de reset chegou

## Personalizacao

Os templates usam:

- Cores da marca HubP2P (azul #2563eb, roxo #7c3aed)
- Gradientes para o header e botoes
- Layout responsivo para mobile
- Tipografia clara e legivel

Para alterar as cores ou layout, edite os arquivos HTML e atualize no Supabase.
