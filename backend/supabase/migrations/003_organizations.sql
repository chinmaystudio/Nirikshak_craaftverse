-- 003_organizations.sql
DO $$ BEGIN
    CREATE TYPE public.org_type_enum AS ENUM (
        'government', 'contractor', 'consultant', 'PSU', 'ULB', 'authority', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.app_role_enum AS ENUM (
        'citizen',
        'government_admin',
        'project_officer',
        'government_engineer',
        'chief_engineer',
        'auditor',
        'contractor_admin',
        'contractor_manager',
        'contractor_site_engineer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type public.org_type_enum NOT NULL DEFAULT 'other',
    parent_id UUID REFERENCES public.organizations(id),
    registration_number TEXT,
    department TEXT,
    state TEXT,
    district TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role_enum NOT NULL DEFAULT 'citizen',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);
