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
      ai_action_outcomes: {
        Row: {
          action: string
          analysis_run_id: string
          baseline_snapshot: Json
          created_at: string
          id: string
          project_id: string
          recommended_action_id: string | null
          reward: number
          reward_components: Json | null
          verified_at: string
          verified_by: string | null
          verified_outcome_snapshot: Json
        }
        Insert: {
          action: string
          analysis_run_id: string
          baseline_snapshot?: Json
          created_at?: string
          id?: string
          project_id: string
          recommended_action_id?: string | null
          reward: number
          reward_components?: Json | null
          verified_at?: string
          verified_by?: string | null
          verified_outcome_snapshot?: Json
        }
        Update: {
          action?: string
          analysis_run_id?: string
          baseline_snapshot?: Json
          created_at?: string
          id?: string
          project_id?: string
          recommended_action_id?: string | null
          reward?: number
          reward_components?: Json | null
          verified_at?: string
          verified_by?: string | null
          verified_outcome_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_outcomes_analysis_run_id_fkey"
            columns: ["analysis_run_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_recommended_action_id_fkey"
            columns: ["recommended_action_id"]
            isOneToOne: false
            referencedRelation: "ai_recommended_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_action_outcomes_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analysis_runs: {
        Row: {
          analysis_id: string
          completed_at: string | null
          context_hash: string | null
          created_at: string
          historical_model_version: string | null
          id: string
          input_completeness_score: number | null
          llm_model: string | null
          online_model_version: string | null
          project_id: string
          requested_by: string | null
          requested_by_organization_id: string | null
          rl_policy_version: string | null
          service_version: string
          started_at: string
          status: string
        }
        Insert: {
          analysis_id: string
          completed_at?: string | null
          context_hash?: string | null
          created_at?: string
          historical_model_version?: string | null
          id?: string
          input_completeness_score?: number | null
          llm_model?: string | null
          online_model_version?: string | null
          project_id: string
          requested_by?: string | null
          requested_by_organization_id?: string | null
          rl_policy_version?: string | null
          service_version?: string
          started_at?: string
          status?: string
        }
        Update: {
          analysis_id?: string
          completed_at?: string | null
          context_hash?: string | null
          created_at?: string
          historical_model_version?: string | null
          id?: string
          input_completeness_score?: number | null
          llm_model?: string | null
          online_model_version?: string | null
          project_id?: string
          requested_by?: string | null
          requested_by_organization_id?: string | null
          rl_policy_version?: string | null
          service_version?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_requested_by_organization_id_fkey"
            columns: ["requested_by_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "ai_analysis_runs_requested_by_organization_id_fkey"
            columns: ["requested_by_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_context_snapshots: {
        Row: {
          analysis_run_id: string | null
          created_at: string
          id: string
          project_id: string
          provenance: Json
          snapshot: Json
          snapshot_hash: string
        }
        Insert: {
          analysis_run_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          provenance?: Json
          snapshot: Json
          snapshot_hash: string
        }
        Update: {
          analysis_run_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          provenance?: Json
          snapshot?: Json
          snapshot_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_context_snapshots_analysis_run_id_fkey"
            columns: ["analysis_run_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_context_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_context_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_context_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_context_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_context_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_context_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_context_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_context_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          ai_run_id: string | null
          analysis_run_id: string | null
          audience: string | null
          confidence: number | null
          cost_anomaly_score: number | null
          created_at: string | null
          drift_percentile: number | null
          evidence: Json | null
          government_status: string | null
          id: string
          insight_type: string
          is_public: boolean | null
          progress_update_id: string | null
          project_id: string
          recommended_actions: Json | null
          review_priority_band: string | null
          review_priority_score: number | null
          risk_level: string | null
          risk_score: number | null
          severity: string | null
          status: string | null
          structural_anomaly_score: number | null
          summary: string
          title: string
        }
        Insert: {
          ai_run_id?: string | null
          analysis_run_id?: string | null
          audience?: string | null
          confidence?: number | null
          cost_anomaly_score?: number | null
          created_at?: string | null
          drift_percentile?: number | null
          evidence?: Json | null
          government_status?: string | null
          id?: string
          insight_type: string
          is_public?: boolean | null
          progress_update_id?: string | null
          project_id: string
          recommended_actions?: Json | null
          review_priority_band?: string | null
          review_priority_score?: number | null
          risk_level?: string | null
          risk_score?: number | null
          severity?: string | null
          status?: string | null
          structural_anomaly_score?: number | null
          summary: string
          title: string
        }
        Update: {
          ai_run_id?: string | null
          analysis_run_id?: string | null
          audience?: string | null
          confidence?: number | null
          cost_anomaly_score?: number | null
          created_at?: string | null
          drift_percentile?: number | null
          evidence?: Json | null
          government_status?: string | null
          id?: string
          insight_type?: string
          is_public?: boolean | null
          progress_update_id?: string | null
          project_id?: string
          recommended_actions?: Json | null
          review_priority_band?: string | null
          review_priority_score?: number | null
          risk_level?: string | null
          risk_score?: number | null
          severity?: string | null
          status?: string | null
          structural_anomaly_score?: number | null
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
            foreignKeyName: "ai_insights_analysis_run_id_fkey"
            columns: ["analysis_run_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis_runs"
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "ai_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      ai_recommendation_feedback: {
        Row: {
          action: string
          analysis_run_id: string
          created_at: string
          feedback: string
          id: string
          note: string | null
          project_id: string
          recommended_action_id: string | null
          reviewed_by: string | null
        }
        Insert: {
          action: string
          analysis_run_id: string
          created_at?: string
          feedback: string
          id?: string
          note?: string | null
          project_id: string
          recommended_action_id?: string | null
          reviewed_by?: string | null
        }
        Update: {
          action?: string
          analysis_run_id?: string
          created_at?: string
          feedback?: string
          id?: string
          note?: string | null
          project_id?: string
          recommended_action_id?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendation_feedback_analysis_run_id_fkey"
            columns: ["analysis_run_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_recommended_action_id_fkey"
            columns: ["recommended_action_id"]
            isOneToOne: false
            referencedRelation: "ai_recommended_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendation_feedback_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommended_actions: {
        Row: {
          action_code: string
          analysis_run_id: string
          created_at: string
          explanation: string | null
          id: string
          learned_mean_reward: number | null
          policy_score: number | null
          project_id: string
          rank: number
          status: string
          uncertainty_bonus: number | null
        }
        Insert: {
          action_code: string
          analysis_run_id: string
          created_at?: string
          explanation?: string | null
          id?: string
          learned_mean_reward?: number | null
          policy_score?: number | null
          project_id: string
          rank: number
          status?: string
          uncertainty_bonus?: number | null
        }
        Update: {
          action_code?: string
          analysis_run_id?: string
          created_at?: string
          explanation?: string | null
          id?: string
          learned_mean_reward?: number | null
          policy_score?: number | null
          project_id?: string
          rank?: number
          status?: string
          uncertainty_bonus?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommended_actions_analysis_run_id_fkey"
            columns: ["analysis_run_id"]
            isOneToOne: false
            referencedRelation: "ai_analysis_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommended_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommended_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_recommended_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommended_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_recommended_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_recommended_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommended_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommended_actions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "ai_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "ai_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
          ip_hash: string | null
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          project_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_organization_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_organization_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_organization_id_fkey"
            columns: ["actor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "audit_logs_actor_organization_id_fkey"
            columns: ["actor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      bid_documents: {
        Row: {
          bid_id: string
          created_at: string
          document_id: string | null
          document_type: string
          id: string
          storage_path: string
          title: string
          uploaded_by: string | null
          visibility: string
        }
        Insert: {
          bid_id: string
          created_at?: string
          document_id?: string | null
          document_type?: string
          id?: string
          storage_path: string
          title?: string
          uploaded_by?: string | null
          visibility?: string
        }
        Update: {
          bid_id?: string
          created_at?: string
          document_id?: string | null
          document_type?: string
          id?: string
          storage_path?: string
          title?: string
          uploaded_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_documents_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "tender_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_evidence: {
        Row: {
          complaint_id: string
          created_at: string | null
          document_id: string | null
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          storage_path: string
        }
        Insert: {
          complaint_id: string
          created_at?: string | null
          document_id?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          storage_path: string
        }
        Update: {
          complaint_id?: string
          created_at?: string | null
          document_id?: string | null
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
          message: string | null
          new_status: string
          notes: string | null
          previous_status: string | null
          updated_by: string | null
          visibility: string
        }
        Insert: {
          actor_id?: string | null
          complaint_id: string
          created_at?: string | null
          id?: string
          message?: string | null
          new_status: string
          notes?: string | null
          previous_status?: string | null
          updated_by?: string | null
          visibility?: string
        }
        Update: {
          actor_id?: string | null
          complaint_id?: string
          created_at?: string | null
          id?: string
          message?: string | null
          new_status?: string
          notes?: string | null
          previous_status?: string | null
          updated_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_updates_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaint_updates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          acknowledged_at: string | null
          assigned_organization_id: string | null
          assigned_user_id: string | null
          category: string
          citizen_user_id: string | null
          complaint_number: string | null
          created_at: string | null
          deleted_at: string | null
          description: string
          id: string
          latitude: number | null
          longitude: number | null
          project_id: string
          public_tracking_token: string | null
          reference_number: string | null
          resolution_summary: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_organization_id?: string | null
          assigned_user_id?: string | null
          category: string
          citizen_user_id?: string | null
          complaint_number?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          project_id: string
          public_tracking_token?: string | null
          reference_number?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          assigned_organization_id?: string | null
          assigned_user_id?: string | null
          category?: string
          citizen_user_id?: string | null
          complaint_number?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          project_id?: string
          public_tracking_token?: string | null
          reference_number?: string | null
          resolution_summary?: string | null
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "complaints_assigned_organization_id_fkey"
            columns: ["assigned_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_citizen_user_id_fkey"
            columns: ["citizen_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "complaints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "complaints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
          actual_end_date: string | null
          actual_start_date: string | null
          award_date: string | null
          awarded_at: string | null
          awarded_by: string | null
          contract_number: string
          contract_title: string
          contract_value: number | null
          contractor_organization_id: string
          created_at: string | null
          defect_liability_end_date: string | null
          deleted_at: string | null
          government_organization_id: string | null
          id: string
          official_contract_id: string | null
          performance_security_amount: number | null
          project_id: string
          retention_percentage: number | null
          scheduled_completion_date: string | null
          scheduled_end_date: string | null
          scheduled_start_date: string | null
          selected_bid_id: string | null
          status: string
          tender_id: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          actual_completion_date?: string | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          award_date?: string | null
          awarded_at?: string | null
          awarded_by?: string | null
          contract_number: string
          contract_title: string
          contract_value?: number | null
          contractor_organization_id: string
          created_at?: string | null
          defect_liability_end_date?: string | null
          deleted_at?: string | null
          government_organization_id?: string | null
          id?: string
          official_contract_id?: string | null
          performance_security_amount?: number | null
          project_id: string
          retention_percentage?: number | null
          scheduled_completion_date?: string | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          selected_bid_id?: string | null
          status?: string
          tender_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          actual_completion_date?: string | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          award_date?: string | null
          awarded_at?: string | null
          awarded_by?: string | null
          contract_number?: string
          contract_title?: string
          contract_value?: number | null
          contractor_organization_id?: string
          created_at?: string | null
          defect_liability_end_date?: string | null
          deleted_at?: string | null
          government_organization_id?: string | null
          id?: string
          official_contract_id?: string | null
          performance_security_amount?: number | null
          project_id?: string
          retention_percentage?: number | null
          scheduled_completion_date?: string | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          selected_bid_id?: string | null
          status?: string
          tender_id?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "contracts_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "contracts_government_organization_id_fkey"
            columns: ["government_organization_id"]
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "contracts_selected_bid_id_fkey"
            columns: ["selected_bid_id"]
            isOneToOne: false
            referencedRelation: "tender_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["tender_id"]
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
          end_date: string | null
          evidence_text: string | null
          id: string
          milestone_id: string | null
          observation_date: string | null
          progress_update_id: string | null
          project_id: string
          reported_by: string | null
          reported_by_organization_id: string | null
          responsibility: string | null
          source_id: string | null
          source_url: string | null
          start_date: string | null
          status: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          affected_milestone?: string | null
          created_at?: string | null
          delay_category: string
          delay_days?: number | null
          delay_reason?: string | null
          end_date?: string | null
          evidence_text?: string | null
          id?: string
          milestone_id?: string | null
          observation_date?: string | null
          progress_update_id?: string | null
          project_id: string
          reported_by?: string | null
          reported_by_organization_id?: string | null
          responsibility?: string | null
          source_id?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          affected_milestone?: string | null
          created_at?: string | null
          delay_category?: string
          delay_days?: number | null
          delay_reason?: string | null
          end_date?: string | null
          evidence_text?: string | null
          id?: string
          milestone_id?: string | null
          observation_date?: string | null
          progress_update_id?: string | null
          project_id?: string
          reported_by?: string | null
          reported_by_organization_id?: string | null
          responsibility?: string | null
          source_id?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delay_events_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delay_events_progress_update_id_fkey"
            columns: ["progress_update_id"]
            isOneToOne: false
            referencedRelation: "progress_updates"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "delay_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
            foreignKeyName: "delay_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "delay_events_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delay_events_reported_by_organization_id_fkey"
            columns: ["reported_by_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "delay_events_reported_by_organization_id_fkey"
            columns: ["reported_by_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delay_events_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delay_events_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          verified: boolean | null
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
          verified?: boolean | null
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
          verified?: boolean | null
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "environmental_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "environmental_baselines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      environmental_clearances: {
        Row: {
          application_date: string | null
          approval_date: string | null
          clearance_type: string
          conditions: Json | null
          created_at: string | null
          document_id: string | null
          document_path: string | null
          expiry_date: string | null
          id: string
          issued_date: string | null
          issuing_authority: string | null
          notes: string | null
          project_id: string
          reference_number: string | null
          status: string | null
          valid_until: string | null
        }
        Insert: {
          application_date?: string | null
          approval_date?: string | null
          clearance_type: string
          conditions?: Json | null
          created_at?: string | null
          document_id?: string | null
          document_path?: string | null
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          project_id: string
          reference_number?: string | null
          status?: string | null
          valid_until?: string | null
        }
        Update: {
          application_date?: string | null
          approval_date?: string | null
          clearance_type?: string
          conditions?: Json | null
          created_at?: string | null
          document_id?: string | null
          document_path?: string | null
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "environmental_clearances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "environmental_clearances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "environmental_commitments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "environmental_commitments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
          resolution: string | null
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
          resolution?: string | null
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
          resolution?: string | null
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "environmental_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "environmental_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
          observation_date: string | null
          observed_at: string | null
          project_id: string
          source_reference: string | null
          source_type: string
          submitted_by: string | null
          unit: string
          value: number
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          evidence_path?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metric: string
          observation_date?: string | null
          observed_at?: string | null
          project_id: string
          source_reference?: string | null
          source_type: string
          submitted_by?: string | null
          unit: string
          value: number
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          evidence_path?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metric?: string
          observation_date?: string | null
          observed_at?: string | null
          project_id?: string
          source_reference?: string | null
          source_type?: string
          submitted_by?: string | null
          unit?: string
          value?: number
          verified?: boolean | null
          verified_by?: string | null
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "environmental_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "environmental_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "environmental_observations_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_data_sources: {
        Row: {
          base_url: string | null
          created_at: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          refresh_frequency: string
          source_code: string
          source_type: string
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          refresh_frequency?: string
          source_code: string
          source_type: string
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          refresh_frequency?: string
          source_code?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      external_observations: {
        Row: {
          created_at: string
          data_source_id: string | null
          id: string
          location: Json | null
          observation_type: string
          observed_at: string
          project_id: string | null
          raw_reference: Json | null
          unit: string | null
          value_numeric: number | null
          value_text: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          data_source_id?: string | null
          id?: string
          location?: Json | null
          observation_type: string
          observed_at?: string
          project_id?: string | null
          raw_reference?: Json | null
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          data_source_id?: string | null
          id?: string
          location?: Json | null
          observation_type?: string
          observed_at?: string
          project_id?: string | null
          raw_reference?: Json | null
          unit?: string | null
          value_numeric?: number | null
          value_text?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "external_observations_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "external_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "external_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "external_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "external_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      financial_updates: {
        Row: {
          actual_expenditure_inr_crore: number | null
          amount_spent_inr_crore: number | null
          budget_allocation_inr_crore: number | null
          budget_head_id: string | null
          cost_overrun_inr_crore: number | null
          cost_overrun_percent: number | null
          cost_variance_inr_crore: number | null
          cost_variance_percent: number | null
          created_at: string | null
          id: string
          notes: string | null
          observation_date: string | null
          original_cost_inr_crore: number | null
          planned_expenditure_inr_crore: number | null
          project_id: string
          reported_cost_inr_crore: number | null
          revised_cost_inr_crore: number | null
          source_id: string | null
        }
        Insert: {
          actual_expenditure_inr_crore?: number | null
          amount_spent_inr_crore?: number | null
          budget_allocation_inr_crore?: number | null
          budget_head_id?: string | null
          cost_overrun_inr_crore?: number | null
          cost_overrun_percent?: number | null
          cost_variance_inr_crore?: number | null
          cost_variance_percent?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          observation_date?: string | null
          original_cost_inr_crore?: number | null
          planned_expenditure_inr_crore?: number | null
          project_id: string
          reported_cost_inr_crore?: number | null
          revised_cost_inr_crore?: number | null
          source_id?: string | null
        }
        Update: {
          actual_expenditure_inr_crore?: number | null
          amount_spent_inr_crore?: number | null
          budget_allocation_inr_crore?: number | null
          budget_head_id?: string | null
          cost_overrun_inr_crore?: number | null
          cost_overrun_percent?: number | null
          cost_variance_inr_crore?: number | null
          cost_variance_percent?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          observation_date?: string | null
          original_cost_inr_crore?: number | null
          planned_expenditure_inr_crore?: number | null
          project_id?: string
          reported_cost_inr_crore?: number | null
          revised_cost_inr_crore?: number | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_updates_budget_head_id_fkey"
            columns: ["budget_head_id"]
            isOneToOne: false
            referencedRelation: "project_budget_heads"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "financial_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
            foreignKeyName: "financial_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
          due_date: string | null
          evidence_path: string | null
          finding_type: string | null
          id: string
          inspection_id: string
          latitude: number | null
          longitude: number | null
          required_action: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
          verified_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          due_date?: string | null
          evidence_path?: string | null
          finding_type?: string | null
          id?: string
          inspection_id: string
          latitude?: number | null
          longitude?: number | null
          required_action?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          due_date?: string | null
          evidence_path?: string | null
          finding_type?: string | null
          id?: string
          inspection_id?: string
          latitude?: number | null
          longitude?: number | null
          required_action?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_findings_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_findings_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          inspector_organization_id: string | null
          inspector_user_id: string | null
          milestone_id: string | null
          overall_result: string | null
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
          inspector_organization_id?: string | null
          inspector_user_id?: string | null
          milestone_id?: string | null
          overall_result?: string | null
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
          inspector_organization_id?: string | null
          inspector_user_id?: string | null
          milestone_id?: string | null
          overall_result?: string | null
          project_id?: string
          scheduled_date?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_inspector_organization_id_fkey"
            columns: ["inspector_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "inspections_inspector_organization_id_fkey"
            columns: ["inspector_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_inspector_user_id_fkey"
            columns: ["inspector_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      litigation_events: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string | null
          event_date: string
          event_type: string
          id: string
          litigation_id: string
          next_action: string | null
          next_action_due_date: string | null
          summary: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          event_date?: string
          event_type?: string
          id?: string
          litigation_id: string
          next_action?: string | null
          next_action_due_date?: string | null
          summary: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          event_date?: string
          event_type?: string
          id?: string
          litigation_id?: string
          next_action?: string | null
          next_action_due_date?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "litigation_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigation_events_litigation_id_fkey"
            columns: ["litigation_id"]
            isOneToOne: false
            referencedRelation: "litigations"
            referencedColumns: ["id"]
          },
        ]
      }
      litigations: {
        Row: {
          case_number: string
          case_title: string
          claimed_amount: number | null
          contractor_organization_id: string | null
          court_or_forum: string
          created_at: string
          created_by: string | null
          filing_date: string
          government_organization_id: string
          id: string
          jurisdiction: string | null
          litigation_type: string
          next_hearing_date: string | null
          opposing_party: string
          project_id: string
          risk_level: string | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          case_number: string
          case_title: string
          claimed_amount?: number | null
          contractor_organization_id?: string | null
          court_or_forum: string
          created_at?: string
          created_by?: string | null
          filing_date?: string
          government_organization_id: string
          id?: string
          jurisdiction?: string | null
          litigation_type?: string
          next_hearing_date?: string | null
          opposing_party: string
          project_id: string
          risk_level?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          case_number?: string
          case_title?: string
          claimed_amount?: number | null
          contractor_organization_id?: string | null
          court_or_forum?: string
          created_at?: string
          created_by?: string | null
          filing_date?: string
          government_organization_id?: string
          id?: string
          jurisdiction?: string | null
          litigation_type?: string
          next_hearing_date?: string | null
          opposing_party?: string
          project_id?: string
          risk_level?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "litigations_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "litigations_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigations_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "litigations_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "litigations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "litigations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "litigations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litigations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          organization_id: string | null
          project_id: string | null
          read_at: string | null
          recipient_organization_id: string | null
          recipient_user_id: string | null
          severity: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          organization_id?: string | null
          project_id?: string | null
          read_at?: string | null
          recipient_organization_id?: string | null
          recipient_user_id?: string | null
          severity?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          organization_id?: string | null
          project_id?: string | null
          read_at?: string | null
          recipient_organization_id?: string | null
          recipient_user_id?: string | null
          severity?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "notifications_recipient_organization_id_fkey"
            columns: ["recipient_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "notifications_recipient_organization_id_fkey"
            columns: ["recipient_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
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
          city: string | null
          created_at: string | null
          department: string | null
          district: string | null
          gstin: string | null
          id: string
          name: string
          organization_type: string | null
          parent_id: string | null
          registration_number: string | null
          state: string | null
          status: string
          type: Database["public"]["Enums"]["org_type_enum"]
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          department?: string | null
          district?: string | null
          gstin?: string | null
          id?: string
          name: string
          organization_type?: string | null
          parent_id?: string | null
          registration_number?: string | null
          state?: string | null
          status?: string
          type?: Database["public"]["Enums"]["org_type_enum"]
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          department?: string | null
          district?: string | null
          gstin?: string | null
          id?: string
          name?: string
          organization_type?: string | null
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_claim_documents: {
        Row: {
          created_at: string
          document_id: string | null
          document_type: string
          id: string
          payment_claim_id: string
          storage_path: string
          title: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          document_type?: string
          id?: string
          payment_claim_id: string
          storage_path: string
          title?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          document_type?: string
          id?: string
          payment_claim_id?: string
          storage_path?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_claim_documents_payment_claim_id_fkey"
            columns: ["payment_claim_id"]
            isOneToOne: false
            referencedRelation: "payment_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_claims: {
        Row: {
          approved_amount: number | null
          approved_at: string | null
          approved_by: string | null
          claim_number: string
          claim_type: string
          claimed_amount: number
          contract_id: string | null
          contractor_organization_id: string
          created_at: string
          description: string | null
          id: string
          milestone_id: string | null
          project_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          submitted_by: string | null
          updated_at: string
          verified_amount: number | null
        }
        Insert: {
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          claim_number: string
          claim_type?: string
          claimed_amount: number
          contract_id?: string | null
          contractor_organization_id: string
          created_at?: string
          description?: string | null
          id?: string
          milestone_id?: string | null
          project_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
          verified_amount?: number | null
        }
        Update: {
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          claim_number?: string
          claim_type?: string
          claimed_amount?: number
          contract_id?: string | null
          contractor_organization_id?: string
          created_at?: string
          description?: string | null
          id?: string
          milestone_id?: string | null
          project_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          updated_at?: string
          verified_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_claims_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_claims_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "payment_claims_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_claims_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["active_contract_id"]
          },
          {
            foreignKeyName: "payment_claims_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "payment_claims_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_claims_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payment_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payment_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payment_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_claims_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payment_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_claims_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          contractor_organization_id: string
          created_at: string
          id: string
          payment_claim_id: string
          payment_date: string
          payment_method: string
          payment_reference: string
          project_id: string
          recorded_by: string | null
        }
        Insert: {
          amount_paid: number
          contractor_organization_id: string
          created_at?: string
          id?: string
          payment_claim_id: string
          payment_date?: string
          payment_method?: string
          payment_reference: string
          project_id: string
          recorded_by?: string | null
        }
        Update: {
          amount_paid?: number
          contractor_organization_id?: string
          created_at?: string
          id?: string
          payment_claim_id?: string
          payment_date?: string
          payment_method?: string
          payment_reference?: string
          project_id?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "payments_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_claim_id_fkey"
            columns: ["payment_claim_id"]
            isOneToOne: false
            referencedRelation: "payment_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          description: string | null
          document_id: string | null
          evidence_type: string
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          progress_update_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          captured_at?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          evidence_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          progress_update_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          captured_at?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          evidence_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          progress_update_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_evidence_progress_update_id_fkey"
            columns: ["progress_update_id"]
            isOneToOne: false
            referencedRelation: "progress_updates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_updates: {
        Row: {
          challenges: string | null
          contractor_delay_reason: string | null
          contractor_organization_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          milestone_id: string | null
          observation_date: string | null
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
          work_completed: string | null
          work_planned: string | null
        }
        Insert: {
          challenges?: string | null
          contractor_delay_reason?: string | null
          contractor_organization_id: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          milestone_id?: string | null
          observation_date?: string | null
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
          work_completed?: string | null
          work_planned?: string | null
        }
        Update: {
          challenges?: string | null
          contractor_delay_reason?: string | null
          contractor_organization_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          milestone_id?: string | null
          observation_date?: string | null
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
          work_completed?: string | null
          work_planned?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_updates_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_aliases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
            foreignKeyName: "project_aliases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
      project_budget_heads: {
        Row: {
          budget_code: string
          budget_head: string
          created_at: string
          description: string | null
          id: string
          project_id: string
          revised_amount_inr_crore: number | null
          sanctioned_amount_inr_crore: number
          updated_at: string
        }
        Insert: {
          budget_code: string
          budget_head: string
          created_at?: string
          description?: string | null
          id?: string
          project_id: string
          revised_amount_inr_crore?: number | null
          sanctioned_amount_inr_crore?: number
          updated_at?: string
        }
        Update: {
          budget_code?: string
          budget_head?: string
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string
          revised_amount_inr_crore?: number | null
          sanctioned_amount_inr_crore?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budget_heads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budget_heads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_budget_heads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budget_heads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_budget_heads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_budget_heads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budget_heads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_budget_heads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_documents: {
        Row: {
          checksum: string | null
          created_at: string | null
          document_date: string | null
          document_type: string
          external_url: string | null
          file_size: number | null
          id: string
          is_current_version: boolean
          is_public: boolean | null
          mime_type: string | null
          organization_id: string | null
          project_id: string
          publisher: string | null
          sha256: string | null
          source_id: string | null
          storage_bucket: string | null
          storage_path: string | null
          title: string
          uploaded_by: string | null
          version_number: number
          visibility: string
        }
        Insert: {
          checksum?: string | null
          created_at?: string | null
          document_date?: string | null
          document_type: string
          external_url?: string | null
          file_size?: number | null
          id?: string
          is_current_version?: boolean
          is_public?: boolean | null
          mime_type?: string | null
          organization_id?: string | null
          project_id: string
          publisher?: string | null
          sha256?: string | null
          source_id?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          title: string
          uploaded_by?: string | null
          version_number?: number
          visibility?: string
        }
        Update: {
          checksum?: string | null
          created_at?: string | null
          document_date?: string | null
          document_type?: string
          external_url?: string | null
          file_size?: number | null
          id?: string
          is_current_version?: boolean
          is_public?: boolean | null
          mime_type?: string | null
          organization_id?: string | null
          project_id?: string
          publisher?: string | null
          sha256?: string | null
          source_id?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          title?: string
          uploaded_by?: string | null
          version_number?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "project_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_import_staging_imported_project_id_fkey"
            columns: ["imported_project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "project_import_staging_imported_project_id_fkey"
            columns: ["imported_project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          actual_cost: number | null
          actual_end_date: string | null
          actual_start_date: string | null
          contract_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          id: string
          milestone_code: string | null
          milestone_name: string
          milestone_type: string | null
          planned_cost: number | null
          planned_end_date: string | null
          planned_progress: number | null
          planned_progress_percent: number | null
          planned_start_date: string | null
          project_id: string
          revised_end_date: string | null
          sequence_number: number | null
          status: string | null
          updated_at: string | null
          verified_progress: number | null
          verified_progress_percent: number | null
          version: number | null
          weight_percent: number | null
        }
        Insert: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          milestone_code?: string | null
          milestone_name: string
          milestone_type?: string | null
          planned_cost?: number | null
          planned_end_date?: string | null
          planned_progress?: number | null
          planned_progress_percent?: number | null
          planned_start_date?: string | null
          project_id: string
          revised_end_date?: string | null
          sequence_number?: number | null
          status?: string | null
          updated_at?: string | null
          verified_progress?: number | null
          verified_progress_percent?: number | null
          version?: number | null
          weight_percent?: number | null
        }
        Update: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          contract_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          milestone_code?: string | null
          milestone_name?: string
          milestone_type?: string | null
          planned_cost?: number | null
          planned_end_date?: string | null
          planned_progress?: number | null
          planned_progress_percent?: number | null
          planned_start_date?: string | null
          project_id?: string
          revised_end_date?: string | null
          sequence_number?: number | null
          status?: string | null
          updated_at?: string | null
          verified_progress?: number | null
          verified_progress_percent?: number | null
          version?: number | null
          weight_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "project_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["active_contract_id"]
          },
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_organizations: {
        Row: {
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          organization_id: string
          project_id: string
          relationship: string | null
          relationship_type: string | null
          status: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          organization_id: string
          project_id: string
          relationship?: string | null
          relationship_type?: string | null
          status?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          organization_id?: string
          project_id?: string
          relationship?: string | null
          relationship_type?: string | null
          status?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_organizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "project_organizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_resource_allocations: {
        Row: {
          allocated_quantity: number
          allocation_date: string
          available_quantity: number
          contractor_organization_id: string
          created_at: string
          id: string
          project_id: string
          required_quantity: number
          resource_item_id: string
          status: string
          updated_at: string
          utilized_quantity: number
        }
        Insert: {
          allocated_quantity?: number
          allocation_date?: string
          available_quantity?: number
          contractor_organization_id: string
          created_at?: string
          id?: string
          project_id: string
          required_quantity?: number
          resource_item_id: string
          status?: string
          updated_at?: string
          utilized_quantity?: number
        }
        Update: {
          allocated_quantity?: number
          allocation_date?: string
          available_quantity?: number
          contractor_organization_id?: string
          created_at?: string
          id?: string
          project_id?: string
          required_quantity?: number
          resource_item_id?: string
          status?: string
          updated_at?: string
          utilized_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_resource_allocations_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "project_resource_allocations_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_resource_allocations_resource_item_id_fkey"
            columns: ["resource_item_id"]
            isOneToOne: false
            referencedRelation: "resource_items"
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
      project_workforce_updates: {
        Row: {
          available_workers: number
          contractor_organization_id: string
          created_at: string
          id: string
          observation_date: string
          planned_workers: number
          project_id: string
          reported_by: string | null
          safety_officers: number | null
          skilled_workers: number | null
          supervisors: number | null
          unskilled_workers: number | null
          verification_status: string
          verified_by: string | null
          worker_shortage_ratio: number | null
        }
        Insert: {
          available_workers?: number
          contractor_organization_id: string
          created_at?: string
          id?: string
          observation_date?: string
          planned_workers?: number
          project_id: string
          reported_by?: string | null
          safety_officers?: number | null
          skilled_workers?: number | null
          supervisors?: number | null
          unskilled_workers?: number | null
          verification_status?: string
          verified_by?: string | null
          worker_shortage_ratio?: number | null
        }
        Update: {
          available_workers?: number
          contractor_organization_id?: string
          created_at?: string
          id?: string
          observation_date?: string
          planned_workers?: number
          project_id?: string
          reported_by?: string | null
          safety_officers?: number | null
          skilled_workers?: number | null
          supervisors?: number | null
          unskilled_workers?: number | null
          verification_status?: string
          verified_by?: string | null
          worker_shortage_ratio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_workforce_updates_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "project_workforce_updates_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workforce_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workforce_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_workforce_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workforce_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_workforce_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_workforce_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workforce_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workforce_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_workforce_updates_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workforce_updates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_completion_date: string | null
          actual_start_date: string | null
          amount_spent_inr_crore: number | null
          approved_cost_inr_crore: number | null
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
          funding_source: string | null
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
          priority: string | null
          procurement_mode: string | null
          project_authority: string | null
          project_name: string
          project_type: string | null
          public_summary: string | null
          public_visibility: boolean | null
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
          approved_cost_inr_crore?: number | null
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
          funding_source?: string | null
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
          priority?: string | null
          procurement_mode?: string | null
          project_authority?: string | null
          project_name: string
          project_type?: string | null
          public_summary?: string | null
          public_visibility?: boolean | null
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
          approved_cost_inr_crore?: number | null
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
          funding_source?: string | null
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
          priority?: string | null
          procurement_mode?: string | null
          project_authority?: string | null
          project_name?: string
          project_type?: string | null
          public_summary?: string | null
          public_visibility?: boolean | null
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "projects_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_items: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          resource_code: string
          resource_type: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          resource_code: string
          resource_type: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          resource_code?: string
          resource_type?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "resource_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_usage_updates: {
        Row: {
          available_quantity: number
          created_at: string
          id: string
          notes: string | null
          observation_date: string
          project_id: string
          reported_by: string | null
          required_quantity: number
          resource_allocation_id: string | null
          shortage_quantity: number | null
          shortage_ratio: number | null
          used_quantity: number
          verification_status: string
          verified_by: string | null
        }
        Insert: {
          available_quantity?: number
          created_at?: string
          id?: string
          notes?: string | null
          observation_date?: string
          project_id: string
          reported_by?: string | null
          required_quantity?: number
          resource_allocation_id?: string | null
          shortage_quantity?: number | null
          shortage_ratio?: number | null
          used_quantity?: number
          verification_status?: string
          verified_by?: string | null
        }
        Update: {
          available_quantity?: number
          created_at?: string
          id?: string
          notes?: string | null
          observation_date?: string
          project_id?: string
          reported_by?: string | null
          required_quantity?: number
          resource_allocation_id?: string | null
          shortage_quantity?: number | null
          shortage_ratio?: number | null
          used_quantity?: number
          verification_status?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_usage_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_usage_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "resource_usage_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_usage_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "resource_usage_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "resource_usage_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_usage_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_usage_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "resource_usage_updates_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_usage_updates_resource_allocation_id_fkey"
            columns: ["resource_allocation_id"]
            isOneToOne: false
            referencedRelation: "project_resource_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_usage_updates_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          approved_amount: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          effective_date: string | null
          id: string
          litigation_id: string | null
          project_id: string
          proposed_amount: number | null
          proposed_at: string
          proposed_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          settlement_number: string
          settlement_type: string
          status: string
          terms: string
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          litigation_id?: string | null
          project_id: string
          proposed_amount?: number | null
          proposed_at?: string
          proposed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          settlement_number: string
          settlement_type?: string
          status?: string
          terms: string
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          litigation_id?: string | null
          project_id?: string
          proposed_amount?: number | null
          proposed_at?: string
          proposed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          settlement_number?: string
          settlement_type?: string
          status?: string
          terms?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_litigation_id_fkey"
            columns: ["litigation_id"]
            isOneToOne: false
            referencedRelation: "litigations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "contractor_assigned_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "government_project_summary_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "public_projects_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "settlements_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "source_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
            foreignKeyName: "source_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
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
          combined_score: number | null
          contractor_organization_id: string
          deleted_at: string | null
          documents: Json | null
          financial_proposal: Json | null
          financial_score: number | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          technical_proposal: string | null
          technical_score: number | null
          tender_id: string
          updated_at: string | null
          withdrawn_at: string | null
        }
        Insert: {
          bid_amount: number
          bid_reference?: string | null
          combined_score?: number | null
          contractor_organization_id: string
          deleted_at?: string | null
          documents?: Json | null
          financial_proposal?: Json | null
          financial_score?: number | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          technical_proposal?: string | null
          technical_score?: number | null
          tender_id: string
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          bid_amount?: number
          bid_reference?: string | null
          combined_score?: number | null
          contractor_organization_id?: string
          deleted_at?: string | null
          documents?: Json | null
          financial_proposal?: Json | null
          financial_score?: number | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          technical_proposal?: string | null
          technical_score?: number | null
          tender_id?: string
          updated_at?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_bids_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "tender_bids_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_bids_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_bids_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["tender_id"]
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
      tender_documents: {
        Row: {
          created_at: string
          document_id: string | null
          document_type: string
          id: string
          storage_path: string
          tender_id: string
          title: string
          uploaded_by: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          document_type?: string
          id?: string
          storage_path: string
          tender_id: string
          title?: string
          uploaded_by?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          document_type?: string
          id?: string
          storage_path?: string
          tender_id?: string
          title?: string
          uploaded_by?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["tender_id"]
          },
          {
            foreignKeyName: "tender_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          financial_opening_date: string | null
          financial_requirements: string | null
          government_organization_id: string | null
          id: string
          is_public: boolean | null
          issuing_organization_id: string | null
          official_tender_id: string | null
          pre_bid_date: string | null
          project_id: string
          publication_date: string | null
          published_at: string | null
          published_by: string | null
          status: string
          technical_opening_date: string | null
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
          financial_opening_date?: string | null
          financial_requirements?: string | null
          government_organization_id?: string | null
          id?: string
          is_public?: boolean | null
          issuing_organization_id?: string | null
          official_tender_id?: string | null
          pre_bid_date?: string | null
          project_id: string
          publication_date?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: string
          technical_opening_date?: string | null
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
          financial_opening_date?: string | null
          financial_requirements?: string | null
          government_organization_id?: string | null
          id?: string
          is_public?: boolean | null
          issuing_organization_id?: string | null
          official_tender_id?: string | null
          pre_bid_date?: string | null
          project_id?: string
          publication_date?: string | null
          published_at?: string | null
          published_by?: string | null
          status?: string
          technical_opening_date?: string | null
          technical_requirements?: string | null
          tender_number?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenders_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "tenders_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenders_issuing_organization_id_fkey"
            columns: ["issuing_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["project_id"]
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
            referencedRelation: "project_finance_summary_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary_view"
            referencedColumns: ["project_id"]
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
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "tender_catalog_view"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tenders_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
      blockchain_anchors: {
        Row: {
          id: string
          audit_id: string
          project_id: string | null
          entity_type: string
          entity_id: string | null
          entity_external_id: string | null
          event_type: string
          canonical_version: number
          payload_hash: string | null
          hash_algorithm: string
          anchor_nonce: string | null
          fabric_network: string | null
          channel_name: string | null
          chaincode_name: string | null
          transaction_id: string | null
          block_number: number | null
          status: string
          attempt_count: number
          last_error: string | null
          submitted_at: string | null
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          project_id?: string | null
          entity_type: string
          entity_id?: string | null
          entity_external_id?: string | null
          event_type: string
          canonical_version?: number
          payload_hash?: string | null
          hash_algorithm?: string
          anchor_nonce?: string | null
          fabric_network?: string | null
          channel_name?: string | null
          chaincode_name?: string | null
          transaction_id?: string | null
          block_number?: number | null
          status?: string
          attempt_count?: number
          last_error?: string | null
          submitted_at?: string | null
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          project_id?: string | null
          entity_type?: string
          entity_id?: string | null
          entity_external_id?: string | null
          event_type?: string
          canonical_version?: number
          payload_hash?: string | null
          hash_algorithm?: string
          anchor_nonce?: string | null
          fabric_network?: string | null
          channel_name?: string | null
          chaincode_name?: string | null
          transaction_id?: string | null
          block_number?: number | null
          status?: string
          attempt_count?: number
          last_error?: string | null
          submitted_at?: string | null
          confirmed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      blockchain_anchor_outbox: {
        Row: {
          id: string
          dedupe_key: string
          anchor_id: string
          project_id: string | null
          entity_type: string
          entity_id: string | null
          event_type: string
          minimal_payload: Json
          status: string
          attempt_count: number
          next_attempt_at: string
          locked_at: string | null
          locked_by: string | null
          last_error: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          dedupe_key: string
          anchor_id: string
          project_id?: string | null
          entity_type: string
          entity_id?: string | null
          event_type: string
          minimal_payload: Json
          status?: string
          attempt_count?: number
          next_attempt_at?: string
          locked_at?: string | null
          locked_by?: string | null
          last_error?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          dedupe_key?: string
          anchor_id?: string
          project_id?: string | null
          entity_type?: string
          entity_id?: string | null
          event_type?: string
          minimal_payload?: Json
          status?: string
          attempt_count?: number
          next_attempt_at?: string
          locked_at?: string | null
          locked_by?: string | null
          last_error?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Relationships: []
      }
      gateway_sessions: {
        Row: {
          id: string
          user_id: string
          session_token_hash: string
          csrf_token_hash: string
          supabase_access_token: string | null
          supabase_refresh_token: string | null
          access_token_expires_at: string | null
          mfa_verified: boolean
          mfa_verified_at: string | null
          elevated_until: string | null
          ip_address: string | null
          user_agent: string | null
          expires_at: string
          revoked_at: string | null
          created_at: string
          last_active_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token_hash: string
          csrf_token_hash: string
          supabase_access_token?: string | null
          supabase_refresh_token?: string | null
          access_token_expires_at?: string | null
          mfa_verified?: boolean
          mfa_verified_at?: string | null
          elevated_until?: string | null
          ip_address?: string | null
          user_agent?: string | null
          expires_at: string
          revoked_at?: string | null
          created_at?: string
          last_active_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token_hash?: string
          csrf_token_hash?: string
          supabase_access_token?: string | null
          supabase_refresh_token?: string | null
          access_token_expires_at?: string | null
          mfa_verified?: boolean
          mfa_verified_at?: string | null
          elevated_until?: string | null
          ip_address?: string | null
          user_agent?: string | null
          expires_at?: string
          revoked_at?: string | null
          created_at?: string
          last_active_at?: string
        }
        Relationships: []
      }
      mfa_challenges: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          challenge_hash: string
          challenge_type: string
          status: string
          attempts: number
          expires_at: string
          created_at: string
          verified_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          challenge_hash: string
          challenge_type?: string
          status?: string
          attempts?: number
          expires_at: string
          created_at?: string
          verified_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          challenge_hash?: string
          challenge_type?: string
          status?: string
          attempts?: number
          expires_at?: string
          created_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_mfa_factors: {
        Row: {
          id: string
          user_id: string
          factor_type: string
          secret: string
          status: string
          enrolled_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          factor_type?: string
          secret: string
          status?: string
          enrolled_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          factor_type?: string
          secret?: string
          status?: string
          enrolled_at?: string
          last_used_at?: string | null
        }
        Relationships: []
      }
    Views: {
      contractor_assigned_projects_view: {
        Row: {
          approved_claims_count: number | null
          contract_id: string | null
          contract_number: string | null
          contract_status: string | null
          contract_value: number | null
          contractor_organization_id: string | null
          current_status_verified: boolean | null
          id: string | null
          latitude: number | null
          location_text: string | null
          longitude: number | null
          my_latest_reported_progress: number | null
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
        Relationships: [
          {
            foreignKeyName: "contracts_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "contracts_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      government_project_dashboard_view: {
        Row: {
          active_contract_id: string | null
          contract_number: string | null
          contractor_name: string | null
          contractor_org_id: string | null
          financial_progress_percent: number | null
          government_organization_id: string | null
          latest_ai_review_priority_band: string | null
          latest_ai_review_priority_score: number | null
          nirikshak_project_id: string | null
          normalized_status: string | null
          open_complaints: number | null
          pending_inspections: number | null
          pending_progress_reviews: number | null
          physical_progress_percent: number | null
          project_id: string | null
          project_name: string | null
          sector: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "projects_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "government_project_dashboard_view"
            referencedColumns: ["contractor_org_id"]
          },
          {
            foreignKeyName: "projects_government_organization_id_fkey"
            columns: ["government_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_finance_summary_view: {
        Row: {
          approved_claims_inr: number | null
          nirikshak_project_id: string | null
          pending_claims_inr: number | null
          project_id: string | null
          sanctioned_amount_inr_crore: number | null
          spent_inr_crore: number | null
          total_paid_inr: number | null
        }
        Insert: {
          approved_claims_inr?: never
          nirikshak_project_id?: string | null
          pending_claims_inr?: never
          project_id?: string | null
          sanctioned_amount_inr_crore?: never
          spent_inr_crore?: never
          total_paid_inr?: never
        }
        Update: {
          approved_claims_inr?: never
          nirikshak_project_id?: string | null
          pending_claims_inr?: never
          project_id?: string | null
          sanctioned_amount_inr_crore?: never
          spent_inr_crore?: never
          total_paid_inr?: never
        }
        Relationships: []
      }
      project_progress_summary_view: {
        Row: {
          active_delay_days: number | null
          last_progress_update_at: string | null
          latest_reported_progress_percent: number | null
          nirikshak_project_id: string | null
          pending_reviews_count: number | null
          project_id: string | null
          project_name: string | null
          verified_physical_progress_percent: number | null
        }
        Insert: {
          active_delay_days?: never
          last_progress_update_at?: never
          latest_reported_progress_percent?: never
          nirikshak_project_id?: string | null
          pending_reviews_count?: never
          project_id?: string | null
          project_name?: string | null
          verified_physical_progress_percent?: number | null
        }
        Update: {
          active_delay_days?: never
          last_progress_update_at?: never
          latest_reported_progress_percent?: never
          nirikshak_project_id?: string | null
          pending_reviews_count?: never
          project_id?: string | null
          project_name?: string | null
          verified_physical_progress_percent?: number | null
        }
        Relationships: []
      }
      public_projects_view: {
        Row: {
          actual_completion_date: string | null
          approved_cost_inr_crore: number | null
          award_date: string | null
          city: string | null
          contract_number: string | null
          contractor_concessionaire: string | null
          contractor_name: string | null
          created_at: string | null
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
          resolved_complaints_count: number | null
          revised_completion_date: string | null
          sector: string | null
          state: string | null
          subsector: string | null
          total_cost_inr_crore: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      tender_catalog_view: {
        Row: {
          bid_due_date: string | null
          description: string | null
          district: string | null
          eligibility_criteria: string | null
          estimated_value_inr_crore: number | null
          financial_opening_date: string | null
          issuing_department_name: string | null
          nirikshak_project_id: string | null
          pre_bid_date: string | null
          project_id: string | null
          project_name: string | null
          publication_date: string | null
          sector: string | null
          state: string | null
          technical_opening_date: string | null
          technical_requirements: string | null
          tender_id: string | null
          tender_number: string | null
          tender_status: string | null
          tender_title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_contractor_access_request: {
        Args: {
          approved_role?: Database["public"]["Enums"]["app_role_enum"]
          request_id: string
        }
        Returns: Json
      }
      approve_contractor_access_request_internal: {
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
      approve_government_access_request_internal: {
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
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      record_payment: {
        Args: {
          p_amount_paid: number
          p_claim_id: string
          p_payment_method?: string
          p_payment_reference: string
        }
        Returns: {
          amount_paid: number
          contractor_organization_id: string
          created_at: string
          id: string
          payment_claim_id: string
          payment_date: string
          payment_method: string
          payment_reference: string
          project_id: string
          recorded_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      review_payment_claim: {
        Args: {
          p_approved_amount?: number
          p_claim_id: string
          p_decision: string
          p_review_notes?: string
          p_verified_amount?: number
        }
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
          combined_score: number | null
          contractor_organization_id: string
          deleted_at: string | null
          documents: Json | null
          financial_proposal: Json | null
          financial_score: number | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          technical_proposal: string | null
          technical_score: number | null
          tender_id: string
          updated_at: string | null
          withdrawn_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tender_bids"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      seed_projects_batch: { Args: { projects_data: Json }; Returns: number }
      submit_payment_claim: {
        Args: {
          p_claim_type?: string
          p_claimed_amount: number
          p_description?: string
          p_milestone_id?: string
          p_project_id: string
        }
        Returns: {
          approved_amount: number | null
          approved_at: string | null
          approved_by: string | null
          claim_number: string
          claim_type: string
          claimed_amount: number
          contract_id: string | null
          contractor_organization_id: string
          created_at: string
          description: string | null
          id: string
          milestone_id: string | null
          project_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          submitted_by: string | null
          updated_at: string
          verified_amount: number | null
        }
        SetofOptions: {
          from: "*"
          to: "payment_claims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_progress_update: {
        Args: {
          p_description: string
          p_milestone_id?: string
          p_project_id: string
          p_reported_progress: number
        }
        Returns: {
          challenges: string | null
          contractor_delay_reason: string | null
          contractor_organization_id: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          milestone_id: string | null
          observation_date: string | null
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
          work_completed: string | null
          work_planned: string | null
        }
        SetofOptions: {
          from: "*"
          to: "progress_updates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_production_schema_health: { Args: never; Returns: Json }
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
      project_lifecycle_status_enum:
        | "PROPOSED"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "TENDERING"
        | "AWARDED"
        | "UNDER_CONSTRUCTION"
        | "DELAYED"
        | "AT_RISK"
        | "STALLED"
        | "SUSPENDED"
        | "COMPLETED"
        | "CANCELLED"
      project_org_relation_enum:
        | "OWNER"
        | "IMPLEMENTING_AGENCY"
        | "CONTRACTOR"
        | "CONSULTANT"
        | "AUDITOR"
        | "SUPERVISOR"
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
      project_lifecycle_status_enum: [
        "PROPOSED",
        "UNDER_REVIEW",
        "APPROVED",
        "TENDERING",
        "AWARDED",
        "UNDER_CONSTRUCTION",
        "DELAYED",
        "AT_RISK",
        "STALLED",
        "SUSPENDED",
        "COMPLETED",
        "CANCELLED",
      ],
      project_org_relation_enum: [
        "OWNER",
        "IMPLEMENTING_AGENCY",
        "CONTRACTOR",
        "CONSULTANT",
        "AUDITOR",
        "SUPERVISOR",
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
