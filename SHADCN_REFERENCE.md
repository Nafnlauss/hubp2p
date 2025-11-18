# shadcn/ui - Referência Rápida

Guia de referência rápida com comandos e lista de componentes disponíveis.

---

## 1. COMANDOS ESSENCIAIS

### Inicializar Projeto

```bash
# Novo projeto com shadcn/ui
npx shadcn@latest init -d

# Com npm e React 19 (use force se necessário)
npx shadcn@latest init -d --force

# Com pnpm (sem flags necessárias)
pnpm shadcn init -d
```

### Adicionar Componentes

```bash
# Um componente
npx shadcn@latest add button

# Múltiplos componentes
npx shadcn@latest add button form input dialog table

# Instalação com force (npm)
npx shadcn@latest add button --force

# Listar componentes disponíveis
npx shadcn@latest add --help
```

### Atualizar

```bash
# Atualizar CLI
npx shadcn@latest init

# Checar atualizações
npm outdated
```

---

## 2. DEPENDÊNCIAS PRINCIPAIS

### Instalação Básica

```bash
npm install react-hook-form zod @hookform/resolvers
npm install sonner
npm install @tanstack/react-table
```

### Componentes Relacionados

```bash
# Calendário
npm install react-day-picker

# Carrossel
npm install embla-carousel-react embla-carousel-autoplay

# Gráficos
npm install recharts

# Comandos/Busca
npm install cmdk
```

---

## 3. LISTA COMPLETA DE COMPONENTES

### Formulário

| Componente | Comando | Descrição |
|-----------|---------|-----------|
| Form | `npx shadcn add form` | Wrapper React Hook Form |
| Input | `npx shadcn add input` | Campo de entrada de texto |
| Textarea | `npx shadcn add textarea` | Área de texto |
| Button | `npx shadcn add button` | Botão |
| Checkbox | `npx shadcn add checkbox` | Checkbox |
| Radio Group | `npx shadcn add radio-group` | Grupo de radio buttons |
| Select | `npx shadcn add select` | Dropdown/Select |
| Switch | `npx shadcn add switch` | Toggle switch |
| Label | `npx shadcn add label` | Label de formulário |
| Combobox | `npx shadcn add combobox` | Select com busca |
| Slider | `npx shadcn add slider` | Range slider |
| Date Picker | `npx shadcn add date-picker` | Seletor de data |
| Input OTP | `npx shadcn add input-otp` | Input para OTP |
| Input Group | `npx shadcn add input-group` | Input com prefix/suffix |
| Native Select | `npx shadcn add native-select` | Select nativo HTML |

### Containers

| Componente | Comando | Descrição |
|-----------|---------|-----------|
| Card | `npx shadcn add card` | Container card |
| Alert | `npx shadcn add alert` | Alerta |
| Alert Dialog | `npx shadcn add alert-dialog` | Diálogo de alerta |
| Dialog | `npx shadcn add dialog` | Modal/Diálogo |
| Drawer | `npx shadcn add drawer` | Drawer/Gaveta lateral |
| Popover | `npx shadcn add popover` | Popover |
| Sheet | `npx shadcn add sheet` | Sheet modal |
| Hover Card | `npx shadcn add hover-card` | Card ao hover |
| Toast | `npx shadcn add toast` | Notificação toast |

### Navegação

| Componente | Comando | Descrição |
|-----------|---------|-----------|
| Button Group | `npx shadcn add button-group` | Grupo de botões |
| Breadcrumb | `npx shadcn add breadcrumb` | Navegação breadcrumb |
| Pagination | `npx shadcn add pagination` | Paginação |
| Menubar | `npx shadcn add menubar` | Barra de menu |
| Navigation Menu | `npx shadcn add navigation-menu` | Menu de navegação |
| Tabs | `npx shadcn add tabs` | Abas/Tabs |
| Command | `npx shadcn add command` | Comando/Palette |
| Context Menu | `npx shadcn add context-menu` | Menu de contexto |
| Dropdown Menu | `npx shadcn add dropdown-menu` | Menu dropdown |
| Sidebar | `npx shadcn add sidebar` | Barra lateral |

### Exibição

| Componente | Comando | Descrição |
|-----------|---------|-----------|
| Table | `npx shadcn add table` | Tabela HTML |
| Data Table | `npx shadcn add data-table` | Tabela avançada |
| Badge | `npx shadcn add badge` | Badge/Tag |
| Avatar | `npx shadcn add avatar` | Avatar/Foto perfil |
| Progress | `npx shadcn add progress` | Barra de progresso |
| Carousel | `npx shadcn add carousel` | Carrossel |
| Calendar | `npx shadcn add calendar` | Calendário |
| Chart | `npx shadcn add chart` | Gráficos (Recharts) |
| Empty | `npx shadcn add empty` | Estado vazio |
| Skeleton | `npx shadcn add skeleton` | Placeholder skeleton |
| Spinner | `npx shadcn add spinner` | Loading spinner |
| Kbd | `npx shadcn add kbd` | Teclado shortcut |
| Separator | `npx shadcn add separator` | Separador |
| Aspect Ratio | `npx shadcn add aspect-ratio` | Aspect ratio wrapper |
| Scroll Area | `npx shadcn add scroll-area` | Área com scroll customizado |
| Accordion | `npx shadcn add accordion` | Acordeon/Collapse |
| Collapsible | `npx shadcn add collapsible` | Conteúdo expansível |
| Resizable | `npx shadcn add resizable` | Painel redimensionável |
| Toggle | `npx shadcn add toggle` | Toggle button |
| Toggle Group | `npx shadcn add toggle-group` | Grupo de toggles |
| Tooltip | `npx shadcn add tooltip` | Tooltip/Dica |
| Sonner | `npx shadcn add sonner` | Toast avançado |
| Typography | `npx shadcn add typography` | Tipografia utility |

### Utilitários

| Componente | Comando | Descrição |
|-----------|---------|-----------|
| Field | `npx shadcn add field` | Field builder (novo) |
| Item | `npx shadcn add item` | Item wrapper |

---

## 4. IMPORTS COMUNS

```tsx
// Button
import { Button } from "@/components/ui/button"

// Forms
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"

// Containers
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Table
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Outros
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster, toast } from "sonner"
import { cn } from "@/lib/utils"
```

---

## 5. ESTRUTURA DE PASTAS

```
seu-projeto/
├── app/
│   ├── layout.tsx           # Layout root
│   └── page.tsx             # Home page
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── [outros componentes]
│   ├── providers.tsx        # Context providers (Toaster, etc)
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── [suas páginas/seções]
├── lib/
│   ├── utils.ts            # Utilitários (cn function)
│   └── schemas.ts          # Zod schemas
├── hooks/                   # Custom hooks
├── styles/
│   └── globals.css         # Estilos globais
├── components.json         # Config shadcn/ui
├── tailwind.config.ts      # Config Tailwind
├── tsconfig.json           # Config TypeScript
└── package.json
```

---

## 6. SNIPPETS RÁPIDOS

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
        // async operation
        await new Promise(r => setTimeout(r, 1000))
        setIsLoading(false)
      }}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "Carregando..." : "Clique aqui"}
    </Button>
  )
}
```

### Form com Validação

```tsx
const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

const form = useForm({
  resolver: zodResolver(schema),
})

<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input type="email" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Toast com Sonner

```tsx
import { toast } from "sonner"

// Sucesso
toast.success("Operação realizada com sucesso!")

// Erro
toast.error("Ocorreu um erro")

// Carregamento
const id = toast.loading("Carregando...")
setTimeout(() => {
  toast.success("Pronto!", { id })
}, 2000)

// Customizado
toast.custom((t) => (
  <div>Notificação customizada</div>
))
```

### cn() - Combinar Classes

```tsx
import { cn } from "@/lib/utils"

// Combinar classes condicionalmente
<div className={cn(
  "base-class",
  isActive && "active-class",
  size === "lg" && "text-lg",
  "final-class"
)}>
  Content
</div>
```

---

## 7. TEMAS PERSONALIZADOS

### Cores do Tema

```css
:root {
  /* Primária */
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;

  /* Secundária */
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;

  /* Destrutiva (perigo) */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;

  /* Fundo */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.6%;

  /* Acentos */
  --accent: 0 0% 9%;
  --accent-foreground: 0 0% 98%;

  /* Muted (desabilitado) */
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;

  /* Fronteiras */
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;

  /* Ring (focus) */
  --ring: 0 0% 3.6%;
}

.dark {
  --background: 0 0% 3.6%;
  --foreground: 0 0% 98%;
  /* etc... */
}
```

### Gerar Tema Personalizado

1. Acesse: https://ui.shadcn.com/themes
2. Escolha a cor desejada
3. Copie o código CSS
4. Cole em seu arquivo de estilos

---

## 8. TROUBLESHOOTING

### Erro de Peer Dependencies com npm

```bash
# Solução 1: Use --force
npx shadcn@latest add button --force

# Solução 2: Use --legacy-peer-deps
npm install --legacy-peer-deps

# Solução 3: Downgrade React para 18
npm install react@18 react-dom@18
```

### Tailwind não está funcionando

```bash
# Executar novamente a instalação
npm install

# Limpar cache Tailwind
npm run build

# Verificar tailwind.config.ts
# Certifique-se que content está correto:
content: [
  './components/**/*.{js,ts,jsx,tsx}',
  './app/**/*.{js,ts,jsx,tsx}',
]
```

### Componentes não importam

```bash
# Reconstruir após adicionar componente
npx shadcn@latest add [componente]

# Verificar components.json
# Deve estar apontando para o diretório correto:
{
  "aliases": {
    "@/*": "./src/*"  // ou "./app/*" dependendo do seu projeto
  }
}
```

---

## 9. BOAS PRÁTICAS

1. **Sempre use TypeScript**
   ```tsx
   interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     isLoading?: boolean
   }
   ```

2. **Valide formulários com Zod**
   ```tsx
   const schema = z.object({
     name: z.string().min(1),
   })
   ```

3. **Use cn() para classes condicionais**
   ```tsx
   className={cn("base", isActive && "active")}
   ```

4. **Componentes "use client" quando usar hooks**
   ```tsx
   "use client"
   import { useState } from "react"
   ```

5. **Reutilize componentes**
   ```tsx
   // Ao invés de copiar, crie um wrapper
   export function MyButton(props) {
     return <Button {...props} />
   }
   ```

---

## 10. RECURSOS E LINKS

| Recurso | URL |
|---------|-----|
| Documentação oficial | https://ui.shadcn.com |
| GitHub | https://github.com/shadcn-ui/ui |
| React Hook Form | https://react-hook-form.com |
| Zod | https://zod.dev |
| Tailwind CSS | https://tailwindcss.com |
| Radix UI | https://www.radix-ui.com |
| Gerador de Temas | https://ui.shadcn.com/themes |
| Registry | https://ui.shadcn.com/docs/registry |
| Sonner | https://sonner.emilkowal.ski |

---

**Atualizado:** Novembro 2025
**Compatibilidade:** Next.js 15+, React 19+, Tailwind CSS v4+
