-- 016_audit.sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    actor_organization_id UUID REFERENCES public.organizations(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
