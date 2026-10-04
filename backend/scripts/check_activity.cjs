const { Client } = require('pg');

async function check() {
  const client = new Client({
    host: 'aws-0-ap-southeast-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.ylyvhytlvwqebkyawdnq',
    password: 'chinmay8329016584@@',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query("SELECT pid, state, wait_event_type, wait_event, query_start, query FROM pg_stat_activity WHERE state != 'idle' AND pid != pg_backend_pid();");
  console.log('Active queries:', res.rows.length);
  for (const r of res.rows) {
    console.log(`PID ${r.pid} [${r.state} / ${r.wait_event}]: ${r.query.substring(0, 100)}`);
  }
  await client.end();
}
check().catch(console.error);
