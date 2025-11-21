import { expect, test } from '@playwright/test'

test('Teste específico: transição Step 2 para Step 3', async ({ page }) => {
  console.log('🧪 [TEST] Testando transição Step 2 -> Step 3')

  // Capturar erros do console
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message)
    console.log(`💥 [PAGE ERROR] ${error.message}`)
  })

  // Navegar para a página de registro
  console.log('📍 [TEST] Navegando para /pt-BR/register...')
  await page.goto('http://localhost:3001/pt-BR/register')
  await page.waitForLoadState('networkidle')

  // Verificar se a página carregou
  const title = await page.locator('h2').first()
  await expect(title).toBeVisible()
  console.log('✅ [TEST] Página de registro carregada')

  // Preencher Step 1
  console.log('📍 [TEST] Preenchendo Step 1...')
  const timestamp = Date.now()
  await page.fill('input#email', `test${timestamp}@example.com`)
  await page.fill('input#password', 'Test123!')
  await page.fill('input#confirmPassword', 'Test123!')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1000)

  // Verificar se Step 2 está visível
  console.log('📍 [TEST] Verificando Step 2...')
  await expect(page.locator('input#fullName')).toBeVisible()
  console.log('✅ [TEST] Step 2 carregado')

  // Preencher Step 2
  console.log('📍 [TEST] Preenchendo Step 2...')
  await page.fill('input#fullName', 'Test User')
  await page.fill('input#cpf', '12345678909')
  await page.fill('input#phone', '11987654321')
  await page.fill('input#dateOfBirth', '1990-01-01')

  // Clicar para ir ao Step 3 (momento crítico onde o erro acontecia)
  console.log('🔍 [TEST] CLICANDO PARA IR AO STEP 3...')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2000)

  // Verificar se houve erros no console
  if (consoleErrors.length > 0) {
    console.log('❌ [TEST] ERROS ENCONTRADOS:')
    for (const error of consoleErrors) console.log(`  - ${error}`)
    throw new Error(`Console errors: ${consoleErrors.join(', ')}`)
  }

  // Verificar se Step 3 está visível
  console.log('📍 [TEST] Verificando Step 3...')
  const cepInput = page.locator('input#addressZip')
  await expect(cepInput).toBeVisible({ timeout: 5000 })
  console.log('✅ [TEST] Step 3 carregado sem erros!')

  // Verificar se os campos do Step 3 estão funcionais
  await page.fill('input#addressZip', '01001000')
  await page.waitForTimeout(1000)

  console.log('✅ [TEST] SUCESSO! Transição Step 2 -> Step 3 funcionando!')
})
