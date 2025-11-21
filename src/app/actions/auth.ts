'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { signInSchema, signUpSchema } from '@/lib/validations/auth'
import type { AuthResponse, SignInData, SignUpData } from '@/types/auth'

/**
 * Server Action para fazer login
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  try {
    // Validar dados
    const validatedData = signInSchema.parse(data)

    // Criar cliente Supabase
    const supabase = await createClient()

    // Fazer login
    console.log('🔵 [AUTH] Tentando login para:', validatedData.email)
    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      console.error('❌ [AUTH] Erro no login:', error.message)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log('✅ [AUTH] Login bem-sucedido:', authData.user?.email)

    // Verificar progresso do onboarding para redirecionar corretamente
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let redirectTo = '/dashboard'

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'kyc_status, first_deposit_completed, wallet_configured, onboarding_completed',
        )
        .eq('id', user.id)
        .single()

      if (profile) {
        // Determinar para onde redirecionar baseado no progresso
        if (profile.kyc_status !== 'approved') {
          redirectTo = '/kyc'
        } else if (!profile.first_deposit_completed) {
          redirectTo = '/deposit'
        } else if (!profile.wallet_configured) {
          redirectTo = '/wallet'
        }
      }
    }

    // Revalidar paths para garantir que o middleware veja a sessão atualizada
    console.log('🔄 [AUTH] Revalidando paths...')
    revalidatePath('/', 'layout')
    revalidatePath(redirectTo)
    console.log('✅ [AUTH] Retornando redirectTo:', redirectTo)

    return {
      success: true,
      redirectTo,
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Erro ao fazer login. Tente novamente.',
    }
  }
}

/**
 * Server Action para fazer logout
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Server Action para criar nova conta
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    console.log('🔵 Iniciando cadastro...')

    // Validar dados completos
    const validatedData = signUpSchema.parse(data)
    console.log('✅ Dados validados com sucesso')

    const sanitizedCPF = validatedData.cpf.replaceAll(/\D/g, '')
    const sanitizedPhone = validatedData.phone.replaceAll(/\D/g, '')
    const sanitizedZip = validatedData.addressZip.replaceAll(/\D/g, '')

    // Criar cliente Supabase
    const supabase = await createClient()

    // 1. Criar usuário no Supabase Auth
    console.log('🔵 Criando usuário no Auth...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.fullName,
        },
      },
    })

    if (authError) {
      console.error('❌ Erro no Auth:', authError)
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      console.error('❌ Usuário não foi criado')
      return {
        success: false,
        error: 'Erro ao criar usuário',
      }
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id)

    // 2. Criar profile do usuário usando admin client (com permissões service_role)
    console.log('🔵 Criando perfil no banco...')
    const supabaseAdmin = await createAdminClient()
    const profilePayload = {
      id: authData.user.id,
      full_name: validatedData.fullName,
      cpf: sanitizedCPF,
      phone: sanitizedPhone,
      date_of_birth: validatedData.dateOfBirth,
      address_zip: sanitizedZip,
      address_street: validatedData.addressStreet,
      address_number: validatedData.addressNumber,
      address_complement: validatedData.addressComplement || undefined,
      address_city: validatedData.addressCity,
      address_state: validatedData.addressState.toUpperCase(),
      kyc_status: 'pending',
      onboarding_completed: false,
      first_deposit_completed: false,
      wallet_configured: false,
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError)

      return {
        success: false,
        error: `Erro ao criar perfil: ${profileError.message}`,
      }
    }

    // Atualizar metadados do usuário para garantir CPF disponível no client
    await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
      user_metadata: {
        full_name: validatedData.fullName,
        cpf: sanitizedCPF,
        phone: sanitizedPhone,
      },
    })

    console.log('✅ Perfil criado com sucesso!')
    console.log(
      '✅ Cadastro completo - retornando credenciais para login no client',
    )

    // Retornar sucesso COM as credenciais para o client fazer login
    return {
      success: true,
      redirectTo: '/kyc',
      credentials: {
        email: validatedData.email,
        password: validatedData.password,
      },
    }
  } catch (error) {
    console.error('❌ Erro no catch:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'Erro ao criar conta. Tente novamente.',
    }
  }
}

/**
 * Server Action para obter usuário atual
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return
  }

  return user
}

/**
 * Server Action para obter perfil do usuário
 */
export async function getUserProfile() {
  const supabase = await createClient()

  const user = await getCurrentUser()

  if (!user) {
    return
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return
  }

  return {
    id: profile.id,
    email: user.email!,
    fullName: profile.full_name,
    cpf: profile.cpf,
    phone: profile.phone,
    dateOfBirth: profile.date_of_birth,
    addressZip: profile.address_zip,
    addressStreet: profile.address_street,
    addressNumber: profile.address_number,
    addressComplement: profile.address_complement,
    addressCity: profile.address_city,
    addressState: profile.address_state,
    isAdmin: profile.is_admin || false,
    createdAt: profile.created_at!,
    updatedAt: profile.updated_at!,
  }
}
