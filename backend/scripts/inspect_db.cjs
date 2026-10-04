const { Client } = require('pg');

async function inspectDb() {
  const client = new Client({
    host: 'aws-0-ap-southeast-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ylyvhytlvwqebkyawdnq',
    password: 'chinmay8329016584@@',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL 17 on ylyvhytlvwqebkyawdnq!');

  // Check constraints on organizations
  const orgConstraints = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid) 
    FROM pg_constraint c 
    JOIN pg_class t ON c.conrelid = t.oid 
    WHERE t.relname = 'organizations';
  `);
  console.log('Organizations constraints:', orgConstraints.rows);

  // Check columns on organizations
  const orgCols = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    ORDER BY ordinal_position;
  `);
  console.log('Organizations columns:', orgCols.rows.map(r => `${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`));

  // Check columns on projects
  const projCols = await client.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'projects' 
    ORDER BY ordinal_position;
  `);
  console.log('Projects columns count:', projCols.rows.length);

  await client.end();
}

inspectDb().catch(console.error);
