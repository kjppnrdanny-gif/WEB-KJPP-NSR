// scripts/find-existing-scripts.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

async function main() {
  const authInfo = await initAuth({});
  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });

  console.log('Searching for Google Apps Script files in Google Drive...');
  const res = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.script' and trashed = false",
    fields: 'files(id, name, createdTime, modifiedTime)',
    pageSize: 30
  });

  console.log('Found scripts:', res.data.files);
}

main();
