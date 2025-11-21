import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('URL:', supabaseUrl ? 'OK' : 'MISSING')
console.log('Service Key:', supabaseServiceKey ? 'OK' : 'MISSING')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function resetPassword() {
  console.log('🔵 Resetando senha do usuário test@example.com...')

  // Atualizar senha do usuário
  const { data, error } = await supabase.auth.admin.updateUserById(
    'dc09bf00-8659-48e3-baa2-31aa146b5463',
    { password: 'Test123!' },
  )

  if (error) {
    console.error('❌ Erro ao resetar senha:', error)
    process.exit(1)
  }

  console.log('✅ Senha resetada com sucesso!')
  console.log('📧 Email: test@example.com')
  console.log('🔑 Senha: Test123!')
}

resetPassword()
