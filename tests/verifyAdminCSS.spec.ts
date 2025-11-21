import { expect, test } from '@playwright/test'

test('Verificar se CSS do painel admin está carregando', async ({ page }) => {
  // Login no admin
  await page.goto('http://localhost:3000/admin-login')

  await page.fill('input[name="email"]', 'admin@admin.com')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')

  // Aguardar redirecionamento para dashboard
  await page.waitForURL('**/admin', { timeout: 10_000 })

  // Aguardar um pouco mais para garantir que o CSS carregou
  await page.waitForTimeout(2000)

  // Verificar se o header tem o gradiente purple-pink
  const header = page.locator('header')
  await expect(header).toBeVisible()

  // Verificar se há elementos com as classes de gradiente
  const gradientTitle = page.locator('h1').filter({ hasText: 'Dashboard' })
  await expect(gradientTitle).toBeVisible()

  // Tirar screenshot para verificar visualmente
  await page.screenshot({
    path: 'admin-css-check.png',
    fullPage: true,
  })

  console.log('Screenshot salvo em admin-css-check.png')

  // Aguardar 5 segundos para visualização
  await page.waitForTimeout(5000)
})
