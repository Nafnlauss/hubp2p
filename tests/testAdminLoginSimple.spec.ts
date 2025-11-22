import { expect, test } from '@playwright/test'

test.describe('Teste Simples - Login Admin', () => {
  test('verificar se adminLogin é chamado', async ({ page }) => {
    // Capturar logs do console
    const consoleLogs: string[] = []
    const consoleErrors: string[] = []

    page.on('console', (message) => {
      const text = message.text()
      console.log(`[BROWSER CONSOLE ${message.type()}]:`, text)
      consoleLogs.push(text)
    })

    page.on('pageerror', (error) => {
      console.error('[BROWSER ERROR]:', error.message)
      consoleErrors.push(error.message)
    })

    console.log('\n=== TESTE LOGIN ADMIN SIMPLES ===\n')

    // 1. Ir para página de login
    console.log('1️⃣ Navegando para /admin-login...')
    await page.goto('http://localhost:3001/admin-login')
    await page.waitForLoadState('networkidle')

    // 2. Preencher formulário
    console.log('2️⃣ Preenchendo formulário...')
    await page.fill('input[type="email"]', 'slimc215@gmail.com')
    await page.fill('input[type="password"]', '123456')

    // 3. Clicar em submit
    console.log('3️⃣ Clicando em submit...')
    await page.click('button[type="submit"]')

    // 4. Aguardar
    console.log('4️⃣ Aguardando processamento...')
    await page.waitForTimeout(5000)

    // 5. Verificar console logs
    console.log('\n📊 CONSOLE LOGS:')
    for (const [index, log] of consoleLogs.entries()) {
      console.log(`  ${index + 1}. ${log}`)
    }

    console.log('\n❌ CONSOLE ERRORS:')
    if (consoleErrors.length === 0) {
      console.log('  Nenhum erro detectado')
    } else {
      for (const [index, error] of consoleErrors.entries()) {
        console.log(`  ${index + 1}. ${error}`)
      }
    }

    // 6. Verificar URL
    const currentUrl = page.url()
    console.log(`\n📍 URL atual: ${currentUrl}`)

    // 7. Verificar cookies
    const cookies = await page.context().cookies()
    const adminCookie = cookies.find((c) => c.name === 'admin_session')
    console.log(
      `\n🍪 Cookie admin_session: ${adminCookie ? 'PRESENTE - ' + adminCookie.value : 'AUSENTE'}`,
    )

    // 8. Screenshot
    await page.screenshot({
      path: 'test-admin-login-simple.png',
      fullPage: true,
    })
    console.log('\n📸 Screenshot salvo: test-admin-login-simple.png')

    console.log('\n=== TESTE FINALIZADO ===\n')
  })
})
