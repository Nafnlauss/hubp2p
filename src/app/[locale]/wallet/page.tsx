"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addWallet,
  getOnboardingStatus,
  completeOnboarding,
} from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  Wallet as WalletIcon,
  ArrowRight,
  Bitcoin,
} from "lucide-react";

const walletSchema = z.object({
  currency: z.string().min(1, "Selecione uma criptomoeda"),
  address: z.string().min(10, "Endereço inválido"),
  label: z.string().optional(),
});

type WalletFormData = z.infer<typeof walletSchema>;

export default function WalletPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const locale = useLocale();

  const form = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      currency: "",
      address: "",
      label: "",
    },
  });

  useEffect(() => {
    async function checkStatus() {
      const status = await getOnboardingStatus();

      if (!status) {
        router.push(`/${locale}/login`);
        return;
      }

      // Se não completou etapas anteriores, voltar
      if (!status.kycCompleted) {
        router.push(`/${locale}/kyc`);
        return;
      }

      if (!status.depositCompleted) {
        router.push(`/${locale}/deposit`);
        return;
      }

      // Se já configurou carteira, ir para dashboard
      if (status.walletConfigured) {
        router.push(`/${locale}/dashboard`);
      }

      setIsCheckingStatus(false);
    }

    checkStatus();
  }, [router]);

  async function onSubmit(data: WalletFormData) {
    setIsLoading(true);

    try {
      const result = await addWallet({
        currency: data.currency,
        address: data.address,
        label: data.label,
        isPrimary: true,
      });

      if (result.success) {
        // Completar onboarding
        await completeOnboarding();

        toast({
          title: "Carteira Configurada!",
          description: "Sua carteira foi adicionada com sucesso.",
        });

        setTimeout(() => {
          router.push(`/${locale}/dashboard`);
        }, 1000);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao adicionar carteira",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar carteira. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  if (isCheckingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <WalletIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Configurar Carteira</CardTitle>
              <CardDescription>
                Adicione seu endereço de carteira cripto
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
                <div className="flex items-start gap-3">
                  <Bitcoin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      Configure sua primeira carteira
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Você precisará de pelo menos uma carteira configurada para
                      receber ou enviar criptomoedas. Você poderá adicionar mais
                      carteiras depois no dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Criptomoeda</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a criptomoeda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                        <SelectItem value="USDT">Tether (USDT)</SelectItem>
                        <SelectItem value="BRL">Real Digital (BRL)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Escolha a criptomoeda desta carteira
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço da Carteira</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      O endereço público da sua carteira cripto
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rótulo (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Carteira Principal, Trust Wallet, etc"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Um nome para identificar esta carteira
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border p-4 bg-muted/50">
                <h3 className="font-medium mb-2">Dica de Segurança</h3>
                <p className="text-sm text-muted-foreground">
                  Verifique sempre o endereço da carteira antes de confirmar.
                  Transações de criptomoedas são irreversíveis. Recomendamos
                  fazer um teste com um valor pequeno primeiro.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Concluir Configuração
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Após concluir, você será direcionado para o dashboard
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
