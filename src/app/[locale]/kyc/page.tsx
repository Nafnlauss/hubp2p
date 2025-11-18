"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { completeKYC, getOnboardingStatus } from "@/app/actions/onboarding";
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
import { Loader2, CheckCircle2, FileText, Upload, ExternalLink } from "lucide-react";

export default function KYCPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    async function checkStatus() {
      const status = await getOnboardingStatus();

      if (!status) {
        router.push(`/${locale}/login`);
        return;
      }

      // Se já completou KYC, redirecionar para próximo passo
      if (status.kycCompleted) {
        router.push(`/${locale}${status.nextStep.startsWith('/') ? '' : '/'}${status.nextStep.replace(/^\/(pt-BR|en|es)/, '')}`);
      }

      setIsCheckingStatus(false);
    }

    checkStatus();
  }, [router]);

  async function handleCompleteKYC() {
    setIsLoading(true);

    try {
      const result = await completeKYC();

      if (result.success) {
        toast({
          title: "KYC Aprovado!",
          description: "Sua verificação foi concluída com sucesso.",
        });

        // Aguardar um pouco para mostrar o toast antes de redirecionar
        setTimeout(() => {
          router.push(`/${locale}/deposit`);
        }, 1000);
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao completar KYC",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({
        title: "Erro",
        description: "Erro ao completar KYC. Tente novamente.",
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
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Verificação de Identidade (KYC)</CardTitle>
              <CardDescription>
                Complete sua verificação para continuar
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Upload className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-medium">Documentos Necessários</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Documento de identidade (RG ou CNH)</li>
                  <li>• Comprovante de residência (máx. 3 meses)</li>
                  <li>• Selfie segurando o documento</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4 bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-medium">Processo Simplificado (MVP)</h3>
                <p className="text-sm text-muted-foreground">
                  Por enquanto, basta clicar em "Completar Verificação" para
                  continuar. O upload real de documentos será implementado em
                  breve.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Por que precisamos de KYC?
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              A verificação de identidade (Know Your Customer) é exigida por lei
              para prevenir fraudes, lavagem de dinheiro e garantir a segurança
              de todos os usuários da plataforma.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {process.env.NEXT_PUBLIC_PROTEO_KYC_URL ? (
            <Button asChild size="lg" className="w-full" variant="secondary">
              <a
                href={process.env.NEXT_PUBLIC_PROTEO_KYC_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Iniciar verificação via Proteo
              </a>
            </Button>
          ) : null}

          <Button asChild variant="outline" className="w-full" size="lg">
            <a href={`/${locale}/kyc/proteo`}>Iniciar verificação embutida (iframe)</a>
          </Button>

          <Button
            onClick={handleCompleteKYC}
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
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Completar Verificação
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao continuar, você concorda com nossos termos de serviço e política
            de privacidade
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
