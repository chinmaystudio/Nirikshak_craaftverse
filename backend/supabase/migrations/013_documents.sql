-- 013_documents.sql
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    document_date DATE,
    publisher TEXT,
    storage_path TEXT,
    external_url TEXT,
    sha256 TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES auth.users(id),
    source_id UUID REFERENCES public.sources(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
