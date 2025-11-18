import ProteoKycEmbed from './proteo/page'

interface KYCPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function KYCPage({ params }: KYCPageProps) {
  // Simplesmente renderiza o componente do Proteo
  // Não precisa de verificações ou redirects - o componente já faz isso
  return <ProteoKycEmbed />
}
