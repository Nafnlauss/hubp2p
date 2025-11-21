'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
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
import { createClient } from '@/lib/supabase/client'
import { type SignInFormData, signInSchema } from '@/lib/validations/auth'

export default function LoginPage() {
  const t = useTranslations()
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
      console.log('🔵 [LOGIN] Iniciando login client-side...')

      const supabase = createClient()

      // Fazer login diretamente no client-side
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        console.error('❌ [LOGIN] Erro no login:', error.message)
        toast({
          title: t('common.error'),
          description: error.message || 'Erro ao fazer login',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      if (!authData.session) {
        console.error('❌ [LOGIN] Sessão não criada')
        toast({
          title: t('common.error'),
          description: 'Erro ao criar sessão',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      console.log('✅ [LOGIN] Login bem-sucedido:', authData.user?.email)

      toast({
        title: t('common.success'),
        description: 'Login realizado com sucesso!',
      })

      // Redirecionar para /dashboard - o middleware vai cuidar do resto
      const target = `/${locale}/dashboard`
      console.log('🎯 [LOGIN] Redirecionando para:', target)

      // Usar window.location.href para garantir que o browser recarregue e reconheça os cookies
      window.location.href = target
    } catch (error) {
      console.error('❌ [LOGIN] Erro inesperado:', error)
      toast({
        title: t('common.error'),
        description: 'Erro inesperado ao fazer login',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-16">
      <div className="container mx-auto flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-3xl font-bold">
              {t('auth.login.title')}
            </CardTitle>
            <CardDescription className="text-blue-100">
              {t('auth.login.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        {t('auth.login.email')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('auth.login.emailPlaceholder')}
                          className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
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
                      <FormLabel className="text-sm font-medium text-gray-700">
                        {t('auth.login.password')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t('auth.login.passwordPlaceholder')}
                          className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-lg font-semibold transition-all hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('auth.login.submit')
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t bg-gray-50 py-6">
            <div className="text-center text-sm text-muted-foreground">
              {t('auth.login.noAccount')}{' '}
              <Link
                href={`/${locale}/register`}
                className="font-medium text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
              >
                {t('auth.login.registerLink')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
