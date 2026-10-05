# NIRIKSHAK Craftverse: Blockchain Event Coverage Matrix

This document provides the authoritative, audited classification of all Hyperledger Fabric blockchain anchor events across the NIRIKSHAK Craftverse architecture.

| Event Name | Implemented Enqueue Source | Entity Type | Canonical Payload Builder | Fabric Event / Transaction | Implementation Status |
|:---|:---|:---|:---|:---|:---|
| `PROJECT_CREATED` | Database Trigger: `trg_077_project_anchor` on `projects` | `PROJECT` | `buildProjectPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `PROJECT_APPROVED` | Administrative approval transition | `PROJECT` | `buildProjectPayload` | N/A | **NOT_IMPLEMENTED** |
| `TENDER_PUBLISHED` | Database Trigger: `trg_077_tender_published_anchor` on `tenders` | `CONTRACT` | `buildContractPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `BID_SUBMITTED` | Database Trigger: `trg_077_bid_submitted_anchor` on `tender_bids` | `BID` | `buildBidPayload` | `CreateAnchor` (ContractorOrgMSP) | **IMPLEMENTED** |
| `BID_WITHDRAWN` | N/A (Bids are final upon submission under GFR 2017) | `BID` | N/A | N/A | **NOT_PLANNED** |
| `BID_SELECTED` | Database Trigger: `trg_077_bid_selected_anchor` on `tender_bids` | `BID` | `buildBidPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `CONTRACT_AWARDED` | Database Trigger: `trg_anchor_contract_award` on `contracts` | `CONTRACT` | `buildContractPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `PROGRESS_SUBMITTED` | Database Trigger: `trg_077_progress_submitted_anchor` on `progress_updates` | `PROGRESS_UPDATE` | `buildProgressPayload` | `CreateAnchor` (ContractorOrgMSP) | **IMPLEMENTED** |
| `PROGRESS_APPROVED` | Database Trigger: `trg_077_progress_approved_anchor` on `progress_updates` | `PROGRESS_UPDATE` | `buildProgressPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `PROGRESS_REJECTED` | Rejection state logged in DB with deficiency feedback | `PROGRESS_UPDATE` | N/A | N/A | **NOT_IMPLEMENTED** |
| `INSPECTION_COMPLETED` | Database Trigger: `trg_077_inspection_completed_anchor` on `inspections` | `INSPECTION` | `buildInspectionPayload` | `CreateAnchor` (AuditorOrgMSP) | **IMPLEMENTED** |
| `INSPECTION_FINDING_CREATED` | Handled within parent inspection report payload | `INSPECTION_FINDING` | `buildInspectionFindingPayload` | N/A | **NOT_IMPLEMENTED** |
| `PAYMENT_CLAIM_SUBMITTED` | Database Trigger: `trg_077_payment_claim_submitted_anchor` on `payment_claims` | `PAYMENT_CLAIM` | `buildPaymentClaimPayload` | `CreateAnchor` (ContractorOrgMSP) | **IMPLEMENTED** |
| `PAYMENT_CLAIM_APPROVED` | Database Trigger: `trg_077_payment_claim_approved_anchor` on `payment_claims` | `PAYMENT_CLAIM` | `buildPaymentClaimPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `PAYMENT_RECORDED` | Database Trigger: `trg_anchor_payment_record` on `payments` | `PAYMENT` | `buildPaymentPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `LITIGATION_CREATED` | Database Trigger: `trg_077_litigation_created_anchor` on `litigations` | `LITIGATION` | `buildLitigationPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `LITIGATION_EVENT_RECORDED` | Court hearing milestones logged in litigation timeline | `LITIGATION` | N/A | N/A | **NOT_IMPLEMENTED** |
| `SETTLEMENT_APPROVED` | Database Trigger: `trg_077_settlement_approved_anchor` on `settlements` | `SETTLEMENT` | `buildSettlementPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `SETTLEMENT_EXECUTED` | Handled via financial disbursement payment record | `SETTLEMENT` | N/A | N/A | **NOT_IMPLEMENTED** |
| `AI_ANALYSIS_COMPLETED` | Database Trigger: `trg_077_ai_analysis_completed_anchor` on `ai_analysis_runs` | `AI_ANALYSIS` | `buildAiAnalysisPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `AI_ACTION_ACCEPTED` | Recommendation acceptance logged in decision workflow | `AI_ACTION` | N/A | N/A | **NOT_IMPLEMENTED** |
| `AI_OUTCOME_RECORDED` | Database Trigger: `trg_077_ai_outcome_recorded_anchor` on `ai_action_outcomes` | `AI_ANALYSIS` | `buildAiAnalysisPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `PROJECT_COMPLETED` | Database Trigger: `trg_077_project_completed_anchor` on `projects` | `PROJECT` | `buildProjectPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |
| `DOCUMENT_FINALIZED` | Database Trigger: `trg_077_document_finalized_anchor` on `project_documents` | `DOCUMENT` | `buildDocumentPayload` | `CreateAnchor` (GovernmentOrgMSP) | **IMPLEMENTED** |

## Core High-Value Anchor Summary
All 16 core high-value institutional events mandated by Phase 31 are **100% IMPLEMENTED** via PostgreSQL transactional outbox triggers (`065_` and `077_blockchain_event_coverage.sql`) and backed by canonical schema entity builders in `backend/src/modules/blockchain/blockchain.entityResolver.ts`.
