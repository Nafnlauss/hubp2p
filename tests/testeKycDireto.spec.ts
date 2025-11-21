import { test } from '@playwright/test'

test('Teste acesso direto à página KYC', async ({ page }) => {
  console.log('🧪 [TEST] Acessando página KYC diretamente...')

  // Capturar console do navegador
  page.on('console', (message) => {
    const text = message.text()
    if (
      text.includes('[PROTEO') ||
      text.includes('[KYC PAGE]') ||
      text.includes('CPF')
    ) {
      console.log(`📱 [BROWSER] ${text}`)
    }
  })

  // Capturar erros
  page.on('pageerror', (error) => {
    console.log(`💥 [PAGE ERROR] ${error.message}`)
  })

  // Acessar a página KYC
  await page.goto('http://localhost:3000/pt-BR/kyc')
  await page.waitForLoadState('networkidle')

  // Aguardar 5 segundos para ver os logs
  await page.waitForTimeout(5000)

  console.log('📍 [TEST] URL final:', page.url())

  // Verificar se há iframe
  const iframe = page.locator('iframe[title*="Proteo"]')
  const iframeCount = await iframe.count()
  console.log(`📍 [TEST] Iframes encontrados: ${iframeCount}`)

  if (iframeCount > 0) {
    const iframeSource = await iframe.getAttribute('src')
    console.log(`🔗 [TEST] URL do iframe: ${iframeSource}`)
  }

  // Screenshot
  await page.screenshot({
    path: 'tests/screenshots/kyc-direto.png',
    fullPage: true,
  })
})
