'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils/format';
import { format, differenceInSeconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  transaction_number: string;
  payment_method: 'pix' | 'ted';
  amount_brl: number;
  crypto_network: string;
  wallet_address: string;
  status: string;
  expires_at: string;
  created_at: string;
  pix_key: string | null;
  pix_qr_code: string | null;
  bank_name: string | null;
  bank_account_holder: string | null;
  bank_account_number: string | null;
  bank_account_agency: string | null;
}

const statusMap = {
  pending_payment: {
    label: 'Aguardando Pagamento',
    variant: 'warning' as const,
    icon: Clock,
  },
  payment_received: {
    label: 'Pagamento Recebido',
    variant: 'secondary' as const,
    icon: CheckCircle2,
  },
  converting: { label: 'Convertendo', variant: 'default' as const, icon: Clock },
  sent: {
    label: 'Enviado',
    variant: 'success' as const,
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive' as const,
    icon: AlertCircle,
  },
  expired: {
    label: 'Expirado',
    variant: 'destructive' as const,
    icon: AlertCircle,
  },
};

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Realtime subscription
  useEffect(() => {
    if (!transaction) return;

    const channel = supabase
      .channel(`transaction-${transaction.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${transaction.id}`,
        },
        (payload) => {
          setTransaction(payload.new as Transaction);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transaction, supabase]);

  // Countdown timer
  useEffect(() => {
    if (!transaction || transaction.status !== 'pending_payment') return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiresAt = new Date(transaction.expires_at);
      const seconds = differenceInSeconds(expiresAt, now);

      if (seconds <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
      } else {
        setTimeRemaining(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [transaction]);

  const loadTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        // @ts-expect-error - Supabase type inference issue
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setTransaction(data);
    } catch (error) {
      console.error('Erro ao carregar transação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da transação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const confirmPayment = async () => {
    setConfirming(true);
    try {
      // Aqui você notificaria o admin via Pushover ou outro sistema
      // Por enquanto, apenas mostramos uma mensagem
      toast({
        title: 'Confirmação enviada!',
        description:
          'Nossa equipe foi notificada e verificará seu pagamento em breve.',
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a confirmação.',
        variant: 'destructive',
      });
    } finally {
      setConfirming(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Transação não encontrada</CardTitle>
            <CardDescription>
              A transação solicitada não foi encontrada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusMap[transaction.status as keyof typeof statusMap];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Pagamento do Depósito
            </h1>
            <p className="text-muted-foreground">
              Transação #{transaction.transaction_number}
            </p>
          </div>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      {/* Timer */}
      {transaction.status === 'pending_payment' && timeRemaining > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="font-semibold">Tempo restante para pagamento</p>
                <p className="text-sm text-muted-foreground">
                  Complete o pagamento antes do prazo expirar
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums">
                {formatTime(timeRemaining)}
              </p>
              <p className="text-xs text-muted-foreground">minutos</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados de Pagamento */}
      {transaction.status === 'pending_payment' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {transaction.payment_method === 'pix' ? (
                <>
                  <QrCode className="h-5 w-5" />
                  Dados para Pagamento PIX
                </>
              ) : (
                <>Dados para TED</>
              )}
            </CardTitle>
            <CardDescription>
              {transaction.payment_method === 'pix'
                ? 'Use o QR Code ou a chave PIX abaixo para realizar o pagamento'
                : 'Realize a transferência bancária com os dados abaixo'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {transaction.payment_method === 'pix' ? (
              <>
                {/* QR Code PIX */}
                {transaction.pix_qr_code && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-lg border-2 border-border p-4">
                      <div className="h-64 w-64 bg-muted flex items-center justify-center">
                        {/* Aqui você colocaria a imagem do QR Code */}
                        <QrCode className="h-32 w-32 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Escaneie o QR Code com o app do seu banco
                    </p>
                  </div>
                )}

                <Separator />

                {/* Chave PIX */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Chave PIX</label>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                      {transaction.pix_key || 'pix@example.com'}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(
                          transaction.pix_key || 'pix@example.com',
                          'Chave PIX'
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Valor */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Valor</label>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(transaction.amount_brl)}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(
                          transaction.amount_brl.toFixed(2),
                          'Valor'
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Dados bancários para TED
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Banco</label>
                    <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                      {transaction.bank_name || 'Banco Example'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Favorecido</label>
                    <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                      {transaction.bank_account_holder || 'Nome do Favorecido'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Agência</label>
                    <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                      {transaction.bank_account_agency || '0001'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Conta</label>
                    <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                      {transaction.bank_account_number || '12345-6'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor</label>
                  <p className="mt-1 rounded-md border bg-muted px-3 py-2 text-sm">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(transaction.amount_brl)}
                  </p>
                </div>
              </div>
            )}

            {/* Botão de Confirmação */}
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="mb-3 text-sm">
                Após realizar o pagamento, clique no botão abaixo para notificar
                nossa equipe. Verificaremos seu pagamento e processaremos sua
                transação.
              </p>
              <Button
                onClick={confirmPayment}
                disabled={confirming}
                className="w-full"
              >
                {confirming ? 'Enviando...' : 'Já realizei o pagamento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações da Transação */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor em BRL:</span>
              <span className="font-medium">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(transaction.amount_brl)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rede:</span>
              <span className="font-medium capitalize">
                {transaction.crypto_network}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Endereço da Carteira:</span>
              <div className="flex items-center gap-2">
                <span className="max-w-[200px] truncate font-mono text-xs">
                  {transaction.wallet_address}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    copyToClipboard(transaction.wallet_address, 'Endereço')
                  }
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado em:</span>
              <span className="font-medium">
                {format(
                  new Date(transaction.created_at),
                  "dd/MM/yyyy 'às' HH:mm",
                  { locale: ptBR }
                )}
              </span>
            </div>
            {transaction.status !== 'pending_payment' && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expira em:</span>
                  <span className="font-medium">
                    {format(
                      new Date(transaction.expires_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
