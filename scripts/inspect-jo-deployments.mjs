// scripts/inspect-jo-deployments.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1fEabBtkeN2D4O9C2efEKZKePIHqBSaGUN6BgiMtVh2s_9MYtf1gLwa_l';

async function main() {
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  const res = await script.projects.deployments.list({ scriptId: SCRIPT_ID });
  console.log('Deployments:', JSON.stringify(res.data, null, 2));
}

main();
