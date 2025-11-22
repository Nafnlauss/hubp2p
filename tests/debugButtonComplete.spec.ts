import { expect, test } from '@playwright/test'

test.describe('Debug Completo - Botão Pagamento Recebido', () => {
  test('diagnosticar e testar botão até funcionar', async ({ page }) => {
    const TRANSACTION_ID = 'b3073106-aafd-4dc8-a152-3648a07e6347'

    console.log('=== TESTE DE DEBUG COMPLETO ===')

    // 1. Login
    console.log('\n1️⃣ FAZENDO LOGIN...')
    await page.goto('http://localhost:3001/admin-login')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="email"]', 'slimc215@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin**', { timeout: 10_000 })
    console.log('✅ Login realizado com sucesso')

    // 2. Verificar cookies
    console.log('\n2️⃣ VERIFICANDO COOKIES...')
    const cookies = await page.context().cookies()
    const adminCookie = cookies.find((c) => c.name === 'admin_session')

    if (!adminCookie) {
      console.log('❌ Cookie admin_session NÃO encontrado!')
      console.log(
        'Cookies disponíveis:',
        cookies.map((c) => c.name),
      )
      throw new Error('Cookie de admin não foi criado')
    }

    console.log(`✅ Cookie admin_session: ${adminCookie.value}`)

    // 3. Navegar para página de detalhes
    console.log('\n3️⃣ NAVEGANDO PARA PÁGINA DE DETALHES...')
    const detailsUrl = `http://localhost:3001/admin/transactions/${TRANSACTION_ID}`

    // Interceptar requisições para ver se o Server Action está sendo chamado
    const serverActionRequests: any[] = []
    page.on('request', (request) => {
      if (
        request.url().includes('/admin/transactions') &&
        request.method() === 'POST'
      ) {
        console.log('📡 Server Action chamado:', request.url())
        serverActionRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
        })
      }
    })

    page.on('response', async (response) => {
      if (
        response.url().includes('/admin/transactions') &&
        response.request().method() === 'POST'
      ) {
        console.log('📥 Resposta do Server Action:', response.status())
        try {
          const text = await response.text()
          console.log('📄 Corpo da resposta:', text.slice(0, 200))
        } catch {
          console.log('⚠️ Não foi possível ler corpo da resposta')
        }
      }
    })

    await page.goto(detailsUrl)
    await page.waitForLoadState('networkidle')
    console.log(`✅ Página carregada: ${page.url()}`)

    // 4. Tirar screenshot inicial
    await page.screenshot({ path: 'debug-before-click.png', fullPage: true })
    console.log('📸 Screenshot salvo: debug-before-click.png')

    // 5. Verificar se estamos na página correta
    console.log('\n4️⃣ VERIFICANDO CONTEÚDO DA PÁGINA...')
    const pageTitle = await page.textContent('h1')
    console.log(`📄 Título da página: "${pageTitle}"`)

    // 6. Procurar o botão
    console.log('\n5️⃣ PROCURANDO BOTÃO...')

    // Listar TODOS os botões
    const allButtons = await page.locator('button').all()
    console.log(`🔍 Total de botões encontrados: ${allButtons.length}`)

    for (const [index, allButton] of allButtons.entries()) {
      const text = await allButton.textContent()
      const isVisible = await allButton.isVisible()
      const isDisabled = await allButton.isDisabled()
      console.log(
        `  Botão ${index + 1}: "${text?.trim()}" | Visível: ${isVisible} | Desabilitado: ${isDisabled}`,
      )
    }

    // Procurar especificamente o botão "Pagamento Recebido"
    const paymentButton = page.getByRole('button', {
      name: /pagamento recebido/i,
    })
    const buttonCount = await paymentButton.count()

    if (buttonCount === 0) {
      console.log('❌ Botão "Pagamento Recebido" NÃO encontrado!')

      // Verificar o status da transação
      const statusBadges = await page
        .locator('[class*="badge"]')
        .allTextContents()
      console.log('📊 Status badges na página:', statusBadges)

      throw new Error('Botão não encontrado. Verifique o status da transação.')
    }

    console.log(`✅ Botão "Pagamento Recebido" encontrado (${buttonCount}x)`)

    // 7. Verificar estado do botão
    console.log('\n6️⃣ VERIFICANDO ESTADO DO BOTÃO...')
    const isDisabled = await paymentButton.isDisabled()
    const isVisible = await paymentButton.isVisible()

    console.log(`  Visível: ${isVisible}`)
    console.log(`  Desabilitado: ${isDisabled}`)

    if (isDisabled) {
      console.log('⚠️ BOTÃO ESTÁ DESABILITADO!')

      // Mostrar o status atual da transação
      const statusBadges = await page
        .locator('[class*="badge"]')
        .allTextContents()
      console.log('📊 Status atual:', statusBadges)

      throw new Error(
        'Botão está desabilitado. O status da transação pode não ser "pending_payment"',
      )
    }

    // 8. Clicar no botão
    console.log('\n7️⃣ CLICANDO NO BOTÃO...')
    await paymentButton.click()
    console.log('✅ Clique executado!')

    // 9. Aguardar resposta
    console.log('\n8️⃣ AGUARDANDO RESPOSTA...')
    await page.waitForTimeout(3000)

    // 10. Verificar se houve Server Action
    console.log('\n9️⃣ VERIFICANDO SERVER ACTIONS...')
    console.log(
      `📊 Total de Server Actions detectados: ${serverActionRequests.length}`,
    )

    if (serverActionRequests.length > 0) {
      for (const [index, request] of serverActionRequests.entries()) {
        console.log(`  Request ${index + 1}:`, request.url)
      }
    } else {
      console.log('⚠️ NENHUM Server Action foi chamado!')
    }

    // 11. Screenshot após clique
    await page.screenshot({ path: 'debug-after-click.png', fullPage: true })
    console.log('📸 Screenshot após clique: debug-after-click.png')

    // 12. Verificar mudança de status
    console.log('\n🔟 VERIFICANDO MUDANÇA DE STATUS...')
    const statusAfter = await page
      .locator('[class*="badge"]')
      .first()
      .textContent()
    console.log(`📊 Status após clique: "${statusAfter}"`)

    // Verificar se mudou
    const expectedStatuses = ['Pagamento Recebido', 'Convertendo', 'Enviado']
    const hasChanged = expectedStatuses.some((status) =>
      statusAfter?.toLowerCase().includes(status.toLowerCase()),
    )

    if (hasChanged) {
      console.log('\n✅ ✅ ✅ SUCESSO! STATUS MUDOU! ✅ ✅ ✅')
    } else {
      console.log('\n❌ STATUS NÃO MUDOU!')
      console.log('Esperado um de:', expectedStatuses)
      console.log('Obtido:', statusAfter)
      throw new Error('Status não foi atualizado')
    }

    console.log('\n=== TESTE FINALIZADO COM SUCESSO ===')
  })
})
