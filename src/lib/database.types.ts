// Generated: supabase gen types typescript --linked --schema public > src/lib/database.types.ts
// Regenerate after a migration; do not edit.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agreements: {
        Row: {
          accepted_at: string
          document: string
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document: string
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          document?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          app_version: string
          device_hash: string
          first_seen_at: string
          id: string
          last_seen_at: string
          name: string
          os: string
          product: string
          released_at: string | null
          user_id: string
        }
        Insert: {
          app_version: string
          device_hash: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          name: string
          os: string
          product: string
          released_at?: string | null
          user_id: string
        }
        Update: {
          app_version?: string
          device_hash?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          name?: string
          os?: string
          product?: string
          released_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          ls_discount_id: number | null
          product: string
          program_id: string | null
          redeemed_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          ls_discount_id?: number | null
          product: string
          program_id?: string | null
          redeemed_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          ls_discount_id?: number | null
          product?: string
          program_id?: string | null
          redeemed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          created_at: string
          device_limit: number
          ends_at: string | null
          id: string
          kind: string
          ls_order_id: number | null
          ls_subscription_id: number | null
          plan: string | null
          product: string
          program_id: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_limit?: number
          ends_at?: string | null
          id?: string
          kind: string
          ls_order_id?: number | null
          ls_subscription_id?: number | null
          plan?: string | null
          product: string
          program_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_limit?: number
          ends_at?: string | null
          id?: string
          kind?: string
          ls_order_id?: number | null
          ls_subscription_id?: number | null
          plan?: string | null
          product?: string
          program_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          ls_customer_id: number | null
          marketing_opt_in: boolean
          marketing_opt_in_changed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          ls_customer_id?: number | null
          marketing_opt_in?: boolean
          marketing_opt_in_changed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          ls_customer_id?: number | null
          marketing_opt_in?: boolean
          marketing_opt_in_changed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          cap: number | null
          created_at: string
          ended_at: string | null
          id: string
          open: boolean
          product: string
          terms_version: string
        }
        Insert: {
          cap?: number | null
          created_at?: string
          ended_at?: string | null
          id: string
          open?: boolean
          product: string
          terms_version: string
        }
        Update: {
          cap?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          open?: boolean
          product?: string
          terms_version?: string
        }
        Relationships: []
      }
      trial_devices: {
        Row: {
          device_hash: string
          first_at: string
          product: string
          user_id: string | null
        }
        Insert: {
          device_hash: string
          first_at?: string
          product: string
          user_id?: string | null
        }
        Update: {
          device_hash?: string
          first_at?: string
          product?: string
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error: string | null
          event_name: string
          id: string
          payload: Json
          processed_at: string | null
          received_at: string
          source: string
          test_mode: boolean
        }
        Insert: {
          error?: string | null
          event_name: string
          id: string
          payload: Json
          processed_at?: string | null
          received_at?: string
          source?: string
          test_mode?: boolean
        }
        Update: {
          error?: string | null
          event_name?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string
          source?: string
          test_mode?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_holdings: {
        Args: { p_product: string; p_user: string }
        Returns: Json
      }
      beta_status: { Args: { p_program: string }; Returns: Json }
      check_in: {
        Args: {
          p_beta_build: boolean
          p_hash: string
          p_name: string
          p_os: string
          p_product: string
          p_user: string
          p_version: string
        }
        Returns: Json
      }
      entitlement_ends_at: {
        Args: { e: Database["public"]["Tables"]["entitlements"]["Row"] }
        Returns: string
      }
      join_beta: {
        Args: {
          p_marketing: boolean
          p_program: string
          p_terms_version: string
          p_user: string
        }
        Returns: Json
      }
      release_device: {
        Args: { p_device: string; p_product?: string; p_user: string }
        Returns: boolean
      }
      start_trial: {
        Args: {
          p_beta_build: boolean
          p_hash: string
          p_name: string
          p_os: string
          p_product: string
          p_user: string
          p_version: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
