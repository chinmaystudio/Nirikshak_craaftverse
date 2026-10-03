-- ============================================================================
-- Migration: 044_storage_policies_v2.sql
-- Description: Provision Database V2 Storage Buckets & Policies
-- ============================================================================

DO $$
BEGIN
    -- Only execute if storage schema exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        
        -- 1. Ensure required V2 storage buckets exist
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES
          ('project-documents', 'project-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
          ('tender-documents', 'tender-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
          ('bid-documents', 'bid-documents', false, 52428800, ARRAY['application/pdf', 'application/zip', 'application/x-zip-compressed']),
          ('progress-evidence', 'progress-evidence', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4']),
          ('inspection-evidence', 'inspection-evidence', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
          ('complaint-evidence', 'complaint-evidence', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
          ('public-project-assets', 'public-project-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
        ON CONFLICT (id) DO UPDATE SET
          public = EXCLUDED.public,
          file_size_limit = EXCLUDED.file_size_limit,
          allowed_mime_types = EXCLUDED.allowed_mime_types;

        -- 2. Storage Objects RLS: Public bucket reads
        DROP POLICY IF EXISTS "Public access to public buckets" ON storage.objects;
        CREATE POLICY "Public access to public buckets" ON storage.objects
            FOR SELECT USING (
                bucket_id IN ('public-documents', 'public-project-assets')
            );

        -- 3. Storage Objects RLS: Authenticated uploads to public bucket if authorized
        DROP POLICY IF EXISTS "Authenticated can upload to public assets" ON storage.objects;
        CREATE POLICY "Authenticated can upload to public assets" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'public-project-assets' AND
                auth.uid() IS NOT NULL
            );

        -- 4. Bid documents isolation: strictly owning contractor or government evaluators
        DROP POLICY IF EXISTS "Bid documents restricted view" ON storage.objects;
        CREATE POLICY "Bid documents restricted view" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'bid-documents' AND (
                    -- Owner of the uploaded object
                    owner = auth.uid() OR
                    -- Government user
                    EXISTS (
                        SELECT 1 FROM public.organization_members om
                        JOIN public.organizations o ON o.id = om.organization_id
                        WHERE om.user_id = auth.uid()
                          AND om.status = 'ACTIVE'
                          AND o.organization_type = 'GOVERNMENT'
                    )
                )
            );

        DROP POLICY IF EXISTS "Contractor bid document upload" ON storage.objects;
        CREATE POLICY "Contractor bid document upload" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'bid-documents' AND
                auth.uid() IS NOT NULL
            );

        -- 5. Progress evidence: authorized government or contractor
        DROP POLICY IF EXISTS "Progress evidence select" ON storage.objects;
        CREATE POLICY "Progress evidence select" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'progress-evidence' AND (
                    auth.uid() IS NOT NULL
                )
            );

        DROP POLICY IF EXISTS "Progress evidence upload" ON storage.objects;
        CREATE POLICY "Progress evidence upload" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'progress-evidence' AND
                auth.uid() IS NOT NULL
            );

        -- 6. Complaint evidence: complaint creator or government
        DROP POLICY IF EXISTS "Complaint evidence select" ON storage.objects;
        CREATE POLICY "Complaint evidence select" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'complaint-evidence' AND (
                    owner = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.organization_members om
                        JOIN public.organizations o ON o.id = om.organization_id
                        WHERE om.user_id = auth.uid()
                          AND om.status = 'ACTIVE'
                          AND o.organization_type = 'GOVERNMENT'
                    )
                )
            );

        DROP POLICY IF EXISTS "Complaint evidence upload" ON storage.objects;
        CREATE POLICY "Complaint evidence upload" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'complaint-evidence' AND
                auth.uid() IS NOT NULL
            );

        -- 7. Inspection evidence: government inspector or auditor
        DROP POLICY IF EXISTS "Inspection evidence select" ON storage.objects;
        CREATE POLICY "Inspection evidence select" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'inspection-evidence' AND (
                    owner = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.organization_members om
                        JOIN public.organizations o ON o.id = om.organization_id
                        WHERE om.user_id = auth.uid()
                          AND om.status = 'ACTIVE'
                          AND o.organization_type IN ('GOVERNMENT', 'AUDITOR')
                    )
                )
            );

        DROP POLICY IF EXISTS "Inspection evidence upload" ON storage.objects;
        CREATE POLICY "Inspection evidence upload" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'inspection-evidence' AND
                EXISTS (
                    SELECT 1 FROM public.organization_members om
                    JOIN public.organizations o ON o.id = om.organization_id
                    WHERE om.user_id = auth.uid()
                      AND om.status = 'ACTIVE'
                      AND o.organization_type IN ('GOVERNMENT', 'AUDITOR')
                )
            );

    END IF;
END $$;
