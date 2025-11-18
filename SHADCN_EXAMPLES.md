# shadcn/ui - Exemplos de Código Prontos

Coleção de componentes e padrões prontos para usar em seu projeto.

---

## 1. EXEMPLO DE FORMULÁRIO COMPLETO

**Arquivo:** `components/signup-form.tsx`

```tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"

// Schema de validação
const signUpSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome não pode ter mais de 50 caracteres"),
  email: z.string()
    .email("Email inválido"),
  password: z.string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter um número"),
  confirmPassword: z.string(),
  bio: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "Você deve concordar com os termos",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não correspondem",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

export function SignUpForm() {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      bio: "",
      agreeToTerms: false,
    },
  })

  async function onSubmit(data: SignUpFormData) {
    try {
      setIsLoading(true)

      // Simular chamada API
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log("Form data:", data)
      toast.success("Cadastro realizado com sucesso!")
      form.reset()
    } catch (error) {
      toast.error("Erro ao realizar cadastro")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Criar Conta</h1>
        <p className="text-gray-500 mt-1">Preencha os dados abaixo para se cadastrar</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="João Silva"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="joao@example.com"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Usaremos este email para sua conta
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Senha */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Deve conter uma maiúscula e um número
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirmar Senha */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Repita sua senha"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bio */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Fale um pouco sobre você..."
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Termos */}
          <FormField
            control={form.control}
            name="agreeToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Concordo com os termos e condições
                  </FormLabel>
                  <FormDescription>
                    Leia nossa política de privacidade
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Criando conta..." : "Criar Conta"}
          </Button>

          <p className="text-sm text-center text-gray-500">
            Já possui conta? <a href="/login" className="text-blue-600 hover:underline">Faça login</a>
          </p>
        </form>
      </Form>
    </div>
  )
}
```

---

## 2. DIALOG COM CONFIRMAÇÃO

**Arquivo:** `components/delete-dialog.tsx`

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
import { AlertCircle } from "lucide-react"

interface DeleteDialogProps {
  title: string
  description: string
  itemName: string
  onConfirm: () => Promise<void>
}

export function DeleteDialog({
  title,
  description,
  itemName,
  onConfirm,
}: DeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      await onConfirm()
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Deletar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <DialogTitle className="text-red-600">{title}</DialogTitle>
          </div>
          <DialogDescription className="mt-3">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
          <p className="text-sm text-amber-900">
            Você está prestes a deletar: <strong>{itemName}</strong>
          </p>
          <p className="text-sm text-amber-800 mt-2">
            Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deletando..." : "Deletar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 3. DATA TABLE AVANÇADA

**Arquivo:** `components/users-table.tsx`

```tsx
"use client"

import { useState } from "react"
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface User {
  id: string
  name: string
  email: string
  status: "active" | "inactive"
  joinDate: string
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          status === "active"
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }`}>
          {status === "active" ? "Ativo" : "Inativo"}
        </span>
      )
    },
  },
  {
    accessorKey: "joinDate",
    header: "Data de Ingresso",
  },
]

const dummyData: User[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@example.com",
    status: "active",
    joinDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@example.com",
    status: "active",
    joinDate: "2024-02-20",
  },
  {
    id: "3",
    name: "Pedro Costa",
    email: "pedro@example.com",
    status: "inactive",
    joinDate: "2024-03-10",
  },
]

export function UsersTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data: dummyData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      return String(value).toLowerCase().includes(filterValue.toLowerCase())
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Buscar usuários..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Colunas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 4. MODAL COM FORMULÁRIO

**Arquivo:** `components/create-item-dialog.tsx`

```tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Plus } from "lucide-react"

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
})

type ItemFormData = z.infer<typeof itemSchema>

interface CreateItemDialogProps {
  onSubmit: (data: ItemFormData) => Promise<void>
}

export function CreateItemDialog({ onSubmit }: CreateItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  async function handleSubmit(data: ItemFormData) {
    try {
      setIsLoading(true)
      await onSubmit(data)
      setOpen(false)
      form.reset()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Item</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo item abaixo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do item"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descrição do item"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 5. CARD COM AÇÕES

**Arquivo:** `components/product-card.tsx`

```tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Heart, ShoppingCart } from "lucide-react"
import { useState } from "react"

interface ProductCardProps {
  id: string
  title: string
  description: string
  price: number
  image: string
  onAddToCart?: (id: string) => void
  onAddToWishlist?: (id: string) => void
}

export function ProductCard({
  id,
  title,
  description,
  price,
  image,
  onAddToCart,
  onAddToWishlist,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={title}
          className="object-cover w-full h-full hover:scale-105 transition-transform"
        />
        <button
          onClick={() => {
            setIsFavorite(!isFavorite)
            onAddToWishlist?.(id)
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-50"
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">
          R$ {price.toFixed(2)}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onAddToCart?.(id)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Adicionar ao Carrinho
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

## 6. LAYOUT COM SIDEBAR

**Arquivo:** `components/layout-with-sidebar.tsx`

```tsx
"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const sidebarLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Usuários" },
  { href: "/products", label: "Produtos" },
  { href: "/settings", label: "Configurações" },
]

export function LayoutWithSidebar({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 bg-slate-900 text-white flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold">Dashboard</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {sidebarLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-4 py-2 rounded hover:bg-slate-800 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-4 p-4 border-b bg-white">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="space-y-2 mt-4">
                {sidebarLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 rounded hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

---

## 7. PÁGINA COM LOADING E ERRO

**Arquivo:** `components/data-page.tsx`

```tsx
"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DataPageProps {
  onFetch: () => Promise<any>
  children: (data: any) => React.ReactNode
}

export function DataPage({ onFetch, children }: DataPageProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    try {
      setIsLoading(true)
      setError(null)
      const result = await onFetch()
      setData(result)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar dados"
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>{error}</p>
              <Button onClick={fetchData} variant="outline" className="w-full">
                Tentar Novamente
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return children(data)
}
```

---

## 8. CONFIGURAÇÃO DO PROVIDER TOAST

**Arquivo:** `components/providers.tsx`

```tsx
"use client"

import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        expand={true}
        theme="light"
      />
    </>
  )
}
```

**Arquivo:** `app/layout.tsx`

```tsx
import { Providers } from "@/components/providers"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

---

**Dica:** Todos esses exemplos podem ser usados diretamente em seus projetos. Basta ajustar as importações conforme necessário.
