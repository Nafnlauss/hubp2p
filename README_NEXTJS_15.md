# Next.js 15: Documentação Completa de Referência

## Arquivos Inclusos

Este pacote contém 4 documentos abrangentes sobre Next.js 15:

### 1. **NEXTJS_15_BEST_PRACTICES.md** (Guia Principal)
- Comparação detalhada: App Router vs Pages Router
- Server Components vs Client Components
- Padrões de data fetching completos
- Estratégias de caching em 4 níveis
- Route Handlers com exemplos
- Middleware implementação
- Configuração e best practices
- **Melhor para**: Entender conceitos e decisões de arquitetura

### 2. **NEXTJS_15_CODE_EXAMPLES.ts** (Exemplos Práticos)
- 12 exemplos de código prontos para copiar
- Server components com data fetching
- Client components interativos
- Dynamic routes com params como Promise
- Route handlers com validação
- Middleware para autenticação
- Revalidação de cache
- Suspense e streaming
- Error handling
- **Melhor para**: Implementação rápida, copiar e colar

### 3. **NEXTJS_15_CONFIGURATION.md** (Setup e Configuração)
- next.config.js completo com explicações
- tsconfig.json com strict mode
- Estrutura recomendada de projeto
- Variáveis de ambiente (.env)
- ESLint e Prettier
- Dependências recomendadas
- Checklist de setup inicial
- **Melhor para**: Inicial novo projeto, configurar ambiente

### 4. **NEXTJS_15_QUICK_REFERENCE.md** (Referência Rápida)
- TL;DR para decisões rápidas
- Código mínimo para começar
- Padrões comuns
- Comandos úteis
- Troubleshooting rápido
- Performance checklist
- Segurança checklist
- **Melhor para**: Consulta rápida, lembrete, debugging

---

## Resumo Executivo

### Principais Features do Next.js 15

#### 1. **App Router** (Recomendado para Novos Projetos)
- Renderização em servidor por padrão (Server Components)
- Layouts aninhados para melhor organização
- Streaming com Suspense
- Data fetching mais simples com async/await
- Melhor performance e SEO

#### 2. **Server Components** (Padrão)
```typescript
export default async function Page() {
  const data = await fetch(...) // Direto no componente!
  return <div>{data}</div>
}
```

#### 3. **Client Components** (Quando Necessário)
```typescript
'use client'

export function InteractiveComponent() {
  const [state, setState] = useState()
  return <button onClick={() => setState(...)}>...</button>
}
```

#### 4. **Route Handlers** (API Routes Modernas)
```typescript
export async function GET(request: NextRequest) {
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return NextResponse.json(result, { status: 201 })
}
```

#### 5. **Caching Estratégico** (4 Níveis)
```typescript
// 1. Request Memoization (automático)
// 2. Data Cache (com revalidate)
fetch('url', { next: { revalidate: 3600 } })

// 3. Full Route Cache (em build)
// 4. Router Cache (no navegador)
```

#### 6. **Middleware** (Antes de Rotas)
```typescript
export function middleware(request: NextRequest) {
  if (!request.cookies.get('auth')) {
    return NextResponse.redirect('/login')
  }
  return NextResponse.next()
}
```

---

## Decision Tree: Qual Framework/Pattern Usar?

```
Novo Projeto?
├─ SIM → Use App Router com Server Components
└─ NÃO → Mantenha Pages Router se funciona

Server ou Client Component?
├─ Precisa de dados/secrets? → Server Component ✓
├─ Precisa de interatividade? → Client Component ✓
└─ Dúvida? → Server Component (padrão)

Data Fetching?
├─ No server durante render? → fetch() no Server Component
├─ Depois de render? → useEffect em Client Component
└─ API call? → Use Route Handler (/api/...)

Caching?
├─ Dados estáticos? → ISR com revalidate
├─ Dados dinâmicos? → revalidateTag()
├─ Real-time? → cache: 'no-store'
└─ Dúvida? → 3600 segundos (1 hora)
```

---

## Checklist para Novo Projeto

### Setup Inicial (15 min)
- [ ] `npx create-next-app@latest`
- [ ] Escolher: TypeScript, App Router, Tailwind
- [ ] Instalar dependências
- [ ] Rodar `npm run dev`

### Configuração (30 min)
- [ ] Copiar `tsconfig.json` com strict mode
- [ ] Copiar `next.config.js` com segurança
- [ ] Criar estrutura de pastas
- [ ] Configurar path aliases (`@/*`)
- [ ] Criar `.env.example`

### First Features (1 hora)
- [ ] Home page com Server Component
- [ ] Layout com Header/Footer
- [ ] API route exemplo
- [ ] Middleware básico
- [ ] Error handling

### Otimizações (1 hora)
- [ ] Caching configurado
- [ ] Images otimizadas
- [ ] Suspense para loading
- [ ] Type checking
- [ ] ESLint/Prettier

---

## Performance Targets

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Next.js Otimizações
```typescript
// Images
import Image from 'next/image'

// Code splitting
import dynamic from 'next/dynamic'
const Component = dynamic(() => import('...'))

// Suspense
<Suspense fallback={<Skeleton />}>
  <DataComponent />
</Suspense>

// Caching
fetch('url', { next: { revalidate: 3600 } })
```

---

## Security Essentials

```typescript
// 1. Validar Input
import { z } from 'zod'
const schema = z.object({ name: z.string() })
const validated = schema.parse(data)

// 2. Proteger Secrets
const secret = process.env.API_SECRET // Nunca expor

// 3. CORS
const headers = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
}

// 4. Headers
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

// 5. Rate Limiting
// Use Upstash Ratelimit no middleware
```

---

## Quando Usar Cada Padrão

### Server Component + async/await
```typescript
// ✅ USE PARA: Dados que precisam vir direto do servidor
export default async function BlogPost({ params }: Props) {
  const post = await db.posts.findUnique(params.id)
  return <article>{post.content}</article>
}
```

### Client Component + useEffect
```typescript
// ✅ USE PARA: Dados que mudam frequentemente ou após interação
'use client'
export function Likes({ postId }: Props) {
  const [likes, setLikes] = useState(0)
  useEffect(() => {
    fetch(`/api/posts/${postId}/likes`)
      .then(r => r.json())
      .then(data => setLikes(data.count))
  }, [postId])
  return <button>{likes}</button>
}
```

### Route Handler
```typescript
// ✅ USE PARA: APIs que o frontend chama
export async function POST(request: NextRequest) {
  const data = await request.json()
  const result = await db.posts.create(data)
  return NextResponse.json(result)
}
```

### Middleware
```typescript
// ✅ USE PARA: Lógica que se aplica a múltiplas rotas
export function middleware(request: NextRequest) {
  // Autenticação, logging, redirects, etc
  return NextResponse.next()
}
```

---

## Exemplo: Aplicação Completa Mínima

```typescript
// app/page.tsx (Server Component)
import Link from 'next/link'

export default async function Home() {
  const posts = await fetch('https://api.example.com/posts')
    .then(r => r.json())

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <div className="grid gap-4">
        {posts.map(post => (
          <Link key={post.id} href={`/posts/${post.slug}`}>
            <PostCard post={post} />
          </Link>
        ))}
      </div>
    </main>
  )
}

// components/PostCard.tsx (Server Component)
interface Post {
  id: number
  title: string
  excerpt: string
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="border rounded p-4 hover:shadow-lg">
      <h2 className="text-xl font-semibold">{post.title}</h2>
      <p className="text-gray-600">{post.excerpt}</p>
    </article>
  )
}

// app/posts/[slug]/page.tsx (Dynamic Route)
export default async function Post({ params }: Props) {
  const { slug } = await params // ⚠️ Promise!
  const post = await fetch(`https://api.example.com/posts/${slug}`)
    .then(r => r.json())

  return <article>{post.content}</article>
}

// app/api/posts/route.ts (API)
export async function GET() {
  const posts = await db.posts.findMany()
  return NextResponse.json(posts)
}

// middleware.ts (Middleware)
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  return NextResponse.next()
}
```

---

## Migração de Pages Router para App Router

Se tiver projeto antigo:

```typescript
// ANTES (Pages Router)
// pages/posts.jsx
export async function getServerSideProps() {
  const posts = await fetchPosts()
  return { props: { posts } }
}
export default function Posts({ posts }) {
  return <div>{posts.map(...)}</div>
}

// DEPOIS (App Router)
// app/posts/page.tsx
export default async function Posts() {
  const posts = await fetchPosts()
  return <div>{posts.map(...)}</div>
}
```

Benefícios:
- Menos boilerplate
- Server Components por padrão
- Melhor performance
- Layouts aninhados
- Melhor type safety

---

## Recursos para Aprender

### Oficial
- **Docs**: https://nextjs.org/docs
- **Learn**: https://nextjs.org/learn
- **Examples**: https://github.com/vercel/next.js/tree/canary/examples

### Comunidade
- **Discord**: https://discord.gg/nextjs
- **GitHub Discussions**: https://github.com/vercel/next.js/discussions
- **Reddit**: r/nextjs

### Blogs e Tutoriais
- Vercel Blog
- Lee Robinson (Vercel)
- Web Dev Simplified
- Traversy Media

---

## Versionamento

- **Criado em**: Novembro 2025
- **Versão do Next.js**: 15.0+
- **Versão do React**: 19.0+
- **TypeScript**: 5.3+

---

## Como Usar Esta Documentação

1. **Para começar um projeto**: Leia `NEXTJS_15_CONFIGURATION.md`
2. **Para entender conceitos**: Leia `NEXTJS_15_BEST_PRACTICES.md`
3. **Para implementar rápido**: Copie de `NEXTJS_15_CODE_EXAMPLES.ts`
4. **Para dúvida rápida**: Consulte `NEXTJS_15_QUICK_REFERENCE.md`

---

## Suporte e Atualizações

Para manter este guia atualizado:
- Verificar docs oficiais regularmente
- Acompanhar releases do Next.js
- Testar novos features
- Contribuir com community

---

**Última Atualização**: Novembro 2025
**Status**: Completo e testado com Next.js 15
**Mantido por**: Community contributors

---

## Questões Frequentes (FAQ)

### P: Devo usar App Router ou Pages Router?
**R**: Use App Router para novos projetos. Mantenha Pages Router apenas se o projeto já está estável.

### P: Server Components são obrigatórios?
**R**: Não, você pode usar 'use client' em tudo. Mas perderá performance e SEO.

### P: Como faço autenticação?
**R**: Use NextAuth.js ou sua solução preferida. Implemente no middleware para proteger rotas.

### P: Qual é a melhor forma de caching?
**R**: Time-based (revalidate) para dados estáticos, Tag-based para dinâmicos. Combine conforme necessário.

### P: Onde colocar lógica de banco de dados?
**R**: Em Server Components ou Route Handlers. Use Prisma ou Drizzle como ORM.

### P: Como testo minha aplicação?
**R**: Use Jest + React Testing Library. Configure em jest.config.js.

### P: Posso usar Next.js em produção?
**R**: Sim! Deploy em Vercel (recomendado) ou qualquer Node.js server.

---

**Divirta-se desenvolvendo com Next.js!** 🚀
