import { expect, test } from '@playwright/test'

test.describe('Teste Botão Cripto Enviada', () => {
  test('deve funcionar o botão Marcar como Enviado', async ({ page }) => {
    const TRANSACTION_ID = 'b3073106-aafd-4dc8-a152-3648a07e6347'

    console.log('=== TESTE BOTÃO CRIPTO ENVIADA ===')

    // 0. Resetar transação para pending_payment
    console.log('\n0️⃣ Resetando transação para pending_payment...')
    await page.request.post(
      'http://localhost:3001/api/test-helpers/reset-transaction',
      {
        data: {
          transactionId: TRANSACTION_ID,
          status: 'pending_payment',
        },
      },
    )
    console.log('✅ Transação resetada')

    // 1. Login como admin
    console.log('\n1️⃣ Fazendo login...')
    await page.goto('http://localhost:3001/admin-login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', 'slimc215@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin**', { timeout: 10_000 })
    // Aguardar cookies serem sincronizados após redirect (aumentado para 3s)
    await page.waitForTimeout(3000)
    console.log('✅ Login OK')

    // 2. Verificar cookies
    const cookies = await page.context().cookies()
    const adminCookie = cookies.find((c) => c.name === 'admin_session')
    console.log(
      `🍪 Cookie admin_session: ${adminCookie ? 'PRESENTE' : 'AUSENTE'}`,
    )

    if (!adminCookie) {
      throw new Error('Cookie de admin não foi criado')
    }

    // 3. Navegar para página de detalhes
    console.log('\n2️⃣ Navegando para página de transação...')
    const detailsUrl = `http://localhost:3001/pt-BR/admin/transactions/${TRANSACTION_ID}`

    // Interceptar Server Actions
    const serverActionRequests: any[] = []
    const serverActionResponses: any[] = []

    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().includes('admin/transactions')
      ) {
        console.log('📡 Server Action REQUEST:', {
          url: request.url(),
          method: request.method(),
        })
        serverActionRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString(),
        })
      }
    })

    page.on('response', async (response) => {
      if (
        response.request().method() === 'POST' &&
        response.url().includes('admin/transactions')
      ) {
        console.log('📥 Server Action RESPONSE:', {
          status: response.status(),
          url: response.url(),
        })

        try {
          const text = await response.text()
          console.log(
            '📄 Corpo da resposta (primeiros 500 chars):',
            text.slice(0, 500),
          )

          serverActionResponses.push({
            status: response.status(),
            body: text.slice(0, 1000),
            timestamp: new Date().toISOString(),
          })
        } catch {
          console.log('⚠️ Não foi possível ler corpo da resposta')
        }
      }
    })

    await page.goto(detailsUrl)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log(`📍 URL atual: ${page.url()}`)

    // 4. Screenshot inicial
    await page.screenshot({
      path: 'test-crypto-sent-before.png',
      fullPage: true,
    })
    console.log('📸 Screenshot salvo: test-crypto-sent-before.png')

    // 5. Verificar status atual
    console.log('\n3️⃣ Verificando status atual...')
    // Aguardar o badge renderizar usando texto visível
    await page.waitForSelector(
      'text=/Aguardando Pagamento|Pagamento Recebido|Convertendo|Enviado/i',
      { timeout: 10_000 },
    )
    const statusBadge = await page
      .getByText(
        /aguardando pagamento|pagamento recebido|convertendo|enviado|cancelado|expirado/i,
      )
      .first()
      .textContent()
    console.log(`📊 Status atual: "${statusBadge}"`)

    // 6. Se status for "Aguardando Pagamento", clicar em "Pagamento Recebido" primeiro
    if (statusBadge?.includes('Aguardando')) {
      console.log(
        '\n4️⃣ Status é "Aguardando Pagamento", clicando em "Pagamento Recebido"...',
      )
      const paymentButton = page.getByRole('button', {
        name: /pagamento recebido/i,
      })
      await paymentButton.click()
      console.log('✅ Clicou em "Pagamento Recebido"')

      // Aguardar atualização
      await page.waitForTimeout(3000)

      // Verificar novo status
      const newStatusBadge = await page
        .getByText(
          /aguardando pagamento|pagamento recebido|convertendo|enviado|cancelado|expirado/i,
        )
        .first()
        .textContent()
      console.log(`📊 Novo status: "${newStatusBadge}"`)
    }

    // 7. Procurar campo TX Hash
    console.log('\n5️⃣ Procurando campo TX Hash...')
    const txHashInput = page
      .locator('input[placeholder*="hash"]')
      .or(page.locator('input').filter({ hasText: /hash/i }))
    const txHashCount = await txHashInput.count()

    if (txHashCount === 0) {
      console.log('❌ Campo TX Hash não encontrado!')
      console.log(
        '⚠️ Isso significa que o status não é "payment_received" ou "converting"',
      )

      // Listar todos os inputs na página
      const allInputs = await page.locator('input').all()
      console.log(`📝 Total de inputs encontrados: ${allInputs.length}`)
      for (const input of allInputs) {
        const placeholder = await input.getAttribute('placeholder')
        const type = await input.getAttribute('type')
        console.log(`  - Input type="${type}" placeholder="${placeholder}"`)
      }

      throw new Error(
        'Campo TX Hash não encontrado. Verifique o status da transação.',
      )
    }

    console.log(`✅ Campo TX Hash encontrado (${txHashCount}x)`)

    // 8. Preencher TX Hash
    console.log('\n6️⃣ Preenchendo TX Hash...')
    const testTxHash =
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    await txHashInput.first().fill(testTxHash)
    console.log(`✅ TX Hash preenchido: ${testTxHash}`)

    // 9. Procurar botão "Marcar como Enviado"
    console.log('\n7️⃣ Procurando botão "Marcar como Enviado"...')

    let button = page.getByRole('button', { name: /marcar como enviado/i })
    let buttonCount = await button.count()

    if (buttonCount === 0) {
      // Tentar outras formas
      button = page.getByText('Marcar como Enviado')
      buttonCount = await button.count()
    }

    if (buttonCount === 0) {
      console.log('❌ Botão "Marcar como Enviado" não encontrado!')

      // Listar todos os botões
      const allButtons = await page.locator('button').all()
      console.log(`🔍 Total de botões: ${allButtons.length}`)
      for (const button_ of allButtons) {
        const text = await button_.textContent()
        const isVisible = await button_.isVisible()
        const isDisabled = await button_.isDisabled()
        console.log(
          `  - "${text?.trim()}" | Visível: ${isVisible} | Desabilitado: ${isDisabled}`,
        )
      }

      throw new Error('Botão não encontrado')
    }

    console.log(`✅ Botão encontrado (${buttonCount}x)`)

    // 9. Verificar se está habilitado
    const isDisabled = await button.isDisabled()
    console.log(`🔘 Botão está ${isDisabled ? 'DESABILITADO' : 'HABILITADO'}`)

    if (isDisabled) {
      console.log('⚠️ Botão está desabilitado mesmo com TX Hash preenchido!')
      throw new Error('Botão desabilitado')
    }

    // 10. Limpar contadores de requests
    serverActionRequests.length = 0
    serverActionResponses.length = 0

    // 11. Clicar no botão
    console.log('\n7️⃣ Clicando no botão...')
    await button.click()
    console.log('✅ Clique realizado!')

    // 12. Aguardar resposta
    console.log('\n8️⃣ Aguardando resposta...')
    await page.waitForTimeout(4000)

    // 13. Verificar Server Actions
    console.log('\n9️⃣ Verificando Server Actions...')
    console.log(`📊 Requests capturados: ${serverActionRequests.length}`)
    console.log(`📊 Responses capturadas: ${serverActionResponses.length}`)

    if (serverActionRequests.length === 0) {
      console.log('⚠️ NENHUM Server Action foi chamado!')
    } else {
      for (const [index, request] of serverActionRequests.entries()) {
        console.log(`  Request ${index + 1}:`, request)
      }
    }

    if (serverActionResponses.length > 0) {
      for (const [index, res] of serverActionResponses.entries()) {
        console.log(`  Response ${index + 1}:`, res)
      }
    }

    // 14. Screenshot após clique
    await page.screenshot({
      path: 'test-crypto-sent-after.png',
      fullPage: true,
    })
    console.log('📸 Screenshot após clique: test-crypto-sent-after.png')

    // 15. Verificar mudança de status
    console.log('\n🔟 Verificando mudança de status...')
    await page.waitForSelector(
      'text=/Aguardando Pagamento|Pagamento Recebido|Convertendo|Enviado/i',
      { timeout: 10_000 },
    )
    const statusAfter = await page
      .getByText(
        /aguardando pagamento|pagamento recebido|convertendo|enviado|cancelado|expirado/i,
      )
      .first()
      .textContent()
    console.log(`📊 Status após clique: "${statusAfter}"`)

    // Verificar se mudou para "Enviado"
    const expectedStatuses = ['Enviado', 'Concluído', 'Completo']
    const hasChanged = expectedStatuses.some((status) =>
      statusAfter?.toLowerCase().includes(status.toLowerCase()),
    )

    if (hasChanged) {
      console.log('\n✅ ✅ ✅ SUCESSO! STATUS MUDOU PARA ENVIADO! ✅ ✅ ✅')
    } else {
      console.log('\n❌ STATUS NÃO MUDOU!')
      console.log('Esperado um de:', expectedStatuses)
      console.log('Status anterior:', statusBadge)
      console.log('Status atual:', statusAfter)

      // Verificar se há alguma mensagem de erro na página
      const pageContent = await page.content()
      if (pageContent.includes('erro') || pageContent.includes('error')) {
        console.log('⚠️ Possível erro encontrado no HTML da página')
      }

      throw new Error('Status não foi atualizado')
    }

    console.log('\n=== TESTE FINALIZADO COM SUCESSO ===')
  })
})
