# React 19 & TypeScript 5.x - Guia de Referência 2025

Documentação completa com as últimas features e melhores práticas para React 19 e TypeScript 5.6+.

---

## Índice

1. [React 19 - Novas Features](#react-19-novas-features)
2. [React 19 - Novos Hooks](#react-19-novos-hooks)
3. [React 19.2 - Features Adicionais](#react-192-features-adicionais)
4. [TypeScript 5.x - Configuração](#typescript-5x-configuração)
5. [TypeScript - Padrões de Type Safety](#typescript-padrões-de-type-safety)
6. [Padrões de Componentes React + TypeScript](#padrões-de-componentes-react--typescript)
7. [Props Typing - Melhores Práticas](#props-typing-melhores-práticas)

---

## React 19 - Novas Features

### 1. Actions - Async Transitions

**O que é:** Functions que usam async transitions para gerenciar estado de requisições automaticamente.

```typescript
// Antes (sem Actions)
function UpdateName() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    setIsPending(true);
    const error = await updateName(name);
    setIsPending(false);
    if (error) {
      setError(error);
      return;
    }
    redirect("/path");
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        Update
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}

// Depois (com Actions)
function UpdateName() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) {
        setError(error);
        return;
      }
      redirect("/path");
    });
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        Update
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

**Benefícios:**
- `isPending` gerenciado automaticamente
- Suporte para optimistic updates
- Error handling integrado
- Forms resetam automaticamente

---

## React 19 - Novos Hooks

### 1. useActionState (anteriormente useFormState)

**Propósito:** Simplificar o manejo de ações form, retornando estado anterior, função wrapper e pending state.

```typescript
// Básico
const [error, submitAction, isPending] = useActionState(
  async (previousState, formData) => {
    const error = await updateName(formData.get("name"));
    if (error) {
      return error;
    }
    redirect("/path");
    return null;
  },
  null
);

// Com formulário
function ChangeName({ name, setName }: { name: string; setName: (s: string) => void }) {
  const [error, submitAction, isPending] = useActionState(
    async (previousState: string | null, formData: FormData) => {
      const newName = formData.get("name") as string;
      const error = await updateName(newName);
      if (error) {
        return error;
      }
      setName(newName);
      return null;
    },
    null
  );

  return (
    <form action={submitAction}>
      <input type="text" name="name" defaultValue={name} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

**Tipo TypeScript:**
```typescript
type UseActionState = <T, S>(
  action: (prevState: S, formData: FormData) => Promise<S> | S,
  initialState: S
) => [state: S, submitAction: (formData: FormData) => void, isPending: boolean];
```

---

### 2. useOptimistic

**Propósito:** Mostrar atualizações otimistas enquanto requisição está em progresso.

```typescript
function Todo({ todo }: { todo: Todo }) {
  const [optimisticTodo, updateOptimisticTodo] = useOptimistic<Todo, string>(
    todo,
    (state, updatedTitle) => ({
      ...state,
      title: updatedTitle,
    })
  );

  const handleUpdate = async (formData: FormData) => {
    const newTitle = formData.get("title") as string;
    updateOptimisticTodo(newTitle);

    const result = await updateTodo(todo.id, newTitle);
    if (!result.success) {
      // Volta ao estado anterior automaticamente
      return;
    }
  };

  return (
    <form action={handleUpdate}>
      <input
        type="text"
        name="title"
        defaultValue={optimisticTodo.title}
        disabled={optimisticTodo.title !== todo.title}
      />
      <button type="submit">Update</button>
    </form>
  );
}
```

**Padrão avançado com lista:**
```typescript
function TodoList({ todos }: { todos: Todo[] }) {
  const [visibleTodos, addOptimisticTodo] = useOptimistic<Todo[], Todo>(
    todos,
    (state, newTodo) => [...state, newTodo]
  );

  const handleAddTodo = async (formData: FormData) => {
    const title = formData.get("title") as string;
    const optimisticTodo: Todo = {
      id: Math.random(),
      title,
      completed: false,
    };

    addOptimisticTodo(optimisticTodo);

    const result = await createTodo(title);
    if (!result.success) {
      // Volta ao estado anterior
      return;
    }
  };

  return (
    <>
      <form action={handleAddTodo}>
        <input type="text" name="title" placeholder="Nova tarefa" />
        <button type="submit">Adicionar</button>
      </form>
      <ul>
        {visibleTodos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  );
}
```

---

### 3. useFormStatus

**Propósito:** Acessar status do formulário parent (deve estar dentro de um form).

```typescript
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Enviando..." : "Enviar"}
    </button>
  );
}

function ContactForm() {
  return (
    <form action={sendEmail}>
      <input type="email" name="email" placeholder="seu@email.com" />
      <textarea name="message" placeholder="Mensagem" />
      <SubmitButton />
    </form>
  );
}
```

**Importante:** `useFormStatus` **NÃO pode ser usado no mesmo componente do form**. Deve ser em um filho.

---

### 4. use() - Ler Resources em Render

**Propósito:** Ler promises e context condicionalmente no render.

```typescript
// Com Promises
import { use } from "react";

function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  // Suspende até a promise resolver
  const comments = use(commentsPromise);

  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>{comment.text}</li>
      ))}
    </ul>
  );
}

function Page({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  return (
    <Suspense fallback={<div>Carregando comentários...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}

// Com Context (pode ser condicional)
import { createContext, use } from "react";

const ThemeContext = createContext<Theme | null>(null);

function Heading({ children }: { children: React.ReactNode }) {
  if (!children) return null;

  // Isso não funcionaria com useContext depois de um return
  const theme = use(ThemeContext);

  return <h1 style={{ color: theme?.color }}>
    {children}
  </h1>;
}
```

---

## React 19.2 - Features Adicionais

### 1. Activity Component

**Propósito:** Quebrar a app em "activities" que podem ser controladas e priorizadas.

```typescript
function App() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div>
      {/* Activity mantém estado de componentes não visíveis */}
      <Activity mode={isVisible ? "visible" : "hidden"}>
        <HiddenPage />
      </Activity>

      {isVisible && (
        <div>
          <VisiblePage />
        </div>
      )}
    </div>
  );
}

// Benefícios:
// - Pre-renderiza partes ocultas em background
// - Mantém estado de inputs quando navegando
// - Melhora performance de navegações
// - Defers updates de componentes hidden
```

---

### 2. useEffectEvent

**Propósito:** Separar "eventos" de Effects, evitando re-execuções desnecessárias.

```typescript
// Problema: tema muda → reconnect desnecessário
function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on("connected", () => {
      showNotification("Connected!", theme);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, theme]); // theme causa reconexão!
}

// Solução: useEffectEvent
function ChatRoom({ roomId, theme }: { roomId: string; theme: string }) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected!", theme);
  });

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on("connected", () => onConnected());
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // ✅ Sem theme aqui!
}
```

---

### 3. Performance Tracks (Chrome DevTools)

React 19.2 adiciona tracks customizadas ao Chrome DevTools:

```typescript
// Usar Scheduler track para ver:
// - Diferentes prioridades de trabalho
// - Quando renders acontecem
// - Quando React aguarda paint

// Components track mostra:
// - Árvore de componentes sendo renderizados
// - Mount/Unmount de efeitos
// - Bloqueios de rendering
```

---

### 4. cacheSignal (React Server Components)

```typescript
import { cache, cacheSignal } from "react";

const dedupedFetch = cache(fetch);

async function Component() {
  // Permite saber quando cache lifetime termina
  await dedupedFetch(url, { signal: cacheSignal() });

  // Útil para cleanup quando:
  // - Render completou com sucesso
  // - Render foi abortado
  // - Render falhou
}
```

---

### 5. Partial Pre-rendering (SSR)

```typescript
// Pre-renderizar parte da app e resumir depois
const { prelude, postponed } = await prerender(<App />, {
  signal: controller.signal,
});

// Salvar estado para depois
await savePostponedState(postponed);

// Enviar shell para cliente/CDN
// ... depois

// Resumir para SSR stream
const postponed = await getPostponedState(request);
const resumeStream = await resume(<App />, postponed);

// Ou para SSG
const { prelude } = await resumeAndPrerender(<App />, postponedState);
```

---

## TypeScript 5.x - Configuração

### 1. tsconfig.json - Melhores Práticas 2025

```json
{
  "compilerOptions": {
    // Modo Strict (DEFAULT)
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

    // Modern Target
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],

    // Node.js Moderno
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    // JSX + React 19
    "jsx": "react-jsx",
    "jsxImportSource": "react",

    // Output
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",

    // Bundler Integration
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,

    // TS 5.6+ Features
    "rewriteRelativeImportExtensions": true,
    "verbatimModuleSyntax": true,

    // Experimental
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

### 2. ESLint + TypeScript 2025

```javascript
// eslint.config.js (Flat Config)
import js from '@eslint/js';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  ...ts.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      'react/react-in-jsx-scope': 'off', // React 19 não precisa
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/explicit-function-return-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },
];
```

---

## TypeScript - Padrões de Type Safety

### 1. Discriminated Unions (Tagged Unions)

```typescript
// ✅ Melhor prática: Use discriminated unions

type Success<T> = {
  status: "success";
  data: T;
};

type Error = {
  status: "error";
  message: string;
};

type Result<T> = Success<T> | Error;

// Type narrowing automático
function handleResult<T>(result: Result<T>) {
  if (result.status === "success") {
    // TypeScript sabe que é Success<T> aqui
    console.log(result.data);
  } else {
    // TypeScript sabe que é Error aqui
    console.log(result.message);
  }
}

// Caso mais complexo
type LoadingState = {
  kind: "loading";
};

type SuccessState = {
  kind: "success";
  data: string[];
};

type ErrorState = {
  kind: "error";
  error: Error;
};

type AsyncState = LoadingState | SuccessState | ErrorState;

function render(state: AsyncState) {
  switch (state.kind) {
    case "loading":
      return <Spinner />;
    case "success":
      return <List items={state.data} />;
    case "error":
      return <Error error={state.error} />;
  }
}
```

### 2. Type Guards Customizados

```typescript
// Type guard função
function isString(value: unknown): value is string {
  return typeof value === "string";
}

// Type guard com narrowing
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function handleError(error: unknown) {
  if (isError(error)) {
    console.log(error.message);
  }
}

// Tipo discriminado com type guard
function isSuccessResponse<T>(
  response: Result<T>
): response is Success<T> {
  return response.status === "success";
}

// Usando em array filter
const results: Result<number>[] = [
  { status: "success", data: 1 },
  { status: "error", message: "Falha" },
  { status: "success", data: 2 },
];

const successes = results.filter(isSuccessResponse);
// successes tem tipo Success<number>[]
```

### 3. Const Assertions

```typescript
// ✅ Const assertions evitam widening

// Sem const assertion
const colors = ["red", "green", "blue"]; // string[]

// Com const assertion
const colorsConst = ["red", "green", "blue"] as const; // readonly ["red", "green", "blue"]

type Color = typeof colorsConst[number]; // "red" | "green" | "blue"

// Com objects
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
} as const;

type Config = typeof config; // {
//   readonly apiUrl: "https://api.example.com";
//   readonly timeout: 5000;
// }

// Útil para valores que nunca mudam
const ROUTES = {
  home: "/",
  about: "/about",
  contact: "/contact",
} as const;

type Route = typeof ROUTES[keyof typeof ROUTES];
```

### 4. Record + Readonly

```typescript
// ✅ Padrão: Record + const assertions

// Mapear enums a strings
enum Status {
  Pending = "pending",
  Success = "success",
  Error = "error",
}

// Problema: type assertion vs Record
// Solução 1: satisfies operator
const statusMessages = {
  [Status.Pending]: "Aguardando...",
  [Status.Success]: "Sucesso!",
  [Status.Error]: "Erro!",
} satisfies Record<Status, string>;

// Solução 2: Readonly<Record>
const statusLabels: Readonly<Record<Status, string>> = {
  [Status.Pending]: "Aguardando...",
  [Status.Success]: "Sucesso!",
  [Status.Error]: "Erro!",
};

// Uso
function getStatusLabel(status: Status): string {
  return statusMessages[status];
}
```

### 5. Utility Types Avançados

```typescript
// ✅ Combine utility types para poder

// Partial + Pick = Atualizar alguns campos
type UpdateUserInput = Partial<Pick<User, 'name' | 'email'>>;

// Omit para excluir
type UserPreview = Omit<User, 'password' | 'securityToken'>;

// Record para mapas
type ResponseMap<T> = Record<keyof T, Promise<T[keyof T]>>;

// Readonly + Partial
type ReadonlyPartialUser = Readonly<Partial<User>>;

// Conditional types
type IsString<T> = T extends string ? true : false;
type A = IsString<"hello">; // true
type B = IsString<number>; // false

// Extract / Exclude
type StringOrNumber = string | number | boolean;
type OnlyStrings = Extract<StringOrNumber, string>; // string
type NoStrings = Exclude<StringOrNumber, string>; // number | boolean

// ReturnType e Parameters
function greet(name: string): string {
  return `Hello ${name}`;
}

type GreetReturn = ReturnType<typeof greet>; // string
type GreetParams = Parameters<typeof greet>; // [name: string]
```

---

## Padrões de Componentes React + TypeScript

### 1. Functional Component com Tipos Básicos

```typescript
// ✅ Padrão moderno (sem React.FC)
interface ButtonProps {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  children?: React.ReactNode;
}

export function Button({
  label,
  onClick,
  disabled = false,
  variant = "primary",
  children,
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children || label}
    </button>
  );
}

// React 19: Agora suporta ref como prop diretamente!
interface TextInputProps {
  placeholder: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function TextInput({ placeholder, ref }: TextInputProps) {
  return <input placeholder={placeholder} ref={ref} />;
}
```

### 2. Generic Components

```typescript
// ✅ Componente genérico com TypeScript

interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: T[keyof T]) => React.ReactNode;
  }>;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} onClick={() => onRowClick?.(row)}>
            {columns.map((col) => (
              <td key={String(col.key)}>
                {col.render ? col.render(row[col.key]) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Uso
interface User {
  id: number;
  name: string;
  email: string;
}

function UserTable({ users }: { users: User[] }) {
  return (
    <DataTable<User>
      data={users}
      columns={[
        { key: "id", label: "ID" },
        { key: "name", label: "Nome" },
        {
          key: "email",
          label: "Email",
          render: (email) => <a href={`mailto:${email}`}>{email}</a>,
        },
      ]}
    />
  );
}
```

### 3. Componente com forwardRef (React 19)

```typescript
// ✅ React 19: Não precisa forwardRef, ref é prop normal!

interface InputProps {
  placeholder: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({ placeholder, ref }: InputProps) {
  return <input placeholder={placeholder} ref={ref} />;
}

// Uso
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Input
      placeholder="Digite aqui"
      ref={inputRef}
    />
  );
}

// ❌ Padrão antigo (React < 19)
// import { forwardRef } from 'react';
// const Input = forwardRef<HTMLInputElement, InputProps>(
//   ({ placeholder }, ref) => (
//     <input placeholder={placeholder} ref={ref} />
//   )
// );
```

### 4. Componente com Children Tipados

```typescript
// ✅ Children com tipos específicos
interface CardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ title, children, footer }: CardProps) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

// ✅ Apenas um tipo específico de children
interface ListProps<T> {
  items: T[];
  children: (item: T) => React.ReactNode;
}

export function List<T extends { id: string | number }>({
  items,
  children,
}: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{children(item)}</li>
      ))}
    </ul>
  );
}

// Uso
function MyList() {
  const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];

  return (
    <List items={users}>
      {(user) => <span>{user.name}</span>}
    </List>
  );
}
```

### 5. Componente com Slots (Composition Pattern)

```typescript
// ✅ Padrão avançado: Slots para flexibilidade

interface LayoutProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  footer?: React.ReactNode;
}

export function Layout({ header, sidebar, main, footer }: LayoutProps) {
  return (
    <div className="layout">
      {header && <header className="layout-header">{header}</header>}
      <div className="layout-content">
        {sidebar && <aside className="layout-sidebar">{sidebar}</aside>}
        <main className="layout-main">{main}</main>
      </div>
      {footer && <footer className="layout-footer">{footer}</footer>}
    </div>
  );
}

// Uso
function App() {
  return (
    <Layout
      header={<Navigation />}
      sidebar={<Menu />}
      main={<PageContent />}
      footer={<Footer />}
    />
  );
}
```

---

## Props Typing - Melhores Práticas

### 1. Tipos Discriminados para Props

```typescript
// ✅ Use discriminated unions para props variáveis

// Button com múltiplos tipos
type ButtonPropsBase = {
  children: React.ReactNode;
  onClick: () => void;
};

type PrimaryButtonProps = ButtonPropsBase & {
  variant: "primary";
  color?: "blue" | "green";
};

type SecondaryButtonProps = ButtonPropsBase & {
  variant: "secondary";
  outline?: boolean;
};

type ButtonProps = PrimaryButtonProps | SecondaryButtonProps;

export function Button(props: ButtonProps) {
  if (props.variant === "primary") {
    // TypeScript sabe que tem 'color' aqui
    const color = props.color || "blue";
    return <button className={`btn-primary-${color}`}>{props.children}</button>;
  } else {
    // TypeScript sabe que tem 'outline' aqui
    return (
      <button className={`btn-secondary ${props.outline ? "outline" : ""}`}>
        {props.children}
      </button>
    );
  }
}
```

### 2. Props com Conditional Types

```typescript
// ✅ Tipos condicionais para props dependentes

type InputType = "text" | "checkbox" | "radio" | "select";

type BaseInputProps = {
  name: string;
  disabled?: boolean;
};

// Condicional: se for checkbox/radio, não tem value string
type InputProps<T extends InputType = "text"> = BaseInputProps & (
  T extends "text"
    ? { type: T; defaultValue?: string; placeholder?: string }
    : T extends "checkbox" | "radio"
      ? { type: T; checked?: boolean }
      : T extends "select"
        ? { type: T; options: Array<{ label: string; value: string }> }
        : never
);

export function Input<T extends InputType = "text">(props: InputProps<T>) {
  if (props.type === "text") {
    return (
      <input
        type="text"
        name={props.name}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
      />
    );
  }
  if (props.type === "checkbox") {
    return (
      <input
        type="checkbox"
        name={props.name}
        defaultChecked={props.checked}
      />
    );
  }
  if (props.type === "select") {
    return (
      <select name={props.name}>
        {props.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
  return null;
}
```

### 3. PropsWithChildren vs Children

```typescript
// ❌ Evite
type BadProps = {
  title: string;
  children: React.ReactNode;
};

// ✅ Use PropsWithChildren
import { PropsWithChildren } from "react";

type GoodProps = PropsWithChildren<{
  title: string;
}>;

export function Container({ title, children }: GoodProps) {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

// Ou simplesmente:
interface Props {
  title: string;
  children: React.ReactNode;
}
```

### 4. Optional Props com Valores Padrão

```typescript
// ✅ Padrão claro

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Opcionais com valores padrão
  pageSize?: number;
  maxButtons?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  maxButtons = 5,
  className,
}: PaginationProps) {
  // Use os valores padrão tranquilamente
  return (
    <nav className={className}>
      {/* ... */}
    </nav>
  );
}
```

### 5. Props com Event Handlers

```typescript
// ✅ Tipos corretos para event handlers

interface FormProps {
  // Callback handlers com tipos certos
  onSubmit: (data: FormData) => void | Promise<void>;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function Form({
  onSubmit,
  onChange,
  onBlur,
  onKeyDown,
}: FormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}

// Tipos customizados para handlers mais complexos
type AsyncEventHandler<T extends HTMLElement> = (
  event: React.SyntheticEvent<T>
) => Promise<void>;

interface AsyncButtonProps {
  onClick: AsyncEventHandler<HTMLButtonElement>;
}

export function AsyncButton({ onClick }: AsyncButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    try {
      await onClick(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? "Carregando..." : "Clique"}
    </button>
  );
}
```

---

## Dicas de Performance & Type Safety 2025

### 1. Use `satisfies` para Validação de Tipos

```typescript
// ✅ satisfies valida sem type widening

const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3,
} satisfies Record<string, string | number>;

// Agora config mantém tipos específicos:
// typeof config = {
//   apiUrl: string;
//   timeout: number;
//   retries: number;
// }
```

### 2. Padrão: Extract + Discriminate

```typescript
// ✅ Extrair tipos específicos de unions

type Message =
  | { type: "success"; message: string }
  | { type: "error"; error: Error }
  | { type: "loading" };

// Extrair apenas success
type SuccessMessage = Extract<Message, { type: "success" }>;

function showSuccess(msg: SuccessMessage) {
  console.log(msg.message);
}
```

### 3. Usar `infer` para Tipos Genéricos

```typescript
// ✅ infer para extrair tipos de estruturas

// Extrair tipo de Promise
type Awaited<T> = T extends Promise<infer U> ? U : T;

type A = Awaited<Promise<string>>; // string
type B = Awaited<number>; // number

// Extrair tipo de array
type ArrayElement<T> = T extends Array<infer E> ? E : T;

type Users = ArrayElement<User[]>; // User
```

---

## Checklist de Migração para React 19 + TypeScript 5.x

- [ ] Atualizar React para 19.x
- [ ] Atualizar TypeScript para 5.6+
- [ ] Remover todos `forwardRef` - usar `ref` como prop
- [ ] Remover `React.FC` - usar tipagem normal
- [ ] Migrar `useFormState` para `useActionState`
- [ ] Atualizar `tsconfig.json` com strict mode
- [ ] Instalar `eslint-plugin-react-hooks@latest`
- [ ] Substituir `renderToString` por `prerender` quando possível
- [ ] Implementar `useFormStatus` em forms
- [ ] Usar `useOptimistic` para atualizações otimistas
- [ ] Implementar `Activity` para navegações melhores
- [ ] Revisar e tipificar todos os componentes
- [ ] Usar discriminated unions em props complexas
- [ ] Configurar Context como provider diretamente
- [ ] Usar novo `useId` prefix `_r_`

---

## Referências Oficiais

- React 19 Docs: https://react.dev/blog/2024/12/05/react-19
- React 19.2 Blog: https://react.dev/blog/2025/10/01/react-19-2
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- React DevTools Performance: https://react.dev/reference/dev-tools/react-performance-tracks

---

**Última atualização:** Novembro 2025
**Versões:** React 19.2, TypeScript 5.7
