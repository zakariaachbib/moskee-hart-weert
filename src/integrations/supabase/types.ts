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
      academic_terms: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          actief: boolean
          created_at: string
          dag: string | null
          id: string
          locatie: string | null
          omschrijving: string | null
          tijd: string | null
          titel: string
          updated_at: string
        }
        Insert: {
          actief?: boolean
          created_at?: string
          dag?: string | null
          id?: string
          locatie?: string | null
          omschrijving?: string | null
          tijd?: string | null
          titel: string
          updated_at?: string
        }
        Update: {
          actief?: boolean
          created_at?: string
          dag?: string | null
          id?: string
          locatie?: string | null
          omschrijving?: string | null
          tijd?: string | null
          titel?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          attachment_url: string | null
          class_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          max_score: number | null
          title: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          class_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          class_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          max_score?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["class_status"]
          teacher_id: string | null
          term_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["class_status"]
          teacher_id?: string | null
          term_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["class_status"]
          teacher_id?: string | null
          term_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          bericht: string
          created_at: string
          email: string
          id: string
          naam: string
          onderwerp: string
        }
        Insert: {
          bericht: string
          created_at?: string
          email: string
          id?: string
          naam: string
          onderwerp: string
        }
        Update: {
          bericht?: string
          created_at?: string
          email?: string
          id?: string
          naam?: string
          onderwerp?: string
        }
        Relationships: []
      }
      crowdfunding_donations: {
        Row: {
          anoniem: boolean
          bedrag: number
          created_at: string
          email: string | null
          id: string
          mollie_payment_id: string | null
          naam: string | null
          project_id: string
          status: string
        }
        Insert: {
          anoniem?: boolean
          bedrag: number
          created_at?: string
          email?: string | null
          id?: string
          mollie_payment_id?: string | null
          naam?: string | null
          project_id: string
          status?: string
        }
        Update: {
          anoniem?: boolean
          bedrag?: number
          created_at?: string
          email?: string | null
          id?: string
          mollie_payment_id?: string | null
          naam?: string | null
          project_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crowdfunding_donations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "crowdfunding_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crowdfunding_projects: {
        Row: {
          actief: boolean
          afbeelding_url: string | null
          beschrijving: string | null
          created_at: string
          doelbedrag: number
          id: string
          opgehaald_bedrag: number
          slug: string | null
          titel: string
          updated_at: string
        }
        Insert: {
          actief?: boolean
          afbeelding_url?: string | null
          beschrijving?: string | null
          created_at?: string
          doelbedrag?: number
          id?: string
          opgehaald_bedrag?: number
          slug?: string | null
          titel: string
          updated_at?: string
        }
        Update: {
          actief?: boolean
          afbeelding_url?: string | null
          beschrijving?: string | null
          created_at?: string
          doelbedrag?: number
          id?: string
          opgehaald_bedrag?: number
          slug?: string | null
          titel?: string
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          bedrag: number
          created_at: string
          email: string | null
          id: string
          naam: string | null
          notitie: string | null
          type: string
        }
        Insert: {
          bedrag: number
          created_at?: string
          email?: string | null
          id?: string
          naam?: string | null
          notitie?: string | null
          type?: string
        }
        Update: {
          bedrag?: number
          created_at?: string
          email?: string | null
          id?: string
          naam?: string | null
          notitie?: string | null
          type?: string
        }
        Relationships: []
      }
      edu_user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["edu_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["edu_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["edu_role"]
          user_id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_materials: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          description: string | null
          external_link: string | null
          file_type: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_link?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_link?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_requests: {
        Row: {
          adres: string | null
          created_at: string
          email: string
          geboortedatum: string | null
          id: string
          naam: string
          opmerking: string | null
          status: string
          telefoon: string | null
        }
        Insert: {
          adres?: string | null
          created_at?: string
          email: string
          geboortedatum?: string | null
          id?: string
          naam: string
          opmerking?: string | null
          status?: string
          telefoon?: string | null
        }
        Update: {
          adres?: string | null
          created_at?: string
          email?: string
          geboortedatum?: string | null
          id?: string
          naam?: string
          opmerking?: string | null
          status?: string
          telefoon?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          email: string | null
          id: string
          mollie_payment_id: string
          naam: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          mollie_payment_id: string
          naam?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          mollie_payment_id?: string
          naam?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          is_active?: boolean
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sermons: {
        Row: {
          bestandsnaam: string
          bestandspad: string
          created_at: string
          datum: string
          id: string
          omschrijving: string | null
          titel: string
        }
        Insert: {
          bestandsnaam: string
          bestandspad: string
          created_at?: string
          datum?: string
          id?: string
          omschrijving?: string | null
          titel: string
        }
        Update: {
          bestandsnaam?: string
          bestandspad?: string
          created_at?: string
          datum?: string
          id?: string
          omschrijving?: string | null
          titel?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      get_edu_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["edu_role"]
      }
      has_edu_role: {
        Args: {
          _role: Database["public"]["Enums"]["edu_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      class_status: "active" | "archived" | "draft"
      edu_role: "admin" | "education_management" | "teacher" | "student"
      enrollment_status: "active" | "dropped" | "completed"
      notification_type:
        | "assignment"
        | "grade"
        | "announcement"
        | "alert"
        | "reminder"
      report_type:
        | "student_progress"
        | "teacher_activity"
        | "class_performance"
        | "school_overview"
      submission_status: "draft" | "submitted" | "late" | "reviewed"
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
      app_role: ["admin", "user"],
      class_status: ["active", "archived", "draft"],
      edu_role: ["admin", "education_management", "teacher", "student"],
      enrollment_status: ["active", "dropped", "completed"],
      notification_type: [
        "assignment",
        "grade",
        "announcement",
        "alert",
        "reminder",
      ],
      report_type: [
        "student_progress",
        "teacher_activity",
        "class_performance",
        "school_overview",
      ],
      submission_status: ["draft", "submitted", "late", "reviewed"],
    },
  },
} as const
