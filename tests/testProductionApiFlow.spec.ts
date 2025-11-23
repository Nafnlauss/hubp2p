import { expect, test } from '@playwright/test'

test.describe('Production API Transaction Flow', () => {
  test('should create transaction and redirect to payment page on production', async ({
    page,
  }) => {
    // Ir para página de compra em PRODUÇÃO
    await page.goto('https://api.hubp2p.com/pt-BR/comprar')

    console.log('📝 Página de produção carregada')

    // Aguardar o formulário carregar
    await page.waitForSelector('input[id="brl-amount"]', { timeout: 10_000 })

    console.log('✅ Formulário encontrado')

    // Preencher valor BRL
    const brlInput = page.locator('input[id="brl-amount"]')
    await brlInput.clear()
    await brlInput.fill('R$ 100,00')

    console.log('💰 Valor BRL preenchido')

    // Aguardar cálculo do USD
    await page.waitForTimeout(2000)

    // Preencher endereço de carteira
    const walletInput = page.locator('input[name="wallet_address"]')
    await walletInput.fill('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')

    console.log('🔑 Endereço de carteira preenchido')

    // Aguardar um pouco para garantir que tudo está preenchido
    await page.waitForTimeout(500)

    // Capturar logs do console
    page.on('console', (message) => {
      console.log(`🖥️ Console (${message.type()}):`, message.text())
    })

    // Capturar erros
    page.on('pageerror', (error) => {
      console.error('❌ Page Error:', error.message)
    })

    // Capturar requisições de rede
    const responses: Array<{ url: string; status: number }> = []
    page.on('response', async (response) => {
      const url = response.url()
      responses.push({ url, status: response.status() })
      console.log(`🌐 Response: ${url} - ${response.status()}`)
    })

    // Capturar URL antes do submit
    const urlBeforeSubmit = page.url()
    console.log('🔗 URL ANTES do submit:', urlBeforeSubmit)

    // Clicar no botão de gerar chave PIX
    const submitButton = page.locator('button[type="submit"]')
    console.log('🔘 Clicando no botão de criar transação...')

    // Verificar se o botão está habilitado
    const isEnabled = await submitButton.isEnabled()
    console.log('🔘 Botão habilitado:', isEnabled)

    await submitButton.click()

    // Aguardar processamento e possível redirecionamento
    console.log('⏳ Aguardando 5 segundos...')
    await page.waitForTimeout(5000)

    // Verificar URL atual
    const currentUrl = page.url()
    console.log('🔗 URL APÓS submit:', currentUrl)

    // Verificar se houve mudança de URL
    if (currentUrl === urlBeforeSubmit) {
      console.log('❌ URL NÃO MUDOU - permaneceu na mesma página')
    } else {
      console.log('✅ URL MUDOU - houve navegação')
    }

    // Verificar se redirecionou para a página de pagamento
    const expectedPattern = /\/pt-BR\/comprar\/[\da-f-]+/

    if (expectedPattern.test(currentUrl)) {
      console.log('✅ Redirecionamento FUNCIONOU!')
    } else {
      console.log(
        '❌ Redirecionamento NÃO FUNCIONOU - ainda na página:',
        currentUrl,
      )

      // Capturar screenshot para debug
      await page.screenshot({
        path: 'debug-production-no-redirect.png',
        fullPage: true,
      })
      console.log('📸 Screenshot salvo em debug-production-no-redirect.png')

      // Listar todas as respostas recebidas
      console.log('\n📋 Todas as respostas HTTP recebidas:')
      for (const resp of responses) {
        console.log(`   ${resp.status} - ${resp.url}`)
      }
    }

    // Verificar se há mensagem de erro ou toast
    const toastMessage = page.locator('[role="status"]').first()
    if (await toastMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      const toastText = await toastMessage.textContent()
      console.log('💬 Toast message:', toastText)
    }

    // Capturar HTML do body para debug
    const bodyText = await page.locator('body').textContent()
    console.log(
      '\n📄 Conteúdo da página (primeiros 500 chars):',
      bodyText?.slice(0, 500),
    )

    // Asserção - vai falhar se não redirecionar
    expect(currentUrl).toMatch(expectedPattern)
  })
})
