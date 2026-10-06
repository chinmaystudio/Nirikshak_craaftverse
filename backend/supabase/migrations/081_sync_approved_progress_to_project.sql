-- Keep the official project register synchronized when a report is approved.
-- This covers contractor submissions that do not reference a milestone.
CREATE OR REPLACE FUNCTION public.sync_approved_progress_to_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.verification_status = 'APPROVED'
     AND NEW.verified_progress IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.verification_status IS DISTINCT FROM NEW.verification_status
          OR OLD.verified_progress IS DISTINCT FROM NEW.verified_progress) THEN
    UPDATE public.projects
    SET physical_progress_percent = NEW.verified_progress,
        current_status_verified = true,
        normalized_status = CASE
          WHEN normalized_status IN ('PROPOSED', 'DPR_STAGE', 'APPROVED', 'TENDERED', 'UNKNOWN')
            THEN 'UNDER_CONSTRUCTION'::project_status
          ELSE normalized_status
        END,
        updated_at = now()
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_approved_progress_to_project ON public.progress_updates;
CREATE TRIGGER trg_sync_approved_progress_to_project
AFTER INSERT OR UPDATE OF verification_status, verified_progress ON public.progress_updates
FOR EACH ROW
EXECUTE FUNCTION public.sync_approved_progress_to_project();

REVOKE ALL ON FUNCTION public.sync_approved_progress_to_project() FROM PUBLIC;
