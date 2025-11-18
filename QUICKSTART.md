# Quick Start - Começar em 5 Minutos

## Instalação Rápida

```bash
# 1. Instalar dependência
npm install next-intl

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Acessar a aplicação
# http://localhost:3000
# http://localhost:3000/pt-BR
# http://localhost:3000/en
# http://localhost:3000/es
```

---

## Estrutura Essencial (já pronta)

```
project/
├── messages/
│   ├── pt-BR.json ← Mensagens em português
│   ├── en.json
│   └── es.json
├── src/
│   ├── i18n/
│   │   └── request.ts ← Configuração central
│   └── app/
│       ├── layout.tsx ← Provider setup
│       └── [locale]/
│           └── page.tsx ← Página localizada
├── next.config.ts ← Plugin setup
└── src/middleware.ts ← Roteamento
```

---

## 3 Formas de Usar Traduções

### 1. Server Component (Melhor Performance)
```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('common');
  return <h1>{t('appName')}</h1>;
}
```

### 2. Client Component
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function Card() {
  const t = useTranslations('messages');
  return <h1>{t('greeting', { name: 'João' })}</h1>;
}
```

### 3. Com Contexto/Parâmetros
```typescript
const t = useTranslations('messages');

// Simples
t('greeting', { name: 'João' })           // "Olá, João!"

// Pluralização
t('itemCount', { count: 5 })               // "Você tem 5 itens"

// Data
t('date', { date: new Date() })            // "Data: 15 de novembro de 2025"

// Moeda
t('price', { amount: 1299.99 })            // "Preço: R$ 1.299,99"
```

---

## Formatação de Números e Datas

```typescript
'use client';
import { useFormatter } from 'next-intl';

export function Example() {
  const format = useFormatter();

  // MOEDA
  format.number(1299.99, 'currency')       // "R$ 1.299,99"
  format.number(499, { style: 'currency', currency: 'BRL' })

  // PERCENTUAL
  format.number(0.25, 'percent')           // "25%"

  // NÚMERO COM SEPARADORES
  format.number(1234567.89, 'decimal')     // "1.234.567,89"

  // DATA LONGA
  format.dateTime(new Date(), 'full')      // "sábado, 15 de novembro de 2025"
  format.dateTime(new Date(), 'medium')    // "15 de nov de 2025"
  format.dateTime(new Date(), 'short')     // "15/11/2025"

  // HORA
  format.dateTime(new Date(), { hour: '2-digit', minute: '2-digit' })

  // TEMPO RELATIVO
  format.relativeTime(new Date(Date.now() - 3600000), new Date())  // "há 1 hora"

  // RANGE DE DATAS
  format.dateTimeRange(
    new Date(2025, 0, 1),
    new Date(2025, 0, 31),
    'medium'
  )  // "1º de jan a 31 de jan de 2025"
}
```

---

## Hooks Práticos

### useFormattingUtils
Agrupa todas as formatações em um único hook:

```typescript
'use client';
import { useFormattingUtils } from '@/hooks/useFormattingUtils';

export function Dashboard() {
  const fmt = useFormattingUtils();

  return (
    <div>
      <p>Receita: {fmt.currency(15000)}</p>
      <p>Margem: {fmt.percentage(0.25)}</p>
      <p>Atualizado: {fmt.timeAgo(new Date(Date.now() - 7200000))}</p>
      <p>Data: {fmt.dateLong(new Date())}</p>
    </div>
  );
}
```

### useLocaleInfo
Obter informações sobre a locale atual:

```typescript
'use client';
import { useLocaleInfo } from '@/hooks/useLocaleInfo';

export function LocaleInfo() {
  const { locale, name, flag, direction, isRTL } = useLocaleInfo();

  return (
    <div>
      <p>Locale: {locale}</p>
      <p>Nome: {name} {flag}</p>
      <p>Direção: {direction}</p>
    </div>
  );
}
```

---

## Rotas Disponíveis

```
/pt-BR/               ← Português Brasil
/pt-BR/about
/en/                  ← English
/en/about
/es/                  ← Español
/es/about

/ (raiz) → Redireciona para /pt-BR
```

---

## Adicionar Novas Traduções

### 1. Adicionar em pt-BR.json
```json
{
  "myFeature": {
    "title": "Meu Recurso"
  }
}
```

### 2. Traduzir em en.json
```json
{
  "myFeature": {
    "title": "My Feature"
  }
}
```

### 3. Usar no Componente
```typescript
const t = useTranslations('myFeature');
<h1>{t('title')}</h1>
```

---

## Mensagens com ICU Format

```json
{
  "notifications": "{count, plural, =0 {Sem mensagens} one {# mensagem} other {# mensagens}}",
  "price": "Custa {amount, number, currency}",
  "discount": "Desconto de {percent, number, percent}"
}
```

Uso:
```typescript
const t = useTranslations('namespace');

t('notifications', { count: 5 })        // "5 mensagens"
t('price', { amount: 99.90 })           // "Custa R$ 99,90"
t('discount', { percent: 0.15 })        // "Desconto de 15%"
```

---

## Comandos Úteis

```bash
npm install              # Instalar dependências
npm run dev             # Desenvolvimento
npm run build           # Build production
npm run lint            # Verificar
npx tsc --noEmit        # Verificar tipos
```

---

## URLs de Teste

- http://localhost:3000/pt-BR (Português)
- http://localhost:3000/en (English)
- http://localhost:3000/es (Español)
- http://localhost:3000 (Auto-detecta)

---

Para mais informações, consulte:
- **I18N_GUIDE.md** - Guia completo
- **EXEMPLOS_PRATICOS.md** - 15 exemplos
- **SETUP_CHECKLIST.md** - Checklist de setup
