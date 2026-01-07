/**
 * Diagnostic script for card creation issues
 * Run with: node diagnose-cards.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = join(__dirname, '.env.local');
let envContent;
try {
  envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
} catch (err) {
  console.error('⚠️  Could not read .env.local, using existing environment variables');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  console.log('🔍 Diagnosing card creation issue...\n');

  // 1. Check authentication
  console.log('1️⃣ Checking authentication...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('❌ Not authenticated. Please log in to your app first.');
    console.error('   This script uses the same browser session.');
    process.exit(1);
  }

  const userId = session.user.id;
  console.log(`✅ Authenticated as: ${userId}\n`);

  // 2. Check if user can read decks
  console.log('2️⃣ Testing deck read access...');
  const { data: decks, error: decksError } = await supabase
    .from('decks')
    .select('id, name')
    .eq('user_id', userId)
    .limit(5);

  if (decksError) {
    console.error('❌ Cannot read decks:', decksError.message);
    process.exit(1);
  }

  console.log(`✅ Can read decks (found ${decks.length})`);
  if (decks.length === 0) {
    console.error('❌ No decks found. Please create a deck first.');
    process.exit(1);
  }

  const testDeck = decks[0];
  console.log(`   Using deck: "${testDeck.name}" (${testDeck.id})\n`);

  // 3. Test card table schema
  console.log('3️⃣ Testing card table structure...');

  // Try to read cards table (should work even if empty)
  const { error: readError } = await supabase
    .from('cards')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (readError) {
    console.error('❌ Cannot read cards table:', readError.message);
    process.exit(1);
  }

  console.log('✅ Can read cards table\n');

  // 4. Test INSERT with minimal payload
  console.log('4️⃣ Testing card insert with minimal payload...');
  const minimalPayload = {
    user_id: userId,
    deck_id: testDeck.id,
    front: 'Diagnostic Test Front',
    back: 'Diagnostic Test Back',
  };

  console.log('   Payload:', JSON.stringify(minimalPayload, null, 2));

  const { data: minimalCard, error: minimalError } = await supabase
    .from('cards')
    .insert(minimalPayload)
    .select()
    .single();

  if (minimalError) {
    console.error('❌ Minimal insert failed:');
    console.error('   Message:', minimalError.message || '(empty)');
    console.error('   Code:', minimalError.code || '(empty)');
    console.error('   Details:', minimalError.details || '(empty)');
    console.error('   Hint:', minimalError.hint || '(empty)');
    console.error('   Full error:', JSON.stringify(minimalError, null, 2));
    console.log('\n⚠️  DIAGNOSIS: Minimal insert failed - this indicates a database-level issue.\n');
    process.exit(1);
  }

  console.log('✅ Minimal insert succeeded');
  console.log(`   Card ID: ${minimalCard.id}\n`);

  // 5. Test INSERT with full payload
  console.log('5️⃣ Testing card insert with full payload...');
  const fullPayload = {
    user_id: userId,
    deck_id: testDeck.id,
    front: 'Diagnostic Test Front (Full)',
    back: 'Diagnostic Test Back (Full)',
    type: 'basic',
    state: 'new',
    suspended: false,
    interval_days: 0,
    ease: 2.50,
    reps: 0,
    lapses: 0,
    learning_step_index: 0,
    due_at: new Date().toISOString(),
  };

  const { data: fullCard, error: fullError } = await supabase
    .from('cards')
    .insert(fullPayload)
    .select()
    .single();

  if (fullError) {
    console.error('❌ Full insert failed:');
    console.error('   Message:', fullError.message || '(empty)');
    console.error('   Code:', fullError.code || '(empty)');
    console.error('   Details:', fullError.details || '(empty)');
    console.error('   Hint:', fullError.hint || '(empty)');
    console.error('\n⚠️  DIAGNOSIS: Full payload insert failed.\n');

    // Cleanup the minimal card
    await supabase.from('cards').delete().eq('id', minimalCard.id);
    process.exit(1);
  }

  console.log('✅ Full insert succeeded');
  console.log(`   Card ID: ${fullCard.id}\n`);

  // 6. Cleanup test cards
  console.log('6️⃣ Cleaning up test cards...');
  const { error: deleteError } = await supabase
    .from('cards')
    .delete()
    .in('id', [minimalCard.id, fullCard.id]);

  if (deleteError) {
    console.warn('⚠️  Failed to delete test cards:', deleteError.message);
    console.log('   Please delete them manually:');
    console.log(`   - ${minimalCard.id}`);
    console.log(`   - ${fullCard.id}`);
  } else {
    console.log('✅ Test cards deleted\n');
  }

  // 7. Summary
  console.log('✅ ✅ ✅ ALL TESTS PASSED ✅ ✅ ✅\n');
  console.log('The database is working correctly.');
  console.log('If the app still fails, the issue is in the client-side code or auth flow.\n');
  console.log('Next steps:');
  console.log('1. Clear browser cache and cookies');
  console.log('2. Log out and log back in');
  console.log('3. Try creating a card again');
  console.log('4. Check browser console for detailed error logs\n');
}

diagnose().catch(err => {
  console.error('💥 Unexpected error:', err);
  process.exit(1);
});
