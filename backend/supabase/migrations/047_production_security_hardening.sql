-- ============================================================================
-- Migration: 047_production_security_hardening.sql
-- Description: Multi-tenant Litigation, Settlement Isolation & Hard Delete Safeguards
-- ============================================================================

-- 1. Hard Delete Prevention Trigger on Financial, Audit & Legal Entities
CREATE OR REPLACE FUNCTION public.prevent_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Hard deletion is strictly prohibited on table % for compliance, legal, and audit integrity.', TG_TABLE_NAME;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_payments') THEN
        CREATE TRIGGER trg_prevent_delete_payments
            BEFORE DELETE ON public.payments
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_audit_logs') THEN
        CREATE TRIGGER trg_prevent_delete_audit_logs
            BEFORE DELETE ON public.audit_logs
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_litigations') THEN
        CREATE TRIGGER trg_prevent_delete_litigations
            BEFORE DELETE ON public.litigations
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_settlements') THEN
        CREATE TRIGGER trg_prevent_delete_settlements
            BEFORE DELETE ON public.settlements
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_ai_outcomes') THEN
        CREATE TRIGGER trg_prevent_delete_ai_outcomes
            BEFORE DELETE ON public.ai_action_outcomes
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
END $$;

-- 2. Hardened Litigation RLS (Remove blanket is_government_user())
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'litigations' AND policyname = 'Litigations readable by authorized government and assigned contractor'
    ) THEN
        EXECUTE 'ALTER POLICY "Litigations readable by authorized government and assigned contractor" ON public.litigations USING (
            government_organization_id = public.get_current_user_organization_id() OR
            public.can_manage_project(project_id) OR
            (contractor_organization_id = public.get_current_user_organization_id() AND public.can_access_project(project_id)) OR
            (public.can_access_project(project_id) AND EXISTS (
                SELECT 1 FROM public.organization_members om
                JOIN public.organizations o ON o.id = om.organization_id
                WHERE om.user_id = auth.uid() AND om.status = ''ACTIVE'' AND o.organization_type = ''AUDITOR''
            ))
        )';
    END IF;
END $$;

-- 3. Hardened Litigation Events RLS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'litigation_events' AND policyname = 'Litigation events readable by litigation parties'
    ) THEN
        EXECUTE 'ALTER POLICY "Litigation events readable by litigation parties" ON public.litigation_events USING (
            EXISTS (
              SELECT 1 FROM public.litigations l
              WHERE l.id = litigation_events.litigation_id
                AND (
                  l.government_organization_id = public.get_current_user_organization_id() OR
                  public.can_manage_project(l.project_id) OR
                  (l.contractor_organization_id = public.get_current_user_organization_id() AND public.can_access_project(l.project_id))
                )
            )
        )';
    END IF;
END $$;

-- 4. Hardened Settlements RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'settlements' AND policyname = 'Authorized government can manage settlements'
    ) THEN
        EXECUTE 'CREATE POLICY "Authorized government can manage settlements" ON public.settlements FOR ALL TO authenticated USING (public.can_manage_project(project_id) AND public.is_government_user()) WITH CHECK (public.can_manage_project(project_id) AND public.is_government_user())';
    END IF;
END $$;
