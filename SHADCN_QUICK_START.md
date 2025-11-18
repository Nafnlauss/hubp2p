# shadcn/ui - Quick Start Guide

Guia rápido passo a passo para começar com shadcn/ui em Next.js 15.

---

## 1. SETUP INICIAL (5 MINUTOS)

### Passo 1: Criar Projeto Next.js 15

```bash
npx create-next-app@latest meu-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir

cd meu-app
```

Escolha as opções:
- TypeScript: Sim
- ESLint: Sim
- Tailwind CSS: Sim
- App Router: Sim

### Passo 2: Inicializar shadcn/ui

```bash
npx shadcn@latest init -d
```

Este comando:
- Cria `components.json`
- Configura `tsconfig.json`
- Cria `lib/utils.ts`
- Cria `components/ui/` pasta

### Passo 3: Instalar Dependências Extras (Opcional)

```bash
npm install react-hook-form zod @hookform/resolvers sonner
```

### Passo 4: Testar Instalação

```bash
npm run dev
```

Acesse `http://localhost:3000` - você deve ver a página inicial do Next.js.

---

## 2. ADICIONAR SEUS PRIMEIROS COMPONENTES (10 MINUTOS)

### Passo 1: Adicionar Button

```bash
npx shadcn@latest add button
```

### Passo 2: Atualizar app/page.tsx

```typescript
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Bem-vindo ao shadcn/ui!</h1>
        <Button>Clique aqui</Button>
      </div>
    </main>
  )
}
```

### Passo 3: Ver Resultado

Abra `http://localhost:3000` e veja o botão!

---

## 3. CRIAR SEU PRIMEIRO FORMULÁRIO (15 MINUTOS)

### Passo 1: Adicionar Componentes de Formulário

```bash
npx shadcn@latest add form input label
```

### Passo 2: Criar Schema

**Arquivo:** `lib/schemas.ts`

```typescript
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

export type LoginForm = z.infer<typeof loginSchema>
```

### Passo 3: Criar Componente de Formulário

**Arquivo:** `components/login-form.tsx`

```typescript
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { loginSchema, type LoginForm } from "@/lib/schemas"

export function LoginForm() {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(data: LoginForm) {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Sua senha" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Login</Button>
      </form>
    </Form>
  )
}
```

### Passo 4: Usar no App

**Arquivo:** `app/page.tsx`

```typescript
import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Fazer Login</h1>
        <LoginForm />
      </div>
    </main>
  )
}
```

---

## 4. CHECKLIST DE CONFIGURAÇÃO

Marque cada item conforme completar:

### Setup Inicial
- [ ] Criar projeto Next.js 15
- [ ] Instalar shadcn/ui (`npx shadcn@latest init -d`)
- [ ] Instalar dependências (`npm install`)
- [ ] Verificar se `npm run dev` funciona

### Componentes
- [ ] Adicionar Button (`npx shadcn@latest add button`)
- [ ] Adicionar Form (`npx shadcn@latest add form input label`)
- [ ] Adicionar Dialog (`npx shadcn@latest add dialog`)
- [ ] Testar cada componente

### Configuração
- [ ] Atualizar `components.json` se necessário
- [ ] Configurar `tailwind.config.ts`
- [ ] Atualizar `globals.css` com cores do tema
- [ ] Criar `lib/schemas.ts` com validações Zod

### Estrutura
- [ ] Criar `lib/utils.ts` com funções helpers
- [ ] Criar `components/providers.tsx` com Providers
- [ ] Organizar componentes em pastas

### Desenvolvimento
- [ ] Adicionar mais componentes conforme necessário
- [ ] Criar formulários com validação
- [ ] Implementar diálogos e modals
- [ ] Estilizar conforme design

---

## 5. COMANDOS MAIS USADOS

### Desenvolvimento

```bash
# Iniciar servidor dev
npm run dev

# Build para produção
npm run build

# Iniciar servidor produção
npm start

# Verificar tipos TypeScript
npx tsc --noEmit
```

### Componentes

```bash
# Adicionar um componente
npx shadcn@latest add button

# Adicionar vários
npx shadcn@latest add button form input dialog table

# Listar componentes disponíveis
npx shadcn@latest add --help
```

### Qualidade de Código

```bash
# Lint
npm run lint

# Format (se configurado)
npm run format
```

---

## 6. ESTRUTURA DE PASTA RECOMENDADA

Após setup, organize assim:

```
meu-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── login-form.tsx
│   ├── navbar.tsx
│   ├── sidebar.tsx
│   └── providers.tsx
│
├── lib/
│   ├── utils.ts
│   └── schemas.ts
│
├── hooks/
│   └── useLocalStorage.ts
│
├── types/
│   └── index.ts
│
├── public/
│   └── favicon.ico
│
├── components.json
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 7. PRÓXIMOS PASSOS

### Depois de Configurar

1. **Adicione mais componentes**
   ```bash
   npx shadcn@latest add dialog table data-table
   ```

2. **Configure Dark Mode**
   - Instale: `npm install next-themes`
   - Configure em `app/layout.tsx`

3. **Crie suas páginas**
   - Login/Signup
   - Dashboard
   - Perfil do usuário

4. **Estilize conforme seu design**
   - Customize cores em `globals.css`
   - Use `cn()` para classes condicionais

5. **Conecte com backend**
   - Criar API routes em `app/api/`
   - Usar fetch ou bibliotecas (axios, etc)

### Recursos Adicionais

- [Documentação shadcn/ui](https://ui.shadcn.com)
- [React Hook Form Docs](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 8. TROUBLESHOOTING RÁPIDO

### Erro: Peer Dependencies com npm

**Solução:**
```bash
npx shadcn@latest init -d --force
```

### Erro: Componentes não encontrados

**Solução:**
```bash
# Verificar se foi adicionado
npx shadcn@latest add button

# Verificar imports
import { Button } from "@/components/ui/button"
```

### Tailwind não funcionando

**Solução:**
```bash
# Limpar e reconstruir
rm -rf .next
npm run build
npm run dev
```

### Dark mode não funciona

**Solução:**
```bash
# Instalar next-themes
npm install next-themes

# Adicionar em app/layout.tsx
import { ThemeProvider } from "next-themes"

<ThemeProvider attribute="class">
  {children}
</ThemeProvider>
```

---

## 9. EXEMPLOS PRONTOS PARA COPIAR

### Botão com Loading

```tsx
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export function ButtonLoading() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <Button
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true)
        await fetch("/api/something")
        setIsLoading(false)
      }}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "Carregando..." : "Clique"}
    </Button>
  )
}
```

### Toast com Sonner

```tsx
import { toast } from "sonner"

// Sucesso
toast.success("Pronto!")

// Erro
toast.error("Deu ruim")

// Carregamento
const id = toast.loading("Processando...")
setTimeout(() => {
  toast.success("Feito!", { id })
}, 2000)
```

### Dialog Simples

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Título do Dialog</DialogTitle>
        </DialogHeader>
        <p>Conteúdo aqui</p>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 10. VARIÁVEIS DE AMBIENTE

**Arquivo:** `.env.local`

```bash
# Desenvolvimento
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development

# Se usar banco de dados
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Se usar autenticação
NEXTAUTH_SECRET=sua_chave_secreta
NEXTAUTH_URL=http://localhost:3000
```

---

## RESUMO

1. **5 min**: Setup inicial com `npx create-next-app` e `npx shadcn@latest init`
2. **10 min**: Adicionar componentes básicos
3. **15 min**: Criar primeiro formulário
4. **Pronto!**: Você tem uma base sólida para começar

**Tempo total: ~30 minutos do zero ao desenvolvimento!**

---

**Última atualização:** Novembro 2025
**Versões:** Next.js 15, React 19, Tailwind CSS v4, shadcn/ui latest
