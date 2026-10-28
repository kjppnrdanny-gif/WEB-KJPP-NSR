import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1X7kJ8tJbb_bOC08RWmy6us9O-U1fkoSRTxQ3rx8b9VY';

async function main() {
  const authInfo = await initAuth({});
  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });

  console.log('Memeriksa perizinan Spreadsheet Staging...');
  const perms = await drive.permissions.list({ fileId: SPREADSHEET_ID, fields: 'permissions(id, role, type, emailAddress)' });
  console.log('Permissions:', perms.data.permissions);
}

main().catch(console.error);
