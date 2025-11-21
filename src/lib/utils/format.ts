/**
 * Formata um CPF para o padrão XXX.XXX.XXX-XX
 * @param cpf - CPF sem formatação (11 dígitos)
 * @returns CPF formatado
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replaceAll(/\D/g, '')

  if (cleanCPF.length !== 11) {
    return cpf
  }

  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Valida um CPF
 * @param cpf - CPF com ou sem formatação
 * @returns true se CPF é válido
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replaceAll(/\D/g, '')

  if (cleanCPF.length !== 11) {
    return false
  }

  // Check for sequences of same digits
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false
  }

  // Validar primeiro dígito verificador
  let sum = 0
  let remainder

  for (let index = 1; index <= 9; index++) {
    sum += Number.parseInt(cleanCPF.substring(index - 1, index)) * (11 - index)
  }

  remainder = (sum * 10) % 11

  if (remainder === 10 || remainder === 11) {
    remainder = 0
  }

  if (remainder !== Number.parseInt(cleanCPF.slice(9, 10))) {
    return false
  }

  // Validar segundo dígito verificador
  sum = 0

  for (let index = 1; index <= 10; index++) {
    sum += Number.parseInt(cleanCPF.substring(index - 1, index)) * (12 - index)
  }

  remainder = (sum * 10) % 11

  if (remainder === 10 || remainder === 11) {
    remainder = 0
  }

  if (remainder !== Number.parseInt(cleanCPF.slice(10, 11))) {
    return false
  }

  return true
}

/**
 * Formata um valor numérico para moeda brasileira (BRL)
 * @param value - Valor a formatar
 * @param locale - Locale para formatação (padrão: pt-BR)
 * @returns Valor formatado
 */
export function formatCurrency(
  value: number,
  locale: string = 'pt-BR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formata um endereço de criptomoeda truncando no meio
 * Exemplo: 1A1z7agoat4Vu5t... (mostra primeiros e últimos 10 caracteres)
 * @param address - Endereço completo
 * @param startChars - Número de caracteres iniciais a mostrar (padrão: 10)
 * @param endChars - Número de caracteres finais a mostrar (padrão: 10)
 * @returns Endereço truncado
 */
export function formatCryptoAddress(
  address: string,
  startChars: number = 10,
  endChars: number = 10,
): string {
  if (address.length <= startChars + endChars) {
    return address
  }

  const start = address.slice(0, Math.max(0, startChars))
  const end = address.slice(Math.max(0, address.length - endChars))

  return `${start}...${end}`
}

/**
 * Valida um endereço de carteira baseado na rede
 * @param address - Endereço da carteira
 * @param network - Rede (ethereum, bitcoin, solana, etc)
 * @returns true se endereço é válido para a rede
 */
export function validateWalletAddress(
  address: string,
  network: string,
): boolean {
  const addressRegexes: Record<string, RegExp> = {
    ethereum: /^0x[\dA-Fa-f]{40}$/,
    arbitrum: /^0x[\dA-Fa-f]{40}$/,
    polygon: /^0x[\dA-Fa-f]{40}$/,
    optimism: /^0x[\dA-Fa-f]{40}$/,
    bitcoin: /^[13][1-9A-HJ-NP-Za-km-z]{25,34}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    cardano: /^addr1[\da-z]{102}$/,
    polkadot: /^1[1-9A-HJ-NP-Za-km-z]{46,48}$/,
  }

  const networkLower = network.toLowerCase()
  const regex = addressRegexes[networkLower]

  if (!regex) {
    // If network not found, return basic validation
    return address.length > 20 && address.length < 150
  }

  return regex.test(address)
}

/**
 * Formata um número de telefone brasileiro
 * @param phone - Telefone sem formatação
 * @returns Telefone formatado (XX) XXXXX-XXXX
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replaceAll(/\D/g, '')

  if (cleanPhone.length !== 11) {
    return phone
  }

  return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

/**
 * Valida um número de telefone brasileiro
 * @param phone - Telefone com ou sem formatação
 * @returns true se telefone é válido
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replaceAll(/\D/g, '')
  return cleanPhone.length === 11 && /^[1-9]\d{9}$/.test(cleanPhone)
}

/**
 * Trunca um texto com reticências
 * @param text - Texto a truncar
 * @param maxLength - Comprimento máximo
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, Math.max(0, maxLength))}...`
}

/**
 * Formata um hash de transação (tx hash) truncado
 * @param hash - Hash completo da transação
 * @param startChars - Número de caracteres iniciais (padrão: 8)
 * @param endChars - Número de caracteres finais (padrão: 8)
 * @returns Hash truncado
 */
export function formatTxHash(
  hash: string,
  startChars: number = 8,
  endChars: number = 8,
): string {
  return formatCryptoAddress(hash, startChars, endChars)
}
