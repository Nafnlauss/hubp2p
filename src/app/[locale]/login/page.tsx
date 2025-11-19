'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { type SignInFormData, signInSchema } from '@/lib/validations/auth'

export default function LoginPage() {
  const t = useTranslations()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const locale = useLocale()

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: SignInFormData) {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      const result = (await response.json()) as {
        success: boolean
        redirectTo?: string
        error?: string
      }

      if (!response.ok || !result.success) {
        toast({
          title: t('common.error'),
          description: result.error || 'Erro ao fazer login',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      toast({
        title: t('common.success'),
        description: 'Login realizado com sucesso!',
      })

      const redirectPath = result.redirectTo?.startsWith('/')
        ? result.redirectTo
        : `/${result.redirectTo || 'dashboard'}`
      const target = `/${locale}${redirectPath}`
      console.log('🎯 [LOGIN DEBUG] Redirecionando para:', target)

      // Desabilitar loading para permitir navegação
      setIsLoading(false)
      router.push(target)
      router.refresh()
    } catch {
      toast({
        title: t('common.error'),
        description: 'Erro inesperado ao fazer login',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {t('auth.login.title')}
          </CardTitle>
          <CardDescription>{t('auth.login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.login.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('auth.login.emailPlaceholder')}
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
                    <FormLabel>{t('auth.login.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('auth.login.passwordPlaceholder')}
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
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.login.submit')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <Link
              href={`/${locale}/register`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('auth.login.registerLink')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
