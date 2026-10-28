// scripts/inspect-kode-gs.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1fEabBtkeN2D4O9C2efEKZKePIHqBSaGUN6BgiMtVh2s_9MYtf1gLwa_l';

async function main() {
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });
  const proj = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const kode = proj.data.files.find(f => f.name === 'Kode');
  const tracking = proj.data.files.find(f => f.name === 'JobTracking');

  console.log('--- KODE.GS (doGet snippet) ---');
  const doGetMatch = kode.source.match(/function doGet\(e\)[\s\S]*?return/);
  console.log(doGetMatch ? doGetMatch[0] : 'not found');

  console.log('\n--- Searching "Gagal memuat status endpoint" in Kode.gs ---');
  const lines = kode.source.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('Gagal memuat status endpoint') || l.includes('setup_database')) {
      console.log(`L${idx+1}: ${l}`);
    }
  });

  console.log('\n--- JOBTRACKING.GS (check function declarations) ---');
  console.log('JobTracking length:', tracking?.source?.length);
  const tLines = tracking?.source?.split('\n') || [];
  tLines.forEach((l, idx) => {
    if (l.includes('function getTrackingSpreadsheet_') || l.includes('function handleSetupTrackingDatabase_')) {
      console.log(`JobTracking L${idx+1}: ${l}`);
    }
  });
}

main().catch(console.error);
