import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Shield,
  Zap,
  Clock,
  Building2,
  Wallet,
  Bitcoin,
} from "lucide-react";

interface LocalePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LandingPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t("landing.hero.title")}
          </h1>
          <p className="mb-2 text-xl text-muted-foreground sm:text-2xl">
            {t("landing.hero.subtitle")}
          </p>
          <p className="mb-8 text-base text-muted-foreground sm:text-lg">
            {t("landing.hero.description")}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="text-base sm:text-lg">
              <Link href={`/${locale}/register`}>
                {t("landing.hero.ctaRegister")}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base sm:text-lg"
            >
              <Link href={`/${locale}/login`}>
                {t("landing.hero.ctaLogin")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
            {t("landing.howItWorks.title")}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle>{t("landing.howItWorks.step1.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t("landing.howItWorks.step1.description")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet className="h-6 w-6" />
                </div>
                <CardTitle>{t("landing.howItWorks.step2.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t("landing.howItWorks.step2.description")}
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bitcoin className="h-6 w-6" />
                </div>
                <CardTitle>{t("landing.howItWorks.step3.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {t("landing.howItWorks.step3.description")}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* KYC Obrigatório */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Shield className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl">
                  {t("landing.kyc.title")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("landing.kyc.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle2 className="mb-2 h-8 w-8 text-primary" />
                    <p className="font-medium">
                      {t("landing.kyc.features.secure")}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Zap className="mb-2 h-8 w-8 text-primary" />
                    <p className="font-medium">
                      {t("landing.kyc.features.fast")}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle2 className="mb-2 h-8 w-8 text-primary" />
                    <p className="font-medium">
                      {t("landing.kyc.features.compliant")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Métodos de Pagamento */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
            {t("landing.paymentMethods.title")}
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">
                  {t("landing.paymentMethods.pix.title")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("landing.paymentMethods.pix.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Instantâneo - 24/7</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">
                  {t("landing.paymentMethods.ted.title")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("landing.paymentMethods.ted.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Dias úteis</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Redes Suportadas */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
            {t("landing.networks.title")}
          </h2>
          <p className="mb-12 text-center text-muted-foreground">
            {t("landing.networks.description")}
          </p>
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {["bitcoin", "ethereum", "polygon", "bsc", "solana"].map(
              (network) => (
                <Card key={network} className="text-center">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Bitcoin className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium">
                      {t(`landing.networks.${network}`)}
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Pronto para começar?
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/90">
            Crie sua conta agora e comece a negociar criptomoedas com segurança
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg">
            <Link href={`/${locale}/register`}>
              {t("landing.hero.ctaRegister")}
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; 2024 {t("common.appName")}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
