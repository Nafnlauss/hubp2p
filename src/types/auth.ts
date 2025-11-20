export interface SignUpData {
  // Step 1: Dados de acesso
  email: string
  password: string
  confirmPassword: string

  // Step 2: Dados pessoais
  fullName: string
  cpf: string
  phone: string
  dateOfBirth: string

  // Step 3: Endereço
  addressZip: string
  addressStreet: string
  addressNumber: string
  addressComplement?: string
  addressCity: string
  addressState: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  error?: string
  redirectTo?: string
  credentials?: {
    email: string
    password: string
  }
}

export interface UserProfile {
  id: string
  email: string
  fullName: string
  cpf: string
  phone: string | null
  dateOfBirth: string | null
  addressZip: string | null
  addressStreet: string | null
  addressNumber: string | null
  addressComplement: string | null
  addressCity: string | null
  addressState: string | null
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}
