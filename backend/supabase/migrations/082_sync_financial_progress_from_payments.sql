-- Keep project budget utilization synchronized with persisted payment claims.
-- Approved claims are committed expenditure; recorded payments are actual expenditure.

CREATE OR REPLACE FUNCTION public.sync_project_financial_progress_from_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_project_id uuid;
  v_sanctioned numeric;
  v_committed numeric;
  v_paid numeric;
  v_utilized numeric;
BEGIN
  v_project_id := NEW.project_id;

  SELECT COALESCE(approved_cost_inr_crore, total_cost_inr_crore, 0)
    INTO v_sanctioned
  FROM public.projects WHERE id = v_project_id;

  SELECT COALESCE(SUM(CASE WHEN status <> 'PAID' THEN COALESCE(approved_amount, 0) ELSE 0 END), 0)
    INTO v_committed
  FROM public.payment_claims WHERE project_id = v_project_id;

  SELECT COALESCE(SUM(amount_paid), 0)
    INTO v_paid
  FROM public.payments WHERE project_id = v_project_id;

  v_utilized := v_committed + v_paid;

  UPDATE public.projects
  SET amount_spent_inr_crore = v_utilized,
      financial_progress_percent = CASE WHEN v_sanctioned > 0 THEN LEAST(100, GREATEST(0, (v_utilized / v_sanctioned) * 100)) ELSE 0 END,
      updated_at = now()
  WHERE id = v_project_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_financial_progress_from_claims ON public.payment_claims;
CREATE TRIGGER trg_sync_financial_progress_from_claims
AFTER INSERT OR UPDATE OF status, approved_amount, project_id ON public.payment_claims
FOR EACH ROW EXECUTE FUNCTION public.sync_project_financial_progress_from_payments();

DROP TRIGGER IF EXISTS trg_sync_financial_progress_from_payments ON public.payments;
CREATE TRIGGER trg_sync_financial_progress_from_payments
AFTER INSERT OR UPDATE OF amount_paid, project_id ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.sync_project_financial_progress_from_payments();

REVOKE ALL ON FUNCTION public.sync_project_financial_progress_from_payments() FROM PUBLIC;

-- Backfill every existing project once so old approved claims also appear in the dashboard.
DO $$
DECLARE r record;
DECLARE v_sanctioned numeric;
DECLARE v_committed numeric;
DECLARE v_paid numeric;
BEGIN
  FOR r IN SELECT id FROM public.projects WHERE deleted_at IS NULL LOOP
    SELECT COALESCE(approved_cost_inr_crore, total_cost_inr_crore, 0) INTO v_sanctioned FROM public.projects WHERE id = r.id;
    SELECT COALESCE(SUM(CASE WHEN status <> 'PAID' THEN COALESCE(approved_amount, 0) ELSE 0 END), 0) INTO v_committed FROM public.payment_claims WHERE project_id = r.id;
    SELECT COALESCE(SUM(amount_paid), 0) INTO v_paid FROM public.payments WHERE project_id = r.id;
    UPDATE public.projects
    SET amount_spent_inr_crore = v_committed + v_paid,
        financial_progress_percent = CASE WHEN v_sanctioned > 0 THEN LEAST(100, GREATEST(0, ((v_committed + v_paid) / v_sanctioned) * 100)) ELSE 0 END
    WHERE id = r.id;
  END LOOP;
END $$;
