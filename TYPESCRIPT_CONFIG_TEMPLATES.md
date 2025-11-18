# TypeScript & React 19 - Templates de Configuração Prontos

Arquivos de configuração prontos para copiar e usar em seus projetos.

---

## 1. tsconfig.json Completo

```json
{
  "compilerOptions": {
    // Versão & Target
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "useDefineForClassFields": true,

    // Module System
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "declarationDir": "./dist",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    },

    // React & JSX
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "allowJs": true,
    "checkJs": false,

    // Type Checking - STRICT MODE
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "alwaysStrict": true,

    // Code Quality
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // Compatibility & Modern Features
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "rewriteRelativeImportExtensions": true,

    // Source Maps
    "sourceMap": true,
    "inlineSourceMap": false,

    // Experimental
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src", "src/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "coverage",
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/*.spec.tsx",
    "**/*.test.tsx"
  ],
  "ts-node": {
    "compilerOptions": {
      "module": "CommonJS"
    }
  }
}
```

---

## 2. ESLint Config (Flat Config - v9+)

```javascript
// eslint.config.js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  {
    ignores: [
      'dist',
      'build',
      'node_modules',
      '*.min.js',
      'coverage',
    ],
  },

  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript strict rules
  ...ts.configs.strict,
  ...ts.configs.stylistic,

  // React + React Hooks
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React 19 - não precisa importar React
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks: 'useEffectEvent',
        },
      ],

      // React Refresh (Vite)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript
      '@typescript-eslint/explicit-function-return-types': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // Best practices
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'no-debugger': 'warn',
    },
  },

  // Test files
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.tsx', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
```

---

## 3. prettier.config.js

```javascript
// prettier.config.js
export default {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  bracketSpacing: true,
  bracketSameLine: false,
  jsxSingleQuote: false,
  jsxBracketSameLine: false,
};
```

---

## 4. package.json Scripts

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css,md}\"",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^6.0.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "prettier": "^3.0.0",
    "typescript": "^5.7.0",
    "typescript-eslint": "^7.0.0",
    "vite": "^6.0.0"
  }
}
```

---

## 5. Vite Config com React 19

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // React 19 - remove JSX transform automático se necessário
      jsxImportSource: 'react',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'ES2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.tsx?$/,
  },
});
```

---

## 6. React TypeScript Base Types

```typescript
// src/types/index.ts
import type { ReactNode, ReactElement } from 'react';

// ============ React Component Types ============

export type RenderFunction<T = void> = () => ReactNode;
export type PropsWithChildren<P = {}> = P & { children: ReactNode };
export type ComponentProps<P = {}> = PropsWithChildren<P> | P;

// ============ Utility Types ============

/** Torna todas as propriedades opcionais recursivamente */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/** Torna todas as propriedades obrigatórias recursivamente */
export type DeepRequired<T> = T extends object
  ? {
      [P in keyof T]-?: DeepRequired<T[P]>;
    }
  : T;

/** Torna todas as propriedades readonly recursivamente */
export type DeepReadonly<T> = T extends object
  ? {
      readonly [P in keyof T]: DeepReadonly<T[P]>;
    }
  : T;

// ============ API Response Types ============

export type Success<T> = {
  status: 'success';
  data: T;
};

export type ApiError = {
  status: 'error';
  message: string;
  code?: string;
};

export type ApiResponse<T> = Success<T> | ApiError;

// Type guard
export function isSuccess<T>(response: ApiResponse<T>): response is Success<T> {
  return response.status === 'success';
}

// ============ Async State Types ============

export type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

// ============ Form Types ============

export type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isDirty: boolean;
  isSubmitting: boolean;
};

// ============ Event Handler Types ============

export type EventHandler<T extends HTMLElement> = (
  event: React.SyntheticEvent<T>
) => void;

export type AsyncEventHandler<T extends HTMLElement> = (
  event: React.SyntheticEvent<T>
) => Promise<void>;

export type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
```

---

## 7. Hooks TypeScript Base

```typescript
// src/hooks/useAsync.ts
import { useCallback, useEffect, useState } from 'react';
import type { AsyncState, ApiResponse } from '@types/index';

export function useAsync<T, E = Error>(
  asyncFunction: () => Promise<T>,
  immediate = true
): AsyncState<T, E> & {
  execute: () => Promise<void>;
} {
  const [state, setState] = useState<AsyncState<T, E>>({ status: 'idle' });

  const execute = useCallback(async () => {
    setState({ status: 'pending' });
    try {
      const response = await asyncFunction();
      setState({ status: 'success', data: response });
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? (error as E) : (error as E),
      });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}

// src/hooks/useLocalStorage.ts
import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error('Error setting localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// src/hooks/usePrevious.ts
import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// src/hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 8. Component Base Template

```typescript
// src/components/Example.tsx
import { type ReactNode } from 'react';
import styles from './Example.module.css';

interface ExampleProps {
  title: string;
  children?: ReactNode;
  className?: string;
  onAction?: (value: string) => void | Promise<void>;
}

/**
 * Componente de exemplo com tipagem completa
 *
 * @example
 * ```tsx
 * <Example
 *   title="Meu Título"
 *   onAction={(value) => console.log(value)}
 * >
 *   Conteúdo
 * </Example>
 * ```
 */
export function Example({
  title,
  children,
  className,
  onAction,
}: ExampleProps) {
  const handleClick = async () => {
    if (onAction) {
      try {
        await onAction('clicked');
      } catch (error) {
        console.error('Erro em onAction:', error);
      }
    }
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <h1>{title}</h1>
      {children && <div className={styles.content}>{children}</div>}
      <button onClick={handleClick} type="button">
        Clique-me
      </button>
    </div>
  );
}
```

---

## 9. Custom Hook com TypeScript

```typescript
// src/hooks/useForm.ts
import { useState, useCallback, type FormEvent, type ChangeEvent } from 'react';

type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => FormErrors<T>;
}

interface UseFormReturn<T> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  reset: () => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldTouched = useCallback(
    <K extends keyof T>(field: K, isTouched: boolean) => {
      setTouched((prev) => ({ ...prev, [field]: isTouched }));
    },
    []
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
      setFieldValue(name as keyof T, fieldValue as any);
      setFieldTouched(name as keyof T, true);
    },
    [setFieldValue, setFieldTouched]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (validate) {
        const newErrors = validate(values);
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Erro no submit:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setFieldValue,
    setFieldTouched,
    handleChange,
    handleSubmit,
    reset,
  };
}

// Uso:
function MyForm() {
  const form = useForm({
    initialValues: { name: '', email: '' },
    validate: (values) => {
      const errors: FormErrors<typeof values> = {};
      if (!values.name) errors.name = 'Nome é obrigatório';
      if (!values.email) errors.email = 'Email é obrigatório';
      return errors;
    },
    onSubmit: async (values) => {
      console.log('Submitindo:', values);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        type="text"
        name="name"
        value={form.values.name}
        onChange={form.handleChange}
        onBlur={() => form.setFieldTouched('name', true)}
      />
      {form.touched.name && form.errors.name && <span>{form.errors.name}</span>}

      <button type="submit" disabled={form.isSubmitting}>
        Enviar
      </button>
    </form>
  );
}
```

---

## 10. Context com TypeScript

```typescript
// src/context/ThemeContext.tsx
import { createContext, useState, ReactNode, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}
```

---

**Todos esses templates estão prontos para usar em 2025!**

Copie e adapte para seus projetos. 🚀
