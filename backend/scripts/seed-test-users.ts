import { createClient, type User } from '@supabase/supabase-js';
import 'dotenv/config';

if (process.env.ALLOW_TEST_USERS !== 'true') throw new Error('Set ALLOW_TEST_USERS=true explicitly.');
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required; anon keys are not accepted.');

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const accounts = [
  ['government.test@nirikshak.local', 'TEST_GOVERNMENT_PASSWORD', 'NirikshakGov#2026', 'Government Test Administrator', 'NIRIKSHAK Test Government Authority', 'government', 'government_admin'],
  ['contractor.test@nirikshak.local', 'TEST_CONTRACTOR_PASSWORD', 'NirikshakContractor#2026', 'Contractor Test Administrator', 'NIRIKSHAK Test Contractor', 'contractor', 'contractor_admin'],
  ['citizen.test@nirikshak.local', 'TEST_CITIZEN_PASSWORD', 'NirikshakCitizen#2026', 'Citizen Test User', null, null, 'citizen'],
] as const;

async function findUser(email: string): Promise<User | null> {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 100) return null;
  }
}

export async function seedTestUsers(): Promise<void> {
  for (const [email, passwordEnv, fallbackPassword, fullName, orgName, orgType, role] of accounts) {
    let user = await findUser(email);
    const attributes = {
      password: process.env[passwordEnv] || fallbackPassword,
      email_confirm: true,
      user_metadata: { ...(user?.user_metadata || {}), full_name: fullName },
      app_metadata: { ...(user?.app_metadata || {}), role, test_account: true },
    };
    const result = user ? await supabase.auth.admin.updateUserById(user.id, attributes) : await supabase.auth.admin.createUser({ email, ...attributes });
    if (result.error) throw result.error;
    user = result.data.user;

    const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, full_name: fullName, updated_at: new Date().toISOString() });
    if (profileError) throw profileError;
    if (orgName && orgType) {
      const { data: org, error: orgError } = await supabase.from('organizations')
        .upsert({ name: orgName, type: orgType, verified: true }, { onConflict: 'name' }).select('id').single();
      if (orgError) throw orgError;
      const { error: memberError } = await supabase.from('organization_members').upsert({
        organization_id: org.id, user_id: user.id, role, status: 'active', updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,user_id' });
      if (memberError) throw memberError;
    }
    console.log(`Seeded ${email} (${role})`);
  }
}

seedTestUsers().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
