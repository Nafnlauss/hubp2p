"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  completeFirstDeposit,
  getOnboardingStatus,
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
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CheckCircle2,
  Wallet,
  Copy,
  QrCode,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DepositPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const locale = useLocale();

  // Exemplo de chave PIX (em produção viria do backend)
  const pixKey = "pix@plataformap2p.com.br";

  useEffect(() => {
    async function checkStatus() {
      const status = await getOnboardingStatus();

      if (!status) {
        router.push(`/${locale}/login`);
        return;
      }

      // Se não completou KYC ainda, voltar
      if (!status.kycCompleted) {
        router.push(`/${locale}/kyc`);
        return;
      }

      // Se já completou depósito, ir para próximo passo
      if (status.depositCompleted) {
        router.push(`/${locale}${status.nextStep.startsWith('/') ? '' : '/'}${status.nextStep.replace(/^\/(pt-BR|en|es)/, '')}`);
      }

      setIsCheckingStatus(false);
    }

    checkStatus();
  }, [router]);

  function copyPixKey() {
    navigator.clipboard.writeText(pixKey);
    toast({
      title: "Copiado!",
      description: "Chave PIX copiada para área de transferência",
    });
  }

  async function handleConfirmDeposit() {
    setIsLoading(true);

    try {
      const result = await completeFirstDeposit();

      if (result.success) {
        toast({
          title: "Depósito Confirmado!",
          description: "Seu primeiro depósito foi registrado com sucesso.",
        });

        setTimeout(() => {
          router.push(`/${locale}/wallet`);
        }, 1000);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao confirmar depósito",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar depósito. Tente novamente.",
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
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Primeiro Depósito</CardTitle>
              <CardDescription>
                Adicione saldo à sua conta para começar a operar
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>MVP - Versão Simplificada:</strong> Por enquanto, apenas
              confirme que fez o depósito clicando no botão abaixo. O sistema
              de depósito real será implementado em breve.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Depósito via PIX</h3>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Chave PIX para depósito:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-sm">
                    {pixKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyPixKey}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded bg-muted/50 p-3 space-y-2">
                <h4 className="text-sm font-medium">Instruções:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Copie a chave PIX acima</li>
                  <li>Abra o app do seu banco</li>
                  <li>Selecione PIX → Pagar</li>
                  <li>Cole a chave e informe o valor</li>
                  <li>Confirme a transferência</li>
                  <li>Volte aqui e clique em "Confirmar Depósito"</li>
                </ol>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Depósito Mínimo
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                O valor mínimo para primeiro depósito é R$ 50,00. O saldo ficará
                disponível em até 5 minutos após a confirmação do PIX.
              </p>
              <div className="flex items-center gap-2 text-lg font-bold text-blue-900 dark:text-blue-100">
                <span>R$ 50,00</span>
                <span className="text-sm font-normal text-blue-700 dark:text-blue-300">
                  mínimo
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={handleConfirmDeposit}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Confirmar Depósito
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Após a confirmação, você poderá configurar suas carteiras cripto
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
