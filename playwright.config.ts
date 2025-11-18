import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /* Timeout máximo para cada teste */
  timeout: 60 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },

  /* Executar testes em paralelo */
  fullyParallel: false,

  /* Falhar build se houver testes esquecidos */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Número de workers */
  workers: process.env.CI ? 1 : 1,

  /* Reporter */
  reporter: [
    ['html'],
    ['list'],
  ],

  /* Configuração compartilhada entre todos os projetos */
  use: {
    /* URL base */
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    /* Coletar trace em caso de falha */
    trace: 'retain-on-failure',

    /* Screenshot em caso de falha */
    screenshot: 'only-on-failure',

    /* Video em caso de falha */
    video: 'retain-on-failure',

    /* Timeout para ações */
    actionTimeout: 15000,

    /* Timeout para navegação */
    navigationTimeout: 30000,
  },

  /* Configurar projetos para diferentes browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  /* Servidor de desenvolvimento (opcional) */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
