'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, Loader2, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type ResetPasswordData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | undefined>()

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Verificar se o usuário tem uma sessão válida (veio do link de reset)
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Se tiver sessão, o link de reset foi válido
      setIsValidSession(!!session)
    }

    checkSession()

    // Ouvir mudanças de autenticação (quando o usuário clica no link)
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function onSubmit(data: ResetPasswordData) {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao redefinir senha',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      toast({
        title: 'Senha redefinida!',
        description: 'Sua senha foi alterada com sucesso.',
      })

      // Redirecionar para o login após 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao redefinir senha',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Carregando verificação de sessão
  if (isValidSession === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-16">
        <div className="container mx-auto flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Link inválido ou expirado
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-16">
        <div className="container mx-auto flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="space-y-1 bg-gradient-to-r from-red-600 to-orange-600 text-white">
              <CardTitle className="text-center text-2xl font-bold">
                Link inválido ou expirado
              </CardTitle>
              <CardDescription className="text-center text-red-100">
                O link de recuperação não é mais válido
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                O link de recuperação de senha pode ter expirado ou já foi
                utilizado. Solicite um novo link de recuperação.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t bg-gray-50 py-6">
              <Link href="/forgot-password" className="w-full">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  Solicitar novo link
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  Voltar para o login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Sucesso ao redefinir senha
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-16">
        <div className="container mx-auto flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="space-y-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                <CheckCircle className="h-8 w-8" />
              </div>
              <CardTitle className="text-center text-2xl font-bold">
                Senha redefinida!
              </CardTitle>
              <CardDescription className="text-center text-emerald-100">
                Sua senha foi alterada com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                Você será redirecionado para a página de login em instantes...
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t bg-gray-50 py-6">
              <Link href="/login" className="w-full">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  Ir para o login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  // Formulário de nova senha
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-16">
      <div className="container mx-auto flex items-center justify-center">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Lock className="h-8 w-8" />
            </div>
            <CardTitle className="text-center text-2xl font-bold">
              Criar nova senha
            </CardTitle>
            <CardDescription className="text-center text-blue-100">
              Digite sua nova senha abaixo
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Nova senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite sua nova senha"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Confirmar nova senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Digite a senha novamente"
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
                      Salvando...
                    </>
                  ) : (
                    'Redefinir senha'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
