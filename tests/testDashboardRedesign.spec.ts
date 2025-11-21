import { expect, test } from '@playwright/test'

test.describe('Dashboard Redesign Test', () => {
  test('should login and verify dashboard with new design', async ({
    page,
  }) => {
    // Ir para a página de login
    await page.goto('http://localhost:3000/pt-BR/login')

    console.log('📍 Navegando para página de login...')

    // Fazer login com as credenciais de teste
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Test123456!')
    await page.click('button[type="submit"]')

    console.log('🔐 Fazendo login...')

    // Aguardar redirecionamento para o dashboard
    await page.waitForURL('**/dashboard', { timeout: 10_000 })

    console.log('✅ Redirecionado para o dashboard')

    // Verificar se o título do dashboard está visível com gradiente
    const dashboardTitle = page.locator('h1:has-text("Dashboard")')
    await expect(dashboardTitle).toBeVisible()
    console.log('✅ Título do dashboard encontrado')

    // Verificar se os 3 cards estão visíveis
    await expect(
      page.getByRole('heading', { name: 'Total Depositado' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Transações Pendentes' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Transações Concluídas' }),
    ).toBeVisible()
    console.log('✅ Todos os 3 cards estão visíveis')

    // Verificar se o botão "Novo Depósito" está visível no topo
    const novoDepositoButton = page
      .locator('button:has-text("Novo Depósito"), a:has-text("Novo Depósito")')
      .first()
    await expect(novoDepositoButton).toBeVisible()
    console.log('✅ Botão "Novo Depósito" encontrado')

    // Verificar se a seção "Transações Recentes" está visível
    await expect(page.locator('text=Transações Recentes')).toBeVisible()
    console.log('✅ Seção "Transações Recentes" encontrada')

    // Verificar navegação simplificada (3 itens apenas)
    // Dashboard, Novo Depósito, Minhas Transações
    const navItems = ['Dashboard', 'Novo Depósito', 'Minhas Transações']

    for (const item of navItems) {
      const navLink = page.locator(`nav a:has-text("${item}")`).first()
      await expect(navLink).toBeVisible()
      console.log(`✅ Item de navegação "${item}" encontrado`)
    }

    // Verificar que o item "Perfil" NÃO existe mais na navegação
    const perfilLink = page.locator('nav a:has-text("Perfil")')
    await expect(perfilLink).toHaveCount(0)
    console.log('✅ Item "Perfil" removido da navegação')

    // Verificar dropdown do usuário
    const userButton = page
      .locator('button:has-text("Test User")')
      .or(page.locator('button:has-text("TU")'))
      .first()
    await userButton.click()
    console.log('🔽 Dropdown do usuário aberto')

    // Verificar se o nome e email do usuário estão no dropdown
    const dropdownMenu = page.locator('[role="menu"]')
    await expect(dropdownMenu.locator('text=Test User').first()).toBeVisible()
    await expect(dropdownMenu.locator('text=test@example.com')).toBeVisible()
    console.log('✅ Nome e email do usuário encontrados no dropdown')

    // Verificar se o botão de Logout está no dropdown
    const logoutButton = page.locator('button:has-text("Sair")')
    await expect(logoutButton).toBeVisible()
    console.log('✅ Botão de Logout encontrado no dropdown')

    // Fechar dropdown pressionando Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Testar navegação para "Novo Depósito"
    const novoDepositoLink = page
      .locator('a[href*="/dashboard/deposit"]')
      .first()
    await novoDepositoLink.click()
    await page.waitForURL('**/dashboard/deposit', { timeout: 10_000 })
    console.log('✅ Navegou para página de Novo Depósito')

    // Voltar para o dashboard
    const dashboardLink = page.locator('a[href$="/dashboard"]').first()
    await dashboardLink.click()
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    console.log('✅ Voltou para o dashboard')

    // Testar navegação para "Minhas Transações"
    const transacoesLink = page
      .locator('a[href*="/dashboard/transactions"]')
      .first()
    await transacoesLink.click()
    await page.waitForURL('**/dashboard/transactions', { timeout: 10_000 })
    console.log('✅ Navegou para página de Minhas Transações')

    // Tirar screenshot final do dashboard
    await page.goto('http://localhost:3000/pt-BR/dashboard')
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: 'dashboard-redesign-final.png',
      fullPage: true,
    })
    console.log(
      '📸 Screenshot do dashboard salvo em dashboard-redesign-final.png',
    )

    console.log('\n🎉 Todos os testes do dashboard redesenhado passaram!')
  })
})
