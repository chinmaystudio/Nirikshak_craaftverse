const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { splitSqlStatements } = require('./sql_parser.cjs');

const DB_HOST = 'aws-0-ap-southeast-2.pooler.supabase.com';
const DB_PORT = 6543;
const DB_USER = 'postgres.ylyvhytlvwqebkyawdnq';
const DB_PASS = 'chinmay8329016584@@';
const DB_NAME = 'postgres';

async function seed() {
  console.log('Connecting to live Supabase database...');
  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL 17 on ylyvhytlvwqebkyawdnq!\n');

  // Fix 1: Ensure blockchain triggers correctly call extensions.digest
  console.log('Fixing blockchain anchor triggers with extensions.digest...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.trg_anchor_payment_recorded()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $$
    DECLARE
      v_payload_hash TEXT;
      v_dedupe_key TEXT;
      v_payload JSONB;
    BEGIN
      v_payload := jsonb_build_object(
        'payment_id', NEW.id,
        'payment_reference', NEW.payment_reference,
        'amount', NEW.amount,
        'payment_status', NEW.payment_status,
        'claim_id', NEW.payment_claim_id,
        'recorded_at', NEW.created_at
      );

      v_payload_hash := encode(extensions.digest(v_payload::text, 'sha256'), 'hex');
      v_dedupe_key := 'PAYMENT:' || NEW.id || ':RECORDED:' || COALESCE(NEW.payment_reference, NEW.id::text);

      PERFORM public.enqueue_blockchain_anchor(
        NEW.project_id,
        'PAYMENT',
        NEW.id,
        NEW.payment_reference,
        'PAYMENT_RECORDED',
        v_payload_hash,
        v_payload,
        v_dedupe_key
      );

      RETURN NEW;
    END;
    $$;

    CREATE OR REPLACE FUNCTION public.trg_anchor_contract_awarded()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $$
    DECLARE
      v_payload_hash TEXT;
      v_dedupe_key TEXT;
      v_payload JSONB;
    BEGIN
      IF NEW.status IN ('ACTIVE', 'SIGNED') AND (OLD IS NULL OR OLD.status <> NEW.status) THEN
        v_payload := jsonb_build_object(
          'contract_id', NEW.id,
          'contract_number', NEW.contract_number,
          'contract_value', NEW.contract_value,
          'contractor_organization_id', NEW.contractor_organization_id,
          'awarded_at', NEW.created_at
        );

        v_payload_hash := encode(extensions.digest(v_payload::text, 'sha256'), 'hex');
        v_dedupe_key := 'CONTRACT:' || NEW.id || ':AWARDED:' || COALESCE(NEW.contract_number, NEW.id::text);

        PERFORM public.enqueue_blockchain_anchor(
          NEW.project_id,
          'CONTRACT',
          NEW.id,
          NEW.contract_number,
          'CONTRACT_AWARDED',
          v_payload_hash,
          v_payload,
          v_dedupe_key
        );
      END IF;

      RETURN NEW;
    END;
    $$;
  `);
  console.log('Blockchain anchor triggers updated successfully.\n');

  // Helper to run SQL file
  async function runSqlFile(filePath, label) {
    console.log(`Running ${label} (${path.basename(filePath)})...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = splitSqlStatements(sql);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      try {
        await client.query(stmt);
        successCount++;
      } catch (err) {
        console.error(`Error in ${path.basename(filePath)} stmt ${i}: ${err.message.substring(0, 150)}`);
        errorCount++;
      }
    }
    console.log(`Completed ${label}: ${successCount} statements succeeded, ${errorCount} errors.\n`);
  }

  // 2. Re-run Pune ecosystem seed (to seed contracts and remaining items)
  const puneSeedPath = path.join(__dirname, '..', 'supabase', 'seed', 'seed_chunks', 'pune_ecosystem_seed.sql');
  if (fs.existsSync(puneSeedPath)) {
    await runSqlFile(puneSeedPath, 'Pune Core Projects & Ecosystem');
  }

  // 3. Print final counts across all core tables
  const tables = [
    'projects',
    'public_projects_view',
    'organizations',
    'project_organizations',
    'contracts',
    'project_milestones',
    'progress_updates',
    'complaints',
    'tenders',
    'ai_insights',
    'environmental_baselines',
    'environmental_commitments',
    'blockchain_outbox'
  ];

  console.log('================ LIVE SUPABASE TABLE ROW COUNTS ================');
  for (const t of tables) {
    try {
      const r = await client.query(`SELECT count(*) FROM public.${t};`);
      console.log(`- public.${t}: ${r.rows[0].count} rows`);
    } catch (e) {
      console.log(`- public.${t}: ERROR (${e.message})`);
    }
  }
  console.log('================================================================\n');

  await client.end();
}

seed().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
