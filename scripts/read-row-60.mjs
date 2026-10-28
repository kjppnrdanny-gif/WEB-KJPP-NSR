import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const PROD_SPREADSHEET_ID = '12gf52mLEAizuFvP03DiGddxX6HiYqD6UO5CF0Cl_C3E';

async function main() {
  const authInfo = await initAuth({});
  const sheets = google.sheets({ version: 'v4', auth: authInfo.credentials });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: PROD_SPREADSHEET_ID,
      range: 'ABSENSI!A58:N60',
    });
    console.log('ABSENSI A58:N60:');
    console.log(JSON.stringify(res.data.values, null, 2));
  } catch (e) {
    console.log('Sheets API error:', e.message);
  }
}

main().catch(console.error);
