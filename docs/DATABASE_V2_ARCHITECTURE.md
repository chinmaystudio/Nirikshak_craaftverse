# NIRIKSHAK Database V2 Architecture

## 1. Executive Summary & Design Principles

NIRIKSHAK Database V2 establishes Supabase PostgreSQL as the authoritative single source of truth for the entire infrastructure project lifecycle:
**Government Registration → Project Creation → Tender Publication → Contractor Bidding → Contract Award → Execution & Milestones → Progress Reports → Government Verification → Resources & Workforce → Financial & Payment Claims → Inspections → Environmental Compliance → Citizen Grievances → Litigation & Settlement → AI Decision-Support → Continuous Learning → Project Completion & Public Transparency.**

### Foundational Principles:
1. **Authoritative Backend**: Supabase PostgreSQL is the sole source of truth. Frontend React state is ephemeral UI presentation and never authoritative.
2. **Reported vs. Verified Segregation**: Contractor-submitted information (`reported_progress`, claimed payment amounts, contractor resource usage) remains strictly distinguished from Government-verified facts (`verified_progress`, approved claim amounts, certified physical progress).
3. **Multi-Tenant Government & Contractor Isolation**:
   - Government users cannot access or tamper with projects belonging to other Government organizations unless granted global administrative or audit authority.
   - Contractors cannot access competitor bids, private pricing proposals, or unassigned projects.
   - Citizens see only sanitized, approved, public information via dedicated views.
4. **Separation of Powers & Role Enforcement**:
   - Contractors cannot approve their own progress, certify inspections, or approve their own payment claims.
   - Government approvals and contract awards execute exclusively via atomic, audited `SECURITY DEFINER` functions with `search_path = public, pg_temp`.
5. **AI Advisory Role & Privacy**:
   - AI recommendations provide decision support; AI cannot execute state transitions, approve claims, or modify official progress directly.
   - Sensitive PII (citizen Aadhaar, PAN, contact numbers) and confidential pricing are masked before AI analysis.
   - Unknown values remain `NULL` (never fabricated zero).
6. **Data Integrity & Immutability**:
   - All legacy migrations `001` through `028` are strictly immutable production history.
   - All Database V2 enhancements begin at `029` through `046`.
   - Soft deletions (`deleted_at`) protect auditability for high-impact contracts, projects, and tenders.

---

## 2. Multi-Domain Entity Relationship Overview

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ PROFILES : employs
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : contains
    ORGANIZATIONS ||--o{ PROJECTS : owns_or_executes
    PROJECTS ||--o{ PROJECT_ORGANIZATIONS : relates
    PROJECTS ||--o{ TENDERS : issues
    TENDERS ||--o{ TENDER_BIDS : receives
    TENDERS ||--o{ TENDER_DOCUMENTS : attaches
    TENDER_BIDS ||--o{ BID_DOCUMENTS : attaches
    TENDERS ||--o| CONTRACTS : awards
    PROJECTS ||--o{ CONTRACTS : executes
    CONTRACTS ||--o{ PROJECT_MILESTONES : defines
    PROJECT_MILESTONES ||--o{ PROGRESS_UPDATES : tracks
    PROGRESS_UPDATES ||--o{ PROGRESS_EVIDENCE : documents
    PROJECTS ||--o{ DELAY_EVENTS : encounters
    PROJECTS ||--o{ PROJECT_RESOURCE_ALLOCATIONS : allocates
    PROJECT_RESOURCE_ALLOCATIONS ||--o{ RESOURCE_USAGE_UPDATES : reports
    PROJECTS ||--o{ PROJECT_WORKFORCE_UPDATES : logs_aggregate
    PROJECTS ||--o{ PROJECT_BUDGET_HEADS : allocates_budget
    PROJECTS ||--o{ FINANCIAL_UPDATES : tracks_expenditure
    CONTRACTS ||--o{ PAYMENT_CLAIMS : claims
    PAYMENT_CLAIMS ||--o{ PAYMENTS : disburses
    PROJECTS ||--o{ INSPECTIONS : inspects
    INSPECTIONS ||--o{ INSPECTION_FINDINGS : discovers
    PROJECTS ||--o{ PROJECT_DOCUMENTS : catalogs
    PROJECTS ||--o{ ENVIRONMENTAL_CLEARANCES : complies
    PROJECTS ||--o{ ENVIRONMENTAL_OBSERVATIONS : monitors
    PROJECTS ||--o{ COMPLAINTS : receives_citizen_grievance
    COMPLAINTS ||--o{ COMPLAINT_UPDATES : resolves
    PROJECTS ||--o{ LITIGATIONS : disputes
    LITIGATIONS ||--o{ LITIGATION_EVENTS : records_hearing
    LITIGATIONS ||--o{ SETTLEMENTS : settles
    PROJECTS ||--o{ AI_ANALYSIS_RUNS : evaluates
    AI_ANALYSIS_RUNS ||--o{ AI_RECOMMENDED_ACTIONS : advises
    AI_RECOMMENDED_ACTIONS ||--o{ AI_RECOMMENDATION_FEEDBACK : evaluates_human
    AI_RECOMMENDED_ACTIONS ||--o{ AI_ACTION_OUTCOMES : verifies_outcome
```

---

## 3. High-Traffic & Performance Strategy
- **Index Layer**: Composite indexes on `(government_organization_id, normalized_status)`, `(project_id, verification_status)`, `(project_id, created_at DESC)`, and `(recipient_user_id, read_at)` ensure sub-millisecond lookups on primary dashboards.
- **Controlled Realtime**: Publication to `supabase_realtime` is enabled strictly on actionable notification and workflow entities (`notifications`, `progress_updates`, `payment_claims`, `complaint_updates`, `tenders`, `projects`), protected by database RLS.
