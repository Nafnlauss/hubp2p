import { expect, test } from '@playwright/test'

test.describe('Debug - Acesso Admin', () => {
  test('verificar se conseguimos acessar admin-login', async ({ page }) => {
    console.log('🌐 Tentando acessar /admin-login...')

    await page.goto('http://localhost:3000/admin-login')
    await page.waitForLoadState('networkidle')

    // Tirar screenshot
    await page.screenshot({
      path: 'debug-admin-login-page.png',
      fullPage: true,
    })

    console.log('📍 URL final:', page.url())

    // Verificar título da página
    const title = await page.title()
    console.log('📄 Título da página:', title)

    // Verificar se há o texto "Painel Administrativo"
    const hasAdminPanel = await page
      .locator('text=Painel Administrativo')
      .count()
    console.log('🔍 Encontrou "Painel Administrativo":', hasAdminPanel > 0)

    // Verificar se há o texto "Área restrita"
    const hasRestrictedArea = await page.locator('text=Área restrita').count()
    console.log('🔍 Encontrou "Área restrita":', hasRestrictedArea > 0)

    // Pegar todo o HTML
    const html = await page.content()
    console.log('📄 HTML contém "admin":', html.toLowerCase().includes('admin'))

    // Verificar se redirecionou
    if (!page.url().includes('admin-login') && !page.url().includes('admin')) {
      console.log('⚠️ REDIRECIONADO para:', page.url())
    }
  })

  test('fazer login admin e verificar redirecionamento', async ({ page }) => {
    console.log('🔐 Acessando /admin-login...')

    await page.goto('http://localhost:3000/admin-login')
    await page.waitForLoadState('networkidle')

    console.log('📍 URL antes do login:', page.url())

    // Procurar campos de e-mail e senha
    const emailField = page.locator('input[type="email"]')
    const passwordField = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    console.log(
      '🔍 Campo de e-mail encontrado:',
      (await emailField.count()) > 0,
    )
    console.log(
      '🔍 Campo de senha encontrado:',
      (await passwordField.count()) > 0,
    )
    console.log('🔍 Botão submit encontrado:', (await submitButton.count()) > 0)

    if ((await emailField.count()) > 0) {
      await emailField.fill('slimc215@gmail.com')
      await passwordField.fill('123456')

      await page.screenshot({
        path: 'debug-before-admin-login.png',
        fullPage: true,
      })

      await submitButton.click()

      // Aguardar navegação ou resposta
      await page.waitForTimeout(3000)

      await page.screenshot({
        path: 'debug-after-admin-login.png',
        fullPage: true,
      })

      console.log('📍 URL após login:', page.url())

      // Verificar se redirecionou para /admin
      if (page.url().includes('/admin')) {
        console.log('✅ Redirecionado para admin com sucesso')
      } else {
        console.log('❌ NÃO redirecionou para admin')
        console.log('📍 URL final:', page.url())
      }
    } else {
      console.log('❌ Campos de login não encontrados!')
    }
  })
})
