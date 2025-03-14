export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          user_id: string
          owner_id?: string // For backward compatibility
          name: string
          description: string
          category: string
          address: string
          asking_price: number
          annual_revenue?: number
          profit?: number
          inventory_value?: number
          asset_value?: number
          established_year?: number
          employees?: number
          reason_for_selling?: string
          privacy_level: 'public' | 'limited' | 'private'
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          owner_id?: string
          name: string
          description: string
          category: string
          address: string
          asking_price: number
          annual_revenue?: number
          profit?: number
          inventory_value?: number
          asset_value?: number
          established_year?: number
          employees?: number
          reason_for_selling?: string
          privacy_level?: 'public' | 'limited' | 'private'
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          owner_id?: string
          name?: string
          description?: string
          category?: string
          address?: string
          asking_price?: number
          annual_revenue?: number
          profit?: number
          inventory_value?: number
          asset_value?: number
          established_year?: number
          employees?: number
          reason_for_selling?: string
          privacy_level?: 'public' | 'limited' | 'private'
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      business_files: {
        Row: {
          id: string
          business_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          visibility: 'public' | 'nda' | 'private'
          category: 'image' | 'document' | 'financial' | 'other'
          description?: string
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          file_path: string
          file_name: string
          file_type: string
          file_size: number
          visibility: 'public' | 'nda' | 'private'
          category: 'image' | 'document' | 'financial' | 'other'
          description?: string
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          file_path?: string
          file_name?: string
          file_type?: string
          file_size?: number
          visibility?: 'public' | 'nda' | 'private'
          category?: 'image' | 'document' | 'financial' | 'other'
          description?: string
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_files_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ndas: {
        Row: {
          id: string
          business_id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          message?: string
          signed_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string
          signed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          message?: string
          signed_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ndas_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ndas_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          business_id?: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          business_id?: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          business_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          user_type: 'buyer' | 'seller' | 'admin'
          avatar_url?: string
          created_at: string
          metadata?: Json
        }
        Insert: {
          id: string
          email: string
          full_name: string
          user_type: 'buyer' | 'seller' | 'admin'
          avatar_url?: string
          created_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          user_type?: 'buyer' | 'seller' | 'admin'
          avatar_url?: string
          created_at?: string
          metadata?: Json
        }
        Relationships: []
      }
    }
    Views: {
      // Materialized views for caching
      mv_business_summaries: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          address: string
          asking_price: number
          privacy_level: string
          status: string
          owner_name: string
          image_count: number
          total_files: number
          nda_count: number
          created_at: string
          updated_at: string
        }
        Relationships: [
          {
            foreignKeyName: "mv_business_summaries_id_fkey"
            columns: ["id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      mv_business_stats: {
        Row: {
          approved_count: number
          pending_count: number
          rejected_count: number
          seller_count: number
          avg_asking_price: number
          max_asking_price: number
          min_asking_price: number
          total_files: number
          total_ndas: number
          buyer_count: number
          total_seller_count: number
          admin_count: number
        }
      }
      mv_user_conversations: {
        Row: {
          message_id: string
          conversation_id: string
          sender_id: string
          recipient_id: string
          sender_name: string
          recipient_name: string
          content: string
          read: boolean
          created_at: string
          business_id?: string
          business_name?: string
          message_count: number
          unread_count: number
        }
        Relationships: [
          {
            foreignKeyName: "mv_user_conversations_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mv_user_conversations_recipient_id_fkey"
            columns: ["recipient_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      run_sql: {
        Args: {
          sql: string
        }
        Returns: undefined
      }
      refresh_materialized_views: {
        Args: Record<string, never>
        Returns: undefined
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