# Configuração Avançada: ESLint + Prettier para Next.js 15 + TypeScript

## Índice

1. [Regras Customizadas](#regras-customizadas)
2. [Import Sorting Avançado](#import-sorting-avançado)
3. [TypeScript-Specific Rules](#typescript-specific-rules)
4. [Performance Otimizations](#performance-otimizations)
5. [Integração com CI/CD](#integração-com-cicd)
6. [Troubleshooting](#troubleshooting)

## Regras Customizadas

### Desabilitar ESLint para Linhas Específicas

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = getSomeData()

// eslint-disable-next-line
// Desabilita todos os eslint rules para a próxima linha

/* eslint-disable-next-line */
const value = process.env.API_KEY
```

### Desabilitar para Blocos

```typescript
/* eslint-disable @typescript-eslint/no-unused-vars */
const unusedVariable = 'test'
const anotherUnused = 'test'
/* eslint-enable @typescript-eslint/no-unused-vars */
```

## Import Sorting Avançado

### Como o simple-import-sort Funciona

Imports são organizados em grupos separados por linhas em branco:

```typescript
// 1. Side-effect imports (sem ordenação)
import 'normalize.css'
import './styles.css'

// 2. Node.js built-ins com prefix 'node:'
import { readFile } from 'node:fs'
import { basename } from 'node:path'

// 3. Third-party packages
import React from 'react'
import NextLink from 'next/link'
import axios from 'axios'

// 4. Absolute imports (baseUrl, paths)
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types'

// 5. Relative imports
import { logger } from '../utils/logger'
import { config } from './config'
import type { Config } from './types'
```

### Customizar Groups (Opcional)

Para customização avançada, crie um arquivo `eslintrc.custom.json`:

```json
{
  "rules": {
    "simple-import-sort/imports": [
      "error",
      {
        "groups": [
          ["^\\u0000"],
          ["^node:"],
          ["^@?\\w"],
          ["^@/"],
          ["^\\./(?=.*/)"],
          ["^\\.(?!/)"],
          ["^\\./?$"]
        ]
      }
    ]
  }
}
```

## TypeScript-Specific Rules

### Configuração Recomendada para TypeScript Rigoroso

Adicione ao seu `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  }
}
```

### Regras TypeScript Customizadas

Para adicionar regras TypeScript específicas, modifique `eslint.config.mjs`:

```javascript
const eslintConfig = [
  ...compat.config({
    extends: ['next/typescript'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-types': [
        'error',
        { allowExpressions: true }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  })
]
```

## Performance Otimizations

### 1. Ignorar Diretórios Desnecessários

`.eslintignore`:
```
.next
out
build
dist
node_modules
.vercel
.turbo
coverage
```

### 2. Executar ESLint Apenas em Arquivos Modificados

Package.json:
```json
{
  "scripts": {
    "lint:changed": "eslint --ext .ts,.tsx $(git diff --name-only)",
    "lint:staged": "lint-staged"
  }
}
```

### 3. Usar Cache do ESLint

ESLint 9 ativa cache automaticamente. Para força limpar:

```bash
rm -rf .eslintcache
npm run lint
```

### 4. Parallelizar com pnpm

Rplaces `npm` com `pnpm` no seu projeto para instalaçõess mais rápidas.

## Integração com CI/CD

### GitHub Actions

Crie `.github/workflows/lint.yml`:

```yaml
name: Lint and Format

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check format
        run: npm run format:check

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check
```

### GitLab CI

Crie `.gitlab-ci.yml`:

```yaml
stages:
  - test

lint:
  stage: test
  image: node:20
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run format:check
    - npm run lint
    - npm run type-check
```

## Troubleshooting

### Problema: ESLint reporta "could not resolve module"

**Solução**: Verifique sua configuração de path aliases em `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/pages/*": ["./pages/*"]
    }
  }
}
```

Adicione o resolver ao `eslint.config.mjs`:

```javascript
settings: {
  'import/parsers': {
    '@typescript-eslint/parser': ['.ts', '.tsx']
  },
  'import/resolver': {
    typescript: {
      alwaysTryTypes: true,
      project: './tsconfig.json'
    }
  }
}
```

### Problema: Prettier e ESLint Conflitando

**Solução**: Ran ambos os comandos em sequência:

```bash
npm run lint:fix && npm run format
```

Ou adicione um script:

```json
{
  "scripts": {
    "fix": "npm run lint:fix && npm run format"
  }
}
```

### Problema: import.meta.dirname não existe

**Solução**: Verifique sua versão do Node.js (requer 20.11.0+):

```bash
node --version
```

Se precisar de suporte antigo:

```javascript
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})
```

### Problema: Husky hooks não estão sendo executados

**Solução**:

```bash
# Instale Husky
npm install husky --save-dev

# Inicialize
npx husky install

# Torne o pre-commit executável
chmod +x .husky/pre-commit

# Verifique a instalação
cat .husky/.gitignore
```

### Problema: lint-staged demora muito tempo

**Solução**: Limite os tipos de arquivo em `lint-staged.config.js`:

```javascript
const config = {
  // Apenas .ts e .tsx (não .js)
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  // Apenas markdown e json
  '*.{md,json}': ['prettier --write'],
}

export default config
```

## Boas Práticas

1. **Sempre execute `npm run lint:fix` antes de committar**
   - Isso garante que seu código segue os padrões

2. **Use comentários ESLint com moderação**
   - Prefira corrigir o código a desabilitar regras

3. **Mantenha `tsconfig.json` em modo strict**
   - Isso ajuda a pegar bugs mais cedo

4. **Revise periodicamente as regras**
   - Adapte as rules conforme o projeto evolui

5. **Configure VSCode corretamente**
   - A formatação automática ao salvar poupa tempo

6. **Use `npm run test-all` antes de fazer push**
   - Verifica format, lint e tipos em uma única execução

## Recursos Internos

- [LINTING_SETUP.md](./LINTING_SETUP.md) - Guia de instalação e setup
- [eslint.config.mjs](./eslint.config.mjs) - Configuração ESLint flat config
- [prettier.config.js](./prettier.config.js) - Configuração Prettier
- [lint-staged.config.js](./lint-staged.config.js) - Configuração lint-staged

## Links Externos

- [ESLint Docs](https://eslint.org)
- [Prettier Docs](https://prettier.io)
- [TypeScript ESLint](https://typescript-eslint.io)
- [Husky Docs](https://typicode.github.io/husky)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [Next.js Linting](https://nextjs.org/docs/app/building-your-application/configuring-your-app/linting)
