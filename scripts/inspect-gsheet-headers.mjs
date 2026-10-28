// scripts/inspect-gsheet-headers.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1Rg-1F4sZHvYvSamuvuslyBKN5Xe14_y3u7wn2VjNzbM';

async function main() {
  const auth = await initAuth({});
  const sheets = google.sheets({ version: 'v4', auth: auth.credentials });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'DATA_PENUGASAN!1:4'
  });
  console.log('Headers:', JSON.stringify(res.data.values[0]));
  if (res.data.values[1]) {
    console.log('Row 1:', JSON.stringify(res.data.values[1]));
  }
}

main().catch(console.error);
