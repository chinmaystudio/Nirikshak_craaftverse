# NIRIKSHAK Database V2 RPC Reference

This reference documents the canonical `SECURITY DEFINER` Remote Procedure Calls (RPCs) implemented in NIRIKSHAK Database V2.

All functions enforce:
`SET search_path = public, pg_temp`
and validate caller identity through `auth.uid()`, strictly rejecting client-supplied user IDs or spoofed organization parameters.

---

## 1. Procurement & Contract Award

### `save_tender_bid`
- **Signature**:
  ```sql
  save_tender_bid(
      p_tender_id UUID,
      p_bid_amount NUMERIC,
      p_technical_proposal TEXT,
      p_status TEXT DEFAULT 'SUBMITTED'
  ) RETURNS SETOF tender_bids
  ```
- **Authorized Callers**: Active members of active Contractor organizations.
- **Behavior**:
  - Derives `contractor_organization_id` via `auth.uid()`.
  - Generates authoritative unique `bid_reference` (`BID-<YEAR>-<RANDOM>`).
  - Upserts bid record.
  - Broadcasts Realtime notification on submission.

### `award_contract`
- **Signature**:
  ```sql
  award_contract(
      p_tender_id UUID,
      p_selected_bid_id UUID
  ) RETURNS JSONB
  ```
- **Authorized Callers**: Government Admins and Project Officers owning the tender's government organization.
- **Atomic Operations**:
  1. Validates tender is in `PUBLISHED` or `UNDER_EVALUATION` state.
  2. Confirms `p_selected_bid_id` belongs to `p_tender_id`.
  3. Updates selected bid status to `SELECTED`.
  4. Updates all other valid bids for this tender to `REJECTED`.
  5. Updates tender status to `AWARDED`.
  6. Creates official binding record in `contracts`.
  7. Inserts/updates `project_organizations` linking awarded contractor to project as `CONTRACTOR`.
  8. Updates `projects.normalized_status = 'AWARDED'`.
  9. Emits audit log and notifications.

---

## 2. Progress Lifecycle RPCs

### `submit_progress_update`
- **Signature**:
  ```sql
  submit_progress_update(
      p_project_id UUID,
      p_reported_progress NUMERIC,
      p_description TEXT,
      p_milestone_id UUID DEFAULT NULL
  ) RETURNS SETOF progress_updates
  ```
- **Authorized Callers**: Assigned contractor organization engineers.
- **Constraints**:
  - `p_reported_progress` must be between `0.0` and `100.0`.
  - Sets `verification_status = 'SUBMITTED'`.
  - Caller cannot set `verified_progress` or mark status as `APPROVED`.

### `approve_progress_update`
- **Signature**:
  ```sql
  approve_progress_update(
      p_update_id UUID,
      p_decision TEXT,
      p_verified_progress NUMERIC DEFAULT NULL,
      p_review_notes TEXT DEFAULT NULL
  ) RETURNS JSONB
  ```
- **Authorized Callers**: Government engineers owning the project organization.
- **Atomic Operations**:
  1. Validates decision is `APPROVED`, `REJECTED`, or `CLARIFICATION_REQUIRED`.
  2. Sets `reviewed_by = auth.uid()`, `reviewed_at = NOW()`.
  3. If `APPROVED`:
     - Updates `progress_updates.verified_progress = p_verified_progress`.
     - Updates parent `projects.physical_progress_percent = p_verified_progress`.
     - Sets `projects.current_status_verified = true`.
  4. Records `PROGRESS_APPROVED` in `audit_logs`.
  5. Triggers post-commit asynchronous AI snapshot learning hook.

---

## 3. Financial & Payment Claim RPCs

### `submit_payment_claim`
- **Signature**:
  ```sql
  submit_payment_claim(
      p_project_id UUID,
      p_contract_id UUID,
      p_claim_number TEXT,
      p_claim_type TEXT,
      p_claimed_amount NUMERIC,
      p_milestone_id UUID DEFAULT NULL,
      p_description TEXT DEFAULT NULL
  ) RETURNS JSONB
  ```
- **Authorized Callers**: Contractor organization holding active contract.
- **Behavior**:
  - Validates active contract association and positive claim amount.
  - Inserts claim with status `SUBMITTED`.

### `review_payment_claim`
- **Signature**:
  ```sql
  review_payment_claim(
      p_claim_id UUID,
      p_decision TEXT,
      p_verified_amount NUMERIC DEFAULT NULL,
      p_approved_amount NUMERIC DEFAULT NULL,
      p_review_notes TEXT DEFAULT NULL
  ) RETURNS JSONB
  ```
- **Authorized Callers**: Government Finance Officers / Executive Engineers.
- **Constraints**:
  - Validates decision (`VERIFIED`, `APPROVED`, `REJECTED`, `CLARIFICATION_REQUIRED`).
  - Sets certified verified/approved amounts.
  - Disallows contractor invocation.

### `record_payment`
- **Signature**:
  ```sql
  record_payment(
      p_payment_claim_id UUID,
      p_amount_paid NUMERIC,
      p_payment_reference TEXT,
      p_payment_method TEXT DEFAULT 'NEFT_RTGS'
  ) RETURNS JSONB
  ```
- **Authorized Callers**: Government Accounts / Treasury Officers.
- **Behavior**:
  - Verifies claim is in `APPROVED` status.
  - Inserts transaction record in `payments`.
  - Transitions claim status to `PAID`.
  - Disallows modifying paid records.

---

## 4. Notifications & Utilities

### `mark_notification_read`
- **Signature**:
  ```sql
  mark_notification_read(p_notification_id UUID) RETURNS BOOLEAN
  ```
- **Authorized Callers**: Recipient user.
- **Behavior**: Sets `read_at = NOW()` if `recipient_user_id = auth.uid()`.
