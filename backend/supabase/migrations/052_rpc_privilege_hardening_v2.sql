-- ============================================================================
-- Migration: 052_rpc_privilege_hardening_v2.sql
-- Description: Revoke Public Execution on Sensitive Business RPCs & Enforce Authenticated Grants
-- ============================================================================

DO $$
BEGIN
    -- 1. Revoke Execution Privileges from PUBLIC and anon roles
    REVOKE EXECUTE ON FUNCTION public.award_contract(uuid, uuid) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.save_tender_bid(uuid, numeric, text, text) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.submit_progress_update(uuid, numeric, text, uuid) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.approve_progress_update(uuid, text, numeric, text) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.submit_payment_claim(uuid, numeric, text, text, uuid) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.review_payment_claim(uuid, text, numeric, numeric, text) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.record_payment(uuid, numeric, text, text) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon;

    -- 2. Grant strictly to authenticated users and backend service_role
    GRANT EXECUTE ON FUNCTION public.award_contract(uuid, uuid) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.save_tender_bid(uuid, numeric, text, text) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.submit_progress_update(uuid, numeric, text, uuid) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.approve_progress_update(uuid, text, numeric, text) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.submit_payment_claim(uuid, numeric, text, text, uuid) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.review_payment_claim(uuid, text, numeric, numeric, text) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.record_payment(uuid, numeric, text, text) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated, service_role;
END $$;
