# ESLint + Prettier + Husky + lint-staged Setup para Next.js 15 + TypeScript

Guia de configuração completo para code quality com Next.js 15, TypeScript, ESLint, Prettier, Husky e lint-staged.

## Visão Geral

Este projeto está configurado com:
- **ESLint 9+**: Linting com flat config (`eslint.config.mjs`)
- **Prettier**: Formatação de código
- **Husky v9+**: Git hooks automatizados
- **lint-staged**: Executa linters apenas em arquivos staged
- **simple-import-sort**: Ordenação automática de imports
- **unicorn**: Regras ESLint para melhores práticas
- **jsx-a11y**: Acessibilidade em React/JSX
- **prettier-plugin-tailwindcss**: Ordenação de classes Tailwind

## Instalação

### 1. Instalar Dependências

```bash
npm install --save-dev eslint @eslint/eslintrc
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev eslint-config-next eslint-config-prettier
npm install --save-dev eslint-plugin-react eslint-plugin-import
npm install --save-dev eslint-plugin-simple-import-sort
npm install --save-dev eslint-plugin-unicorn
npm install --save-dev eslint-plugin-jsx-a11y
npm install --save-dev prettier prettier-plugin-tailwindcss
npm install --save-dev husky lint-staged
```

Ou em um comando único:

```bash
npm install --save-dev \
  eslint @eslint/eslintrc \
  @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  eslint-config-next eslint-config-prettier \
  eslint-plugin-react eslint-plugin-import \
  eslint-plugin-simple-import-sort eslint-plugin-unicorn \
  eslint-plugin-jsx-a11y \
  prettier prettier-plugin-tailwindcss \
  husky lint-staged
```

### 2. Inicializar Husky

```bash
npx husky init
```

Este comando:
- Cria o diretório `.husky`
- Adiciona o script `"prepare": "husky"` ao `package.json`

### 3. Arquivos de Configuração

Os seguintes arquivos já estão configurados:

- **eslint.config.mjs** - Configuração ESLint com flat config
- **prettier.config.js** - Configuração Prettier
- **.prettierignore** - Arquivos a ignorar no Prettier
- **.eslintignore** - Arquivos a ignorar no ESLint
- **lint-staged.config.js** - Configuração do lint-staged
- **.husky/pre-commit** - Hook que executa lint-staged

## Scripts do package.json

Adicione os seguintes scripts ao seu `package.json`:

```json
{
  "scripts": {
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit",
    "test-all": "npm run format:check && npm run lint && npm run type-check"
  }
}
```

## Uso

### Verificar Linting

```bash
npm run lint
```

### Corrigir Problemas de Linting Automaticamente

```bash
npm run lint:fix
```

### Formatar Código

```bash
npm run format
```

### Verificar Formatação (sem modificar)

```bash
npm run format:check
```

### Verificar Tipos TypeScript

```bash
npm run type-check
```

### Executar Todas as Verificações

```bash
npm run test-all
```

## Configuração do VSCode

Instale as extensões recomendadas:

1. **ESLint** (Microsoft) - `dbaeumer.vscode-eslint`
2. **Prettier** (Prettier) - `esbenp.prettier-vscode`
3. **TypeScript Vue Plugin** (Vue) - `Vue.vscode-typescript-vue-plugin`

Adicione ao `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always",
    "source.organizeImports": "never"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Funcionalidades por Arquivo

### eslint.config.mjs

- **Extends**: next, next/core-web-vitals, next/typescript
- **Plugins**: simple-import-sort, unicorn, import, jsx-a11y
- **Regras principais**:
  - `simple-import-sort/imports`: Ordena imports automaticamente
  - `unicorn/filename-case`: Força camelCase/PascalCase em nomes de arquivos
  - `import/no-unresolved`: Detecta imports não resolvidos (ignora @/)
  - `jsx-a11y/*`: Regras de acessibilidade como warnings

### prettier.config.js

- **arrowParens**: 'always' - Força parênteses em arrow functions
- **semi**: false - Remove ponto e vírgula
- **singleQuote**: true - Usa aspas simples
- **tabWidth**: 2 - Indentação de 2 espaços
- **trailingComma**: 'all' - Sempre adiciona vírgula ao final
- **printWidth**: 80 - Largura máxima de 80 caracteres
- **plugins**: prettier-plugin-tailwindcss - Ordena classes Tailwind

### lint-staged.config.js

Executa:
- ESLint com fix automático em arquivos JS/TS
- Prettier em todos os tipos de arquivo suportados

### .husky/pre-commit

Hook que executa `lint-staged` antes de cada commit, garantindo qualidade do código.

## Troubleshooting

### ESLint não encontra módulos com path aliases (@/)

A configuração já inclui suporte para path aliases. Se ainda tiver problema, verifique seu `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Prettier vs ESLint conflitando

A configuração já desativa regras de formatação do ESLint que conflitam com Prettier.
Se tiver problemas, execute:

```bash
npm run lint:fix && npm run format
```

### Husky hooks não estão sendo executados

Certifique-se de que:

```bash
# Torne o script executável
chmod +x .husky/pre-commit

# Verifique se Husky está instalado
npx husky

# Instale novamente se necessário
npm install husky --save-dev
npx husky install
```

### Node version mismatch

`import.meta.dirname` requer Node.js 20.11.0+. Verifique com:

```bash
node --version
```

Se precisar de suporte para versões antigas, adicione um polyfill ao `eslint.config.mjs`:

```javascript
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})
```

## Recursos Adicionais

- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [Next.js Linting](https://nextjs.org/docs/app/building-your-application/configuring-your-app/linting)
- [Prettier Documentation](https://prettier.io/docs/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged)
- [eslint-plugin-simple-import-sort](https://github.com/lydell/eslint-plugin-simple-import-sort)
- [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)

## Próximos Passos

1. Instale as dependências: `npm install`
2. Inicialize Husky (se não estiver feito): `npx husky install`
3. Configure VSCode com as extensões recomendadas
4. Teste: `npm run test-all`
5. Faça seu primeiro commit - o pre-commit hook será executado automaticamente

## Notas Importantes

- Todos os hooks são executados automaticamente via Husky
- O lint-staged otimiza o processo ao executar apenas em arquivos staged
- Use `npm run lint:fix` para corrigir problemas automaticamente
- Use `npm run format` para formatar código manualmente
- Commits com problemas não resolvidos serão bloqueados pelo pre-commit hook
