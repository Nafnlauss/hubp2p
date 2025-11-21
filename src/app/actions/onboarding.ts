'use server'

import { redirect } from 'next/navigation'

import { createAdminClient, createClient } from '@/lib/supabase/server'

export interface OnboardingStatus {
  kycCompleted: boolean
  depositCompleted: boolean
  walletConfigured: boolean
  onboardingCompleted: boolean
  nextStep: string
}

/**
 * Obter status do onboarding do usuário
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        'kyc_status, first_deposit_completed, wallet_configured, onboarding_completed',
      )
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    const kycCompleted = profile.kyc_status === 'approved'
    const depositCompleted = profile.first_deposit_completed === true
    const walletConfigured = profile.wallet_configured === true
    const onboardingCompleted = profile.onboarding_completed === true

    let nextStep = '/dashboard'

    if (!kycCompleted) {
      nextStep = '/kyc'
    } else if (!depositCompleted) {
      nextStep = '/deposit'
    } else if (!walletConfigured) {
      nextStep = '/wallet'
    }

    return {
      kycCompleted,
      depositCompleted,
      walletConfigured,
      onboardingCompleted,
      nextStep,
    }
  } catch (error) {
    console.error('Erro ao obter status do onboarding:', error)
    return null
  }
}

/**
 * Completar KYC (por enquanto apenas marca como aprovado)
 */
export async function completeKYC() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const supabaseAdmin = await createAdminClient()

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        kyc_status: 'approved',
        kyc_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Erro ao completar KYC:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao completar KYC:', error)
    return { success: false, error: 'Erro ao completar KYC' }
  }
}

/**
 * Completar primeiro depósito
 */
export async function completeFirstDeposit() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const supabaseAdmin = await createAdminClient()

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        first_deposit_completed: true,
        first_deposit_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Erro ao completar depósito:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao completar depósito:', error)
    return { success: false, error: 'Erro ao completar depósito' }
  }
}

/**
 * Adicionar carteira
 */
export async function addWallet(data: {
  currency: string
  address: string
  network?: string
  label?: string
  isPrimary?: boolean
}) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const supabaseAdmin = await createAdminClient()

    // Inserir carteira
    const { error: walletError } = await supabaseAdmin.from('wallets').insert({
      user_id: user.id,
      currency: data.currency,
      address: data.address,
      network: data.network,
      label: data.label,
      is_primary: data.isPrimary || false,
    })

    if (walletError) {
      console.error('Erro ao adicionar carteira:', walletError)
      return { success: false, error: walletError.message }
    }

    // Atualizar status de carteira configurada
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        wallet_configured: true,
        wallet_configured_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError)
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao adicionar carteira:', error)
    return { success: false, error: 'Erro ao adicionar carteira' }
  }
}

/**
 * Completar onboarding
 */
export async function completeOnboarding() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const supabaseAdmin = await createAdminClient()

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Erro ao completar onboarding:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao completar onboarding:', error)
    return { success: false, error: 'Erro ao completar onboarding' }
  }
}
