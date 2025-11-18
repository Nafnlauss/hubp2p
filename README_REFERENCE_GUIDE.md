# React 19 & TypeScript 5.x - Guia de Referência Completo

Documentação abrangente com as últimas features, melhores práticas e padrões profissionais para desenvolvimento moderno em React e TypeScript.

**Atualizado para:** React 19.2, TypeScript 5.7, Novembro 2025

---

## 📚 Documentos Disponíveis

### 1. **REACT_TYPESCRIPT_2025_REFERENCE.md** (Principal)
Guia completo com todas as features e padrões.

**Conteúdo:**
- React 19 - Novas Features (Actions, Async Transitions)
- React 19 - Novos Hooks (useActionState, useOptimistic, useFormStatus, use)
- React 19.2 - Features Adicionais (Activity, useEffectEvent, cacheSignal, Performance Tracks, Partial Pre-rendering)
- TypeScript 5.x Configuration (tsconfig.json best practices)
- TypeScript Padrões de Type Safety (discriminated unions, type guards, const assertions, Record types, utility types)
- Padrões de Componentes React + TypeScript
- Props Typing - Melhores Práticas
- Code Snippets prontos para usar

**Use quando:** Precisa aprender sobre uma feature específica, entender um padrão ou copiar snippets.

---

### 2. **TYPESCRIPT_CONFIG_TEMPLATES.md** (Templates)
Arquivos de configuração prontos para usar em novos projetos.

**Conteúdo:**
- tsconfig.json completo (pronto para copiar)
- eslint.config.js (Flat Config v9+)
- prettier.config.js
- package.json com todos os scripts
- vite.config.ts com React 19
- src/types/index.ts (base types)
- src/hooks/ (useAsync, useLocalStorage, usePrevious, useDebounce)
- src/components/Example.tsx (template de componente)
- src/hooks/useForm.ts (custom hook completo)
- src/context/ThemeContext.tsx (Context com TypeScript)

**Use quando:** Iniciando novo projeto e precisa de setup básico pronto.

---

### 3. **ADVANCED_PATTERNS_2025.md** (Padrões Avançados)
Padrões profissionais e compostos para código robusto.

**Conteúdo:**
- Form Actions com Type Safety
- Composição com Discriminated Unions
- Polymorphic Components
- Render Props com Type Safety
- HOC (Higher-Order Components)
- Context + Reducer Pattern
- Custom Hooks Avançados
- Type-Safe API Calls
- Compound Component Pattern
- Error Boundaries
- Lazy Loading + Suspense

**Use quando:** Precisa implementar patterns mais complexos ou está refatorando código.

---

### 4. **QUICK_REFERENCE.md** (Referência Rápida)
Snippets curtos e fáceis de encontrar. Salve como bookmark!

**Conteúdo:**
- TypeScript Essencial (types, generics, unions)
- React 19 Hooks resumidos (useActionState, useOptimistic, useFormStatus, use)
- Padrões TypeScript mais usados
- Componentes comuns
- Form Handling
- API Calls
- Context simples
- Debugging & Tips
- Erros comuns & Soluções

**Use quando:** Precisa de um snippet rápido ou referência curta.

---

### 5. **BEST_PRACTICES_CHECKLIST.md** (Checklist)
Checklist para garantir qualidade em cada projeto.

**Conteúdo:**
- Setup Inicial (TypeScript, ESLint, Prettier, estrutura de diretórios)
- Padrões de Tipos
- Componentes (props, organization, refs)
- Hooks (custom hooks, useEffect, form hooks)
- Type Safety (function params, async, null handling)
- Server Components (React 19)
- Performance (code splitting, optimization)
- Testing (types para testes, organization)
- Error Handling
- Code Quality (naming, comments, linting)
- Security (input validation, env vars)
- Documentation
- Deploy Checklist
- Maintenance

**Use quando:** Antes de fazer commit, antes de deploy, ou para melhorar código existente.

---

## 🚀 Guia Rápido por Cenário

### Novo Projeto
1. Leia: TYPESCRIPT_CONFIG_TEMPLATES.md
2. Copie: tsconfig.json, eslint.config.js, package.json
3. Rode: `npm install` e `npm run dev`
4. Consulte: QUICK_REFERENCE.md para snippets iniciais

### Implementar Nova Feature
1. Consulte: REACT_TYPESCRIPT_2025_REFERENCE.md (seção relevante)
2. Copie: snippet de código
3. Adapte: para seu contexto
4. Valide: com `npm run type-check`

### Code Review / Melhorar Código
1. Abra: BEST_PRACTICES_CHECKLIST.md
2. Verifique: cada item relevante
3. Refatore: código conforme necessário
4. Teste: `npm run lint && npm run type-check`

### Padrão Complexo
1. Busque: ADVANCED_PATTERNS_2025.md
2. Estude: o padrão desejado
3. Adapte: para seu uso case
4. Teste: com seu código

### Preciso de Um Snippet Rápido
1. Abra: QUICK_REFERENCE.md (Ctrl+F / Cmd+F)
2. Procure: por palavra-chave
3. Copie: o snippet
4. Paste: no seu editor

---

## 📋 Checklist de Setup (Primeira Vez)

- [ ] Leia TYPESCRIPT_CONFIG_TEMPLATES.md até o fim
- [ ] Copie tsconfig.json para seu projeto
- [ ] Copie eslint.config.js para seu projeto
- [ ] Atualize package.json com scripts
- [ ] Rode: `npm install`
- [ ] Rode: `npm run type-check` (deve passar)
- [ ] Rode: `npm run lint` (deve passar)
- [ ] Rode: `npm run dev`
- [ ] Crie primeiro componente com tipos (copie de template)
- [ ] Salve QUICK_REFERENCE.md como bookmark
- [ ] Imprima BEST_PRACTICES_CHECKLIST.md

---

## 🎯 Ficha Técnica

### React 19 - Principais Novidades
```typescript
// 1. useActionState (forms)
const [error, submitAction, isPending] = useActionState(action, null);

// 2. useOptimistic (updates otimistas)
const [optimistic, update] = useOptimistic(state, updateFn);

// 3. useFormStatus (status do form parent)
const { pending } = useFormStatus();

// 4. use() (promises em render)
const data = use(promise);

// 5. Activity component (pre-render oculto)
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <Component />
</Activity>

// 6. useEffectEvent (evita dependências)
const onEvent = useEffectEvent(() => { });

// 7. ref como prop (React 19)
function Input({ ref }) { return <input ref={ref} />; }
```

### TypeScript 5.7 - Principais Features
```typescript
// 1. Strict mode (sempre use!)
// tsconfig: "strict": true

// 2. Const assertions (imutabilidade)
const config = { api: 'url' } as const;

// 3. Discriminated unions (type narrowing)
type Result<T> = { status: 'ok'; data: T } | { status: 'err'; error: string };

// 4. Record types (mapas tipados)
type Status = 'pending' | 'done';
const labels: Record<Status, string> = { pending: '...', done: '✓' };

// 5. satisfies operator (validação sem widening)
const config = { a: 'string' } satisfies Record<string, string>;

// 6. Utility types (Partial, Pick, Omit, etc)
type Preview = Omit<User, 'password'>;

// 7. Type guards (narrowing seguro)
function isError(e: unknown): e is Error { return e instanceof Error; }
```

---

## 📖 Índice por Tópico

### React Hooks (React 19)
- useActionState → REACT_TYPESCRIPT_2025_REFERENCE.md
- useOptimistic → REACT_TYPESCRIPT_2025_REFERENCE.md & ADVANCED_PATTERNS_2025.md
- useFormStatus → REACT_TYPESCRIPT_2025_REFERENCE.md & QUICK_REFERENCE.md
- use() → REACT_TYPESCRIPT_2025_REFERENCE.md
- useEffectEvent → REACT_TYPESCRIPT_2025_REFERENCE.md
- useForm (custom) → TYPESCRIPT_CONFIG_TEMPLATES.md

### Padrões de Componentes
- Functional Components → REACT_TYPESCRIPT_2025_REFERENCE.md & QUICK_REFERENCE.md
- Generic Components → REACT_TYPESCRIPT_2025_REFERENCE.md & ADVANCED_PATTERNS_2025.md
- Polymorphic Components → ADVANCED_PATTERNS_2025.md
- Compound Components → ADVANCED_PATTERNS_2025.md
- HOC → ADVANCED_PATTERNS_2025.md

### TypeScript Padrões
- Discriminated Unions → REACT_TYPESCRIPT_2025_REFERENCE.md & QUICK_REFERENCE.md
- Type Guards → REACT_TYPESCRIPT_2025_REFERENCE.md
- Const Assertions → REACT_TYPESCRIPT_2025_REFERENCE.md & QUICK_REFERENCE.md
- Record Types → REACT_TYPESCRIPT_2025_REFERENCE.md
- Utility Types → REACT_TYPESCRIPT_2025_REFERENCE.md

### Configuração
- tsconfig.json → TYPESCRIPT_CONFIG_TEMPLATES.md
- ESLint → TYPESCRIPT_CONFIG_TEMPLATES.md
- Prettier → TYPESCRIPT_CONFIG_TEMPLATES.md
- Vite → TYPESCRIPT_CONFIG_TEMPLATES.md

### Forms
- Server Actions → ADVANCED_PATTERNS_2025.md
- useActionState → QUICK_REFERENCE.md
- useOptimistic Forms → ADVANCED_PATTERNS_2025.md
- useForm Hook → TYPESCRIPT_CONFIG_TEMPLATES.md

### API Calls
- Typed Fetch → QUICK_REFERENCE.md & ADVANCED_PATTERNS_2025.md
- API Client → ADVANCED_PATTERNS_2025.md
- Error Handling → ADVANCED_PATTERNS_2025.md

### Performance
- Code Splitting → ADVANCED_PATTERNS_2025.md & BEST_PRACTICES_CHECKLIST.md
- useMemo / useCallback → BEST_PRACTICES_CHECKLIST.md
- Performance Tracks → REACT_TYPESCRIPT_2025_REFERENCE.md

### Qualidade
- Type Safety → BEST_PRACTICES_CHECKLIST.md
- Code Quality → BEST_PRACTICES_CHECKLIST.md
- Testing → BEST_PRACTICES_CHECKLIST.md
- Error Handling → BEST_PRACTICES_CHECKLIST.md & ADVANCED_PATTERNS_2025.md

---

## 💾 Como Usar Este Guia

### No Editor (Recomendado)
1. Abra todos os 5 arquivos em abas
2. Use Ctrl+F / Cmd+F para buscar
3. Copie e adapte snippets conforme necessário

### Na Linha de Comando
```bash
# Ver conteúdo
cat QUICK_REFERENCE.md | less

# Buscar por palavra-chave
grep -n "useActionState" *.md

# Ver um arquivo específico
cat REACT_TYPESCRIPT_2025_REFERENCE.md
```

### No Git
```bash
# Adicione ao seu repositório
git add REACT_TYPESCRIPT_2025_REFERENCE.md
git add TYPESCRIPT_CONFIG_TEMPLATES.md
git add ADVANCED_PATTERNS_2025.md
git add QUICK_REFERENCE.md
git add BEST_PRACTICES_CHECKLIST.md

# Crie um branch para referência
git checkout -b docs/react-typescript-guide
```

---

## 🔄 Atualizações Futuras

Este guia foi criado em **Novembro de 2025** com:
- React 19.2 (última versão)
- TypeScript 5.7 (última versão)
- ESLint Flat Config v9+
- Vite 6+
- Node.js 20+

Procure atualizações quando:
- React 20 for lançado
- TypeScript 6 for lançado
- ESLint v10 for lançado
- Novos padrões surgirem na comunidade

---

## 🤝 Contribuindo

Encontrou um erro ou quer adicionar algo?

1. Identifique o arquivo relevante
2. Edite o documento
3. Valide com exemplos
4. Commit: `docs: update [filename] with [change]`

---

## 📞 Suporte Rápido

### "Como faço X em React 19?"
→ REACT_TYPESCRIPT_2025_REFERENCE.md

### "Qual é a sintaxe para Y em TypeScript?"
→ QUICK_REFERENCE.md (Ctrl+F)

### "Como estruturar meu projeto?"
→ TYPESCRIPT_CONFIG_TEMPLATES.md

### "Quero implementar o padrão Z"
→ ADVANCED_PATTERNS_2025.md

### "Preciso melhorar a qualidade do código"
→ BEST_PRACTICES_CHECKLIST.md

---

## 📊 Estatísticas dos Documentos

| Arquivo | Linhas | Snippets | Padrões |
|---------|--------|----------|---------|
| REACT_TYPESCRIPT_2025_REFERENCE.md | 1200+ | 50+ | 15+ |
| TYPESCRIPT_CONFIG_TEMPLATES.md | 600+ | 15+ | 10+ |
| ADVANCED_PATTERNS_2025.md | 800+ | 20+ | 10+ |
| QUICK_REFERENCE.md | 400+ | 30+ | 20+ |
| BEST_PRACTICES_CHECKLIST.md | 500+ | 10+ | 50+ |
| **TOTAL** | **3500+** | **125+** | **105+** |

---

## 🎓 Curva de Aprendizado

```
Iniciante
   ↓
   └─→ Leia: QUICK_REFERENCE.md
   └─→ Copie: TYPESCRIPT_CONFIG_TEMPLATES.md
   └─→ Estude: REACT_TYPESCRIPT_2025_REFERENCE.md
   ↓
Intermediário
   ↓
   └─→ Aplique: BEST_PRACTICES_CHECKLIST.md
   └─→ Implemente: ADVANCED_PATTERNS_2025.md
   └─→ Refatore: código existente
   ↓
Avançado
   ↓
   └─→ Crie seus próprios padrões
   └─→ Optimize performance
   └─→ Contribua para comunidade
```

---

## ✅ Verificação Final

Antes de começar qualquer projeto:

```bash
# 1. Leia este README
✓

# 2. Consulte TYPESCRIPT_CONFIG_TEMPLATES.md
✓

# 3. Configure seu projeto
npm install && npm run type-check
✓

# 4. Crie um componente de teste
# (use template de TYPESCRIPT_CONFIG_TEMPLATES.md)
✓

# 5. Valide
npm run lint
✓

# Pronto! 🚀
```

---

## 📚 Recursos Externos

- React Official Docs: https://react.dev
- TypeScript Handbook: https://www.typescriptlang.org/docs
- ESLint Rules: https://eslint.org/docs/latest/rules
- TypeScript ESLint: https://typescript-eslint.io
- React Patterns: https://legacy.reactjs.org/docs/thinking-in-react.html

---

## 📝 Notas Importantes

1. **TypeScript Strict Mode é Obrigatório**
   - Ativa todas as verificações
   - Previne a maioria dos bugs
   - Melhora a refatoração

2. **React 19 Muda Algumas Coisas**
   - `forwardRef` não é mais necessário
   - `React.FC` é deprecated
   - Novos hooks tornam forms muito mais simples

3. **Discriminated Unions São Seu Amigo**
   - Use para variantes de componentes
   - Use para API responses
   - Use para estado async

4. **Type Safety Economiza Tempo**
   - Menos bugs em produção
   - Refatoração mais segura
   - Melhor autocompletar no editor

5. **ESLint + Prettier Salvam Vidas**
   - Qualidade consistente
   - Menos discussões no code review
   - Menos refatorações desnecessárias

---

**Criado com ❤️ em Novembro de 2025**

**Mantenha este guia à mão. Você voltará aqui frequentemente!** 📌

---

## 🎯 Próximos Passos

1. [ ] Salve este arquivo (README_REFERENCE_GUIDE.md)
2. [ ] Abra os 5 arquivos em seu editor favorito
3. [ ] Crie bookmark desta pasta em seu navegador
4. [ ] Comece um novo projeto usando TYPESCRIPT_CONFIG_TEMPLATES.md
5. [ ] Codifique com confiança! 🚀

---

**Versão:** 1.0
**Data:** Novembro 2025
**React:** 19.2
**TypeScript:** 5.7
**Status:** ✅ Pronto para usar
