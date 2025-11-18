# React 19 & TypeScript - Padrões Avançados 2025

Padrões profissionais, compostos e patterns de type safety para desenvolvimento moderno.

---

## 1. Form Actions com Type Safety

### Padrão 1: Typed Form Action

```typescript
// src/actions/formActions.ts
'use server';

import type { ApiResponse } from '@types/index';

export interface CreateUserInput {
  name: string;
  email: string;
  age: number;
}

export interface User extends CreateUserInput {
  id: string;
  createdAt: Date;
}

export async function createUserAction(
  _previousState: ApiResponse<User> | null,
  formData: FormData
): Promise<ApiResponse<User>> {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const age = parseInt(formData.get('age') as string);

    // Validação
    if (!name || !email || !age) {
      return {
        status: 'error',
        message: 'Todos os campos são obrigatórios',
      };
    }

    // Simular criação no banco
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      age,
      createdAt: new Date(),
    };

    return {
      status: 'success',
      data: newUser,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// src/components/CreateUserForm.tsx
'use client';

import { useActionState } from 'react';
import { createUserAction, type User } from '@actions/formActions';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Criando...' : 'Criar Usuário'}
    </button>
  );
}

export function CreateUserForm() {
  const [result, formAction, isPending] = useActionState(
    createUserAction,
    null
  );

  return (
    <form action={formAction}>
      <input
        type="text"
        name="name"
        placeholder="Nome"
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
      />
      <input
        type="number"
        name="age"
        placeholder="Idade"
        required
      />

      <SubmitButton />

      {result?.status === 'success' && (
        <div className="success">
          <p>Usuário criado: {result.data.name}</p>
        </div>
      )}

      {result?.status === 'error' && (
        <div className="error">
          <p>{result.message}</p>
        </div>
      )}
    </form>
  );
}
```

---

## 2. Composição com Discriminated Unions

### Padrão 2: Componentes Compostos

```typescript
// src/components/Card/Card.tsx
import type { ReactNode } from 'react';

// Componente principal
interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  return (
    <div className={`card ${className || ''}`}>
      {children}
    </div>
  );
}

// Subcomponentes com namespace
interface CardHeaderProps {
  title: string;
  subtitle?: string;
}

function CardHeader({ title, subtitle }: CardHeaderProps) {
  return (
    <div className="card-header">
      <h2>{title}</h2>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
}

function CardBody({ children }: CardBodyProps) {
  return <div className="card-body">{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
}

function CardFooter({ children, align = 'right' }: CardFooterProps) {
  return (
    <div className={`card-footer align-${align}`}>
      {children}
    </div>
  );
}

// Exportar como namespace
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card };

// Uso
export function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <Card.Header
        title={user.name}
        subtitle={user.email}
      />
      <Card.Body>
        <p>Idade: {user.age}</p>
      </Card.Body>
      <Card.Footer>
        <button>Editar</button>
      </Card.Footer>
    </Card>
  );
}
```

---

## 3. Polymorphic Components

### Padrão 3: Componentes Polimórficos

```typescript
// src/components/Button/Button.tsx
import type { ElementType, ComponentPropsWithoutRef } from 'react';

type PolymorphicRef<C extends ElementType> = ComponentPropsWithoutRef<C> & {
  as?: C;
};

interface ButtonOwnProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

type ButtonProps<C extends ElementType = 'button'> = PolymorphicRef<C> &
  ButtonOwnProps;

export const Button = <C extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  ...props
}: ButtonProps<C>) => {
  const Component = as || 'button';

  return (
    <Component
      className={`btn btn-${variant} btn-${size}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? '...' : children}
    </Component>
  );
};

// Uso flexível
<Button onClick={() => console.log('clicked')}>
  Clique-me
</Button>

<Button as="a" href="/about" variant="secondary">
  Sobre
</Button>

<Button as="div" role="button" tabIndex={0}>
  Div como botão
</Button>
```

---

## 4. Render Props com Type Safety

### Padrão 4: Render Props

```typescript
// src/components/AsyncBoundary.tsx
import type { ReactNode } from 'react';
import { Suspense, type PropsWithChildren } from 'react';

interface AsyncBoundaryProps<T> {
  promise: Promise<T>;
  children: (data: T) => ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => ReactNode;
}

export function AsyncBoundary<T>({
  promise,
  children,
  fallback = <div>Carregando...</div>,
  onError,
}: AsyncBoundaryProps<T>) {
  return (
    <Suspense fallback={fallback}>
      <AsyncContent promise={promise} children={children} onError={onError} />
    </Suspense>
  );
}

function AsyncContent<T>({
  promise,
  children,
  onError,
}: Omit<AsyncBoundaryProps<T>, 'fallback'>) {
  const data = use(promise).catch((error) => {
    if (onError) return onError(error);
    throw error;
  });

  return <>{children(data)}</>;
}

// Uso
function UserList() {
  const usersPromise = fetchUsers();

  return (
    <AsyncBoundary
      promise={usersPromise}
      fallback={<Spinner />}
      onError={(error) => <Error message={error.message} />}
    >
      {(users) => (
        <ul>
          {users.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </AsyncBoundary>
  );
}
```

---

## 5. HOC com TypeScript

### Padrão 5: Higher-Order Component

```typescript
// src/hoc/withAuth.tsx
import { ReactNode } from 'react';
import { useAuth } from '@hooks/useAuth';

interface WithAuthProps {
  children: ReactNode;
}

/**
 * HOC que protege componentes com autenticação
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthProtectedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Verificando autenticação...</div>;
    }

    if (!isAuthenticated) {
      return <div>Acesso negado. Faça login.</div>;
    }

    return <Component {...props} />;
  };
}

// Uso
interface DashboardProps {
  userId: string;
}

function Dashboard({ userId }: DashboardProps) {
  return <div>Dashboard do usuário: {userId}</div>;
}

export const ProtectedDashboard = withAuth(Dashboard);
```

---

## 6. Context + Reducer Pattern

### Padrão 6: State Management Tipado

```typescript
// src/context/TodoContext.tsx
'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
} from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

type TodoAction =
  | { type: 'ADD'; payload: { text: string } }
  | { type: 'TOGGLE'; payload: { id: string } }
  | { type: 'DELETE'; payload: { id: string } }
  | { type: 'CLEAR_COMPLETED' };

interface TodoContextType {
  todos: Todo[];
  dispatch: (action: TodoAction) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

function todoReducer(todos: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case 'ADD':
      return [
        ...todos,
        {
          id: crypto.randomUUID(),
          text: action.payload.text,
          completed: false,
        },
      ];

    case 'TOGGLE':
      return todos.map((todo) =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );

    case 'DELETE':
      return todos.filter((todo) => todo.id !== action.payload.id);

    case 'CLEAR_COMPLETED':
      return todos.filter((todo) => !todo.completed);

    default:
      return todos;
  }
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, dispatch] = useReducer(todoReducer, []);

  const addTodo = useCallback((text: string) => {
    dispatch({ type: 'ADD', payload: { text } });
  }, []);

  const toggleTodo = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE', payload: { id } });
  }, []);

  const deleteTodo = useCallback((id: string) => {
    dispatch({ type: 'DELETE', payload: { id } });
  }, []);

  const clearCompleted = useCallback(() => {
    dispatch({ type: 'CLEAR_COMPLETED' });
  }, []);

  return (
    <TodoContext
      value={{
        todos,
        dispatch,
        addTodo,
        toggleTodo,
        deleteTodo,
        clearCompleted,
      }}
    >
      {children}
    </TodoContext>
  );
}

export function useTodo(): TodoContextType {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo deve ser usado dentro de TodoProvider');
  }
  return context;
}
```

---

## 7. Custom Hooks Avançados

### Padrão 7: useOptimistic + Server Actions

```typescript
// src/hooks/useOptimisticTodo.ts
'use client';

import { useOptimistic, useState } from 'react';
import { updateTodoAction } from '@actions/todoActions';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export function useOptimisticTodo(initialTodos: Todo[]) {
  const [todos] = useState(initialTodos);

  const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
    todos,
    (state, newTodo: Todo) => {
      return state.map((todo) =>
        todo.id === newTodo.id ? newTodo : todo
      );
    }
  );

  const toggleTodo = async (todo: Todo) => {
    const updatedTodo = { ...todo, completed: !todo.completed };

    // Otimista
    updateOptimisticTodos(updatedTodo);

    // Realmente
    await updateTodoAction(updatedTodo);
  };

  return { optimisticTodos, toggleTodo };
}
```

---

## 8. Type-Safe API Calls

### Padrão 8: API Client Tipado

```typescript
// src/lib/api.ts
import type { ApiResponse } from '@types/index';

interface RequestConfig extends RequestInit {
  baseUrl?: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = process.env.REACT_APP_API_URL || '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        ...config,
      });

      if (!response.ok) {
        return {
          status: 'error',
          message: `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        status: 'success',
        data: data as T,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(
    endpoint: string,
    body: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Uso
const api = new ApiClient();

interface User {
  id: string;
  name: string;
}

async function fetchUser(id: string) {
  const response = await api.get<User>(`/users/${id}`);

  if (response.status === 'success') {
    console.log(response.data.name);
  } else {
    console.error(response.message);
  }
}
```

---

## 9. Compound Component Pattern

### Padrão 9: Componentes Compostos Avançados

```typescript
// src/components/Tabs/Tabs.tsx
import type { ReactNode, ReactElement } from 'react';
import { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultTab: string;
  children: ReactNode;
}

function Tabs({ defaultTab, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext>
  );
}

interface TabListProps {
  children: ReactNode;
}

function TabList({ children }: TabListProps) {
  return <div className="tab-list">{children}</div>;
}

interface TabProps {
  id: string;
  children: ReactNode;
}

function Tab({ id, children }: TabProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab deve estar dentro de Tabs');

  const isActive = context.activeTab === id;

  return (
    <button
      className={`tab ${isActive ? 'active' : ''}`}
      onClick={() => context.setActiveTab(id)}
      role="tab"
      aria-selected={isActive}
    >
      {children}
    </button>
  );
}

interface TabPanelsProps {
  children: ReactNode;
}

function TabPanels({ children }: TabPanelsProps) {
  return <div className="tab-panels">{children}</div>;
}

interface TabPanelProps {
  id: string;
  children: ReactNode;
}

function TabPanel({ id, children }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel deve estar dentro de Tabs');

  if (context.activeTab !== id) return null;

  return <div className="tab-panel">{children}</div>;
}

// Compound API
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;

export { Tabs };

// Uso
export function MyTabs() {
  return (
    <Tabs defaultTab="home">
      <Tabs.List>
        <Tabs.Tab id="home">Home</Tabs.Tab>
        <Tabs.Tab id="about">Sobre</Tabs.Tab>
        <Tabs.Tab id="contact">Contato</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panels>
        <Tabs.Panel id="home">Conteúdo Home</Tabs.Panel>
        <Tabs.Panel id="about">Conteúdo About</Tabs.Panel>
        <Tabs.Panel id="contact">Conteúdo Contact</Tabs.Panel>
      </Tabs.Panels>
    </Tabs>
  );
}
```

---

## 10. Error Boundaries

### Padrão 10: Tratamento de Erros

```typescript
// src/components/ErrorBoundary.tsx
'use client';

import { ReactNode, ReactElement, Component, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactElement {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error) ?? (
          <div className="error-boundary">
            <h2>Oops! Algo deu errado</h2>
            <p>{this.state.error.message}</p>
            <button onClick={() => this.setState({ hasError: false })}>
              Tentar novamente
            </button>
          </div>
        )
      );
    }

    return this.props.children as ReactElement;
  }
}

// Uso
<ErrorBoundary
  fallback={(error) => (
    <div>
      <p>Erro: {error.message}</p>
    </div>
  )}
>
  <SomeComponent />
</ErrorBoundary>
```

---

## 11. Lazy Loading + Suspense

### Padrão 11: Code Splitting

```typescript
// src/components/LazyComponent.tsx
'use client';

import { lazy, Suspense } from 'react';

// Lazy load componente pesado
const HeavyComponent = lazy(() =>
  import('./HeavyComponent').then(module => ({
    default: module.HeavyComponent,
  }))
);

export function LazyWrapper() {
  return (
    <Suspense fallback={<div>Carregando componente...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

## Checklist - Padrões para Usar em Produção

- [ ] Form Actions com type safety completo
- [ ] Discriminated unions para variantes de componentes
- [ ] Composição com subcomponentes (Card.Header, etc)
- [ ] Polymorphic components para reutilização máxima
- [ ] Context + Reducer para state management
- [ ] Custom hooks para lógica complexa
- [ ] API Client tipado
- [ ] Error Boundaries para capturar erros
- [ ] Suspense para loading states
- [ ] useOptimistic para UX otimista
- [ ] Server Components onde possível
- [ ] Type guards customizados

---

**Próxima vez que precisar implementar um padrão, volte neste guia!** 🚀
