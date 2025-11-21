import { test, expect } from '@playwright/test'

test('Verificar carregamento de clientes e transações no admin', async ({ page }) => {
  // Login no admin
  await page.goto('http://localhost:3000/admin-login')

  await page.fill('input[name="email"]', 'admin@admin.com')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')

  // Aguardar redirecionamento para dashboard
  await page.waitForURL('**/admin', { timeout: 10000 })

  // Aguardar um pouco para garantir que o CSS carregou
  await page.waitForTimeout(2000)

  console.log('✅ Login realizado com sucesso')

  // ==== TESTE PÁGINA DE CLIENTES ====
  console.log('\n📋 Navegando para página de clientes...')
  await page.click('a[href="/admin/clients"]')
  await page.waitForURL('**/admin/clients', { timeout: 10000 })
  await page.waitForTimeout(2000)

  // Verificar se a página carregou
  const clientsHeader = page.locator('h1:has-text("Clientes")')
  await expect(clientsHeader).toBeVisible()

  // Verificar se há clientes na tabela
  const clientsTable = page.locator('table')
  await expect(clientsTable).toBeVisible()

  // Verificar se há pelo menos uma linha de dados (excluindo header)
  const clientRows = page.locator('tbody tr')
  const clientCount = await clientRows.count()

  console.log(`📊 Encontrados ${clientCount} clientes na tabela`)

  if (clientCount > 0) {
    // Verificar se os dados aparecem na primeira linha
    const firstRow = clientRows.first()
    const fullName = firstRow.locator('td').nth(0)
    const email = firstRow.locator('td').nth(1)

    await expect(fullName).not.toBeEmpty()
    await expect(email).not.toBeEmpty()

    const fullNameText = await fullName.textContent()
    const emailText = await email.textContent()

    console.log(`👤 Primeiro cliente: ${fullNameText?.trim()} - ${emailText?.trim()}`)
  } else {
    console.log('⚠️ Nenhum cliente encontrado na tabela')
  }

  // Screenshot da página de clientes
  await page.screenshot({
    path: 'admin-clients-data.png',
    fullPage: true
  })
  console.log('📸 Screenshot salvo em admin-clients-data.png')

  // ==== TESTE PÁGINA DE TRANSAÇÕES ====
  console.log('\n💸 Navegando para página de transações...')
  await page.click('a[href="/admin/transactions"]')
  await page.waitForURL('**/admin/transactions', { timeout: 10000 })
  await page.waitForTimeout(2000)

  // Verificar se a página carregou
  const transactionsHeader = page.locator('h1:has-text("Transações")')
  await expect(transactionsHeader).toBeVisible()

  // Verificar se há transações na tabela
  const transactionsTable = page.locator('table')
  await expect(transactionsTable).toBeVisible()

  // Verificar se há pelo menos uma linha de dados (excluindo header)
  const transactionRows = page.locator('tbody tr')
  const transactionCount = await transactionRows.count()

  console.log(`📊 Encontradas ${transactionCount} transações na tabela`)

  if (transactionCount > 0) {
    // Verificar se os dados aparecem na primeira linha
    const firstRow = transactionRows.first()
    const transactionNumber = firstRow.locator('td').nth(0)
    const clientName = firstRow.locator('td').nth(1)
    const amount = firstRow.locator('td').nth(3)

    await expect(transactionNumber).not.toBeEmpty()
    await expect(clientName).not.toBeEmpty()
    await expect(amount).not.toBeEmpty()

    const txNumber = await transactionNumber.textContent()
    const client = await clientName.textContent()
    const value = await amount.textContent()

    console.log(`💰 Primeira transação: ${txNumber?.trim()} - Cliente: ${client?.trim()} - Valor: ${value?.trim()}`)
  } else {
    console.log('⚠️ Nenhuma transação encontrada na tabela')
  }

  // Screenshot da página de transações
  await page.screenshot({
    path: 'admin-transactions-data.png',
    fullPage: true
  })
  console.log('📸 Screenshot salvo em admin-transactions-data.png')

  // Aguardar 5 segundos para visualização
  await page.waitForTimeout(5000)

  console.log('\n✅ Teste concluído com sucesso!')
})
