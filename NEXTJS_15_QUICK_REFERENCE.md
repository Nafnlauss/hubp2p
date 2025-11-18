# Next.js 15: Quick Reference Guide

## TL;DR - Decisões Rápidas

### Devo usar App Router ou Pages Router?

```
APP ROUTER ✓ Se:           PAGES ROUTER ✓ Se:
- Novo projeto             - Projeto legado
- Precisa layouts aninhados - Estabilidade > features
- SSR com streaming        - Equipe prefere simples
- React 19+ features       - Pequeno escopo
```

### Devo usar Server ou Client Component?

```
SERVER COMPONENT ✓        CLIENT COMPONENT ✓
- Acessar banco dados     - Usar hooks (useState, etc)
- Proteger secrets        - Interagir com eventos
- Renderizar direto       - Usar browser APIs
- Default (padrão)        - Marcar com 'use client'
```

### Qual estratégia de cache?

```
TIME-BASED (revalidate)    TAG-BASED (revalidateTag)
- Simples                  - Controle fino
- Revalidar a cada X seg   - Revalidar grupos
- Bom para: dados estáveis - Bom para: dados mutáveis

USE: fetch('url', { next: { revalidate: 3600 } })
USE: revalidateTag('posts') em route handler
```

---

## Código Mínimo para Começar

### Home Page (Server Component)

```typescript
// app/page.tsx
export default async function Home() {
  const posts = await fetch('https://api.example.com/posts')
    .then(r => r.json())

  return (
    <div>
      <h1>Posts</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <Post post={post} />
        </article>
      ))}
    </div>
  )
}
```

### Componente Interativo (Client Component)

```typescript
// components/Post.tsx
'use client'

import { useState } from 'react'

export function Post({ post }) {
  const [liked, setLiked] = useState(false)

  return (
    <div>
      <p>{post.content}</p>
      <button onClick={() => setLiked(!liked)}>
        {liked ? '❤️' : '🤍'}
      </button>
    </div>
  )
}
```

### API Route

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const posts = await fetch('https://api.example.com/posts')
    .then(r => r.json())

  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  // Salvar post
  return NextResponse.json({ success: true }, { status: 201 })
}
```

### Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth')?.value

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

---

## Padrões Comuns

### Fetch com Error Handling

```typescript
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }
  })

  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default async function Page() {
  try {
    const data = await getData()
    return <div>{data}</div>
  } catch (error) {
    return <div>Error loading data</div>
  }
}
```

### Revalidação de Cache

```typescript
// Route handler que revalida
// app/api/revalidate/route.ts

import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Revalidar todos os posts
  revalidateTag('posts')

  return NextResponse.json({ revalidated: true })
}
```

### Fetch com Tags

```typescript
// Marcar fetch com tag
const res = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] }
})

// Depois revalidar
revalidateTag('posts')
```

### Dynamic Segments

```typescript
// app/posts/[slug]/page.tsx
export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params // ⚠️ params é Promise!

  const post = await fetch(`https://api.example.com/posts/${slug}`)
    .then(r => r.json())

  return <article>{post.content}</article>
}
```

### Suspense para Loading

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SlowComponent />
    </Suspense>
  )
}

async function SlowComponent() {
  await new Promise(r => setTimeout(r, 1000))
  return <div>Loaded!</div>
}

function Loading() {
  return <div>Loading...</div>
}
```

### Form com Server Action

```typescript
// app/contact/route.ts
export async function POST(request: NextRequest) {
  const data = await request.json()
  // Processar formulário
  return NextResponse.json({ success: true })
}

// components/Form.tsx
'use client'

export function ContactForm() {
  async function handleSubmit(formData: FormData) {
    const res = await fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData)),
    })
    // Processar resposta
  }

  return (
    <form onSubmit={e => {
      e.preventDefault()
      handleSubmit(new FormData(e.currentTarget))
    }}>
      <input name="name" />
      <button>Submit</button>
    </form>
  )
}
```

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev                 # Inicia servidor dev (port 3000)

# Build
npm run build              # Build para produção
npm run start              # Inicia servidor de produção

# Linting
npm run lint               # Run ESLint
npm run lint -- --fix      # Fix issues automatically

# Type checking
npm run type-check         # Verificar tipos TypeScript

# Testing
npm run test               # Run tests
npm run test:watch         # Watch mode

# Específicos do Next.js
next build --debug         # Build com verbose output
next build --experimental-analyze  # Analisar bundle size
```

---

## Environment Variables

```bash
# .env.local (desenvolvimento local)
DATABASE_URL=...
API_SECRET=...
NEXTAUTH_SECRET=...

# .env.production (produção)
DATABASE_URL=...
API_SECRET=...
NEXTAUTH_SECRET=...

# .env.example (versionar no git)
DATABASE_URL=
API_SECRET=
NEXTAUTH_SECRET=
```

Acessar no código:
```typescript
// Público (disponível no navegador)
process.env.NEXT_PUBLIC_API_URL

// Privado (apenas servidor)
process.env.DATABASE_URL
```

---

## Performance Checklist

- [ ] Usar Image component para otimizar imagens
- [ ] Lazy load componentes com dynamic imports
- [ ] Implementar Suspense para streaming
- [ ] Configurar caching apropriado
- [ ] Usar revalidation estrategicamente
- [ ] Monitorar Core Web Vitals
- [ ] Comprimir assets
- [ ] Minificar bundle
- [ ] Setup de analytics
- [ ] Testar performance com Lighthouse

---

## Segurança Checklist

- [ ] Usar environment variables para secrets
- [ ] Validar input com Zod
- [ ] CORS headers configurados
- [ ] Rate limiting implementado
- [ ] Escape HTML/XSS protection
- [ ] CSRF tokens se necessário
- [ ] Autenticação configurada
- [ ] Headers de segurança (X-Frame-Options, etc)
- [ ] HTTPS em produção
- [ ] Regular security audits

---

## Estrutura Mínima Viável

```
app/
├── page.tsx
├── api/posts/route.ts
├── posts/[slug]/page.tsx
├── layout.tsx
└── error.tsx

components/
├── Header.tsx
└── PostCard.tsx

lib/
└── api.ts

middleware.ts
next.config.js
```

---

## Documentação Oficial Links

- **Docs**: https://nextjs.org/docs
- **Guides**: https://nextjs.org/learn
- **Examples**: https://github.com/vercel/next.js/tree/canary/examples
- **Discord**: https://discord.gg/nextjs
- **GitHub Discussions**: https://github.com/vercel/next.js/discussions

---

## Troubleshooting Rápido

### "Cannot find module" error
```bash
# Verificar path aliases no tsconfig.json
# Reiniciar servidor dev
npm run dev
```

### Problemas de cache
```typescript
// Limpar cache completamente
cache: 'no-store'

// Ou usar revalidation
revalidatePath('/posts')
revalidateTag('posts')
```

### Erro de "dynamic server usage"
```typescript
// Converter para Client Component
'use client'

// Ou usar getServerSideProps (Pages Router)
```

### Build falha
```bash
# Debug detalhado
next build --debug

# Limpar cache
rm -rf .next
npm run build
```

### Tipos TypeScript
```bash
# Regenerar tipos
npm run type-check

# Limpar node_modules
rm -rf node_modules
npm install
```

---

## Resumo da Decisão: App Router + Server Components

```typescript
// ✅ PADRÃO RECOMENDADO

// 1. Server Component (padrão)
export default async function Page() {
  const data = await fetch(...)
  return <div>{data}</div>
}

// 2. Client Component quando necessário
'use client'
export function Button() {
  return <button onClick={...}>Click</button>
}

// 3. API Routes para backend
export async function POST(request: NextRequest) {
  return NextResponse.json(...)
}

// 4. Caching estratégico
fetch('url', { next: { revalidate: 3600, tags: ['posts'] } })
```

---

Criado em: Novembro 2025
Versão: Next.js 15
Última atualização: Novembro 2025
