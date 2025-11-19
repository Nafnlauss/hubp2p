import { test, expect } from '@playwright/test'

test('login flow test', async ({ page }) => {
  console.log('🔵 [TEST] Iniciando teste de login...')

  // Navegar para a página de login
  await page.goto('http://localhost:3000/pt-BR/login')
  console.log('✅ [TEST] Página de login carregada')

  // Preencher credenciais
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'Test123!')
  console.log('✅ [TEST] Credenciais preenchidas')

  // Tirar screenshot antes do login
  await page.screenshot({ path: 'tests/screenshots/before-login.png', fullPage: true })

  // Clicar no botão de login
  await page.click('button[type="submit"]')
  console.log('✅ [TEST] Botão de login clicado')

  // Aguardar navegação ou mensagem
  await page.waitForTimeout(3000)

  // Tirar screenshot após login
  await page.screenshot({ path: 'tests/screenshots/after-login.png', fullPage: true })

  // Verificar URL atual
  const currentUrl = page.url()
  console.log('📍 [TEST] URL atual:', currentUrl)

  // Verificar se redirecionou para dashboard ou kyc
  const isInDashboard = currentUrl.includes('/dashboard')
  const isInKyc = currentUrl.includes('/kyc')
  const isStillInLogin = currentUrl.includes('/login')

  console.log('🔍 [TEST] Status:', {
    isInDashboard,
    isInKyc,
    isStillInLogin,
    url: currentUrl
  })

  // O teste passa se não ficou em loop no login
  expect(isStillInLogin).toBe(false)

  console.log('✅ [TEST] Teste concluído com sucesso!')
})
