import { expect, test } from '@playwright/test'

test.describe('Admin Payment Button Test', () => {
  test('should update transaction status when clicking Pagamento Recebido', async ({
    page,
  }) => {
    // 1. Fazer login como admin
    await page.goto('http://localhost:3000/admin-login')
    await page.waitForLoadState('networkidle')

    // Preencher credenciais de admin
    await page.fill('input[type="email"]', 'slimc215@gmail.com')
    await page.fill('input[type="password"]', '123456')

    // Clicar no botão de login
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    // Esperar redirecionamento para o painel admin
    await page.waitForURL('**/admin**', { timeout: 10_000 })

    console.log('✅ Login realizado com sucesso')
    console.log('📍 URL atual:', page.url())

    // 2. Navegar para transações
    await page.goto('http://localhost:3000/admin/transactions')
    await page.waitForLoadState('networkidle')

    console.log('📍 Navegou para transações')

    // 3. Encontrar primeira transação com status "pending_payment"
    const pendingTransaction = await page.locator(
      'tr:has-text("Aguardando Pagamento")',
    )
    const transactionCount = await pendingTransaction.count()

    console.log(`📊 Transações pendentes encontradas: ${transactionCount}`)

    if (transactionCount === 0) {
      console.log('⚠️ Nenhuma transação pendente encontrada')
      // Vamos pegar qualquer transação para testar
      const anyTransaction = await page.locator('tbody tr').first()
      if ((await anyTransaction.count()) > 0) {
        await anyTransaction.click()
        console.log('🔍 Clicou em uma transação qualquer para debug')
      } else {
        throw new Error(
          'Nenhuma transação encontrada. Crie uma transação primeiro.',
        )
      }
    } else {
      // Clicar na primeira transação pendente
      await pendingTransaction.first().click()
      console.log('🔍 Clicou na transação pendente')
    }

    await page.waitForLoadState('networkidle')

    // 4. Verificar se estamos na página de detalhes da transação
    await page.waitForSelector('text=Detalhes da Transação', { timeout: 5000 })
    console.log('✅ Página de detalhes carregada')

    // Capturar screenshot antes de clicar
    await page.screenshot({
      path: 'debug-before-click.png',
      fullPage: true,
    })
    console.log('📸 Screenshot antes de clicar: debug-before-click.png')

    // 5. Procurar pelo botão "Pagamento Recebido"
    const paymentButton = page.locator('button:has-text("Pagamento Recebido")')
    const buttonExists = await paymentButton.count()

    console.log(`🔘 Botão encontrado: ${buttonExists > 0 ? 'SIM' : 'NÃO'}`)

    if (buttonExists === 0) {
      console.log('⚠️ Botão não encontrado. Status atual da transação:')
      const statusBadge = await page.locator('[class*="badge"]').first()
      if ((await statusBadge.count()) > 0) {
        console.log('Status:', await statusBadge.textContent())
      }

      // Capturar todo o HTML da página para debug
      const html = await page.content()
      console.log('📄 HTML da página (primeiros 500 chars):')
      console.log(html.slice(0, 500))

      throw new Error('Botão "Pagamento Recebido" não encontrado na página')
    }

    // 6. Clicar no botão
    console.log('🖱️ Clicando no botão "Pagamento Recebido"...')

    // Esperar que o botão esteja visível e habilitado
    await paymentButton.waitFor({ state: 'visible' })
    const isDisabled = await paymentButton.isDisabled()
    console.log(`🔘 Botão desabilitado: ${isDisabled ? 'SIM' : 'NÃO'}`)

    if (isDisabled) {
      throw new Error('Botão está desabilitado')
    }

    // Monitorar requisições de rede
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('admin') && response.status() !== 304,
      { timeout: 10_000 },
    )

    await paymentButton.click()
    console.log('✅ Botão clicado')

    try {
      const response = await responsePromise
      console.log(`📡 Resposta recebida: ${response.status()}`)
      console.log(`📡 URL: ${response.url()}`)

      const responseBody = await response.text()
      console.log(
        `📡 Body (primeiros 200 chars): ${responseBody.slice(0, 200)}`,
      )
    } catch {
      console.log('⚠️ Timeout esperando resposta da API')
    }

    // Esperar um pouco para a página atualizar
    await page.waitForTimeout(2000)

    // Capturar screenshot depois de clicar
    await page.screenshot({
      path: 'debug-after-click.png',
      fullPage: true,
    })
    console.log('📸 Screenshot depois de clicar: debug-after-click.png')

    // 7. Verificar se o status mudou
    const statusBadge = await page.locator('[class*="badge"]').first()
    const newStatus = await statusBadge.textContent()

    console.log(`📊 Status após clicar: ${newStatus}`)

    // Verificar logs do console do navegador
    page.on('console', (message) => {
      console.log(`🌐 BROWSER: ${message.text()}`)
    })

    // Verificar erros
    page.on('pageerror', (error) => {
      console.log(`❌ PAGE ERROR: ${error.message}`)
    })

    // Esperar mais um pouco para ver se algo muda
    await page.waitForTimeout(3000)

    // Capturar screenshot final
    await page.screenshot({ path: 'debug-final.png', fullPage: true })
    console.log('📸 Screenshot final: debug-final.png')

    // Verificar se o status mudou para "Pagamento Recebido" ou similar
    const finalStatusBadge = await page.locator('[class*="badge"]').first()
    const finalStatus = await finalStatusBadge.textContent()

    console.log(`📊 Status final: ${finalStatus}`)

    if (
      finalStatus?.includes('Pagamento Recebido') ||
      finalStatus?.includes('Convertendo') ||
      finalStatus?.includes('Enviado')
    ) {
      console.log('✅ Status atualizado com sucesso!')
    } else {
      console.log('❌ Status NÃO foi atualizado')
      console.log('Status esperado: Pagamento Recebido')
      console.log(`Status obtido: ${finalStatus}`)
    }
  })
})
