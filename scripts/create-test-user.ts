import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

// Criar cliente admin do Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  console.log('🔄 Criando usuário de teste...');

  let userId: string | undefined;

  // Tentar criar usuário
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'Test123456!',
    email_confirm: true,
  });

  if (authError && authError.code === 'email_exists') {
    console.log('⚠️ Usuário já existe, buscando e atualizando...');

    // Buscar usuário existente
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => u.email === 'test@example.com');

    if (!existingUser) {
      console.error('❌ Não foi possível encontrar o usuário existente');
      process.exit(1);
    }

    userId = existingUser.id;

    // Atualizar senha
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: 'Test123456!' }
    );

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError);
      process.exit(1);
    }

    console.log('✅ Senha atualizada com sucesso');
  } else if (authError) {
    console.error('❌ Erro ao criar usuário:', authError);
    process.exit(1);
  } else {
    userId = authData?.user?.id;
    console.log('✅ Novo usuário criado');
  }

  if (!userId) {
    console.error('❌ Não foi possível obter o ID do usuário');
    process.exit(1);
  }

  // Criar ou atualizar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: 'Test User',
      cpf: '12345678900', // Sem formatação
      phone: '11999999999',
      kyc_status: 'pending', // Deixar como pending para testar o fluxo
      onboarding_completed: false,
      first_deposit_completed: false,
      wallet_configured: false,
    });

  if (profileError) {
    console.error('❌ Erro ao criar/atualizar perfil:', profileError);
    process.exit(1);
  }

  console.log('✅ Perfil criado/atualizado com sucesso!');

  console.log('\n📝 Credenciais de teste:');
  console.log('   Email: test@example.com');
  console.log('   Senha: Test123456!');
  console.log('   KYC Status: pending (será redirecionado para /kyc)');
}

// Executar
createTestUser().catch(console.error);