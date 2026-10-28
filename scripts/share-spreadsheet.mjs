// scripts/share-spreadsheet.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1Rg-1F4sZHvYvSamuvuslyBKN5Xe14_y3u7wn2VjNzbM';
const SCRIPT_ID = '1rNKsYZ_Rd2PAg47NcCbuwHKbSMYgpDbV0aVS2GHd57rxR0sR02daIZ5a';

async function main() {
  console.log('Authenticating Drive API...');
  const authInfo = await initAuth({});
  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });

  console.log('Sharing spreadsheet with anyone (writer)...');
  try {
    const res = await drive.permissions.create({
      fileId: SPREADSHEET_ID,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    });
    console.log('Spreadsheet permission response:', res.data);
  } catch (err) {
    console.error('Error sharing spreadsheet:', err.message);
  }

  console.log('Sharing script with anyone (writer)...');
  try {
    const res2 = await drive.permissions.create({
      fileId: SCRIPT_ID,
      requestBody: {
        role: 'writer',
        type: 'anyone'
      }
    });
    console.log('Script permission response:', res2.data);
  } catch (err) {
    console.error('Error sharing script:', err.message);
  }
}

main();
