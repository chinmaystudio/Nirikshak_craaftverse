# NIRIKSHAK Database V2 Data Flow Architecture

This document maps the complete operational data flows across the infrastructure project lifecycle.

---

## 1. Project Registration & Procurement Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor GovAdmin as Government Admin
    actor Contractor as Contractor Admin
    participant Supabase as Supabase DB
    participant Express as Express Backend
    participant Storage as Supabase Storage

    Note over GovAdmin, Supabase: 1. Registration & Project Creation
    GovAdmin->>Supabase: Create Project (PROPOSED -> APPROVED)
    GovAdmin->>Supabase: Publish Tender (Tenders table, status='PUBLISHED')
    GovAdmin->>Storage: Upload Tender Specs (bucket: tender-documents)

    Note over Contractor, Supabase: 2. Bidding Process
    Contractor->>Supabase: Read Published Tenders (tender_catalog_view)
    Contractor->>Storage: Upload Bid Proposal (bucket: bid-documents)
    Contractor->>Supabase: RPC save_tender_bid() [Auth: Contractor Org derived]
    Supabase-->>Contractor: Return Authoritative bid_reference

    Note over GovAdmin, Supabase: 3. Evaluation & Contract Award
    GovAdmin->>Supabase: Review Bids (Competitor private bids isolated)
    GovAdmin->>Supabase: RPC award_contract(tender_id, selected_bid_id)
    Note over Supabase: Atomic Transaction: <br/>- Selected bid -> SELECTED<br/>- Other bids -> REJECTED<br/>- Tender -> AWARDED<br/>- Project -> AWARDED<br/>- Contract created & Project Org linked
```

---

## 2. Execution, Progress & AI Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor Contractor as Contractor
    actor GovEng as Government Engineer
    participant Supabase as Supabase DB
    participant Express as Express Backend
    participant PythonAI as Python AI Service
    participant OpenRouter as OpenRouter / Nemotron

    Note over Contractor, Supabase: 1. Contractor Progress Submission
    Contractor->>Storage: Upload Evidence (progress-evidence bucket)
    Contractor->>Supabase: RPC submit_progress_update()
    Note over Supabase: Inserts progress_updates (status='SUBMITTED', reported_progress=X)

    Note over GovEng, Supabase: 2. Government Verification
    GovEng->>Supabase: Conduct Site Inspection / Measurement Book audit
    GovEng->>Supabase: RPC approve_progress_update(update_id, verified_progress=Y, decision='APPROVED')
    Note over Supabase: - updates progress_updates (verification_status='APPROVED')<br/>- updates projects.physical_progress_percent = Y<br/>- sets current_status_verified = true<br/>- writes audit_logs

    Note over Express, PythonAI: 3. Post-Verification AI Learning
    Express->>Supabase: Read verified project snapshot
    Express->>PythonAI: POST /learn/snapshot (verified_progress=Y)
    Note over PythonAI: Online drift detector updates running statistics
```

---

## 3. Financial Monitoring, Payment Claims & Disbursements

```mermaid
sequenceDiagram
    autonumber
    actor Contractor as Contractor
    actor GovFin as Government Finance Officer
    participant Supabase as Supabase DB
    participant Audit as Audit Log

    Contractor->>Supabase: RPC submit_payment_claim(claimed_amount=C, milestone_id)
    Note over Supabase: Inserts payment_claims (status='SUBMITTED')
    
    GovFin->>Supabase: RPC review_payment_claim(claim_id, verified_amount=V, decision='APPROVED')
    Note over Supabase: Sets approved_amount=V, status='APPROVED'

    GovFin->>Supabase: RPC record_payment(claim_id, amount_paid=V, payment_reference)
    Note over Supabase: Sets claim status='PAID', records into payments table
    Supabase->>Audit: Write PAYMENT_APPROVED audit entry
```

---

## 4. Reinforcement Learning Advisory & Outcome Loop

```mermaid
sequenceDiagram
    autonumber
    actor GovUser as Government Official
    participant Express as Express Backend
    participant Supabase as Supabase DB
    participant PythonAI as Python AI Service
    participant LinUCB as LinUCB Policy

    Note over GovUser, PythonAI: 1. AI Decision Support
    GovUser->>Express: Request Project AI Analysis
    Express->>Supabase: Build Sanitized Context (honest NULLs, zero fake zeroes)
    Express->>PythonAI: POST /analyze
    PythonAI->>LinUCB: Rank recommended interventions
    PythonAI-->>Express: Return Anomaly Scores & Recommended Actions
    Express->>Supabase: Persist into ai_analysis_runs & ai_recommended_actions
    Express-->>GovUser: Display Risk Bands & Interventions

    Note over GovUser, PythonAI: 2. Government Feedback (Human Judgment)
    GovUser->>Express: Submit Action Feedback (USEFUL / ACCEPTED / HARMFUL)
    Express->>Supabase: Persist into ai_recommendation_feedback
    Express->>PythonAI: POST /feedback
    Note over PythonAI: Stores human feedback in SQLite; DOES NOT finalize policy

    Note over GovUser, LinUCB: 3. Downstream Verified Outcome (Final Learning)
    GovUser->>Supabase: Record subsequent Verified Progress & Milestone clearance
    Express->>PythonAI: POST /learn/outcome (baseline vs verified outcome delta)
    PythonAI->>LinUCB: policy.update(context, action, reward) [ONCE per outcome]
    Express->>Supabase: Persist into ai_action_outcomes
```
