import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SPREADSHEET_ID = '12gf52mLEAizuFvP03DiGddxX6HiYqD6UO5CF0Cl_C3E';

async function main() {
  const authInfo = await initAuth({});
  const sheets = google.sheets({ version: 'v4', auth: authInfo.credentials });

  // Get spreadsheet metadata
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  console.log('Sheets in spreadsheet:', meta.data.sheets.map(s => s.properties.title));

  for (const s of meta.data.sheets) {
    const title = s.properties.title;
    if (title === 'ABSENSI' || title === 'Presensi' || title === 'DASHBOARD') {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${title}!A1:Z100`
      });
      const rows = res.data.values || [];
      console.log(`\n=== Sheet: ${title} (Total rows: ${rows.length}) ===`);
      const matches = rows.filter(r => r.some(c => String(c).includes('08:18:32') || String(c).includes('Dhea')));
      console.log('Matches:', matches);
    }
  }
}

main().catch(console.error);
