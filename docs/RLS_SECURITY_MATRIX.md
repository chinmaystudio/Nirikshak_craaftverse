# NIRIKSHAK Craftverse — Row Level Security (RLS) Policy Matrix

**Document Version:** 3.0.0  
**Effective Date:** 2026-10-03  
**Classification:** Database Architecture & Cryptographic Governance  
**Status:** **AUTHORITATIVE SPECIFICATION**

---

## 1. RLS Architecture & Elimination of Global Role Bypasses

Under migrations `057_strict_tenant_rls_final.sql` and `058_platform_and_auditor_scope.sql`, NIRIKSHAK Craftverse eliminated broad role bypasses (`is_government_user()`, `is_auditor()`) across all project-scoped operational tables. 

Access is now governed by deterministic PostgreSQL security functions that evaluate:
1. Direct project membership (`project_members`).
2. Department management jurisdiction (`projects.department_id = profiles.department_id`).
3. Awarded contractor organization (`contracts.contractor_org_id = user_organization_id()`).
4. Formal auditor project assignments (`auditor_project_assignments.project_id`).
5. Institutional platform privileges (`platform_privileges.privilege IN ('PLATFORM_ADMIN', 'NATIONAL_AUDITOR')`).

---

## 2. PostgreSQL Security Functions Reference

| Function Signature | Return Type | Security Context | Purpose & Rules |
| :--- | :--- | :--- | :--- |
| `can_access_project(p_project_id UUID)` | `BOOLEAN` | `SECURITY DEFINER` | Returns `true` if caller is assigned to project, manages project department, is awarded contractor, holds active auditor assignment, or has `PLATFORM_ADMIN`/`NATIONAL_AUDITOR`. |
| `can_manage_project(p_project_id UUID)` | `BOOLEAN` | `SECURITY DEFINER` | Returns `true` if caller is government official in the project's department, project manager, or holds `PLATFORM_ADMIN`. Contractors & auditors return `false`. |
| `can_audit_project(p_project_id UUID)` | `BOOLEAN` | `SECURITY DEFINER` | Returns `true` if caller has active record in `auditor_project_assignments` or has `NATIONAL_AUDITOR` privilege. |
| `has_platform_privilege(p_privilege TEXT)` | `BOOLEAN` | `SECURITY DEFINER` | Returns `true` if user has active, unexpired grant in `platform_privileges` table. |
| `can_access_document(p_document_id UUID)` | `BOOLEAN` | `SECURITY DEFINER` | Validates document-specific project link and public/private classification. |
| `can_manage_payment_claim(p_claim_id UUID)` | `BOOLEAN` | `SECURITY DEFINER` | Verifies government finance review authority over claim's associated project. |
| `can_manage_litigation(p_case_id UUID)` | `BOOLEAN` | `SECURITY DEFINER` | Restricts legal disputes to authorized legal officers and appointed arbiters. |

---

## 3. Comprehensive Table RLS Policy Matrix

| Table Name | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
| :--- | :--- | :--- | :--- | :--- |
| `projects` | Public if `published`; else `can_access_project(id)` | Government officials with department authority | `can_manage_project(id)` | **PROHIBITED** (Soft-delete only via `is_deleted`) |
| `project_members` | `can_access_project(project_id)` | `can_manage_project(project_id)` | `can_manage_project(project_id)` | `can_manage_project(project_id)` |
| `auditor_project_assignments` | `can_access_project(project_id)` | `has_platform_privilege('SECURITY_ADMIN')` or Gov Admin | `has_platform_privilege('SECURITY_ADMIN')` | `has_platform_privilege('SECURITY_ADMIN')` |
| `platform_privileges` | Self read or `SECURITY_ADMIN` | Service-role or `SECURITY_ADMIN` | Service-role or `SECURITY_ADMIN` | Service-role or `SECURITY_ADMIN` |
| `tenders` | Public if `PUBLISHED`; else `can_access_project(project_id)` | `can_manage_project(project_id)` | `can_manage_project(project_id)` | **PROHIBITED** |
| `tender_bids` | Contractor sees **own bids only**; Gov sees all **after bid opening** | Contractor for open tenders | Contractor before deadline | **PROHIBITED** |
| `contracts` | `can_access_project(project_id)` | `can_manage_project(project_id)` | `can_manage_project(project_id)` | **PROHIBITED** |
| `milestones` | `can_access_project(project_id)` | `can_manage_project(project_id)` | `can_manage_project(project_id)` | **PROHIBITED** |
| `milestone_progress_reports` | `can_access_project(project_id)` | Contractor assigned to contract | Contractor before verification | **PROHIBITED** |
| `inspections` | `can_access_project(project_id)` | Assigned Inspector or Gov Officer | Assigned Inspector before finalization | **PROHIBITED** |
| `inspection_findings` | `can_access_project(project_id)` | Assigned Inspector or Gov Officer | `can_manage_project(project_id)` | **PROHIBITED** |
| `project_documents` | `can_access_project(project_id)` (or public docs) | `can_access_project(project_id)` | `can_manage_project(project_id)` or uploader | **PROHIBITED** |
| `payment_claims` | `can_access_project(project_id)` | Contractor awarded contract | `can_manage_payment_claim(id)` | **PROHIBITED** |
| `payments` | `can_access_project(project_id)` | Gov Finance Officer (`can_manage_project`) | Gov Finance Officer | **PROHIBITED** |
| `litigation_cases` | `can_manage_litigation(id)` | Legal Officer or Gov Admin | `can_manage_litigation(id)` | **PROHIBITED** |
| `settlements` | `can_manage_litigation(case_id)` | Legal Officer or Gov Admin | `can_manage_litigation(case_id)` | **PROHIBITED** |
| `environmental_monitoring` | `can_access_project(project_id)` | Environmental Officer or Gov | `can_manage_project(project_id)` | **PROHIBITED** |
| `ai_analysis_runs` | `can_review_ai_analysis(project_id)` | Service Role / Backend Gateway | Service Role / Backend Gateway | **PROHIBITED** |
| `blockchain_anchors` | `can_access_project(project_id)` | Service Role / Blockchain Worker | **IMMUTABLE** (No updates allowed) | **IMMUTABLE** (No deletes allowed) |
| `blockchain_anchor_outbox` | Service Role Only | Trigger `enqueue_blockchain_anchor()` or Service Role | Service Role / Blockchain Worker | Service Role (Purged upon ledger finalization) |
| `gateway_sessions` | User sees own session; Service Role | Service Role / Auth Controller | Service Role / Auth Controller | Service Role / Logout Controller |
| `mfa_challenges` | Service Role Only | Service Role Only | Service Role Only | Service Role Only |

---

## 4. RLS Verification Queries

To independently audit that zero tables remain unprotected in production:
```sql
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false;
```
*Expected Result:* 0 rows returned. (100% of tables have rowsecurity enabled).

To verify that no function has unauthenticated public execution privilege:
```sql
SELECT 
    proname, 
    prosecdef 
FROM pg_proc 
JOIN pg_namespace n ON n.oid = pg_proc.pronamespace 
WHERE n.nspname = 'public' 
  AND prosecdef = true 
  AND has_function_privilege('anon', pg_proc.oid, 'EXECUTE');
```
*Expected Result:* 0 rows returned.
