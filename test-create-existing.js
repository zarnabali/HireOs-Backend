const { createClient } = require('@supabase/supabase-js');
const { env } = require('./src/config/env');

Object.assign(globalThis, { WebSocket: require('ws') });

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testCreateUser() {
  console.log('Testing admin.createUser with existing email...');
  const start = Date.now();
  try {
    const res = await supabaseAdmin.auth.admin.createUser({
      email: `zarnab@example.com`, // assume this exists or use test-1783440120012@example.com
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { full_name: 'Test User' },
      app_metadata: { role: 'candidate' }
    });
    console.log(`Finished in ${Date.now() - start}ms`, res);
  } catch (err) {
    console.error(`Error after ${Date.now() - start}ms`, err);
  }
}

testCreateUser();
