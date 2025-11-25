import { redirect } from 'next/navigation'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'

interface ProfilePageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  await params
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Buscar perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Buscar KYC
  const { data: kyc } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const userInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  const kycStatusMap = {
    pending: { label: 'Pendente', variant: 'warning' as const },
    in_review: { label: 'Em Análise', variant: 'info' as const },
    approved: { label: 'Aprovado', variant: 'success' as const },
    rejected: { label: 'Rejeitado', variant: 'destructive' as const },
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      {/* Informações do Usuário */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle>{profile?.full_name || 'Usuário'}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              {profile?.is_admin && (
                <Badge variant="secondary" className="mt-2">
                  Administrador
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                CPF
              </div>
              <p className="mt-1 font-medium">
                {profile?.cpf
                  ? profile.cpf.replace(
                      /(\d{3})(\d{3})(\d{3})(\d{2})/,
                      '$1.$2.$3-$4',
                    )
                  : '-'}
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Telefone
              </div>
              <p className="mt-1 font-medium">{profile?.phone || '-'}</p>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Data de Nascimento
              </div>
              <p className="mt-1 font-medium">
                {profile?.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString('pt-BR')
                  : '-'}
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Status KYC
              </div>
              <div className="mt-1">
                {kyc ? (
                  <Badge
                    variant={
                      kycStatusMap[kyc.status as keyof typeof kycStatusMap]
                        .variant
                    }
                  >
                    {
                      kycStatusMap[kyc.status as keyof typeof kycStatusMap]
                        .label
                    }
                  </Badge>
                ) : (
                  <Badge variant="outline">Não Iniciado</Badge>
                )}
              </div>
            </div>
          </div>

          {profile?.address_street && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Endereço
                </div>
                <p className="mt-1 font-medium">
                  {profile.address_street}
                  {profile.address_number && `, ${profile.address_number}`}
                  {profile.address_complement &&
                    ` - ${profile.address_complement}`}
                </p>
                {profile.address_city && profile.address_state && (
                  <p className="text-sm text-muted-foreground">
                    {profile.address_city} - {profile.address_state}
                    {profile.address_zip && ` - CEP: ${profile.address_zip}`}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>
            Detalhes sobre sua conta na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID do Usuário:</span>
            <span className="font-mono text-xs">{user.id}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-mail Verificado:</span>
            <Badge variant={user.email_confirmed_at ? 'success' : 'warning'}>
              {user.email_confirmed_at ? 'Sim' : 'Não'}
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Conta Criada em:</span>
            <span className="font-medium">
              {new Date(user.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </div>
          {user.last_sign_in_at && (
            <>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último Acesso:</span>
                <span className="font-medium">
                  {new Date(user.last_sign_in_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
