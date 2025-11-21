import { test } from '@playwright/test'

test('Teste da página KYC Manual com entrada de CPF', async ({ page }) => {
  console.log('🧪 [TEST] Iniciando teste KYC Manual...')

  // Capturar console do navegador
  page.on('console', (message) => {
    const text = message.text()
    if (
      text.includes('[KYC MANUAL]') ||
      text.includes('[PROTEO DIRECT]') ||
      text.includes('CPF')
    ) {
      console.log(`📱 [BROWSER] ${text}`)
    }
  })

  // Capturar erros
  page.on('pageerror', (error) => {
    console.log(`💥 [PAGE ERROR] ${error.message}`)
  })

  // 1. Acessar página KYC Manual
  console.log('📍 [TEST] Passo 1: Acessando /kyc-manual')
  await page.goto('http://localhost:3000/pt-BR/kyc-manual')
  await page.waitForLoadState('networkidle')

  await page.screenshot({
    path: 'tests/screenshots/kyc-manual-01-inicial.png',
    fullPage: true,
  })

  console.log('📍 [TEST] URL atual:', page.url())

  // 2. Verificar se o formulário está presente
  console.log('📍 [TEST] Passo 2: Verificando formulário')

  // Verificar se o título está presente
  const titulo = page.locator('text=Verificação de Identidade (KYC)')
  await titulo.waitFor({ state: 'visible', timeout: 5000 })
  console.log('✅ [TEST] Título encontrado')

  // Verificar se o input de CPF está presente
  const inputCPF = page.locator('input#cpf')
  await inputCPF.waitFor({ state: 'visible', timeout: 5000 })
  console.log('✅ [TEST] Input de CPF encontrado')

  // 3. Preencher CPF
  console.log('📍 [TEST] Passo 3: Preenchendo CPF')
  const cpfTeste = '12345678909'

  await inputCPF.fill(cpfTeste)
  console.log(`📧 [TEST] CPF digitado: ${cpfTeste}`)

  // Aguardar um pouco para ver a máscara sendo aplicada
  await page.waitForTimeout(500)

  await page.screenshot({
    path: 'tests/screenshots/kyc-manual-02-cpf-preenchido.png',
    fullPage: true,
  })

  // 4. Clicar no botão "Iniciar Verificação"
  console.log('📍 [TEST] Passo 4: Clicando em Iniciar Verificação')
  const botaoIniciar = page.locator('button[type="submit"]')
  await botaoIniciar.click()

  // 5. Aguardar redirecionamento
  console.log('⏳ [TEST] Aguardando redirecionamento...')
  await page.waitForTimeout(2000)

  const urlAtual = page.url()
  console.log('📍 [TEST] URL após clicar:', urlAtual)

  await page.screenshot({
    path: 'tests/screenshots/kyc-manual-03-apos-submit.png',
    fullPage: true,
  })

  // 6. Verificar se foi para a página proteo-direct
  if (urlAtual.includes('/kyc/proteo-direct')) {
    console.log('✅ [TEST] Redirecionado para /kyc/proteo-direct')

    // Aguardar iframe
    await page.waitForTimeout(3000)

    await page.screenshot({
      path: 'tests/screenshots/kyc-manual-04-proteo-direct.png',
      fullPage: true,
    })

    // Verificar se iframe está presente
    const iframe = page.locator('iframe[title*="Proteo"]')
    const iframeCount = await iframe.count()

    console.log('📍 [TEST] Iframes encontrados:', iframeCount)

    if (iframeCount > 0) {
      const iframeSource = await iframe.getAttribute('src')
      console.log('🔗 [TEST] URL do iframe:', iframeSource)
      console.log('✅ [TEST] SUCESSO! Iframe do Proteo carregado!')
    } else {
      console.log('⚠️ [TEST] Iframe não encontrado')
    }
  } else {
    console.log('❌ [TEST] Não foi redirecionado para /kyc/proteo-direct')
    console.log('📍 [TEST] URL atual:', urlAtual)
  }

  console.log('✅ [TEST] Teste KYC Manual finalizado!')
})
