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
      applications: {
        Row: {
          applied_at: string | null
          apply_method_used: string | null
          ats_score_used: number | null
          confirmation_id: string | null
          confirmation_screenshot: string | null
          cover_letter: string | null
          created_at: string
          email_sent: boolean | null
          error_message: string | null
          id: string
          job_id: string
          match_id: string | null
          notes: string | null
          resume_version: string | null
          status: string
          tailored_resume_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          apply_method_used?: string | null
          ats_score_used?: number | null
          confirmation_id?: string | null
          confirmation_screenshot?: string | null
          cover_letter?: string | null
          created_at?: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          job_id: string
          match_id?: string | null
          notes?: string | null
          resume_version?: string | null
          status?: string
          tailored_resume_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          apply_method_used?: string | null
          ats_score_used?: number | null
          confirmation_id?: string | null
          confirmation_screenshot?: string | null
          cover_letter?: string | null
          created_at?: string
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          job_id?: string
          match_id?: string | null
          notes?: string | null
          resume_version?: string | null
          status?: string
          tailored_resume_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          created_at: string | null
          degree: string | null
          end_year: number | null
          field_of_study: string | null
          gpa: string | null
          id: string
          institution: string | null
          start_year: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          degree?: string | null
          end_year?: number | null
          field_of_study?: string | null
          gpa?: string | null
          id?: string
          institution?: string | null
          start_year?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          degree?: string | null
          end_year?: number | null
          field_of_study?: string | null
          gpa?: string | null
          id?: string
          institution?: string | null
          start_year?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          ats_attempts: number | null
          ats_score: number | null
          computed_at: string | null
          created_at: string | null
          id: string
          job_id: string
          match_score: number | null
          matched_keywords: string[] | null
          missing_keywords: string[] | null
          ready_to_apply: boolean | null
          status: string | null
          tailored_resume_text: string | null
          tailored_resume_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ats_attempts?: number | null
          ats_score?: number | null
          computed_at?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          match_score?: number | null
          matched_keywords?: string[] | null
          missing_keywords?: string[] | null
          ready_to_apply?: boolean | null
          status?: string | null
          tailored_resume_text?: string | null
          tailored_resume_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ats_attempts?: number | null
          ats_score?: number | null
          computed_at?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          match_score?: number | null
          matched_keywords?: string[] | null
          missing_keywords?: string[] | null
          ready_to_apply?: boolean | null
          status?: string | null
          tailored_resume_text?: string | null
          tailored_resume_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          active: boolean | null
          apply_method: string | null
          apply_url: string | null
          company: string
          company_logo: string | null
          company_slug: string | null
          created_at: string
          description: string | null
          employment_type: string | null
          external_id: string | null
          fetched_at: string | null
          greenhouse_job_id: string | null
          id: string
          is_remote: boolean | null
          job_url: string | null
          keywords: string[] | null
          lever_posting_id: string | null
          location: string | null
          posted_date: string | null
          requirements: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          source: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          apply_method?: string | null
          apply_url?: string | null
          company: string
          company_logo?: string | null
          company_slug?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          fetched_at?: string | null
          greenhouse_job_id?: string | null
          id?: string
          is_remote?: boolean | null
          job_url?: string | null
          keywords?: string[] | null
          lever_posting_id?: string | null
          location?: string | null
          posted_date?: string | null
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          apply_method?: string | null
          apply_url?: string | null
          company?: string
          company_logo?: string | null
          company_slug?: string | null
          created_at?: string
          description?: string | null
          employment_type?: string | null
          external_id?: string | null
          fetched_at?: string | null
          greenhouse_job_id?: string | null
          id?: string
          is_remote?: boolean | null
          job_url?: string | null
          keywords?: string[] | null
          lever_posting_id?: string | null
          location?: string | null
          posted_date?: string | null
          requirements?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source?: string | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_role: string | null
          email: string | null
          experience_years: number | null
          full_name: string | null
          github: string | null
          headline: string | null
          id: string
          job_type: string | null
          linkedin: string | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          portfolio: string | null
          portfolio_url: string | null
          preferred_locations: string[] | null
          preferred_roles: string[] | null
          preferred_titles: string[] | null
          remote_preference: string | null
          resume_filename: string | null
          resume_original_url: string | null
          resume_parsed_at: string | null
          resume_raw_text: string | null
          salary_max: number | null
          salary_min: number | null
          summary: string | null
          updated_at: string
          user_id: string
          visa_status: string | null
        }
        Insert: {
          created_at?: string
          current_role?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          github?: string | null
          headline?: string | null
          id?: string
          job_type?: string | null
          linkedin?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio?: string | null
          portfolio_url?: string | null
          preferred_locations?: string[] | null
          preferred_roles?: string[] | null
          preferred_titles?: string[] | null
          remote_preference?: string | null
          resume_filename?: string | null
          resume_original_url?: string | null
          resume_parsed_at?: string | null
          resume_raw_text?: string | null
          salary_max?: number | null
          salary_min?: number | null
          summary?: string | null
          updated_at?: string
          user_id: string
          visa_status?: string | null
        }
        Update: {
          created_at?: string
          current_role?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string | null
          github?: string | null
          headline?: string | null
          id?: string
          job_type?: string | null
          linkedin?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio?: string | null
          portfolio_url?: string | null
          preferred_locations?: string[] | null
          preferred_roles?: string[] | null
          preferred_titles?: string[] | null
          remote_preference?: string | null
          resume_filename?: string | null
          resume_original_url?: string | null
          resume_parsed_at?: string | null
          resume_raw_text?: string | null
          salary_max?: number | null
          salary_min?: number | null
          summary?: string | null
          updated_at?: string
          user_id?: string
          visa_status?: string | null
        }
        Relationships: []
      }
      resume_versions: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          match_score: number | null
          optimized_text: string | null
          resume_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          match_score?: number | null
          optimized_text?: string | null
          resume_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          match_score?: number | null
          optimized_text?: string | null
          resume_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_versions_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          parsed_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          parsed_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          parsed_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      work_experience: {
        Row: {
          achievements: string[] | null
          company: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          location: string | null
          start_date: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements?: string[] | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements?: string[] | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          location?: string | null
          start_date?: string | null
          title?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
