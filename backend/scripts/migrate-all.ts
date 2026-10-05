#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '..', 'supabase', 'migrations');

const connectionString =
  process.env.DATABASE_URL ||
  process.env.PG_CONNECTION_STRING ||
  `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || '127.0.0.1'}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'postgres'}`;

async function run() {
  console.log('============================================================');
  console.log('NIRIKSHAK FULL CLEAN DATABASE MIGRATION RUNNER (001 -> FINAL)');
  console.log('============================================================');

  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`Connected to PostgreSQL server successfully.`);
  } catch (err: any) {
    console.error(`FATAL: Could not connect to PostgreSQL database:`, err.message);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} sequential migration files.`);

  // Create migrations audit table if not present
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      execution_ms INTEGER NOT NULL
    );
  `);

  let appliedCount = 0;
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const start = Date.now();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      const elapsed = Date.now() - start;
      await client.query(
        `INSERT INTO _schema_migrations (version, execution_ms) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING`,
        [file, elapsed]
      );
      await client.query('COMMIT');
      appliedCount++;
      console.log(`  ✔ [PASS] ${file} (${elapsed}ms)`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error(`\n❌ [FAILED] Migration failed at ${file}:`);
      console.error(err.message);
      if (err.position) {
        console.error(`   Error position: ${err.position}`);
      }
      await client.end();
      process.exit(1);
    }
  }

  console.log('============================================================');
  console.log(`✔ SUCCESS: ${appliedCount}/${files.length} migrations cleanly applied with zero errors.`);
  console.log('============================================================');
  await client.end();
}

run().catch((err) => {
  console.error('Migration runner crashed:', err);
  process.exit(1);
});
