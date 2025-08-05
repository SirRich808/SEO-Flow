
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: any }
  | any[]

export type Database = {
  public: {
    Tables: {
      audits: {
        Row: {
          created_at: string
          executive_summary: string | null
          full_report: Json | null
          id: string
          overall_health_score: number | null
          project_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          executive_summary?: string | null
          full_report?: Json | null
          id?: string
          overall_health_score?: number | null
          project_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          executive_summary?: string | null
          full_report?: Json | null
          id?: string
          overall_health_score?: number | null
          project_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      content_briefs: {
        Row: {
          brief_data: Json
          created_at: string
          id: string
          project_id: string
          target_keyword: string
          user_id: string
        }
        Insert: {
          brief_data: Json
          created_at?: string
          id?: string
          project_id: string
          target_keyword: string
          user_id: string
        }
        Update: {
          brief_data?: Json
          created_at?: string
          id?: string
          project_id?: string
          target_keyword?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_briefs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      outreach_prospects: {
        Row: {
          id: string
          created_at: string
          project_id: string
          user_id: string
          name: string
          website: string
          email: string | null
          status: string
          notes: string | null
          last_contacted: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          project_id: string
          user_id: string
          name: string
          website: string
          email?: string | null
          status?: string
          notes?: string | null
          last_contacted?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          project_id?: string
          user_id?: string
          name?: string
          website?: string
          email?: string | null
          status?: string
          notes?: string | null
          last_contacted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_prospects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          site_url: string
          user_id: string
          folder_access_credentials: string | null
          folder_pre_fix_reports: string | null
          folder_fixes_logs: string | null
          folder_post_fix_reports: string | null
          folder_communication_logs: string | null
          folder_final_report: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          site_url: string
          user_id: string
          folder_access_credentials?: string | null
          folder_pre_fix_reports?: string | null
          folder_fixes_logs?: string | null
          folder_post_fix_reports?: string | null
          folder_communication_logs?: string | null
          folder_final_report?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          site_url?: string
          user_id?: string
          folder_access_credentials?: string | null
          folder_pre_fix_reports?: string | null
          folder_fixes_logs?: string | null
          folder_post_fix_reports?: string | null
          folder_communication_logs?: string | null
          folder_final_report?: string | null
        }
        Relationships: []
      }
      serp_simulations: {
        Row: {
          id: string
          created_at: string
          project_id: string
          user_id: string
          target_keyword: string
          input_draft_content: string
          simulation_report: Json
        }
        Insert: {
          id?: string
          created_at?: string
          project_id: string
          user_id: string
          target_keyword: string
          input_draft_content: string
          simulation_report: Json
        }
        Update: {
          id?: string
          created_at?: string
          project_id?: string
          user_id?: string
          target_keyword?: string
          input_draft_content?: string
          simulation_report?: Json
        }
        Relationships: [
          {
            foreignKeyName: "serp_simulations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
