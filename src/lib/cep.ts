/**
 * Funções para buscar endereço por CEP usando ViaCEP API
 */

export interface AddressData {
  cep: string
  logradouro: string // Rua
  complemento: string
  bairro: string
  localidade: string // Cidade
  uf: string // Estado
  erro?: boolean
}

/**
 * Busca informações de endereço pelo CEP
 * @param cep - CEP com ou sem formatação
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchAddressByCEP(
  cep: string,
): Promise<AddressData | null> {
  try {
    // Remove formatação do CEP
    const cleanCEP = cep.replaceAll(/\D/g, '')

    // Valida se tem 8 dígitos
    if (cleanCEP.length !== 8) {
      return null
    }

    // Chama API ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data: AddressData = await response.json()

    // ViaCEP retorna { erro: true } quando não encontra o CEP
    if (data.erro) {
      return null
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return null
  }
}

/**
 * Formata os dados do ViaCEP para o formato do formulário
 */
export function formatAddressData(data: AddressData) {
  return {
    addressStreet: data.logradouro || '',
    addressCity: data.localidade || '',
    addressState: data.uf || '',
    addressComplement: data.complemento || '',
  }
}
