import { expect, test } from '@playwright/test'

test('logout flow test', async ({ page }) => {
  console.log('🔵 [TEST] Iniciando teste de logout...')

  // Primeiro fazer login
  await page.goto('http://localhost:3000/pt-BR/login')
  console.log('✅ [TEST] Página de login carregada')

  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'Test123!')
  console.log('✅ [TEST] Credenciais preenchidas')

  await page.click('button[type="submit"]')
  console.log('✅ [TEST] Botão de login clicado')

  // Aguardar redirect para dashboard (ou KYC)
  await page.waitForTimeout(3000)

  const urlAfterLogin = page.url()
  console.log('📍 [TEST] URL após login:', urlAfterLogin)

  // Verificar que não está mais na página de login
  const isStillInLogin = urlAfterLogin.includes('/login')
  expect(isStillInLogin).toBe(false)
  console.log('✅ [TEST] Login bem-sucedido')

  // Agora testar o logout
  console.log('🔵 [TEST] Iniciando teste de logout...')

  // Clicar no avatar/menu do usuário
  await page.click('button:has-text("Usuário")')
  console.log('✅ [TEST] Menu do usuário aberto')

  await page.waitForTimeout(500)

  // Clicar no botão de sair e aguardar navegação
  await Promise.all([
    page.waitForURL('**/login', { timeout: 5000 }),
    page.click('button:has-text("Sair")'),
  ])
  console.log('✅ [TEST] Botão de logout clicado e navegação concluída')

  const urlAfterLogout = page.url()
  console.log('📍 [TEST] URL após logout:', urlAfterLogout)

  // Verificar que foi redirecionado para login
  const isInLoginPage = urlAfterLogout.includes('/login')
  expect(isInLoginPage).toBe(true)
  console.log('✅ [TEST] Logout bem-sucedido - redirecionado para login')

  // Tentar acessar dashboard diretamente (deve redirecionar para login)
  await page.goto('http://localhost:3000/pt-BR/dashboard')
  await page.waitForTimeout(2000)

  const finalUrl = page.url()
  console.log('📍 [TEST] URL final após tentar acessar dashboard:', finalUrl)

  const isStillInLoginPageAfterDashboardAttempt = finalUrl.includes('/login')
  expect(isStillInLoginPageAfterDashboardAttempt).toBe(true)
  console.log('✅ [TEST] Usuário não consegue acessar dashboard após logout')

  console.log('✅ [TEST] Teste de logout concluído com sucesso!')
})
