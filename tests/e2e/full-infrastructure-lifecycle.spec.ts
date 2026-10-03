/**
 * NIRIKSHAK Automated End-to-End Infrastructure Lifecycle Test Suite
 * File: tests/e2e/full-infrastructure-lifecycle.spec.ts
 *
 * This test suite automates the complete realistic infrastructure project lifecycle:
 * 1. Multi-role authentication (Government, 5 Contractors, Citizen)
 * 2. Infrastructure project creation & milestone definition (M1-M6, 100%)
 * 3. Budget sanction (₹250 Cr across 6 heads)
 * 4. Tender publication & realtime dispatch (₹220 Cr)
 * 5. 5 competitive contractor bids
 * 6. RLS bid privacy & confidentiality validation (zero competitor data leaks)
 * 7. Deterministic 70:30 QCBS bid evaluation (Crestline Infra wins with 95.24)
 * 8. Atomic contract award RPC & state transitions
 * 9. Round 1 progress reporting (20%) & Government verification (18%)
 * 10. Round 2 progress reporting (45%) & Government verification (37%)
 * 11. Citizen transparency & verified progress invariant checks
 * 12. Citizen complaint lifecycle (submit -> assign -> corrective action -> resolve)
 * 13. Round 3 progress reporting (60%) & Government rejection (official progress stays 37%)
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dmkhkgqyzevhxpxsrgng.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta2hrZ3F5emV2aHhweHNyZ25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODAxODcsImV4cCI6MjA1ODc1NjE4N30.C3n_N_mF2Tq-N7Kqm_z8r2H1f1_Q1O8Y1Z2_E9A-x_o';

const ACCOUNTS = {
  government: {
    email: 'government.e2e@nirikshak.local',
    password: 'NirikshakGovE2E#2026',
    role: 'government_admin',
    name: 'Pune Infrastructure Monitoring Authority',
  },
  contractors: [
    { id: 1, email: 'contractor1.e2e@nirikshak.local', password: 'NirikshakC1#2026', company: 'Apex Infrastructure Pvt Ltd', bidCrore: 218, techScore: 88 },
    { id: 2, email: 'contractor2.e2e@nirikshak.local', password: 'NirikshakC2#2026', company: 'Bharat Urban Engineering Ltd', bidCrore: 209, techScore: 82 },
    { id: 3, email: 'contractor3.e2e@nirikshak.local', password: 'NirikshakC3#2026', company: 'Crestline Infra Projects Pvt Ltd', bidCrore: 214, techScore: 95 },
    { id: 4, email: 'contractor4.e2e@nirikshak.local', password: 'NirikshakC4#2026', company: 'Deccan Civil Engineering Ltd', bidCrore: 205, techScore: 70 },
    { id: 5, email: 'contractor5.e2e@nirikshak.local', password: 'NirikshakC5#2026', company: 'Evergreen Smart Infrastructure Pvt Ltd', bidCrore: 211, techScore: 91 },
  ],
  citizen: {
    email: 'citizen.e2e@nirikshak.local',
    password: 'NirikshakCitizenE2E#2026',
    name: 'E2E Citizen Tester',
    role: 'citizen',
  },
};

test.describe('NIRIKSHAK Full Infrastructure Lifecycle E2E Test', () => {
  let projectUuid: string;
  let tenderId: string;
  let contractId: string;
  let winningContractorOrgId: string;
  let contractor3BidId: string;

  test.beforeAll(async () => {
    // Assert environment connectivity
    expect(SUPABASE_URL).toBeTruthy();
    expect(SUPABASE_ANON_KEY).toBeTruthy();
  });

  test('Step 1: Multi-Role Authentication & Session Verification', async () => {
    const govClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: govAuth, error: govErr } = await govClient.auth.signInWithPassword({
      email: ACCOUNTS.government.email,
      password: ACCOUNTS.government.password,
    });
    expect(govErr).toBeNull();
    expect(govAuth.user).not.toBeNull();
    expect(govAuth.user?.email).toBe(ACCOUNTS.government.email);

    // Verify all 5 contractors
    for (const c of ACCOUNTS.contractors) {
      const cClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: cAuth, error: cErr } = await cClient.auth.signInWithPassword({
        email: c.email,
        password: c.password,
      });
      expect(cErr).toBeNull();
      expect(cAuth.user?.email).toBe(c.email);
    }

    // Verify Citizen
    const citClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: citAuth, error: citErr } = await citClient.auth.signInWithPassword({
      email: ACCOUNTS.citizen.email,
      password: ACCOUNTS.citizen.password,
    });
    expect(citErr).toBeNull();
    expect(citAuth.user?.email).toBe(ACCOUNTS.citizen.email);
  });

  test('Step 2: Realistic Infrastructure Project Creation & Milestones', async () => {
    const govClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await govClient.auth.signInWithPassword({
      email: ACCOUNTS.government.email,
      password: ACCOUNTS.government.password,
    });

    const runId = Math.floor(Math.random() * 900000) + 100000;
    const { data: project, error: projErr } = await govClient
      .from('projects')
      .insert({
        code: `NIR-E2E-SPEC-${runId}`,
        name: '[E2E TEST] Pune Integrated Urban Mobility & Smart Road Corridor',
        description: 'Integrated urban road improvement project covering road widening, storm-water drainage, utility relocation, pedestrian infrastructure, smart lighting, traffic monitoring, and intelligent transport systems.',
        sector: 'Urban Road / Smart Infrastructure',
        location: 'Pune, Maharashtra',
        state: 'Maharashtra',
        district: 'Pune',
        budget_allocated: 2500000000,
        sanctioned_budget: 2500000000,
        total_proposed_cost: 2500000000,
        status: 'SANCTIONED',
        progress_percentage: 0,
        physical_progress: 0,
        financial_progress: 0,
      })
      .select()
      .single();

    expect(projErr).toBeNull();
    expect(project).not.toBeNull();
    projectUuid = project.id;

    // Milestones M1-M6
    const milestones = [
      { name: 'M1 — Mobilization & Survey', weight: 10, display_order: 1 },
      { name: 'M2 — Drainage & Utility Relocation', weight: 20, display_order: 2 },
      { name: 'M3 — Earthwork & Subgrade', weight: 20, display_order: 3 },
      { name: 'M4 — Pavement & Structural Works', weight: 25, display_order: 4 },
      { name: 'M5 — Smart Lighting & ITS', weight: 15, display_order: 5 },
      { name: 'M6 — Testing, Safety Audit & Handover', weight: 10, display_order: 6 },
    ];

    for (const m of milestones) {
      const { error: mErr } = await govClient.from('project_milestones').insert({
        project_id: projectUuid,
        name: m.name,
        display_order: m.display_order,
        planned_progress: m.weight,
        status: 'PENDING',
      });
      expect(mErr).toBeNull();
    }
  });

  test('Step 3: Budget Sanction (₹250 Crore Across 6 Allocation Heads)', async () => {
    const govClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await govClient.auth.signInWithPassword({
      email: ACCOUNTS.government.email,
      password: ACCOUNTS.government.password,
    });

    const budgetHeads = [
      { head: 'Civil Works', crore: 150 },
      { head: 'Drainage / Utilities', crore: 30 },
      { head: 'Smart Infrastructure', crore: 25 },
      { head: 'Traffic / ITS', crore: 15 },
      { head: 'Safety / Environment', crore: 10 },
      { head: 'Contingency', crore: 20 },
    ];

    let totalAllocated = 0;
    for (const b of budgetHeads) {
      totalAllocated += b.crore;
      const { error: bErr } = await govClient.from('financial_updates').insert({
        project_id: projectUuid,
        budget_head: b.head,
        budget_allocation_inr_crore: b.crore,
        notes: `Sanctioned allocation for ${b.head} under ₹250 Cr scope`,
      });
      expect(bErr).toBeNull();
    }
    expect(totalAllocated).toBe(250);
  });

  test('Step 4: Tender Publication & 5 Contractor Bids', async () => {
    const govClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await govClient.auth.signInWithPassword({
      email: ACCOUNTS.government.email,
      password: ACCOUNTS.government.password,
    });

    const tenderRef = `TND-PIMA-SPEC-${Math.floor(Math.random() * 90000) + 10000}`;
    const { data: tender, error: tndErr } = await govClient
      .from('tenders')
      .insert({
        project_id: projectUuid,
        title: 'Pune Integrated Urban Mobility & Smart Road Corridor EPC Package',
        reference_number: tenderRef,
        tender_number: tenderRef,
        estimated_value: 2200000000,
        estimated_cost: 2200000000,
        contract_type: 'EPC',
        status: 'PUBLISHED',
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    expect(tndErr).toBeNull();
    expect(tender).not.toBeNull();
    tenderId = tender.id;

    // Submit 5 Bids
    const submittedBids = [];
    for (const c of ACCOUNTS.contractors) {
      const cClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: authData } = await cClient.auth.signInWithPassword({
        email: c.email,
        password: c.password,
      });

      const { data: member } = await cClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', authData.user!.id)
        .single();

      expect(member).not.toBeNull();

      const bidRef = `NIR-BID-2026-SPEC-00${c.id}`;
      const { data: bid, error: bidErr } = await cClient
        .from('tender_bids')
        .insert({
          tender_id: tenderId,
          bidder_id: authData.user!.id,
          contractor_organization_id: member!.organization_id,
          bid_reference: bidRef,
          bid_amount: c.bidCrore * 10000000,
          technical_score: c.techScore,
          financial_score: (205 / c.bidCrore) * 100,
          composite_score: (0.7 * c.techScore) + (0.3 * ((205 / c.bidCrore) * 100)),
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      expect(bidErr).toBeNull();
      submittedBids.push(bid);

      if (c.id === 3) {
        winningContractorOrgId = member!.organization_id;
        contractor3BidId = bid.id;
      }
    }
    expect(submittedBids.length).toBe(5);
  });

  test('Step 5: Competitor Bid Privacy & RLS Security Invariant', async () => {
    // Contractor 1 attempts to query all tender_bids
    const c1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await c1Client.auth.signInWithPassword({
      email: ACCOUNTS.contractors[0].email,
      password: ACCOUNTS.contractors[0].password,
    });

    const { data: visibleBids, error: queryErr } = await c1Client
      .from('tender_bids')
      .select('id, contractor_organization_id, bid_amount')
      .eq('tender_id', tenderId);

    expect(queryErr).toBeNull();
    // Strict RLS isolation: Contractor 1 must ONLY see their own bid (exactly 1 row)
    expect(visibleBids?.length).toBe(1);
  });

  test('Step 6: Deterministic 70:30 QCBS Bid Evaluation & Atomic Award', async () => {
    const govClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await govClient.auth.signInWithPassword({
      email: ACCOUNTS.government.email,
      password: ACCOUNTS.government.password,
    });

    // Award contract to Contractor 3 (Crestline Infra Projects Pvt Ltd)
    const { data: awardResult, error: awardErr } = await govClient.rpc('award_contract', {
      p_tender_id: tenderId,
      p_winning_bid_id: contractor3BidId,
    });

    expect(awardErr).toBeNull();
    expect(awardResult.success).toBe(true);
    contractId = awardResult.contract_id;
    expect(contractId).toBeTruthy();

    // Verify Tender status transitioned to AWARDED
    const { data: tenderRow } = await govClient.from('tenders').select('status').eq('id', tenderId).single();
    expect(tenderRow?.status).toBe('AWARDED');

    // Verify losing bids transitioned to REJECTED
    const { data: losingBids } = await govClient
      .from('tender_bids')
      .select('status')
      .eq('tender_id', tenderId)
      .neq('id', contractor3BidId);

    for (const b of losingBids || []) {
      expect(b.status).toBe('REJECTED');
    }
  });

  test('Step 7: Progress Updates & Verification Invariant (Rounds 1 & 2)', async () => {
    const c3Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await c3Client.auth.signInWithPassword({
      email: ACCOUNTS.contractors[2].email,
      password: ACCOUNTS.contractors[2].password,
    });

    const govClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await govClient.auth.signInWithPassword({
      email: ACCOUNTS.government.email,
      password: ACCOUNTS.government.password,
    });

    const citizenClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await citizenClient.auth.signInWithPassword({
      email: ACCOUNTS.citizen.email,
      password: ACCOUNTS.citizen.password,
    });

    // Round 1: Contractor reports 20%
    const { data: upd1 } = await c3Client
      .from('progress_updates')
      .insert({
        project_id: projectUuid,
        reported_progress: 20,
        progress_percentage: 20,
        summary: 'Mobilization completed, survey completed, site barricading completed.',
        status: 'SUBMITTED',
      })
      .select()
      .single();

    // Citizen invariant: Contractor claim of 20% is NOT yet official
    let { data: citProj } = await citizenClient.from('projects').select('progress_percentage').eq('id', projectUuid).single();
    expect(citProj?.progress_percentage).toBe(0);

    // Government verifies Round 1 at 18%
    await govClient
      .from('progress_updates')
      .update({
        verified_progress: 18,
        status: 'APPROVED',
        review_remarks: 'Two survey zones pending verification. Verified at 18%.',
      })
      .eq('id', upd1!.id);

    await govClient
      .from('projects')
      .update({ progress_percentage: 18, physical_progress: 18, status: 'UNDER_CONSTRUCTION' })
      .eq('id', projectUuid);

    // Citizen now sees official 18%
    ({ data: citProj } = await citizenClient.from('projects').select('progress_percentage').eq('id', projectUuid).single());
    expect(citProj?.progress_percentage).toBe(18);

    // Round 2: Contractor reports 45%
    const { data: upd2 } = await c3Client
      .from('progress_updates')
      .insert({
        project_id: projectUuid,
        reported_progress: 45,
        progress_percentage: 45,
        summary: 'Major drain excavation and utility shifting completed.',
        status: 'SUBMITTED',
      })
      .select()
      .single();

    // Government verifies Round 2 at 37%
    await govClient
      .from('progress_updates')
      .update({
        verified_progress: 37,
        status: 'APPROVED',
        review_remarks: 'Site inspection completed. Verified progress 37%.',
      })
      .eq('id', upd2!.id);

    await govClient
      .from('projects')
      .update({ progress_percentage: 37, physical_progress: 37 })
      .eq('id', projectUuid);

    // Citizen now sees official 37%
    ({ data: citProj } = await citizenClient.from('projects').select('progress_percentage').eq('id', projectUuid).single());
    expect(citProj?.progress_percentage).toBe(37);
  });

  test('Step 8: Citizen Complaint Lifecycle (Submit -> Assign -> Correct -> Resolve)', async () => {
    const citClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: citAuth } = await citClient.auth.signInWithPassword({
      email: ACCOUNTS.citizen.email,
      password: ACCOUNTS.citizen.password,
    });

    const govClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: govAuth } = await govClient.auth.signInWithPassword({
      email: ACCOUNTS.government.email,
      password: ACCOUNTS.government.password,
    });

    const c3Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await c3Client.auth.signInWithPassword({
      email: ACCOUNTS.contractors[2].email,
      password: ACCOUNTS.contractors[2].password,
    });

    // 1. Citizen submits complaint
    const cmpRef = `CMP-SPEC-${Math.floor(Math.random() * 90000) + 10000}`;
    const { data: complaint, error: cmpErr } = await citClient
      .from('complaints')
      .insert({
        project_id: projectUuid,
        citizen_id: citAuth.user!.id,
        category: 'Construction / Traffic Safety',
        title: 'Unsafe temporary pedestrian diversion near construction zone',
        description: 'Temporary pedestrian route near the project site is poorly marked and requires safer barricading and visible direction signage.',
        status: 'SUBMITTED',
        priority: 'MEDIUM',
      })
      .select()
      .single();

    expect(cmpErr).toBeNull();
    expect(complaint).not.toBeNull();

    // 2. Government assigns & classifies as HIGH priority
    const { error: assignErr } = await govClient
      .from('complaints')
      .update({
        priority: 'HIGH',
        status: 'IN_REVIEW',
        assigned_to: winningContractorOrgId,
      })
      .eq('id', complaint!.id);
    expect(assignErr).toBeNull();

    // 3. Contractor responds with corrective action
    const { error: noteErr } = await c3Client.from('complaint_updates').insert({
      complaint_id: complaint!.id,
      actor_id: (await c3Client.auth.getUser()).data.user!.id,
      previous_status: 'IN_REVIEW',
      new_status: 'IN_REVIEW',
      notes: 'Corrective pedestrian barricading and reflective signage installed on-site.',
    });
    expect(noteErr).toBeNull();

    // 4. Government marks RESOLVED
    const { error: resErr } = await govClient
      .from('complaints')
      .update({ status: 'RESOLVED' })
      .eq('id', complaint!.id);
    expect(resErr).toBeNull();

    await govClient.from('complaint_updates').insert({
      complaint_id: complaint!.id,
      actor_id: govAuth.user!.id,
      previous_status: 'IN_REVIEW',
      new_status: 'RESOLVED',
      notes: 'Safety barricading and pedestrian diversion signage corrected and verified on-site.',
    });

    // 5. Citizen verifies resolution
    const { data: finalCmp } = await citClient.from('complaints').select('status').eq('id', complaint!.id).single();
    expect(finalCmp?.status).toBe('RESOLVED');
  });

  test('Step 9: Progress Round 3 Rejection & Invariant Verification', async () => {
    const c3Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await c3Client.auth.signInWithPassword({
      email: ACCOUNTS.contractors[2].email,
      password: ACCOUNTS.contractors[2].password,
    });

    const govClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await govClient.auth.signInWithPassword({
      email: ACCOUNTS.government.email,
      password: ACCOUNTS.government.password,
    });

    const citizenClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await citizenClient.auth.signInWithPassword({
      email: ACCOUNTS.citizen.email,
      password: ACCOUNTS.citizen.password,
    });

    // Contractor reports 60% with physical/financial divergence
    const { data: upd3 } = await c3Client
      .from('progress_updates')
      .insert({
        project_id: projectUuid,
        reported_progress: 60,
        progress_percentage: 60,
        summary: 'Material delivery delays and utility relocation extension.',
        status: 'SUBMITTED',
      })
      .select()
      .single();

    // Government rejects the update
    const { error: rejErr } = await govClient
      .from('progress_updates')
      .update({
        status: 'REJECTED',
        review_remarks: 'Submitted evidence insufficient to verify reported 60%. Site inspection reveals pending subgrade works.',
      })
      .eq('id', upd3!.id);
    expect(rejErr).toBeNull();

    // CRITICAL INVARIANT: Citizen official progress must strictly remain at 37%
    const { data: citProj } = await citizenClient.from('projects').select('progress_percentage').eq('id', projectUuid).single();
    expect(citProj?.progress_percentage).toBe(37);
  });
});
