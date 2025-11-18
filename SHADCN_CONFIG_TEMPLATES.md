# shadcn/ui - Arquivos de Configuração

Arquivos de configuração prontos para copiar e usar em seu projeto.

---

## 1. components.json

Este arquivo configura a localização dos componentes shadcn/ui.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate"
  },
  "aliases": {
    "@/*": "./src/*",
    "@/components": "./src/components",
    "@/ui": "./src/components/ui",
    "@/lib": "./src/lib",
    "@/hooks": "./src/hooks"
  }
}
```

---

## 2. tailwind.config.ts

Configuração completa do Tailwind CSS v4 com shadcn/ui.

```typescript
import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

---

## 3. globals.css

Estilos globais e variáveis CSS do tema.

```css
@import "tailwindcss";

@theme {
  --color-primary: rgb(var(--primary) / <alpha-value>);
  --color-secondary: rgb(var(--secondary) / <alpha-value>);
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.6%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.6%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --ring: 0 0% 3.6%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.6%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.6%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.6%;
    --popover-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 98%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 9.1% 97.3%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }

  /* Remover espaço padrão dos buttons em Tailwind v4 */
  button {
    @apply cursor-pointer;
  }
}

/* Estilos customizados */
@layer components {
  .container-custom {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  .section-padding {
    @apply py-12 sm:py-16 lg:py-20;
  }
}
```

---

## 4. lib/utils.ts

Utilitários e funções helper.

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes Tailwind com segurança
 * Evita conflitos entre classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata data para o padrão brasileiro
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Formata moeda brasileira
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

/**
 * Cria delay assíncrono
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Verifica se está no cliente
 */
export function isClient(): boolean {
  return typeof window !== "undefined"
}

/**
 * Obtém tema atual
 */
export function getTheme(): "light" | "dark" {
  if (!isClient()) return "light"
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

/**
 * Muda o tema
 */
export function toggleTheme(): void {
  if (!isClient()) return
  document.documentElement.classList.toggle("dark")
  localStorage.setItem(
    "theme",
    getTheme()
  )
}
```

---

## 5. lib/schemas.ts

Schemas Zod reutilizáveis para validação.

```typescript
import { z } from "zod"

/**
 * Schema para email
 */
export const emailSchema = z.string().email("Email inválido")

/**
 * Schema para senha
 */
export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .regex(/[A-Z]/, "Deve conter uma letra maiúscula")
  .regex(/[0-9]/, "Deve conter um número")
  .regex(/[!@#$%^&*]/, "Deve conter um caractere especial")

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
})

export type LoginSchema = z.infer<typeof loginSchema>

/**
 * Schema para cadastro
 */
export const signUpSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não correspondem",
    path: ["confirmPassword"],
  })

export type SignUpSchema = z.infer<typeof signUpSchema>

/**
 * Schema para perfil de usuário
 */
export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: emailSchema,
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type UserProfile = z.infer<typeof userProfileSchema>

/**
 * Schema para criar/editar produto
 */
export const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.number().positive("Preço deve ser maior que zero"),
  image: z.string().url("URL de imagem inválida"),
  category: z.string().min(1, "Categoria é obrigatória"),
  stock: z.number().int().nonnegative("Estoque não pode ser negativo"),
})

export type Product = z.infer<typeof productSchema>

/**
 * Schema para filtros de busca
 */
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  sort: z.enum(["newest", "oldest", "price-asc", "price-desc"]).optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
})

export type SearchFilters = z.infer<typeof searchFiltersSchema>
```

---

## 6. hooks/useLocalStorage.ts

Hook customizado para localStorage.

```typescript
import { useState, useEffect } from "react"

/**
 * Hook para usar localStorage de forma segura
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Ler do localStorage quando montar
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    }
    setIsLoaded(true)
  }, [key])

  // Salvar em localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, isLoaded] as const
}
```

---

## 7. app/layout.tsx

Layout root com providers e configuração de temas.

```typescript
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Meu App",
  description: "Descrição do app",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

---

## 8. components/providers.tsx

Providers globais (Toaster, Themes, etc).

```typescript
"use client"

import { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster
        position="top-right"
        richColors
        expand={true}
        theme="light"
        closeButton
        duration={4000}
      />
    </ThemeProvider>
  )
}
```

---

## 9. hooks/useTheme.ts

Hook customizado para gerenciar tema.

```typescript
"use client"

import { useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("theme") as Theme
    if (stored) {
      setTheme(stored)
    }
  }, [])

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)

    const html = document.documentElement

    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      html.classList.toggle("dark", isDark)
    } else {
      html.classList.toggle("dark", newTheme === "dark")
    }
  }

  return {
    theme,
    setTheme: updateTheme,
    mounted,
  }
}
```

---

## 10. tsconfig.json

Configuração TypeScript.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components": ["./src/components"],
      "@/ui": ["./src/components/ui"],
      "@/lib": ["./src/lib"],
      "@/hooks": ["./src/hooks"],
      "@/types": ["./src/types"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 11. .env.local

Variáveis de ambiente.

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Autenticação
NEXT_PUBLIC_AUTH_URL=http://localhost:3000/api/auth

# Base de dados
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# APIs externas
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Analytics (opcional)
NEXT_PUBLIC_ANALYTICS_ID=

# Outras variáveis
NODE_ENV=development
```

---

## 12. .gitignore

Arquivo de exclusão Git.

```
# Dependências
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Produção
.next/
out/
dist/
build/

# Misc
.DS_Store
*.pem
.env
.env.local
.env.*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# OS
Thumbs.db
```

---

## 13. package.json (scripts essenciais)

```json
{
  "name": "meu-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^15.0.0",
    "tailwindcss": "^4.0.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-popover": "^1.0.0",
    "@radix-ui/react-slot": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.0",
    "lucide-react": "^0.294.0",
    "sonner": "^1.2.0",
    "@tanstack/react-table": "^8.10.0",
    "next-themes": "^0.2.1"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.10.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

---

**Pronto!** Copie e adapte esses arquivos conforme necessário para seu projeto.
