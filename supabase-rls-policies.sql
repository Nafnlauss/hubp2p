-- ============================================
-- POLÍTICAS RLS PARA TABELA PROFILES
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Habilitar RLS na tabela profiles (se ainda não estiver)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Criar políticas corretas

-- Permitir que usuários autenticados INSIRAM seus próprios perfis
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Permitir que usuários autenticados LEIAM seus próprios perfis
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Permitir que usuários autenticados ATUALIZEM seus próprios perfis
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir que admins leiam todos os perfis
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- ============================================
-- POLÍTICAS PARA OUTRAS TABELAS (OPCIONAL)
-- ============================================

-- TRANSACTIONS TABLE
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can read own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- AUDIT_LOGS TABLE
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read all audit logs" ON public.audit_logs;

CREATE POLICY "Admins can read all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- KYC_DOCUMENTS TABLE
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.kyc_documents;

CREATE POLICY "Users can read own documents"
ON public.kyc_documents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
ON public.kyc_documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
