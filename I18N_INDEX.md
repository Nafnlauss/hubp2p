# Índice de Internacionalização - Next.js 15 com Português Brasileiro

## 📚 Documentação (Leia nesta ordem)

### Comece Aqui
1. **QUICKSTART.md** - 5 minutos
   - Instalação rápida
   - 3 formas de usar traduções
   - Hooks práticos

2. **README_I18N.md** - 10 minutos
   - Overview completo
   - Exemplos de uso
   - Comparação next-intl vs next-i18next

3. **I18N_GUIDE.md** - 30-60 minutos (Referência)
   - Guia completo (1000+ linhas)
   - Todos os tópicos em profundidade
   - Troubleshooting detalhado

### Prático
4. **EXEMPLOS_PRATICOS.md** - Consulta
   - 15 exemplos prontos para copiar
   - Cases reais de uso

5. **SETUP_CHECKLIST.md** - Implementação
   - 10 fases de setup
   - Recursos criados
   - Próximas melhorias

### Técnico
6. **I18N_FILES_SUMMARY.md** - Referência
   - Descrição de cada arquivo criado
   - 24 arquivos documentados
   - Estrutura completa

---

## 🎯 Começar por Cenário

### "Quero começar rápido"
→ Leia: **QUICKSTART.md**
→ Depois: Rode `npm install && npm run dev`
→ Acesse: http://localhost:3000/pt-BR

### "Quero entender a arquitetura"
→ Leia: **README_I18N.md** + **I18N_FILES_SUMMARY.md**
→ Explore: `/src/i18n/request.ts`, `/src/middleware.ts`
→ Entenda: Como funciona detecção e roteamento

### "Quero implementar em meu projeto"
→ Leia: **I18N_GUIDE.md** seção "Instalação e Setup Inicial"
→ Copie: Estrutura do projeto
→ Adapte: Para suas necessidades
→ Use: **SETUP_CHECKLIST.md** para validar

### "Preciso de exemplos práticos"
→ Vá para: **EXEMPLOS_PRATICOS.md**
→ Copie: Exemplo mais relevante
→ Adapte: Para seu caso
→ Teste: Imediatamente

### "Tenho um problema"
→ Procure em: **I18N_GUIDE.md** → Troubleshooting
→ Ou em: **EXEMPLOS_PRATICOS.md** → Exemplo similar
→ Ou em: **SETUP_CHECKLIST.md** → Seu cenário

---

## 📁 Arquivos do Projeto

### Configuração
```
✅ next.config.ts              Plugin next-intl
✅ src/i18n/request.ts         Config central
✅ src/middleware.ts           Roteamento
✅ .env.local                  Variáveis
✅ tsconfig.json               TypeScript
✅ package.json                Dependências
```

### Mensagens (Traduzir aqui!)
```
✅ messages/pt-BR.json         Português Brasil ⭐
✅ messages/en.json            English
✅ messages/es.json            Español
```

### Código (Use estes!)
```
✅ src/app/layout.tsx          Root provider
✅ src/app/[locale]/layout.tsx Layout localizado
✅ src/components/FormattingDemo.tsx
✅ src/components/LanguageSwitcher.tsx
✅ src/lib/i18n-utils.ts       30+ funções
✅ src/hooks/useLocaleInfo.ts
✅ src/hooks/useFormattingUtils.ts
```

---

## 🚀 Quick Commands

```bash
# Instalar
npm install

# Rodar em desenvolvimento
npm run dev

# Build production
npm run build

# Verificar tipos
npx tsc --noEmit
```

---

## 🔗 URLs de Teste

Após rodar `npm run dev`:

- **Português Brasil:** http://localhost:3000/pt-BR
- **English:** http://localhost:3000/en
- **Español:** http://localhost:3000/es
- **Auto-detecta:** http://localhost:3000

---

## 📖 Mapa Mental

```
next-intl
├── Configuração
│   ├── next.config.ts (plugin)
│   ├── src/i18n/request.ts (messages + locale detection)
│   ├── src/middleware.ts (roteamento)
│   └── messages/ (pt-BR.json, en.json, es.json)
│
├── Uso em Componentes
│   ├── Server: getTranslations() async
│   ├── Client: useTranslations() hook
│   └── Formatação: useFormatter() hook
│
├── Formatação
│   ├── Datas: format.dateTime(date, 'short')
│   ├── Números: format.number(value, {style: 'currency'})
│   ├── Percentual: format.number(value, 'percent')
│   ├── Tempo relativo: format.relativeTime(date, now)
│   └── Ranges: format.dateTimeRange(start, end)
│
├── Roteamento
│   ├── /pt-BR/page
│   ├── /en/page
│   ├── /es/page
│   └── / → auto-detecta
│
└── Utilitários
    ├── Hooks: useLocaleInfo, useFormattingUtils
    ├── Lib: 30+ funções em i18n-utils.ts
    └── Tipos: types.ts com Locale, I18nConfig
```

---

## 🎓 Exemplo Completo

### 1. Adicionar mensagem (pt-BR.json)
```json
{
  "greeting": "Olá, {name}!"
}
```

### 2. Usar em componente
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function Welcome() {
  const t = useTranslations();
  return <h1>{t('greeting', { name: 'João' })}</h1>;
}
```

### 3. Resultado
```
🇧🇷 Olá, João!
🇺🇸 Hello, John!
🇪🇸 Hola, Juan!
```

---

## 📊 Comparação com Alternativas

| Feature | next-intl | next-i18next | i18next |
|---------|-----------|-------------|---------|
| App Router | ✅ Nativo | ⚠️ Wrapper | ❌ Não |
| TypeScript | ✅ Ótimo | ⚠️ Básico | ⚠️ Básico |
| Formatação | ✅ Integrado | ⚠️ Plugin | ⚠️ Plugin |
| ICU Format | ✅ Nativo | ⚠️ Opcional | ⚠️ Opcional |
| Server Components | ✅ Perfeito | ❌ Ruim | ❌ Ruim |

**Recomendação:** next-intl para Next.js 15 com App Router

---

## ✨ Funcionalidades

### Formatação Automática
- ✅ Datas em 3 formatos (short/medium/full)
- ✅ Números com separadores corretos
- ✅ Moeda em BRL (customizável)
- ✅ Percentuais
- ✅ Tempo relativo ("há 2 horas")
- ✅ Ranges de datas

### Tradução
- ✅ Server Components (async)
- ✅ Client Components (hooks)
- ✅ ICU MessageFormat (pluralização, contexto)
- ✅ Interpolação de variáveis
- ✅ Fallbacks automáticos

### Roteamento
- ✅ Path-based (/pt-BR/, /en/)
- ✅ Detecção automática (Accept-Language)
- ✅ Middleware integrado
- ✅ Navegação localizada com `useRouter`

### Developer Experience
- ✅ TypeScript nativo
- ✅ Autocompletar em IDE
- ✅ Hooks customizados
- ✅ Utilities reutilizáveis
- ✅ Documentação extensiva

---

## 📝 Padrões de Mensagens

```json
{
  "common": "strings compartilhadas",
  "pages": {
    "home": "strings da página home"
  },
  "components": {
    "button": "strings de componentes"
  },
  "errors": "mensagens de erro",
  "formats": "templates de formatação"
}
```

---

## 🔄 Adicionar Nova Locale

1. Copie `messages/pt-BR.json` → `messages/nova.json`
2. Traduza as strings
3. Adicione `'nova'` em:
   - `src/middleware.ts` → `locales: [...]`
   - `src/i18n/request.ts` → `SUPPORTED_LOCALES`
   - `src/lib/i18n-utils.ts` → `SUPPORTED_LOCALES`
   - `src/components/LanguageSwitcher.tsx` → `LANGUAGES`

Pronto! Nova locale funciona automaticamente.

---

## 🎯 Checklist de Uso

### Antes de Usar
- [ ] Li QUICKSTART.md
- [ ] Rodei `npm install`
- [ ] Testei `npm run dev`
- [ ] Acessei /pt-BR, /en, /es

### Para Começar
- [ ] Revisei messages/pt-BR.json
- [ ] Entendi estrutura de mensagens
- [ ] Criei meu primeiro componente
- [ ] Testei mudança de idioma

### Para Expandir
- [ ] Adicionei novas mensagens
- [ ] Integrei com componentes existentes
- [ ] Testei formatação de datas/números
- [ ] Verificei roteamento por locale

### Para Produção
- [ ] Revisei todas as traduções
- [ ] Testei em diferentes idiomas
- [ ] Configurei SEO (hreflang)
- [ ] Setup de CI/CD

---

## 📚 Recursos Externos

| Recurso | Link |
|---------|------|
| next-intl Oficial | https://next-intl.dev |
| Next.js 15 | https://nextjs.org |
| ICU MessageFormat | https://unicode-org.github.io/icu/userguide/format_parse/messages/ |
| MDN Intl API | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl |

---

## 💡 Dicas Importantes

1. **Sempre use `new Date()` para datas**
   - ✅ `format.dateTime(new Date())`
   - ❌ `format.dateTime('2025-01-15')`

2. **Mensagens são carregadas por requisição**
   - Sem cache desnecessário
   - Sem overhead de bundle

3. **Server Components são melhor performance**
   - Use `getTranslations()` assíncrono quando possível
   - Client Components só quando necessário

4. **ICU Format é poderoso**
   - Pluralização automática
   - Formatação de números/datas dentro de strings

5. **Locales são fáceis de adicionar**
   - Copie um JSON, traduza, done!

---

## 🐛 Quando Algo Dá Errado

### "Mensagens não aparecem"
1. Verificar path do JSON em `request.ts`
2. Verificar import do arquivo
3. Verificar estrutura do JSON (não pode ter erros)

### "Locale não detecta corretamente"
1. Verificar middleware.ts
2. Testar com URL explícita: `/pt-BR/`
3. Limpar browser cache

### "Formatação de data está errada"
1. Verificar que é `new Date()`, não string
2. Verificar timezone em request.ts
3. Testar em diferentes browsers

### "TypeScript errors"
1. Rodar `npx tsc --noEmit`
2. Verificar tipos em types.ts
3. Limpar `.next/types/`

---

## 📈 Próximas Melhorias

- [ ] Integração com Crowdin/Tolgee
- [ ] RTL completo (árabe, hebraico)
- [ ] Code splitting por locale
- [ ] Analytics de linguagem
- [ ] Testes automatizados
- [ ] Cache inteligente

---

## 📞 Suporte Rápido

**Pergunta:** Como adiciono uma nova tradução?
**Resposta:** Edite `messages/pt-BR.json`, depois use `t('key')` no componente

**Pergunta:** Como mudo de idioma?
**Resposta:** Use `LanguageSwitcher` ou `useRouter` para `/[locale]/page`

**Pergunta:** Como formato moeda em BRL?
**Resposta:** `fmt.currency(1000)` ou `format.number(amount, 'currency')`

**Pergunta:** Como detecto a locale atual?
**Resposta:** `useLocale()` em Client Components ou `getLocale()` em Server

**Pergunta:** Como adiciono árabe?
**Resposta:** Copie pt-BR.json, traduza, adicione em arrays, middleware detecta automático

---

## ✅ Status

- **Implementação:** Completa
- **Testes:** Prontos para começar
- **Documentação:** Extensiva
- **Exemplos:** 15+ disponíveis
- **Produção:** Pronto

---

**Última atualização:** Novembro 2025
**Versão:** next-intl v3.14+, Next.js 15+
**Idioma padrão:** Português Brasileiro 🇧🇷

---

## Próximo Passo

👉 **Leia QUICKSTART.md agora!**

Depois rode:
```bash
npm install
npm run dev
```

E visite: http://localhost:3000/pt-BR
