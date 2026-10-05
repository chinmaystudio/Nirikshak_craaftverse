#!/usr/bin/env node

import pg from 'pg';

const { Client } = pg;
const connectionString =
  process.env.DATABASE_URL ||
  process.env.PG_CONNECTION_STRING ||
  `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || '127.0.0.1'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'postgres'}`;

async function run() {
  console.log('============================================================');
  console.log('NIRIKSHAK SECURITY & RLS PERMISSION INTEGRATION SUITE');
  console.log('============================================================');

  const adminClient = new Client({ connectionString });
  await adminClient.connect();

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Ensure test roles exist if testing against standard PostgreSQL
    await adminClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
          CREATE ROLE service_role NOLOGIN;
        END IF;
      END $$;
    `);

    // 2. Test: authenticated user cannot SELECT from gateway_sessions
    try {
      await adminClient.query('SET ROLE authenticated;');
      await adminClient.query('SELECT * FROM public.gateway_sessions LIMIT 1;');
      assert('authenticated cannot SELECT gateway_sessions', false, 'Query succeeded unexpectedly');
    } catch (err: any) {
      assert('authenticated cannot SELECT gateway_sessions', err.message.includes('permission denied'));
    } finally {
      await adminClient.query('RESET ROLE;');
    }

    // 3. Test: anon user cannot SELECT from gateway_sessions
    try {
      await adminClient.query('SET ROLE anon;');
      await adminClient.query('SELECT * FROM public.gateway_sessions LIMIT 1;');
      assert('anon cannot SELECT gateway_sessions', false, 'Query succeeded unexpectedly');
    } catch (err: any) {
      assert('anon cannot SELECT gateway_sessions', err.message.includes('permission denied'));
    } finally {
      await adminClient.query('RESET ROLE;');
    }

    // 4. Test: authenticated user cannot SELECT from user_mfa_factors
    try {
      await adminClient.query('SET ROLE authenticated;');
      await adminClient.query('SELECT * FROM public.user_mfa_factors LIMIT 1;');
      assert('authenticated cannot SELECT user_mfa_factors', false, 'Query succeeded unexpectedly');
    } catch (err: any) {
      assert('authenticated cannot SELECT user_mfa_factors', err.message.includes('permission denied'));
    } finally {
      await adminClient.query('RESET ROLE;');
    }

    // Check every overload without invoking the function or relying on a stale signature.
    const enqueuePrivileges = await adminClient.query(`
      SELECT count(*)::int AS function_count,
             count(*) FILTER (
               WHERE has_function_privilege('authenticated', p.oid, 'EXECUTE')
                  OR has_function_privilege('anon', p.oid, 'EXECUTE')
             )::int AS client_executable_count
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'enqueue_blockchain_anchor'
    `);
    assert('browser roles cannot execute enqueue_blockchain_anchor',
      enqueuePrivileges.rows[0].function_count > 0 && enqueuePrivileges.rows[0].client_executable_count === 0);

    // 6. Test: service_role CAN execute security diagnostics
    try {
      await adminClient.query('SET ROLE service_role;');
      const diagRes = await adminClient.query('SELECT * FROM public.verify_system_security_posture();');
      const rows = diagRes.rows;
      const allPassed = rows.length > 0 && rows.every((r: any) => r.passed === true);
      const failures = rows.filter((r: any) => r.passed !== true).map((r: any) => `${r.check_name}: ${r.details}`);
      assert('service_role verify_system_security_posture', allPassed, failures.length ? failures.join('; ') : undefined);
    } catch (err: any) {
      assert('service_role verify_system_security_posture', false, err.message);
    } finally {
      await adminClient.query('RESET ROLE;');
    }

    console.log('============================================================');
    console.log(`SECURITY & RLS RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('============================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await adminClient.end();
  }
}

run().catch((err) => {
  console.error('Security test suite fatal error:', err);
  process.exit(1);
});
