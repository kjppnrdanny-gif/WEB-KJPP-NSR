// scripts/test-gas-run.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1rNKsYZ_Rd2PAg47NcCbuwHKbSMYgpDbV0aVS2GHd57rxR0sR02daIZ5a';

async function main() {
  console.log('Testing script.scripts.run...');
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  try {
    const res = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: 'handleSetupDatabase_',
        devMode: true
      }
    });
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error running function:', err.message, err.response?.data || '');
  }
}

main();
