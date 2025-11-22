import { expect, test } from '@playwright/test'

test.describe('Teste Simples - Botão Pagamento Recebido', () => {
  test('deve atualizar status ao clicar em Pagamento Recebido', async ({
    page,
  }) => {
    // 1. Login como admin
    console.log('🔐 Fazendo login como admin...')
    await page.goto('http://localhost:3001/admin-login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', 'slimc215@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin**', { timeout: 10_000 })
    console.log('✅ Login realizado com sucesso')

    // 2. Navegar para lista de transações
    console.log('📋 Navegando para lista de transações...')
    await page.goto('http://localhost:3001/pt-BR/admin/transactions')
    await page.waitForLoadState('networkidle')

    // 3. Procurar pela transação de teste TEST1763785397
    console.log('🔍 Procurando transação de teste TEST1763785397...')
    const transactionRow = page.locator('tr:has-text("TEST1763785397")')
    const found = (await transactionRow.count()) > 0

    if (!found) {
      console.log('⚠️ Transação de teste não encontrada')
      console.log('Listando todas as transações visíveis:')
      const allRows = await page.locator('tbody tr').all()
      for (const row of allRows) {
        const text = await row.textContent()
        console.log('  -', text?.slice(0, 100))
      }
      throw new Error('Transação de teste não encontrada na lista')
    }

    console.log('✅ Transação encontrada!')

    // 4. Clicar na transação para abrir detalhes
    console.log('🖱️ Clicando na transação...')
    await transactionRow.click()
    await page.waitForLoadState('networkidle')

    // 5. Verificar que estamos na página de detalhes
    console.log('📄 Verificando página de detalhes...')
    await page.waitForSelector('text=Detalhes da Transação', { timeout: 5000 })
    console.log('✅ Página de detalhes carregada')

    // 6. Capturar status atual
    const currentStatusBadge = page.locator('[class*="badge"]').first()
    const currentStatus = await currentStatusBadge.textContent()
    console.log(`📊 Status atual: ${currentStatus}`)

    // 7. Screenshot antes de clicar
    await page.screenshot({
      path: 'test-before-click.png',
      fullPage: true,
    })
    console.log('📸 Screenshot antes: test-before-click.png')

    // 8. Verificar se o botão existe
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

    // 9. Verificar se está habilitado
    const isDisabled = await paymentButton.isDisabled()
    console.log(`🔘 Botão desabilitado: ${isDisabled ? 'SIM' : 'NÃO'}`)

    if (isDisabled) {
      throw new Error('Botão está desabilitado')
    }

    // 10. Monitorar requisições de rede
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

    // 11. Clicar no botão
    console.log('🖱️ Clicando no botão "Pagamento Recebido"...')
    await paymentButton.click()
    console.log('✅ Botão clicado')

    // 12. Esperar um pouco para a atualização
    await page.waitForTimeout(3000)

    // 13. Screenshot depois de clicar
    await page.screenshot({
      path: 'test-after-click.png',
      fullPage: true,
    })
    console.log('📸 Screenshot depois: test-after-click.png')

    // 14. Verificar novo status
    const newStatusBadge = page.locator('[class*="badge"]').first()
    const newStatus = await newStatusBadge.textContent()
    console.log(`📊 Novo status: ${newStatus}`)

    // 15. Aguardar mais um pouco para ver se há atualizações
    await page.waitForTimeout(2000)

    // 16. Verificar status final
    const finalStatusBadge = page.locator('[class*="badge"]').first()
    const finalStatus = await finalStatusBadge.textContent()
    console.log(`📊 Status final: ${finalStatus}`)

    // 17. Screenshot final
    await page.screenshot({
      path: 'test-final.png',
      fullPage: true,
    })
    console.log('📸 Screenshot final: test-final.png')

    // 18. Validar resultado
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
