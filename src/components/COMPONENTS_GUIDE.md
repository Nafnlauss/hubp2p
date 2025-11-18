# Guia de Componentes Compartilhados

Documentação completa dos componentes reutilizáveis criados para a plataforma P2P Crypto.

## Índice

1. [Navbar](#navbar)
2. [Footer](#footer)
3. [Status Badge](#status-badge)
4. [Transaction Timer](#transaction-timer)
5. [Utilitários de Formatação](#utilitários-de-formatação)
6. [Hooks](#hooks)

---

## Navbar

Componente de navegação responsivo com suporte a autenticação.

### Importação

```typescript
import { Navbar } from '@/components/navbar';
```

### Uso

```typescript
'use client';

import { Navbar } from '@/components/navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
    </>
  );
}
```

### Features

- ✅ Logo "P2P Crypto" com ícone Bitcoin
- ✅ Menu responsivo (desktop e mobile)
- ✅ Menu dinâmico baseado em autenticação
- ✅ Suporte a dark mode
- ✅ Animações suaves

### Rotas esperadas

- `/` - Home
- `/how-it-works` - Como Funciona
- `/login` - Login
- `/register` - Registrar
- `/dashboard` - Dashboard (autenticado)
- `/profile` - Perfil (autenticado)

---

## Footer

Rodapé com informações de conformidade e links rápidos.

### Importação

```typescript
import { Footer } from '@/components/footer';
```

### Uso

```typescript
import { Footer } from '@/components/footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

### Features

- ✅ Links: Termos, Privacidade, Conformidade
- ✅ Informações de conformidade (Lei 9.613/1998, LGPD)
- ✅ Links de redes sociais
- ✅ Aviso de risco de investimento
- ✅ Design responsivo

---

## Status Badge

Componente para exibir o status de uma transação com cores significativas.

### Importação

```typescript
import { StatusBadge, TransactionStatus } from '@/components/status-badge';
```

### Uso

```typescript
import { StatusBadge } from '@/components/status-badge';

export function TransactionCard() {
  return (
    <div>
      <h2>Transação #12345</h2>
      <StatusBadge status="payment_received" />
    </div>
  );
}
```

### Statuses Disponíveis

| Status | Cor | Descrição |
|--------|-----|-----------|
| `pending_payment` | Amarelo | Aguardando pagamento |
| `payment_received` | Azul | Pagamento recebido |
| `converting` | Roxo | Convertendo moeda |
| `sent` | Verde | Enviado |
| `cancelled` | Vermelho | Cancelado |
| `expired` | Vermelho | Expirado |

### Props

```typescript
interface StatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}
```

### Exemplo Completo

```typescript
import { StatusBadge } from '@/components/status-badge';

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <ul>
      {transactions.map((tx) => (
        <li key={tx.id} className="p-4 border rounded">
          <h3>{tx.id}</h3>
          <StatusBadge status={tx.status as TransactionStatus} />
          <p>Valor: R$ {tx.amount}</p>
        </li>
      ))}
    </ul>
  );
}
```

---

## Transaction Timer

Contador regressivo para transações com alerta de expiração.

### Importação

```typescript
import { TransactionTimer } from '@/components/transaction-timer';
```

### Uso

```typescript
import { TransactionTimer } from '@/components/transaction-timer';

export function TransactionDetail() {
  const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minutos

  return (
    <div>
      <h2>Detalhes da Transação</h2>
      <TransactionTimer expiresAt={expiresAt} />
    </div>
  );
}
```

### Props

```typescript
interface TransactionTimerProps {
  expiresAt: Date | string;
  onExpire?: () => void;
  className?: string;
}
```

### Features

- ✅ Formato MM:SS
- ✅ Atualização a cada segundo
- ✅ Alerta quando faltam menos de 5 minutos
- ✅ Callback ao expirar
- ✅ Animação de pulsação no alerta

### Exemplo com Callback

```typescript
import { TransactionTimer } from '@/components/transaction-timer';

export function TransactionDetail() {
  const expiresAt = new Date(Date.now() + 15 * 60000);

  const handleExpire = () => {
    console.log('Transação expirou!');
    // Redirecionar ou atualizar estado
  };

  return (
    <TransactionTimer
      expiresAt={expiresAt}
      onExpire={handleExpire}
    />
  );
}
```

---

## Utilitários de Formatação

### Importação

```typescript
import {
  formatCPF,
  validateCPF,
  formatCurrency,
  formatCryptoAddress,
  validateWalletAddress,
  formatPhone,
  validatePhone,
  truncateText,
  formatTxHash,
} from '@/lib/utils/format';
```

### formatCPF

Formata um CPF para o padrão XXX.XXX.XXX-XX

```typescript
const cpf = formatCPF('12345678901');
// Retorna: '123.456.789-01'
```

### validateCPF

Valida um CPF usando o algoritmo correto

```typescript
const isValid = validateCPF('123.456.789-09');
// Retorna: true ou false
```

### formatCurrency

Formata um número para moeda brasileira (BRL)

```typescript
const valor = formatCurrency(1500.5);
// Retorna: 'R$ 1.500,50'

const valorUS = formatCurrency(1500.5, 'en-US');
// Retorna: '$1,500.50'
```

### formatCryptoAddress

Trunca um endereço de carteira no meio

```typescript
const address = '0x742d35Cc6634C0532925a3b844Bc5e3c3EFf2b00';
const formatted = formatCryptoAddress(address);
// Retorna: '0x742d35Cc6...Ff2b00'

// Customizar comprimento
const custom = formatCryptoAddress(address, 15, 15);
// Retorna: '0x742d35Cc6634C0...c3EFf2b00'
```

### validateWalletAddress

Valida um endereço de carteira conforme a rede

```typescript
const isValid = validateWalletAddress(
  '0x742d35Cc6634C0532925a3b844Bc5e3c3EFf2b00',
  'ethereum'
);
// Retorna: true

// Redes suportadas:
// - ethereum, arbitrum, polygon, optimism (EVM)
// - bitcoin
// - solana
// - cardano
// - polkadot
```

### formatPhone

Formata um telefone brasileiro

```typescript
const phone = formatPhone('11987654321');
// Retorna: '(11) 98765-4321'
```

### validatePhone

Valida um telefone brasileiro

```typescript
const isValid = validatePhone('(11) 98765-4321');
// Retorna: true
```

### truncateText

Trunca um texto com reticências

```typescript
const text = truncateText('Este é um texto muito longo', 20);
// Retorna: 'Este é um texto muit...'
```

### formatTxHash

Formata um hash de transação (atalho para formatCryptoAddress)

```typescript
const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const formatted = formatTxHash(hash);
// Retorna: '0x12345678...cdef'
```

---

## Hooks

### useUser

Hook para obter o usuário autenticado e seu perfil.

#### Importação

```typescript
import { useUser } from '@/hooks/use-user';
```

#### Uso

```typescript
'use client';

import { useUser } from '@/hooks/use-user';

export function UserProfile() {
  const { user, profile, loading, error, isAdmin, isVerified, refetch } = useUser();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro: {error.message}</div>;
  }

  if (!user) {
    return <div>Usuário não autenticado</div>;
  }

  return (
    <div>
      <h1>{profile?.full_name}</h1>
      <p>Email: {user.email}</p>
      <p>Verificado: {isVerified ? 'Sim' : 'Não'}</p>
      {isAdmin && <p>Admin: Sim</p>}
      <button onClick={refetch}>Atualizar</button>
    </div>
  );
}
```

#### Retorno

```typescript
interface UseUserReturn {
  user: User | null;              // Usuário autenticado (Supabase)
  profile: UserProfile | null;    // Perfil completo do usuário
  loading: boolean;               // Estado de carregamento
  error: Error | null;            // Erro (se houver)
  isAdmin: boolean;               // Se é administrador
  isVerified: boolean;            // Se é verificado
  refetch: () => Promise<void>;   // Função para recarregar dados
}
```

### useIsAdmin

Hook para verificar se o usuário é administrador.

#### Uso

```typescript
'use client';

import { useIsAdmin } from '@/hooks/use-user';

export function AdminPanel() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return <div>Acesso negado</div>;
  }

  return <div>Painel de Administração</div>;
}
```

### useRequireAuth

Hook para proteger rotas que requerem autenticação.

#### Uso

```typescript
'use client';

import { useRequireAuth } from '@/hooks/use-user';

export function ProtectedPage() {
  const isAuthenticated = useRequireAuth('/login');

  if (!isAuthenticated) {
    return null; // Redirecionando...
  }

  return <div>Conteúdo protegido</div>;
}
```

### useRequireAdmin

Hook para proteger rotas que requerem acesso de administrador.

#### Uso

```typescript
'use client';

import { useRequireAdmin } from '@/hooks/use-user';

export function AdminPage() {
  const isAdmin = useRequireAdmin('/');

  if (!isAdmin) {
    return null; // Redirecionando...
  }

  return <div>Painel de Administração</div>;
}
```

---

## Exemplos de Integração Completa

### Exemplo 1: Página de Transação

```typescript
'use client';

import { useUser } from '@/hooks/use-user';
import { StatusBadge } from '@/components/status-badge';
import { TransactionTimer } from '@/components/transaction-timer';
import { formatCurrency, formatCryptoAddress } from '@/lib/utils/format';

interface Transaction {
  id: string;
  status: string;
  amount: number;
  fromAddress: string;
  toAddress: string;
  expiresAt: string;
}

export function TransactionPage({ transaction }: { transaction: Transaction }) {
  const { user } = useUser();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1>Detalhes da Transação</h1>

      <div className="mt-6 space-y-4">
        <div>
          <h3>ID</h3>
          <p className="font-mono">{transaction.id}</p>
        </div>

        <div>
          <h3>Status</h3>
          <StatusBadge status={transaction.status as any} />
        </div>

        <div>
          <h3>Valor</h3>
          <p className="text-2xl font-bold">{formatCurrency(transaction.amount)}</p>
        </div>

        <div>
          <h3>De:</h3>
          <p className="font-mono">{formatCryptoAddress(transaction.fromAddress)}</p>
        </div>

        <div>
          <h3>Para:</h3>
          <p className="font-mono">{formatCryptoAddress(transaction.toAddress)}</p>
        </div>

        <div>
          <TransactionTimer expiresAt={transaction.expiresAt} />
        </div>
      </div>
    </div>
  );
}
```

### Exemplo 2: Componente de Formulário com Validação

```typescript
'use client';

import { useState } from 'react';
import {
  formatCPF,
  validateCPF,
  validateWalletAddress,
  formatPhone,
  validatePhone,
} from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function UserForm() {
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [wallet, setWallet] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateCPF(cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!validatePhone(phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (!validateWalletAddress(wallet, 'ethereum')) {
      newErrors.wallet = 'Endereço de carteira inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Enviar formulário
    console.log('Formulário válido!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="cpf">CPF</label>
        <Input
          id="cpf"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          placeholder="000.000.000-00"
        />
        {errors.cpf && <p className="text-red-500 text-sm">{errors.cpf}</p>}
      </div>

      <div>
        <label htmlFor="phone">Telefone</label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(00) 00000-0000"
        />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="wallet">Carteira Ethereum</label>
        <Input
          id="wallet"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="0x..."
        />
        {errors.wallet && <p className="text-red-500 text-sm">{errors.wallet}</p>}
      </div>

      <Button type="submit">Enviar</Button>
    </form>
  );
}
```

---

## Estrutura de Arquivo esperada no Banco

Para que o hook `useUser` funcione corretamente, você precisa de uma tabela `user_profiles`:

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR NOT NULL UNIQUE,
  full_name VARCHAR NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  phone VARCHAR(11) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Checklist de Implementação

- [ ] Importar e usar `Navbar` no layout raiz
- [ ] Importar e usar `Footer` no layout raiz
- [ ] Criar tabela `user_profiles` no Supabase
- [ ] Usar `useUser` em páginas que precisam de dados do usuário
- [ ] Usar `StatusBadge` em listas de transações
- [ ] Usar `TransactionTimer` em páginas de detalhe de transação
- [ ] Usar funções de formatação em formulários
- [ ] Usar funções de validação em handlers de formulário
- [ ] Proteger rotas com `useRequireAuth` e `useRequireAdmin`

---

## Troubleshooting

### Navbar não aparece

- Verifique se está usando `'use client'` no layout raiz
- Certifique-se de ter padding-top no main: `pt-16`

### useUser retorna null

- Verifique se o usuário está autenticado
- Verifique se a tabela `user_profiles` existe
- Verifique as RLS policies do Supabase

### TransactionTimer não atualiza

- Verifique se está usando `'use client'`
- Certifique-se de passar um `Date` ou string ISO válida para `expiresAt`

### Validações não funcionam

- Verifique se está importando do caminho correto: `@/lib/utils/format`
- Alguns formatos de CPF/Telefone podem ser inválidos de propósito para testes
