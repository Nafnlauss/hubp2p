export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_payment_accounts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          pix_key: string
          pix_key_holder: string | null
          pix_qr_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pix_key: string
          pix_key_holder?: string | null
          pix_qr_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pix_key?: string
          pix_key_holder?: string | null
          pix_qr_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_transactions: {
        Row: {
          admin_notes: string | null
          amount_brl: number
          amount_usd: number | null
          created_at: string | null
          crypto_network: string
          crypto_sent_at: string | null
          exchange_rate: number | null
          expires_at: string
          id: string
          payment_confirmed_at: string | null
          pix_key: string | null
          pix_key_holder: string | null
          status: string
          transaction_number: string
          tx_hash: string | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          amount_brl: number
          amount_usd?: number | null
          created_at?: string | null
          crypto_network: string
          crypto_sent_at?: string | null
          exchange_rate?: number | null
          expires_at: string
          id?: string
          payment_confirmed_at?: string | null
          pix_key?: string | null
          pix_key_holder?: string | null
          status?: string
          transaction_number: string
          tx_hash?: string | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          admin_notes?: string | null
          amount_brl?: number
          amount_usd?: number | null
          created_at?: string | null
          crypto_network?: string
          crypto_sent_at?: string | null
          exchange_rate?: number | null
          expires_at?: string
          id?: string
          payment_confirmed_at?: string | null
          pix_key?: string | null
          pix_key_holder?: string | null
          status?: string
          transaction_number?: string
          tx_hash?: string | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      kyc_verifications: {
        Row: {
          created_at: string | null
          document_back_url: string | null
          document_front_url: string | null
          document_number: string | null
          document_type: string | null
          id: string
          proteo_verification_id: string | null
          rejection_reason: string | null
          selfie_url: string | null
          status: Database['public']['Enums']['kyc_status']
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_back_url?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          proteo_verification_id?: string | null
          rejection_reason?: string | null
          selfie_url?: string | null
          status?: Database['public']['Enums']['kyc_status']
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_back_url?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          proteo_verification_id?: string | null
          rejection_reason?: string | null
          selfie_url?: string | null
          status?: Database['public']['Enums']['kyc_status']
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'kyc_verifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          message: string
          recipient: string
          response_data: Json | null
          sent_at: string | null
          status: Database['public']['Enums']['notification_status']
          transaction_id: string | null
          type: Database['public']['Enums']['notification_type']
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          recipient: string
          response_data?: Json | null
          sent_at?: string | null
          status?: Database['public']['Enums']['notification_status']
          transaction_id?: string | null
          type: Database['public']['Enums']['notification_type']
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          recipient?: string
          response_data?: Json | null
          sent_at?: string | null
          status?: Database['public']['Enums']['notification_status']
          transaction_id?: string | null
          type?: Database['public']['Enums']['notification_type']
        }
        Relationships: [
          {
            foreignKeyName: 'notification_logs_transaction_id_fkey'
            columns: ['transaction_id']
            isOneToOne: false
            referencedRelation: 'transactions'
            referencedColumns: ['id']
          },
        ]
      }
      payment_accounts: {
        Row: {
          account_agency: string | null
          account_holder: string | null
          account_number: string | null
          account_type: string
          bank_code: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          pix_key: string | null
          pix_key_holder: string | null
          updated_at: string | null
        }
        Insert: {
          account_agency?: string | null
          account_holder?: string | null
          account_number?: string | null
          account_type: string
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pix_key?: string | null
          pix_key_holder?: string | null
          updated_at?: string | null
        }
        Update: {
          account_agency?: string | null
          account_holder?: string | null
          account_number?: string | null
          account_type?: string
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pix_key?: string | null
          pix_key_holder?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          cpf: string
          created_at: string | null
          date_of_birth: string | null
          first_deposit_at: string | null
          first_deposit_completed: boolean | null
          full_name: string
          id: string
          is_admin: boolean | null
          kyc_completed_at: string | null
          kyc_status: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          updated_at: string | null
          wallet_configured: boolean | null
          wallet_configured_at: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cpf: string
          created_at?: string | null
          date_of_birth?: string | null
          first_deposit_at?: string | null
          first_deposit_completed?: boolean | null
          full_name: string
          id: string
          is_admin?: boolean | null
          kyc_completed_at?: string | null
          kyc_status?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          updated_at?: string | null
          wallet_configured?: boolean | null
          wallet_configured_at?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          cpf?: string
          created_at?: string | null
          date_of_birth?: string | null
          first_deposit_at?: string | null
          first_deposit_completed?: boolean | null
          full_name?: string
          id?: string
          is_admin?: boolean | null
          kyc_completed_at?: string | null
          kyc_status?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          updated_at?: string | null
          wallet_configured?: boolean | null
          wallet_configured_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          admin_notes: string | null
          amount_brl: number
          bank_account_agency: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          created_at: string | null
          crypto_amount: number | null
          crypto_network: Database['public']['Enums']['crypto_network']
          crypto_sent_at: string | null
          expires_at: string
          id: string
          payment_confirmed_at: string | null
          payment_method: Database['public']['Enums']['payment_method']
          pix_key: string | null
          pix_qr_code: string | null
          status: Database['public']['Enums']['transaction_status']
          transaction_number: string
          tx_hash: string | null
          updated_at: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          amount_brl: number
          bank_account_agency?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          crypto_amount?: number | null
          crypto_network: Database['public']['Enums']['crypto_network']
          crypto_sent_at?: string | null
          expires_at: string
          id?: string
          payment_confirmed_at?: string | null
          payment_method: Database['public']['Enums']['payment_method']
          pix_key?: string | null
          pix_qr_code?: string | null
          status?: Database['public']['Enums']['transaction_status']
          transaction_number: string
          tx_hash?: string | null
          updated_at?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          admin_notes?: string | null
          amount_brl?: number
          bank_account_agency?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          crypto_amount?: number | null
          crypto_network?: Database['public']['Enums']['crypto_network']
          crypto_sent_at?: string | null
          expires_at?: string
          id?: string
          payment_confirmed_at?: string | null
          payment_method?: Database['public']['Enums']['payment_method']
          pix_key?: string | null
          pix_qr_code?: string | null
          status?: Database['public']['Enums']['transaction_status']
          transaction_number?: string
          tx_hash?: string | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      wallets: {
        Row: {
          address: string
          created_at: string | null
          currency: string
          id: string
          is_primary: boolean | null
          label: string | null
          network: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          currency: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          network?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          currency?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          network?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_api_transaction_number: { Args: never; Returns: string }
      generate_transaction_number: { Args: never; Returns: string }
      verify_admin_password: {
        Args: { p_email: string; p_password: string }
        Returns: {
          email: string
          id: string
        }[]
      }
    }
    Enums: {
      crypto_network:
        | 'bitcoin'
        | 'ethereum'
        | 'polygon'
        | 'bsc'
        | 'solana'
        | 'tron'
      kyc_status: 'pending' | 'in_review' | 'approved' | 'rejected'
      notification_status: 'sent' | 'failed' | 'pending'
      notification_type: 'pushover' | 'email' | 'sms'
      payment_method: 'pix' | 'ted'
      transaction_status:
        | 'pending_payment'
        | 'payment_received'
        | 'converting'
        | 'sent'
        | 'cancelled'
        | 'expired'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      crypto_network: [
        'bitcoin',
        'ethereum',
        'polygon',
        'bsc',
        'solana',
        'tron',
      ],
      kyc_status: ['pending', 'in_review', 'approved', 'rejected'],
      notification_status: ['sent', 'failed', 'pending'],
      notification_type: ['pushover', 'email', 'sms'],
      payment_method: ['pix', 'ted'],
      transaction_status: [
        'pending_payment',
        'payment_received',
        'converting',
        'sent',
        'cancelled',
        'expired',
      ],
    },
  },
} as const
