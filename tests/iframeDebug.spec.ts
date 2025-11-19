import { expect, test } from '@playwright/test'

test('Debug iframe do Proteo', async ({ page }) => {
  console.log('🧪 [TEST] Testando página do iframe Proteo')

  // Passo 1: Fazer login primeiro
  console.log('📍 [TEST] Fazendo login...')
  await page.goto('http://localhost:3001/pt-BR/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'Test123!')
  await page.click('button[type="submit"]')

  // Aguardar login completar
  await page.waitForTimeout(3000)
  const urlAfterLogin = page.url()
  console.log(`📍 [TEST] URL após login: ${urlAfterLogin}`)

  // Passo 2: Ir para a página do iframe
  await page.goto('http://localhost:3001/pt-BR/kyc/proteo')
  console.log('📍 [TEST] Navegou para /kyc/proteo')

  // Esperar um pouco para página carregar
  await page.waitForTimeout(3000)

  // Tirar screenshot
  await page.screenshot({ path: 'debug-proteo.png', fullPage: true })
  console.log('📸 [TEST] Screenshot salvo como debug-proteo.png')

  // Verificar o HTML da página
  const bodyHTML = await page.locator('body').innerHTML()
  console.log('📝 [TEST] HTML da página (primeiros 1000 chars):')
  console.log(bodyHTML.slice(0, 1000))

  // Verificar se há texto de loading
  const loadingText = await page.locator('text=Carregando').count()
  console.log(`📍 [TEST] Texto "Carregando" encontrado: ${loadingText} vezes`)

  // Verificar se há iframes
  const iframes = await page.locator('iframe').count()
  console.log(`📍 [TEST] Número de iframes: ${iframes}`)

  // Se não houver iframe, esperar mais um pouco
  if (iframes === 0) {
    console.log('⏳ [TEST] Aguardando mais 5 segundos...')
    await page.waitForTimeout(5000)

    const iframesAfterWait = await page.locator('iframe').count()
    console.log(`📍 [TEST] Número de iframes após espera: ${iframesAfterWait}`)

    // Tirar outro screenshot
    await page.screenshot({
      path: 'debug-proteo-after-wait.png',
      fullPage: true,
    })
    console.log('📸 [TEST] Screenshot após espera salvo')
  }

  // Verificar elementos visíveis na página
  const visibleElements = await page.locator('body *:visible').count()
  console.log(`📍 [TEST] Elementos visíveis na página: ${visibleElements}`)

  // Verificar se há erro
  const errorMessage = await page.locator('text=Erro ao Carregar').count()
  console.log(`❌ [TEST] Mensagem de erro encontrada: ${errorMessage} vezes`)

  // Log final
  console.log('✅ [TEST] Teste de debug concluído')

  // Não fazer expect para não falhar - só debug
  expect(true).toBe(true)
})
