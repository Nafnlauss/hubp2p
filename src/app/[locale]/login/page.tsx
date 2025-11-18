"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Removido: import de Server Action em Client Component (não suportado)
import { signInSchema, type SignInFormData } from "@/lib/validations/auth";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const locale = useLocale();
  const supabase = createClient();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInFormData) {
    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast({
          title: t("common.error"),
          description: error.message || "Erro ao fazer login",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: t("common.success"),
        description: "Login realizado com sucesso!",
      });

      // Determinar próximo passo baseado no perfil
      let redirectTo = "/dashboard";
      const user = authData.user;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "kyc_status, first_deposit_completed, wallet_configured, onboarding_completed"
          )
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.kyc_status !== "approved") {
            redirectTo = "/kyc";
          } else if (!profile.first_deposit_completed) {
            redirectTo = "/deposit";
          } else if (!profile.wallet_configured) {
            redirectTo = "/wallet";
          }
        }
      }

      // Redirecionar com locale prefixado
      const target = `/${locale}${redirectTo}`;
      window.location.href = target;
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Erro inesperado ao fazer login",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {t("auth.login.title")}
          </CardTitle>
          <CardDescription>{t("auth.login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.login.email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("auth.login.emailPlaceholder")}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.login.password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("auth.login.passwordPlaceholder")}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("auth.login.submit")
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link
              href={`/${locale}/register`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("auth.login.registerLink")}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
