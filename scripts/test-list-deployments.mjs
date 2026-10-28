// scripts/test-list-deployments.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1rNKsYZ_Rd2PAg47NcCbuwHKbSMYgpDbV0aVS2GHd57rxR0sR02daIZ5a';

async function main() {
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  const res = await script.projects.deployments.list({ scriptId: SCRIPT_ID });
  console.log('Deployments:', JSON.stringify(res.data, null, 2));
}

main();
