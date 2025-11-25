'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from '@/lib/navigation'

function formatCPF(value: string) {
  const numbers = value.replaceAll(/\D/g, '')
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function KYCManualPage() {
  const router = useRouter()
  const [cpf, setCpf] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleCPFChange(event: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCPF(event.target.value)
    setCpf(formatted)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const cpfNumbers = cpf.replaceAll(/\D/g, '')

    if (cpfNumbers.length !== 11) {
      alert('Por favor, insira um CPF válido com 11 dígitos')
      return
    }

    setIsLoading(true)

    // Construir URL do Proteo com o CPF
    const proteoUrl = new URL(
      'https://onboarding.proteo.com.br/?tenant=dias_marketplace&background_check_id=3c35bb87-0b04-4130-a026-e4ee9f8ce2c4',
    )
    proteoUrl.searchParams.set('document', cpfNumbers)

    console.log('🔗 [KYC MANUAL] URL do Proteo:', proteoUrl.toString())
    console.log('🆔 [KYC MANUAL] CPF:', cpfNumbers)

    // Redirecionar para página com o CPF
    router.push('/kyc/proteo-direct?cpf=${cpfNumbers}')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Verificação de Identidade (KYC)
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Digite seu CPF para iniciar a verificação
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                maxLength={14}
                required
                className="text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Insira seu CPF para prosseguir com a verificação
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Iniciar Verificação'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
