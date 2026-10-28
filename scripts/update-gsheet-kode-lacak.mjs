// scripts/update-gsheet-kode-lacak.mjs
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1Rg-1F4sZHvYvSamuvuslyBKN5Xe14_y3u7wn2VjNzbM';

async function updateGSheet() {
  console.log('1. Autentikasi Google Sheets API...');
  const authInfo = await initAuth({});
  const sheets = google.sheets({ version: 'v4', auth: authInfo.credentials });

  console.log('2. Memeriksa header dan kolom DATA_PENUGASAN...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'DATA_PENUGASAN!1:10'
  });

  const values = res.data.values || [];
  if (values.length === 0) {
    throw new Error('Tab DATA_PENUGASAN kosong');
  }

  const headers = values[0];
  console.log('Current headers:', headers);

  let kodeColIdx = headers.indexOf('kode_lacak');
  if (kodeColIdx === -1) {
    console.log('3. Menambahkan kolom kode_lacak ke header...');
    // Kita tambahkan kolom kode_lacak di akhir header
    kodeColIdx = headers.length;
    headers.push('kode_lacak');
    
    // Konversi col index ke letter A, B, C...
    const colLetter = String.fromCharCode(65 + kodeColIdx);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `DATA_PENUGASAN!${colLetter}1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['kode_lacak']]
      }
    });
    console.log(`✓ Kolom kode_lacak ditambahkan pada kolom ${colLetter}`);
  } else {
    console.log(`Kolom kode_lacak sudah ada pada indeks ${kodeColIdx}`);
  }

  const colLetter = String.fromCharCode(65 + kodeColIdx);

  // 4. Update data baris dengan kode lacak
  // Baris 2: JO-JKT-2026-0001 -> TRK-JKT-2026-A89F
  // Baris 3: JO-JKT-2026-0002 -> TRK-JKT-2026-C42B
  console.log('4. Memperbarui nilai kode_lacak pada baris penugasan...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `DATA_PENUGASAN!${colLetter}2:${colLetter}3`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['TRK-JKT-2026-A89F'],
        ['TRK-JKT-2026-C42B']
      ]
    }
  });

  console.log('✓ Nilai TRK-JKT-2026-A89F & TRK-JKT-2026-C42B berhasil disimpan di Google Spreadsheet SSOT!');
}

updateGSheet().catch(err => {
  console.error('Error updating GSheet:', err);
  process.exit(1);
});
