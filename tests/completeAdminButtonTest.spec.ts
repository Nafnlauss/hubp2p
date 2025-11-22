import { expect, test } from '@playwright/test'

test.describe('Teste Completo do Botão Pagamento Recebido', () => {
  let transactionId: string
  let userId: string

  test.beforeAll(async () => {
    console.log('🚀 Iniciando setup do teste...')
  })

  test.afterAll(async () => {
    // Limpar transação de teste se foi criada
    if (transactionId) {
      console.log(`🧹 Limpando transação de teste: ${transactionId}`)
      // A limpeza será feita via SQL usando o MCP Supabase
    }
  })

  test('deve criar transação, clicar em Pagamento Recebido e verificar status', async ({
    page,
  }) => {
    // ========================================
    // PASSO 1: Obter ID do usuário admin
    // ========================================
    console.log('📝 PASSO 1: Buscando ID do usuário admin...')

    // Primeiro vamos fazer login para obter o user_id
    await page.goto('http://localhost:3000/admin-login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', 'slimc215@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin**', { timeout: 10_000 })

    console.log('✅ Login admin realizado com sucesso')

    //Obter user_id fazendo uma chamada à API do Supabase
    const userData = await page.evaluate(async () => {
      try {
        const SUPABASE_URL = 'https://cnttavxhilcilcoafkgu.supabase.co'
        const SUPABASE_ANON_KEY =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudHRhdnhoaWxjaWxjb2FmZ2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MDAwMDcsImV4cCI6MjA1MTA3NjAwN30.JMwNQwHdm0J2w8VxVAH3bF_gZ9_n9_hO4d6zBP4E-WI'

        // Buscar todos os cookies para obter o token de auth
        const cookies = document.cookie.split(';')
        let authToken = ''

        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=')
          if (
            name.includes('auth-token') ||
            name.includes('access-token') ||
            name.includes('sb-')
          ) {
            authToken = value
            break
          }
        }

        if (!authToken) {
          // Tentar buscar do localStorage
          const lsKeys = Object.keys(localStorage)
          for (const key of lsKeys) {
            if (key.includes('supabase')) {
              const data = localStorage.getItem(key)
              if (data) {
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.access_token) {
                    authToken = parsed.access_token
                    break
                  }
                } catch {
                  // Continuar
                }
              }
            }
          }
        }

        if (!authToken) {
          return { success: false, error: 'Token não encontrado' }
        }

        // Buscar dados do usuário usando o token
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`,
          },
        })

        if (!response.ok) {
          return {
            success: false,
            error: `Erro ao buscar usuário: ${response.status}`,
          }
        }

        const user = await response.json()
        return { success: true, userId: user.id, email: user.email }
      } catch (error_) {
        return {
          success: false,
          error: error_ instanceof Error ? error_.message : 'Erro desconhecido',
        }
      }
    })

    if (!userData.success || !userData.userId) {
      console.error('Erro ao obter user_id:', userData.error)
      throw new Error(`Não foi possível obter o user_id: ${userData.error}`)
    }

    userId = userData.userId
    console.log(`✅ User ID obtido: ${userId}`)
    console.log(`✅ Email: ${userData.email}`)

    // ========================================
    // PASSO 2: Verificar conta de pagamento ativa
    // ========================================
    console.log('📝 PASSO 2: Verificando contas de pagamento ativas...')

    const checkAccountsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/check-payment-accounts')
        return await response.json()
      } catch {
        return null
      }
    })

    console.log('Resposta de contas:', checkAccountsResponse)

    // ========================================
    // PASSO 3: Criar transação de teste via SQL
    // ========================================
    console.log('📝 PASSO 3: Criando transação de teste...')

    // Criar transação diretamente via API route ou navegador
    const transactionNumber = `TEST${Date.now()}`
    const expiresAt = new Date(Date.now() + 40 * 60 * 1000).toISOString() // 40 minutos
    const createdAt = new Date().toISOString()

    // Vamos criar a transação via API usando fetch no contexto do browser
    const createTransactionResult = await page.evaluate(
      async ({
        userIdParam,
        transactionNumberParam,
        expiresAtParam,
        createdAtParam,
      }: {
        userIdParam: string
        transactionNumberParam: string
        expiresAtParam: string
        createdAtParam: string
      }) => {
        try {
          // Criar transação diretamente via REST API do Supabase
          const SUPABASE_URL =
            'https://cnttavxhilcilcoafkgu.supabase.co' as string
          const SUPABASE_ANON_KEY =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudHRhdnhoaWxjaWxjb2FmZ2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MDAwMDcsImV4cCI6MjA1MTA3NjAwN30.JMwNQwHdm0J2w8VxVAH3bF_gZ9_n9_hO4d6zBP4E-WI' as string

          const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({
              user_id: userIdParam,
              transaction_number: transactionNumberParam,
              payment_method: 'pix',
              amount_brl: 100,
              crypto_amount: null,
              crypto_network: 'ethereum',
              wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
              status: 'pending_payment',
              expires_at: expiresAtParam,
              created_at: createdAtParam,
              pix_key: 'test@example.com',
              pix_qr_code: null,
              bank_name: null,
              bank_account_holder: null,
              bank_account_number: null,
              bank_account_agency: null,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            return { success: false, error: errorText }
          }

          const data = await response.json()
          return { success: true, data: data[0] }
        } catch (error_) {
          return {
            success: false,
            error:
              error_ instanceof Error ? error_.message : 'Erro desconhecido',
          }
        }
      },
      {
        userIdParam: userId,
        transactionNumberParam: transactionNumber,
        expiresAtParam: expiresAt,
        createdAtParam: createdAt,
      },
    )

    console.log('Resultado da criação:', createTransactionResult)

    if (!createTransactionResult.success) {
      throw new Error(
        `Erro ao criar transação: ${createTransactionResult.error}`,
      )
    }

    transactionId = createTransactionResult.data.id
    console.log(`✅ Transação criada com ID: ${transactionId}`)
    console.log(
      `📊 Transaction Number: ${createTransactionResult.data.transaction_number}`,
    )

    // ========================================
    // PASSO 4: Navegar para a transação
    // ========================================
    console.log('📝 PASSO 4: Navegando para a transação...')

    await page.goto(`http://localhost:3000/pt-BR/admin/transactions`)
    await page.waitForLoadState('networkidle')

    console.log('✅ Página de transações carregada')

    // Procurar pela transação criada
    const transactionRow = page.locator(`tr:has-text("${transactionNumber}")`)
    const transactionExists = (await transactionRow.count()) > 0

    if (!transactionExists) {
      await page.screenshot({
        path: 'debug-transaction-not-found.png',
        fullPage: true,
      })
      throw new Error(`Transação ${transactionNumber} não encontrada na lista`)
    }

    console.log('✅ Transação encontrada na lista')

    // Clicar na transação
    await transactionRow.click()
    await page.waitForLoadState('networkidle')

    console.log('✅ Navegou para detalhes da transação')

    // ========================================
    // PASSO 5: Verificar se estamos na página correta
    // ========================================
    console.log('📝 PASSO 5: Verificando página de detalhes...')

    await page.waitForSelector('text=Detalhes da Transação', {
      timeout: 5000,
    })
    console.log('✅ Página de detalhes carregada')

    // Screenshot antes de clicar
    await page.screenshot({
      path: 'debug-before-payment-click.png',
      fullPage: true,
    })

    // ========================================
    // PASSO 6: Procurar e clicar no botão
    // ========================================
    console.log('📝 PASSO 6: Procurando botão "Pagamento Recebido"...')

    const paymentButton = page.locator('button:has-text("Pagamento Recebido")')
    const buttonCount = await paymentButton.count()

    console.log(`🔘 Botões encontrados: ${buttonCount}`)

    if (buttonCount === 0) {
      const html = await page.content()
      console.log('📄 HTML da página (primeiros 1000 chars):')
      console.log(html.slice(0, 1000))

      throw new Error('Botão "Pagamento Recebido" não encontrado')
    }

    // Verificar se o botão está visível e habilitado
    await paymentButton.waitFor({ state: 'visible' })
    const isDisabled = await paymentButton.isDisabled()
    console.log(`🔘 Botão desabilitado: ${isDisabled ? 'SIM' : 'NÃO'}`)

    if (isDisabled) {
      throw new Error('Botão está desabilitado')
    }

    // ========================================
    // PASSO 7: Clicar no botão
    // ========================================
    console.log('📝 PASSO 7: Clicando no botão...')

    // Monitorar network para ver se há chamada de API
    let apiCalled = false
    page.on('response', (response) => {
      if (response.url().includes('admin') && response.status() === 200) {
        apiCalled = true
        console.log(`📡 API chamada: ${response.url()} - ${response.status()}`)
      }
    })

    await paymentButton.click()
    console.log('✅ Botão clicado')

    // Esperar um pouco para a atualização
    await page.waitForTimeout(3000)

    // ========================================
    // PASSO 8: Verificar mudança de status
    // ========================================
    console.log('📝 PASSO 8: Verificando mudança de status...')

    // Screenshot depois de clicar
    await page.screenshot({
      path: 'debug-after-payment-click.png',
      fullPage: true,
    })

    // Verificar se o badge de status mudou
    const statusBadge = page.locator('[class*="badge"]').first()
    const statusText = await statusBadge.textContent()

    console.log(`📊 Status após clicar: ${statusText}`)

    // Esperar mais um pouco
    await page.waitForTimeout(2000)

    // Verificar status final
    const finalStatusBadge = page.locator('[class*="badge"]').first()
    const finalStatus = await finalStatusBadge.textContent()

    console.log(`📊 Status final: ${finalStatus}`)

    // Screenshot final
    await page.screenshot({
      path: 'debug-final-status.png',
      fullPage: true,
    })

    // ========================================
    // PASSO 9: Validação
    // ========================================
    console.log('📝 PASSO 9: Validando resultado...')

    const expectedStatuses = ['Pagamento Recebido', 'Convertendo', 'Enviado']
    const statusChanged = expectedStatuses.some((expected) =>
      finalStatus?.includes(expected),
    )

    if (statusChanged) {
      console.log('✅ ✅ ✅ STATUS ATUALIZADO COM SUCESSO! ✅ ✅ ✅')
      console.log(`Status anterior: Aguardando Pagamento`)
      console.log(`Status atual: ${finalStatus}`)
      console.log(`API foi chamada: ${apiCalled ? 'SIM' : 'NÃO'}`)
    } else {
      console.log('❌ ❌ ❌ STATUS NÃO FOI ATUALIZADO ❌ ❌ ❌')
      console.log(`Status esperado: um de [${expectedStatuses.join(', ')}]`)
      console.log(`Status obtido: ${finalStatus}`)
      console.log(`API foi chamada: ${apiCalled ? 'SIM' : 'NÃO'}`)
    }

    // Asserção final
    expect(statusChanged).toBe(true)

    // ========================================
    // PASSO 10: Cleanup
    // ========================================
    console.log('📝 PASSO 10: Limpando transação de teste...')

    const deleteResult = await page.evaluate(
      async (transactionIdParameter: string) => {
        try {
          const SUPABASE_URL =
            'https://cnttavxhilcilcoafkgu.supabase.co' as string
          const SUPABASE_ANON_KEY =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudHRhdnhoaWxjaWxjb2FmZ2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1MDAwMDcsImV4cCI6MjA1MTA3NjAwN30.JMwNQwHdm0J2w8VxVAH3bF_gZ9_n9_hO4d6zBP4E-WI' as string

          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/transactions?id=eq.${transactionIdParameter}`,
            {
              method: 'DELETE',
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            },
          )

          if (!response.ok) {
            const errorText = await response.text()
            return { success: false, error: errorText }
          }

          return { success: true }
        } catch (error_) {
          return {
            success: false,
            error:
              error_ instanceof Error ? error_.message : 'Erro desconhecido',
          }
        }
      },
      transactionId,
    )

    if (deleteResult.success) {
      console.log('✅ Transação de teste removida com sucesso')
    } else {
      console.log(
        `⚠️ Erro ao remover transação de teste: ${deleteResult.error}`,
      )
    }

    console.log('🎉 TESTE COMPLETO!')
  })
})
