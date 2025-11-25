'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

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

const forgotPasswordSchema = z.object({
  email: z.string().email('Digite um email válido'),
})

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordData) {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao enviar email de recuperação',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      setEmailSent(true)
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      })
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao enviar email',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-16">
        <div className="container mx-auto flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="space-y-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <Mail className="h-8 w-8" />
              </div>
              <CardTitle className="text-center text-2xl font-bold">
                Verifique seu email
              </CardTitle>
              <CardDescription className="text-center text-emerald-100">
                Enviamos um link de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <p className="text-gray-600">
                  Se o email <strong>{form.getValues('email')}</strong> estiver
                  cadastrado, você receberá um link para redefinir sua senha.
                </p>
                <p className="text-sm text-gray-500">
                  Não recebeu? Verifique sua pasta de spam ou tente novamente em
                  alguns minutos.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t bg-gray-50 py-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Tentar outro email
              </Button>
              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-16">
      <div className="container mx-auto flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl font-bold">
              Esqueceu sua senha?
            </CardTitle>
            <CardDescription className="text-blue-100">
              Digite seu email para receber um link de recuperação
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
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
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
                      Enviando...
                    </>
                  ) : (
                    'Enviar link de recuperação'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t bg-gray-50 py-6">
            <div className="text-center text-sm text-muted-foreground">
              Lembrou sua senha?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
              >
                Voltar para o login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
