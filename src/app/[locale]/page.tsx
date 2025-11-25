import { headers } from 'next/headers'

import ComprarPage from '@/components/ComprarPage'
import HomePage from '@/components/HomePage'

export default async function Page() {
  // Detectar hostname via headers no servidor
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const xForwardedHost = headersList.get('x-forwarded-host') || ''
  const xOriginalHost = headersList.get('x-original-host') || ''

  // Verificar se é o subdomínio api
  const allHosts = [host, xForwardedHost, xOriginalHost]
  const isApiSubdomain = allHosts.some(
    (h) =>
      h.includes('api.hubp2p.com') ||
      h.includes('api%2Ehubp2p') ||
      h.startsWith('api.'),
  )

  console.log('[PAGE] Host detection:', {
    host,
    xForwardedHost,
    isApiSubdomain,
  })

  // Renderizar página apropriada baseado no hostname
  if (isApiSubdomain) {
    return <ComprarPage />
  }

  return <HomePage />
}
