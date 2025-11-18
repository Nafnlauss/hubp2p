# Comparativo de Configurações ESLint + Prettier

Este documento compara diferentes abordagens para configurar ESLint e Prettier em projetos Next.js 15.

## Abordagem 1: Minimalista (Recomendado para Começar)

**Arquivo de Config**: `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

**Vantagens:**
- Muito simples
- Fácil de entender
- Funciona bem para pequenos projetos

**Desvantagens:**
- Sem ordenação automática de imports
- Sem regras de acessibilidade
- Menos rigoroso

**Quando usar:**
- Projetos freelance
- MVPs
- Prototipagem rápida

---

## Abordagem 2: Recomendada (Este Projeto)

**Arquivo de Config**: `eslint.config.mjs` (Flat Config)

**Inclui:**
- Import sorting automático
- Regras de acessibilidade
- Suporte TypeScript completo
- Regras de qualidade com unicorn

**Vantagens:**
- Mais rigoroso
- Ordena imports automaticamente
- Acessibilidade garantida
- Futuro-proof (flat config é o padrão)

**Desvantagens:**
- Requer Node.js 20.11.0+
- Mais configuração inicial
- Possíveis conflitos se estender

**Quando usar:**
- Projetos em equipe
- Produção
- Projetos de longa duração

---

## Abordagem 3: Maximalista (Para Projetos Enterprise)

**Inclui Tudo da Abordagem 2, mais:**

```javascript
extends: [
  'next',
  'next/core-web-vitals',
  'next/typescript',
  'plugin:unicorn/recommended',
  'plugin:import/recommended',
  'plugin:import/typescript',
  'plugin:react-hooks/recommended',
  'plugin:@next/next/recommended',
  'plugin:prettier/recommended'
]
```

**Adicione ao package.json:**

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix --max-warnings=0",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test-all": "npm run format && npm run lint && npm run type-check"
  }
}
```

**Vantagens:**
- Máxima qualidade de código
- Suporte completo a React Hooks
- Otimizações Next.js garantidas
- Zero-warnings mode

**Desvantagens:**
- Muita configuração
- Pode ser restritivo para prototipagem
- Maior overhead de performance

**Quando usar:**
- Empresas grandes
- Projetos críticos
- Produtos com muitos usuários

---

## Abordagem 4: Alternativa - Sem simple-import-sort

**Usa**: `eslint-plugin-import` para ordenação

```json
{
  "plugins": ["import"],
  "rules": {
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "alphabeticalOrder": true,
        "newlinesBetween": "always"
      }
    ]
  }
}
```

**Vantagens:**
- Mais customizável
- Permite mais controle sobre grupos de imports

**Desvantagens:**
- Mais verboso
- Menos automático

**Quando usar:**
- Se precisa de customização extrema
- Projetos antigos com imports complexos

---

## Abordagem 5: Somente Prettier (Sem ESLint)

```bash
npm install --save-dev prettier
echo '{"semi": false, "singleQuote": true}' > .prettierrc.json
```

**Vantagens:**
- Mínimo absoluto
- Rápido
- Sem conflitos

**Desvantagens:**
- Sem detecção de bugs
- Sem regras de qualidade
- Sem suporte TypeScript

**Quando usar:**
- Nunca em produção
- Apenas para projetos pessoais

---

## Tabela Comparativa

| Aspecto | Minimalista | Recomendada | Maximalista | Import Order | Prettier Only |
|---------|-------------|------------|------------|--------------|---------------|
| Complexidade | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| Import Sorting | ❌ | ✅ | ✅ | ✅ | ❌ |
| Accessibility | ❌ | ✅ | ✅ | ❌ | ❌ |
| TypeScript | ✅ | ✅ | ✅ | ✅ | ❌ |
| React Hooks | ⚠️ | ✅ | ✅ | ⚠️ | ❌ |
| Produção Ready | ⚠️ | ✅ | ✅ | ✅ | ❌ |
| Tempo Setup | 5 min | 20 min | 45 min | 25 min | 2 min |

---

## Migração Entre Abordagens

### De Minimalista para Recomendada

1. Instale as dependências adicionais:
   ```bash
   npm install --save-dev eslint-plugin-simple-import-sort \
     eslint-plugin-unicorn eslint-plugin-jsx-a11y
   ```

2. Renomeie `.eslintrc.json` para `eslint.config.mjs`

3. Copie a configuração de `eslint.config.mjs` deste projeto

4. Execute:
   ```bash
   npm run lint:fix
   npm run format
   ```

### De Recomendada para Maximalista

1. Adicione plugins:
   ```bash
   npm install --save-dev eslint-plugin-react-hooks
   ```

2. Estenda o `eslint.config.mjs`:
   ```javascript
   extends: [
     'plugin:react-hooks/recommended',
     'plugin:@next/next/recommended'
   ]
   ```

3. Configure para zero-warnings:
   ```json
   "lint": "eslint . --max-warnings=0"
   ```

---

## Recomendação Final

Para a maioria dos projetos Next.js 15 + TypeScript, recomenda-se a **Abordagem Recomendada** (Abordagem 2) porque:

1. ✅ Equilíbrio entre simplicidade e rigor
2. ✅ Import sorting automático (economiza tempo)
3. ✅ Acessibilidade garantida
4. ✅ TypeScript bem suportado
5. ✅ Fácil de expandir se necessário
6. ✅ Future-proof com flat config

Esta é a configuração padrão deste projeto em `/Users/leonardoguimaraes/Documents/p2p/eslint.config.mjs`.

---

## Histórico de Versões

| Versão | ESLint | Node.js | Config Format | Highlights |
|--------|--------|---------|---------------|-----------|
| 8.x | 8 | 14+ | `.eslintrc.json` | Legacy, ainda suportado |
| 9.x | 9 | 18.18+ | `eslint.config.mjs` | Flat config, novo padrão |
| 15.x | 9 | 18.18+ | `eslint.config.mjs` | Next.js nativo |

A configuração deste projeto usa **ESLint 9** com **flat config**, que é o padrão moderno.
