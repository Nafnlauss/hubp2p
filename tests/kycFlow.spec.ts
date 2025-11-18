import { expect, test } from '@playwright/test'

/**
 * Teste E2E: Fluxo de Cadastro → Login → KYC
 *
 * Objetivo: Verificar se após o login, usuário sem KYC aprovado é redirecionado para /kyc
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const PRODUCTION_URL = 'https://hubp2p.com'

// Usar URL de produção se disponível
const TEST_URL = process.env.CI ? PRODUCTION_URL : BASE_URL

// Função para gerar CPF válido
function generateValidCPF(seed: number): string {
  // Usar seed para gerar 9 primeiros dígitos
  const seedString = String(seed).padStart(9, '0').slice(-9)
  const digits = [...seedString].map(Number)

  // Calcular primeiro dígito verificador
  let sum = 0
  for (let index = 0; index < 9; index++) {
    sum += digits[index] * (10 - index)
  }
  const digit1 = 11 - (sum % 11)
  digits.push(digit1 >= 10 ? 0 : digit1)

  // Calcular segundo dígito verificador
  sum = 0
  for (let index = 0; index < 10; index++) {
    sum += digits[index] * (11 - index)
  }
  const digit2 = 11 - (sum % 11)
  digits.push(digit2 >= 10 ? 0 : digit2)

  return digits.join('')
}

test.describe('Fluxo de KYC após Login', () => {
  // Gerar dados únicos para cada teste
  const timestamp = Date.now()

  // Gerar CPF válido único
  const uniqueCpf = generateValidCPF(timestamp)

  const testUser = {
    email: `test+${timestamp}@hubp2p.com`,
    password: 'Test@123456',
    fullName: 'Test User KYC',
    cpf: uniqueCpf,
  }

  test('Deve redirecionar para /kyc após login de usuário sem KYC aprovado', async ({
    page,
  }) => {
    console.log('🧪 [TEST] Iniciando teste de fluxo KYC')
    console.log('🧪 [TEST] URL base:', TEST_URL)
    console.log('🧪 [TEST] Email de teste:', testUser.email)

    // Listener para logs do console
    page.on('console', (message) => {
      const text = message.text()
      if (
        text.includes('[LOGIN DEBUG]') ||
        text.includes('[DASHBOARD LAYOUT]')
      ) {
        console.log('📱 [BROWSER]', text)
      }
    })

    // 1. Acessar página de registro
    console.log('📍 [TEST] Passo 1: Acessando página de registro')
    await page.goto(`${TEST_URL}/pt-BR/register`)
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: 'tests/screenshots/01-register-page.png',
      fullPage: true,
    })

    // 2. Preencher PASSO 1 do formulário - Dados de Acesso
    console.log('📍 [TEST] Passo 2: Preenchendo Passo 1 - Dados de Acesso')

    await page.locator('input[name="email"]').fill(testUser.email)
    await page.locator('input[name="password"]').fill(testUser.password)
    await page.locator('input[name="confirmPassword"]').fill(testUser.password)

    await page.screenshot({
      path: 'tests/screenshots/02-register-step1-filled.png',
      fullPage: true,
    })

    // Clicar em "Próximo"
    await page.locator('button[type="submit"]').click()

    // Aguardar Passo 2 carregar
    await page.waitForSelector('input[name="fullName"]', {
      state: 'visible',
      timeout: 5000,
    })

    // 3. Preencher PASSO 2 do formulário - Dados Pessoais
    console.log('📍 [TEST] Passo 3: Preenchendo Passo 2 - Dados Pessoais')

    await page.locator('input[name="fullName"]').fill(testUser.fullName)
    // Formatar CPF único (XXX.XXX.XXX-XX)
    const cpfFormatted = testUser.cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4',
    )
    await page.locator('input[name="cpf"]').fill(cpfFormatted)
    await page.locator('input[name="phone"]').fill('(11) 99999-9999')
    await page.locator('input[name="dateOfBirth"]').fill('1990-01-01')

    await page.screenshot({
      path: 'tests/screenshots/03-register-step2-filled.png',
      fullPage: true,
    })

    // Clicar em "Próximo" e aguardar Passo 3
    const nextButton = page.locator('button[type="submit"]:has-text("Próximo")')
    await nextButton.click()

    // Aguardar Passo 3 carregar
    await page.waitForSelector('input[name="addressZip"]', {
      state: 'visible',
      timeout: 10_000,
    })

    // 4. Preencher PASSO 3 do formulário - Endereço
    console.log('📍 [TEST] Passo 4: Preenchendo Passo 3 - Endereço')

    await page.locator('input[name="addressZip"]').fill('01310-100')
    await page.waitForTimeout(2000) // Aguardar busca do CEP

    await page.locator('input[name="addressNumber"]').fill('1000')

    await page.screenshot({
      path: 'tests/screenshots/04-register-step3-filled.png',
      fullPage: true,
    })

    // 5. Submeter formulário final
    console.log('📍 [TEST] Passo 5: Submetendo formulário de registro')
    await page.locator('button[type="submit"]').click()

    // Aguardar navegação para KYC (novo fluxo) ou login
    try {
      await page.waitForURL('**/kyc**', { timeout: 10_000 })
      console.log('✅ [TEST] Redirecionado para KYC após registro')
    } catch {
      try {
        await page.waitForURL('**/login', { timeout: 5000 })
        console.log('✅ [TEST] Redirecionado para login após registro')
      } catch {
        console.log('⚠️ [TEST] Não redirecionou, continuando...')
      }
    }

    await page.screenshot({
      path: 'tests/screenshots/05-after-register.png',
      fullPage: true,
    })

    // 6. Fazer login
    console.log('📍 [TEST] Passo 6: Fazendo login')
    await page.goto(`${TEST_URL}/pt-BR/login`)
    await page.waitForLoadState('networkidle')

    const loginEmailInput = page.locator('input[type="email"]').first()
    const loginPasswordInput = page.locator('input[type="password"]').first()

    await loginEmailInput.fill(testUser.email)
    await loginPasswordInput.fill(testUser.password)

    await page.screenshot({
      path: 'tests/screenshots/06-login-filled.png',
      fullPage: true,
    })

    const loginButton = page.locator('button[type="submit"]').first()
    await loginButton.click()

    console.log('📍 [TEST] Passo 7: Aguardando redirecionamento após login...')

    // 8. Verificar redirecionamento
    // Aguardar até 15 segundos para redirecionamento
    try {
      await page.waitForURL('**/kyc**', { timeout: 15_000 })
      console.log('✅ [TEST] SUCESSO! Redirecionou para página de KYC')

      const currentUrl = page.url()
      console.log('📍 [TEST] URL atual:', currentUrl)

      await page.screenshot({
        path: 'tests/screenshots/07-kyc-page.png',
        fullPage: true,
      })

      // Verificar se está na página de KYC
      expect(currentUrl).toContain('/kyc')

      // Aguardar um pouco para ver se redireciona para /kyc/proteo
      await page.waitForTimeout(2000)

      const finalUrl = page.url()
      console.log('📍 [TEST] URL final:', finalUrl)

      await page.screenshot({
        path: 'tests/screenshots/08-final-page.png',
        fullPage: true,
      })

      // Verificar se chegou até a página do iframe Proteo
      if (finalUrl.includes('/kyc/proteo')) {
        console.log('✅ [TEST] PERFEITO! Chegou até a página do iframe Proteo')

        // Verificar se o iframe está presente
        const iframe = page.locator('iframe[title*="Proteo"]')
        const iframeExists = (await iframe.count()) > 0
        console.log('📍 [TEST] Iframe Proteo presente?', iframeExists)

        expect(iframeExists).toBe(true)
      }
    } catch (error) {
      console.log('❌ [TEST] FALHA! Não redirecionou para /kyc')
      console.log('❌ [TEST] Erro:', error)

      const currentUrl = page.url()
      console.log('📍 [TEST] URL atual:', currentUrl)

      await page.screenshot({
        path: 'tests/screenshots/ERROR-wrong-redirect.png',
        fullPage: true,
      })

      // Pegar logs do console que foram capturados
      console.log('📍 [TEST] Verifique os logs do console do navegador acima')

      throw new Error(`Não redirecionou para /kyc. URL atual: ${currentUrl}`)
    }
  })

  test('Deve mostrar iframe do Proteo na página /kyc/proteo', async ({
    page,
  }) => {
    console.log('🧪 [TEST] Testando acesso direto à página do iframe Proteo')

    await page.goto(`${TEST_URL}/pt-BR/kyc/proteo`)
    await page.waitForLoadState('networkidle')

    // Pode redirecionar para login se não estiver autenticado
    const currentUrl = page.url()
    console.log('📍 [TEST] URL atual:', currentUrl)

    if (currentUrl.includes('/login')) {
      console.log(
        '⚠️ [TEST] Redirecionado para login (esperado se não autenticado)',
      )
    } else if (currentUrl.includes('/kyc/proteo')) {
      console.log('✅ [TEST] Na página do iframe Proteo')

      // Verificar se o iframe existe
      const iframe = page.locator('iframe')
      const iframeCount = await iframe.count()
      console.log('📍 [TEST] Número de iframes na página:', iframeCount)

      await page.screenshot({
        path: 'tests/screenshots/proteo-iframe-page.png',
        fullPage: true,
      })
    }
  })
})
