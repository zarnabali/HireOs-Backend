const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const values = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    values[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }

  return values;
}

const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('Missing backend/.env. Create it from .env.example first.');
  process.exit(1);
}

const env = loadEnv(envPath);
const dbUrl = env.SUPABASE_POOLER_CONNECTION_STRING || env.SUPABASE_CONNECTION_STRING;

if (!dbUrl) {
  console.error('Missing SUPABASE_CONNECTION_STRING or SUPABASE_POOLER_CONNECTION_STRING in backend/.env.');
  process.exit(1);
}

const args = ['supabase', 'db', 'push', '--db-url', dbUrl, ...process.argv.slice(2)];
const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

process.exit(result.status ?? 1);
