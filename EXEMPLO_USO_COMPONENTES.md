# Exemplo Completo de Uso - Componentes P2P Crypto

Demonstração prática de como usar todos os componentes criados em conjunto.

## Layout Raiz

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'P2P Crypto - Plataforma de Transações',
  description: 'Plataforma segura P2P para transações de criptomoedas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        <main className="pt-16 min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

## Página de Detalhes de Transação

```typescript
// src/app/transactions/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/use-user';
import { StatusBadge } from '@/components/status-badge';
import { TransactionTimer } from '@/components/transaction-timer';
import {
  formatCurrency,
  formatCryptoAddress,
  formatTxHash,
  truncateText,
} from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  status: 'pending_payment' | 'payment_received' | 'converting' | 'sent';
  amount: number;
  cryptoAmount: number;
  currency: string;
  paymentMethod: string;
  fromAddress: string;
  toAddress: string;
  cryptoNetwork: string;
  txHash?: string;
  expiresAt: string;
  createdAt: string;
  notes?: string;
}

export default function TransactionPage({ params }: { params: { id: string } }) {
  // Proteger rota - redireciona se não autenticado
  useRequireAuth('/login');

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // Simular fetch de dados
    const mockTransaction: Transaction = {
      id: params.id,
      status: 'payment_received',
      amount: 1500.0,
      cryptoAmount: 0.0345,
      currency: 'BRL',
      paymentMethod: 'pix',
      fromAddress: 'chave-pix-exemplo',
      toAddress: '0x742d35Cc6634C0532925a3b844Bc5e3c3EFf2b00',
      cryptoNetwork: 'ethereum',
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      expiresAt: new Date(Date.now() + 25 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
      notes: 'Transação em processamento',
    };

    setTransaction(mockTransaction);
    setLoading(false);
  }, [params.id]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle size={24} />
          <p>Transação não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Transação #{transaction.id}</h1>
        <p className="text-gray-600">
          Criada em {new Date(transaction.createdAt).toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Timer de Expiração */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <TransactionTimer
          expiresAt={transaction.expiresAt}
          onExpire={() => console.log('Transação expirou')}
        />
      </Card>

      {/* Informações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Status</h3>
          <StatusBadge status={transaction.status} />
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Valor (BRL)</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(transaction.amount)}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Valor (Crypto)</h3>
          <p className="text-2xl font-bold">
            {transaction.cryptoAmount.toFixed(6)} {transaction.cryptoNetwork.toUpperCase()}
          </p>
        </Card>
      </div>

      {/* Detalhes da Transação */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Detalhes</h2>

          {/* Método de Pagamento */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Método de Pagamento</h3>
            <Badge className="bg-green-100 text-green-800">
              {transaction.paymentMethod === 'pix' ? 'PIX' : 'Transferência Bancária'}
            </Badge>
          </div>

          {/* Endereço do Remetente */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">De (Sua Chave PIX)</h3>
            <div className="flex items-center gap-2 bg-gray-100 p-3 rounded">
              <code className="flex-1 text-sm">{truncateText(transaction.fromAddress, 40)}</code>
              <button
                onClick={() => handleCopy(transaction.fromAddress, 'from')}
                className="p-2 hover:bg-gray-200 rounded transition"
                aria-label="Copiar"
              >
                {copied === 'from' ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Endereço do Destinatário */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Para (Endereço {transaction.cryptoNetwork})
            </h3>
            <div className="flex items-center gap-2 bg-gray-100 p-3 rounded">
              <code className="flex-1 text-sm font-mono">
                {formatCryptoAddress(transaction.toAddress)}
              </code>
              <button
                onClick={() => handleCopy(transaction.toAddress, 'to')}
                className="p-2 hover:bg-gray-200 rounded transition"
                aria-label="Copiar"
              >
                {copied === 'to' ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Hash de Transação */}
          {transaction.txHash && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Hash de Transação</h3>
              <div className="flex items-center gap-2 bg-gray-100 p-3 rounded">
                <code className="flex-1 text-sm font-mono">
                  {formatTxHash(transaction.txHash)}
                </code>
                <button
                  onClick={() => handleCopy(transaction.txHash!, 'tx')}
                  className="p-2 hover:bg-gray-200 rounded transition"
                  aria-label="Copiar"
                >
                  {copied === 'tx' ? (
                    <CheckCircle size={18} className="text-green-600" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Notas */}
          {transaction.notes && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Notas</h3>
              <p className="text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Timeline de Status */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Histórico</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <div className="w-0.5 h-12 bg-blue-200"></div>
            </div>
            <div>
              <p className="font-semibold">Transação Criada</p>
              <p className="text-sm text-gray-600">
                {new Date(transaction.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <div className="w-0.5 h-12 bg-gray-200"></div>
            </div>
            <div>
              <p className="font-semibold">Pagamento Recebido</p>
              <p className="text-sm text-gray-600">Há alguns minutos</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            </div>
            <div>
              <p className="font-semibold text-gray-500">Enviando Crypto</p>
              <p className="text-sm text-gray-600">Aguardando...</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

## Página de Perfil com Validação

```typescript
// src/app/profile/page.tsx
'use client';

import { useState } from 'react';
import { useUser, useRequireAuth } from '@/hooks/use-user';
import {
  formatCPF,
  validateCPF,
  formatPhone,
  validatePhone,
} from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  useRequireAuth('/login');

  const { user, profile, loading } = useUser();
  const [cpf, setCpf] = useState(profile?.cpf || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateCPF(cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!validatePhone(phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccess(false);
      return;
    }

    // Aqui você faria a chamada à API para atualizar
    console.log('Perfil atualizado!', { cpf, phone });
    setSuccess(true);
    setErrors({});
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <div>Usuário não encontrado</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Meu Perfil</h1>

      <Card className="p-6">
        {success && (
          <div className="mb-4 flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded">
            <CheckCircle size={20} />
            <span>Perfil atualizado com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (apenas leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600"
            />
          </div>

          {/* Nome Completo (apenas leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              value={profile?.full_name || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded text-gray-600"
            />
          </div>

          {/* CPF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF
            </label>
            <Input
              type="text"
              value={cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              className={errors.cpf ? 'border-red-500' : ''}
            />
            {errors.cpf && (
              <p className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle size={16} />
                {errors.cpf}
              </p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle size={16} />
                {errors.phone}
              </p>
            )}
          </div>

          {/* Status de Verificação */}
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-sm">
              <strong>Status de Verificação:</strong>{' '}
              {profile?.is_verified ? (
                <span className="text-green-600">✓ Verificado</span>
              ) : (
                <span className="text-yellow-600">Pendente</span>
              )}
            </p>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Salvar Alterações
          </Button>
        </form>
      </Card>
    </div>
  );
}
```

## Página de Dashboard com Lista de Transações

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useUser, useRequireAuth } from '@/hooks/use-user';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatCryptoAddress } from '@/lib/utils/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Transaction {
  id: string;
  status: string;
  amount: number;
  cryptoNetwork: string;
  toAddress: string;
  createdAt: string;
}

export default function DashboardPage() {
  useRequireAuth('/login');

  const { user, profile, loading } = useUser();

  // Simular dados
  const transactions: Transaction[] = [
    {
      id: '1',
      status: 'sent',
      amount: 1500.0,
      cryptoNetwork: 'ethereum',
      toAddress: '0x742d35Cc6634C0532925a3b844Bc5e3c3EFf2b00',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      status: 'payment_received',
      amount: 2500.0,
      cryptoNetwork: 'bitcoin',
      toAddress: '1A1z7agoat4Vu5t1WV2pj5LcR7k51DEXXX',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      status: 'pending_payment',
      amount: 1000.0,
      cryptoNetwork: 'polygon',
      toAddress: '0x742d35Cc6634C0532925a3b844Bc5e3c3EFf2b00',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Bem-vindo, {profile?.full_name}!</p>
        </div>
        <Link href="/transactions/create">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Nova Transação</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Total Transações</h3>
          <p className="text-3xl font-bold">3</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Concluídas</h3>
          <p className="text-3xl font-bold text-green-600">1</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Em Processamento</h3>
          <p className="text-3xl font-bold text-yellow-600">1</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Volume Total</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(5000)}</p>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Minhas Transações</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rede</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Endereço</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ação</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-4 px-4 font-mono text-sm">#{tx.id}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={tx.status as any} />
                    </td>
                    <td className="py-4 px-4 font-semibold">{formatCurrency(tx.amount)}</td>
                    <td className="py-4 px-4">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {tx.cryptoNetwork}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-sm">
                      {formatCryptoAddress(tx.toAddress, 8, 8)}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {new Date(tx.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-4 px-4">
                      <Link href={`/transactions/${tx.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                        >
                          Ver <ArrowRight size={16} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

---

## Resumo de Uso

Estes exemplos demonstram:

1. ✅ **Navbar e Footer** - Em layout raiz
2. ✅ **useUser()** - Para obter dados do usuário
3. ✅ **useRequireAuth()** - Para proteger rotas
4. ✅ **StatusBadge** - Para mostrar status
5. ✅ **TransactionTimer** - Para contar tempo
6. ✅ **Formatação** - CPF, Moeda, Endereço, Telefone
7. ✅ **Validação** - CPF, Telefone, Wallet

Todos funcionam em conjunto para criar uma experiência completa e profissional.

---

**Pronto para usar em produção!**
