-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 042_rls_v2.sql
-- Domain: Comprehensive Row Level Security (RLS) Policies on all Database V2 Tables
-- ==============================================================================

-- 1. Enable RLS on all newly created tables
ALTER TABLE public.tender_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_usage_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_workforce_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budget_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommended_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_observations ENABLE ROW LEVEL SECURITY;

-- 2. TENDER & BID DOCUMENTS RLS
-- Public tender documents readable by authenticated users
CREATE POLICY "Public tender documents readable by all authenticated"
  ON public.tender_documents FOR SELECT
  TO authenticated
  USING (visibility = 'PUBLIC' OR public.is_government_user());

-- Bid documents: strictly contractor private or authorized government evaluator
CREATE POLICY "Contractor can view own bid documents"
  ON public.bid_documents FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tender_bids b
      WHERE b.id = bid_documents.bid_id 
        AND b.contractor_organization_id = public.get_current_user_organization_id()
    ) OR
    public.is_government_user()
  );

CREATE POLICY "Contractor can upload own bid documents"
  ON public.bid_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tender_bids b
      WHERE b.id = bid_documents.bid_id 
        AND b.contractor_organization_id = public.get_current_user_organization_id()
    )
  );

-- 3. RESOURCES & WORKFORCE RLS
CREATE POLICY "Organization can manage own resource items"
  ON public.resource_items FOR ALL
  TO authenticated
  USING (organization_id = public.get_current_user_organization_id() OR public.is_government_user())
  WITH CHECK (organization_id = public.get_current_user_organization_id() OR public.is_government_user());

CREATE POLICY "Project resource allocations visible to project parties"
  ON public.project_resource_allocations FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "Contractor can insert resource usage updates"
  ON public.resource_usage_updates FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_project(project_id) AND reported_by = auth.uid());

CREATE POLICY "Project resource usage readable by project parties"
  ON public.resource_usage_updates FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "Project workforce updates readable by project parties"
  ON public.project_workforce_updates FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "Contractor can report workforce counts"
  ON public.project_workforce_updates FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_project(project_id) AND reported_by = auth.uid());

-- 4. FINANCE & PAYMENT CLAIMS RLS
CREATE POLICY "Budget heads readable by project stakeholders"
  ON public.project_budget_heads FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "Government officers can manage budget heads"
  ON public.project_budget_heads FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

CREATE POLICY "Payment claims visible to owning contractor and authorized government"
  ON public.payment_claims FOR SELECT
  TO authenticated
  USING (
    contractor_organization_id = public.get_current_user_organization_id() OR
    public.can_manage_project(project_id)
  );

CREATE POLICY "Contractor can submit payment claims"
  ON public.payment_claims FOR INSERT
  TO authenticated
  WITH CHECK (
    contractor_organization_id = public.get_current_user_organization_id() AND
    submitted_by = auth.uid() AND
    status IN ('DRAFT', 'SUBMITTED')
  );

CREATE POLICY "Payment vouchers visible to claim parties"
  ON public.payment_claim_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.payment_claims pc
      WHERE pc.id = payment_claim_documents.payment_claim_id
        AND (pc.contractor_organization_id = public.get_current_user_organization_id() OR public.can_manage_project(pc.project_id))
    )
  );

CREATE POLICY "Payments ledger readable by authorized parties"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    contractor_organization_id = public.get_current_user_organization_id() OR
    public.can_manage_project(project_id)
  );

-- 5. LEGAL, LITIGATION & SETTLEMENTS RLS
CREATE POLICY "Litigations readable by authorized government and assigned contractor"
  ON public.litigations FOR SELECT
  TO authenticated
  USING (
    government_organization_id = public.get_current_user_organization_id() OR
    contractor_organization_id = public.get_current_user_organization_id() OR
    public.is_government_user()
  );

CREATE POLICY "Government can manage litigation"
  ON public.litigations FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

CREATE POLICY "Litigation events readable by litigation parties"
  ON public.litigation_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.litigations l
      WHERE l.id = litigation_events.litigation_id
        AND (l.government_organization_id = public.get_current_user_organization_id() OR l.contractor_organization_id = public.get_current_user_organization_id())
    )
  );

CREATE POLICY "Settlements readable by settlement parties"
  ON public.settlements FOR SELECT
  TO authenticated
  USING (
    public.can_manage_project(project_id) OR
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.project_id = settlements.project_id
        AND c.contractor_organization_id = public.get_current_user_organization_id()
    )
  );

-- 6. AI INTELLIGENCE DOMAIN RLS
CREATE POLICY "Government can read AI analysis runs"
  ON public.ai_analysis_runs FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

CREATE POLICY "Government can read AI recommendations"
  ON public.ai_recommended_actions FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

CREATE POLICY "Government can submit recommendation feedback"
  ON public.ai_recommendation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_user() AND reviewed_by = auth.uid());

CREATE POLICY "Government can read AI feedback"
  ON public.ai_recommendation_feedback FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

CREATE POLICY "Government can read AI verified outcomes"
  ON public.ai_action_outcomes FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

CREATE POLICY "Government can view AI context snapshots"
  ON public.ai_context_snapshots FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

-- 7. EXTERNAL OBSERVATIONS RLS
CREATE POLICY "External data sources readable by all authenticated"
  ON public.external_data_sources FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "External observations readable by authenticated users"
  ON public.external_observations FOR SELECT
  TO authenticated
  USING (true);
