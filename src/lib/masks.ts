/**
 * Funções de formatação automática para campos de formulário
 */

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(value: string): string {
  // Remove tudo que não é dígito
  const numbers = value.replaceAll(/\D/g, '')

  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11)

  // Aplica a formatação
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
  }
}

/**
 * Formata Telefone: (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhone(value: string): string {
  // Remove tudo que não é dígito
  const numbers = value.replaceAll(/\D/g, '')

  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11)

  // Aplica a formatação
  if (limited.length === 0) {
    return ''
  } else if (limited.length <= 2) {
    return `(${limited}`
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else if (limited.length <= 10) {
    // Celular com 8 dígitos ou fixo
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
  } else {
    // Celular com 9 dígitos
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }
}

/**
 * Formata CEP: 00000-000
 */
export function formatCEP(value: string): string {
  // Remove tudo que não é dígito
  const numbers = value.replaceAll(/\D/g, '')

  // Limita a 8 dígitos
  const limited = numbers.slice(0, 8)

  // Aplica a formatação
  return limited.length <= 5
    ? limited
    : `${limited.slice(0, 5)}-${limited.slice(5)}`
}

/**
 * Remove formatação de CPF
 */
export function unformatCPF(value: string): string {
  return value.replaceAll(/\D/g, '')
}

/**
 * Remove formatação de telefone
 */
export function unformatPhone(value: string): string {
  return value.replaceAll(/\D/g, '')
}

/**
 * Remove formatação de CEP
 */
export function unformatCEP(value: string): string {
  return value.replaceAll(/\D/g, '')
}
