# CI/CD Quick Reference - Guia Rápido

Referência rápida para operações comuns de CI/CD e deployment.

---

## Deployment Pipeline Overview

```
Develop Branch (Local)
    ↓
    ↓ git push
    ↓
GitHub (Pull Request)
    ├─ Tests (test.yml)
    ├─ Lint (lint in CI)
    ├─ Build (build.yml)
    └─ Preview Deploy (preview-deploy.yml)
    ↓
    ↓ PR Approved & Merged to develop
    ↓
Staging Environment
    └─ Auto-deploy via deploy-staging.yml
    └─ Health checks
    └─ QA Testing
    ↓
    ↓ PR to main
    ↓
Production Environment
    └─ Manual trigger via deploy-production.yml
    └─ Database migrations (with rollback)
    └─ Health checks
    └─ Monitoring alerts
```

---

## Command Cheat Sheet

### Local Development

```bash
# Setup
npm install
npm run validate-env
npm run dev                    # Start dev server

# Before committing
npm run lint:fix              # Fix linting issues
npm run type-check            # Check TypeScript
npm run test                  # Run tests
npm run build                 # Verify build works
```

### Database Operations

```bash
# Create new migration
npm run migrate:create -- name_of_migration

# Run migrations
npm run migrate               # Run pending migrations
npm run migrate:rollback      # Rollback last migration

# Seed dev data
npm run db:seed              # Populate dev database
```

### Vercel/Deployment

```bash
# Login & Configure
vercel login
vercel link                  # Link project

# Environment Variables
vercel env pull              # Pull production vars
vercel env pull --environment staging  # Pull staging vars

# Deploy
vercel deploy --prod         # Deploy to production
vercel deploy                # Deploy preview
vercel rollback              # Rollback to previous deployment
vercel list                  # List recent deployments

# Logs & Monitoring
vercel logs <URL>            # Stream logs
```

### GitHub Operations

```bash
# Via GitHub CLI
gh secret set SECRET_NAME --body "value"
gh workflow run deploy-production.yml
gh deployment list

# Via Web
# Go to: Settings → Secrets and variables → Actions
```

---

## Environment Variables Quick Lookup

### Staging (Preview)

```
NEXT_PUBLIC_API_URL=https://staging-api.p2p.app
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_APP_VERSION=[auto]
DATABASE_URL=[from secrets]
JWT_SECRET=[from secrets]
```

### Production

```
NEXT_PUBLIC_API_URL=https://api.p2p.app
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_VERSION=[auto]
DATABASE_URL=[from secrets]
JWT_SECRET=[from secrets]
```

---

## Common Tasks & Solutions

### Deploy a Hotfix to Production

```bash
# 1. Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/issue-description

# 2. Make changes and test
npm run build
npm run test

# 3. Commit with [hotfix] prefix
git commit -m "[hotfix] Brief description of fix"

# 4. Push and create PR
git push -u origin hotfix/issue-description

# 5. GitHub Actions will:
#    - Run tests
#    - Create preview deployment
#    - Wait for approval

# 6. After approval, merge to main
# → Production deployment triggers automatically
```

### Skip Deployment

```bash
# Add to commit message
[skip deploy]

# Commit will not trigger deployment
git commit -m "WIP: Something [skip deploy]"
```

### Manual Rollback

```bash
# Via Vercel CLI
vercel rollback

# Via GitHub Actions (preferred)
# Go to Actions → Rollback Production → Run workflow
# Fill in deployment ID to rollback to
```

### View Deployment Logs

```bash
# Streaming logs
vercel logs https://p2p-app.vercel.app

# Via Vercel Dashboard
# Project → Deployments → [Select] → Logs
```

### Health Check

```bash
# Development
curl http://localhost:3000/api/health

# Staging
curl https://staging-api.p2p.app/api/health

# Production
curl https://api.p2p.app/api/health

# With details
curl -s https://api.p2p.app/api/health | jq .
```

---

## Status Checks

### Is Deployment in Progress?

```bash
# Check GitHub Actions
gh run list --workflow=deploy-production.yml --limit=1

# Check Vercel
vercel list
```

### Is Application Healthy?

```bash
# Check health endpoint
curl https://api.p2p.app/api/health

# Check error logs
# Dashboard: Sentry.io

# Check performance
# Dashboard: Vercel Analytics
```

### Check Specific Component

```bash
# Database
psql $DATABASE_URL -c "SELECT 1"

# API Response
curl -w "\n%{http_code}\n" https://api.p2p.app/api/transactions

# External Service (Proteo)
curl -I https://api.proteo.com.br/health
```

---

## Troubleshooting Flowchart

```
Problem: Build Failed
├─ Check GitHub Actions logs
├─ Check error message
├─ Common causes:
│  ├─ npm dependency issue → npm ci --legacy-peer-deps
│  ├─ TypeScript error → npm run type-check
│  ├─ Environment variable missing → vercel env pull
│  └─ Linting error → npm run lint
└─ Fix and re-push

Problem: Health Check Failed
├─ Wait 30 seconds and retry
├─ Check if application is running
│  └─ curl https://api.p2p.app/
├─ Check Sentry for errors
├─ Check Vercel logs
│  └─ vercel logs https://p2p-app.vercel.app
└─ If persists → Consider rollback

Problem: Slow Response
├─ Check database connection
├─ Check external API calls
├─ Check Vercel metrics
│  └─ Dashboard → Analytics
├─ Check if under load
└─ Consider cache invalidation

Problem: Database Migration Failed
├─ Check migration logs
├─ Verify migration syntax
├─ Test locally: npm run migrate
├─ If error persists → Rollback
│  └─ npm run migrate:rollback
└─ Fix migration and redeploy

Problem: Authentication Failing
├─ Check if JWT_SECRET changed
├─ Verify token in request headers
├─ Check Sentry for auth errors
└─ Restart server or trigger redeployment
```

---

## Files to Know

```
.github/workflows/
├── ci.yml                 # Tests and lint on PR
├── deploy-staging.yml     # Auto-deploy to staging
└── deploy-production.yml  # Deploy to production

vercel.json              # Vercel configuration

src/
├── instrumentation.ts    # Error tracking (Sentry)
├── api/
│   └── health/route.ts   # Health check endpoint
└── lib/
    ├── env.ts            # Environment variables
    └── logger.ts         # Logging setup

scripts/
├── validate-env.js       # Validate env variables
└── health-check.sh       # Health check script

package.json            # Scripts for deploy/migrate
```

---

## Key Passwords & Secrets to Protect

```
NEVER commit to git:
- JWT_SECRET
- DATABASE_URL
- PROTEO_API_KEY
- PUSHOVER_APP_TOKEN
- API_SECRET_KEY
- Any .env file

Store ONLY in:
- Vercel Environment Variables
- GitHub Secrets
- Secure password manager (1Password, LastPass, etc.)
- Local .env.local (git-ignored)
```

---

## Status Page URLs

```
Health:        https://api.p2p.app/api/health
Dashboard:     https://vercel.com/dashboard
GitHub:        https://github.com/username/p2p
Sentry:        https://sentry.io/organizations/yourorg
```

---

## Contact & Escalation

```
Deployment Issue:  Tech Lead → Slack #engineering
Database Issue:    Database Admin → Slack #engineering
Performance Issue: DevOps → Slack #operations
Critical Issue:    On-call Engineer → Phone/Slack
```

---

## Pre-Deployment Reminder

```
☑️  All tests passing?
☑️  Code reviewed & approved?
☑️  Environment variables set?
☑️  Database backup taken?
☑️  Rollback plan ready?
☑️  Team notified?
☑️  Standing by for monitoring?

→ If ALL checked: Deploy!
```

---

## Post-Deployment Checklist

```
Immediately after deployment:
☑️  Health checks green?
☑️  No critical errors in Sentry?
☑️  Response times normal?
☑️  Can login & create transaction?

1 hour after:
☑️  No error spike?
☑️  Database queries performing?
☑️  No memory/CPU issues?

24 hours after:
☑️  All features stable?
☑️  No recurring errors?
☑️  Customer complaints? None.
```

---

## Useful Aliases (add to ~/.bashrc or ~/.zshrc)

```bash
# Deployment shortcuts
alias deploy-staging='git push origin develop'
alias deploy-prod='git push origin main'
alias check-health='curl -s https://api.p2p.app/api/health | jq .'
alias check-logs='vercel logs https://p2p-app.vercel.app'
alias db-connect='psql $PRODUCTION_DATABASE_URL'

# Git shortcuts
alias gstash='git stash'
alias glog='git log --oneline -n 20'
alias gbranch='git branch -vv'

# Useful oneliners
alias npm-audit='npm audit fix --legacy-peer-deps'
alias npm-clean='npm cache clean --force && rm -rf node_modules && npm install'
```

---

## Quick Decision Guide

### Should I Deploy Now?

```
Is main/develop branch stable?          → YES
Have all tests passed?                  → YES
Is database backup taken?               → YES
Is team available for monitoring?       → YES
Is there a documented rollback plan?    → YES

If all YES:  ✅ SAFE TO DEPLOY
If any NO:   ❌ WAIT
```

### Should I Rollback?

```
Health checks failing?          → YES → ROLLBACK NOW
Critical error in Sentry?       → YES → ROLLBACK NOW
Application completely down?    → YES → ROLLBACK NOW
Response time > 10s?            → MAYBE → WAIT & MONITOR
Errors increasing?              → MAYBE → MONITOR CLOSELY
Isolated issue?                 → NO → FIX & REDEPLOY
```

---

## Learn More

- Vercel Docs: https://vercel.com/docs
- GitHub Actions: https://docs.github.com/en/actions
- Next.js Deployment: https://nextjs.org/docs/deployment
- PostgreSQL: https://www.postgresql.org/docs/

---

**Last Updated**: Novembro 2025
**Version**: 1.0.0
