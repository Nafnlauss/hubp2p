import { expect, test } from '@playwright/test'

test('Teste do iframe Proteo na página principal', async ({ page }) => {
  console.log('🧪 [TEST] Acessando página principal...')

  // Acessar página principal
  await page.goto('http://localhost:3000')
  await page.waitForLoadState('networkidle')

  console.log('📍 [TEST] URL atual:', page.url())

  // Tirar screenshot da página
  await page.screenshot({
    path: 'tests/screenshots/01-pagina-principal.png',
    fullPage: true,
  })

  // Verificar se o header está presente
  const header = page.locator('h1:has-text("Teste do Iframe Proteo KYC")')
  await expect(header).toBeVisible()
  console.log('✅ [TEST] Header encontrado!')

  // Verificar se o iframe está presente
  const iframe = page.locator('iframe[title*="Proteo"]')
  const iframeCount = await iframe.count()
  console.log('📍 [TEST] Número de iframes encontrados:', iframeCount)

  await expect(iframe).toBeVisible()
  console.log('✅ [TEST] Iframe está visível!')

  // Pegar o src do iframe
  const iframeSource = await iframe.getAttribute('src')
  console.log('📍 [TEST] Iframe src:', iframeSource)

  // Aguardar um pouco para o iframe carregar
  await page.waitForTimeout(3000)

  // Tirar screenshot após espera
  await page.screenshot({
    path: 'tests/screenshots/02-iframe-carregado.png',
    fullPage: true,
  })

  // Verificar se há erros no console
  const consoleMessages: string[] = []
  page.on('console', (message) => {
    consoleMessages.push(`${message.type()}: ${message.text()}`)
  })

  await page.waitForTimeout(2000)

  console.log('📍 [TEST] Mensagens do console:')
  for (const message of consoleMessages) console.log('  -', message)

  // Verificar se o iframe carregou conteúdo
  // Tentar acessar o conteúdo do iframe (pode falhar por CORS/sandbox)
  try {
    const iframeElement = await iframe.elementHandle()
    if (iframeElement) {
      const frame = await iframeElement.contentFrame()
      if (frame) {
        console.log('✅ [TEST] Conseguiu acessar o conteúdo do iframe')

        // Tirar screenshot do iframe
        await page.screenshot({
          path: 'tests/screenshots/03-iframe-content.png',
          fullPage: true,
        })
      } else {
        console.log(
          '⚠️ [TEST] Não conseguiu acessar o conteúdo do iframe (pode ser CORS/sandbox)',
        )
      }
    }
  } catch (error) {
    console.log('⚠️ [TEST] Erro ao acessar iframe:', error)
  }

  console.log('✅ [TEST] Teste concluído!')
})
