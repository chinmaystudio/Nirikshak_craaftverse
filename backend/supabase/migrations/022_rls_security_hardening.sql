-- 022_rls_security_hardening.sql
-- Restricts ai_jobs and progress_updates RLS to prevent unauthorized reading or tampering.

-- 1. Tighten ai_jobs permissions
REVOKE ALL ON public.ai_jobs FROM anon;
GRANT SELECT ON public.ai_jobs TO authenticated;

-- 2. Restrict progress_updates updates strictly to Government reviewers
DROP POLICY IF EXISTS "Government update progress" ON public.progress_updates;
DROP POLICY IF EXISTS "Contractor update progress" ON public.progress_updates;

CREATE POLICY "Government update progress" ON public.progress_updates
    FOR UPDATE TO authenticated
    USING (public.is_government_user())
    WITH CHECK (public.is_government_user());

-- Ensure anon has no update permissions
REVOKE UPDATE, DELETE ON public.progress_updates FROM anon;
