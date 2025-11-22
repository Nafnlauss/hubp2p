export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

/**
 * Endpoint de DEBUG para testar webhook do Proteo
 * Aceita GET e POST, loga tudo, e retorna detalhes completos
 */

export async function GET(request: Request) {
  const url = new URL(request.url)
  const headers = Object.fromEntries(request.headers.entries())

  console.log('🔍 [DEBUG GET] Recebido:', {
    url: url.toString(),
    method: 'GET',
    headers,
    searchParams: Object.fromEntries(url.searchParams.entries()),
  })

  return NextResponse.json({
    success: true,
    debug: {
      method: 'GET',
      url: url.toString(),
      headers,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      message: 'Webhook recebido com sucesso via GET (modo debug)',
    },
  })
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const headers = Object.fromEntries(request.headers.entries())

  let body
  try {
    body = await request.json()
  } catch {
    body = await request.text()
  }

  console.log('🔍 [DEBUG POST] Recebido:', {
    url: url.toString(),
    method: 'POST',
    headers,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    body,
  })

  return NextResponse.json({
    success: true,
    debug: {
      method: 'POST',
      url: url.toString(),
      headers,
      searchParams: Object.fromEntries(url.searchParams.entries()),
      body,
      message: 'Webhook recebido com sucesso via POST (modo debug)',
    },
  })
}
