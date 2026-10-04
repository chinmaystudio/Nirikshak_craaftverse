const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'aws-0-ap-southeast-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ylyvhytlvwqebkyawdnq',
    password: 'chinmay8329016584@@',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  // 1. Check all schemas
  const schemas = await client.query("SELECT schema_name FROM information_schema.schemata;");
  console.log('Schemas:', schemas.rows.map(r => r.schema_name));

  // 2. Check auth schema tables
  const authTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth';");
  console.log('Auth tables:', authTables.rows.map(r => r.table_name));

  // 3. Check vault schema tables
  const vaultTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'vault';");
  console.log('Vault tables:', vaultTables.rows.map(r => r.table_name));

  // 4. Check supabase_functions or similar
  const subTables = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%secret%' OR table_name LIKE '%key%' OR table_name LIKE '%jwt%';");
  console.log('Key/Secret tables:', subTables.rows);

  await client.end();
}

main().catch(console.error);
