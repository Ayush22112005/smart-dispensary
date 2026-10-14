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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ambulance_requests: {
        Row: {
          created_at: string
          emergency_type: string
          eta_minutes: number
          id: string
          latitude: number | null
          location_note: string | null
          longitude: number | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emergency_type?: string
          eta_minutes?: number
          id?: string
          latitude?: number | null
          location_note?: string | null
          longitude?: number | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emergency_type?: string
          eta_minutes?: number
          id?: string
          latitude?: number | null
          location_note?: string | null
          longitude?: number | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          booked_by: string | null
          cancel_reason: string | null
          cancelled_by: string | null
          appointment_date: string
          created_at: string
          doctor_id: string
          id: string
          reason: string | null
          slot_id: string | null
          start_time: string
          status: string
          student_id: string
          token_number: number
          updated_at: string
        }
        Insert: {
          booked_by?: string | null
          cancel_reason?: string | null
          cancelled_by?: string | null
          appointment_date: string
          created_at?: string
          doctor_id: string
          id?: string
          reason?: string | null
          slot_id?: string | null
          start_time: string
          status?: string
          student_id: string
          token_number?: number
          updated_at?: string
        }
        Update: {
          booked_by?: string | null
          cancel_reason?: string | null
          cancelled_by?: string | null
          appointment_date?: string
          created_at?: string
          doctor_id?: string
          id?: string
          reason?: string | null
          slot_id?: string | null
          start_time?: string
          status?: string
          student_id?: string
          token_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "doctor_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_messages: {
        Row: {
          body: string
          consultation_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
        }
        Insert: {
          body: string
          consultation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
        }
        Update: {
          body?: string
          consultation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_messages_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          created_at: string
          doctor_id: string | null
          id: string
          mode: string
          status: string
          student_id: string
          symptoms: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          mode?: string
          status?: string
          student_id: string
          symptoms: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          mode?: string
          status?: string
          student_id?: string
          symptoms?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_slots: {
        Row: {
          booked_count: number
          capacity: number
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          slot_date: string
          start_time: string
        }
        Insert: {
          booked_count?: number
          capacity?: number
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          slot_date: string
          start_time: string
        }
        Update: {
          booked_count?: number
          capacity?: number
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          slot_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_slots_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_unavailability: {
        Row: {
          created_at: string
          created_by: string | null
          doctor_id: string
          end_date: string
          end_time: string | null
          id: string
          kind: string
          reason: string | null
          start_date: string
          start_time: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doctor_id: string
          end_date: string
          end_time?: string | null
          id?: string
          kind?: string
          reason?: string | null
          start_date: string
          start_time?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          end_date?: string
          end_time?: string | null
          id?: string
          kind?: string
          reason?: string | null
          start_date?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_unavailability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          email: string | null
          available_online: boolean
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          qualification: string | null
          speciality: string
          user_id: string | null
        }
        Insert: {
          email?: string | null
          available_online?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          qualification?: string | null
          speciality: string
          user_id?: string | null
        }
        Update: {
          email?: string | null
          available_online?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          qualification?: string | null
          speciality?: string
          user_id?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          relation: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          relation?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          relation?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_numbers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          phone: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          phone: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          phone?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      health_alerts: {
        Row: {
          category: string
          body: string
          created_at: string
          id: string
          severity: string
          title: string
        }
        Insert: {
          category?: string
          body: string
          created_at?: string
          id?: string
          severity?: string
          title: string
        }
        Update: {
          category?: string
          body?: string
          created_at?: string
          id?: string
          severity?: string
          title?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          notes: string | null
          record_date: string
          record_type: string
          student_id: string
          title: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          record_date?: string
          record_type?: string
          student_id: string
          title: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          record_date?: string
          record_type?: string
          student_id?: string
          title?: string
        }
        Relationships: []
      }
      medicine_request_items: {
        Row: {
          id: string
          medicine_id: string | null
          medicine_name: string
          quantity: number
          request_id: string
        }
        Insert: {
          id?: string
          medicine_id?: string | null
          medicine_name: string
          quantity?: number
          request_id: string
        }
        Update: {
          id?: string
          medicine_id?: string | null
          medicine_name?: string
          quantity?: number
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_request_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "medicine_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_requests: {
        Row: {
          created_at: string
          delivery_address: string
          id: string
          notes: string | null
          prescription_path: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_address?: string
          id?: string
          notes?: string | null
          prescription_path?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_address?: string
          id?: string
          notes?: string | null
          prescription_path?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      medicines: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          requires_prescription: boolean
          stock: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          requires_prescription?: boolean
          stock?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          requires_prescription?: boolean
          stock?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          is_read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          dosage: string | null
          duration: string | null
          id: string
          medicine_name: string
          prescription_id: string
        }
        Insert: {
          dosage?: string | null
          duration?: string | null
          id?: string
          medicine_name: string
          prescription_id: string
        }
        Update: {
          dosage?: string | null
          duration?: string | null
          id?: string
          medicine_name?: string
          prescription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          consultation_id: string | null
          created_at: string
          doctor_id: string | null
          id: string
          notes: string | null
          student_id: string
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          student_id: string
        }
        Update: {
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string | null
          blood_group: string | null
          branch: string | null
          chronic_conditions: string | null
          created_at: string
          email: string
          full_name: string
          hostel: string | null
          id: string
          phone: string | null
          share_records: boolean
          student_id: string | null
          updated_at: string
          year: string | null
        }
        Insert: {
          allergies?: string | null
          blood_group?: string | null
          branch?: string | null
          chronic_conditions?: string | null
          created_at?: string
          email?: string
          full_name?: string
          hostel?: string | null
          id: string
          phone?: string | null
          share_records?: boolean
          student_id?: string | null
          updated_at?: string
          year?: string | null
        }
        Update: {
          allergies?: string | null
          blood_group?: string | null
          branch?: string | null
          chronic_conditions?: string | null
          created_at?: string
          email?: string
          full_name?: string
          hostel?: string | null
          id?: string
          phone?: string | null
          share_records?: boolean
          student_id?: string | null
          updated_at?: string
          year?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      chemist_contacts: { Args: never; Returns: { name: string; phone: string }[] }
      claim_first_admin: { Args: never; Returns: boolean }
      has_any_role: { Args: { _roles: string[]; _user_id: string }; Returns: boolean }
      my_doctor_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      booked_slot_times: {
        Args: { _date: string }
        Returns: { doctor_id: string; start_time: string }[]
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "student"
        | "doctor"
        | "staff"
        | "admin"
        | "reception"
        | "ambulance"
        | "chemist"
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
      app_role: ["student", "doctor", "staff", "admin", "reception", "ambulance", "chemist"],
    },
  },
} as const
