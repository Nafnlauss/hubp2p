import { test, expect } from '@playwright/test';

test.describe('Simple Auth Test', () => {
  test('login and check dashboard without redirect loops', async ({ page }) => {
    console.log('\n=== TESTE SIMPLIFICADO DE LOGIN ===\n');

    // 1. Fazer login
    console.log('1. Fazendo login...');
    await page.goto('http://localhost:3001/pt-BR/login');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123456!');
    await page.click('button[type="submit"]');

    // 2. Aguardar um pouco para o login processar
    console.log('2. Aguardando processamento do login...');
    await page.waitForTimeout(3000);

    // 3. Verificar URL atual
    const currentUrl = page.url();
    console.log(`3. URL atual após login: ${currentUrl}`);

    // 4. Verificar cookies
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(c =>
      c.name.includes('sb-') ||
      c.name.includes('auth') ||
      c.name.includes('token')
    );

    console.log('4. Cookies de autenticação encontrados:');
    authCookies.forEach(c => {
      console.log(`   - ${c.name}: ${c.value.substring(0, 50)}...`);
    });

    // 5. Tentar acessar dashboard diretamente
    console.log('5. Tentando acessar dashboard diretamente...');
    await page.goto('http://localhost:3001/pt-BR/dashboard');

    // Aguardar um pouco
    await page.waitForTimeout(2000);

    // 6. Verificar URL final
    const finalUrl = page.url();
    console.log(`6. URL final: ${finalUrl}`);

    // 7. Verificar conteúdo da página
    const pageContent = await page.textContent('body');
    if (pageContent?.includes('Dashboard') || pageContent?.includes('Minhas Transações')) {
      console.log('✅ Dashboard carregado com sucesso!');
      expect(finalUrl).toContain('/dashboard');
    } else if (pageContent?.includes('KYC') || pageContent?.includes('Verificação')) {
      console.log('✅ Redirecionado para KYC (usuário sem KYC aprovado)');
      expect(finalUrl).toContain('/kyc');
    } else if (pageContent?.includes('Login') || pageContent?.includes('Entrar')) {
      console.log('❌ Ainda na página de login - autenticação falhou');
      throw new Error('Autenticação falhou - ainda na página de login');
    }

    console.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===\n');
  });

  test('check if session persists after refresh', async ({ page }) => {
    console.log('\n=== TESTE DE PERSISTÊNCIA DE SESSÃO ===\n');

    // 1. Fazer login
    console.log('1. Fazendo login...');
    await page.goto('http://localhost:3001/pt-BR/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const urlAfterLogin = page.url();
    console.log(`2. URL após login: ${urlAfterLogin}`);

    // 2. Recarregar a página
    console.log('3. Recarregando página...');
    await page.reload();
    await page.waitForTimeout(2000);

    const urlAfterReload = page.url();
    console.log(`4. URL após reload: ${urlAfterReload}`);

    // 3. Verificar se ainda está autenticado
    if (urlAfterReload.includes('/login')) {
      console.log('❌ Sessão perdida após reload - redirecionado para login');
      throw new Error('Sessão não persistiu após reload');
    } else {
      console.log('✅ Sessão persistiu após reload');
      expect(urlAfterReload).not.toContain('/login');
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
  });
});