export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          location: string | null;
          phone: string | null;
          linkedin: string | null;
          github: string | null;
          portfolio: string | null;
          current_role: string | null;
          experience_years: number | null;
          preferred_roles: string[] | null;
          preferred_locations: string[] | null;
          salary_min: number | null;
          salary_max: number | null;
          job_type: string | null;
          visa_status: string | null;
          work_auth: string | null;
          profile_completion: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      experiences: {
        Row: {
          id: string;
          user_id: string;
          job_title: string;
          company: string;
          location: string | null;
          start_date: string;
          end_date: string | null;
          description: string | null;
          bullet_points: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["experiences"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["experiences"]["Row"]>;
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          skill_name: string;
          proficiency_level: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["skills"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["skills"]["Row"]>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          company: string;
          location: string | null;
          description: string | null;
          job_url: string | null;
          source: string | null;
          source_job_id: string | null;
          posted_date: string | null;
          job_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["jobs"]["Row"]> &
          Pick<Database["public"]["Tables"]["jobs"]["Row"], "title" | "company" | "job_key">;
        Update: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          status: "saved" | "applied" | "interview" | "rejected";
          applied_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["applications"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Row"]>;
        Relationships: [];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          file_url: string | null;
          storage_path: string | null;
          parsed_text: string | null;
          parsed_data: Json;
          resume_score: number;
          suggestions: Json;
          filename: string | null;
          analyzed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["resumes"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["resumes"]["Row"]>;
        Relationships: [];
      };
      resume_versions: {
        Row: {
          id: string;
          resume_id: string;
          job_id: string | null;
          optimized_text: string | null;
          match_score: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["resume_versions"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["resume_versions"]["Row"]>;
        Relationships: [];
      };
      job_preferences: {
        Row: {
          id: string;
          user_id: string;
          desired_role: string | null;
          preferred_location: string | null;
          salary_range: string | null;
          job_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["job_preferences"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_preferences"]["Row"]>;
        Relationships: [];
      };
      job_matches: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          match_score: number;
          status: "saved" | "applied";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["job_matches"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["job_matches"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type TableName = keyof Database["public"]["Tables"];
export type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];
export type InsertDto<T extends TableName> = Database["public"]["Tables"][T]["Insert"];
export type UpdateDto<T extends TableName> = Database["public"]["Tables"][T]["Update"];
