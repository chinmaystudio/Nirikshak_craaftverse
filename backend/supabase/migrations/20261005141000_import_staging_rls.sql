-- Import payloads may contain private project data. Limit browser access to
-- batches created by the current government user; service-role maintenance
-- continues to bypass RLS without granting cross-tenant browser visibility.
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_import_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Import batches managed by gov and service role" ON public.import_batches;
DROP POLICY IF EXISTS "Import staging managed by gov and service role" ON public.project_import_staging;

CREATE POLICY import_batches_owner ON public.import_batches
  FOR ALL TO authenticated
  USING (
    public.is_government_user()
    AND created_by = (SELECT auth.uid())
  )
  WITH CHECK (
    public.is_government_user()
    AND created_by = (SELECT auth.uid())
  );

CREATE POLICY project_import_staging_batch_owner ON public.project_import_staging
  FOR ALL TO authenticated
  USING (
    public.is_government_user()
    AND EXISTS (
      SELECT 1 FROM public.import_batches b
      WHERE b.id = project_import_staging.batch_id
        AND b.created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    public.is_government_user()
    AND EXISTS (
      SELECT 1 FROM public.import_batches b
      WHERE b.id = project_import_staging.batch_id
        AND b.created_by = (SELECT auth.uid())
    )
  );
