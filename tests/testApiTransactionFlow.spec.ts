import { expect, test } from '@playwright/test'

test.describe('API Transaction Flow', () => {
  test('should create transaction and redirect to payment page', async ({
    page,
  }) => {
    // Ir para página de compra
    await page.goto('http://localhost:3000/pt-BR/comprar')

    // Aguardar o formulário carregar
    await page.waitForSelector('input[id="brl-amount"]')

    console.log('📝 Página carregada')

    // Preencher valor BRL
    const brlInput = page.locator('input[id="brl-amount"]')
    await brlInput.clear()
    await brlInput.fill('R$ 100,00')

    console.log('💰 Valor BRL preenchido')

    // Aguardar cálculo do USD
    await page.waitForTimeout(1000)

    // Selecionar rede crypto (já vem Bitcoin por padrão)
    console.log('⛓️ Rede crypto: Bitcoin (padrão)')

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
    page.on('response', async (response) => {
      if (response.url().includes('comprar')) {
        console.log(`🌐 Response: ${response.url()} - ${response.status()}`)
        try {
          const body = await response.text()
          if (body) {
            console.log('📦 Response body:', body.slice(0, 200))
          }
        } catch {
          // Ignore
        }
      }
    })

    // Clicar no botão de gerar chave PIX
    const submitButton = page.locator('button[type="submit"]')
    console.log('🔘 Clicando no botão de criar transação...')

    await submitButton.click()

    // Aguardar um pouco para processar
    await page.waitForTimeout(3000)

    // Verificar se houve redirecionamento
    const currentUrl = page.url()
    console.log('🔗 URL atual após submit:', currentUrl)

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
        path: 'debug-api-no-redirect.png',
        fullPage: true,
      })
      console.log('📸 Screenshot salvo em debug-api-no-redirect.png')
    }

    // Verificar se há mensagem de erro ou sucesso
    const toastMessage = page.locator('[role="status"]').first()
    if (await toastMessage.isVisible()) {
      const toastText = await toastMessage.textContent()
      console.log('💬 Toast message:', toastText)
    }

    // Asserção
    expect(currentUrl).toMatch(expectedPattern)
  })
})
