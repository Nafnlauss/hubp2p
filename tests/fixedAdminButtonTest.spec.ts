import { expect, test } from '@playwright/test'

test.describe('Teste Corrigido - Botão Pagamento Recebido', () => {
  test('deve funcionar o botão Pagamento Recebido com cookies persistidos', async ({
    page,
  }) => {
    const TRANSACTION_ID = 'b3073106-aafd-4dc8-a152-3648a07e6347'

    console.log('=== INICIANDO TESTE COM PERSISTÊNCIA DE COOKIES ===')

    // 1. Login como admin
    console.log('1️⃣ Fazendo login...')
    await page.goto('http://localhost:3001/admin-login')
    await page.fill('input[type="email"]', 'slimc215@gmail.com')
    await page.fill('input[type="password"]', '123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin**', { timeout: 10_000 })
    console.log('✅ Login OK')

    // 2. Verificar cookies após login
    const cookies = await page.context().cookies()
    console.log('🍪 Cookies após login:')
    for (const cookie of cookies) {
      console.log(`  - ${cookie.name}: ${cookie.value.slice(0, 20)}...`)
    }

    const adminCookie = cookies.find((c) => c.name === 'admin_session')
    if (!adminCookie) {
      console.log('❌ Cookie admin_session não encontrado!')
      throw new Error('Cookie de admin não foi criado')
    }
    console.log(`✅ Cookie admin_session encontrado: ${adminCookie.value}`)

    // 3. Aguardar um pouco para garantir que o cookie está setado
    await page.waitForTimeout(1000)

    // 4. Navegar para página de transações primeiro (intermediária)
    console.log('2️⃣ Navegando para lista de transações...')
    await page.goto('http://localhost:3001/admin/transactions')
    await page.waitForLoadState('networkidle')
    console.log(`📍 URL atual: ${page.url()}`)

    // 5. Agora navegar para página de detalhes
    console.log('3️⃣ Acessando página de detalhes da transação...')
    const detailsUrl = `http://localhost:3001/pt-BR/admin/transactions/${TRANSACTION_ID}`
    await page.goto(detailsUrl)
    await page.waitForLoadState('networkidle')

    // Esperar a página carregar
    await page.waitForTimeout(2000)

    console.log(`📍 URL atual: ${page.url()}`)

    // 6. Verificar se ainda temos os cookies
    const cookiesAfterNav = await page.context().cookies()
    const adminCookieAfterNav = cookiesAfterNav.find(
      (c) => c.name === 'admin_session',
    )
    console.log(
      `🍪 Cookie admin_session após navegação: ${adminCookieAfterNav ? 'PRESENTE' : 'AUSENTE'}`,
    )

    // 7. Tirar screenshot
    await page.screenshot({ path: 'test-fixed-page.png', fullPage: true })
    console.log('📸 Screenshot salvo: test-fixed-page.png')

    // 8. Procurar o botão
    console.log('4️⃣ Procurando botão "Pagamento Recebido"...')

    // Tentar encontrar de várias formas
    let buttonFound = false
    let button

    // Tentar por texto exato
    button = page.getByRole('button', { name: 'Pagamento Recebido' })
    if ((await button.count()) > 0) {
      console.log('✅ Botão encontrado por role + name')
      buttonFound = true
    }

    // Se não encontrou, tentar por texto parcial
    if (!buttonFound) {
      button = page.getByText('Pagamento Recebido')
      if ((await button.count()) > 0) {
        console.log('✅ Botão encontrado por texto')
        buttonFound = true
      }
    }

    // Se ainda não encontrou, listar todos os botões
    if (!buttonFound) {
      console.log('❌ Botão não encontrado! Listando todos os botões:')
      const allButtons = await page.locator('button').all()
      for (const button_ of allButtons) {
        const text = await button_.textContent()
        console.log(`  - Botão: "${text}"`)
      }

      throw new Error('Botão "Pagamento Recebido" não foi encontrado')
    }

    // 9. Verificar se está habilitado
    const isDisabled = await button.isDisabled()
    console.log(`🔘 Botão está ${isDisabled ? 'DESABILITADO' : 'HABILITADO'}`)

    if (isDisabled) {
      console.log(
        '⚠️ Botão está desabilitado. Status da transação deve não ser "pending_payment"',
      )
      throw new Error('Botão está desabilitado')
    }

    // 10. Clicar no botão
    console.log('5️⃣ Clicando no botão...')
    await button.click()
    console.log('✅ Clique realizado')

    // 11. Esperar atualização
    await page.waitForTimeout(3000)

    // 12. Screenshot após clique
    await page.screenshot({
      path: 'test-fixed-after-click.png',
      fullPage: true,
    })
    console.log('📸 Screenshot após clique: test-fixed-after-click.png')

    // 13. Verificar se status mudou
    console.log('6️⃣ Verificando se status foi atualizado...')

    // Procurar por badges de status
    const statusBadges = page.locator('[class*="badge"]')
    const badgeCount = await statusBadges.count()
    console.log(`📊 Encontrados ${badgeCount} badges na página`)

    if (badgeCount > 0) {
      const firstBadge = statusBadges.first()
      const statusText = await firstBadge.textContent()
      console.log(`📊 Status atual: "${statusText}"`)

      // Verificar se mudou para um dos status esperados
      const expectedStatuses = ['Pagamento Recebido', 'Convertendo', 'Enviado']
      const statusChanged = expectedStatuses.some((expected) =>
        statusText?.includes(expected),
      )

      if (statusChanged) {
        console.log('✅ ✅ ✅ SUCESSO! Status foi atualizado! ✅ ✅ ✅')
      } else {
        console.log(`❌ Status não mudou. Atual: "${statusText}"`)
        throw new Error(
          `Status não foi atualizado. Esperado: um de ${expectedStatuses.join(', ')}. Obtido: ${statusText}`,
        )
      }

      expect(statusChanged).toBe(true)
    } else {
      console.log('❌ Nenhum badge de status encontrado')
      throw new Error('Não foi possível verificar o status')
    }

    console.log('=== TESTE FINALIZADO COM SUCESSO ===')
  })
})
