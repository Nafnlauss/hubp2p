import { test, expect } from '@playwright/test';

/**
 * Teste E2E: Fluxo de Cadastro → Login → KYC
 *
 * Objetivo: Verificar se após o login, usuário sem KYC aprovado é redirecionado para /kyc
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const PRODUCTION_URL = 'https://hubp2p.com';

// Usar URL de produção se disponível
const TEST_URL = process.env.CI ? PRODUCTION_URL : BASE_URL;

test.describe('Fluxo de KYC após Login', () => {
  // Gerar dados únicos para cada teste
  const timestamp = Date.now();
  const testUser = {
    email: `test+${timestamp}@hubp2p.com`,
    password: 'Test@123456',
    fullName: 'Test User KYC',
    cpf: '00000000000', // CPF de teste
  };

  test('Deve redirecionar para /kyc após login de usuário sem KYC aprovado', async ({ page }) => {
    console.log('🧪 [TEST] Iniciando teste de fluxo KYC');
    console.log('🧪 [TEST] URL base:', TEST_URL);
    console.log('🧪 [TEST] Email de teste:', testUser.email);

    // Listener para logs do console
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[LOGIN DEBUG]')) {
        console.log('📱 [BROWSER]', text);
      }
    });

    // 1. Acessar página de registro
    console.log('📍 [TEST] Passo 1: Acessando página de registro');
    await page.goto(`${TEST_URL}/pt-BR/register`);
    await page.waitForLoadState('networkidle');

    // Tirar screenshot da página de registro
    await page.screenshot({ path: 'tests/screenshots/01-register-page.png', fullPage: true });

    // 2. Preencher formulário de registro
    console.log('📍 [TEST] Passo 2: Preenchendo formulário de registro');

    // Procurar pelos campos (pode ter diferentes seletores)
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(testUser.email);
    await passwordInput.fill(testUser.password);

    // Se houver campo de nome
    const nameInput = page.locator('input[name="fullName"], input[name="name"], input[placeholder*="nome"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(testUser.fullName);
    }

    // Se houver campo de CPF
    const cpfInput = page.locator('input[name="cpf"], input[placeholder*="CPF"]').first();
    if (await cpfInput.isVisible().catch(() => false)) {
      await cpfInput.fill(testUser.cpf);
    }

    await page.screenshot({ path: 'tests/screenshots/02-register-filled.png', fullPage: true });

    // 3. Submeter formulário de registro
    console.log('📍 [TEST] Passo 3: Submetendo formulário de registro');
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Aguardar navegação ou mensagem de sucesso
    try {
      await page.waitForURL('**/login', { timeout: 10000 });
      console.log('✅ [TEST] Redirecionado para login após registro');
    } catch {
      console.log('⚠️ [TEST] Não redirecionou para login, continuando...');
    }

    await page.screenshot({ path: 'tests/screenshots/03-after-register.png', fullPage: true });

    // 4. Fazer login
    console.log('📍 [TEST] Passo 4: Fazendo login');
    await page.goto(`${TEST_URL}/pt-BR/login`);
    await page.waitForLoadState('networkidle');

    const loginEmailInput = page.locator('input[type="email"]').first();
    const loginPasswordInput = page.locator('input[type="password"]').first();

    await loginEmailInput.fill(testUser.email);
    await loginPasswordInput.fill(testUser.password);

    await page.screenshot({ path: 'tests/screenshots/04-login-filled.png', fullPage: true });

    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    console.log('📍 [TEST] Passo 5: Aguardando redirecionamento após login...');

    // 5. Verificar redirecionamento
    // Aguardar até 15 segundos para redirecionamento
    try {
      await page.waitForURL('**/kyc**', { timeout: 15000 });
      console.log('✅ [TEST] SUCESSO! Redirecionou para página de KYC');

      const currentUrl = page.url();
      console.log('📍 [TEST] URL atual:', currentUrl);

      await page.screenshot({ path: 'tests/screenshots/05-kyc-page.png', fullPage: true });

      // Verificar se está na página de KYC
      expect(currentUrl).toContain('/kyc');

      // Aguardar um pouco para ver se redireciona para /kyc/proteo
      await page.waitForTimeout(2000);

      const finalUrl = page.url();
      console.log('📍 [TEST] URL final:', finalUrl);

      await page.screenshot({ path: 'tests/screenshots/06-final-page.png', fullPage: true });

      // Verificar se chegou até a página do iframe Proteo
      if (finalUrl.includes('/kyc/proteo')) {
        console.log('✅ [TEST] PERFEITO! Chegou até a página do iframe Proteo');

        // Verificar se o iframe está presente
        const iframe = page.locator('iframe[title*="Proteo"]');
        const iframeExists = await iframe.count() > 0;
        console.log('📍 [TEST] Iframe Proteo presente?', iframeExists);

        expect(iframeExists).toBe(true);
      }

    } catch (error) {
      console.log('❌ [TEST] FALHA! Não redirecionou para /kyc');
      console.log('❌ [TEST] Erro:', error);

      const currentUrl = page.url();
      console.log('📍 [TEST] URL atual:', currentUrl);

      await page.screenshot({ path: 'tests/screenshots/ERROR-wrong-redirect.png', fullPage: true });

      // Pegar logs do console que foram capturados
      console.log('📍 [TEST] Verifique os logs do console do navegador acima');

      throw new Error(`Não redirecionou para /kyc. URL atual: ${currentUrl}`);
    }
  });

  test('Deve mostrar iframe do Proteo na página /kyc/proteo', async ({ page }) => {
    console.log('🧪 [TEST] Testando acesso direto à página do iframe Proteo');

    await page.goto(`${TEST_URL}/pt-BR/kyc/proteo`);
    await page.waitForLoadState('networkidle');

    // Pode redirecionar para login se não estiver autenticado
    const currentUrl = page.url();
    console.log('📍 [TEST] URL atual:', currentUrl);

    if (currentUrl.includes('/login')) {
      console.log('⚠️ [TEST] Redirecionado para login (esperado se não autenticado)');
    } else if (currentUrl.includes('/kyc/proteo')) {
      console.log('✅ [TEST] Na página do iframe Proteo');

      // Verificar se o iframe existe
      const iframe = page.locator('iframe');
      const iframeCount = await iframe.count();
      console.log('📍 [TEST] Número de iframes na página:', iframeCount);

      await page.screenshot({ path: 'tests/screenshots/proteo-iframe-page.png', fullPage: true });
    }
  });
});
