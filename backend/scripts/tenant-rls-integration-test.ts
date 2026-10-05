import crypto from 'node:crypto';
import pg from 'pg';

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const client = new Client({ connectionString: databaseUrl });
const ids = Array.from({ length: 15 }, () => crypto.randomUUID());
const [govA, govB, contractorA, contractorB, auditor, citizen, orgA, orgB, orgContractorA, orgContractorB, projectA, projectB, tender, bidA, bidB] = ids;
const caseId = crypto.randomUUID();
const claimId = crypto.randomUUID();
const stamp = crypto.randomBytes(5).toString('hex');

async function asUser(userId: string, sql: string, values: unknown[] = []): Promise<number> {
  await client.query('SET ROLE authenticated');
  try {
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)`, [
      userId,
      JSON.stringify({ sub: userId, role: 'authenticated' }),
    ]);
    const result = await client.query(sql, values);
    return Number(result.rows[0].count);
  } finally {
    await client.query('RESET ROLE');
  }
}

function equal(label: string, actual: number, expected: number): void {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, received ${actual}`);
  console.log(`PASS ${label}`);
}

await client.connect();
await client.query('BEGIN');
try {
  for (const [id, role] of [
    [govA, 'government_admin'], [govB, 'government_admin'],
    [contractorA, 'contractor_admin'], [contractorB, 'contractor_admin'],
    [auditor, 'auditor'], [citizen, 'citizen'],
  ]) {
    await client.query(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token, is_sso_user
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated',
        $2, 'not-a-login', now(), '{}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '', false
      )
    `, [id, `rls-${stamp}-${id}@example.invalid`]);
    await client.query('UPDATE public.profiles SET role = $2 WHERE id = $1', [id, role]);
  }

  for (const [id, type] of [
    [orgA, 'government'], [orgB, 'government'], [orgContractorA, 'contractor'], [orgContractorB, 'contractor'],
  ]) {
    await client.query(`INSERT INTO public.organizations (id, name, type, status) VALUES ($1, $2, $3, 'ACTIVE')`, [id, `RLS ${type} ${id}`, type]);
  }
  for (const [userId, organizationId, role] of [
    [govA, orgA, 'government_admin'], [govB, orgB, 'government_admin'],
    [contractorA, orgContractorA, 'contractor_admin'], [contractorB, orgContractorB, 'contractor_admin'],
    [auditor, orgA, 'auditor'],
  ]) {
    await client.query(`INSERT INTO public.organization_members (user_id, organization_id, role, status) VALUES ($1, $2, $3, 'active')`, [userId, organizationId, role]);
  }
  await client.query(`INSERT INTO public.projects (id, nirikshak_project_id, project_name, government_organization_id, is_public)
    VALUES ($1, $3, 'Tenant A private project', $4, false), ($2, $5, 'Tenant B private project', $6, false)`, [projectA, projectB, `RLS-A-${stamp}`, orgA, `RLS-B-${stamp}`, orgB]);
  await client.query(`INSERT INTO public.tenders (id, project_id, tender_number, title, issuing_organization_id, is_public, status)
    VALUES ($1, $2, $3, 'Private tender', $4, false, 'DRAFT')`, [tender, projectA, `RLS-T-${stamp}`, orgA]);
  await client.query(`INSERT INTO public.tender_bids (id, tender_id, contractor_organization_id, bid_amount, bid_reference, status)
    VALUES ($1, $3, $5, 10, $7, 'DRAFT'), ($2, $3, $4, 11, $6, 'DRAFT')`, [bidA, bidB, tender, orgContractorB, orgContractorA, `RLS-BID-B-${stamp}`, `RLS-BID-A-${stamp}`]);
  await client.query(`INSERT INTO public.auditor_project_assignments (auditor_user_id, auditor_organization_id, project_id)
    VALUES ($1, $2, $3)`, [auditor, orgA, projectA]);
  await client.query(`INSERT INTO public.payment_claims (id, claim_number, project_id, contractor_organization_id, claimed_amount, status)
    VALUES ($1, $2, $3, $4, 5, 'DRAFT')`, [claimId, `RLS-CLAIM-${stamp}`, projectA, orgContractorA]);
  await client.query(`INSERT INTO public.litigations (id, project_id, case_number, case_title, court_or_forum, government_organization_id, opposing_party)
    VALUES ($1, $2, $3, 'Private case', 'Test forum', $4, 'Test party')`, [caseId, projectA, `RLS-CASE-${stamp}`, orgA]);

  equal('Government A sees its private project', await asUser(govA, 'SELECT count(*) FROM public.projects WHERE id = $1', [projectA]), 1);
  equal('Government A cannot see Government B private project', await asUser(govA, 'SELECT count(*) FROM public.projects WHERE id = $1', [projectB]), 0);
  equal('Government B cannot see Government A private project', await asUser(govB, 'SELECT count(*) FROM public.projects WHERE id = $1', [projectA]), 0);
  equal('Contractor A sees its bid', await asUser(contractorA, 'SELECT count(*) FROM public.tender_bids WHERE id = $1', [bidA]), 1);
  equal('Contractor A cannot see Contractor B private bid', await asUser(contractorA, 'SELECT count(*) FROM public.tender_bids WHERE id = $1', [bidB]), 0);
  equal('Contractor B cannot see Contractor A private bid', await asUser(contractorB, 'SELECT count(*) FROM public.tender_bids WHERE id = $1', [bidA]), 0);
  equal('Auditor sees assigned project', await asUser(auditor, 'SELECT count(*) FROM public.projects WHERE id = $1', [projectA]), 1);
  equal('Auditor cannot see unassigned project', await asUser(auditor, 'SELECT count(*) FROM public.projects WHERE id = $1', [projectB]), 0);
  equal('Citizen cannot see private payment claim', await asUser(citizen, 'SELECT count(*) FROM public.payment_claims WHERE id = $1', [claimId]), 0);
  equal('Citizen cannot see private litigation', await asUser(citizen, 'SELECT count(*) FROM public.litigations WHERE id = $1', [caseId]), 0);
} finally {
  await client.query('RESET ROLE');
  await client.query('ROLLBACK');
  await client.end();
}
