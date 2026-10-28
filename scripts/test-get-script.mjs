// scripts/test-get-script.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

async function main() {
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  const testIds = [
    '1GEPR7ZVUBMnlWi3ks9dAJzoqKA47phzwLYpk_IgDt1b43EUD7ykWiWFh',
    '1fEabBtkeN2D4O9C2efEKZKePIHqBSaGUN6BgiMtVh2s_9MYtf1gLwa_l',
    '1Hol-8rsthtC_PdY7Rhj0-VS-yZRl2Pyb7bM8kd8uytwms02lzKtbO-vX'
  ];

  for (const id of testIds) {
    try {
      const res = await script.projects.getContent({ scriptId: id });
      console.log(`Success for ${id}:`, res.data.files?.map(f => f.name));
    } catch (e) {
      console.log(`Failed for ${id}:`, e.message);
    }
  }
}

main();
