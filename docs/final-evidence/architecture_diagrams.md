# NIRIKSHAK PLATFORM — SYSTEM ARCHITECTURE DIAGRAMS
**Format**: Edit-ready GitHub Flavored Mermaid Diagrams  
**Version**: 1.0.0  

---

## 1. Overall System Architecture

```mermaid
graph TD
    subgraph ClientLayer["Multi-Portal Client Layer"]
        GOV["Government Portal<br/>(/government)"]
        CON["Contractor Portal<br/>(/contractor)"]
        CIT["Citizen Portal<br/>(/user, /)"]
    end

    subgraph SecurityBoundary["Security & Routing Boundary"]
        SPA["Vercel SPA Router<br/>(Portal Scoped Wrappers)"]
        AUTH["Supabase Auth Engine<br/>(JWT + RoleGuard)"]
    end

    subgraph DataLayer["Supabase PostgreSQL 15+ Core"]
        DB[(Authoritative Database)]
        RLS["Row Level Security Policies<br/>(Tenancy & Role Enforcement)"]
        RPC["Atomic Stored Procedures<br/>(award_contract, submit_progress)"]
        RT["Realtime Broadcast Hub<br/>(supabase_realtime)"]
    end

    subgraph IntelligenceLayer["Asynchronous AI & External Ingestion"]
        QUEUE["ai_jobs Queue"]
        SAN["PII Sanitizer & Context Builder"]
        OPENROUTER["OpenRouter API Gateway"]
        NEMOTRON["NVIDIA Nemotron-3 Super 120B"]
        INSIGHTS["ai_insights"]
    end

    GOV --> SPA
    CON --> SPA
    CIT --> SPA
    SPA --> AUTH
    AUTH --> RLS
    RLS --> DB
    RLS --> RPC
    DB --> RT
    RT -.-> ClientLayer

    RPC --> QUEUE
    QUEUE --> SAN
    SAN --> OPENROUTER
    OPENROUTER --> NEMOTRON
    NEMOTRON --> INSIGHTS
    INSIGHTS --> DB
```

---

## 2. Tender $\rightarrow$ Bid $\rightarrow$ Contract Award Atomic Flow

```mermaid
sequenceDiagram
    autonumber
    actor Gov as Government Authority
    actor Con as Infrastructure Contractor
    participant DB as Supabase PostgreSQL
    participant RT as Realtime Channel

    Gov->>DB: INSERT into tenders (status = 'PUBLISHED')
    DB-->>RT: Broadcast TENDER_PUBLISHED
    RT-->>Con: Notification received on contractor channel
    Con->>DB: INSERT into tender_bids (submitted_by = auth.uid())
    DB-->>Gov: Realtime BID_SUBMITTED notification
    Note over Gov,DB: Evaluation Window & Technical Scoring
    Gov->>DB: SELECT award_contract(tender_id, selected_bid_id)
    activate DB
    Note over DB: Lock tender & bid FOR UPDATE
    Note over DB: Update tender status = 'AWARDED'
    Note over DB: Update selected bid = 'SELECTED', others = 'REJECTED'
    Note over DB: INSERT contracts & project_organizations
    Note over DB: INSERT audit_logs & notifications
    DB-->>Gov: Return contract JSON
    deactivate DB
    DB-->>RT: Broadcast CONTRACT_AWARDED
    RT-->>Con: Instant assignment notification
```

---

## 3. Progress Verification & Official Progress Rule Invariant

```mermaid
sequenceDiagram
    autonumber
    actor Con as Contractor Site Engineer
    actor Gov as Executive Engineer
    actor Cit as Public / Citizen
    participant DB as Authoritative Database
    participant AI as Nemotron AI Pipeline
    participant PUB as public_projects_view

    Con->>DB: submit_progress_update(project_id, progress = 78%)
    DB->>AI: Enqueue in ai_jobs
    AI-->>DB: Save structured risk insight in ai_insights
    
    Note over Cit,PUB: Critical Invariant Check
    Cit->>PUB: Query project progress
    PUB-->>Cit: Returns previous verified value (e.g. 0% or 35%)<br/>[Unverified 78% is HIDDEN from public]
    
    Gov->>DB: Review claim, inspection evidence & AI risk score
    Gov->>DB: Approve verified_progress = 71%
    DB->>DB: UPDATE projects SET physical_progress_percent = 71%
    
    Cit->>PUB: Query project progress
    PUB-->>Cit: Returns officially verified 71%!
```

---

## 4. Grievance Redressal Flow

```mermaid
graph LR
    C[Citizen Submits Issue] -->|Geo-tagged & Categorized| CMP[complaints Table]
    CMP -->|Realtime Alert| G[Government Review Queue]
    G -->|Triage & Assign Action| CU[complaint_updates]
    CU -->|Work Order| K[Contractor Rectification]
    K -->|Site Cleaned / Fixed| G
    G -->|Verify & Close| RES[Status = RESOLVED]
    RES -->|Realtime Alert| C
```
