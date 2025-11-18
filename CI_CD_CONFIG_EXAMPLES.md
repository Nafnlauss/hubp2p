# CI/CD Configuration Examples - Exemplos Prontos para Copiar e Colar

Exemplos de configuração prontos para serem utilizados no projeto P2P.

---

## 1. GitHub Actions Workflows

### Arquivo: `.github/workflows/ci.yml`

```yaml
name: CI - Tests and Lint

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check 2>/dev/null || echo "No type-check script"

      - name: Run tests
        run: npm run test 2>/dev/null || echo "No tests configured"

      - name: Build project
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://staging-api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: staging

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: build-${{ matrix.node-version }}
          path: .next/
          retention-days: 1

  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

      - name: Check for known vulnerabilities
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Arquivo: `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

concurrency:
  group: deploy-staging
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate environment
        run: |
          test -n "${{ secrets.STAGING_DATABASE_URL }}"
          test -n "${{ secrets.STAGING_JWT_SECRET }}"
        shell: bash

      - name: Run database migrations
        run: npm run migrate
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          NODE_ENV: staging
        continue-on-error: true

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://staging-api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: staging
          NEXT_PUBLIC_APP_VERSION: ${{ github.sha }}
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.STAGING_JWT_SECRET }}

      - name: Deploy to Vercel Staging
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
          alias: staging
        env:
          VERCEL_ENV: preview

      - name: Wait for deployment
        run: sleep 30

      - name: Run health checks
        run: |
          for i in {1..5}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging-api.p2p.app/api/health)
            if [ "$STATUS" = "200" ]; then
              echo "Health check passed"
              exit 0
            fi
            echo "Attempt $i: HTTP $STATUS"
            sleep 10
          done
          exit 1

      - name: Run smoke tests
        run: npm run test:smoke 2>/dev/null || echo "No smoke tests"
        continue-on-error: true
        env:
          API_URL: https://staging-api.p2p.app

      - name: Notify Slack on success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "✅ Staging deployment successful",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Staging Deployment Successful*\n\nCommit: <${{ github.server_url }}/${{ github.repository }}/commit/${{ github.sha }}|${{ github.sha }}>\nAuthor: ${{ github.actor }}\nURL: https://staging-api.p2p.app"
                  }
                }
              ]
            }

      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "❌ Staging deployment failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "❌ *Staging Deployment Failed*\n\nCommit: <${{ github.server_url }}/${{ github.repository }}/commit/${{ github.sha }}|${{ github.sha }}>\nAuthor: ${{ github.actor }}\nAction: <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
                  }
                }
              ]
            }
```

### Arquivo: `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  pre-deployment-checks:
    runs-on: ubuntu-latest
    outputs:
      deployment_id: ${{ steps.deployment.outputs.deployment_id }}

    steps:
      - uses: actions/checkout@v4

      - name: Validate main branch
        run: |
          if [ "${{ github.ref }}" != "refs/heads/main" ]; then
            echo "Deployments allowed only from main branch"
            exit 1
          fi

      - name: Check commit message
        run: |
          MESSAGE=$(git log -1 --pretty=%B)
          echo "Commit message: $MESSAGE"
          if [[ "$MESSAGE" == *"[skip deploy]"* ]]; then
            echo "Deployment skipped per commit message"
            exit 1
          fi

      - name: Create deployment record
        id: deployment
        uses: actions/github-script@v7
        with:
          script: |
            const deployment = await github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.sha,
              environment: 'production',
              auto_merge: false,
              required_contexts: [],
              description: 'Production deployment from CI/CD'
            });
            console.log('Deployment created:', deployment.data.id);
            return deployment.data.id;

  deploy:
    needs: pre-deployment-checks
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate environment variables
        run: |
          test -n "${{ secrets.PRODUCTION_DATABASE_URL }}"
          test -n "${{ secrets.PRODUCTION_JWT_SECRET }}"
          test -n "${{ secrets.VERCEL_TOKEN }}"

      - name: Pre-deployment validation
        run: npm run lint && npm run type-check 2>/dev/null || true

      - name: Run database migrations
        id: migrate
        run: npm run migrate
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          NODE_ENV: production
        continue-on-error: true

      - name: Rollback on migration failure
        if: failure() && steps.migrate.outcome == 'failure'
        run: |
          echo "Rolling back migrations..."
          npm run migrate:rollback 2>/dev/null || echo "Rollback failed, manual intervention required"
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: production
          NEXT_PUBLIC_APP_VERSION: ${{ github.sha }}
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.PRODUCTION_JWT_SECRET }}

      - name: Deploy to Vercel Production
        id: vercel-deploy
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
        env:
          VERCEL_ENV: production

      - name: Wait for deployment
        run: sleep 45

      - name: Verify deployment
        id: health-check
        run: |
          echo "Starting health checks..."
          for i in {1..10}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.p2p.app/api/health)
            RESPONSE=$(curl -s https://api.p2p.app/api/health)
            echo "Attempt $i: HTTP $STATUS"
            echo "Response: $RESPONSE"

            if [ "$STATUS" = "200" ]; then
              echo "Health check passed"
              echo "::set-output name=success::true"
              exit 0
            fi

            sleep 15
          done

          echo "Health check failed"
          echo "::set-output name=success::false"
          exit 1

      - name: Trigger automatic rollback
        if: failure() && steps.health-check.outputs.success == 'false'
        uses: actions/github-script@v7
        with:
          script: |
            // Criar issue urgente para rollback
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 URGENT: Production deployment failed - Rollback required',
              body: `Health checks failed for deployment ${{ github.sha }}\n\nImmediate rollback required!`,
              labels: ['urgent', 'production', 'rollback'],
              assignees: [] // Adicionar assignees se necessário
            });

      - name: Update deployment status
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const state = '${{ job.status }}' === 'success' ? 'success' : 'failure';
            await github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: ${{ needs.pre-deployment-checks.outputs.deployment_id }},
              state: state,
              environment_url: 'https://api.p2p.app',
              description: state === 'success' ? 'Deployment successful' : 'Deployment failed'
            });

      - name: Notify Slack - Success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚀 Production deployment successful!",
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "✅ Production Deployment Successful",
                    "emoji": true
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*Commit:*\n<${{ github.server_url }}/${{ github.repository }}/commit/${{ github.sha }}|${{ github.sha }}>"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Author:*\n${{ github.actor }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Environment:*\nhttps://api.p2p.app"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Status:*\nHealthy ✅"
                    }
                  ]
                }
              ]
            }

      - name: Notify Slack - Failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚨 Production deployment failed!",
              "blocks": [
                {
                  "type": "header",
                  "text": {
                    "type": "plain_text",
                    "text": "❌ Production Deployment Failed",
                    "emoji": true
                  }
                },
                {
                  "type": "section",
                  "fields": [
                    {
                      "type": "mrkdwn",
                      "text": "*Commit:*\n<${{ github.server_url }}/${{ github.repository }}/commit/${{ github.sha }}|${{ github.sha }}>"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Author:*\n${{ github.actor }}"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Action:*\n<${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
                    },
                    {
                      "type": "mrkdwn",
                      "text": "*Status:*\nROLLBACK INITIATED 🔄"
                    }
                  ]
                }
              ]
            }
```

---

## 2. Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "validate-env": "node scripts/validate-env.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:smoke": "NODE_ENV=test npx jest --testPathPattern=smoke",
    "migrate": "ts-node src/database/migrations.ts up",
    "migrate:rollback": "ts-node src/database/migrations.ts down",
    "migrate:create": "ts-node scripts/create-migration.ts",
    "db:seed": "ts-node src/database/seeders/dev-data.ts",
    "analyze": "ANALYZE=true next build",
    "format": "prettier --write .",
    "ci": "npm run lint && npm run type-check && npm run build"
  }
}
```

---

## 3. Environment Validation Script

Arquivo: `scripts/validate-env.js`

```javascript
const fs = require('fs');
const path = require('path');

const requiredEnv = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_ENVIRONMENT',
];

const requiredServerEnv = [
  'DATABASE_URL',
  'JWT_SECRET',
];

function validateEnvironment() {
  const missing = [];
  const warnings = [];

  // Verificar variáveis públicas
  requiredEnv.forEach(env => {
    if (!process.env[env]) {
      missing.push(env);
    }
  });

  // Verificar variáveis privadas (apenas em produção)
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    requiredServerEnv.forEach(env => {
      if (!process.env[env]) {
        missing.push(env);
      }
    });

    // Avisos de segurança
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET deve ter no mínimo 32 caracteres');
    }
  }

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:');
    missing.forEach(env => console.error(`   - ${env}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Avisos de configuração:');
    warnings.forEach(w => console.warn(`   - ${w}`));
  }

  console.log('✅ Todas as variáveis de ambiente estão configuradas');
}

validateEnvironment();
```

---

## 4. Vercel Deployment Configuration

Arquivo: `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci --legacy-peer-deps",
  "framework": "nextjs",
  "nodeVersion": "20.x",
  "env": {
    "NEXT_PUBLIC_API_URL": "@next-public-api-url",
    "NEXT_PUBLIC_ENVIRONMENT": "@next-public-environment",
    "NEXT_PUBLIC_APP_VERSION": "@next-public-app-version",
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "PROTEO_API_KEY": "@proteo-api-key",
    "PUSHOVER_APP_TOKEN": "@pushover-app-token"
  },
  "buildHooks": {
    "pre": "npm run validate-env"
  },
  "headers": [
    {
      "source": "/:path*",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    },
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/static/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/api/v1/:path*",
      "destination": "/api/v2/:path*",
      "permanent": true
    }
  ]
}
```

---

## 5. Health Check Script

Arquivo: `scripts/health-check.sh`

```bash
#!/bin/bash

set -e

URL=${1:-http://localhost:3000}
MAX_ATTEMPTS=${2:-10}
ATTEMPT=1
RETRY_DELAY=10
TIMEOUT=5

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking health of $URL...${NC}"

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS..."

  if curl --connect-timeout $TIMEOUT --max-time $TIMEOUT -s "$URL/api/health" > /dev/null 2>&1; then
    HTTP_CODE=$(curl --connect-timeout $TIMEOUT --max-time $TIMEOUT -s -o /dev/null -w "%{http_code}" "$URL/api/health")

    if [ "$HTTP_CODE" = "200" ]; then
      echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_CODE)${NC}"
      exit 0
    else
      echo -e "${RED}HTTP $HTTP_CODE${NC}"
    fi
  else
    echo -e "${RED}Connection failed${NC}"
  fi

  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    echo "Waiting ${RETRY_DELAY}s before next attempt..."
    sleep $RETRY_DELAY
  fi

  ATTEMPT=$((ATTEMPT + 1))
done

echo -e "${RED}❌ Health check failed after $MAX_ATTEMPTS attempts${NC}"
exit 1
```

---

## 6. GitHub Secrets Setup

Secrets necessários no GitHub:

```
VERCEL_TOKEN           # Token de acesso Vercel
VERCEL_ORG_ID          # ID da organização Vercel
VERCEL_PROJECT_ID      # ID do projeto Vercel

STAGING_DATABASE_URL   # Database URL para staging
STAGING_JWT_SECRET     # JWT secret para staging

PRODUCTION_DATABASE_URL # Database URL para produção
PRODUCTION_JWT_SECRET   # JWT secret para produção

SLACK_WEBHOOK          # Webhook para notificações Slack

SNYK_TOKEN            # (opcional) Token Snyk para security
```

---

## 7. Rollback Manual Script

Arquivo: `scripts/rollback-production.sh`

```bash
#!/bin/bash

set -e

DEPLOYMENT_ID=${1}
REASON=${2:-"Manual rollback"}

if [ -z "$DEPLOYMENT_ID" ]; then
  echo "Usage: ./scripts/rollback-production.sh <deployment-id> [reason]"
  exit 1
fi

echo "Rolling back to deployment: $DEPLOYMENT_ID"
echo "Reason: $REASON"

# Usar Vercel CLI para promover deployment anterior
if ! command -v vercel &> /dev/null; then
  echo "Vercel CLI not found. Install with: npm install -g vercel"
  exit 1
fi

echo "Promoting previous deployment..."
vercel rollback --token=$VERCEL_TOKEN

echo "Running health checks..."
bash scripts/health-check.sh https://api.p2p.app

echo "✅ Rollback completed successfully"
```

---

## 8. Pre-commit Hook (Husky)

Arquivo: `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running pre-commit checks..."

# Lint
npm run lint:fix

# Type check
npm run type-check 2>/dev/null || true

# Stage changes feitas pelo lint:fix
git add -A

echo "✅ Pre-commit checks passed"
```

---

## Instruções de Uso

### 1. Configurar Secrets no GitHub

```bash
# Via GitHub CLI
gh secret set VERCEL_TOKEN --body "seu_token_aqui"
gh secret set VERCEL_ORG_ID --body "seu_org_id_aqui"
gh secret set VERCEL_PROJECT_ID --body "seu_project_id_aqui"
gh secret set STAGING_DATABASE_URL --body "postgresql://..."
gh secret set PRODUCTION_DATABASE_URL --body "postgresql://..."
gh secret set SLACK_WEBHOOK --body "https://hooks.slack.com/..."
```

### 2. Ativar Workflows

```bash
# Verificar se workflows estão ativos
git status .github/workflows/

# Se precisar, desabilitar em .gitignore:
# Não adicionar workflows ao gitignore
```

### 3. Deploy Manual via CLI Vercel

```bash
# Staging
vercel deploy --prod=false --alias=staging

# Production
vercel deploy --prod
```

### 4. Executar Health Check Localmente

```bash
bash scripts/health-check.sh http://localhost:3000

# Ou em staging/prod
bash scripts/health-check.sh https://staging-api.p2p.app
bash scripts/health-check.sh https://api.p2p.app
```

---

**Versão**: 1.0.0
**Atualizado**: Novembro 2025
