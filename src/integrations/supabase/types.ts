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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          created_at: string
          id: string
          instagram: string | null
          message: string | null
          owner_id: string
          reviewed_at: string | null
          status: string
          viewer_id: string
          viewer_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instagram?: string | null
          message?: string | null
          owner_id: string
          reviewed_at?: string | null
          status?: string
          viewer_id?: string
          viewer_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instagram?: string | null
          message?: string | null
          owner_id?: string
          reviewed_at?: string | null
          status?: string
          viewer_id?: string
          viewer_name?: string | null
        }
        Relationships: []
      }
      catalog_places: {
        Row: {
          activity_group: string | null
          area: string | null
          best_time: string[]
          category: string | null
          city: string
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          google_place_id: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          name_ko: string | null
          price_info: string | null
          sheet_key: string | null
          source: string
          website: string | null
        }
        Insert: {
          activity_group?: string | null
          area?: string | null
          best_time?: string[]
          category?: string | null
          city: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          name_ko?: string | null
          price_info?: string | null
          sheet_key?: string | null
          source?: string
          website?: string | null
        }
        Update: {
          activity_group?: string | null
          area?: string | null
          best_time?: string[]
          category?: string | null
          city?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          name_ko?: string | null
          price_info?: string | null
          sheet_key?: string | null
          source?: string
          website?: string | null
        }
        Relationships: []
      }
      day_plan_items: {
        Row: {
          catalog_place_id: string
          created_at: string
          id: string
          plan_id: string
          position: number
          slot: string | null
        }
        Insert: {
          catalog_place_id: string
          created_at?: string
          id?: string
          plan_id: string
          position?: number
          slot?: string | null
        }
        Update: {
          catalog_place_id?: string
          created_at?: string
          id?: string
          plan_id?: string
          position?: number
          slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "day_plan_items_catalog_place_id_fkey"
            columns: ["catalog_place_id"]
            isOneToOne: false
            referencedRelation: "catalog_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "day_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      day_plans: {
        Row: {
          city: string
          country: string
          created_at: string
          done: boolean
          id: string
          note: string | null
          owner_id: string
          planned_date: string | null
          shared: boolean
          title: string
          updated_at: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          done?: boolean
          id?: string
          note?: string | null
          owner_id?: string
          planned_date?: string | null
          shared?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          done?: boolean
          id?: string
          note?: string | null
          owner_id?: string
          planned_date?: string | null
          shared?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          catalog_place_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          catalog_place_id: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          catalog_place_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_catalog_place_id_fkey"
            columns: ["catalog_place_id"]
            isOneToOne: false
            referencedRelation: "catalog_places"
            referencedColumns: ["id"]
          },
        ]
      }
      location_pings: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          lat: number
          lng: number
          share_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          share_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_pings_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "location_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      location_shares: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          owner_id: string
          recipient_email: string
          status: string
          trust_ack: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          owner_id?: string
          recipient_email: string
          status?: string
          trust_ack?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          owner_id?: string
          recipient_email?: string
          status?: string
          trust_ack?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      place_suggestions: {
        Row: {
          catalog_place_id: string
          created_at: string
          created_by: string
          field: string
          id: string
          proposed_value: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          catalog_place_id: string
          created_at?: string
          created_by?: string
          field: string
          id?: string
          proposed_value: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          catalog_place_id?: string
          created_at?: string
          created_by?: string
          field?: string
          id?: string
          proposed_value?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_suggestions_catalog_place_id_fkey"
            columns: ["catalog_place_id"]
            isOneToOne: false
            referencedRelation: "catalog_places"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          area: string | null
          catalog_place_id: string | null
          category: string | null
          created_at: string
          favorite: boolean
          google_place_id: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          note: string | null
          photo_path: string | null
          position: number
          trip_id: string
          visited: boolean
        }
        Insert: {
          area?: string | null
          catalog_place_id?: string | null
          category?: string | null
          created_at?: string
          favorite?: boolean
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          note?: string | null
          photo_path?: string | null
          position?: number
          trip_id: string
          visited?: boolean
        }
        Update: {
          area?: string | null
          catalog_place_id?: string | null
          category?: string | null
          created_at?: string
          favorite?: boolean
          google_place_id?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          note?: string | null
          photo_path?: string | null
          position?: number
          trip_id?: string
          visited?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "places_catalog_place_id_fkey"
            columns: ["catalog_place_id"]
            isOneToOne: false
            referencedRelation: "catalog_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          created_at: string
          display_name: string
          handle: string
          id: string
          instagram: string | null
          is_public: boolean
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          handle: string
          id: string
          instagram?: string | null
          is_public?: boolean
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          instagram?: string | null
          is_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      suggestion_votes: {
        Row: {
          agree: boolean
          created_at: string
          id: string
          suggestion_id: string
          user_id: string
        }
        Insert: {
          agree: boolean
          created_at?: string
          id?: string
          suggestion_id: string
          user_id?: string
        }
        Update: {
          agree?: boolean
          created_at?: string
          id?: string
          suggestion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "place_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_documents: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          path: string
          position: number
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          path: string
          position?: number
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          path?: string
          position?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          created_at: string
          email: string
          id: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          trip_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          cover_path: string | null
          cover_url: string | null
          created_at: string
          destination: string | null
          id: string
          owner_id: string
          share_slug: string
          title: string
          visibility: string
        }
        Insert: {
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          owner_id?: string
          share_slug?: string
          title: string
          visibility?: string
        }
        Update: {
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          owner_id?: string
          share_slug?: string
          title?: string
          visibility?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visited_places: {
        Row: {
          catalog_place_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          catalog_place_id: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          catalog_place_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visited_places_catalog_place_id_fkey"
            columns: ["catalog_place_id"]
            isOneToOne: false
            referencedRelation: "catalog_places"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_place_suggestion: {
        Args: { _reviewer: string; _suggestion_id: string }
        Returns: undefined
      }
      can_view_location_share: { Args: { _share_id: string }; Returns: boolean }
      can_view_trip: { Args: { _trip_id: string }; Returns: boolean }
      has_follower_access: { Args: { _owner_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_trip_owner: { Args: { _trip_id: string }; Returns: boolean }
      owns_location_share: { Args: { _share_id: string }; Returns: boolean }
      profile_trip_previews: {
        Args: { _handle: string }
        Returns: {
          cover_path: string
          cover_url: string
          destination: string
          id: string
          place_count: number
          share_slug: string
          title: string
          unlocked: boolean
        }[]
      }
      review_place_suggestion: {
        Args: { _approve: boolean; _suggestion_id: string }
        Returns: undefined
      }
      share_gate_info: {
        Args: { _slug: string }
        Returns: {
          destination: string
          owner_handle: string
          owner_name: string
          title: string
          unlocked: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
