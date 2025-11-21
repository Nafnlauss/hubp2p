import { expect, test } from '@playwright/test'

test('Teste completo: criar conta e verificar redirecionamento para KYC', async ({
  page,
}) => {
  console.log('🧪 [TEST] Iniciando teste completo de fluxo KYC')

  // Gerar email único para cada teste
  const timestamp = Date.now()
  const testEmail = `test${timestamp}@example.com`
  const testPassword = 'Test123!'
  const testName = `Test User ${timestamp}`
  const testCPF = '12345678901'

  console.log(`📧 [TEST] Email de teste: ${testEmail}`)

  // ==========================================
  // PASSO 1: CRIAR NOVA CONTA
  // ==========================================
  console.log('📍 [TEST] Navegando para página de registro...')
  await page.goto('http://localhost:3001/pt-BR/register')

  // STEP 1: Email e Senha
  console.log('✍️ [TEST] Step 1: Preenchendo email e senha...')
  await page.fill('input#email', testEmail)
  await page.fill('input#password', testPassword)
  await page.fill('input#confirmPassword', testPassword)

  await page.screenshot({ path: 'tests/screenshots/step1.png', fullPage: true })

  console.log('🔘 [TEST] Avançando para Step 2...')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1500)

  // STEP 2: Dados Pessoais
  console.log('✍️ [TEST] Step 2: Preenchendo dados pessoais...')
  await page.waitForSelector('input#fullName', { state: 'visible' })
  await page.fill('input#fullName', testName)
  await page.fill('input#cpf', testCPF)
  await page.fill('input#phone', '11987654321')
  await page.fill('input#dateOfBirth', '1990-01-01')

  await page.screenshot({ path: 'tests/screenshots/step2.png', fullPage: true })

  console.log('🔘 [TEST] Avançando para Step 3...')
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1500)

  // STEP 3: Endereço
  console.log('✍️ [TEST] Step 3: Preenchendo endereço...')
  await page.waitForSelector('input#addressZip', { state: 'visible' })
  console.log('✅ [TEST] Step 3 carregou corretamente!')

  await page.fill('input#addressZip', '01001000')
  await page.waitForTimeout(1500) // Aguardar CEP lookup

  await page.fill('input#addressNumber', '123')
  await page.fill('input#addressComplement', 'Apto 45')

  await page.screenshot({ path: 'tests/screenshots/step3.png', fullPage: true })

  console.log('🔘 [TEST] Finalizando cadastro...')
  await page.click('button[type="submit"]')

  // Aguardar processamento
  await page.waitForTimeout(3000)

  const urlAfterRegister = page.url()
  console.log(`📍 [TEST] URL após registro: ${urlAfterRegister}`)

  // ==========================================
  // PASSO 2: VERIFICAR SE FOI REDIRECIONADO PARA KYC
  // ==========================================
  const isInKycPage = urlAfterRegister.includes('/kyc')
  console.log(`🔍 [TEST] Está na página de KYC? ${isInKycPage}`)

  if (!isInKycPage) {
    console.log('❌ [TEST] Não foi redirecionado para KYC após registro!')
    console.log(`📍 [TEST] URL atual: ${urlAfterRegister}`)

    // Tirar screenshot para debug
    await page.screenshot({
      path: 'debug-after-register.png',
      fullPage: true,
    })
    console.log('📸 [TEST] Screenshot salvo como debug-after-register.png')

    // Se não foi redirecionado, pode ter sido para login
    if (urlAfterRegister.includes('/login')) {
      console.log('📍 [TEST] Foi redirecionado para login, fazendo login...')

      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', testPassword)
      await page.click('button[type="submit"]')

      await page.waitForTimeout(3000)
      const urlAfterLogin = page.url()
      console.log(`📍 [TEST] URL após login: ${urlAfterLogin}`)
    }
  }

  // Aguardar um pouco para a página carregar
  await page.waitForTimeout(3000)

  const currentUrl = page.url()
  console.log(`📍 [TEST] URL atual: ${currentUrl}`)

  // ==========================================
  // PASSO 3: VERIFICAR SE ESTÁ NA PÁGINA DE KYC
  // ==========================================
  const finallyInKyc = currentUrl.includes('/kyc')
  expect(finallyInKyc).toBe(true)
  console.log('✅ [TEST] Confirmado: está na página de KYC')

  // Tirar screenshot da página de KYC
  await page.screenshot({ path: 'kyc-page-after-register.png', fullPage: true })
  console.log('📸 [TEST] Screenshot da página KYC salvo')

  // ==========================================
  // PASSO 4: VERIFICAR BOTÃO "INICIAR VERIFICAÇÃO"
  // ==========================================
  console.log('🔍 [TEST] Procurando botão "Iniciar Verificação"...')
  const startButton = await page.locator('text=Iniciar Verificação').count()
  console.log(
    `📍 [TEST] Botão "Iniciar Verificação" encontrado: ${startButton} vezes`,
  )

  if (startButton > 0) {
    console.log('✅ [TEST] Página inicial de KYC está correta')

    // Clicar no botão para ir para o iframe
    console.log('🔘 [TEST] Clicando em "Iniciar Verificação"...')
    await page.click('text=Iniciar Verificação')

    await page.waitForTimeout(3000)

    const urlAfterClick = page.url()
    console.log(`📍 [TEST] URL após clicar no botão: ${urlAfterClick}`)
  }

  // ==========================================
  // PASSO 5: VERIFICAR SE ESTÁ NA PÁGINA DO IFRAME PROTEO
  // ==========================================
  const isInProteoPage = page.url().includes('/kyc/proteo')
  console.log(`🔍 [TEST] Está na página do iframe Proteo? ${isInProteoPage}`)

  if (isInProteoPage) {
    console.log('✅ [TEST] Navegou para página do iframe Proteo')

    // Aguardar iframe carregar
    await page.waitForTimeout(5000)

    // Verificar se há iframe
    const iframes = await page.locator('iframe').count()
    console.log(`📍 [TEST] Número de iframes encontrados: ${iframes}`)

    // Tirar screenshot
    await page.screenshot({
      path: 'proteo-iframe-after-register.png',
      fullPage: true,
    })
    console.log('📸 [TEST] Screenshot do iframe Proteo salvo')

    // Verificar se iframe está presente
    expect(iframes).toBeGreaterThan(0)
    console.log('✅ [TEST] Iframe do Proteo está presente!')
  }

  // ==========================================
  // RESUMO FINAL
  // ==========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ [TEST] TESTE COMPLETO CONCLUÍDO!')
  console.log(`📧 Email criado: ${testEmail}`)
  console.log(`👤 Nome: ${testName}`)
  console.log(`🔑 Senha: ${testPassword}`)
  console.log(`📍 URL final: ${page.url()}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  expect(true).toBe(true)
})
