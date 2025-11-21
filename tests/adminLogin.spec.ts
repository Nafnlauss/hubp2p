import { expect, test } from '@playwright/test'

test('Admin login should redirect to admin dashboard', async ({ page }) => {
  // Navegar para a página de login do admin
  await page.goto('http://localhost:3000/admin-login')

  // Verificar que estamos na página de login
  await expect(page).toHaveURL(/\/admin-login/)

  // Aguardar o formulário carregar
  await page.waitForSelector('input[type="email"]')

  // Preencher o formulário
  await page.fill('input[type="email"]', 'slimc215@gmail.com')
  await page.fill('input[type="password"]', '62845_Madhouse')

  // Clicar no botão de login
  await page.click('button[type="submit"]')

  // Aguardar redirecionamento para o painel admin
  await page.waitForURL('**/admin', { timeout: 10_000 })

  // Verificar que estamos no painel admin
  await expect(page).toHaveURL(/\/admin$/)

  // Aguardar a página carregar completamente
  await page.waitForLoadState('networkidle')

  // Verificar elementos do painel admin
  await expect(page.getByText('Admin HubP2P')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Transações' })).toBeVisible()

  console.log('✅ Login do admin funcionou corretamente!')
})
