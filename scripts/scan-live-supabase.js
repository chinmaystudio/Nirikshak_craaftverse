#!/usr/bin/env node

/**
 * NIRIKSHAK Craftverse - Live Mode Supabase Direct Access Static Security Scanner
 * Enforces Phase 16: Detects any direct production use of supabase.auth, supabase.from,
 * supabase.rpc, supabase.storage, supabase.channel outside strictly whitelisted files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendSrcDir = path.join(rootDir, 'frontend', 'src');

const FORBIDDEN_PATTERNS = [
  /supabase\.auth\./,
  /supabase\.from\(/,
  /supabase\.rpc\(/,
  /supabase\.storage\./,
  /supabase\.channel\(/,
];

// Whitelisted files that are allowed for compatibility/demo fallback wrappers
const WHITELIST = new Set([
  'lib/auth/authClient.ts',
  'lib/storage/storage.service.ts',
  'lib/realtime/realtime.service.ts',
  'core/supabase/client.ts',
  'lib/supabase/client.ts',
  'lib/supabase/database.types.ts',
  'modules/government/api/supabaseApi.ts',
  'modules/user/services/auth/authService.ts',
  'modules/user/services/complaints/complaintsService.ts',
  'modules/government/services/approvals.service.ts',
  'modules/government/services/complaints.service.ts',
  'modules/contractor/services/progress.service.ts',
  'modules/government/services/projects.service.ts',
  'modules/government/services/procurement.service.ts',
  'modules/government/services/finance.service.ts',
  'modules/government/pages/dashboard/DashboardPage.tsx',
  'modules/contractor/pages/auth/ContractorForgotPasswordPage.tsx',
  'modules/contractor/pages/auth/ContractorResetPasswordPage.tsx',
  'modules/government/pages/access-requests/AccessRequestsPage.tsx',
  'core/realtime/RealtimeStatusIndicator.tsx',
  'modules/user/landing/components/ReportsSection.tsx',
]);

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

console.log('============================================================');
console.log('NIRIKSHAK LIVE SUPABASE STATIC SECURITY SCAN');
console.log('============================================================');

const files = getAllFiles(frontendSrcDir);
let violations = 0;

for (const filePath of files) {
  const relPath = path.relative(frontendSrcDir, filePath).replace(/\\/g, '/');
  if (WHITELIST.has(relPath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        console.error(`[VIOLATION] ${relPath}:${i + 1} contains direct Supabase access: "${line.trim()}"`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n❌ FAILED: ${violations} forbidden direct Supabase call(s) detected outside whitelist!`);
  process.exit(1);
} else {
  console.log(`\n✔ PASSED: Scanned ${files.length} frontend source files. Zero direct un-whitelisted Supabase calls found.`);
  process.exit(0);
}
