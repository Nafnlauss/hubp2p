'use server'

/**
 * BitGet API Integration
 * Fetches USDT/BRL exchange rate and calculates final price with markup
 */

export interface BitGetTickerResponse {
  code: string
  msg: string
  requestTime: number
  data: Array<{
    symbol: string
    high24h: string
    open: string
    low24h: string
    lastPr: string
    quoteVolume: string
    baseVolume: string
    usdtVolume: string
    bidPr: string
    askPr: string
    bidSz: string
    askSz: string
    openUtc: string
    ts: string
    changeUtc24h: string
    change24h: string
  }>
}

export interface ExchangeRateResult {
  usdtToBrl: number
  finalRate: number
  displayRate: number
  markup: {
    fixed: number
    percentage: number
  }
}

const BITGET_API_URL = 'https://api.bitget.com/api/v2/spot/market/tickers'
const MARKUP_FIXED = 0.05 // R$ 0,05
const MARKUP_PERCENTAGE = 0.008 // 0,80%

/**
 * Fetches current USDT/BRL exchange rate from BitGet API
 */
export async function getUsdtBrlRate(): Promise<number> {
  try {
    const response = await fetch(`${BITGET_API_URL}?symbol=USDTBRL`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 30 }, // Cache por 30 segundos
    })

    if (!response.ok) {
      throw new Error(`BitGet API error: ${response.status}`)
    }

    const data: BitGetTickerResponse = await response.json()

    if (!data.data || data.data.length === 0) {
      throw new Error('No data returned from BitGet API')
    }

    const ticker = data.data[0]
    const rate = Number.parseFloat(ticker.lastPr)

    if (Number.isNaN(rate) || rate <= 0) {
      throw new Error('Invalid exchange rate received')
    }

    return rate
  } catch (error) {
    console.error('Error fetching USDT/BRL rate:', error)
    throw new Error('Não foi possível obter a cotação atual. Tente novamente.')
  }
}

/**
 * Calculates final exchange rate with markup (fixed + percentage)
 * Formula: (USDT/BRL rate + R$ 0,05) * (1 + 0,80%)
 */
export async function getFinalExchangeRate(): Promise<ExchangeRateResult> {
  const usdtToBrl = await getUsdtBrlRate()

  // Add fixed markup (R$ 0,05)
  const withFixedMarkup = usdtToBrl + MARKUP_FIXED

  // Add percentage markup (0,80%)
  const finalRate = withFixedMarkup * (1 + MARKUP_PERCENTAGE)

  return {
    usdtToBrl,
    finalRate,
    displayRate: withFixedMarkup, // Taxa exibida ao cliente (BitGet + R$ 0,05)
    markup: {
      fixed: MARKUP_FIXED,
      percentage: MARKUP_PERCENTAGE,
    },
  }
}

/**
 * Converts BRL amount to USD using current exchange rate with markup
 */
export async function convertBrlToUsd(brlAmount: number): Promise<number> {
  const { finalRate } = await getFinalExchangeRate()

  // BRL / (USDT/BRL rate) = USDT amount
  const usdAmount = brlAmount / finalRate

  return Number.parseFloat(usdAmount.toFixed(2))
}

/**
 * Converts USD amount to BRL using current exchange rate with markup
 */
export async function convertUsdToBrl(usdAmount: number): Promise<number> {
  const { finalRate } = await getFinalExchangeRate()

  // USD * (USDT/BRL rate) = BRL amount
  const brlAmount = usdAmount * finalRate

  return Number.parseFloat(brlAmount.toFixed(2))
}
