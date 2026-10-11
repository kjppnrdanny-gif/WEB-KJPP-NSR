import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';
import fs from 'fs';

const PROD_SPREADSHEET_ID = '12gf52mLEAizuFvP03DiGddxX6HiYqD6UO5CF0Cl_C3E';

async function backup() {
  console.log('=== MEMULAI BACKUP AMAN GOOGLE DRIVE PRODUKSI ===');
  const authInfo = await initAuth({});
  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });

  const backupName = `[BACKUP RESMI PRE-GO-LIVE ${new Date().toISOString().slice(0, 10)}] DATABASE ABSENSI KJPP NSR`;
  console.log('Membuat salinan cadangan:', backupName);

  const backupRes = await drive.files.copy({
    fileId: PROD_SPREADSHEET_ID,
    requestBody: {
      name: backupName
    }
  });

  const backupId = backupRes.data.id;
  console.log('✓ BACKUP DATABASE PRODUKSI BERHASIL DIBUAT!');
  console.log('ID Backup:', backupId);
  console.log('Nama Backup:', backupRes.data.name);

  fs.writeFileSync('scripts/prod-backup-info.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    sourceSpreadsheetId: PROD_SPREADSHEET_ID,
    backupFileId: backupId,
    backupFileName: backupName
  }, null, 2));

  return backupId;
}

backup().catch(console.error);
