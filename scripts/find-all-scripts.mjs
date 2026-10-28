import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

async function findScripts() {
  const authInfo = await initAuth({});
  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });
  const list = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.script' and trashed = false",
    fields: 'files(id, name, modifiedTime, parents)'
  });
  console.log('Apps Script Projects found:', list.data.files);
}
findScripts().catch(console.error);
