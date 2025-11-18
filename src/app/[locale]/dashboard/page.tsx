import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

const statusMap = {
  pending_payment: { label: 'Aguardando Pagamento', variant: 'warning' as const },
  payment_received: { label: 'Pagamento Recebido', variant: 'info' as const },
  converting: { label: 'Convertendo', variant: 'info' as const },
  sent: { label: 'Enviado', variant: 'success' as const },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const },
  expired: { label: 'Expirado', variant: 'destructive' as const },
};

const networkMap = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  bsc: 'BSC',
  solana: 'Solana',
};

async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Buscar estatísticas
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const totalDeposited =
    transactions
      ?.filter((t: any) => t.status === 'sent')
      .reduce((sum: number, t: any) => sum + t.amount_brl, 0) || 0;

  const pendingCount =
    transactions?.filter(
      (t: any) =>
        t.status === 'pending_payment' ||
        t.status === 'payment_received' ||
        t.status === 'converting'
    ).length || 0;

  const completedCount =
    transactions?.filter((t) => t.status === 'sent').length || 0;

  // Últimas 5 transações
  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta! Aqui está um resumo das suas transações.
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/deposit`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Depósito
          </Link>
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Depositado
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalDeposited, 'pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Total em transações concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transações Pendentes
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Em processamento ou aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transações Concluídas
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Criptomoedas enviadas com sucesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Suas últimas 5 transações na plataforma
              </CardDescription>
            </div>
            <Button variant="ghost" asChild>
              <Link href={`/${locale}/dashboard/transactions`}>
                Ver todas
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Você ainda não possui transações.
              </p>
              <Button asChild>
                <Link href={`/${locale}/dashboard/deposit`}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar Primeiro Depósito
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Rede</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-xs">
                      {transaction.transaction_number}
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(transaction.created_at!),
                        "dd/MM/yyyy 'às' HH:mm",
                        { locale: ptBR }
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount_brl, 'pt-BR')}
                    </TableCell>
                    <TableCell>
                      {networkMap[transaction.crypto_network]}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[transaction.status].variant}>
                        {statusMap[transaction.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.status === 'pending_payment' ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/${locale}/dashboard/deposit/${transaction.id}`}
                          >
                            Ver Detalhes
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/${locale}/dashboard/transactions?id=${transaction.id}`}
                          >
                            Ver
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
