-- ============================================================================
-- Migration: 050_legal_rls_hardening_v2.sql
-- Description: Project Boundary Litigation Security & Settlement Authority Hardening
-- ============================================================================

-- 1. Ensure litigation writes require can_manage_project and authorized role
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'litigations' AND policyname = 'Authorized government officers can manage litigation'
    ) THEN
        EXECUTE 'ALTER POLICY "Authorized government officers can manage litigation" ON public.litigations 
        USING (
            public.can_manage_project(project_id) AND 
            public.is_government_user()
        )
        WITH CHECK (
            public.can_manage_project(project_id) AND 
            public.is_government_user()
        )';
    END IF;
END $$;

-- 2. Settlement Creation and Approvals Restricted to Government Managing Project
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'settlements' AND policyname = 'Authorized government can manage settlements'
    ) THEN
        EXECUTE 'ALTER POLICY "Authorized government can manage settlements" ON public.settlements 
        USING (
            public.can_manage_project(project_id) AND 
            public.is_government_user()
        )
        WITH CHECK (
            public.can_manage_project(project_id) AND 
            public.is_government_user()
        )';
    END IF;
END $$;
