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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      about_gallery: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          is_visible: boolean | null
          position: number
          updated_at: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_visible?: boolean | null
          position?: number
          updated_at?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_visible?: boolean | null
          position?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_suggestions: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_completed: boolean
          link_label: string | null
          link_url: string | null
          priority: string | null
          suggestion_type: string
          target_date: string | null
          target_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean
          link_label?: string | null
          link_url?: string | null
          priority?: string | null
          suggestion_type?: string
          target_date?: string | null
          target_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean
          link_label?: string | null
          link_url?: string | null
          priority?: string | null
          suggestion_type?: string
          target_date?: string | null
          target_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_read: boolean | null
          message: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_read?: boolean | null
          message: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_read?: boolean | null
          message?: string
          phone?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          bank_account: string | null
          bank_holder: string | null
          bank_name: string | null
          created_at: string
          description: string | null
          id: string
          is_bank_enabled: boolean
          is_paypal_enabled: boolean
          is_visible: boolean
          is_zelle_enabled: boolean
          paypal_email: string | null
          subtitle: string | null
          title: string
          updated_at: string
          zelle_email: string | null
          zelle_phone: string | null
        }
        Insert: {
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_bank_enabled?: boolean
          is_paypal_enabled?: boolean
          is_visible?: boolean
          is_zelle_enabled?: boolean
          paypal_email?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          zelle_email?: string | null
          zelle_phone?: string | null
        }
        Update: {
          bank_account?: string | null
          bank_holder?: string | null
          bank_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_bank_enabled?: boolean
          is_paypal_enabled?: boolean
          is_visible?: boolean
          is_zelle_enabled?: boolean
          paypal_email?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          zelle_email?: string | null
          zelle_phone?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ministries: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          leader: string | null
          schedule: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          leader?: string | null
          schedule?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          leader?: string | null
          schedule?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          media_type: string | null
          mobile_image_url: string | null
          mobile_media_type: string | null
          mobile_video_file_url: string | null
          mobile_video_url: string | null
          section: string
          subtitle: string | null
          title: string | null
          updated_at: string | null
          video_file_url: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          media_type?: string | null
          mobile_image_url?: string | null
          mobile_media_type?: string | null
          mobile_video_file_url?: string | null
          mobile_video_url?: string | null
          section: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          video_file_url?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          media_type?: string | null
          mobile_image_url?: string | null
          mobile_media_type?: string | null
          mobile_video_file_url?: string | null
          mobile_video_url?: string | null
          section?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string | null
          video_file_url?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          created_at: string
          device_type: string
          id: string
          page_name: string | null
          page_path: string
          referrer: string | null
          session_id: string
          time_spent: number
        }
        Insert: {
          created_at?: string
          device_type?: string
          id?: string
          page_name?: string | null
          page_path: string
          referrer?: string | null
          session_id: string
          time_spent?: number
        }
        Update: {
          created_at?: string
          device_type?: string
          id?: string
          page_name?: string | null
          page_path?: string
          referrer?: string | null
          session_id?: string
          time_spent?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_content: {
        Row: {
          announcements_snapshot: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          events_snapshot: Json | null
          gallery_snapshot: Json | null
          id: string
          is_published: boolean
          ministries_snapshot: Json | null
          page_content_snapshot: Json | null
          published_at: string | null
          scheduled_at: string
          services_snapshot: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          announcements_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          events_snapshot?: Json | null
          gallery_snapshot?: Json | null
          id?: string
          is_published?: boolean
          ministries_snapshot?: Json | null
          page_content_snapshot?: Json | null
          published_at?: string | null
          scheduled_at: string
          services_snapshot?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          announcements_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          events_snapshot?: Json | null
          gallery_snapshot?: Json | null
          id?: string
          is_published?: boolean
          ministries_snapshot?: Json | null
          page_content_snapshot?: Json | null
          published_at?: string | null
          scheduled_at?: string
          services_snapshot?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string | null
          day: string | null
          description: string | null
          display_order: number | null
          extended_content: string | null
          icon: string | null
          id: string
          is_visible: boolean | null
          time: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          day?: string | null
          description?: string | null
          display_order?: number | null
          extended_content?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          time?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          day?: string | null
          description?: string | null
          display_order?: number | null
          extended_content?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          time?: string | null
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role: { Args: { target_user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pastor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "pastor" | "owner"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "pastor", "owner"],
    },
  },
} as const
