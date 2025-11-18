# React 19 + TypeScript 5.7 - Guia Rápido 2025

Referência rápida com snippets mais usados. Bookmark this!

---

## Índice Rápido

1. [TypeScript Essencial](#typescript-essencial)
2. [React 19 - Novos Hooks](#react-19-novos-hooks)
3. [Padrões TypeScript](#padrões-typescript)
4. [Componentes Comuns](#componentes-comuns)
5. [Form Handling](#form-handling)
6. [API Calls](#api-calls)

---

## TypeScript Essencial

### Type vs Interface
```typescript
// Type: mais flexível
type User = { id: string; name: string };

// Interface: para objetos
interface User { id: string; name: string }

// Extends
interface Admin extends User { role: 'admin' }
```

### Union Types e Type Guards
```typescript
type Status = 'success' | 'error' | 'loading';

// Narrowing
function handleStatus(status: Status) {
  if (status === 'success') { /* ... */ }
}
```

### Generics Simples
```typescript
// Função genérica
function wrap<T>(value: T): T[] { return [value]; }

// Tipo genérico
type Response<T> = { data: T; error: null };
```

### Discriminated Union (⭐ Mais importante)
```typescript
type Result<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

// Type guard automático
if (result.status === 'success') {
  console.log(result.data); // ✅ Sabe que é T aqui
}
```

---

## React 19 - Novos Hooks

### useActionState (para Forms)
```typescript
const [error, submitAction, isPending] = useActionState(
  async (previousState, formData) => {
    const result = await submitForm(formData);
    return result.error ? result.error : null;
  },
  null
);

return (
  <form action={submitAction}>
    <input name="email" />
    <button type="submit" disabled={isPending}>
      Enviar
    </button>
  </form>
);
```

### useOptimistic (Updates Otimistas)
```typescript
const [optimisticTodos, updateOptimistic] = useOptimistic(
  todos,
  (state, newTodo: Todo) => [...state, newTodo]
);

const handleAdd = async (title: string) => {
  updateOptimistic({ id: '1', title, done: false });
  await addTodo(title);
};
```

### useFormStatus (Status do Form)
```typescript
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>
    {pending ? 'Enviando...' : 'Enviar'}
  </button>;
}

// Deve estar DENTRO do <form>
```

### use() (Promises no Render)
```typescript
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise); // Suspende até resolver
  return <ul>{comments.map(...)}</ul>;
}

<Suspense fallback={<Spinner />}>
  <Comments commentsPromise={fetchComments()} />
</Suspense>
```

---

## Padrões TypeScript

### Const Assertion (Imutabilidade)
```typescript
// Sem const
const colors = ['red', 'blue']; // string[]

// Com const
const colors = ['red', 'blue'] as const; // readonly ['red', 'blue']
const ROUTES = { home: '/', about: '/about' } as const;
```

### Record Type
```typescript
// Map de strings
const statusLabels: Record<Status, string> = {
  pending: 'Aguardando...',
  success: 'Sucesso!',
  error: 'Erro!',
};

// Acesso tipado
const label = statusLabels['success']; // ✅ Type-safe
```

### Utility Types
```typescript
// Partial - torna tudo opcional
type PartialUser = Partial<User>;

// Pick - seleciona campos
type UserPreview = Pick<User, 'id' | 'name'>;

// Omit - exclui campos
type UserPublic = Omit<User, 'password'>;

// Readonly
type ReadonlyUser = Readonly<User>;

// Record
type Config = Record<'dev' | 'prod', string>;
```

### Type Guards
```typescript
// Tipo de guarda customizado
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

if (isUser(data)) {
  console.log(data.name); // ✅ Type-safe
}
```

---

## Componentes Comuns

### Componente Funcional Básico
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### Componente Genérico
```typescript
interface ListProps<T extends { id: string }> {
  items: T[];
  render: (item: T) => React.ReactNode;
}

export function List<T extends { id: string }>({ items, render }: ListProps<T>) {
  return <ul>{items.map(item => <li key={item.id}>{render(item)}</li>)}</ul>;
}

// Uso
<List<User> items={users} render={user => user.name} />
```

### Componente com Ref (React 19)
```typescript
interface InputProps {
  placeholder: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ placeholder, ref }: InputProps) {
  return <input placeholder={placeholder} ref={ref} />;
}

// Uso
const inputRef = useRef<HTMLInputElement>(null);
<Input ref={inputRef} placeholder="Digite" />
```

### Componente com Children
```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

---

## Form Handling

### Simples com useActionState
```typescript
export async function loginAction(
  previousState: string | null,
  formData: FormData
) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = await authenticateUser(email, password);
  return result.success ? null : result.error;
}

function LoginForm() {
  const [error, submitAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={submitAction}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### Com Otimismo
```typescript
function TodoForm({ todos }) {
  const [optimisticTodos, addTodo] = useOptimistic(todos, (state, newTodo) => [
    ...state,
    newTodo,
  ]);

  const handleSubmit = async (formData: FormData) => {
    const title = formData.get('title') as string;
    const newTodo = { id: Date.now().toString(), title, done: false };

    addTodo(newTodo);
    await createTodo(newTodo);
  };

  return (
    <form action={handleSubmit}>
      <input name="title" />
      <button type="submit">Adicionar</button>
    </form>
  );
}
```

### useForm Hook Simples
```typescript
function useForm<T>(initialValues: T, onSubmit: (values: T) => void) {
  const [values, setValues] = useState(initialValues);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return { values, handleChange, handleSubmit };
}

// Uso
const form = useForm({ email: '', password: '' }, (values) => {
  console.log('Submitting:', values);
});

return (
  <form onSubmit={form.handleSubmit}>
    <input name="email" value={form.values.email} onChange={form.handleChange} />
    <button type="submit">Enviar</button>
  </form>
);
```

---

## API Calls

### Simples com useAsync
```typescript
function useAsync<T>(asyncFn: () => Promise<T>) {
  const [state, setState] = useState<{
    loading: boolean;
    data?: T;
    error?: Error;
  }>({ loading: true });

  useEffect(() => {
    asyncFn()
      .then(data => setState({ loading: false, data }))
      .catch(error => setState({ loading: false, error }));
  }, []);

  return state;
}

// Uso
function UserProfile({ userId }: { userId: string }) {
  const { loading, data, error } = useAsync(() => fetchUser(userId));

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  return <div>{data?.name}</div>;
}
```

### Typed Fetch
```typescript
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Uso
const user = await fetchJson<User>('/api/user/1');
```

### Com Error Handling
```typescript
type Result<T> = { success: true; data: T } | { success: false; error: string };

async function safeFetch<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(url);
    if (!response.ok) return { success: false, error: `HTTP ${response.status}` };
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Uso
const result = await safeFetch<User>('/api/user/1');
if (result.success) {
  console.log(result.data.name);
}
```

---

## Context Simples

```typescript
// Criar context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext value={{ user, setUser }}>
      {children}
    </AuthContext>
  );
}

// Hook customizado
function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve estar dentro de AuthProvider');
  return context;
}

// Uso
function Profile() {
  const { user } = useAuth();
  return <div>Bem-vindo, {user?.name}</div>;
}
```

---

## Debugging & Tips

### Verificar tipos em tempo de compilação
```typescript
// Isso causa erro se tipo estiver errado
const _check: User = someUnknownValue; // ❌ Erro de tipo
```

### Melhor autocompletar
```typescript
// ✅ Desestruture com tipos
const { name, email }: User = user;

// ❌ Evite this
const name = user.name;
```

### Debugging de tipos
```typescript
// Ver o tipo de uma variável
type Check = typeof someVariable;

// Hover sobre qualquer coisa no editor para ver o tipo!
```

---

## Comandos Úteis

```bash
# Verificar tipos sem compilar
tsc --noEmit

# Watch mode
tsc --watch

# Strict mode
tsc --strict --noEmit

# ESLint
npm run lint
npm run lint:fix

# Format com Prettier
npm run format
```

---

## Checklist de Setup Novo

- [ ] `npm install react@19 react-dom@19`
- [ ] `npm install -D typescript@5.7 @types/react @types/react-dom`
- [ ] Copiar `tsconfig.json` do TYPESCRIPT_CONFIG_TEMPLATES.md
- [ ] Copiar `eslint.config.js`
- [ ] Criar pasta `src/types/index.ts` com types base
- [ ] Criar pasta `src/hooks/` para custom hooks
- [ ] Primeiro componente com tipos completos
- [ ] Testar `npm run type-check`
- [ ] Testar `npm run lint`

---

## Erros Comuns & Soluções

### "Cannot find module"
```
Solução: Verificar paths em tsconfig.json
```

### "Type is not assignable"
```
Solução: Use discriminated unions ou type guards
```

### "Property does not exist"
```
Solução: Adicione a propriedade ao tipo ou use Optional Chaining (?.)
```

### "React não está no escopo"
```
// React 19 não precisa! Remova:
// import React from 'react';
```

### "Cannot use X in Client Component"
```
Solução: Adicione 'use client' no topo do arquivo
// ou mova para Server Component
```

---

## Recursos Rápidos

- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org/docs/
- TypeScript Playground: https://www.typescriptlang.org/play

---

**Ultima atualização:** Novembro 2025
**React:** 19.2
**TypeScript:** 5.7
