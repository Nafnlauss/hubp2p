# Deployment Checklist & Troubleshooting

Guia prático para deployment seguro e resolução de problemas comuns.

---

## Pre-Deployment Checklist

### 1. Preparação (1-2 dias antes)

- [ ] Revisar todas as mudanças de código
- [ ] Verificar se há breaking changes no banco de dados
- [ ] Preparar scripts de migration
- [ ] Testar migrations em ambiente local
- [ ] Criar plano de rollback
- [ ] Notificar stakeholders sobre janela de deploy
- [ ] Garantir que time está disponível para monitorar

### 2. Code Review

- [ ] Mínimo 2 aprovações de code review
- [ ] Nenhum comentário aberto
- [ ] Todos os testes passando
- [ ] Sem linting errors
- [ ] Sem TypeScript errors
- [ ] Nenhum `console.log()` deixado no código
- [ ] Nenhum secret/token hardcoded

### 3. Testing

- [ ] Unit tests passando
- [ ] Integration tests passando (se aplicável)
- [ ] E2E tests passando (se aplicável)
- [ ] Smoke tests em staging passando
- [ ] Performance tests dentro dos limites
- [ ] Load testing concluído (se relevante)

### 4. Database

- [ ] Migrations criadas e testadas
- [ ] Rollback scripts criados
- [ ] Backup do banco de dados agendado
- [ ] Plano de downtime comunicado (se necessário)
- [ ] Migrations executadas com sucesso em staging

### 5. Configuration

- [ ] Todas as environment variables configuradas no Vercel
- [ ] URLs apontam para os ambientes corretos
- [ ] Nenhum secret exposto em código
- [ ] `.env.example` atualizado (sem valores reais)
- [ ] Certificados SSL válidos
- [ ] CORS configurado corretamente

### 6. Deployment Mechanics

- [ ] Vercel project conectado ao GitHub
- [ ] Webhooks do Vercel configurados
- [ ] Health check endpoint funcionando
- [ ] Logs centralizados (Sentry, CloudWatch, etc.)
- [ ] Monitoring e alertas ativos
- [ ] Slack/Email notifications configuradas

### 7. Security

- [ ] Não há dados sensíveis em logs
- [ ] Não há dados de teste em produção
- [ ] Rate limiting configurado
- [ ] CORS headers corretos
- [ ] Security headers configurados (HSTS, CSP, etc.)
- [ ] Validação de input em todas as APIs
- [ ] HTTPS enforçado em produção

### 8. Documentation

- [ ] Runbook de deployment documentado
- [ ] Troubleshooting guide atualizado
- [ ] Versão do app documentada
- [ ] Changelog atualizado
- [ ] Team briefing completado

---

## Pre-Deployment Day Checklist

### Morning of Deployment

```bash
# 08:00 - Verificação inicial
[ ] Pull latest changes from main/develop
[ ] Verificar status do GitHub Actions
[ ] Verificar status do Vercel
[ ] Verificar Slack/comunicação do time
[ ] Fazer login em todos os dashboards necessários

# 09:00 - Teste final
[ ] npm run build localmente
[ ] npm run lint
[ ] npm run test
[ ] Health check em staging
[ ] Testar principais features em staging

# 10:00 - Comunicação
[ ] Notificar via Slack que deployment será iniciado
[ ] Ter time de on-call disponível
[ ] Ter plano de rollback pronto
[ ] Ter runbook aberto
```

---

## Deployment Day - Step by Step

### Fase 1: Pre-Deployment (30 min antes)

```
[ ] Confirmar que ninguém está fazendo push para main/develop
[ ] Fazer pull da branch mais recente
[ ] Verificar logs recentes do Sentry - nenhum erro crítico
[ ] Confirmar disponibilidade do time
```

### Fase 2: Migration (se aplicável)

```bash
# Executado automaticamente via GitHub Actions, mas verificar:
[ ] Migration iniciada
[ ] Monitorar progresso
[ ] Verificar rollback plan pronto
```

### Fase 3: Build & Deploy

```
[ ] GitHub Actions job iniciado automaticamente
[ ] Acompanhar logs do build
[ ] Se houver erro, cancelar e investigar
[ ] Verificar Vercel deployment iniciado
```

### Fase 4: Verification (20-30 min)

```bash
# Health checks
[ ] curl https://api.p2p.app/api/health -> 200 OK
[ ] Verificar response time (< 1s ideal)
[ ] Verificar logs - nenhum erro

# Feature testing
[ ] Login funciona
[ ] Dashboard carrega
[ ] Transactions carregam
[ ] Profile page funciona
```

### Fase 5: Monitoring (próximas 1-2 horas)

```
[ ] Monitorar Sentry para erros
[ ] Verificar logs em real-time
[ ] Monitorar CPU/Memory em Vercel
[ ] Monitorar taxa de erro da API
[ ] Verificar feedback do usuário no Slack
```

---

## Common Issues & Troubleshooting

### Build Failures

#### Erro: "npm ERR! code ERESOLVE"

```bash
# Solução 1: Usar legacy peer deps
npm install --legacy-peer-deps

# Solução 2: Limpar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Solução 3: Atualizar package.json
npm update
```

No `vercel.json` ou `package.json`:
```json
{
  "installCommand": "npm ci --legacy-peer-deps"
}
```

#### Erro: "NEXT_PUBLIC_* variable is undefined"

```typescript
// Verificar que as variáveis estão em Vercel Dashboard
// Settings → Environment Variables

// Ou fazer pull local
vercel env pull

// Verificar .env.local
cat .env.local | grep NEXT_PUBLIC_
```

#### Erro: "Build exceeds max duration"

```javascript
// next.config.js - Otimizar build
const nextConfig = {
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false, // Desabilitar source maps em prod
  experimental: {
    // Ativar otimizações experimentais se necessário
  }
}
```

---

### Database Issues

#### Erro: "Connection timeout"

```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão
psql $DATABASE_URL -c "SELECT 1"

# Verificar IP whitelisting se usar Cloud SQL/RDS
# Adicionar IP do Vercel em Security Groups
```

#### Erro: "Migration already applied"

```sql
-- Verificar tabela de migrations
SELECT * FROM migrations ORDER BY executed_at DESC;

-- Se migration ficar em estado inconsistente
UPDATE migrations SET status = 'rollback_applied'
WHERE name = 'problema_migration'
AND status = 'failed';
```

#### Erro: "Foreign key constraint violated"

```sql
-- Verificar referências antes da migration
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';

-- Ou verificar dados que causam o problema
SELECT * FROM tabela_child
WHERE parent_id NOT IN (SELECT id FROM tabela_parent);
```

---

### Deployment Issues

#### Health Check Failing

```bash
# Verificar endpoint diretamente
curl -v https://api.p2p.app/api/health

# Verificar status da aplicação
curl -I https://api.p2p.app

# Verificar logs em Vercel
vercel logs https://p2p-app.vercel.app

# Verificar logs em Sentry
# Dashboard Sentry → Issues
```

#### Slow Response Times

```bash
# Medir performance
curl -w "@scripts/curl-format.txt" -o /dev/null -s https://api.p2p.app/

# Arquivo: scripts/curl-format.txt
time_namelookup:  %{time_namelookup}s\n
time_connect:     %{time_connect}s\n
time_appconnect:  %{time_appconnect}s\n
time_pretransfer: %{time_pretransfer}s\n
time_redirect:    %{time_redirect}s\n
time_starttransfer: %{time_starttransfer}s\n
time_total:       %{time_total}s\n
```

#### Out of Memory

```javascript
// next.config.js - Reduzir uso de memória
const nextConfig = {
  // Desabilitar cache agressivo
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hora
    pagesBufferLength: 5,
  },
  // Reduzir build parallelism
  experimental: {
    // disableOptimizedPackageImports: true,
  }
}
```

---

### API/Service Issues

#### Erro: "Service Unavailable (503)"

```typescript
// Verificar se backend está up
// 1. Verificar health check do backend
// 2. Verificar se há circuit breaker ativado
// 3. Verificar se há rate limiting ativado

// Em app/api/check-services/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const services = {
    proteo: await checkProteo(),
    database: await checkDatabase(),
    redis: await checkRedis(),
  };

  return NextResponse.json(services);
}

async function checkProteo() {
  try {
    const response = await fetch('https://api.proteo.com.br/health', {
      timeout: 5000,
    });
    return { status: response.ok ? 'ok' : 'error' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

#### Erro: "Authentication failed"

```bash
# Verificar JWT_SECRET
[ "$JWT_SECRET" != "" ] && echo "JWT_SECRET is set"

# Testar token
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.p2p.app/api/user

# Se houver erro de signature
# Verificar se JWT_SECRET mudou entre deployments
```

---

### Network/Connectivity Issues

#### CORS Errors

```typescript
// Verificar CORS headers em next.config.ts
const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: process.env.NEXT_PUBLIC_API_URL,
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET,POST,PUT,DELETE,OPTIONS',
        },
      ],
    },
  ],
};

// Ou em route handler
export async function OPTIONS(request: Request) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
```

#### SSL Certificate Issues

```bash
# Verificar certificado
openssl s_client -connect api.p2p.app:443

# Ou usar curl
curl -vI https://api.p2p.app/

# Renovar certificado (Vercel faz automaticamente)
# Mas verificar em Vercel Dashboard → Settings → Domains
```

---

### Monitoring & Alerts

#### Sentry Integration Issues

```typescript
// Verificar se Sentry está inicializado
import * as Sentry from "@sentry/nextjs";

// Em src/instrumentation.ts
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      // ...
    });
  }
}

// Testar error tracking
throw new Error('Test error from deployment');
```

---

## Rollback Decision Tree

```
┌─ Deployment completado?
│  ├─ NÃO → Cancelar e investigar erro de build
│  └─ SIM ↓
│
┌─ Health checks passando?
│  ├─ NÃO → Esperar 5 min e retry
│  │        └─ Ainda falha? → ROLLBACK IMEDIATO
│  └─ SIM ↓
│
┌─ Nenhum erro crítico em Sentry?
│  ├─ Erros críticos detectados? → ROLLBACK IMEDIATO
│  └─ SIM ↓
│
┌─ Response time aceitável?
│  ├─ NÃO → Aguardar ou ROLLBACK
│  └─ SIM ↓
│
└─ DEPLOYMENT SUCESSO
```

---

## Rollback Procedure

### Rollback Manual via Vercel

```bash
# 1. Listar deployments recentes
vercel list

# 2. Promover deployment anterior
vercel rollback

# 3. Ou promover específico
vercel promote DEPLOYMENT_ID
```

### Rollback via GitHub Actions

```bash
# Ir para Actions no GitHub
# → Find "Rollback Production" workflow
# → Click "Run workflow"
# → Input deployment ID
# → Executar

# Ou via CLI
gh workflow run rollback-production.yml -f deployment-id=123456
```

### Rollback Database Manual

```bash
# 1. Conectar ao banco
psql $PRODUCTION_DATABASE_URL

# 2. Verificar status de migrations
SELECT * FROM migrations ORDER BY executed_at DESC LIMIT 5;

# 3. Executar rollback script
\i src/database/migrations/YYYYMMDD_nome.rollback.sql

# 4. Verificar se sucesso
SELECT COUNT(*) FROM tabela_importante;
```

---

## Post-Deployment Checklist

### Imediatamente após (30 min)

```
[ ] Todos os health checks verdes
[ ] Sentry sem erros críticos
[ ] Performance dentro dos limites
[ ] Logins funcionando
[ ] Transações processando
[ ] Webhooks recebendo eventos
[ ] Email/SMS sendo enviados
```

### 1 Hora após

```
[ ] Nenhum spike em erros
[ ] Nenhum spike em latência
[ ] Usuários não reportando problemas
[ ] Database connections normais
[ ] Cache hitrate normal
[ ] Nenhum memory leak visível
```

### 24 Horas após

```
[ ] Nenhum erro recorrente
[ ] Performance estável
[ ] Nenhum problema identificado
[ ] Todos os features funcionando
[ ] Documentação atualizada
[ ] Retrospectiva se houve issues
```

---

## Incident Response

### Se algo deu errado durante deployment

```
IMEDIATO (< 5 min):
1. [ ] Ativar alert no Slack
2. [ ] Chamar tech lead
3. [ ] Avaliar se é rollback case
4. [ ] Se SIM → Executar rollback immediately
5. [ ] Se NÃO → Comece investigação

INVESTIGAÇÃO (próximos 15 min):
1. [ ] Coletar logs de erro
2. [ ] Identificar padrão
3. [ ] Entender scope do problema
4. [ ] Determinar customer impact
5. [ ] Comunicar via Slack/Status Page

RESOLUÇÃO (próximas 1-2 horas):
1. [ ] Implementar fix
2. [ ] Testar fix localmente
3. [ ] Deploy em staging
4. [ ] Deploy em produção
5. [ ] Verificar que problema foi resolvido
6. [ ] Documentar root cause

POST-INCIDENT:
1. [ ] Criar post-mortem
2. [ ] Identificar lessons learned
3. [ ] Criar action items
4. [ ] Comunicar ao time
```

---

## Useful Commands

```bash
# Vercel
vercel logs [URL]                    # Ver logs em real-time
vercel env pull                       # Pull environment vars
vercel deploy --prod                  # Deploy manual produção
vercel rollback                       # Rollback para versão anterior
vercel list                           # Listar deployments

# GitHub
gh workflow run ci.yml                # Trigger workflow
gh deployment list                    # Listar deployments
gh secret set VAR_NAME --body "value" # Set secret

# Git
git log --oneline -n 20               # Ver commits recentes
git diff main develop                 # Ver diferenças entre branches
git tag -l                            # Listar tags/versions

# Health Check
curl -vI https://api.p2p.app/api/health
watch -n 2 curl https://api.p2p.app/api/health

# Database
psql $DATABASE_URL -c "SELECT 1"      # Testar conexão
psql $DATABASE_URL -c "SELECT version();"  # Ver versão PostgreSQL
```

---

## Escalation

### Critical Issues

```
Nível 1: Desenvolvedor responsável pelo PR
Nível 2: Tech Lead / Senior Developer
Nível 3: CTO / Engineering Manager
```

### Contact Info (atualizar conforme necessário)

```
Tech Lead: [slack/@user]
On-Call: [slack channel]
Database Admin: [slack/@user]
Ops/DevOps: [slack/@user]
Emergency: [phone]
```

---

## Post-Deployment Report Template

```markdown
## Deployment Report - [DATE]

### Summary
- Deployment started: [TIME]
- Deployment completed: [TIME]
- Duration: [X minutes]
- Status: ✅ Success / ❌ Rollback

### Changes
- [List of major changes]
- Database migrations: [Y/N]
- Breaking changes: [Y/N]

### Metrics
- Build time: [X seconds]
- Health check time: [X seconds]
- Response time post-deploy: [X ms]
- Error rate: [X%]

### Issues & Resolutions
- [If any issues occurred]

### Monitoring
- Sentry errors: [X] (normal baseline: [Y])
- User complaints: [X]
- Performance degradation: [Y/N]

### Approvals
- Deployed by: [@user]
- Verified by: [@user]
- Approved by: [@user]

### Notes
- [Any other relevant information]
```

---

**Versão**: 1.0.0
**Atualizado**: Novembro 2025
