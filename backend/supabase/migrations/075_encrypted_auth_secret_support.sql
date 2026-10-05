-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 075_encrypted_auth_secret_support.sql
-- Domain: Authenticated Encryption at Rest for Session & MFA Secrets
-- Purpose:
--   1. Add AES-256-GCM ciphertext, IV, and auth tag fields for gateway_sessions.
--   2. Safely deprecate plaintext supabase_access_token and supabase_refresh_token.
--   3. Add AES-256-GCM ciphertext, IV, and auth tag fields for user_mfa_factors.
--   4. Safely deprecate plaintext secret in user_mfa_factors.
--   5. Add last_used_time_step to user_mfa_factors for TOTP replay prevention.
-- ==============================================================================

-- 1. Extend gateway_sessions with AES-256-GCM authenticated encryption fields
ALTER TABLE public.gateway_sessions
  ADD COLUMN IF NOT EXISTS supabase_access_token_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS supabase_access_token_iv TEXT,
  ADD COLUMN IF NOT EXISTS supabase_access_token_tag TEXT,
  ADD COLUMN IF NOT EXISTS supabase_refresh_token_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS supabase_refresh_token_iv TEXT,
  ADD COLUMN IF NOT EXISTS supabase_refresh_token_tag TEXT,
  ADD COLUMN IF NOT EXISTS encryption_key_version INTEGER DEFAULT 1;

-- 2. Clear any lingering plaintext token values in gateway_sessions
UPDATE public.gateway_sessions
SET 
  supabase_access_token = NULL,
  supabase_refresh_token = NULL;

-- 3. Extend user_mfa_factors with AES-256-GCM authenticated encryption fields & replay counter
ALTER TABLE public.user_mfa_factors
  ADD COLUMN IF NOT EXISTS secret_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS secret_iv TEXT,
  ADD COLUMN IF NOT EXISTS secret_auth_tag TEXT,
  ADD COLUMN IF NOT EXISTS key_version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_used_time_step BIGINT DEFAULT 0;

-- 4. Allow secret column to be nullable so only encrypted columns are populated going forward
ALTER TABLE public.user_mfa_factors
  ALTER COLUMN secret DROP NOT NULL;

-- 5. Clear any legacy plaintext secrets
UPDATE public.user_mfa_factors
SET secret = NULL;
