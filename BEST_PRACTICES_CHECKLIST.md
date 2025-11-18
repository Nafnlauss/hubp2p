# React 19 + TypeScript - Checklist de Boas Práticas

Use este checklist em cada novo projeto ou refatoração.

---

## Setup Inicial

### TypeScript Configuration
- [ ] `strict: true` em tsconfig.json
- [ ] `noImplicitAny: true`
- [ ] `noUnusedLocals: true`
- [ ] `noUnusedParameters: true`
- [ ] `noImplicitReturns: true`
- [ ] `esModuleInterop: true`
- [ ] `skipLibCheck: true` (performance)
- [ ] Path aliases configurados (@/, @components/, etc)
- [ ] `target: ES2020` ou superior
- [ ] `module: NodeNext`

### ESLint & Prettier
- [ ] ESLint configurado com TypeScript parser
- [ ] `eslint-plugin-react-hooks` v6+
- [ ] Prettier configurado
- [ ] Scripts em package.json:
  - `lint`
  - `lint:fix`
  - `format`
  - `type-check`
- [ ] Pre-commit hook com type-check + lint

### Estrutura de Diretórios
```
src/
  ├── components/     # Componentes reutilizáveis
  ├── hooks/          # Custom hooks
  ├── context/        # Context + Providers
  ├── lib/            # Funções utilitárias
  ├── types/          # Type definitions
  ├── actions/        # Server actions
  ├── styles/         # CSS/CSS-in-JS
  ├── App.tsx         # Root component
  └── main.tsx        # Entry point
```

---

## Padrões de Tipos

### Sempre Use Tipos Explícitos
```typescript
// ❌ Evite: any
function process(data: any) { }

// ✅ Use: tipo específico ou unknown com type guard
function process(data: unknown) {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}
```

### Discriminated Unions para Variantes
```typescript
// ❌ Evite: múltiplos booleans
interface ButtonProps {
  isPrimary?: boolean;
  isSecondary?: boolean;
  isDanger?: boolean;
}

// ✅ Use: discriminated union
type ButtonProps =
  | { variant: 'primary'; }
  | { variant: 'secondary'; }
  | { variant: 'danger'; };
```

### Type Assertion vs satisfies
```typescript
// ❌ Type assertion pode esconder erros
const config = { apiUrl: 'https://...' } as Config;

// ✅ satisfies valida sem widening
const config = { apiUrl: 'https://...' } satisfies Config;
```

### Evite any, Use unknown
```typescript
// ❌ Perigoso
function handle(data: any) {
  data.foo.bar.baz(); // Sem verificação
}

// ✅ Type-safe
function handle(data: unknown) {
  if (typeof data === 'object' && data !== null && 'foo' in data) {
    // Agora é seguro acessar
  }
}
```

---

## Componentes

### Props Typing
- [ ] Sempre crie interface para props
- [ ] Use `React.ReactNode` para children
- [ ] Type event handlers: `React.MouseEvent<HTMLButtonElement>`
- [ ] Evite `React.FC<Props>` - use function typing direto
- [ ] Use `ref` como prop diretamente (React 19)

```typescript
// ✅ Bom padrão
interface ButtonProps {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({
  label,
  onClick,
  disabled = false,
  children,
  ref
}: ButtonProps) {
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
    >
      {children || label}
    </button>
  );
}
```

### Component Organization
- [ ] Um componente por arquivo
- [ ] Componentes em PascalCase (Button.tsx)
- [ ] Exports nomeados, não default
- [ ] Coloque tipos no mesmo arquivo
- [ ] Adicione comentário JSDoc em componentes públicos

```typescript
/**
 * Componente Button reutilizável
 *
 * @example
 * ```tsx
 * <Button onClick={() => console.log('clicked')} label="Clique-me" />
 * ```
 */
export function Button(props: ButtonProps) {
  // ...
}
```

### Refs Corretamente
```typescript
// ✅ React 19 - ref como prop
function Input({ ref }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} />;
}

// ✅ Uso
const inputRef = useRef<HTMLInputElement>(null);
<Input ref={inputRef} />

// ❌ Evite forwardRef (apenas em React < 19)
```

---

## Hooks

### Custom Hooks
- [ ] Sempre começam com `use`
- [ ] Tipem retorno explicitamente
- [ ] Evitem lógica complexa (use reducer se necessário)
- [ ] Documente as dependências

```typescript
// ✅ Bom padrão
export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate = true
): {
  loading: boolean;
  data?: T;
  error?: E;
  execute: () => Promise<void>;
} {
  // implementação...
}
```

### useEffect
- [ ] Sempre liste dependências corretamente
- [ ] Use ESLint para verificar dependências
- [ ] Cleanup functions quando necessário
- [ ] Evite efeitos sem dependências

```typescript
// ❌ Evite
useEffect(() => {
  fetchData(props.id); // props.id não está nas dependências!
});

// ✅ Use
useEffect(() => {
  fetchData(props.id);
}, [props.id]); // Explícito

// ✅ Ou melhor ainda: useEffectEvent (React 19)
const onFetch = useEffectEvent(() => {
  fetchData(props.id);
});

useEffect(() => {
  onFetch();
}, []); // Sem dependência mutável
```

### Form Hooks (React 19)
- [ ] Use `useActionState` para form submissions
- [ ] Use `useOptimistic` para updates otimistas
- [ ] Use `useFormStatus` em components dentro do form
- [ ] Sempre resete form after submit

```typescript
const [error, formAction, isPending] = useActionState(
  async (prevState, formData) => {
    // Handle submission
  },
  null
);
```

---

## Type Safety

### Function Parameters & Returns
```typescript
// ❌ Evite
function process(data) { }
function getData(): any { }

// ✅ Use
function process(data: Data): void { }
function getData(): Promise<User[]> { }

// ✅ Com overloads para casos especiais
function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string {
  return String(value);
}
```

### Async/Promises
```typescript
// ❌ Evite
async function getData() { /* ... */ }

// ✅ Type explicitamente
async function getData(): Promise<User[]> {
  // ...
}

// ✅ Error handling tipado
type Result<T> = { success: true; data: T } | { success: false; error: string };

async function safeGetData(): Promise<Result<User[]>> {
  try {
    // ...
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### Null/Undefined Handling
```typescript
// ❌ Assume que existe
const name = user.profile.name;

// ✅ Use optional chaining
const name = user?.profile?.name;

// ✅ Use nullish coalescing
const name = user?.profile?.name ?? 'Unknown';

// ✅ Type com undefined quando apropriado
interface User {
  name: string;
  bio?: string; // Pode ser undefined
}
```

---

## Server Components (React 19)

- [ ] Use Server Components por default
- [ ] Use `'use client'` apenas quando necessário
- [ ] Evite passar functions como props entre server/client
- [ ] Use Server Actions para mutations
- [ ] Tipifique Server Action inputs/outputs

```typescript
// ✅ Server Component (default)
export async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <div>{user.name}</div>;
}

// ✅ Client Component quando necessário
'use client';

export function InteractiveButton({ onSubmit }: { onSubmit: () => void }) {
  const [loading, setLoading] = useState(false);
  // ...
}

// ✅ Server Action com tipos
'use server';

export async function updateUser(
  userId: string,
  data: Partial<User>
): Promise<Result<User>> {
  // ...
}
```

---

## Performance

### Code Splitting
- [ ] Use `lazy()` + `Suspense` para grandes componentes
- [ ] Lazy load rotas com `React.lazy`
- [ ] Implemente `onLazy` callback para tracking

```typescript
const HeavyChart = lazy(() => import('./HeavyChart'));

<Suspense fallback={<Spinner />}>
  <HeavyChart />
</Suspense>
```

### Optimization
- [ ] Use `useMemo` apenas para cálculos caros
- [ ] Use `useCallback` apenas quando necessário (passar como prop)
- [ ] Evite render props desnecessários
- [ ] Split grande componentes em menores

```typescript
// ✅ Otimize quando realmente necessário
const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  doSomething(value);
}, [value]);
```

### React DevTools
- [ ] Instale React DevTools extension
- [ ] Use React Profiler para identificar renders lentos
- [ ] Verifique re-renders desnecessários

---

## Testing

### Types para Testes
```typescript
// ✅ Mock com tipos
const mockUser: User = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
};

// ✅ Type assertions para testes
const { getByRole } = render(<Button label="Click" />);
const button = getByRole('button') as HTMLButtonElement;

// ✅ Custom matchers com tipos
expect.extend({
  toBeValidEmail(received: string) {
    // ...
  },
});
```

### Test Organization
- [ ] Um arquivo .test.ts por arquivo .ts
- [ ] Organize testes por funcionalidade
- [ ] Use `describe` para agrupar testes
- [ ] Use nomes descritivos

```typescript
describe('Button Component', () => {
  describe('rendering', () => {
    it('should render with label', () => {
      // ...
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', () => {
      // ...
    });
  });
});
```

---

## Error Handling

### Error Boundaries
- [ ] Envolva seções críticas com ErrorBoundary
- [ ] Implemente fallback UI
- [ ] Log de erros em produção

```typescript
<ErrorBoundary
  fallback={(error) => <ErrorUI message={error.message} />}
  onError={(error) => reportError(error)}
>
  <CriticalComponent />
</ErrorBoundary>
```

### API Errors
```typescript
// ✅ Sempre tipe erros
type ApiError = {
  code: string;
  message: string;
  status: number;
};

// ✅ Trate erros explicitamente
try {
  await fetchUser();
} catch (error) {
  if (error instanceof ApiError) {
    showNotification(error.message);
  }
}
```

---

## Code Quality

### Naming
- [ ] Componentes: PascalCase
- [ ] Funções/variáveis: camelCase
- [ ] Constants: UPPER_SNAKE_CASE
- [ ] Types/Interfaces: PascalCase
- [ ] Nomes devem ser descritivos

```typescript
// ✅ Bom
const user: User = fetchUserById('123');
const isLoading = true;

// ❌ Evite
const u = fetchUserById('123');
const l = true;
```

### Comments
- [ ] JSDoc para funções públicas
- [ ] TODO/FIXME para work in progress
- [ ] Explique o "por quê", não o "o quê"

```typescript
/**
 * Valida email usando regex RFC 5322
 * @param email - Email a validar
 * @returns true se email é válido
 * @throws {InvalidEmailError} Se formato for inválido
 */
export function validateEmail(email: string): boolean {
  // ...
}
```

### Linting
- [ ] Rode lint antes de commit
- [ ] Configure pre-commit hooks
- [ ] Zero warnings em produção

---

## Security

### Input Validation
- [ ] Sempre valide input do usuário
- [ ] Use type guards
- [ ] Sanitize dados antes de exibir

```typescript
// ❌ Evite
<div>{userInput}</div>

// ✅ Use
<div>{escapeHtml(userInput)}</div>

// ✅ React escapa por padrão com string
<div>{userProvidedString}</div>
```

### Environment Variables
- [ ] Use `.env.local` para secrets
- [ ] Prefix públicas com `VITE_` ou `REACT_APP_`
- [ ] Tipifique env vars

```typescript
interface Env {
  VITE_API_URL: string;
  VITE_APP_VERSION: string;
}

const env: Env = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
};
```

---

## Documentation

### README
- [ ] Instruções de setup
- [ ] Exemplos de uso
- [ ] Arquitetura overview
- [ ] Contribuindo guidelines

### Componentes Públicos
- [ ] JSDoc comment
- [ ] Props documentation
- [ ] Usage examples
- [ ] Changelog

---

## Deploy Checklist

- [ ] `npm run type-check` ✅
- [ ] `npm run lint` ✅
- [ ] `npm test` ✅
- [ ] Build produção: `npm run build` ✅
- [ ] Verifica bundle size
- [ ] Testa em diferentes browsers
- [ ] Performance audit com Lighthouse
- [ ] Security audit com npm audit

---

## Mantendo o Código

### Regular Maintenance
- [ ] Atualize dependências mensalmente
- [ ] Revise code coverage
- [ ] Refatore código complexo
- [ ] Remove código morto
- [ ] Update TypeScript quando nova versão sai

### Debt Management
- [ ] Log de technical debt
- [ ] Priorize refatoração
- [ ] Teste antes de refatorar
- [ ] Documento mudanças

---

## Recursos Recomendados

- TypeScript Handbook: https://www.typescriptlang.org/docs
- React Docs: https://react.dev
- ESLint Rules: https://eslint.org/docs/latest/rules
- TypeScript ESLint: https://typescript-eslint.io

---

**Score Final:**
- Completado 80-100%: 🚀 Pronto para produção
- Completado 60-80%: ⚠️ Algumas melhorias necessárias
- Completado <60%: ❌ Refatore antes de deploy

---

**Ultima revisão:** Novembro 2025
