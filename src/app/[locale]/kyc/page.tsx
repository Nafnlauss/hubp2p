"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { getOnboardingStatus } from "@/app/actions/onboarding";
import { Loader2 } from "lucide-react";

export default function KYCPage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    async function checkAndRedirect() {
      const status = await getOnboardingStatus();

      if (!status) {
        router.push(`/${locale}/login`);
        return;
      }

      // Se já completou KYC, redirecionar para próximo passo
      if (status.kycCompleted) {
        router.push(`/${locale}${status.nextStep.startsWith('/') ? '' : '/'}${status.nextStep.replace(/^\/(pt-BR|en|es)/, '')}`);
        return;
      }

      // Redirecionar para página com iframe do Proteo
      router.push(`/${locale}/kyc/proteo`);
    }

    checkAndRedirect();
  }, [router, locale]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Redirecionando para verificação KYC...</p>
      </div>
    </div>
  );
}
