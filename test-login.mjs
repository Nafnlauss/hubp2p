import { chromium } from 'playwright'

async function testLogin() {
  console.log('🚀 Iniciando teste de login...')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navegar para página de login
    console.log('📍 Navegando para /login...')
    await page.goto('http://localhost:3000/pt-BR/login')
    await page.waitForLoadState('networkidle')

    // Preencher formulário
    console.log('✍️ Preenchendo formulário...')
    await page.fill('input[type="email"]', 'leonardovyguimaraes@gmail.com')
    await page.fill('input[type="password"]', '62845_Madhouse')

    // Clicar no botão de login
    console.log('🔘 Clicando em Login...')
    await page.click('button[type="submit"]')

    // Aguardar navegação
    console.log('⏳ Aguardando redirecionamento...')
    await page.waitForTimeout(3000)

    // Verificar URL atual
    const currentUrl = page.url()
    console.log('📍 URL atual:', currentUrl)

    if (
      currentUrl.includes('/dashboard') ||
      currentUrl.includes('/kyc') ||
      currentUrl.includes('/deposit') ||
      currentUrl.includes('/wallet')
    ) {
      console.log('✅ Login bem-sucedido! Redirecionado para:', currentUrl)
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Login falhou! Ainda na página de login')
    } else {
      console.log('⚠️ URL inesperada:', currentUrl)
    }

    // Aguardar um pouco antes de fechar
    await page.waitForTimeout(2000)
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await browser.close()
  }
}

testLogin()
