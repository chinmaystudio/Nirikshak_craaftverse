-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 067_blockchain_rpc_lockdown.sql
-- Domain: RPC Access Lockdown & Zero-Trust Function Authorization
-- Purpose:
--   1. Revoke public/authenticated execution of enqueue_blockchain_anchor
--   2. Restrict low-level blockchain anchor manufacturing strictly to service_role
--   3. Audit and enforce search_path and grant isolation on core RPC functions
-- ==============================================================================

-- 1. Lockdown enqueue_blockchain_anchor
REVOKE ALL ON FUNCTION public.enqueue_blockchain_anchor(UUID, TEXT, UUID, TEXT, TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enqueue_blockchain_anchor(UUID, TEXT, UUID, TEXT, TEXT, TEXT, JSONB, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.enqueue_blockchain_anchor(UUID, TEXT, UUID, TEXT, TEXT, TEXT, JSONB, TEXT) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_blockchain_anchor(UUID, TEXT, UUID, TEXT, TEXT, TEXT, JSONB, TEXT) TO service_role;

-- 2. Lockdown internal trigger functions so they cannot be called directly via RPC
REVOKE ALL ON FUNCTION public.trg_anchor_payment_recorded() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_anchor_payment_recorded() FROM anon;
REVOKE ALL ON FUNCTION public.trg_anchor_payment_recorded() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.trg_anchor_payment_recorded() TO service_role;

REVOKE ALL ON FUNCTION public.trg_anchor_contract_awarded() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_anchor_contract_awarded() FROM anon;
REVOKE ALL ON FUNCTION public.trg_anchor_contract_awarded() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.trg_anchor_contract_awarded() TO service_role;
