// scripts/dump-jo-script.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import fs from 'fs';
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1fEabBtkeN2D4O9C2efEKZKePIHqBSaGUN6BgiMtVh2s_9MYtf1gLwa_l';

async function main() {
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  for (const f of res.data.files) {
    fs.writeFileSync(`scratch_${f.name}.${f.type === 'JSON' ? 'json' : 'gs'}`, f.source, 'utf8');
    console.log(`Wrote scratch_${f.name} (length: ${f.source.length})`);
  }
}

main();
