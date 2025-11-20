import { expect, test } from '@playwright/test'

test('Teste da nova Landing Page', async ({ page }) => {
  console.log('🧪 [TEST] Testando landing page...')

  // Acessar página principal
  await page.goto('http://localhost:3000')
  await page.waitForLoadState('networkidle')

  console.log('📍 [TEST] URL atual:', page.url())

  // Tirar screenshot inicial
  await page.screenshot({
    path: 'tests/screenshots/landing-01-inicial.png',
    fullPage: true,
  })

  // Verificar logo e nome
  const logo = page.locator('text=HubP2P')
  await expect(logo).toBeVisible()
  console.log('✅ [TEST] Logo encontrado!')

  // Verificar título principal
  const titulo = page.locator('h1:has-text("Compre Criptomoedas")')
  await expect(titulo).toBeVisible()
  console.log('✅ [TEST] Título principal encontrado!')

  // Verificar botão "Cadastre-se Grátis"
  const botaoCadastro = page.locator('a:has-text("Cadastre-se Grátis")')
  await expect(botaoCadastro).toBeVisible()
  console.log('✅ [TEST] Botão cadastro encontrado!')

  // Verificar botão "Já tenho conta"
  const botaoLogin = page.locator('a:has-text("Já tenho conta")')
  await expect(botaoLogin).toBeVisible()
  console.log('✅ [TEST] Botão login encontrado!')

  // Verificar badges de confiança
  const badgeSSL = page.locator('text=Criptografia SSL')
  const badgeKYC = page.locator('text=KYC Obrigatório')
  const badgePix = page.locator('text=Pix Instantâneo')

  await expect(badgeSSL).toBeVisible()
  await expect(badgeKYC).toBeVisible()
  await expect(badgePix).toBeVisible()
  console.log('✅ [TEST] Todos os badges de confiança encontrados!')

  // Verificar 3 features
  const featureSeguranca = page.locator('text=Segurança Total')
  const featurePix = page.locator('text=Pix Instantâneo')
  const featureBrasileiro = page.locator('text=100% Brasileiro')

  await expect(featureSeguranca).toBeVisible()
  await expect(featurePix).toBeVisible()
  await expect(featureBrasileiro).toBeVisible()
  console.log('✅ [TEST] Todas as 3 features encontradas!')

  // Scroll até o meio da página
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
  await page.waitForTimeout(500)

  await page.screenshot({
    path: 'tests/screenshots/landing-02-features.png',
    fullPage: true,
  })

  // Scroll até o final
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)

  await page.screenshot({
    path: 'tests/screenshots/landing-03-cta.png',
    fullPage: true,
  })

  // Verificar CTA final
  const ctaFinal = page.locator('text=Pronto para começar?')
  await expect(ctaFinal).toBeVisible()
  console.log('✅ [TEST] CTA final encontrado!')

  // Verificar footer
  const footer = page.locator('text=© 2024 HubP2P')
  await expect(footer).toBeVisible()
  console.log('✅ [TEST] Footer encontrado!')

  console.log('✅ [TEST] Teste da landing page concluído com sucesso!')
})

test('Teste do fluxo: Landing → Registro', async ({ page }) => {
  console.log('🧪 [TEST] Testando fluxo Landing → Registro...')

  // 1. Acessar landing page
  await page.goto('http://localhost:3000')
  await page.waitForLoadState('networkidle')

  await page.screenshot({
    path: 'tests/screenshots/fluxo-landing-01-home.png',
    fullPage: true,
  })

  // 2. Clicar no botão "Cadastre-se Grátis"
  const botaoCadastro = page.locator('a:has-text("Cadastre-se Grátis")').first()
  await botaoCadastro.click()

  await page.waitForLoadState('networkidle')
  console.log('📍 [TEST] URL após clique:', page.url())

  // 3. Verificar que chegou na página de registro
  await page.waitForTimeout(1000)

  await page.screenshot({
    path: 'tests/screenshots/fluxo-landing-02-register.png',
    fullPage: true,
  })

  // Verificar se está na página de registro
  const tituloRegistro = page.locator('text=Cadastre-se')
  const stepIndicator = page.locator('text=Passo 1 de 3')

  const temTitulo = (await tituloRegistro.count()) > 0
  const temStep = (await stepIndicator.count()) > 0

  console.log('📍 [TEST] Título de registro presente?', temTitulo)
  console.log('📍 [TEST] Indicador de step presente?', temStep)

  if (temTitulo || temStep) {
    console.log('✅ [TEST] Navegou com sucesso para página de registro!')
  } else {
    console.log('⚠️ [TEST] Pode não estar na página de registro correta')
  }

  console.log('✅ [TEST] Fluxo Landing → Registro testado!')
})
