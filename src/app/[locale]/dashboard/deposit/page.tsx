'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

const depositSchema = z.object({
  payment_method: z.enum(['pix', 'ted']),
  amount_brl: z.coerce
    .number()
    .min(100, 'Valor mínimo é R$ 100,00')
    .max(50000, 'Valor máximo é R$ 50.000,00'),
  crypto_network: z.enum(['bitcoin', 'ethereum', 'polygon', 'bsc', 'solana']),
  wallet_address: z
    .string()
    .min(26, 'Endereço de carteira inválido')
    .max(100, 'Endereço de carteira inválido'),
});

type DepositFormValues = z.infer<typeof depositSchema>;

const paymentMethods = [
  {
    id: 'pix',
    name: 'PIX',
    min: 100,
    max: 50000,
    time: 'Instantâneo',
    description: 'Transferência instantânea disponível 24/7',
  },
  {
    id: 'ted',
    name: 'TED',
    min: 100,
    max: 50000,
    time: '1-2 dias úteis',
    description: 'Transferência bancária tradicional',
  },
] as const;

const cryptoNetworks = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    description: 'Rede Bitcoin (BTC)',
    addressExample: 'bc1q...',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    description: 'Rede Ethereum (ETH)',
    addressExample: '0x...',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    description: 'Rede Polygon (MATIC)',
    addressExample: '0x...',
  },
  {
    id: 'bsc',
    name: 'Binance Smart Chain',
    symbol: 'BSC',
    description: 'Binance Smart Chain (BNB)',
    addressExample: '0x...',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    description: 'Rede Solana (SOL)',
    addressExample: 'So...',
  },
] as const;

export default function NewDepositPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      payment_method: 'pix',
      amount_brl: 100,
      crypto_network: 'bitcoin',
      wallet_address: '',
    },
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const selectedPaymentMethod = paymentMethods.find(
    (m) => m.id === form.watch('payment_method')
  );

  const selectedNetwork = cryptoNetworks.find(
    (n) => n.id === form.watch('crypto_network')
  );

  const onSubmit = async (data: DepositFormValues) => {
    setIsSubmitting(true);
    try {
      // Buscar usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado.',
          variant: 'destructive',
        });
        return;
      }

      // Gerar número da transação (será gerado pela função do banco)
      const { data: transactionNumber } = await supabase.rpc(
        'generate_transaction_number'
      );

      // Calcular data de expiração (40 minutos)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 40);

      // Criar transação
      const { data: transaction, error } = await supabase
        .from('transactions')
        // @ts-expect-error - Supabase type inference issue
        .insert({
          user_id: user.id,
          transaction_number: transactionNumber || `TXN-${Date.now()}`,
          payment_method: data.payment_method,
          amount_brl: data.amount_brl,
          crypto_network: data.crypto_network,
          wallet_address: data.wallet_address,
          expires_at: expiresAt.toISOString(),
          status: 'pending_payment',
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar transação:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível criar a transação. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Transação criada!',
        description: 'Você será redirecionado para a página de pagamento.',
      });

      // Redirecionar para página de pagamento
      router.push(`/dashboard/deposit/${(transaction as any).id}`);
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof DepositFormValues)[] = [];

    if (step === 1) {
      fieldsToValidate = ['payment_method'];
    } else if (step === 2) {
      fieldsToValidate = ['amount_brl'];
    } else if (step === 3) {
      fieldsToValidate = ['crypto_network'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Novo Depósito</h1>
        <p className="text-muted-foreground">
          Complete as etapas abaixo para criar seu depósito
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Etapa {step} de {totalSteps}</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Método de Pagamento */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Escolha o Método de Pagamento</CardTitle>
                <CardDescription>
                  Selecione como deseja realizar o depósito
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid gap-4 md:grid-cols-2">
                          {paymentMethods.map((method) => (
                            <div
                              key={method.id}
                              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                field.value === method.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => field.onChange(method.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold">{method.name}</h3>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {method.description}
                                  </p>
                                </div>
                                {field.value === method.id && (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4" />
                                  <span>{method.time}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="outline">
                                    Mín: R$ {method.min.toLocaleString('pt-BR')}
                                  </Badge>
                                  <Badge variant="outline">
                                    Máx: R$ {method.max.toLocaleString('pt-BR')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Valor */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Informe o Valor</CardTitle>
                <CardDescription>
                  Digite o valor que deseja depositar em BRL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="amount_brl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor em Reais (BRL)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            R$
                          </span>
                          <Input
                            type="number"
                            placeholder="0,00"
                            className="pl-10 text-lg"
                            step="0.01"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Valor mínimo: R$ {selectedPaymentMethod?.min.toLocaleString('pt-BR')} | Valor máximo: R$ {selectedPaymentMethod?.max.toLocaleString('pt-BR')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Rede de Criptomoeda */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Escolha a Rede</CardTitle>
                <CardDescription>
                  Selecione a rede blockchain para receber suas criptomoedas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="crypto_network"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="grid gap-3">
                          {cryptoNetworks.map((network) => (
                            <div
                              key={network.id}
                              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                                field.value === network.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => field.onChange(network.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{network.name}</h3>
                                    <Badge variant="secondary">{network.symbol}</Badge>
                                  </div>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {network.description}
                                  </p>
                                </div>
                                {field.value === network.id && (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Endereço da Carteira */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Endereço da Carteira</CardTitle>
                <CardDescription>
                  Insira o endereço da sua carteira {selectedNetwork?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="wallet_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço da Carteira</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={selectedNetwork?.addressExample}
                          className="font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Verifique cuidadosamente o endereço. Transações para endereços incorretos não podem ser revertidas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resumo */}
                <div className="mt-6 space-y-3 rounded-lg border bg-muted/50 p-4">
                  <h4 className="font-semibold">Resumo do Depósito</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-medium">
                        {selectedPaymentMethod?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-medium">
                        R$ {form.watch('amount_brl').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rede:</span>
                      <span className="font-medium">{selectedNetwork?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tempo:</span>
                      <span className="font-medium">
                        {selectedPaymentMethod?.time}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            {step < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Depósito'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
