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
      academic_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          start_date: string
          term_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          start_date: string
          term_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          start_date?: string
          term_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "academic_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_events_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience_role: Database["public"]["Enums"]["edu_role"] | null
          class_id: string | null
          created_at: string
          created_by: string | null
          id: string
          message: string
          title: string
          updated_at: string
        }
        Insert: {
          audience_role?: Database["public"]["Enums"]["edu_role"] | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          title: string
          updated_at?: string
        }
        Update: {
          audience_role?: Database["public"]["Enums"]["edu_role"] | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_performance_summary"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "class_performance_summary"
            referencedColumns: ["class_id"]
          },
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
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
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
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_performance_summary"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
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
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
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
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
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
      course_badges: {
        Row: {
          condition_type: string
          condition_value: string | null
          course_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          condition_type?: string
          condition_value?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          condition_type?: string
          condition_value?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_badges_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_certificates: {
        Row: {
          certificate_number: string
          enrollment_id: string
          id: string
          issued_at: string
        }
        Insert: {
          certificate_number: string
          enrollment_id: string
          id?: string
          issued_at?: string
        }
        Update: {
          certificate_number?: string
          enrollment_id?: string
          id?: string
          issued_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          arabic_terms: Json | null
          content: string | null
          created_at: string
          id: string
          media_urls: Json | null
          module_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          arabic_terms?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          media_urls?: Json | null
          module_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          arabic_terms?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          media_urls?: Json | null
          module_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_levels: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_levels_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level_id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level_id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "course_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          is_final_exam: boolean
          module_id: string | null
          passing_score: number
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          is_final_exam?: boolean
          module_id?: string | null
          passing_score?: number
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          is_final_exam?: boolean
          module_id?: string | null
          passing_score?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          naam: string
          telefoon: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          naam: string
          telefoon?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          naam?: string
          telefoon?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          slug?: string | null
          title?: string
          updated_at?: string
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
      edu_documents: {
        Row: {
          academic_year: string | null
          category: string
          class_id: string | null
          created_at: string
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          academic_year?: string | null
          category?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          academic_year?: string | null
          category?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "edu_documents_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_performance_summary"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "edu_documents_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edu_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "edu_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      education_registrations: {
        Row: {
          achternaam: string
          adres: string
          akkoord_privacy: boolean
          created_at: string
          email: string
          geboortedatum: string
          geslacht: string
          id: string
          opmerkingen: string | null
          ouder_naam: string
          telefoon: string
          toestemming_foto: boolean
          voornamen: string
        }
        Insert: {
          achternaam: string
          adres: string
          akkoord_privacy?: boolean
          created_at?: string
          email: string
          geboortedatum: string
          geslacht?: string
          id?: string
          opmerkingen?: string | null
          ouder_naam: string
          telefoon: string
          toestemming_foto?: boolean
          voornamen: string
        }
        Update: {
          achternaam?: string
          adres?: string
          akkoord_privacy?: boolean
          created_at?: string
          email?: string
          geboortedatum?: string
          geslacht?: string
          id?: string
          opmerkingen?: string | null
          ouder_naam?: string
          telefoon?: string
          toestemming_foto?: boolean
          voornamen?: string
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
            referencedRelation: "class_performance_summary"
            referencedColumns: ["class_id"]
          },
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
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
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
      facility_reservations: {
        Row: {
          activity_type: string
          admin_notes: string | null
          created_at: string
          date: string
          duration_hours: number
          email: string
          end_time: string
          guest_count: number
          id: string
          name: string
          notes: string | null
          phone: string
          reservation_type: string
          rooms: number
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          activity_type?: string
          admin_notes?: string | null
          created_at?: string
          date: string
          duration_hours?: number
          email: string
          end_time: string
          guest_count?: number
          id?: string
          name: string
          notes?: string | null
          phone: string
          reservation_type?: string
          rooms?: number
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          admin_notes?: string | null
          created_at?: string
          date?: string
          duration_hours?: number
          email?: string
          end_time?: string
          guest_count?: number
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          reservation_type?: string
          rooms?: number
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          bericht: string
          created_at: string
          email: string
          id: string
        }
        Insert: {
          bericht: string
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          bericht?: string
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          submission_id: string
          updated_at: string
        }
        Insert: {
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          submission_id: string
          updated_at?: string
        }
        Update: {
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "grades_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
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
            referencedRelation: "class_performance_summary"
            referencedColumns: ["class_id"]
          },
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
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
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
      members: {
        Row: {
          achternaam: string
          bedrag: number
          created_at: string
          email: string
          id: string
          mollie_customer_id: string | null
          mollie_mandate_id: string | null
          mollie_subscription_id: string | null
          plaats: string
          postcode: string
          status: string
          straat: string
          telefoon: string | null
          type: string
          updated_at: string
          voornaam: string
        }
        Insert: {
          achternaam: string
          bedrag?: number
          created_at?: string
          email: string
          id?: string
          mollie_customer_id?: string | null
          mollie_mandate_id?: string | null
          mollie_subscription_id?: string | null
          plaats: string
          postcode: string
          status?: string
          straat: string
          telefoon?: string | null
          type?: string
          updated_at?: string
          voornaam: string
        }
        Update: {
          achternaam?: string
          bedrag?: number
          created_at?: string
          email?: string
          id?: string
          mollie_customer_id?: string | null
          mollie_mandate_id?: string | null
          mollie_subscription_id?: string | null
          plaats?: string
          postcode?: string
          status?: string
          straat?: string
          telefoon?: string | null
          type?: string
          updated_at?: string
          voornaam?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      quiz_questions: {
        Row: {
          correct_option_index: number
          explanation: string | null
          id: string
          options: Json
          question_text: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          correct_option_index?: number
          explanation?: string | null
          id?: string
          options?: Json
          question_text: string
          quiz_id: string
          sort_order?: number
        }
        Update: {
          correct_option_index?: number
          explanation?: string | null
          id?: string
          options?: Json
          question_text?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          file_url: string | null
          filters: Json | null
          generated_by: string | null
          id: string
          report_type: Database["public"]["Enums"]["report_type"]
          title: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          filters?: Json | null
          generated_by?: string | null
          id?: string
          report_type: Database["public"]["Enums"]["report_type"]
          title: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          filters?: Json | null
          generated_by?: string | null
          id?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      student_badges: {
        Row: {
          badge_id: string
          earned_at: string
          enrollment_id: string
          id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          enrollment_id: string
          id?: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          enrollment_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "course_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      student_lesson_progress: {
        Row: {
          completed_at: string
          enrollment_id: string
          id: string
          lesson_id: string
        }
        Insert: {
          completed_at?: string
          enrollment_id: string
          id?: string
          lesson_id: string
        }
        Update: {
          completed_at?: string
          enrollment_id?: string
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      student_quiz_attempts: {
        Row: {
          answers: Json | null
          attempted_at: string
          enrollment_id: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
        }
        Insert: {
          answers?: Json | null
          attempted_at?: string
          enrollment_id: string
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
        }
        Update: {
          answers?: Json | null
          attempted_at?: string
          enrollment_id?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          file_url: string | null
          id: string
          is_late: boolean
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submission_text: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          file_url?: string | null
          id?: string
          is_late?: boolean
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          file_url?: string | null
          id?: string
          is_late?: boolean
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "at_risk_students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      at_risk_students: {
        Row: {
          average_score: number | null
          email: string | null
          full_name: string | null
          incomplete_submissions: number | null
          late_submissions: number | null
          missed_deadlines: number | null
          student_id: string | null
        }
        Relationships: []
      }
      class_performance_summary: {
        Row: {
          average_score: number | null
          class_id: string | null
          class_title: string | null
          completed_submissions: number | null
          late_submissions: number | null
          teacher_name: string | null
          total_assignments: number | null
          total_students: number | null
        }
        Relationships: []
      }
      management_dashboard_summary: {
        Row: {
          overall_average_score: number | null
          total_active_classes: number | null
          total_active_enrollments: number | null
          total_active_students: number | null
          total_active_teachers: number | null
          total_at_risk_students: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_edu_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["edu_role"]
      }
      get_student_classes: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["class_status"]
          teacher_id: string | null
          term_id: string | null
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "classes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_teacher_classes: {
        Args: { _user_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["class_status"]
          teacher_id: string | null
          term_id: string | null
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "classes"
          isOneToOne: false
          isSetofReturn: true
        }
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
      is_course_admin: { Args: { _user_id: string }; Returns: boolean }
      is_enrolled_in_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      is_enrolled_in_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      is_student_of_teacher: {
        Args: { _student_id: string; _teacher_id: string }
        Returns: boolean
      }
      is_teacher_of_class: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type?: string
          _metadata?: Json
          _user_id: string
        }
        Returns: undefined
      }
      mark_notification_as_read: {
        Args: { _notification_id: string }
        Returns: undefined
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
