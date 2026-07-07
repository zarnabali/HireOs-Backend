import { supabaseAdmin } from './src/config/supabase';

async function testStorage() {
  console.log('Testing storage connection...');
  const start = Date.now();
  try {
    const { data, error } = await supabaseAdmin.storage.getBucket('resumes');
    console.log(`Finished in ${Date.now() - start}ms`, { data, error });
  } catch (err) {
    console.error(`Crashed in ${Date.now() - start}ms`, err);
  }
}

testStorage();
