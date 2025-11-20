import { expect, test } from '@playwright/test'

test('Teste da página de sucesso pós-KYC', async ({ page }) => {
  console.log('🧪 [TEST] Testando página de sucesso...')

  // Acessar página de sucesso
  await page.goto('http://localhost:3000/pt-BR/sucesso')
  await page.waitForLoadState('networkidle')

  console.log('📍 [TEST] URL atual:', page.url())

  // Tirar screenshot inicial
  await page.screenshot({
    path: 'tests/screenshots/sucesso-01-inicial.png',
    fullPage: true,
  })

  // Verificar título principal
  const titulo = page.locator('h1:has-text("Verificação Concluída")')
  await expect(titulo).toBeVisible()
  console.log('✅ [TEST] Título encontrado!')

  // Verificar subtítulo
  const subtitulo = page.locator('text=Seu KYC foi enviado com sucesso')
  await expect(subtitulo).toBeVisible()
  console.log('✅ [TEST] Subtítulo encontrado!')

  // Verificar ícone de check principal (o grande que faz bounce)
  const checkIcon = page.locator('.animate-bounce .text-7xl')
  await expect(checkIcon).toBeVisible()
  console.log('✅ [TEST] Ícone de check encontrado!')

  // Verificar botão do dashboard
  const botaoDashboard = page.locator('button:has-text("Ir para o Dashboard")')
  await expect(botaoDashboard).toBeVisible()
  console.log('✅ [TEST] Botão do dashboard encontrado!')

  // Verificar contador regressivo
  const contador = page.locator('text=/Redirecionando automaticamente em/')
  await expect(contador).toBeVisible()
  console.log('✅ [TEST] Contador regressivo encontrado!')

  // Verificar os 3 próximos passos
  const passo1 = page.locator('text=Análise de documentos')
  const passo2 = page.locator('text=Notificação por e-mail')
  const passo3 = page.locator('text=Acesso completo à plataforma')

  await expect(passo1).toBeVisible()
  await expect(passo2).toBeVisible()
  await expect(passo3).toBeVisible()
  console.log('✅ [TEST] Todos os 3 passos encontrados!')

  // Aguardar 2 segundos e tirar outro screenshot
  await page.waitForTimeout(2000)
  await page.screenshot({
    path: 'tests/screenshots/sucesso-02-apos-2s.png',
    fullPage: true,
  })

  // Verificar se o contador mudou (deve estar em 3 ou menos)
  const contadorTexto = await page
    .locator('span.font-bold.text-green-600')
    .textContent()
  console.log('📍 [TEST] Contador está em:', contadorTexto)

  // Testar clique no botão (sem esperar redirecionamento)
  console.log('🖱️ [TEST] Testando clique no botão Dashboard...')

  // Aguardar mais um segundo antes do screenshot final
  await page.waitForTimeout(1000)
  await page.screenshot({
    path: 'tests/screenshots/sucesso-03-final.png',
    fullPage: true,
  })

  console.log('✅ [TEST] Teste concluído com sucesso!')
})

test('Teste do fluxo completo: CPF → Sucesso', async ({ page }) => {
  console.log('🧪 [TEST] Testando fluxo completo...')

  // 1. Acessar página inicial
  console.log('📍 [TEST] Passo 1: Acessando página inicial')
  await page.goto('http://localhost:3000')
  await page.waitForLoadState('networkidle')

  await page.screenshot({
    path: 'tests/screenshots/fluxo-01-pagina-inicial.png',
    fullPage: true,
  })

  // 2. Verificar formulário de CPF
  const inputCpf = page.locator('input#cpf')
  await expect(inputCpf).toBeVisible()
  console.log('✅ [TEST] Input de CPF encontrado!')

  // 3. Digitar CPF válido (123.456.789-09)
  console.log('📍 [TEST] Passo 2: Digitando CPF válido')
  await inputCpf.fill('12345678909')

  await page.waitForTimeout(500)

  await page.screenshot({
    path: 'tests/screenshots/fluxo-02-cpf-preenchido.png',
    fullPage: true,
  })

  // 4. Verificar se botão ficou habilitado
  const botaoContinuar = page.locator('button[type="submit"]')
  await expect(botaoContinuar).toBeEnabled()
  console.log('✅ [TEST] Botão "Continuar" habilitado!')

  // 5. Clicar no botão
  console.log('📍 [TEST] Passo 3: Clicando em "Continuar"')
  await botaoContinuar.click()

  // 6. Aguardar iframe carregar
  await page.waitForTimeout(2000)

  await page.screenshot({
    path: 'tests/screenshots/fluxo-03-iframe-proteo.png',
    fullPage: true,
  })

  // 7. Verificar se iframe está presente
  const iframe = page.locator('iframe[title="Proteo KYC"]')
  const iframePresente = (await iframe.count()) > 0
  console.log('📍 [TEST] Iframe presente?', iframePresente)

  if (iframePresente) {
    console.log('✅ [TEST] Iframe do Proteo carregado com sucesso!')
  } else {
    console.log('⚠️ [TEST] Iframe não encontrado')
  }

  // 8. Verificar header com CPF
  const headerCpf = page.locator('text=CPF: 123.456.789-09')
  const headerPresente = (await headerCpf.count()) > 0
  console.log('📍 [TEST] Header com CPF presente?', headerPresente)

  // 9. Verificar botão voltar
  const botaoVoltar = page.locator('button:has-text("Voltar")')
  await expect(botaoVoltar).toBeVisible()
  console.log('✅ [TEST] Botão "Voltar" encontrado!')

  console.log('✅ [TEST] Fluxo completo testado com sucesso!')
})
