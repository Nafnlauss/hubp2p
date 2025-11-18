# shadcn/ui - Guia Completo de Configuração e Uso

Documentação atualizada para **Next.js 15**, **React 19** e **Tailwind CSS v4**.

---

## 1. INSTALAÇÃO PARA NEXT.JS 15

### 1.1 Criar ou Configurar um Projeto Next.js

```bash
# Inicializar shadcn/ui em um projeto novo ou existente
npx shadcn@latest init -d
```

Quando executar o comando, você terá opções para:
- Escolher o tipo de projeto (Next.js ou Monorepo)
- Configurar Tailwind CSS automaticamente
- Selecionar TSConfig
- Selecionar estilo (padrão ou custom)

### 1.2 Resolver Dependências com React 19 (npm)

**Importante:** Se estiver usando **npm**, você pode precisar usar flags para resolver conflitos de peer dependencies:

#### Opção 1: Com --force
```bash
npx shadcn@latest init -d --force
```

#### Opção 2: Com --legacy-peer-deps
```bash
npm install --legacy-peer-deps
```

**Nota:** Para **pnpm**, **bun** ou **yarn**, não são necessários flags.

### 1.3 Adicionar Componentes

```bash
# Adicionar um componente específico
npx shadcn@latest add button

# Adicionar vários componentes
npx shadcn@latest add button form input
```

---

## 2. ESTRUTURA DO PROJETO

Após a instalação, você terá a seguinte estrutura:

```
seu-projeto/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...
│   └── example-form.tsx    # Seus componentes
├── lib/
│   └── utils.ts           # Utilitários (cn function)
├── components.json        # Configuração shadcn/ui
├── tailwind.config.ts     # Configuração Tailwind
├── globals.css            # Estilos globais
└── package.json
```

---

## 3. CONFIGURAÇÃO TAILWIND CSS

### 3.1 Tailwind CSS v4

Se estiver usando **Tailwind CSS v4**, a configuração é simplificada:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

const config = {
  darkMode: ["class"],
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### 3.2 Arquivo CSS Global

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 4. TEMA (THEMING)

### 4.1 Usando CSS Variables (Recomendado)

O shadcn/ui utiliza CSS variables para temas. Edite seu arquivo CSS:

```css
/* globals.css ou seu arquivo de estilos */
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
    --accent: 0 0% 9.0%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --primary: 0 0% 9.0%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9.0%;
    --ring: 0 0% 3.6%;
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
    --accent-foreground: 0 0% 9.0%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 9.1% 97.3%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9.0%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --ring: 0 0% 83.1%;
  }
}
```

### 4.2 Dark Mode

Configure dark mode no `tailwind.config.ts`:

```typescript
export default {
  darkMode: "class",
  // ... resto da configuração
}
```

Use em seu layout:

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 4.3 Customizar Temas com tweakcn

Acesse https://ui.shadcn.com/themes para gerar temas personalizados com a cor desejada.

---

## 5. COMPONENTES PRINCIPAIS

### 5.1 Button

```bash
npx shadcn@latest add button
```

**Uso básico:**

```tsx
import { Button } from "@/components/ui/button"

export function ButtonDemo() {
  return (
    <div className="flex gap-4">
      <Button>Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}
```

**Tamanhos:**

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
<Button size="icon-sm">Icon Small</Button>
<Button size="icon-lg">Icon Large</Button>
```

**Com ícone:**

```tsx
import { ChevronRight } from "lucide-react"

<Button>
  <ChevronRight className="ml-2 h-4 w-4" />
  Continue
</Button>
```

---

### 5.2 Form (com React Hook Form)

```bash
npx shadcn@latest add form
```

**Instalação de dependências:**

```bash
npm install react-hook-form zod @hookform/resolvers
```

**Criar schema com Zod:**

```typescript
// lib/schemas.ts
import { z } from "zod"

export const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
})

export type FormSchema = z.infer<typeof formSchema>
```

**Componente de Formulário:**

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { formSchema, type FormSchema } from "@/lib/schemas"

export function LoginForm() {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  })

  function onSubmit(values: FormSchema) {
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

---

### 5.3 Dialog e Modal

```bash
npx shadcn@latest add dialog
```

**Uso básico:**

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DialogDemo() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              // Perform action
              setOpen(false)
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Dialog dentro de Context Menu:**

```tsx
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export function ContextMenuDialog() {
  return (
    <Dialog>
      <ContextMenu>
        <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
        <ContextMenuContent>
          <DialogTrigger asChild>
            <ContextMenuItem>Delete</ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm deletion?</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
```

---

### 5.4 Table

```bash
npx shadcn@latest add table
```

**Uso básico:**

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const invoices = [
  {
    invoice: "INV-001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV-002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
]

export function TableDemo() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Data Table Avançada (TanStack React Table):**

```bash
npm install @tanstack/react-table
npx shadcn@latest add data-table
```

```tsx
"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

---

## 6. COMPONENTES FORMULÁRIO

### 6.1 Input

```bash
npx shadcn@latest add input
```

```tsx
import { Input } from "@/components/ui/input"

<Input
  type="email"
  placeholder="Email"
  disabled={false}
/>
```

### 6.2 Checkbox

```bash
npx shadcn@latest add checkbox
```

```tsx
import { Checkbox } from "@/components/ui/checkbox"

<Checkbox id="terms" />
```

### 6.3 Radio Group

```bash
npx shadcn@latest add radio-group
```

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

<RadioGroup defaultValue="option-one">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-one" id="option-one" />
    <label htmlFor="option-one">Option One</label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-two" id="option-two" />
    <label htmlFor="option-two">Option Two</label>
  </div>
</RadioGroup>
```

### 6.4 Select

```bash
npx shadcn@latest add select
```

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</Select>
```

### 6.5 Textarea

```bash
npx shadcn@latest add textarea
```

```tsx
import { Textarea } from "@/components/ui/textarea"

<Textarea placeholder="Type your message here." />
```

### 6.6 Switch

```bash
npx shadcn@latest add switch
```

```tsx
import { Switch } from "@/components/ui/switch"

<Switch />
```

---

## 7. COMPONENTES LAYOUT

### 7.1 Card

```bash
npx shadcn@latest add card
```

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    Card Content
  </CardContent>
</Card>
```

### 7.2 Alert

```bash
npx shadcn@latest add alert
```

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>
```

### 7.3 Tabs

```bash
npx shadcn@latest add tabs
```

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="tab1" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content for Tab 1</TabsContent>
  <TabsContent value="tab2">Content for Tab 2</TabsContent>
</Tabs>
```

### 7.4 Popover

```bash
npx shadcn@latest add popover
```

```tsx
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    Place content for the popover here.
  </PopoverContent>
</Popover>
```

---

## 8. CUSTOMIZAÇÃO DE COMPONENTES

### 8.1 Estender Componentes

```tsx
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
}

export function CustomButton({
  isLoading,
  className,
  children,
  ...props
}: CustomButtonProps) {
  return (
    <Button
      className={cn("relative", className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </Button>
  )
}
```

### 8.2 Usar className com cn()

```tsx
import { cn } from "@/lib/utils"

export function Example() {
  return (
    <div className={cn(
      "px-4 py-2 rounded-md",
      "bg-slate-900 text-white",
      "hover:bg-slate-800"
    )}>
      Content
    </div>
  )
}
```

---

## 9. STATUS DE COMPATIBILIDADE COM REACT 19

| Pacote | Status | Nota |
|--------|--------|------|
| radix-ui | ✅ | Compatível com React 19 |
| lucide-react | ✅ | Compatível com React 19 |
| class-variance-authority | ✅ | Sem peer dependency React 19 |
| tailwindcss-animate | ✅ | Sem peer dependency React 19 |
| embla-carousel-react | ✅ | Compatível com React 19 |
| recharts | ✅ | Compatível com React 19 |
| react-hook-form | ✅ | Compatível com React 19 |
| react-resizable-panels | ✅ | Compatível com React 19 |
| sonner | ✅ | Compatível com React 19 |
| react-day-picker | ✅ | Compatível com React 19 |
| input-otp | ✅ | Compatível com React 19 |
| vaul | ✅ | Compatível com React 19 |
| cmdk | ✅ | Compatível com React 19 |

---

## 10. DICAS DE DESENVOLVIMENTO

### 10.1 Usar Drawer para Mobile

```bash
npx shadcn@latest add drawer
```

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

<Drawer>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Title</DrawerTitle>
      <DrawerDescription>Description</DrawerDescription>
    </DrawerHeader>
  </DrawerContent>
</Drawer>
```

### 10.2 Toast Notifications com Sonner

```bash
npm install sonner
npx shadcn@latest add sonner
```

```tsx
"use client"

import { Toaster, toast } from "sonner"

export function ToastDemo() {
  return (
    <>
      <Toaster />
      <button onClick={() => toast.success("Success!")}>
        Show Toast
      </button>
    </>
  )
}
```

### 10.3 Combobox (Searchable Select)

```bash
npx shadcn@latest add combobox
```

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"

const options = [
  { value: "next", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt", label: "Nuxt" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

export function ComboboxDemo() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}>
          {value ? options.find(opt => opt.value === value)?.label : "Select option..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandEmpty>No option found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={currentValue => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

---

## 11. RECURSOS ÚTEIS

- **Documentação oficial:** https://ui.shadcn.com
- **Documentação React Hook Form:** https://react-hook-form.com
- **Documentação Zod:** https://zod.dev
- **Tema Generator:** https://ui.shadcn.com/themes
- **Registry:** https://ui.shadcn.com/docs/registry
- **Next.js 15 Docs:** https://nextjs.org/docs
- **Tailwind CSS v4:** https://tailwindcss.com

---

## 12. CHECKLIST DE INSTALAÇÃO RÁPIDA

```bash
# 1. Criar projeto Next.js 15
npx create-next-app@latest meu-app --typescript --tailwind

# 2. Inicializar shadcn/ui
cd meu-app
npx shadcn@latest init -d

# 3. Adicionar componentes básicos
npx shadcn@latest add button form input dialog table

# 4. Instalar dependências extras (opcional)
npm install react-hook-form zod @hookform/resolvers sonner

# 5. Começar desenvolvimento
npm run dev
```

---

**Última atualização:** Novembro 2025
**Compatibilidade:** Next.js 15, React 19, Tailwind CSS v4
