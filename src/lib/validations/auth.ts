import { z } from 'zod'

// Validação de CPF
const validateCPF = (cpf: string): boolean => {
  // Remove formatação
  const cleanCPF = cpf.replaceAll(/\D/g, '')

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  // Validação dos dígitos verificadores
  let sum = 0
  for (let index = 0; index < 9; index++) {
    sum += Number.parseInt(cleanCPF.charAt(index)) * (10 - index)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== Number.parseInt(cleanCPF.charAt(9))) return false

  sum = 0
  for (let index = 0; index < 10; index++) {
    sum += Number.parseInt(cleanCPF.charAt(index)) * (11 - index)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== Number.parseInt(cleanCPF.charAt(10))) return false

  return true
}

// Schema de Login
export const signInSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

// Schema de Registro - Step 1: Dados de acesso (sem refine)
const signUpStep1BaseSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter letras maiúsculas, minúsculas e números',
    ),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
})

// Schema de Registro - Step 1 com validação
export const signUpStep1Schema = signUpStep1BaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  },
)

// Schema de Registro - Step 2: Dados pessoais e endereço (sem refine nos campos individuais)
const signUpStep2BaseSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Nome completo é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .regex(/^[\sA-Za-zÀ-ÿ]+$/, 'Nome deve conter apenas letras'),
  dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
  addressZip: z
    .string()
    .min(1, 'CEP é obrigatório')
    .refine(
      (value) => value.replaceAll(/\D/g, '').length === 8,
      'CEP deve ter 8 dígitos',
    ),
  addressStreet: z
    .string()
    .min(1, 'Rua é obrigatória')
    .min(3, 'Rua deve ter no mínimo 3 caracteres'),
  addressNumber: z.string().min(1, 'Número é obrigatório'),
  addressComplement: z.string().optional(),
  addressCity: z
    .string()
    .min(1, 'Cidade é obrigatória')
    .min(2, 'Cidade deve ter no mínimo 2 caracteres'),
  addressState: z
    .string()
    .min(1, 'Estado é obrigatório')
    .length(2, 'Estado deve ter 2 caracteres (ex: SP)'),
})

// Schema de Registro - Step 2 com validações
export const signUpStep2Schema = signUpStep2BaseSchema.refine(
  (data) => {
    const birthDate = new Date(data.dateOfBirth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 18
  },
  {
    message: 'Você deve ter pelo menos 18 anos',
    path: ['dateOfBirth'],
  },
)

// Schema de Registro - Step 3: CPF (sem refine)
const signUpStep3BaseSchema = z.object({
  cpf: z.string().min(1, 'CPF é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
})

// Schema de Registro - Step 3 com validação de CPF
export const signUpStep3Schema = signUpStep3BaseSchema.refine(
  (data) => validateCPF(data.cpf),
  {
    message: 'CPF inválido',
    path: ['cpf'],
  },
)

// Schema completo de registro (merge dos schemas base sem refine)
export const signUpSchema = signUpStep1BaseSchema
  .merge(signUpStep2BaseSchema)
  .merge(signUpStep3BaseSchema)
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
  .refine((data) => validateCPF(data.cpf), {
    message: 'CPF inválido',
    path: ['cpf'],
  })
  .refine(
    (data) => {
      const birthDate = new Date(data.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 18
    },
    {
      message: 'Você deve ter pelo menos 18 anos',
      path: ['dateOfBirth'],
    },
  )

// Tipos inferidos
export type SignInFormData = z.infer<typeof signInSchema>
export type SignUpStep1FormData = z.infer<typeof signUpStep1Schema>
export type SignUpStep2FormData = z.infer<typeof signUpStep2Schema>
export type SignUpStep3FormData = z.infer<typeof signUpStep3Schema>
export type SignUpFormData = z.infer<typeof signUpSchema>
