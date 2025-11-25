import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Comprar USDT | HubP2P API',
  description: 'Compre USDT de forma rapida e facil via PIX',
}

export default function ComprarPage() {
  // Redirecionar /comprar para api.hubp2p.com
  redirect('https://api.hubp2p.com')
}
