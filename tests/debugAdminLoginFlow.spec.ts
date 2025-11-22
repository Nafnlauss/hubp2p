import { expect, test } from '@playwright/test'

test.describe('Debug - Admin Login Flow', () => {
  test('rastrear cada passo do login admin', async ({ page }) => {
    // Monitorar todas as navegações
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        console.log(`🌐 Navegou para: ${frame.url()}`)
      }
    })

    // Monitorar redirecionamentos
    page.on('response', async (response) => {
      if (response.status() >= 300 && response.status() < 400) {
        console.log(
          `🔄 Redirecionamento ${response.status()}: ${response.url()} -> ${response.headers().location || 'desconhecido'}`,
        )
      }
    })

    console.log('\n=== PASSO 1: Acessar página de login admin ===')
    await page.goto('http://localhost:3001/admin-login')
    await page.waitForLoadState('networkidle')
    console.log(`📍 URL atual: ${page.url()}`)
    console.log(`📄 Título: ${await page.title()}`)

    // Screenshot antes do login
    await page.screenshot({
      path: 'debug-admin-1-before-login.png',
      fullPage: true,
    })

    console.log('\n=== PASSO 2: Verificar campos de login ===')
    const emailField = page.locator('input[type="email"]')
    const passwordField = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')

    console.log(`✓ Campo email: ${(await emailField.count()) > 0}`)
    console.log(`✓ Campo senha: ${(await passwordField.count()) > 0}`)
    console.log(`✓ Botão submit: ${(await submitButton.count()) > 0}`)

    console.log('\n=== PASSO 3: Preencher credenciais ===')
    await emailField.fill('slimc215@gmail.com')
    await passwordField.fill('123456')
    console.log('✓ Credenciais preenchidas')

    console.log('\n=== PASSO 4: Clicar no botão de login ===')
    await submitButton.click()
    console.log('✓ Botão clicado')

    // Aguardar um pouco para ver o que acontece
    console.log('\n=== PASSO 5: Aguardando navegação/resposta (3s) ===')
    await page.waitForTimeout(3000)

    console.log(`📍 URL após login: ${page.url()}`)
    console.log(`📄 Título após login: ${await page.title()}`)

    // Screenshot após login
    await page.screenshot({
      path: 'debug-admin-2-after-login.png',
      fullPage: true,
    })

    // Verificar cookies
    console.log('\n=== PASSO 6: Verificar cookies ===')
    const cookies = await page.context().cookies()
    const adminCookie = cookies.find((c) => c.name === 'admin_session')
    console.log(
      `🍪 Admin session cookie: ${adminCookie ? '✓ EXISTE' : '✗ NÃO EXISTE'}`,
    )
    if (adminCookie) {
      console.log(`   - Value: ${adminCookie.value.slice(0, 20)}...`)
      console.log(`   - Path: ${adminCookie.path}`)
      console.log(`   - Domain: ${adminCookie.domain}`)
    }

    // Listar todos os cookies
    console.log(`\n📋 Total de cookies: ${cookies.length}`)
    for (const cookie of cookies) {
      console.log(`   - ${cookie.name}: ${cookie.value.slice(0, 30)}...`)
    }

    console.log('\n=== PASSO 7: Tentar acessar página admin diretamente ===')
    await page.goto('http://localhost:3001/pt-BR/admin/transactions')
    await page.waitForLoadState('networkidle')
    console.log(`📍 URL final: ${page.url()}`)

    await page.screenshot({
      path: 'debug-admin-3-direct-access.png',
      fullPage: true,
    })

    // Verificar se há texto de admin
    const hasAdminText = await page
      .locator('text=Painel Administrativo')
      .count()
    const hasTransacoesText = await page.locator('text=Transações').count()
    const hasGerenciarText = await page
      .locator('text=Gerenciar Transações')
      .count()

    console.log('\n=== RESULTADO ===')
    console.log(`📍 URL final: ${page.url()}`)
    console.log(
      `🔍 Texto "Painel Administrativo": ${hasAdminText > 0 ? '✓' : '✗'}`,
    )
    console.log(`🔍 Texto "Transações": ${hasTransacoesText > 0 ? '✓' : '✗'}`)
    console.log(
      `🔍 Texto "Gerenciar Transações": ${hasGerenciarText > 0 ? '✓' : '✗'}`,
    )

    if (page.url().includes('/admin')) {
      console.log('\n✅ SUCESSO: Acesso ao painel admin confirmado')
    } else {
      console.log('\n❌ FALHA: Não conseguiu acessar painel admin')
      console.log(`Redirecionado para: ${page.url()}`)
    }
  })
})
