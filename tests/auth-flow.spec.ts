import { expect, test } from '@playwright/test'

test.describe('Auth Flow Debug', () => {
  test('should login and navigate without redirect loops', async ({ page }) => {
    // Habilitar logs do console
    page.on('console', (message) => {
      if (
        message.type() === 'log' ||
        message.type() === 'error' ||
        message.type() === 'warning'
      ) {
        console.log(`[BROWSER ${message.type()}]:`, message.text())
      }
    })

    // Monitorar requisições de navegação
    page.on('request', (request) => {
      if (request.resourceType() === 'document') {
        console.log(`[NAVIGATION] ${request.method()} ${request.url()}`)
      }
    })

    // Monitorar respostas
    page.on('response', (response) => {
      if (response.status() >= 300 && response.status() < 400) {
        console.log(
          `[REDIRECT] ${response.status()} from ${response.url()} to ${response.headers()['location'] || 'unknown'}`,
        )
      }
    })

    console.log('\n=== INICIANDO TESTE DE LOGIN ===\n')

    // 1. Ir para a página de login
    console.log('1. Navegando para página de login...')
    await page.goto('http://localhost:3001/pt-BR/login')
    await expect(page).toHaveURL(/.*\/login/)

    // 2. Preencher formulário de login
    console.log('2. Preenchendo formulário de login...')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Test123456!')

    // 3. Submeter formulário e aguardar navegação
    console.log('3. Submetendo formulário...')

    // Preparar para capturar redirecionamentos
    const navigationPromise = page.waitForURL(/.*\/(dashboard|kyc)/, {
      timeout: 10_000,
      waitUntil: 'networkidle',
    })

    await page.click('button[type="submit"]')

    try {
      await navigationPromise
      const finalUrl = page.url()
      console.log(`4. Navegação concluída! URL final: ${finalUrl}`)

      // Verificar se não há loop de redirecionamento
      if (finalUrl.includes('/kyc')) {
        console.log('✅ Redirecionado para KYC (usuário sem KYC aprovado)')

        // Aguardar um pouco para ver se há mais redirecionamentos
        await page.waitForTimeout(2000)

        // Verificar se ainda está na mesma página
        const currentUrl = page.url()
        if (currentUrl !== finalUrl) {
          throw new Error(
            `Loop detectado! URL mudou de ${finalUrl} para ${currentUrl}`,
          )
        }

        expect(page.url()).toContain('/kyc')
      } else if (finalUrl.includes('/dashboard')) {
        console.log(
          '✅ Redirecionado para Dashboard (usuário com KYC aprovado)',
        )
        expect(page.url()).toContain('/dashboard')
      }
    } catch (error) {
      console.error('❌ Erro durante navegação:', error)

      // Capturar screenshot para debug
      await page.screenshot({ path: 'debug-login-error.png' })

      // Verificar console do navegador
      const logs = await page.evaluate(() => {
        return {
          url: window.location.href,
          cookies: document.cookie,
          localStorage: Object.keys(localStorage).reduce(
            (accumulator, key) => {
              accumulator[key] = localStorage.getItem(key)
              return accumulator
            },
            {} as Record<string, string | null>,
          ),
        }
      })

      console.log('Estado do browser:', logs)
      throw error
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n')
  })

  test('should check cookies after login', async ({ page }) => {
    console.log('\n=== VERIFICANDO COOKIES APÓS LOGIN ===\n')

    // Fazer login primeiro
    await page.goto('http://localhost:3001/pt-BR/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'Test123456!')
    await page.click('button[type="submit"]')

    // Aguardar navegação
    await page.waitForURL(/.*\/(dashboard|kyc)/, { timeout: 10_000 })

    // Verificar cookies
    const cookies = await page.context().cookies()
    console.log('Cookies encontrados:')

    const authCookies = cookies.filter(
      (cookie) =>
        cookie.name.includes('sb-') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('token'),
    )

    for (const cookie of authCookies) {
      console.log(`  - ${cookie.name}: ${cookie.value.slice(0, 30)}...`)
    }

    // Verificar se os cookies esperados estão presentes
    const hasAccessToken = cookies.some((c) => c.name === 'sb-access-token')
    const hasRefreshToken = cookies.some((c) => c.name === 'sb-refresh-token')
    const hasSupabaseCookie = cookies.some(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token'),
    )

    console.log(`\nCookies de autenticação:`)
    console.log(`  - sb-access-token: ${hasAccessToken ? '✅' : '❌'}`)
    console.log(`  - sb-refresh-token: ${hasRefreshToken ? '✅' : '❌'}`)
    console.log(`  - Supabase auth cookie: ${hasSupabaseCookie ? '✅' : '❌'}`)

    expect(hasAccessToken || hasSupabaseCookie).toBeTruthy()
  })
})
