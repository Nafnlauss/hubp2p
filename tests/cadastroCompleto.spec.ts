import { test } from '@playwright/test'

/**
 * Gera um CPF válido a partir de uma base de 9 dígitos
 * Calcula os 2 dígitos verificadores usando o algoritmo oficial do CPF
 */
function gerarCPFValido(cpfBase: string): string {
  // Garantir que temos exatamente 9 dígitos
  const base = cpfBase.padStart(9, '0').slice(0, 9)

  // Calcular primeiro dígito verificador
  let soma = 0
  for (let index = 0; index < 9; index++) {
    soma += Number.parseInt(base[index]) * (10 - index)
  }
  const resto1 = soma % 11
  const digito1 = resto1 < 2 ? 0 : 11 - resto1

  // Calcular segundo dígito verificador
  soma = 0
  for (let index = 0; index < 9; index++) {
    soma += Number.parseInt(base[index]) * (11 - index)
  }
  soma += digito1 * 2
  const resto2 = soma % 11
  const digito2 = resto2 < 2 ? 0 : 11 - resto2

  // Retornar CPF completo sem formatação
  return `${base}${digito1}${digito2}`
}

test('Teste de cadastro completo até verificação KYC', async ({ page }) => {
  console.log('🧪 [TEST] Iniciando teste de cadastro completo...')

  // Capturar mensagens do console
  page.on('console', (message) => {
    const type = message.type()
    const text = message.text()
    if (type === 'error') {
      console.log(`🔴 [BROWSER ERROR] ${text}`)
    } else if (type === 'warning') {
      console.log(`⚠️ [BROWSER WARN] ${text}`)
    } else if (text.includes('[REGISTER]')) {
      console.log(`📱 [BROWSER] ${text}`)
    }
  })

  // Capturar erros de página
  page.on('pageerror', (error) => {
    console.log(`💥 [PAGE ERROR] ${error.message}`)
  })

  // 1. Acessar landing page
  console.log('📍 [TEST] Passo 1: Acessando landing page')
  await page.goto('http://localhost:3000')
  await page.waitForLoadState('networkidle')

  await page.screenshot({
    path: 'tests/screenshots/cadastro-01-landing.png',
    fullPage: true,
  })

  // 2. Clicar em "Cadastre-se Grátis"
  console.log('📍 [TEST] Passo 2: Clicando em Cadastre-se')
  const botaoCadastro = page.locator('a:has-text("Cadastre-se Grátis")').first()
  await botaoCadastro.click()
  await page.waitForLoadState('networkidle')
  console.log('📍 [TEST] URL após clicar:', page.url())

  await page.screenshot({
    path: 'tests/screenshots/cadastro-02-registro.png',
    fullPage: true,
  })

  // 3. Preencher Step 1 - Dados de acesso
  console.log('📍 [TEST] Passo 3: Preenchendo dados de acesso (Step 1)')

  // Gerar email e CPF únicos para evitar conflitos
  const timestamp = Date.now()
  const email = `teste${timestamp}@example.com`
  const senha = 'Teste123!@#'

  // Gerar CPF único válido baseado no timestamp
  // Usar os últimos 9 dígitos do timestamp + calcular dígitos verificadores
  const cpfBase = String(timestamp).slice(-9).padStart(9, '0')
  const cpfComDigitos = gerarCPFValido(cpfBase)

  console.log(`📧 Email: ${email}`)
  console.log(`🆔 CPF: ${cpfComDigitos}`)

  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', senha)
  await page.fill('input[name="confirmPassword"]', senha)

  await page.screenshot({
    path: 'tests/screenshots/cadastro-03-step1-preenchido.png',
    fullPage: true,
  })

  // Clicar no botão "Próximo"
  await page.click('button[type="submit"]')
  await page.waitForTimeout(1000)

  console.log('📍 [TEST] URL após Step 1:', page.url())

  await page.screenshot({
    path: 'tests/screenshots/cadastro-04-step2.png',
    fullPage: true,
  })

  // 4. Preencher Step 2 - Dados pessoais
  console.log('📍 [TEST] Passo 4: Preenchendo dados pessoais (Step 2)')

  await page.fill('input[name="fullName"]', 'João Silva Teste')
  await page.fill('input[name="cpf"]', cpfComDigitos) // CPF único gerado
  await page.fill('input[name="phone"]', '11987654321')
  await page.fill('input[name="dateOfBirth"]', '1990-01-01')

  await page.screenshot({
    path: 'tests/screenshots/cadastro-05-step2-preenchido.png',
    fullPage: true,
  })

  // Clicar no botão "Próximo"
  const botaoProximoStep2 = page
    .locator('button[type="submit"]:has-text("Próximo")')
    .last()
  await botaoProximoStep2.click()
  await page.waitForTimeout(1000)

  console.log('📍 [TEST] URL após Step 2:', page.url())

  await page.screenshot({
    path: 'tests/screenshots/cadastro-06-step3.png',
    fullPage: true,
  })

  // 5. Preencher Step 3 - Endereço
  console.log('📍 [TEST] Passo 5: Preenchendo endereço (Step 3)')

  // Preencher CEP e aguardar busca automática
  await page.fill('input[name="addressZip"]', '01310100')
  await page.waitForTimeout(2000) // Aguardar busca do CEP

  // Preencher número (obrigatório)
  await page.fill('input[name="addressNumber"]', '1000')

  await page.screenshot({
    path: 'tests/screenshots/cadastro-07-step3-preenchido.png',
    fullPage: true,
  })

  // Clicar no botão "Finalizar Cadastro"
  console.log('📍 [TEST] Passo 6: Clicando em Finalizar Cadastro')
  const botaoFinalizar = page.locator('button[type="submit"]').last()
  await botaoFinalizar.click()

  // Aguardar redirecionamento
  console.log('⏳ [TEST] Aguardando redirecionamento...')
  await page.waitForTimeout(3000)

  console.log('📍 [TEST] URL após finalizar cadastro:', page.url())

  await page.screenshot({
    path: 'tests/screenshots/cadastro-08-apos-finalizar.png',
    fullPage: true,
  })

  // 6. Verificar se foi redirecionado para /kyc
  const urlAtual = page.url()
  console.log('📍 [TEST] URL final:', urlAtual)

  if (urlAtual.includes('/kyc')) {
    console.log('✅ [TEST] SUCESSO! Redirecionado para /kyc')

    // Aguardar iframe carregar
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: 'tests/screenshots/cadastro-09-kyc-page.png',
      fullPage: true,
    })

    // Verificar se iframe do Proteo está presente
    const iframe = page.locator('iframe[title*="Proteo"]')
    const iframeCount = await iframe.count()

    console.log('📍 [TEST] Iframes encontrados:', iframeCount)

    if (iframeCount > 0) {
      console.log('✅ [TEST] PERFEITO! Iframe do Proteo encontrado!')
    } else {
      console.log('⚠️ [TEST] Iframe do Proteo não encontrado')
    }
  } else if (urlAtual.includes('/login')) {
    console.log(
      '❌ [TEST] ERRO! Foi redirecionado para /login ao invés de /kyc',
    )
  } else if (urlAtual.includes('/dashboard')) {
    console.log(
      '❌ [TEST] ERRO! Foi redirecionado para /dashboard ao invés de /kyc',
    )
  } else {
    console.log('❌ [TEST] ERRO! URL inesperada:', urlAtual)
  }

  console.log('✅ [TEST] Teste de cadastro completo finalizado!')
  console.log(`📧 [TEST] Email usado: ${email}`)
  console.log(`🔑 [TEST] Senha: ${senha}`)
})
