import { expect, test } from '@playwright/test'

test.describe('Payment Accounts - PIX e TED', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('http://localhost:3000/admin-login')

    // Preencher credenciais de admin
    await page.fill('input[type="email"]', 'slimc215@gmail.com')
    await page.fill('input[type="password"]', '62845_Madhouse')
    await page.click('button[type="submit"]')

    // Aguardar redirecionamento
    await page.waitForURL('**/admin', { timeout: 10_000 })

    // Navegar para payment-accounts
    await page.goto('http://localhost:3000/admin/payment-accounts')
    await page.waitForLoadState('networkidle')
  })

  test('deve adicionar chave PIX com sucesso', async ({ page }) => {
    console.log('🔍 Testando adicionar chave PIX...')

    // Clicar no botão "Adicionar PIX"
    await page.click('button:has-text("Adicionar PIX")')

    // Aguardar modal abrir
    await page.waitForSelector('text=Adicionar Chave PIX', { timeout: 5000 })

    // Preencher chave PIX
    const pixKey = `teste-${Date.now()}@example.com`
    await page.fill('input[name="pix_key"]', pixKey)

    // Screenshot antes de clicar
    await page.screenshot({
      path: 'debug-pix-before-submit.png',
      fullPage: true,
    })

    // Clicar em "Adicionar"
    await page.click('button[type="submit"]:has-text("Adicionar")')

    // Aguardar feedback
    await page.waitForTimeout(3000)

    // Screenshot depois de clicar
    await page.screenshot({
      path: 'debug-pix-after-submit.png',
      fullPage: true,
    })

    // Verificar se a chave foi adicionada
    const pixKeyElement = await page.locator(`text=${pixKey}`).first()
    await expect(pixKeyElement).toBeVisible({ timeout: 10_000 })

    console.log('✅ Chave PIX adicionada com sucesso!')
  })

  test('deve adicionar conta TED com sucesso', async ({ page }) => {
    console.log('🔍 Testando adicionar conta TED...')

    // Clicar na aba TED
    await page.click('button:has-text("Contas Bancárias (TED)")')
    await page.waitForTimeout(1000)

    // Clicar no botão "Adicionar Conta"
    await page.click('button:has-text("Adicionar Conta")')

    // Aguardar modal abrir
    await page.waitForSelector('text=Adicionar Conta Bancária', {
      timeout: 5000,
    })

    // Preencher dados da conta
    await page.fill('input[name="bank_name"]', 'Banco Teste')
    await page.fill('input[name="bank_code"]', '001')
    await page.fill('input[name="account_holder"]', 'Titular Teste')
    await page.fill('input[name="account_agency"]', '1234')
    await page.fill('input[name="account_number"]', '12345-6')

    // Screenshot antes de clicar
    await page.screenshot({
      path: 'debug-ted-before-submit.png',
      fullPage: true,
    })

    // Clicar em "Adicionar"
    await page.click('button[type="submit"]:has-text("Adicionar")')

    // Aguardar feedback
    await page.waitForTimeout(3000)

    // Screenshot depois de clicar
    await page.screenshot({
      path: 'debug-ted-after-submit.png',
      fullPage: true,
    })

    // Verificar se a conta foi adicionada
    const bankName = await page.locator('text=Banco Teste').first()
    await expect(bankName).toBeVisible({ timeout: 10_000 })

    console.log('✅ Conta TED adicionada com sucesso!')
  })
})
