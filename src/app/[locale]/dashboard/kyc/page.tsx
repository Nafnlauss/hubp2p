import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Shield,
  Upload,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface KYCPageProps {
  params: Promise<{ locale: string }>;
}

export default async function KYCPage({ params }: KYCPageProps) {
  const { locale } = await params;
  const t = await getTranslations();
  const supabase = await createClient();

  // Verificar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Buscar verificação KYC mais recente
  const { data: kycVerification } = await supabase
    .from("kyc_verifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case "in_review":
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <AlertTriangle className="h-8 w-8 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case "in_review":
        return <Badge className="bg-yellow-500">Em Análise</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-4 py-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Verificação de Identidade (KYC)
        </h1>
        <p className="text-muted-foreground">
          Para garantir a segurança e conformidade legal, precisamos verificar
          sua identidade.
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Status da Verificação
              </CardTitle>
              <CardDescription>
                {kycVerification
                  ? `Última atualização: ${new Date(
                      kycVerification.updated_at || ""
                    ).toLocaleDateString("pt-BR")}`
                  : "Nenhuma verificação iniciada"}
              </CardDescription>
            </div>
            {getStatusBadge(kycVerification?.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {getStatusIcon(kycVerification?.status)}
            <div className="flex-1 space-y-1">
              <p className="font-medium">
                {kycVerification?.status === "approved" &&
                  "Sua identidade foi verificada com sucesso!"}
                {kycVerification?.status === "in_review" &&
                  "Sua documentação está sendo analisada"}
                {kycVerification?.status === "rejected" &&
                  "Verificação rejeitada"}
                {!kycVerification?.status &&
                  "Você ainda não iniciou a verificação"}
              </p>
              <p className="text-sm text-muted-foreground">
                {kycVerification?.status === "approved" &&
                  `Verificado em ${new Date(
                    kycVerification.verified_at || ""
                  ).toLocaleDateString("pt-BR")}`}
                {kycVerification?.status === "in_review" &&
                  "Aguarde a análise da nossa equipe"}
                {kycVerification?.status === "rejected" &&
                  kycVerification.rejection_reason}
                {!kycVerification?.status &&
                  "Clique no botão abaixo para começar"}
              </p>
            </div>
          </div>

          {/* Dados do Perfil */}
          {profile && (
            <div className="space-y-2 rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">Informações Cadastradas:</p>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{profile.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF:</span>
                  <span className="font-medium">{profile.cpf}</span>
                </div>
                {profile.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="font-medium">{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {!kycVerification?.status && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você precisa completar a verificação KYC antes de realizar
                depósitos.
              </AlertDescription>
            </Alert>
          )}

          {kycVerification?.status === "rejected" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Sua verificação foi rejeitada.{" "}
                {kycVerification.rejection_reason && (
                  <>Motivo: {kycVerification.rejection_reason}.</>
                )}{" "}
                Entre em contato com o suporte para mais informações.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Necessários</CardTitle>
          <CardDescription>
            Para completar sua verificação, você precisará dos seguintes
            documentos:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Documento de Identidade</p>
                <p className="text-sm text-muted-foreground">
                  RG, CNH ou passaporte (frente e verso)
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Selfie com Documento</p>
                <p className="text-sm text-muted-foreground">
                  Foto sua segurando o documento ao lado do rosto
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Comprovante de Residência</p>
                <p className="text-sm text-muted-foreground">
                  Conta de luz, água ou telefone dos últimos 3 meses
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        {(!kycVerification || kycVerification.status === "rejected") && (
          process.env.NEXT_PUBLIC_PROTEO_KYC_URL ? (
            <Button size="lg" className="flex-1" asChild>
              <a
                href={process.env.NEXT_PUBLIC_PROTEO_KYC_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" /> Iniciar verificação via Proteo
              </a>
            </Button>
          ) : (
            <Button size="lg" className="flex-1" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Enviar Documentos (Em breve)
            </Button>
          )
        )}

        <Button size="lg" variant="outline" asChild>
          <Link href={`/${locale}/kyc/proteo`}>Abrir verificação embutida (iframe)</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href={`/${locale}/dashboard`}>Voltar ao Dashboard</Link>
        </Button>
      </div>

      {/* Legal Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Seus documentos são processados de forma segura e criptografada,
          conforme a Lei 9.613/1998 (Lei de Lavagem de Dinheiro) e LGPD. Seus
          dados são mantidos em sigilo e utilizados apenas para verificação de
          identidade.
        </AlertDescription>
      </Alert>
    </div>
  );
}
