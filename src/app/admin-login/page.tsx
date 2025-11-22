'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Shield } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { adminLogin } from '@/app/actions/admin-auth'
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

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function AdminLoginPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    console.log('🚀 [LOGIN-PAGE] onSubmit chamado')
    console.log(`📧 [LOGIN-PAGE] Email: ${data.email}`)
    console.log(`🔑 [LOGIN-PAGE] Password length: ${data.password?.length}`)

    setIsLoading(true)
    try {
      console.log('📞 [LOGIN-PAGE] Chamando adminLogin...')
      // adminLogin agora faz redirect automaticamente em caso de sucesso
      // e lança erro NEXT_REDIRECT que o Next.js trata automaticamente
      const result = await adminLogin(data.email, data.password)
      console.log('📥 [LOGIN-PAGE] Resultado recebido:', result)

      // Se chegou aqui, houve erro no login
      if (result && !result.success) {
        console.log('❌ [LOGIN-PAGE] Login falhou:', result.error)
        toast({
          title: 'Erro de autenticação',
          description: result.error || 'Credenciais inválidas',
          variant: 'destructive',
        })
        setIsLoading(false)
      }
    } catch (error) {
      // Se for erro de redirect do Next.js, deixar ele acontecer
      if (error instanceof Error && error.message?.includes('NEXT_REDIRECT')) {
        console.log(
          '🔄 [LOGIN-PAGE] Redirect detectado, deixando Next.js processar...',
        )
        return
      }

      console.error('💥 [LOGIN-PAGE] Erro no login:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao fazer login. Tente novamente.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-16">
      <div className="container mx-auto flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="space-y-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-white/10 p-3 backdrop-blur-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-3xl font-bold">
              Painel Administrativo
            </CardTitle>
            <CardDescription className="text-center text-purple-100">
              Área restrita - Acesso exclusivo para administradores
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
                        E-mail Administrativo
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@hubp2p.com"
                          className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-purple-500"
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
                        Senha
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          className="h-11 transition-all focus-visible:ring-2 focus-visible:ring-purple-500"
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
                  className="h-11 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-lg font-semibold transition-all hover:from-purple-700 hover:to-pink-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-5 w-5" />
                      Acessar Painel
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t bg-gray-50 py-6">
            <div className="text-center text-sm text-muted-foreground">
              Protegido por autenticação de dois fatores
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
