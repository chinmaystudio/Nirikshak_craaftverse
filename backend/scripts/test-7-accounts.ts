import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmkhkgqyzevhxpxsrgng.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta2hrZ3F5emV2aHhweHNyZ25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNjE3NTIsImV4cCI6MjEwNTkzNzc1Mn0.xloAq7KOhn7wyGNSXKXuAZDLuu4dxEjXVNjby9zOgoU';

const accounts = [
  { role: 'GOVERNMENT', email: 'government.e2e@nirikshak.local', pass: 'NirikshakGovE2E#2026' },
  { role: 'CONTRACTOR 1', email: 'contractor1.e2e@nirikshak.local', pass: 'NirikshakC1#2026' },
  { role: 'CONTRACTOR 2', email: 'contractor2.e2e@nirikshak.local', pass: 'NirikshakC2#2026' },
  { role: 'CONTRACTOR 3', email: 'contractor3.e2e@nirikshak.local', pass: 'NirikshakC3#2026' },
  { role: 'CONTRACTOR 4', email: 'contractor4.e2e@nirikshak.local', pass: 'NirikshakC4#2026' },
  { role: 'CONTRACTOR 5', email: 'contractor5.e2e@nirikshak.local', pass: 'NirikshakC5#2026' },
  { role: 'CITIZEN', email: 'citizen.e2e@nirikshak.local', pass: 'NirikshakCitizenE2E#2026' },
];

async function check() {
  console.log('=== VERIFYING SUPABASE AUTH SIGN-IN FOR ALL 7 ACCOUNTS ===\n');
  let allPass = true;

  for (const acc of accounts) {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const res = await client.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });

    if (res.error) {
      console.log(`❌ ${acc.role} (${acc.email}): FAILED - ${res.error.message}`);
      allPass = false;
    } else {
      console.log(`✓ ${acc.role} (${acc.email}): LOGIN SUCCESS - User ID ${res.data.user.id}`);
    }
  }

  if (!allPass) process.exit(1);
}

check().catch(console.error);
