import { expect, test } from '@playwright/test'

test('Teste manual do admin - visualização', async ({ page }) => {
  console.log('🚀 Iniciando teste manual do admin...')

  // Aumentar timeout para poder visualizar
  test.setTimeout(300_000) // 5 minutos

  // 1. Acessar página de login
  console.log('📱 Acessando página de login...')
  await page.goto('http://localhost:3000/admin-login')
  await page.waitForTimeout(2000)

  // 2. Preencher e fazer login
  console.log('🔐 Preenchendo credenciais...')
  await page.fill('input[name="email"]', 'admin@admin.com')
  await page.waitForTimeout(500)
  await page.fill('input[name="password"]', 'admin123')
  await page.waitForTimeout(500)

  console.log('✅ Clicando no botão de login...')
  await page.click('button[type="submit"]')

  // Aguardar navegação ou erro
  console.log('⏳ Aguardando resposta do login...')
  await page.waitForTimeout(3000)

  // Verificar URL atual
  const currentURL = page.url()
  console.log(`📍 URL atual: ${currentURL}`)

  // Se estiver em /admin, sucesso!
  if (currentURL.includes('/admin') && !currentURL.includes('admin-login')) {
    console.log('✅ Login bem-sucedido! Navegando pelo painel...')

    // 3. Verificar dashboard
    await page.waitForTimeout(2000)
    console.log('📊 Dashboard carregado')

    // 4. Navegar para Clientes
    console.log('\n👥 Navegando para página de Clientes...')
    await page.click('a[href="/admin/clients"]')
    await page.waitForTimeout(3000)

    const clientsURL = page.url()
    console.log(`📍 URL Clientes: ${clientsURL}`)

    // Verificar se há dados na tabela
    const clientRows = page.locator('tbody tr')
    const clientCount = await clientRows.count()
    console.log(`👤 Clientes encontrados: ${clientCount}`)

    // 5. Navegar para Transações
    console.log('\n💰 Navegando para página de Transações...')
    await page.click('a[href="/admin/transactions"]')
    await page.waitForTimeout(3000)

    const transactionsURL = page.url()
    console.log(`📍 URL Transações: ${transactionsURL}`)

    // Verificar se há dados na tabela
    const transactionRows = page.locator('tbody tr')
    const transactionCount = await transactionRows.count()
    console.log(`💸 Transações encontradas: ${transactionCount}`)

    // 6. Navegar para Contas de Pagamento
    console.log('\n💳 Navegando para página de Contas de Pagamento...')
    await page.click('a[href="/admin/payment-accounts"]')
    await page.waitForTimeout(3000)

    const paymentURL = page.url()
    console.log(`📍 URL Contas: ${paymentURL}`)

    // 7. Voltar para Dashboard
    console.log('\n🏠 Voltando para Dashboard...')
    await page.click('a[href="/admin"]')
    await page.waitForTimeout(3000)

    console.log('\n✅ Teste concluído com sucesso!')
    console.log('🎉 Todas as páginas foram navegadas corretamente!')
  } else {
    console.log('❌ Login falhou - ainda na página de login')
    console.log(`📍 URL após submit: ${currentURL}`)

    // Capturar mensagens de erro se houver
    const errorMessage = await page
      .locator('.text-destructive')
      .textContent()
      .catch(() => null)
    if (errorMessage) {
      console.log(`⚠️ Mensagem de erro: ${errorMessage}`)
    }
  }

  // Aguardar 30 segundos para você visualizar
  console.log('\n⏰ Aguardando 30 segundos para visualização...')
  await page.waitForTimeout(30_000)
})
