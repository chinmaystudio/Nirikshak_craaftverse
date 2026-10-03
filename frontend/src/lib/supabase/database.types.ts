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
      ai_insights: {
        Row: {
          ai_run_id: string | null
          audience: string | null
          confidence: number | null
          created_at: string | null
          evidence: Json | null
          government_status: string | null
          id: string
          insight_type: string
          is_public: boolean | null
          progress_update_id: string | null
          project_id: string
          recommended_actions: Json | null
          risk_level: string | null
          risk_score: number | null
          severity: string | null
          status: string | null
          summary: string
          title: string
        }
        Insert: {
          ai_run_id?: string | null
          audience?: string | null
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          government_status?: string | null
          id?: string
          insight_type: string
          is_public?: boolean | null
          progress_update_id?: string | null
          project_id: string
          recommended_actions?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          severity?: string | null
          status?: string | null
          summary: string
          title: string
        }
        Update: {
          ai_run_id?: string | null
          audience?: string | null
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          government_status?: string | null
          id?: string
          insight_type?: string
          is_public?: boolean | null
          progress_update_id?: string | null
          project_id?: string
          recommended_actions?: Json | null
          risk_level?: string | null
          risk_score?: number | null
          severity?: string | null
          status?: string | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_ai_run_id_fkey"
            columns: ["ai_run_id"]
            isOneToOne: false
            referencedRelation: "ai_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_progress_update_id_fkey"
            columns: ["progress_update_id"]
            isOneToOne: false
            referencedRelation: "progress_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          input_hash: string | null
          priority: number
          project_id: string | null
          source_entity_id: string
          source_entity_type: string
          started_at: string | null
          status: string
          task_type: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_hash?: string | null
          priority?: number
          project_id?: string | null
          source_entity_id: string
          source_entity_type: string
          started_at?: string | null
          status?: string
          task_type?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_hash?: string | null
          priority?: number
          project_id?: string | null
          source_entity_id?: string
          source_entity_type?: string
          started_at?: string | null
          status?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          input_hash: string | null
          input_tokens: number | null
          latency_ms: number | null
          model: string
          output_tokens: number | null
          project_id: string | null
          prompt_version: string | null
          provider: string
          status: string | null
          task: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          input_hash?: string | null
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          project_id?: string | null
          prompt_version?: string | null
          provider: string
          status?: string | null
          task: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          input_hash?: string | null
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          project_id?: string | null
          prompt_version?: string | null
          provider?: string
          status?: string | null
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_organization_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_organization_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_organization_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_organization_id_fkey"
            columns: ["actor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_evidence: {
        Row: {
          complaint_id: string
          created_at: string | null
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          storage_path: string
        }
        Insert: {
          complaint_id: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
        }
        Update: {
          complaint_id?: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_evidence_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_updates: {
        Row: {
          actor_id: string | null
          complaint_id: string
          created_at: string | null
          id: string
          new_status: string
          notes: string | null
          previous_status: string | null
        }
        Insert: {
          actor_id?: string | null
          complaint_id: string
          created_at?: string | null
          id?: string
          new_status: string
          notes?: string | null
          previous_status?: string | null
        }
        Update: {
          actor_id?: string | null
          complaint_id?: string
          created_at?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_updates_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_organization_id: string | null
          assigned_user_id: string | null
          category: string
          created_at: string | null
          deleted_at: string | null
          description: string
          id: string
          latitude: number | null
          longitude: number | null
          project_id: string
          reference_number: string
          resolved_at: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          assigned_organization_id?: string | null
          assigned_user_id?: string | null
          category: string
          created_at?: string | null
          deleted_at?: string | null
          description: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          project_id: string
          reference_number: string
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          assigned_organization_id?: string | null
          assigned_user_id?: string | null
          category?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          project_id?: string
          reference_number?: string
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_assigned_organization_id_fkey"
            columns: ["assigned_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_access_requests: {
        Row: {
          company_name: string
          contractor_class: string
          created_at: string
          district: string | null
          gstin: string
          id: string
          phone: string | null
          registration_cin: string
          requested_role: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string
          user_id: string
        }
        Insert: {
          company_name: string
          contractor_class: string
          created_at?: string
          district?: string | null
          gstin: string
          id?: string
          phone?: string | null
          registration_cin: string
          requested_role?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          user_id: string
        }
        Update: {
          company_name?: string
          contractor_class?: string
          created_at?: string
          district?: string | null
          gstin?: string
          id?: string
          phone?: string | null
          registration_cin?: string
          requested_role?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_contractor_req_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          actual_completion_date: string | null
          award_date: string | null
          contract_number: string
          contract_title: string
          contract_value: number | null
          contractor_organization_id: string
          created_at: string | null
          deleted_at: string | null
          id: string
          official_contract_id: string | null
          project_id: string
          scheduled_completion_date: string | null
          scheduled_start_date: string | null
          status: string
          tender_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          actual_completion_date?: string | null
          award_date?: string | null
          contract_number: string
          contract_title: string
          contract_value?: number | null
          contractor_organization_id: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          official_contract_id?: string | null
          project_id: string
          scheduled_completion_date?: string | null
          scheduled_start_date?: string | null
          status?: string
          tender_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          actual_completion_date?: string | null
          award_date?: string | null
          contract_number?: string
          contract_title?: string
          contract_value?: number | null
          contractor_organization_id?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          official_contract_id?: string | null
          project_id?: string
          scheduled_completion_date?: string | null
          scheduled_start_date?: string | null
          status?: string
          tender_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      delay_events: {
        Row: {
          affected_milestone: string | null
          created_at: string | null
          delay_category: string
          delay_days: number | null
          delay_reason: string | null
          evidence_text: string | null
          id: string
          observation_date: string | null
          project_id: string
          source_id: string | null
          source_url: string | null
        }
        Insert: {
          affected_milestone?: string | null
          created_at?: string | null
          delay_category: string
          delay_days?: number | null
          delay_reason?: string | null
          evidence_text?: string | null
          id?: string
          observation_date?: string | null
          project_id: string
          source_id?: string | null
          source_url?: string | null
        }
        Update: {
          affected_milestone?: string | null
          created_at?: string | null
          delay_category?: string
          delay_days?: number | null
          delay_reason?: string | null
          evidence_text?: string | null
          id?: string
          observation_date?: string | null
          project_id?: string
          source_id?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delay_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delay_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delay_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delay_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delay_events_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_baselines: {
        Row: {
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          measured_at: string | null
          metric: string
          project_id: string
          source: string | null
          source_document_id: string | null
          unit: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          measured_at?: string | null
          metric: string
          project_id: string
          source?: string | null
          source_document_id?: string | null
          unit: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          measured_at?: string | null
          metric?: string
          project_id?: string
          source?: string | null
          source_document_id?: string | null
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "environmental_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_clearances: {
        Row: {
          clearance_type: string
          conditions: Json | null
          created_at: string | null
          document_path: string | null
          id: string
          issued_date: string | null
          issuing_authority: string | null
          project_id: string
          reference_number: string | null
          status: string | null
          valid_until: string | null
        }
        Insert: {
          clearance_type: string
          conditions?: Json | null
          created_at?: string | null
          document_path?: string | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          project_id: string
          reference_number?: string | null
          status?: string | null
          valid_until?: string | null
        }
        Update: {
          clearance_type?: string
          conditions?: Json | null
          created_at?: string | null
          document_path?: string | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          project_id?: string
          reference_number?: string | null
          status?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_clearances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_clearances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_clearances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_clearances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_commitments: {
        Row: {
          actual_value: number | null
          category: string
          commitment: string
          created_at: string | null
          deadline: string | null
          expected_value: number | null
          id: string
          project_id: string
          source_document_id: string | null
          status: string | null
          unit: string | null
        }
        Insert: {
          actual_value?: number | null
          category: string
          commitment: string
          created_at?: string | null
          deadline?: string | null
          expected_value?: number | null
          id?: string
          project_id: string
          source_document_id?: string | null
          status?: string | null
          unit?: string | null
        }
        Update: {
          actual_value?: number | null
          category?: string
          commitment?: string
          created_at?: string | null
          deadline?: string | null
          expected_value?: number | null
          id?: string
          project_id?: string
          source_document_id?: string | null
          status?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_commitments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_commitments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_commitments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_commitments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_incidents: {
        Row: {
          created_at: string | null
          description: string
          detected_at: string | null
          id: string
          incident_type: string
          latitude: number | null
          longitude: number | null
          project_id: string
          reported_by: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          detected_at?: string | null
          id?: string
          incident_type: string
          latitude?: number | null
          longitude?: number | null
          project_id: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          detected_at?: string | null
          id?: string
          incident_type?: string
          latitude?: number | null
          longitude?: number | null
          project_id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "environmental_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      environmental_observations: {
        Row: {
          created_at: string | null
          evidence_path: string | null
          id: string
          latitude: number | null
          longitude: number | null
          metric: string
          observed_at: string | null
          project_id: string
          source_type: string
          submitted_by: string | null
          unit: string
          value: number
        }
        Insert: {
          created_at?: string | null
          evidence_path?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metric: string
          observed_at?: string | null
          project_id: string
          source_type: string
          submitted_by?: string | null
          unit: string
          value: number
        }
        Update: {
          created_at?: string | null
          evidence_path?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metric?: string
          observed_at?: string | null
          project_id?: string
          source_type?: string
          submitted_by?: string | null
          unit?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "environmental_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "environmental_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_updates: {
        Row: {
          amount_spent_inr_crore: number | null
          budget_allocation_inr_crore: number | null
          cost_overrun_inr_crore: number | null
          cost_overrun_percent: number | null
          created_at: string | null
          id: string
          notes: string | null
          observation_date: string | null
          original_cost_inr_crore: number | null
          project_id: string
          reported_cost_inr_crore: number | null
          revised_cost_inr_crore: number | null
          source_id: string | null
        }
        Insert: {
          amount_spent_inr_crore?: number | null
          budget_allocation_inr_crore?: number | null
          cost_overrun_inr_crore?: number | null
          cost_overrun_percent?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          observation_date?: string | null
          original_cost_inr_crore?: number | null
          project_id: string
          reported_cost_inr_crore?: number | null
          revised_cost_inr_crore?: number | null
          source_id?: string | null
        }
        Update: {
          amount_spent_inr_crore?: number | null
          budget_allocation_inr_crore?: number | null
          cost_overrun_inr_crore?: number | null
          cost_overrun_percent?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          observation_date?: string | null
          original_cost_inr_crore?: number | null
          project_id?: string
          reported_cost_inr_crore?: number | null
          revised_cost_inr_crore?: number | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_updates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      government_access_requests: {
        Row: {
          created_at: string
          department: string
          designation: string
          district: string | null
          employee_id: string
          id: string
          official_email: string
          requested_role: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          designation: string
          district?: string | null
          employee_id: string
          id?: string
          official_email: string
          requested_role?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          designation?: string
          district?: string | null
          employee_id?: string
          id?: string
          official_email?: string
          requested_role?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_gov_req_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          completed_at: string | null
          created_by: string | null
          file_name: string
          id: string
          rows_failed: number | null
          rows_success: number | null
          rows_total: number | null
          sha256: string
          started_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          file_name: string
          id?: string
          rows_failed?: number | null
          rows_success?: number | null
          rows_total?: number | null
          sha256: string
          started_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          file_name?: string
          id?: string
          rows_failed?: number | null
          rows_success?: number | null
          rows_total?: number | null
          sha256?: string
          started_at?: string | null
        }
        Relationships: []
      }
      inspection_findings: {
        Row: {
          category: string | null
          created_at: string | null
          deadline: string | null
          description: string
          evidence_path: string | null
          id: string
          inspection_id: string
          latitude: number | null
          longitude: number | null
          required_action: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          evidence_path?: string | null
          id?: string
          inspection_id: string
          latitude?: number | null
          longitude?: number | null
          required_action?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          evidence_path?: string | null
          id?: string
          inspection_id?: string
          latitude?: number | null
          longitude?: number | null
          required_action?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_findings_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          inspection_date: string | null
          inspection_type: string
          inspector_id: string | null
          project_id: string
          scheduled_date: string | null
          status: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          inspection_date?: string | null
          inspection_type: string
          inspector_id?: string | null
          project_id: string
          scheduled_date?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          inspection_date?: string | null
          inspection_type?: string
          inspector_id?: string | null
          project_id?: string
          scheduled_date?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          metadata: Json | null
          organization_id: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          metadata?: Json | null
          organization_id?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          organization_id?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role_enum"]
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role_enum"]
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role_enum"]
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          department: string | null
          district: string | null
          gstin: string | null
          id: string
          name: string
          parent_id: string | null
          registration_number: string | null
          state: string | null
          status: string
          type: Database["public"]["Enums"]["org_type_enum"]
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          district?: string | null
          gstin?: string | null
          id?: string
          name: string
          parent_id?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string
          type?: Database["public"]["Enums"]["org_type_enum"]
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          district?: string | null
          gstin?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string
          type?: Database["public"]["Enums"]["org_type_enum"]
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      progress_evidence: {
        Row: {
          captured_at: string | null
          created_at: string | null
          evidence_type: string
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          progress_update_id: string
          storage_path: string
        }
        Insert: {
          captured_at?: string | null
          created_at?: string | null
          evidence_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          progress_update_id: string
          storage_path: string
        }
        Update: {
          captured_at?: string | null
          created_at?: string | null
          evidence_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          progress_update_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_evidence_progress_update_id_fkey"
            columns: ["progress_update_id"]
            isOneToOne: false
            referencedRelation: "progress_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_updates: {
        Row: {
          contractor_organization_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          milestone_id: string | null
          project_id: string
          reported_progress: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
          verification_status: string | null
          verified_progress: number | null
        }
        Insert: {
          contractor_organization_id: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          milestone_id?: string | null
          project_id: string
          reported_progress: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_progress?: number | null
        }
        Update: {
          contractor_organization_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          milestone_id?: string | null
          project_id?: string
          reported_progress?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_updates_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_updates_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      project_aliases: {
        Row: {
          alias_text: string
          alias_type: string | null
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
          source_id: string | null
          source_url: string | null
        }
        Insert: {
          alias_text: string
          alias_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          source_id?: string | null
          source_url?: string | null
        }
        Update: {
          alias_text?: string
          alias_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          source_id?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_aliases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_aliases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_aliases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_aliases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_aliases_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          created_at: string | null
          document_date: string | null
          document_type: string
          external_url: string | null
          id: string
          is_public: boolean | null
          project_id: string
          publisher: string | null
          sha256: string | null
          source_id: string | null
          storage_path: string | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_date?: string | null
          document_type: string
          external_url?: string | null
          id?: string
          is_public?: boolean | null
          project_id: string
          publisher?: string | null
          sha256?: string | null
          source_id?: string | null
          storage_path?: string | null
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_date?: string | null
          document_type?: string
          external_url?: string | null
          id?: string
          is_public?: boolean | null
          project_id?: string
          publisher?: string | null
          sha256?: string | null
          source_id?: string | null
          storage_path?: string | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      project_import_staging: {
        Row: {
          batch_id: string | null
          created_at: string | null
          id: string
          imported_project_id: string | null
          raw_row: Json | null
          source_sheet: string | null
          validation_errors: Json | null
          validation_status: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          imported_project_id?: string | null
          raw_row?: Json | null
          source_sheet?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          imported_project_id?: string | null
          raw_row?: Json | null
          source_sheet?: string | null
          validation_errors?: Json | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_import_staging_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_import_staging_imported_project_id_fkey"
            columns: ["imported_project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_import_staging_imported_project_id_fkey"
            columns: ["imported_project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_import_staging_imported_project_id_fkey"
            columns: ["imported_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_import_staging_imported_project_id_fkey"
            columns: ["imported_project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          actual_cost: number | null
          actual_end_date: string | null
          actual_start_date: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          id: string
          milestone_name: string
          milestone_type: string | null
          planned_cost: number | null
          planned_end_date: string | null
          planned_progress: number | null
          planned_start_date: string | null
          project_id: string
          revised_end_date: string | null
          status: string | null
          updated_at: string | null
          verified_progress: number | null
          version: number | null
        }
        Insert: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          milestone_name: string
          milestone_type?: string | null
          planned_cost?: number | null
          planned_end_date?: string | null
          planned_progress?: number | null
          planned_start_date?: string | null
          project_id: string
          revised_end_date?: string | null
          status?: string | null
          updated_at?: string | null
          verified_progress?: number | null
          version?: number | null
        }
        Update: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          milestone_name?: string
          milestone_type?: string | null
          planned_cost?: number | null
          planned_end_date?: string | null
          planned_progress?: number | null
          planned_start_date?: string | null
          project_id?: string
          revised_end_date?: string | null
          status?: string | null
          updated_at?: string | null
          verified_progress?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      project_organizations: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          project_id: string
          relationship: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          project_id: string
          relationship: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          project_id?: string
          relationship?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_organizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_organizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_organizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_organizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          created_at: string | null
          id: string
          observation_date: string | null
          physical_progress_percent: number | null
          project_id: string
          schedule_variance_days: number | null
          source_id: string | null
          source_record_id: string | null
          source_url: string | null
          status_normalized: string | null
          status_reported: string | null
          update_text: string | null
          update_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          observation_date?: string | null
          physical_progress_percent?: number | null
          project_id: string
          schedule_variance_days?: number | null
          source_id?: string | null
          source_record_id?: string | null
          source_url?: string | null
          status_normalized?: string | null
          status_reported?: string | null
          update_text?: string | null
          update_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          observation_date?: string | null
          physical_progress_percent?: number | null
          project_id?: string
          schedule_variance_days?: number | null
          source_id?: string | null
          source_record_id?: string | null
          source_url?: string | null
          status_normalized?: string | null
          status_reported?: string | null
          update_text?: string | null
          update_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_completion_date: string | null
          actual_start_date: string | null
          amount_spent_inr_crore: number | null
          award_date: string | null
          city: string | null
          contractor_concessionaire: string | null
          created_at: string | null
          created_by: string | null
          current_status_verified: boolean | null
          deleted_at: string | null
          department: string | null
          description: string | null
          district: string | null
          duplicate_review: string | null
          executing_agency: string | null
          financial_progress_percent: number | null
          government_organization_id: string | null
          id: string
          implementing_agency: string | null
          is_public: boolean | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          ministry: string | null
          nirikshak_project_id: string
          normalized_status: string | null
          official_project_id: string | null
          operator: string | null
          original_completion_date: string | null
          original_cost_inr_crore: number | null
          ownership_type: string | null
          physical_progress_percent: number | null
          planned_start_date: string | null
          primary_source_url: string | null
          procurement_mode: string | null
          project_authority: string | null
          project_name: string
          project_type: string | null
          public_summary: string | null
          published_at: string | null
          published_by: string | null
          quality_score: number | null
          record_scope: string | null
          reported_status: string | null
          revised_completion_date: string | null
          revised_cost_inr_crore: number | null
          sector: string | null
          source_record_id: string | null
          state: string | null
          subsector: string | null
          total_cost_inr_crore: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          amount_spent_inr_crore?: number | null
          award_date?: string | null
          city?: string | null
          contractor_concessionaire?: string | null
          created_at?: string | null
          created_by?: string | null
          current_status_verified?: boolean | null
          deleted_at?: string | null
          department?: string | null
          description?: string | null
          district?: string | null
          duplicate_review?: string | null
          executing_agency?: string | null
          financial_progress_percent?: number | null
          government_organization_id?: string | null
          id?: string
          implementing_agency?: string | null
          is_public?: boolean | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          ministry?: string | null
          nirikshak_project_id: string
          normalized_status?: string | null
          official_project_id?: string | null
          operator?: string | null
          original_completion_date?: string | null
          original_cost_inr_crore?: number | null
          ownership_type?: string | null
          physical_progress_percent?: number | null
          planned_start_date?: string | null
          primary_source_url?: string | null
          procurement_mode?: string | null
          project_authority?: string | null
          project_name: string
          project_type?: string | null
          public_summary?: string | null
          published_at?: string | null
          published_by?: string | null
          quality_score?: number | null
          record_scope?: string | null
          reported_status?: string | null
          revised_completion_date?: string | null
          revised_cost_inr_crore?: number | null
          sector?: string | null
          source_record_id?: string | null
          state?: string | null
          subsector?: string | null
          total_cost_inr_crore?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          amount_spent_inr_crore?: number | null
          award_date?: string | null
          city?: string | null
          contractor_concessionaire?: string | null
          created_at?: string | null
          created_by?: string | null
          current_status_verified?: boolean | null
          deleted_at?: string | null
          department?: string | null
          description?: string | null
          district?: string | null
          duplicate_review?: string | null
          executing_agency?: string | null
          financial_progress_percent?: number | null
          government_organization_id?: string | null
          id?: string
          implementing_agency?: string | null
          is_public?: boolean | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          ministry?: string | null
          nirikshak_project_id?: string
          normalized_status?: string | null
          official_project_id?: string | null
          operator?: string | null
          original_completion_date?: string | null
          original_cost_inr_crore?: number | null
          ownership_type?: string | null
          physical_progress_percent?: number | null
          planned_start_date?: string | null
          primary_source_url?: string | null
          procurement_mode?: string | null
          project_authority?: string | null
          project_name?: string
          project_type?: string | null
          public_summary?: string | null
          published_at?: string | null
          published_by?: string | null
          quality_score?: number | null
          record_scope?: string | null
          reported_status?: string | null
          revised_completion_date?: string | null
          revised_cost_inr_crore?: number | null
          sector?: string | null
          source_record_id?: string | null
          state?: string | null
          subsector?: string | null
          total_cost_inr_crore?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      source_observations: {
        Row: {
          created_at: string | null
          field_name: string
          id: string
          observation_date: string | null
          observed_unit: string | null
          observed_value: string | null
          project_id: string
          raw_field_name: string | null
          source_id: string | null
          source_record_id: string | null
          source_retrieval_date: string | null
          source_url: string | null
          transform_note: string | null
        }
        Insert: {
          created_at?: string | null
          field_name: string
          id?: string
          observation_date?: string | null
          observed_unit?: string | null
          observed_value?: string | null
          project_id: string
          raw_field_name?: string | null
          source_id?: string | null
          source_record_id?: string | null
          source_retrieval_date?: string | null
          source_url?: string | null
          transform_note?: string | null
        }
        Update: {
          created_at?: string | null
          field_name?: string
          id?: string
          observation_date?: string | null
          observed_unit?: string | null
          observed_value?: string | null
          project_id?: string
          raw_field_name?: string | null
          source_id?: string | null
          source_record_id?: string | null
          source_retrieval_date?: string | null
          source_url?: string | null
          transform_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_observations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string | null
          evidence_quality: string | null
          exact_url: string | null
          geography: string | null
          id: string
          publisher: string | null
          source_code: string
          source_name: string
          verified: boolean | null
          years_covered: string | null
        }
        Insert: {
          created_at?: string | null
          evidence_quality?: string | null
          exact_url?: string | null
          geography?: string | null
          id?: string
          publisher?: string | null
          source_code: string
          source_name: string
          verified?: boolean | null
          years_covered?: string | null
        }
        Update: {
          created_at?: string | null
          evidence_quality?: string | null
          exact_url?: string | null
          geography?: string | null
          id?: string
          publisher?: string | null
          source_code?: string
          source_name?: string
          verified?: boolean | null
          years_covered?: string | null
        }
        Relationships: []
      }
      tender_bids: {
        Row: {
          bid_amount: number
          bid_reference: string | null
          contractor_organization_id: string
          deleted_at: string | null
          documents: Json | null
          financial_score: number | null
          id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          technical_proposal: string | null
          technical_score: number | null
          tender_id: string
          updated_at: string | null
        }
        Insert: {
          bid_amount: number
          bid_reference?: string | null
          contractor_organization_id: string
          deleted_at?: string | null
          documents?: Json | null
          financial_score?: number | null
          id?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          technical_proposal?: string | null
          technical_score?: number | null
          tender_id: string
          updated_at?: string | null
        }
        Update: {
          bid_amount?: number
          bid_reference?: string | null
          contractor_organization_id?: string
          deleted_at?: string | null
          documents?: Json | null
          financial_score?: number | null
          id?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          technical_proposal?: string | null
          technical_score?: number | null
          tender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_bids_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_bids_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          bid_due_date: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          documents: Json | null
          eligibility_criteria: string | null
          estimated_value_inr_crore: number | null
          id: string
          is_public: boolean | null
          issuing_organization_id: string | null
          official_tender_id: string | null
          project_id: string
          publication_date: string | null
          status: string
          technical_requirements: string | null
          tender_number: string
          title: string
          updated_at: string | null
        }
        Insert: {
          bid_due_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          documents?: Json | null
          eligibility_criteria?: string | null
          estimated_value_inr_crore?: number | null
          id?: string
          is_public?: boolean | null
          issuing_organization_id?: string | null
          official_tender_id?: string | null
          project_id: string
          publication_date?: string | null
          status?: string
          technical_requirements?: string | null
          tender_number: string
          title: string
          updated_at?: string | null
        }
        Update: {
          bid_due_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          documents?: Json | null
          eligibility_criteria?: string | null
          estimated_value_inr_crore?: number | null
          id?: string
          is_public?: boolean | null
          issuing_organization_id?: string | null
          official_tender_id?: string | null
          project_id?: string
          publication_date?: string | null
          status?: string
          technical_requirements?: string | null
          tender_number?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenders_issuing_organization_id_fkey"
            columns: ["issuing_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }

      tender_documents: {
        Row: {
          id: string
          tender_id: string
          document_id: string | null
          document_type: string
          visibility: string
          storage_path: string | null
          uploaded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tender_id: string
          document_id?: string | null
          document_type: string
          visibility?: string
          storage_path?: string | null
          uploaded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tender_id?: string
          document_id?: string | null
          document_type?: string
          visibility?: string
          storage_path?: string | null
          uploaded_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      bid_documents: {
        Row: {
          id: string
          bid_id: string
          document_id: string | null
          document_type: string
          visibility: string
          storage_path: string | null
          uploaded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          bid_id: string
          document_id?: string | null
          document_type: string
          visibility?: string
          storage_path?: string | null
          uploaded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          bid_id?: string
          document_id?: string | null
          document_type?: string
          visibility?: string
          storage_path?: string | null
          uploaded_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      resource_items: {
        Row: {
          id: string
          organization_id: string
          resource_type: string
          resource_code: string
          name: string
          description: string | null
          unit: string
          capacity: number | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          resource_type: string
          resource_code: string
          name: string
          description?: string | null
          unit: string
          capacity?: number | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          resource_type?: string
          resource_code?: string
          name?: string
          description?: string | null
          unit?: string
          capacity?: number | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_resource_allocations: {
        Row: {
          id: string
          project_id: string
          resource_item_id: string
          contractor_organization_id: string
          allocated_quantity: number
          available_quantity: number
          required_quantity: number
          utilized_quantity: number
          allocation_date: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          resource_item_id: string
          contractor_organization_id: string
          allocated_quantity?: number
          available_quantity?: number
          required_quantity?: number
          utilized_quantity?: number
          allocation_date?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          resource_item_id?: string
          contractor_organization_id?: string
          allocated_quantity?: number
          available_quantity?: number
          required_quantity?: number
          utilized_quantity?: number
          allocation_date?: string | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resource_usage_updates: {
        Row: {
          id: string
          project_id: string
          resource_allocation_id: string | null
          observation_date: string
          required_quantity: number | null
          available_quantity: number | null
          used_quantity: number | null
          shortage_quantity: number | null
          shortage_ratio: number | null
          reported_by: string | null
          verified_by: string | null
          verification_status: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          resource_allocation_id?: string | null
          observation_date?: string
          required_quantity?: number | null
          available_quantity?: number | null
          used_quantity?: number | null
          shortage_quantity?: number | null
          shortage_ratio?: number | null
          reported_by?: string | null
          verified_by?: string | null
          verification_status?: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          resource_allocation_id?: string | null
          observation_date?: string
          required_quantity?: number | null
          available_quantity?: number | null
          used_quantity?: number | null
          shortage_quantity?: number | null
          shortage_ratio?: number | null
          reported_by?: string | null
          verified_by?: string | null
          verification_status?: string
          notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      project_workforce_updates: {
        Row: {
          id: string
          project_id: string
          contractor_organization_id: string
          observation_date: string
          planned_workers: number | null
          available_workers: number | null
          skilled_workers: number | null
          unskilled_workers: number | null
          supervisors: number | null
          safety_officers: number | null
          worker_shortage_ratio: number | null
          reported_by: string | null
          verification_status: string
          verified_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          contractor_organization_id: string
          observation_date?: string
          planned_workers?: number | null
          available_workers?: number | null
          skilled_workers?: number | null
          unskilled_workers?: number | null
          supervisors?: number | null
          safety_officers?: number | null
          worker_shortage_ratio?: number | null
          reported_by?: string | null
          verification_status?: string
          verified_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          contractor_organization_id?: string
          observation_date?: string
          planned_workers?: number | null
          available_workers?: number | null
          skilled_workers?: number | null
          unskilled_workers?: number | null
          supervisors?: number | null
          safety_officers?: number | null
          worker_shortage_ratio?: number | null
          reported_by?: string | null
          verification_status?: string
          verified_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      project_budget_heads: {
        Row: {
          id: string
          project_id: string
          budget_code: string
          budget_head: string
          description: string | null
          sanctioned_amount_inr_crore: number
          revised_amount_inr_crore: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          budget_code: string
          budget_head: string
          description?: string | null
          sanctioned_amount_inr_crore?: number
          revised_amount_inr_crore?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          budget_code?: string
          budget_head?: string
          description?: string | null
          sanctioned_amount_inr_crore?: number
          revised_amount_inr_crore?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_claims: {
        Row: {
          id: string
          claim_number: string
          project_id: string
          contract_id: string
          contractor_organization_id: string
          milestone_id: string | null
          claim_type: string
          claimed_amount: number
          verified_amount: number | null
          approved_amount: number | null
          status: string
          description: string | null
          submitted_by: string | null
          submitted_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          review_notes: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          claim_number: string
          project_id: string
          contract_id: string
          contractor_organization_id: string
          milestone_id?: string | null
          claim_type?: string
          claimed_amount: number
          verified_amount?: number | null
          approved_amount?: number | null
          status?: string
          description?: string | null
          submitted_by?: string | null
          submitted_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          claim_number?: string
          project_id?: string
          contract_id?: string
          contractor_organization_id?: string
          milestone_id?: string | null
          claim_type?: string
          claimed_amount?: number
          verified_amount?: number | null
          approved_amount?: number | null
          status?: string
          description?: string | null
          submitted_by?: string | null
          submitted_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          review_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_claim_documents: {
        Row: {
          id: string
          payment_claim_id: string
          document_id: string | null
          document_type: string
          storage_path: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          payment_claim_id: string
          document_id?: string | null
          document_type?: string
          storage_path?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          payment_claim_id?: string
          document_id?: string | null
          document_type?: string
          storage_path?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          payment_claim_id: string
          project_id: string
          contractor_organization_id: string
          amount_paid: number
          payment_reference: string
          payment_date: string | null
          payment_method: string | null
          recorded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          payment_claim_id: string
          project_id: string
          contractor_organization_id: string
          amount_paid: number
          payment_reference: string
          payment_date?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          payment_claim_id?: string
          project_id?: string
          contractor_organization_id?: string
          amount_paid?: number
          payment_reference?: string
          payment_date?: string | null
          payment_method?: string | null
          recorded_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      litigations: {
        Row: {
          id: string
          project_id: string
          case_number: string
          case_title: string
          court_or_forum: string
          jurisdiction: string | null
          litigation_type: string
          filing_date: string | null
          status: string
          government_organization_id: string
          contractor_organization_id: string | null
          opposing_party: string | null
          claimed_amount: number | null
          risk_level: string | null
          summary: string | null
          next_hearing_date: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          case_number: string
          case_title: string
          court_or_forum: string
          jurisdiction?: string | null
          litigation_type?: string
          filing_date?: string | null
          status?: string
          government_organization_id: string
          contractor_organization_id?: string | null
          opposing_party?: string | null
          claimed_amount?: number | null
          risk_level?: string | null
          summary?: string | null
          next_hearing_date?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          case_number?: string
          case_title?: string
          court_or_forum?: string
          jurisdiction?: string | null
          litigation_type?: string
          filing_date?: string | null
          status?: string
          government_organization_id?: string
          contractor_organization_id?: string | null
          opposing_party?: string | null
          claimed_amount?: number | null
          risk_level?: string | null
          summary?: string | null
          next_hearing_date?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      litigation_events: {
        Row: {
          id: string
          litigation_id: string
          event_type: string
          event_date: string
          summary: string
          document_id: string | null
          next_action: string | null
          next_action_due_date: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          litigation_id: string
          event_type: string
          event_date: string
          summary: string
          document_id?: string | null
          next_action?: string | null
          next_action_due_date?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          litigation_id?: string
          event_type?: string
          event_date?: string
          summary?: string
          document_id?: string | null
          next_action?: string | null
          next_action_due_date?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          id: string
          litigation_id: string | null
          project_id: string
          settlement_number: string
          settlement_type: string
          proposed_amount: number | null
          approved_amount: number | null
          terms: string
          status: string
          proposed_by: string | null
          proposed_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          approved_by: string | null
          approved_at: string | null
          effective_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          litigation_id?: string | null
          project_id: string
          settlement_number: string
          settlement_type?: string
          proposed_amount?: number | null
          approved_amount?: number | null
          terms: string
          status?: string
          proposed_by?: string | null
          proposed_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          effective_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          litigation_id?: string | null
          project_id?: string
          settlement_number?: string
          settlement_type?: string
          proposed_amount?: number | null
          approved_amount?: number | null
          terms?: string
          status?: string
          proposed_by?: string | null
          proposed_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          effective_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_analysis_runs: {
        Row: {
          id: string
          analysis_id: string
          project_id: string
          requested_by: string | null
          requested_by_organization_id: string | null
          service_version: string | null
          historical_model_version: string | null
          online_model_version: string | null
          rl_policy_version: string | null
          llm_model: string | null
          context_hash: string | null
          input_completeness_score: number | null
          status: string
          started_at: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          analysis_id: string
          project_id: string
          requested_by?: string | null
          requested_by_organization_id?: string | null
          service_version?: string | null
          historical_model_version?: string | null
          online_model_version?: string | null
          rl_policy_version?: string | null
          llm_model?: string | null
          context_hash?: string | null
          input_completeness_score?: number | null
          status?: string
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          analysis_id?: string
          project_id?: string
          requested_by?: string | null
          requested_by_organization_id?: string | null
          service_version?: string | null
          historical_model_version?: string | null
          online_model_version?: string | null
          rl_policy_version?: string | null
          llm_model?: string | null
          context_hash?: string | null
          input_completeness_score?: number | null
          status?: string
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      ai_recommended_actions: {
        Row: {
          id: string
          analysis_run_id: string
          project_id: string
          action_code: string
          rank: number
          policy_score: number | null
          learned_mean_reward: number | null
          uncertainty_bonus: number | null
          explanation: string | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          analysis_run_id: string
          project_id: string
          action_code: string
          rank?: number
          policy_score?: number | null
          learned_mean_reward?: number | null
          uncertainty_bonus?: number | null
          explanation?: string | null
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          analysis_run_id?: string
          project_id?: string
          action_code?: string
          rank?: number
          policy_score?: number | null
          learned_mean_reward?: number | null
          uncertainty_bonus?: number | null
          explanation?: string | null
          status?: string
          created_at?: string | null
        }
        Relationships: []
      }
      ai_recommendation_feedback: {
        Row: {
          id: string
          analysis_run_id: string
          recommended_action_id: string
          project_id: string
          reviewed_by: string
          feedback: string
          note: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          analysis_run_id: string
          recommended_action_id: string
          project_id: string
          reviewed_by: string
          feedback: string
          note?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          analysis_run_id?: string
          recommended_action_id?: string
          project_id?: string
          reviewed_by?: string
          feedback?: string
          note?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      ai_action_outcomes: {
        Row: {
          id: string
          analysis_run_id: string
          recommended_action_id: string
          project_id: string
          baseline_snapshot: Json | null
          verified_outcome_snapshot: Json | null
          reward: number
          reward_components: Json | null
          verified_by: string
          verified_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          analysis_run_id: string
          recommended_action_id: string
          project_id: string
          baseline_snapshot?: Json | null
          verified_outcome_snapshot?: Json | null
          reward: number
          reward_components?: Json | null
          verified_by: string
          verified_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          analysis_run_id?: string
          recommended_action_id?: string
          project_id?: string
          baseline_snapshot?: Json | null
          verified_outcome_snapshot?: Json | null
          reward?: number
          reward_components?: Json | null
          verified_by?: string
          verified_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      ai_context_snapshots: {
        Row: {
          id: string
          analysis_run_id: string
          project_id: string
          snapshot: Json
          snapshot_hash: string | null
          provenance: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          analysis_run_id: string
          project_id: string
          snapshot: Json
          snapshot_hash?: string | null
          provenance?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          analysis_run_id?: string
          project_id?: string
          snapshot?: Json
          snapshot_hash?: string | null
          provenance?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      external_data_sources: {
        Row: {
          id: string
          source_code: string
          name: string
          source_type: string
          base_url: string | null
          is_active: boolean | null
          refresh_frequency: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          source_code: string
          name: string
          source_type: string
          base_url?: string | null
          is_active?: boolean | null
          refresh_frequency?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          source_code?: string
          name?: string
          source_type?: string
          base_url?: string | null
          is_active?: boolean | null
          refresh_frequency?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      external_observations: {
        Row: {
          id: string
          project_id: string | null
          data_source_id: string
          observation_type: string
          observed_at: string
          value_numeric: number | null
          value_text: string | null
          unit: string | null
          location: Json | null
          raw_reference: Json | null
          verified: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          data_source_id: string
          observation_type: string
          observed_at?: string
          value_numeric?: number | null
          value_text?: string | null
          unit?: string | null
          location?: Json | null
          raw_reference?: Json | null
          verified?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          data_source_id?: string
          observation_type?: string
          observed_at?: string
          value_numeric?: number | null
          value_text?: string | null
          unit?: string | null
          location?: Json | null
          raw_reference?: Json | null
          verified?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }

    Views: {
      contractor_assigned_projects_view: {
        Row: {
          contract_id: string | null
          contract_number: string | null
          contract_status: string | null
          contract_value: number | null
          id: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          nirikshak_project_id: string | null
          normalized_status: string | null
          physical_progress_percent: number | null
          project_authority: string | null
          project_name: string | null
          scheduled_completion_date: string | null
          sector: string | null
          subsector: string | null
          total_cost_inr_crore: number | null
        }
        Relationships: []
      }
      government_project_summary_view: {
        Row: {
          actual_completion_date: string | null
          actual_start_date: string | null
          amount_spent_inr_crore: number | null
          award_date: string | null
          city: string | null
          contractor_concessionaire: string | null
          created_at: string | null
          created_by: string | null
          current_status_verified: boolean | null
          deleted_at: string | null
          department: string | null
          description: string | null
          district: string | null
          duplicate_review: string | null
          executing_agency: string | null
          financial_progress_percent: number | null
          government_organization_id: string | null
          high_risk_ai_count: number | null
          id: string | null
          implementing_agency: string | null
          is_public: boolean | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          ministry: string | null
          nirikshak_project_id: string | null
          normalized_status: string | null
          official_project_id: string | null
          open_complaints_count: number | null
          operator: string | null
          original_completion_date: string | null
          original_cost_inr_crore: number | null
          ownership_type: string | null
          pending_inspections_count: number | null
          pending_progress_updates_count: number | null
          physical_progress_percent: number | null
          planned_start_date: string | null
          primary_source_url: string | null
          procurement_mode: string | null
          project_authority: string | null
          project_name: string | null
          project_type: string | null
          public_summary: string | null
          published_at: string | null
          published_by: string | null
          quality_score: number | null
          record_scope: string | null
          reported_status: string | null
          revised_completion_date: string | null
          revised_cost_inr_crore: number | null
          sector: string | null
          source_record_id: string | null
          state: string | null
          subsector: string | null
          total_cost_inr_crore: number | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          amount_spent_inr_crore?: number | null
          award_date?: string | null
          city?: string | null
          contractor_concessionaire?: string | null
          created_at?: string | null
          created_by?: string | null
          current_status_verified?: boolean | null
          deleted_at?: string | null
          department?: string | null
          description?: string | null
          district?: string | null
          duplicate_review?: string | null
          executing_agency?: string | null
          financial_progress_percent?: number | null
          government_organization_id?: string | null
          high_risk_ai_count?: never
          id?: string | null
          implementing_agency?: string | null
          is_public?: boolean | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          ministry?: string | null
          nirikshak_project_id?: string | null
          normalized_status?: string | null
          official_project_id?: string | null
          open_complaints_count?: never
          operator?: string | null
          original_completion_date?: string | null
          original_cost_inr_crore?: number | null
          ownership_type?: string | null
          pending_inspections_count?: never
          pending_progress_updates_count?: never
          physical_progress_percent?: number | null
          planned_start_date?: string | null
          primary_source_url?: string | null
          procurement_mode?: string | null
          project_authority?: string | null
          project_name?: string | null
          project_type?: string | null
          public_summary?: string | null
          published_at?: string | null
          published_by?: string | null
          quality_score?: number | null
          record_scope?: string | null
          reported_status?: string | null
          revised_completion_date?: string | null
          revised_cost_inr_crore?: number | null
          sector?: string | null
          source_record_id?: string | null
          state?: string | null
          subsector?: string | null
          total_cost_inr_crore?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          actual_completion_date?: string | null
          actual_start_date?: string | null
          amount_spent_inr_crore?: number | null
          award_date?: string | null
          city?: string | null
          contractor_concessionaire?: string | null
          created_at?: string | null
          created_by?: string | null
          current_status_verified?: boolean | null
          deleted_at?: string | null
          department?: string | null
          description?: string | null
          district?: string | null
          duplicate_review?: string | null
          executing_agency?: string | null
          financial_progress_percent?: number | null
          government_organization_id?: string | null
          high_risk_ai_count?: never
          id?: string | null
          implementing_agency?: string | null
          is_public?: boolean | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          ministry?: string | null
          nirikshak_project_id?: string | null
          normalized_status?: string | null
          official_project_id?: string | null
          open_complaints_count?: never
          operator?: string | null
          original_completion_date?: string | null
          original_cost_inr_crore?: number | null
          ownership_type?: string | null
          pending_inspections_count?: never
          pending_progress_updates_count?: never
          physical_progress_percent?: number | null
          planned_start_date?: string | null
          primary_source_url?: string | null
          procurement_mode?: string | null
          project_authority?: string | null
          project_name?: string | null
          project_type?: string | null
          public_summary?: string | null
          published_at?: string | null
          published_by?: string | null
          quality_score?: number | null
          record_scope?: string | null
          reported_status?: string | null
          revised_completion_date?: string | null
          revised_cost_inr_crore?: number | null
          sector?: string | null
          source_record_id?: string | null
          state?: string | null
          subsector?: string | null
          total_cost_inr_crore?: number | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      public_projects_view: {
        Row: {
          actual_completion_date: string | null
          award_date: string | null
          city: string | null
          contractor_concessionaire: string | null
          current_status_verified: boolean | null
          district: string | null
          id: string | null
          implementing_agency: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          nirikshak_project_id: string | null
          normalized_status: string | null
          official_project_id: string | null
          original_completion_date: string | null
          physical_progress_percent: number | null
          planned_start_date: string | null
          primary_source_url: string | null
          project_authority: string | null
          project_name: string | null
          public_description: string | null
          quality_score: number | null
          revised_completion_date: string | null
          sector: string | null
          state: string | null
          subsector: string | null
          total_cost_inr_crore: number | null
          updated_at: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          award_date?: string | null
          city?: string | null
          contractor_concessionaire?: string | null
          current_status_verified?: boolean | null
          district?: string | null
          id?: string | null
          implementing_agency?: string | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          nirikshak_project_id?: string | null
          normalized_status?: string | null
          official_project_id?: string | null
          original_completion_date?: string | null
          physical_progress_percent?: number | null
          planned_start_date?: string | null
          primary_source_url?: string | null
          project_authority?: string | null
          project_name?: string | null
          public_description?: never
          quality_score?: number | null
          revised_completion_date?: string | null
          sector?: string | null
          state?: string | null
          subsector?: string | null
          total_cost_inr_crore?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          award_date?: string | null
          city?: string | null
          contractor_concessionaire?: string | null
          current_status_verified?: boolean | null
          district?: string | null
          id?: string | null
          implementing_agency?: string | null
          latitude?: number | null
          location_text?: string | null
          longitude?: number | null
          nirikshak_project_id?: string | null
          normalized_status?: string | null
          official_project_id?: string | null
          original_completion_date?: string | null
          physical_progress_percent?: number | null
          planned_start_date?: string | null
          primary_source_url?: string | null
          project_authority?: string | null
          project_name?: string | null
          public_description?: never
          quality_score?: number | null
          revised_completion_date?: string | null
          sector?: string | null
          state?: string | null
          subsector?: string | null
          total_cost_inr_crore?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }

      project_progress_summary_view: {
        Row: {
          id: string | null
          nirikshak_project_id: string | null
          project_name: string | null
          government_organization_id: string | null
          normalized_status: string | null
          official_physical_progress_percent: number | null
          planned_start_date: string | null
          original_completion_date: string | null
          revised_completion_date: string | null
          latest_reported_progress: number | null
          latest_reported_date: string | null
          latest_approved_progress: number | null
          pending_progress_reviews: number | null
        }
        Relationships: []
      }
      project_finance_summary_view: {
        Row: {
          id: string | null
          nirikshak_project_id: string | null
          project_name: string | null
          government_organization_id: string | null
          approved_cost_inr_crore: number | null
          total_cost_inr_crore: number | null
          financial_progress_percent: number | null
          total_budget_sanctioned: number | null
          latest_actual_expenditure: number | null
          latest_planned_expenditure: number | null
          latest_cost_variance: number | null
          total_claimed_amount: number | null
          total_approved_amount: number | null
          total_paid_amount: number | null
        }
        Relationships: []
      }
      tender_catalog_view: {
        Row: {
          id: string | null
          project_id: string | null
          tender_number: string | null
          government_organization_id: string | null
          authority_name: string | null
          project_name: string | null
          sector: string | null
          state: string | null
          district: string | null
          title: string | null
          description: string | null
          estimated_value_inr_crore: number | null
          publication_date: string | null
          bid_due_date: string | null
          status: string | null
        }
        Relationships: []
      }
      government_project_dashboard_view: {
        Row: {
          id: string | null
          nirikshak_project_id: string | null
          project_name: string | null
          government_organization_id: string | null
          sector: string | null
          subsector: string | null
          state: string | null
          district: string | null
          city: string | null
          normalized_status: string | null
          current_status_verified: boolean | null
          priority: string | null
          public_visibility: string | null
          approved_cost_inr_crore: number | null
          total_cost_inr_crore: number | null
          physical_progress_percent: number | null
          financial_progress_percent: number | null
          planned_start_date: string | null
          original_completion_date: string | null
          revised_completion_date: string | null
          active_contract_id: string | null
          contract_number: string | null
          contractor_name: string | null
          pending_progress_reviews: number | null
          open_complaints_count: number | null
          pending_inspections_count: number | null
          active_litigations_count: number | null
          latest_ai_priority_band: string | null
          latest_ai_review_score: number | null
        }
        Relationships: []
      }

    Functions: {
      approve_contractor_access_request: {
        Args: {
          approved_role?: Database["public"]["Enums"]["app_role_enum"]
          request_id: string
        }
        Returns: Json
      }
      approve_government_access_request: {
        Args: {
          approved_role?: Database["public"]["Enums"]["app_role_enum"]
          request_id: string
        }
        Returns: Json
      }
      approve_progress_update: {
        Args: {
          p_decision: string
          p_review_notes?: string
          p_update_id: string
          p_verified_progress?: number
        }
        Returns: Json
      }
      award_contract: {
        Args: { p_selected_bid_id: string; p_tender_id: string }
        Returns: Json
      }
      can_access_project: { Args: { p_id: string }; Returns: boolean }
      can_manage_project: { Args: { p_id: string }; Returns: boolean }
      can_review_progress: { Args: { p_project_id: string }; Returns: boolean }
      get_current_user_organization_id: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role_enum"]
      }
      get_user_organization_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role_enum"]
      }
      is_citizen: { Args: never; Returns: boolean }
      is_contractor_user: { Args: never; Returns: boolean }
      is_government_user: { Args: never; Returns: boolean }
      register_contractor_account: {
        Args: {
          p_company_name: string
          p_contractor_class?: string
          p_district?: string
          p_email: string
          p_full_name: string
          p_gstin: string
          p_password: string
          p_phone: string
          p_registration_cin: string
          p_requested_role?: string
          p_state?: string
        }
        Returns: Json
      }
      register_government_account: {
        Args: {
          p_department: string
          p_designation: string
          p_district?: string
          p_email: string
          p_employee_id: string
          p_full_name: string
          p_password: string
          p_requested_role?: string
          p_state?: string
        }
        Returns: Json
      }
      reject_access_request: {
        Args: { p_reason?: string; p_request_id: string; p_type: string }
        Returns: Json
      }
      save_tender_bid: {
        Args: {
          p_bid_amount: number
          p_status?: string
          p_technical_proposal: string
          p_tender_id: string
        }
        Returns: {
          bid_amount: number
          bid_reference: string | null
          contractor_organization_id: string
          deleted_at: string | null
          documents: Json | null
          financial_score: number | null
          id: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          technical_proposal: string | null
          technical_score: number | null
          tender_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tender_bids"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      seed_projects_batch: { Args: { projects_data: Json }; Returns: number }
      submit_progress_update: {
        Args: {
          p_description: string
          p_milestone_id?: string
          p_project_id: string
          p_reported_progress: number
        }
        Returns: {
          contractor_organization_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          milestone_id: string | null
          project_id: string
          reported_progress: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
          verification_status: string | null
          verified_progress: number | null
        }
        SetofOptions: {
          from: "*"
          to: "progress_updates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }

      submit_payment_claim: {
        Args: {
          p_project_id: string
          p_contract_id: string
          p_claim_number: string
          p_claim_type: string
          p_claimed_amount: number
          p_milestone_id?: string
          p_description?: string
        }
        Returns: Json
      }
      review_payment_claim: {
        Args: {
          p_claim_id: string
          p_decision: string
          p_verified_amount?: number
          p_approved_amount?: number
          p_review_notes?: string
        }
        Returns: Json
      }
      record_payment: {
        Args: {
          p_payment_claim_id: string
          p_amount_paid: number
          p_payment_reference: string
          p_payment_method?: string
        }
        Returns: Json
      }
      mark_notification_read: {
        Args: {
          p_notification_id: string
        }
        Returns: boolean
      }

    Enums: {
      app_role_enum:
        | "citizen"
        | "government_admin"
        | "project_officer"
        | "government_engineer"
        | "chief_engineer"
        | "auditor"
        | "contractor_admin"
        | "contractor_manager"
        | "contractor_site_engineer"
        | "contractor_engineer"
      org_type_enum:
        | "government"
        | "contractor"
        | "consultant"
        | "PSU"
        | "ULB"
        | "authority"
        | "other"
      project_status_enum:
        | "PROPOSED"
        | "DPR_STAGE"
        | "APPROVED"
        | "TENDERED"
        | "AWARDED"
        | "UNDER_CONSTRUCTION"
        | "DELAYED"
        | "STALLED"
        | "SUSPENDED"
        | "COMPLETED"
        | "CANCELLED"
        | "UNKNOWN"
        | "OTHER"
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
    Enums: {
      app_role_enum: [
        "citizen",
        "government_admin",
        "project_officer",
        "government_engineer",
        "chief_engineer",
        "auditor",
        "contractor_admin",
        "contractor_manager",
        "contractor_site_engineer",
        "contractor_engineer",
      ],
      org_type_enum: [
        "government",
        "contractor",
        "consultant",
        "PSU",
        "ULB",
        "authority",
        "other",
      ],
      project_status_enum: [
        "PROPOSED",
        "DPR_STAGE",
        "APPROVED",
        "TENDERED",
        "AWARDED",
        "UNDER_CONSTRUCTION",
        "DELAYED",
        "STALLED",
        "SUSPENDED",
        "COMPLETED",
        "CANCELLED",
        "UNKNOWN",
        "OTHER",
      ],
    },
  },
} as const
