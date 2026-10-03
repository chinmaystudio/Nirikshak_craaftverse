-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 038_notifications_audit_v2.sql
-- Domain: Universal Platform Notifications & Security Audit Logging
-- ==============================================================================

-- 1. Normalize notifications table
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS recipient_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'INFO' CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill recipient_user_id from user_id if present
UPDATE public.notifications
SET recipient_user_id = user_id
WHERE recipient_user_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(recipient_organization_id, read_at);

-- 2. Normalize audit_logs table
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS actor_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS old_value JSONB,
  ADD COLUMN IF NOT EXISTS new_value JSONB,
  ADD COLUMN IF NOT EXISTS ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON public.audit_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
