# Configuração ESLint + Prettier + Husky para Next.js 15 + TypeScript

## 📋 Resumo Executivo

Este projeto inclui uma configuração completa e otimizada de **ESLint**, **Prettier**, **Husky** e **lint-staged** para Next.js 15 com TypeScript. A configuração segue as melhores práticas de 2025 e está pronta para produção.

## 📁 Arquivos de Configuração

### Core Configuration Files

| Arquivo | Propósito |
|---------|-----------|
| **eslint.config.mjs** | Configuração ESLint com flat config (ESLint 9+) |
| **prettier.config.js** | Configuração Prettier com suporte a TailwindCSS |
| **lint-staged.config.js** | Configuração do lint-staged para pre-commit hook |
| **.husky/pre-commit** | Git hook que executa lint-staged |
| **.eslintignore** | Arquivos a ignorar pelo ESLint |
| **.prettierignore** | Arquivos a ignorar pelo Prettier |

### Documentation Files

| Documento | Conteúdo |
|-----------|----------|
| **LINTING_SETUP.md** | Guia de instalação e uso (comece aqui) |
| **ESLINT_PRETTIER_ADVANCED.md** | Configurações avançadas e troubleshooting |
| **CONFIGURATION_COMPARISON.md** | Comparativo de diferentes abordagens |
| **package.json.example** | Exemplo com dependências recomendadas |
| **.vscode-settings.example.json** | Configuração recomendada para VSCode |

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
npm install --save-dev \
  eslint @eslint/eslintrc @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-config-next eslint-config-prettier eslint-plugin-react eslint-plugin-import \
  eslint-plugin-simple-import-sort eslint-plugin-unicorn eslint-plugin-jsx-a11y \
  prettier prettier-plugin-tailwindcss husky lint-staged
```

### 2. Inicializar Husky

```bash
npx husky init
```

### 3. Adicionar Scripts ao package.json

```json
{
  "scripts": {
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test-all": "npm run format:check && npm run lint && npm run type-check",
    "prepare": "husky"
  }
}
```

### 4. Testar

```bash
npm run test-all
```

## 📊 Funcionalidades Incluídas

### ESLint (eslint.config.mjs)

- ✅ Flat config moderno (ESLint 9)
- ✅ Next.js 15 + TypeScript suporte completo
- ✅ Regras de acessibilidade (jsx-a11y)
- ✅ Qualidade de código (unicorn)
- ✅ Ordenação automática de imports (simple-import-sort)
- ✅ Suporte a path aliases (@/)

### Prettier (prettier.config.js)

- ✅ Formatação consistente
- ✅ Suporte TailwindCSS (ordena classes automaticamente)
- ✅ Compatível com ESLint (sem conflitos)
- ✅ 80 caracteres por linha
- ✅ Aspas simples e sem ponto e vírgula

### Husky + lint-staged

- ✅ Pre-commit hook automático
- ✅ Executa ESLint + Prettier apenas em arquivos staged
- ✅ Bloqueia commits com problemas não resolvidos
- ✅ Instalado automaticamente após `npm install`

## 🎯 Fluxo de Trabalho

```
git add files
  ↓
git commit
  ↓
Husky pre-commit hook
  ↓
lint-staged executa
  ↓
ESLint --fix + Prettier --write
  ↓
Commit aceito ou rejeitado
```

## 📦 Dependências

### Production
- `next` ^15.0.0
- `react` ^19.0.0-rc
- `react-dom` ^19.0.0-rc
- `typescript` ^5.6.0

### Dev Dependencies (Linting/Formatting)
- `eslint` ^9.0.0 - Linter JavaScript
- `@eslint/eslintrc` ^3.0.0 - Compatibilidade com configs antigos
- `@typescript-eslint/parser` - Parser TypeScript
- `@typescript-eslint/eslint-plugin` - Regras TypeScript
- `eslint-config-next` - Configuração Next.js
- `eslint-config-prettier` - Desabilita regras conflitantes
- `eslint-plugin-simple-import-sort` - Ordena imports
- `eslint-plugin-unicorn` - Regras de qualidade
- `eslint-plugin-jsx-a11y` - Acessibilidade
- `prettier` ^3.3.0 - Formatador
- `prettier-plugin-tailwindcss` ^0.6.0 - Suporte Tailwind
- `husky` ^9.1.0 - Git hooks
- `lint-staged` ^15.2.0 - Run linters em staged files

## 🔧 Comandos Disponíveis

```bash
# Verificar problemas de lint
npm run lint

# Corrigir automaticamente
npm run lint:fix

# Formatar código
npm run format

# Verificar formatação (sem modificar)
npm run format:check

# Verificar tipos TypeScript
npm run type-check

# Executar todas as verificações
npm run test-all
```

## 🎨 Regras de Formatação

### ESLint

- **Espaçamento**: 2 espaços
- **Ponto e vírgula**: Desabilitado
- **Aspas**: Simples ('texto')
- **Trailing comma**: Sempre
- **Arrow functions**: Sempre com parênteses
- **Print width**: 80 caracteres

### Prettier

- Mesmos padrões acima
- Ordena classes TailwindCSS automaticamente
- Final de linha automático (LF/CRLF)

## 🆚 ESLint vs Prettier

| Ferramenta | Função | Conflito? |
|-----------|--------|----------|
| ESLint | Detecta bugs e qualidade | Sim |
| Prettier | Formata código | Resolvido com eslint-config-prettier |

A configuração já inclui `eslint-config-prettier` para prevenir conflitos.

## 🔐 Configuração de Segurança

- ❌ Sem `console.log` em produção
- ✅ TypeScript strict mode recomendado
- ✅ Acessibilidade garantida (alt text, aria-labels, etc)
- ✅ Path traversal prevention
- ✅ XSS prevention (React default)

## 📱 VSCode Setup

Instale as extensões:
1. **ESLint** (Microsoft)
2. **Prettier** (Prettier)

Adicione ao `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always"
  }
}
```

## 📚 Documentação

- **[LINTING_SETUP.md](./LINTING_SETUP.md)** - Comece aqui! Guia completo de instalação
- **[ESLINT_PRETTIER_ADVANCED.md](./ESLINT_PRETTIER_ADVANCED.md)** - Regras customizadas e troubleshooting
- **[CONFIGURATION_COMPARISON.md](./CONFIGURATION_COMPARISON.md)** - Comparativo de abordagens diferentes

## 🐛 Troubleshooting Rápido

**Problema**: ESLint não encontra módulos com @/
```bash
# Certifique-se que tsconfig.json tem:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  }
}
```

**Problema**: Prettier e ESLint conflitando
```bash
npm run lint:fix && npm run format
```

**Problema**: Husky hooks não funcionam
```bash
chmod +x .husky/pre-commit
npx husky install
```

## 🚢 CI/CD Integration

As configurações podem ser integradas com:
- ✅ GitHub Actions (exemplo em ESLINT_PRETTIER_ADVANCED.md)
- ✅ GitLab CI
- ✅ Jenkins
- ✅ CircleCI

## 📊 Performance

- ESLint cache automático (9+)
- lint-staged otimiza executando apenas em files staged
- Sem overhead significativo em projetos < 1000 arquivos

## 🎓 Versões

- **ESLint**: 9.x (flat config)
- **Prettier**: 3.x
- **Node.js**: 20.11.0+ (para import.meta.dirname)
- **TypeScript**: 5.x
- **Next.js**: 15.x

## 📝 Próximos Passos

1. ✅ Copie os arquivos de config para seu projeto
2. ✅ Instale dependências: `npm install`
3. ✅ Inicialize Husky: `npx husky install`
4. ✅ Configure VSCode com extensões
5. ✅ Execute `npm run test-all` para testar
6. ✅ Faça seu primeiro commit!

## 🔗 Links Úteis

- [ESLint Docs](https://eslint.org)
- [Prettier Docs](https://prettier.io)
- [TypeScript ESLint](https://typescript-eslint.io)
- [Next.js Linting](https://nextjs.org/docs/app/building-your-application/configuring-your-app/linting)
- [Husky](https://typicode.github.io/husky)
- [lint-staged](https://github.com/lint-staged/lint-staged)

---

**Última atualização**: Novembro 2025
**Compatível com**: Next.js 15, TypeScript 5.6+, Node.js 20.11+
