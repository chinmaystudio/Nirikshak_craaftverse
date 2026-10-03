import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dmkhkgqyzevhxpxsrgng.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta2hrZ3F5emV2aHhweHNyZ25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNjE3NTIsImV4cCI6MjEwNTkzNzc1Mn0.xloAq7KOhn7wyGNSXKXuAZDLuu4dxEjXVNjby9zOgoU';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const E2E_ACCOUNTS = [
  {
    email: 'government.e2e@nirikshak.local',
    password: 'NirikshakGovE2E#2026',
    role: 'government_admin',
    fullName: 'Chief Engineer (PIMA)',
    orgName: 'Pune Infrastructure Monitoring Authority',
    orgType: 'government',
  },
  {
    email: 'contractor1.e2e@nirikshak.local',
    password: 'NirikshakC1#2026',
    role: 'contractor_admin',
    fullName: 'Apex Infrastructure Admin',
    orgName: 'Apex Infrastructure Pvt Ltd',
    orgType: 'contractor',
  },
  {
    email: 'contractor2.e2e@nirikshak.local',
    password: 'NirikshakC2#2026',
    role: 'contractor_admin',
    fullName: 'Bharat Urban Admin',
    orgName: 'Bharat Urban Engineering Ltd',
    orgType: 'contractor',
  },
  {
    email: 'contractor3.e2e@nirikshak.local',
    password: 'NirikshakC3#2026',
    role: 'contractor_admin',
    fullName: 'Crestline Infra Admin',
    orgName: 'Crestline Infra Projects Pvt Ltd',
    orgType: 'contractor',
  },
  {
    email: 'contractor4.e2e@nirikshak.local',
    password: 'NirikshakC4#2026',
    role: 'contractor_admin',
    fullName: 'Deccan Civil Admin',
    orgName: 'Deccan Civil Engineering Ltd',
    orgType: 'contractor',
  },
  {
    email: 'contractor5.e2e@nirikshak.local',
    password: 'NirikshakC5#2026',
    role: 'contractor_admin',
    fullName: 'Evergreen Smart Admin',
    orgName: 'Evergreen Smart Infrastructure Pvt Ltd',
    orgType: 'contractor',
  },
  {
    email: 'citizen.e2e@nirikshak.local',
    password: 'NirikshakCitizenE2E#2026',
    role: 'citizen',
    fullName: 'E2E Citizen Tester',
    orgName: null,
    orgType: null,
  },
];

async function setup() {
  console.log('=== SIGNING UP / REGISTERING 7 E2E ACCOUNTS VIA SUPABASE AUTH API ===\n');

  for (const acc of E2E_ACCOUNTS) {
    console.log(`Processing ${acc.email} (${acc.role})...`);
    // Attempt sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: acc.email,
      password: acc.password,
      options: {
        data: {
          full_name: acc.fullName,
          role: acc.role,
        },
      },
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error(`SignUp error for ${acc.email}:`, signUpError.message);
    } else {
      console.log(`Registered via Supabase Auth GoTrue endpoint: ${acc.email}`);
    }
  }

  console.log('\n=== DONE REGISTERING. Next step: confirm emails & wire orgs ===');
}

setup().catch((e) => {
  console.error('Setup failed:', e);
  process.exit(1);
});
