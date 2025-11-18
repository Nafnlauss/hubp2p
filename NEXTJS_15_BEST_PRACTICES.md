# Next.js 15: Guia Completo de Melhores Práticas e Features

## Índice
1. [App Router vs Pages Router](#app-router-vs-pages-router)
2. [Server Components vs Client Components](#server-components-vs-client-components)
3. [Padrões de Data Fetching](#padrões-de-data-fetching)
4. [Estratégias de Caching](#estratégias-de-caching)
5. [Route Handlers](#route-handlers)
6. [Middleware](#middleware)
7. [Configuração e Best Practices](#configuração-e-best-practices)

---

## App Router vs Pages Router

### Visão Geral Comparativa

| Aspecto | App Router | Pages Router |
|---------|-----------|-------------|
| **Estrutura** | Baseado em pastas no diretório `app` | Baseado em arquivos no diretório `pages` |
| **Server Components** | Padrão (por default) | Não suportados |
| **Nested Layouts** | Suportados nativamente | Requer workarounds |
| **Data Fetching** | Async/await em componentes | `getServerSideProps`, `getStaticProps` |
| **Performance** | Otimizado para moderno | Estável e testado |
| **Curva de Aprendizado** | Mais acentuada | Mais suave |

### Quando Usar App Router

```plaintext
✓ Novos projetos
✓ Aplicações que requerem layouts aninhados
✓ Equipes prontas para aprender novos conceitos
✓ Aplicações que precisam de SSR com streaming
✓ Projetos que querem aproveitar React Server Components
✓ Aplicações que precisam de SEO otimizado com renderização do servidor
```

### Quando Usar Pages Router

```plaintext
✓ Projetos legados existentes
✓ Aplicações simples e diretas
✓ Quando estabilidade é crítica
✓ Equipes não familiarizadas com Server Components
✓ Projetos com requisitos de roteamento simples
```

### Exemplo de Estrutura App Router

```
app/
├── layout.tsx                    # Layout raiz
├── page.tsx                      # Página inicial
├── dashboard/
│   ├── layout.tsx               # Layout aninhado
│   ├── page.tsx                 # /dashboard
│   └── settings/
│       └── page.tsx             # /dashboard/settings
├── api/
│   └── posts/
│       └── route.ts             # POST /api/posts
└── error.tsx                    # Tratamento de erros
```

### Exemplo de Estrutura Pages Router

```
pages/
├── _app.tsx                     # App wrapper
├── _document.tsx                # Documento HTML
├── index.tsx                    # Página inicial
├── dashboard.tsx                # /dashboard
├── api/
│   └── posts.ts                # POST /api/posts
└── 404.tsx                      # Página 404
```

---

## Server Components vs Client Components

### O que são Server Components?

Server Components são renderizados exclusivamente no servidor e nunca enviam JavaScript para o cliente. São o padrão no App Router.

### O que são Client Components?

Client Components são renderizados no navegador e podem interagir com eventos do usuário, estado e hooks.

### Comparação

| Aspecto | Server Component | Client Component |
|---------|-----------------|-----------------|
| **Rendering** | Servidor | Navegador |
| **Acesso a Dados** | Direto ao banco | Através de APIs |
| **Segredos/Tokens** | Seguros | Expostos ao cliente |
| **Tamanho do Bundle** | Não afeta | Afeta tamanho do JS |
| **Hooks (useState, useEffect)** | Não suportados | Suportados |
| **Diretiva Necessária** | Nenhuma | `'use client'` no topo |

### Exemplos Práticos

#### Server Component (Padrão)

```typescript
// app/posts/page.tsx
export const metadata: Metadata = {
  title: 'Posts',
  description: 'Ver todos os posts',
}

// ✅ Async/await funciona
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 } // Cache por 1 hora
  })
  return res.json()
}

export default async function PostsPage() {
  const posts = await getPosts()

  return (
    <div>
      <h1>Posts</h1>
      <PostsList posts={posts} />
    </div>
  )
}

// Componente Server que passa dados para Client Component
function PostsList({ posts }: { posts: Post[] }) {
  return (
    <ul>
      {posts.map(post => (
        <PostItem key={post.id} post={post} />
      ))}
    </ul>
  )
}
```

#### Client Component com Interatividade

```typescript
'use client'

import { useState } from 'react'

interface Post {
  id: number
  title: string
  liked: boolean
}

export function PostItem({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
      })
      if (res.ok) {
        setLiked(!liked)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <li className="post-item">
      <h2>{post.title}</h2>
      <button
        onClick={handleLike}
        disabled={loading}
        className={liked ? 'liked' : ''}
      >
        {liked ? '❤️' : '🤍'} {liked ? 'Unlike' : 'Like'}
      </button>
    </li>
  )
}
```

#### Padrão Recomendado: Server + Client

```typescript
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const userData = await fetchUserData()

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Server Component para dados estáticos */}
      <UserInfo user={userData} />
      {/* Client Component para interatividade */}
      <DashboardControls />
    </div>
  )
}

function UserInfo({ user }: { user: User }) {
  return <div>User: {user.name}</div>
}

// app/dashboard/controls.tsx (Client Component)
'use client'

export function DashboardControls() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <button onClick={() => setIsExpanded(!isExpanded)}>
      {isExpanded ? 'Collapse' : 'Expand'}
    </button>
  )
}
```

---

## Padrões de Data Fetching

### App Router: Async/Await em Server Components

#### Fetch Simples

```typescript
// app/posts/page.tsx
export default async function PostsPage() {
  const res = await fetch('https://api.example.com/posts')
  const posts: Post[] = await res.json()

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  )
}
```

#### Com Tratamento de Erros

```typescript
// app/posts/page.tsx
import { notFound } from 'next/navigation'

export default async function PostsPage() {
  try {
    const res = await fetch('https://api.example.com/posts')

    if (!res.ok) {
      throw new Error('Failed to fetch posts')
    }

    const posts: Post[] = await res.json()
    return <PostsList posts={posts} />
  } catch (error) {
    return <div>Erro ao carregar posts</div>
  }
}
```

#### Com Suspense para Loading State

```typescript
// app/posts/page.tsx
import { Suspense } from 'react'

export default function PostsPage() {
  return (
    <div>
      <h1>Posts</h1>
      <Suspense fallback={<LoadingPosts />}>
        <PostsContent />
      </Suspense>
    </div>
  )
}

async function PostsContent() {
  const posts = await fetch('https://api.example.com/posts')
    .then(r => r.json())

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

function LoadingPosts() {
  return <div>Carregando posts...</div>
}
```

### Pages Router: getServerSideProps e getStaticProps

#### getServerSideProps (SSR)

```typescript
// pages/posts.tsx
export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/posts')
  const posts = await res.json()

  // Será re-renderizado em cada request
  return {
    props: {
      posts,
    },
    revalidate: 10, // ISR: revalidar a cada 10 segundos
  }
}

export default function PostsPage({ posts }: { posts: Post[] }) {
  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
        </article>
      ))}
    </div>
  )
}
```

#### getStaticProps (SSG)

```typescript
// pages/posts/[slug].tsx
export async function getStaticProps({ params }: { params: { slug: string } }) {
  const res = await fetch(`https://api.example.com/posts/${params.slug}`)
  const post = await res.json()

  // Será gerado em build time
  return {
    props: {
      post,
    },
    revalidate: 60, // ISR: revalidar a cada 60 segundos
  }
}

export async function getStaticPaths() {
  const res = await fetch('https://api.example.com/posts')
  const posts: Post[] = await res.json()

  const paths = posts.map(post => ({
    params: { slug: post.slug },
  }))

  return {
    paths,
    fallback: 'blocking', // Gerar dinamicamente se não encontrar
  }
}

export default function PostPage({ post }: { post: Post }) {
  return <article>{post.content}</article>
}
```

### Padrão: Separar Fetching em Funções

```typescript
// lib/api.ts
export async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 } // App Router
  })

  if (!res.ok) {
    throw new Error('Failed to fetch posts')
  }

  return res.json()
}

export async function getPostBySlug(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { revalidate: 3600 }
  })

  if (!res.ok) {
    notFound()
  }

  return res.json()
}

// app/posts/page.tsx
import { getPosts } from '@/lib/api'

export default async function PostsPage() {
  const posts = await getPosts()
  return <PostsList posts={posts} />
}
```

---

## Estratégias de Caching

### Os Quatro Níveis de Cache no Next.js

```
┌─────────────────────────────────────────────┐
│ 1. Request Memoization (1 request cycle)    │
├─────────────────────────────────────────────┤
│ 2. Data Cache (durante deployments)         │
├─────────────────────────────────────────────┤
│ 3. Full Route Cache (em build time)         │
├─────────────────────────────────────────────┤
│ 4. Router Cache (no navegador)              │
└─────────────────────────────────────────────┘
```

### Request Memoization

Automaticamente deduplicada durante uma render do servidor.

```typescript
// app/dashboard/page.tsx
async function getDashboardData() {
  const res = await fetch('https://api.example.com/data')
  return res.json()
}

export default async function DashboardPage() {
  // Ambas as chamadas são memoizadas (só executa uma vez)
  const data1 = await getDashboardData()
  const data2 = await getDashboardData()

  return <div>{/* usa data1 e data2 */}</div>
}
```

### Data Cache (Revalidação)

#### Time-Based Revalidation (Stale-While-Revalidate)

```typescript
// app/posts/page.tsx

// Revalidar a cada 1 hora
fetch('https://api.example.com/posts', {
  next: { revalidate: 3600 }
})

// Nunca revalidar (cache indefinido)
fetch('https://api.example.com/posts', {
  next: { revalidate: false }
})

// Revalidar imediatamente (sem cache)
fetch('https://api.example.com/posts', {
  cache: 'no-store'
})
```

#### Tag-Based Revalidation

```typescript
// lib/api.ts
export async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] }
  })
  return res.json()
}

// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  const secret = req.headers.get('x-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Revalidar todos os dados marcados com 'posts'
  revalidateTag('posts')

  return new Response('Revalidated', { status: 200 })
}
```

#### Path-Based Revalidation

```typescript
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  const secret = req.headers.get('x-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Revalidar rota específica
  revalidatePath('/blog')

  // Revalidar dinamicamente (no App Router)
  revalidatePath('/blog/[slug]', 'page')

  return new Response('Revalidated', { status: 200 })
}
```

### Full Route Cache

Gerado em build time para rotas estáticas.

```typescript
// app/about/page.tsx
// Esta rota será completamente cacheada em build time
export default function AboutPage() {
  return <div>About Us</div>
}

// app/blog/[slug]/page.tsx
// Com dynamic = 'force-static', será gerado em build time
export const dynamic = 'force-static'

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  return <article>{post.content}</article>
}
```

### Router Cache (Client-Side)

Gerenciado automaticamente pelo Next.js, mas pode ser limpado programaticamente.

```typescript
'use client'

import { useRouter } from 'next/navigation'

export function RefreshButton() {
  const router = useRouter()

  const handleRefresh = () => {
    // Limpar o cache do router e revalidar
    router.refresh()
  }

  return <button onClick={handleRefresh}>Refresh</button>
}
```

### Combinando Caching com Rendering Dinâmico

```typescript
// app/dashboard/page.tsx
// Esta rota será renderizada dinamicamente, mas com componentes estáticos cacheados

import { Suspense } from 'react'

// Componente cacheado (Static Component)
async function StaticContent() {
  const data = await fetch('https://api.example.com/static', {
    next: { revalidate: 86400 } // Cache por 1 dia
  })
  return <div>{/* static content */}</div>
}

// Componente dinâmico (não cacheado)
async function DynamicContent() {
  const data = await fetch('https://api.example.com/dynamic', {
    cache: 'no-store' // Sem cache
  })
  return <div>{/* dynamic content */}</div>
}

export default function DashboardPage() {
  return (
    <div>
      <StaticContent />
      <Suspense fallback={<div>Loading...</div>}>
        <DynamicContent />
      </Suspense>
    </div>
  )
}
```

---

## Route Handlers

Route Handlers são a forma no App Router de criar endpoints de API.

### Exemplo Básico

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts
export async function GET(request: NextRequest) {
  const posts = await getPosts()

  return NextResponse.json(posts, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
    },
  })
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const data = await request.json()

  // Validação
  if (!data.title || !data.content) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  const post = await createPost(data)

  return NextResponse.json(post, { status: 201 })
}
```

### Com Parâmetros Dinâmicos

```typescript
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params // ⚠️ No Next.js 15+, params é uma Promise

  const post = await getPost(id)

  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(post)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const data = await request.json()

  const post = await updatePost(id, data)

  return NextResponse.json(post)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await deletePost(id)

  return new NextResponse(null, { status: 204 })
}
```

### Com CORS

```typescript
// app/api/posts/route.ts
const allowedOrigins = ['https://example.com', 'https://app.example.com']

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')

  // Verificar se origem é permitida
  const isAllowed = allowedOrigins.includes(origin || '')

  const headers = {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers })
  }

  const posts = await getPosts()
  return NextResponse.json(posts, { headers })
}
```

### Com Streaming para LLMs

```typescript
// app/api/chat/route.ts
import { StreamingTextResponse } from 'ai'

export async function POST(request: NextRequest) {
  const { message } = await request.json()

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    stream: true,
    messages: [{ role: 'user', content: message }],
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

### Com Validação (Zod)

```typescript
// app/api/posts/route.ts
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

const PostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  published: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const validatedData = PostSchema.parse(data)

    const post = await createPost(validatedData)

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Configuração de Segment

```typescript
// app/api/posts/route.ts
// Configure caching, runtime, e outras opções
export const revalidate = 60 // Revalidar data cache a cada 60s
export const dynamic = 'force-dynamic' // Sempre renderizar dinamicamente
export const runtime = 'nodejs' // ou 'edge' para edge runtime

export async function GET(request: NextRequest) {
  const posts = await getPosts()
  return NextResponse.json(posts)
}
```

---

## Middleware

Middleware é executado antes de uma requisição ser processada.

### Setup Básico

```typescript
// middleware.ts (na raiz do projeto)
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Executar lógica customizada aqui

  return NextResponse.next()
}

// Especificar quais rotas devem passar pelo middleware
export const config = {
  matcher: [
    /*
     * Match todos os paths de request exceto:
     * - _next/static (assets estáticos)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Exemplo: Autenticação

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  // Verificar se usuário está autenticado
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verificar se token é válido
  if (!isValidToken(token)) {
    const response = NextResponse.next()
    response.cookies.delete('auth-token')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
```

### Exemplo: Redirects Dinâmicos

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Redirecionar versão antiga da API para nova
  if (pathname.startsWith('/api/v1/')) {
    return NextResponse.rewrite(
      new URL(pathname.replace('/api/v1/', '/api/v2/'), request.url)
    )
  }

  // Redirecionar URLs antigas
  if (pathname === '/blog/old-post') {
    return NextResponse.redirect(new URL('/blog/new-post', request.url))
  }

  return NextResponse.next()
}
```

### Exemplo: Adicionar Headers

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Clonar headers
  const requestHeaders = new Headers(request.headers)

  // Adicionar headers customizados
  requestHeaders.set('x-request-id', crypto.randomUUID())
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  // Criar resposta com headers customizados
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Adicionar response headers
  response.headers.set('x-custom-header', 'value')

  return response
}
```

### Exemplo: Rateimit

```typescript
// lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
})

export async function checkRateLimit(token: string) {
  return await ratelimit.limit(token)
}

// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/ratelimit'

export async function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown'

  try {
    const { success } = await checkRateLimit(ip)

    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  } catch (error) {
    // Em caso de erro, permitir a requisição
    console.error('Rate limit error:', error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
```

---

## Configuração e Best Practices

### next.config.js - Configuração Recomendada

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance
  swcMinify: true,
  compress: true,

  // Imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers customizados
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // Redirects
  redirects: async () => {
    return [
      {
        source: '/old-blog/:slug',
        destination: '/blog/:slug',
        permanent: true, // HTTP 301
      },
    ]
  },

  // Rewrites
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/docs/:path*',
          destination: 'https://docs.example.com/:path*',
        },
      ],
    }
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Experimental features
  experimental: {
    // instrumentationHook: true,
  },
}

module.exports = nextConfig
```

### tsconfig.json - Melhores Práticas

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

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"],
    },
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"],
}
```

### Best Practices de Estrutura de Projeto

```
project/
├── app/                          # App Router
│   ├── (auth)/                   # Route groups
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── posts/
│   │   └── revalidate/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home
│   └── error.tsx                 # Error handling
├── components/
│   ├── ui/                       # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── shared/                   # Componentes compartilhados
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── forms/                    # Componentes de formulário
│       └── PostForm.tsx
├── lib/
│   ├── api.ts                    # Funções de API
│   ├── auth.ts                   # Lógica de autenticação
│   ├── db.ts                     # Database connection
│   └── utils.ts                  # Funções utilitárias
├── styles/
│   ├── globals.css
│   └── variables.css
├── middleware.ts                 # Middleware global
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts            # Tailwind (se usado)
└── package.json
```

### Tratamento de Erros

```typescript
// app/error.tsx - Catch erros de components
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Algo deu errado!</h2>
      <button onClick={() => reset()}>Tente novamente</button>
    </div>
  )
}

// app/not-found.tsx - Página 404
export default function NotFound() {
  return (
    <div>
      <h1>Página não encontrada</h1>
      <p>Desculpe, a página que você procura não existe.</p>
      <a href="/">Voltar para home</a>
    </div>
  )
}
```

### Otimização de Performance

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export const metadata: Metadata = {
  title: {
    template: '%s | Site Name',
    default: 'Site Name',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Preload fonts */}
        <link
          rel="preload"
          as="font"
          href="/fonts/custom.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Variáveis de Ambiente

```bash
# .env.local (nunca commit)
DATABASE_URL=postgresql://...
API_SECRET=secret_key

# .env.local (expor ao navegador)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ANALYTICS_ID=analytics_id
```

```typescript
// lib/env.ts
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
  apiSecret: process.env.API_SECRET!,
}
```

### Testing Best Practices

```typescript
// __tests__/api/posts.test.ts
import { GET, POST } from '@/app/api/posts/route'
import { NextRequest } from 'next/server'

describe('/api/posts', () => {
  describe('GET', () => {
    it('should return posts', async () => {
      const req = new NextRequest('http://localhost:3000/api/posts')
      const res = await GET(req)

      expect(res.status).toBe(200)
    })
  })

  describe('POST', () => {
    it('should create a post', async () => {
      const body = {
        title: 'Test Post',
        content: 'Test content',
      }

      const req = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const res = await POST(req)
      expect(res.status).toBe(201)
    })
  })
})
```

---

## Checklist Final de Implementação

### Ao Iniciar um Novo Projeto

- [ ] Escolher entre App Router (novo) ou Pages Router (legado)
- [ ] Configurar TypeScript com strict mode
- [ ] Adicionar ESLint e Prettier
- [ ] Configurar path aliases (`@/*`)
- [ ] Setup de variáveis de ambiente
- [ ] Configurar SEO (metadata)
- [ ] Implementar error handling
- [ ] Setup de testing (Jest + React Testing Library)
- [ ] Configurar middleware se necessário

### Performance

- [ ] Implementar Image Optimization
- [ ] Usar Suspense para loading states
- [ ] Configurar caching estratégico
- [ ] Lazy load components quando apropriado
- [ ] Monitorar Core Web Vitals
- [ ] Implementar ISR para conteúdo dinâmico

### Segurança

- [ ] Usar environment variables para secrets
- [ ] Implementar CORS se necessário
- [ ] Validar input com Zod ou similar
- [ ] Implementar rate limiting
- [ ] Usar helmet headers
- [ ] Implementar authentication/authorization
- [ ] Proteger API routes

### Deployment

- [ ] Verificar build com `npm run build`
- [ ] Testar em produção localmente
- [ ] Setup de CI/CD
- [ ] Configurar monitoring e logging
- [ ] Implementar analytics
- [ ] Planejar backup e disaster recovery

---

## Recursos Úteis

- **Documentação oficial**: https://nextjs.org/docs
- **Next.js GitHub**: https://github.com/vercel/next.js
- **Vercel Blog**: https://vercel.com/blog
- **Next.js Community**: Discord, GitHub Discussions, Reddit

---

Criado em: Novembro 16, 2025
Versão: Next.js 15
Última atualização: Novembro 2025
