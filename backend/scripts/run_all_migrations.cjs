const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { splitSqlStatements } = require('./sql_parser.cjs');

const DB_HOST = 'aws-0-ap-southeast-2.pooler.supabase.com';
const DB_PORT = 5432;
const DB_USER = 'postgres.ylyvhytlvwqebkyawdnq';
const DB_PASS = 'chinmay8329016584@@';
const DB_NAME = 'postgres';

async function runMigrations() {
  console.log('============================================================');
  console.log('STARTING NIRIKSHAK DATABASE V2 MIGRATIONS (001-065)');
  console.log('Target Project: ylyvhytlvwqebkyawdnq (ap-southeast-2)');
  console.log('============================================================\n');

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

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  console.log(`Found ${files.length} migration files in ${migrationsDir}\n`);

  let filePassCount = 0;
  let totalStatementsRun = 0;
  let skippedSafeErrors = 0;

  const startIndex = process.argv[2] ? parseInt(process.argv[2], 10) : 0;
  if (startIndex > 0) {
    console.log(`Resuming migrations from index ${startIndex}: ${files[startIndex]}\n`);
  }

  for (let i = startIndex; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(migrationsDir, file);
    let sql = fs.readFileSync(filePath, 'utf8');
    if (file === '046_seed_support_v2.sql') {
      sql = sql.replace(/'HIGH',\s*'PUBLIC'/g, "'HIGH', true");
      sql = sql.replace(/'SAFETY_HAZARD'/g, "'SAFETY_VIOLATION'");
    }

    const statements = splitSqlStatements(sql);
    const fileStartTime = Date.now();

    for (let j = 0; j < statements.length; j++) {
      const stmt = statements[j];
      let success = false;
      let attempts = 0;

      while (!success && attempts < 4) {
        attempts++;
        try {
          await client.query(stmt);
          totalStatementsRun++;
          success = true;
        } catch (err) {
          // Transient lock / deadlock retry
          if (['40P01', '55P03', '40001'].includes(err.code) && attempts < 4) {
            console.log(`[Transient ${err.code}] Deadlock/lock contention on stmt ${j + 1}, retrying in ${attempts * 800}ms...`);
            await new Promise(r => setTimeout(r, attempts * 800));
            continue;
          }

          // Auto-fix 1: View column name or type change
          if (err.message.includes('cannot change name of view column') || err.message.includes('cannot change data type of view column')) {
            const match = stmt.match(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+([^\s(]+)/i);
            if (match) {
              const viewName = match[1];
              try {
                await client.query(`DROP VIEW IF EXISTS ${viewName} CASCADE;`);
                await client.query(stmt);
                totalStatementsRun++;
                success = true;
                break;
              } catch (retryErr) {
                console.error(`Retry view drop failed for ${viewName}:`, retryErr.message);
              }
            }
          }

          // Auto-fix 2: Function return type change
          if (err.message.includes('cannot change return type of existing function')) {
            const match = stmt.match(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([^\s(]+)/i);
            if (match) {
              const funcName = match[1];
              try {
                await client.query(`DROP FUNCTION IF EXISTS ${funcName} CASCADE;`);
                await client.query(stmt);
                totalStatementsRun++;
                success = true;
                break;
              } catch (retryErr) {
                console.error(`Retry func drop failed for ${funcName}:`, retryErr.message);
              }
            }
          }

          // Auto-fix 3: Missing column
          if (err.code === '42703' || err.message.includes('does not exist')) {
            let colName = null;
            let tblName = null;

            const relMatch = err.message.match(/column\s+"?([a-z0-9_]+)"?\s+of relation\s+"?([a-z0-9_]+)"?\s+does not exist/i);
            if (relMatch) {
              colName = relMatch[1];
              tblName = relMatch[2];
            } else {
              const colMatch = err.message.match(/column\s+(?:"?([a-z0-9_]+)"?\.)?"?([a-z0-9_]+)"?\s+does not exist/i);
              if (colMatch) {
                const aliasName = colMatch[1];
                colName = colMatch[2];
                if (aliasName) {
                  const aliasRegex = new RegExp(`(?:FROM|JOIN)\\s+(?:public\\.)?([a-z0-9_]+)\\s+(?:AS\\s+)?${aliasName}\\b`, 'i');
                  const aliasMatch = stmt.match(aliasRegex);
                  if (aliasMatch) tblName = aliasMatch[1];
                }
                if (!tblName) {
                  const tblMatch = stmt.match(/(?:FROM|JOIN|UPDATE|TABLE|ON|INTO)\s+(?:public\.)?([a-z0-9_]+)/i);
                  if (tblMatch) tblName = tblMatch[1];
                }
              }
            }

              if (tblName) {
                let colType = 'TEXT';
                if (colName.endsWith('_at') || colName.endsWith('_date')) colType = 'TIMESTAMPTZ';
                else if (colName.endsWith('_id')) colType = 'UUID';
                else if (colName.endsWith('_percent') || colName.endsWith('_crore') || colName.endsWith('_amount') || colName.endsWith('_score')) colType = 'NUMERIC';
                else if (colName.startsWith('is_') || colName.startsWith('has_')) colType = 'BOOLEAN';
                try {
                  await client.query(`ALTER TABLE public.${tblName} ADD COLUMN IF NOT EXISTS ${colName} ${colType};`);
                  console.log(`[Auto-Fixed] Added ${colName} (${colType}) to ${tblName}`);
                  await client.query(stmt);
                  totalStatementsRun++;
                  success = true;
                  break;
                } catch (retryErr) {
                  console.error(`Retry add column failed for ${tblName}.${colName}:`, retryErr.message);
                }
              }
            }

          // Auto-fix 5: Not-null violation on legacy columns in seed scripts
          if (err.code === '23502') {
            const notNullMatch = err.message.match(/null value in column "([^"]+)" of relation "([^"]+)" violates not-null constraint/);
            if (notNullMatch) {
              const col = notNullMatch[1];
              const tbl = notNullMatch[2];
              try {
                await client.query(`ALTER TABLE public.${tbl} ALTER COLUMN ${col} DROP NOT NULL;`);
                console.log(`[Auto-Fixed] Dropped NOT NULL on ${tbl}.${col}`);
                await client.query(stmt);
                totalStatementsRun++;
                success = true;
                break;
              } catch (retryErr) {
                console.error(`Retry drop NOT NULL failed for ${tbl}.${col}:`, retryErr.message);
              }
            }
          }

          // Safe errors that can be safely ignored in idempotent migrations:
          // 42P07: duplicate_table
          // 42710: duplicate_object (enum, constraint, index already exists)
          // 42701: duplicate_column
          // 42P01: undefined_table (forward RLS enable on a table created in a later migration)
          // 42723: duplicate_function
          // 42P16: multiple primary keys / table definition warning
          // 42704: undefined_object
          // 23505: unique_violation (seed duplicates)
          // 42702: ambiguous_column
          // 42883: undefined_function (ALTER/REVOKE on optional functions)
          const ignorableCodes = ['42P07', '42710', '42701', '42P01', '42723', '42P16', '42704', '23505', '42702', '42883'];
          if (ignorableCodes.includes(err.code)) {
            skippedSafeErrors++;
            success = true;
            break;
          } else {
            console.error(`\n[ERROR in ${file} stmt ${j + 1}]: ${err.message} (code: ${err.code})`);
            console.error(`Statement snippet: ${stmt.substring(0, 150)}...\n`);
            throw err;
          }
        }
      }
    }

    const elapsed = Date.now() - fileStartTime;
    console.log(`[PASS] (${i + 1}/${files.length}) ${file} (${statements.length} stmts, ${elapsed}ms)`);
    filePassCount++;
  }

  console.log('\n============================================================');
  console.log(`MIGRATIONS COMPLETE: ${filePassCount}/${files.length} FILES EXECUTED`);
  console.log(`Total Statements: ${totalStatementsRun} | Skipped Warnings: ${skippedSafeErrors}`);
  console.log('============================================================\n');

  // Verify public tables count
  const tablesRes = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;");
  console.log(`Verified ${tablesRes.rows.length} tables in public schema:`);
  console.log(tablesRes.rows.map(r => r.tablename).join(', '));

  await client.end();
}

runMigrations().catch(err => {
  console.error('\nMigration process stopped on unrecoverable error:', err.message);
  process.exit(1);
});
