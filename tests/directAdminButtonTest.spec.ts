import { expect, test } from '@playwright/test'

test.describe('Teste Direto - Botão Pagamento Recebido', () => {
  test('deve atualizar status ao clicar em Pagamento Recebido - acesso direto por ID', async ({
    page,
  }) => {
    const TRANSACTION_ID = 'b3073106-aafd-4dc8-a152-3648a07e6347'

    // 1. Login como admin
    console.log('🔐 Fazendo login como admin...')
    await page.goto('http://localhost:3001/admin-login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', 'slimc215@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin**', { timeout: 10_000 })
    console.log('✅ Login realizado com sucesso')

    // 2. Navegar DIRETAMENTE para página de detalhes da transação
    console.log(`📋 Acessando diretamente transação ${TRANSACTION_ID}...`)
    await page.goto(
      `http://localhost:3001/pt-BR/admin/transactions/${TRANSACTION_ID}`,
    )
    await page.waitForLoadState('networkidle')
    console.log(`📍 URL atual: ${page.url()}`)

    // 3. Verificar que estamos na página de detalhes
    console.log('📄 Verificando página de detalhes...')
    const hasDetailsHeader = await page
      .locator('text=Detalhes da Transação')
      .count()

    if (hasDetailsHeader === 0) {
      console.log('❌ Não encontrou "Detalhes da Transação"')
      console.log('Procurando qualquer título:')
      const h1 = await page.locator('h1').allTextContents()
      console.log('  H1s:', h1)
      throw new Error('Página de detalhes não carregou corretamente')
    }

    console.log('✅ Página de detalhes carregada')

    // 4. Capturar status atual
    const currentStatusBadge = page.locator('[class*="badge"]').first()
    const currentStatus = await currentStatusBadge.textContent()
    console.log(`📊 Status atual: ${currentStatus}`)

    // 5. Screenshot antes de clicar
    await page.screenshot({
      path: 'test-direct-before-click.png',
      fullPage: true,
    })
    console.log('📸 Screenshot antes: test-direct-before-click.png')

    // 6. Verificar se o botão existe
    console.log('🔘 Procurando botão "Pagamento Recebido"...')
    const paymentButton = page.locator('button:has-text("Pagamento Recebido")')
    const buttonCount = await paymentButton.count()

    if (buttonCount === 0) {
      console.log('❌ Botão não encontrado!')
      console.log('Procurando qualquer botão na página:')
      const allButtons = await page.locator('button').all()
      for (const button of allButtons) {
        const text = await button.textContent()
        console.log('  - Botão:', text)
      }
      throw new Error('Botão "Pagamento Recebido" não encontrado')
    }

    console.log(`✅ Botão encontrado (${buttonCount} instância(s))`)

    // 7. Verificar se está habilitado
    const isDisabled = await paymentButton.isDisabled()
    console.log(`🔘 Botão desabilitado: ${isDisabled ? 'SIM' : 'NÃO'}`)

    if (isDisabled) {
      throw new Error('Botão está desabilitado')
    }

    // 8. Monitorar requisições de rede
    let apiCallMade = false
    page.on('response', (response) => {
      if (
        response.url().includes('admin') ||
        response.url().includes('transactions')
      ) {
        apiCallMade = true
        console.log(
          `📡 API chamada: ${response.url()} - Status: ${response.status()}`,
        )
      }
    })

    // 9. Clicar no botão
    console.log('🖱️ Clicando no botão "Pagamento Recebido"...')
    await paymentButton.click()
    console.log('✅ Botão clicado')

    // 10. Esperar um pouco para a atualização
    await page.waitForTimeout(3000)

    // 11. Screenshot depois de clicar
    await page.screenshot({
      path: 'test-direct-after-click.png',
      fullPage: true,
    })
    console.log('📸 Screenshot depois: test-direct-after-click.png')

    // 12. Verificar novo status
    const newStatusBadge = page.locator('[class*="badge"]').first()
    const newStatus = await newStatusBadge.textContent()
    console.log(`📊 Novo status: ${newStatus}`)

    // 13. Aguardar mais um pouco para ver se há atualizações
    await page.waitForTimeout(2000)

    // 14. Verificar status final
    const finalStatusBadge = page.locator('[class*="badge"]').first()
    const finalStatus = await finalStatusBadge.textContent()
    console.log(`📊 Status final: ${finalStatus}`)

    // 15. Screenshot final
    await page.screenshot({
      path: 'test-direct-final.png',
      fullPage: true,
    })
    console.log('📸 Screenshot final: test-direct-final.png')

    // 16. Validar resultado
    console.log('\n========== VALIDAÇÃO ==========')
    console.log(`Status antes: ${currentStatus}`)
    console.log(`Status depois: ${finalStatus}`)
    console.log(`API chamada: ${apiCallMade ? 'SIM' : 'NÃO'}`)

    const expectedStatuses = ['Pagamento Recebido', 'Convertendo', 'Enviado']
    const statusChanged = expectedStatuses.some((expected) =>
      finalStatus?.includes(expected),
    )

    if (statusChanged) {
      console.log(
        '\n✅ ✅ ✅ TESTE PASSOU! STATUS ATUALIZADO COM SUCESSO! ✅ ✅ ✅',
      )
    } else {
      console.log('\n❌ ❌ ❌ TESTE FALHOU! STATUS NÃO FOI ATUALIZADO ❌ ❌ ❌')
      console.log(`Esperado: um de [${expectedStatuses.join(', ')}]`)
      console.log(`Obtido: ${finalStatus}`)
    }

    // Asserção
    expect(statusChanged).toBe(true)
  })
})
