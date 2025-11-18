# Guia Completo: Deployment e CI/CD para Next.js 15

Documentação abrangente sobre deployment, CI/CD, automação de migrations e estratégias de rollback para aplicações Next.js 15.

---

## Índice

1. [Vercel Deployment](#vercel-deployment)
2. [GitHub Actions CI/CD](#github-actions-cicd)
3. [Database Migrations](#database-migrations)
4. [Environment Promotion](#environment-promotion)
5. [Health Checks](#health-checks)
6. [Preview Deployments](#preview-deployments)
7. [Rollback Strategies](#rollback-strategies)
8. [Monitoramento e Alertas](#monitoramento-alertas)
9. [Exemplo Completo End-to-End](#exemplo-completo)

---

## Vercel Deployment {#vercel-deployment}

### 1. Configuração Inicial Vercel

#### 1.1 vercel.json - Arquivo de Configuração

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install --legacy-peer-deps",
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
      "source": "/(.*)",
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
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, s-maxage=3600"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/old-page",
      "destination": "/new-page",
      "permanent": true
    }
  ]
}
```

#### 1.2 Conectar Repositório GitHub

1. Acessar https://vercel.com/dashboard
2. Clicar em "Add New" → "Project"
3. Selecionar repositório GitHub
4. Configurar:
   - **Project Name**: p2p-app
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: .next
   - **Install Command**: npm install

#### 1.3 Configurar Environment Variables

No **Vercel Dashboard** → Project → Settings → Environment Variables:

```
PRODUCTION:
- NEXT_PUBLIC_API_URL: https://api.p2p.app
- NEXT_PUBLIC_ENVIRONMENT: production
- NEXT_PUBLIC_APP_VERSION: (automaticamente preenchido)
- DATABASE_URL: postgresql://...
- JWT_SECRET: (valor seguro)
- PROTEO_API_KEY: (valor seguro)

PREVIEW (Staging):
- NEXT_PUBLIC_API_URL: https://staging-api.p2p.app
- NEXT_PUBLIC_ENVIRONMENT: staging
- DATABASE_URL: postgresql://... (staging db)
- JWT_SECRET: (mesmo valor production, ou separado se preferir)

DEVELOPMENT:
- NEXT_PUBLIC_API_URL: http://localhost:3000
- NEXT_PUBLIC_ENVIRONMENT: development
```

### 2. Automação de Build e Deploy

#### 2.1 Configurar Deployments Automáticos

No Vercel Dashboard:
1. Settings → Git
2. Ativar **Automatic Deployments**
3. Deploy Branch: `main`
4. Production Branch: `main`

#### 2.2 Configure Automatic Redeployment

```json
{
  "redeployHooks": [
    {
      "url": "https://api.vercel.com/v1/integrations/deploy/abc123/...",
      "branch": "main"
    }
  ]
}
```

#### 2.3 CLI Vercel para Deploy Manual

```bash
# Instalar
npm install -g vercel

# Login
vercel login

# Deploy em preview
vercel --prod=false

# Deploy em produção
vercel --prod

# Deploy de branch específico
vercel deploy --prod --branch=main

# Listar deployments
vercel list

# Logs do deployment
vercel logs
```

---

## GitHub Actions CI/CD {#github-actions-cicd}

### 1. Configurar GitHub Actions

#### 1.1 Estrutura de Workflows

```
.github/
├── workflows/
│   ├── test.yml              # Testes em PR
│   ├── lint.yml              # Linting em PR
│   ├── build.yml             # Build em PR
│   ├── deploy-staging.yml    # Deploy staging em develop
│   ├── deploy-prod.yml       # Deploy produção em main
│   ├── database-migration.yml # Migrations automáticas
│   └── health-check.yml      # Health checks pós-deploy
└── dependabot.yml            # Atualizações automáticas
```

#### 1.2 Workflow: Test (test.yml)

```yaml
name: Tests

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate environment variables
        run: npm run validate-env

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test
        env:
          NODE_ENV: test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: always()
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

#### 1.3 Workflow: Build (build.yml)

```yaml
name: Build

on:
  pull_request:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest

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
        run: npm run validate-env
        env:
          NEXT_PUBLIC_API_URL: https://staging-api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: staging

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://staging-api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: staging

      - name: Generate bundle analysis
        run: npm run analyze || true

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: next-build
          path: .next/
          retention-days: 1
```

#### 1.4 Workflow: Deploy Staging (deploy-staging.yml)

```yaml
name: Deploy Staging

on:
  push:
    branches: [ develop ]

jobs:
  deploy-staging:
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

      - name: Run migrations (staging)
        run: npm run migrate
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          NODE_ENV: staging

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://staging-api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: staging
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.STAGING_JWT_SECRET }}

      - name: Deploy to Vercel (Staging)
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          alias: staging
          scope: ${{ secrets.VERCEL_ORG_ID }}
        env:
          VERCEL_ENV: preview

      - name: Health Check (Staging)
        run: |
          for i in {1..5}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging-api.p2p.app/api/health)
            if [ "$STATUS" = "200" ]; then
              echo "Health check passed"
              exit 0
            fi
            echo "Attempt $i: Status $STATUS"
            sleep 10
          done
          exit 1

      - name: Notify deployment (Slack)
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Staging deployment ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Staging Deployment: ${{ job.status }}\nCommit: ${{ github.sha }}"
                  }
                }
              ]
            }
```

#### 1.5 Workflow: Deploy Production (deploy-prod.yml)

```yaml
name: Deploy Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      rollback-version:
        description: 'Versão para rollback (opcional)'
        required: false

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Create deployment
        uses: actions/github-script@v7
        id: deployment
        with:
          script: |
            const deployment = await github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.ref,
              environment: 'production',
              auto_merge: false,
              required_contexts: [],
              description: 'Production deployment triggered by CI/CD'
            });
            return deployment.data.id;

      - name: Install dependencies
        run: npm ci

      - name: Validate environment
        run: npm run validate-env
        env:
          NEXT_PUBLIC_API_URL: https://api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: production

      - name: Run pre-deployment checks
        run: |
          npm run lint
          npm run type-check

      - name: Run migrations (production)
        id: migrate
        run: npm run migrate
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          NODE_ENV: production

      - name: Rollback migrations on failure
        if: failure() && steps.migrate.outcome == 'failure'
        run: |
          npm run migrate:rollback
          echo "Migrations rolled back due to failure"
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: production
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
          JWT_SECRET: ${{ secrets.PRODUCTION_JWT_SECRET }}

      - name: Deploy to Vercel (Production)
        id: deployment-step
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
        env:
          VERCEL_ENV: production

      - name: Wait for deployment
        run: sleep 30

      - name: Health Check (Production)
        id: health-check
        run: |
          for i in {1..10}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.p2p.app/api/health)
            if [ "$STATUS" = "200" ]; then
              echo "::set-output name=success::true"
              echo "Health check passed"
              exit 0
            fi
            echo "Attempt $i: Status $STATUS"
            sleep 15
          done
          echo "::set-output name=success::false"
          exit 1

      - name: Trigger rollback on health check failure
        if: failure() && steps.health-check.outputs.success == 'false'
        uses: actions/github-script@v7
        with:
          script: |
            // Usar GitHub API para criar issue de rollback urgente
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `URGENT: Production deployment health check failed`,
              body: `Deployment ${context.sha} failed health checks. Immediate rollback required!`,
              labels: ['urgent', 'production', 'rollback']
            });

      - name: Update deployment status (Success)
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: ${{ steps.deployment.outputs.result }},
              state: 'success',
              environment_url: 'https://api.p2p.app',
              description: 'Production deployment successful'
            });

      - name: Update deployment status (Failure)
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: ${{ steps.deployment.outputs.result }},
              state: 'failure',
              description: 'Production deployment failed'
            });

      - name: Notify Slack (Success)
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Production deployment successful!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Production Deployment Successful*\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}\nURL: https://api.p2p.app"
                  }
                }
              ]
            }

      - name: Notify Slack (Failure)
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Production deployment failed!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "❌ *Production Deployment Failed*\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}\nAction: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                  }
                }
              ]
            }
```

---

## Database Migrations {#database-migrations}

### 1. Estrutura de Migrations

```
src/database/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_users_table.sql
│   ├── 003_add_transactions_table.sql
│   └── 20231115_add_kyc_fields.sql
├── seeders/
│   └── dev-data.sql
└── migrations.ts
```

### 2. Migration Manager

```typescript
// src/database/migrations.ts
import fs from 'fs';
import path from 'path';
import { createConnection } from '@/lib/db';
import { serverEnv } from '@/lib/env';

interface MigrationRecord {
  id: string;
  name: string;
  executedAt: Date;
  status: 'success' | 'failed';
  rollbackApplied: boolean;
}

class MigrationManager {
  private db: any;
  private migrationsDir = path.join(__dirname, 'migrations');

  async initialize() {
    this.db = await createConnection(serverEnv.databaseUrl);

    // Criar tabela de migrations se não existir
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'success',
        rollback_applied BOOLEAN DEFAULT false
      )
    `);
  }

  /**
   * Executa todas as migrations pendentes
   */
  async runPending() {
    await this.initialize();

    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = await this.getAllMigrations();

    const pending = allMigrations.filter(
      m => !executedMigrations.some(e => e.name === m)
    );

    if (pending.length === 0) {
      console.log('Nenhuma migration pendente');
      return;
    }

    console.log(`Encontradas ${pending.length} migrations pendentes`);

    for (const migration of pending) {
      try {
        console.log(`Executando: ${migration}`);
        await this.runMigration(migration);
        console.log(`✅ ${migration} concluída`);
      } catch (error) {
        console.error(`❌ Erro em ${migration}:`, error);

        // Registrar falha
        await this.recordMigration(migration, 'failed');

        throw new Error(`Migration ${migration} falhou`);
      }
    }

    console.log('Todas as migrations foram executadas com sucesso!');
  }

  /**
   * Faz rollback da última migration
   */
  async rollbackLast() {
    await this.initialize();

    const lastMigration = await this.getLastMigration();

    if (!lastMigration) {
      console.log('Nenhuma migration para fazer rollback');
      return;
    }

    console.log(`Fazendo rollback de: ${lastMigration.name}`);

    try {
      await this.rollbackMigration(lastMigration.name);

      // Atualizar registro
      await this.db.query(
        `UPDATE migrations SET rollback_applied = true WHERE name = $1`,
        [lastMigration.name]
      );

      console.log(`✅ Rollback de ${lastMigration.name} concluído`);
    } catch (error) {
      console.error(`❌ Erro no rollback:`, error);
      throw error;
    }
  }

  private async runMigration(name: string) {
    const filePath = path.join(this.migrationsDir, `${name}.sql`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    await this.db.query(sql);
    await this.recordMigration(name, 'success');
  }

  private async rollbackMigration(name: string) {
    const rollbackPath = path.join(this.migrationsDir, `${name}.rollback.sql`);

    if (!fs.existsSync(rollbackPath)) {
      throw new Error(`Rollback file não encontrado para ${name}`);
    }

    const sql = fs.readFileSync(rollbackPath, 'utf-8');
    await this.db.query(sql);
  }

  private async recordMigration(name: string, status: 'success' | 'failed') {
    await this.db.query(
      `INSERT INTO migrations (name, status) VALUES ($1, $2)`,
      [name, status]
    );
  }

  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.db.query(
      `SELECT name FROM migrations WHERE status = 'success' ORDER BY executed_at`
    );
    return result.rows;
  }

  private async getLastMigration(): Promise<MigrationRecord | null> {
    const result = await this.db.query(
      `SELECT name, executed_at FROM migrations WHERE status = 'success'
       ORDER BY executed_at DESC LIMIT 1`
    );
    return result.rows[0] || null;
  }

  private async getAllMigrations(): Promise<string[]> {
    const files = fs.readdirSync(this.migrationsDir);
    return files
      .filter(f => f.endsWith('.sql') && !f.endsWith('.rollback.sql'))
      .map(f => f.replace('.sql', ''))
      .sort();
  }
}

export const migrationManager = new MigrationManager();

// CLI
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'up') {
    migrationManager.runPending().catch(console.error);
  } else if (command === 'down') {
    migrationManager.rollbackLast().catch(console.error);
  }
}
```

### 3. Exemplo de Migration File

```sql
-- src/database/migrations/20231115_add_kyc_fields.sql
-- Add KYC verification fields to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS document_number VARCHAR(100);

-- Create index for kyc_status
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- Add check constraint
ALTER TABLE users ADD CONSTRAINT check_kyc_status
  CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'expired'));

-- Create audit log table
CREATE TABLE IF NOT EXISTS kyc_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_type VARCHAR(100),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kyc_audit_logs_user_id ON kyc_audit_logs(user_id);
```

### 4. Rollback File

```sql
-- src/database/migrations/20231115_add_kyc_fields.rollback.sql
-- Rollback KYC verification fields

DROP TABLE IF EXISTS kyc_audit_logs;
ALTER TABLE users DROP COLUMN IF EXISTS kyc_status;
ALTER TABLE users DROP COLUMN IF EXISTS kyc_verified_at;
ALTER TABLE users DROP COLUMN IF EXISTS kyc_rejection_reason;
ALTER TABLE users DROP COLUMN IF EXISTS document_type;
ALTER TABLE users DROP COLUMN IF EXISTS document_number;
```

### 5. package.json Scripts

```json
{
  "scripts": {
    "migrate": "ts-node src/database/migrations.ts up",
    "migrate:rollback": "ts-node src/database/migrations.ts down",
    "db:seed": "ts-node src/database/seeders/dev-data.ts"
  }
}
```

---

## Environment Promotion {#environment-promotion}

### 1. Estratégia de Promoção

```
Development (Local)
        ↓
        ↓ git push origin feature-branch
        ↓
Staging (Preview/Develop)
        ↓
        ↓ Pull Request + Tests Pass
        ↓
Production (Main)
```

### 2. Configuração por Ambiente

```typescript
// src/config/environment.ts
export const environments = {
  development: {
    apiUrl: 'http://localhost:3000',
    databaseUrl: 'postgresql://localhost/p2p_dev',
    logLevel: 'debug',
    enableMocking: true,
    enableDebugPanel: true,
  },
  staging: {
    apiUrl: 'https://staging-api.p2p.app',
    databaseUrl: process.env.STAGING_DATABASE_URL,
    logLevel: 'info',
    enableMocking: false,
    enableDebugPanel: true, // Para QA
  },
  production: {
    apiUrl: 'https://api.p2p.app',
    databaseUrl: process.env.PRODUCTION_DATABASE_URL,
    logLevel: 'warn',
    enableMocking: false,
    enableDebugPanel: false,
  },
} as const;

type Environment = keyof typeof environments;

export function getEnvironmentConfig(env: Environment) {
  return environments[env];
}
```

### 3. Validação de Promoção

```typescript
// src/lib/deployment/promotion-validator.ts
import { serverEnv } from '@/lib/env';

interface PromotionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validatePromotion(
  fromEnv: string,
  toEnv: string
): Promise<PromotionValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Verificar schema do banco de dados
  const schemaValid = await validateDatabaseSchema(toEnv);
  if (!schemaValid) {
    errors.push('Database schema mismatch');
  }

  // 2. Verificar variáveis de ambiente
  const requiredVars = [
    'NEXT_PUBLIC_API_URL',
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  const missingVars = requiredVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  // 3. Verificar conexão com banco
  try {
    // await testDatabaseConnection(toEnv);
  } catch (error) {
    errors.push('Database connection failed');
  }

  // 4. Avisos
  if (toEnv === 'production' && serverEnv.jwtSecret.length < 32) {
    warnings.push('JWT_SECRET should be longer for production');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

async function validateDatabaseSchema(env: string): Promise<boolean> {
  // Implementar validação de schema
  return true;
}
```

---

## Health Checks {#health-checks}

### 1. Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { serverEnv, clientEnv } from '@/lib/env';
import { pingDatabase } from '@/lib/db/health';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: { status: 'ok' | 'error'; responseTime: number };
    api: { status: 'ok' | 'error'; responseTime: number };
    memory: { status: 'ok' | 'error'; usagePercent: number };
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResponse>> {
  const startTime = Date.now();

  const checks = {
    database: await checkDatabase(),
    api: await checkAPI(),
    memory: checkMemory(),
  };

  const overallStatus = determineStatus(checks);

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: clientEnv.environment,
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 :
                     overallStatus === 'degraded' ? 503 : 500;

  return NextResponse.json(response, { status: statusCode });
}

async function checkDatabase() {
  const start = Date.now();
  try {
    await pingDatabase();
    return {
      status: 'ok' as const,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error' as const,
      responseTime: Date.now() - start,
    };
  }
}

async function checkAPI() {
  const start = Date.now();
  try {
    // Verificar serviços externos críticos
    // const response = await fetch(`${serverEnv.proteoApiUrl}/health`);
    return {
      status: 'ok' as const,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error' as const,
      responseTime: Date.now() - start,
    };
  }
}

function checkMemory() {
  const used = process.memoryUsage();
  const totalHeap = used.heapTotal;
  const usedHeap = used.heapUsed;
  const percent = (usedHeap / totalHeap) * 100;

  return {
    status: percent > 90 ? ('error' as const) : ('ok' as const),
    usagePercent: Math.round(percent),
  };
}

function determineStatus(checks: any) {
  const allErrors = Object.values(checks).filter((c: any) => c.status === 'error');

  if (allErrors.length > 1) return 'unhealthy';
  if (allErrors.length === 1) return 'degraded';
  return 'healthy';
}
```

### 2. Health Check Script para CI/CD

```bash
#!/bin/bash
# scripts/health-check.sh

set -e

URL=${1:-http://localhost:3000}
MAX_ATTEMPTS=10
ATTEMPT=1
RETRY_DELAY=10

echo "Checking health of $URL..."

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL/api/health")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed"
    exit 0
  fi

  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS: HTTP $HTTP_CODE"

  if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
    sleep $RETRY_DELAY
  fi

  ATTEMPT=$((ATTEMPT + 1))
done

echo "❌ Health check failed after $MAX_ATTEMPTS attempts"
exit 1
```

---

## Preview Deployments {#preview-deployments}

### 1. Configurar Preview Deployments

```yaml
# .github/workflows/preview-deploy.yml
name: Deploy Preview

on:
  pull_request:
    branches: [main, develop]

jobs:
  preview:
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

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://staging-api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: staging

      - name: Deploy to Vercel Preview
        uses: vercel/action@master
        id: vercel
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
        env:
          VERCEL_ENV: preview

      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployment ready!\n\n[Visit Preview](${{ steps.vercel.outputs.preview-url }})`
            })

      - name: Add deployment status check
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.checks.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              name: 'Preview Deployment',
              head_sha: context.sha,
              status: 'completed',
              conclusion: 'success',
              details_url: '${{ steps.vercel.outputs.preview-url }}'
            })
```

### 2. Vercel Preview Configuration

No `vercel.json`:

```json
{
  "preview": {
    "previewBranches": ["develop", "staging"],
    "previewCommitMessage": true,
    "bypassFunction": true
  },
  "github": {
    "enabled": true,
    "silent": false,
    "autoCreateNextDeployment": true,
    "autoDeployOnPush": true,
    "autoDeployOnPullRequest": true
  }
}
```

---

## Rollback Strategies {#rollback-strategies}

### 1. Automatic Rollback

```yaml
# .github/workflows/auto-rollback.yml
name: Auto Rollback

on:
  workflow_run:
    workflows: ["Deploy Production"]
    types: [completed]

jobs:
  check-health:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - name: Wait for deployment
        run: sleep 60

      - name: Check health
        id: health
        run: |
          bash scripts/health-check.sh https://api.p2p.app

      - name: Trigger rollback on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'rollback-production.yml',
              ref: 'main',
              inputs: {
                reason: 'Health check failed after deployment'
              }
            })

      - name: Notify team
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "⚠️ Production health check failed - initiating rollback"
            }
```

### 2. Manual Rollback Workflow

```yaml
# .github/workflows/rollback-production.yml
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      deployment-id:
        description: 'Deployment ID to rollback to'
        required: true
      reason:
        description: 'Reason for rollback'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4
        with:
          ref: main

      - name: Log rollback initiation
        run: |
          echo "Initiating rollback to deployment: ${{ github.event.inputs.deployment-id }}"
          echo "Reason: ${{ github.event.inputs.reason }}"

      - name: Retrieve previous deployment
        uses: actions/github-script@v7
        id: get-deployment
        with:
          script: |
            const deployments = await github.rest.repos.listDeployments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              environment: 'production',
              per_page: 10
            });

            const target = deployments.data.find(d =>
              d.id.toString() === '${{ github.event.inputs.deployment-id }}'
            );

            if (!target) {
              throw new Error('Deployment not found');
            }

            return target.ref;

      - name: Checkout previous version
        run: git checkout ${{ steps.get-deployment.outputs.result }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://api.p2p.app
          NEXT_PUBLIC_ENVIRONMENT: production

      - name: Rollback database migrations
        run: npm run migrate:rollback
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}
        continue-on-error: true

      - name: Deploy rollback
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Verify rollback
        run: bash scripts/health-check.sh https://api.p2p.app

      - name: Create rollback incident
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Rollback executed: ${{ github.event.inputs.reason }}`,
              body: `Deployment rolled back to: ${{ steps.get-deployment.outputs.result }}\n\nReason: ${{ github.event.inputs.reason }}`,
              labels: ['incident', 'production', 'rollback']
            })

      - name: Notify team
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🔄 Production rollback completed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Rolled back to: ${{ steps.get-deployment.outputs.result }}\nReason: ${{ github.event.inputs.reason }}"
                  }
                }
              ]
            }
```

### 3. Blue-Green Deployment Strategy

```yaml
# .github/workflows/blue-green-deploy.yml
name: Blue-Green Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-green:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      - name: Install and build
        run: |
          npm ci
          npm run build

      - name: Deploy to green environment
        id: deploy-green
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_GREEN }}
          alias: green

      - name: Test green environment
        run: |
          # Rodar testes contra green
          bash scripts/health-check.sh ${{ steps.deploy-green.outputs.preview-url }}

      - name: Switch traffic to green
        run: |
          # Usar Vercel CLI para mover alias de produção
          vercel alias set ${{ steps.deploy-green.outputs.preview-url }} api.p2p.app
```

---

## Monitoramento e Alertas {#monitoramento-alertas}

### 1. Monitoring Setup com Sentry

```typescript
// src/instrumentation.ts
import * as Sentry from "@sentry/nextjs";
import { serverEnv } from "@/lib/env";

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: serverEnv.sentryDsn,
      environment: process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === 'production',
      tracesSampleRate: 0.1,

      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
      ],

      beforeSend(event, hint) {
        // Filtrar eventos específicos
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error && error.message.includes('network')) {
            return null; // Ignorar erros de rede
          }
        }
        return event;
      },
    });
  }
}
```

### 2. Logging Setup

```typescript
// src/lib/logger.ts
import pino from 'pino';
import { clientEnv } from '@/lib/env';

const isDev = clientEnv.environment === 'development';

export const logger = pino({
  level: clientEnv.logLevel || 'info',
  transport: isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
});
```

### 3. Monitoring Metrics

```typescript
// src/lib/monitoring/metrics.ts
export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics() {
    const result: Record<string, any> = {};

    for (const [name, values] of this.metrics) {
      result[name] = {
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }

    return result;
  }
}

export const metricsCollector = new MetricsCollector();
```

---

## Exemplo Completo End-to-End {#exemplo-completo}

### Fluxo Completo de Deployment

```
1. Developer abre PR com features → GitHub
2. CI/CD dispara:
   ├── Tests (npm run test)
   ├── Lint (npm run lint)
   └── Build (npm run build)
3. Se tudo passa → Vercel faz preview deployment
4. QA testa preview em staging-api.p2p.app
5. PR é aprovado → Merge para main
6. GitHub Actions dispara Deploy Production:
   ├── Validações
   ├── Database migrations
   ├── Build
   ├── Deploy Vercel
   ├── Health checks
   └── Notifica Slack
7. Se houver erro:
   └── Rollback automático + Notificação
```

### checklist.md de Pre-deployment

```markdown
# Pre-Deployment Checklist

## Code Review
- [ ] Code reviewed by at least 2 developers
- [ ] All tests passing
- [ ] No linting errors
- [ ] No TypeScript errors

## Database
- [ ] Migrations written
- [ ] Rollback scripts created
- [ ] Migrations tested locally
- [ ] Data validation checks done

## Configuration
- [ ] All environment variables set in Vercel
- [ ] Secrets not exposed in code
- [ ] URLs pointing to correct environments

## Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing (if applicable)
- [ ] Performance tests passing

## Deployment
- [ ] Preview deployment tested
- [ ] Health checks configured
- [ ] Rollback plan documented
- [ ] Slack notifications configured

## Post-Deployment
- [ ] Health checks passing
- [ ] Monitor logs for errors
- [ ] Verify key features working
- [ ] Database queries performing well

## Incident Response
- [ ] Team notified
- [ ] Rollback executed if needed
- [ ] Root cause analysis done
- [ ] Issue created for followup
```

---

## Recursos Úteis

- **Vercel Docs**: https://vercel.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Database Migrations**: https://github.com/flyway/flyway
- **Sentry Documentation**: https://docs.sentry.io
- **Vercel CLI**: https://vercel.com/docs/cli

---

**Versão**: 1.0.0
**Atualizado**: Novembro 2025
**Projeto**: P2P Compra de Criptomoedas
