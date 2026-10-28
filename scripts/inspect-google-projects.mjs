import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

async function main() {
  const authInfo = await initAuth({});
  if (!authInfo.credentials) {
    throw new Error('Not logged in!');
  }

  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  console.log('=== MEMERIKSA SPREADSHEET STAGING ===');
  const sheetId = '1X7kJ8tJbb_bOC08RWmy6us9O-U1fkoSRTxQ3rx8b9VY';
  try {
    const sMeta = await drive.files.get({ fileId: sheetId, fields: 'id, name, mimeType, trashed, parents' });
    console.log('Spreadsheet Staging ditemukan:', sMeta.data);
  } catch (err) {
    console.error('Error membaca spreadsheet staging:', err.message);
  }

  console.log('\n=== MEMERIKSA FOLDER DRIVE STAGING ===');
  const folderId = '1SP1qV6ky_ZyDZ3yrbgYr_HoyWxz9vvB1';
  try {
    const fMeta = await drive.files.get({ fileId: folderId, fields: 'id, name, mimeType, trashed' });
    console.log('Folder Staging ditemukan:', fMeta.data);
  } catch (err) {
    console.error('Error membaca folder staging:', err.message);
  }

  console.log('\n=== MEMERIKSA PROYEK APPS SCRIPT STAGING ===');
  const scriptId = '1rhoSmiU3bgTUwJhD5EgmCtHqybAn9oLPyeQaQlw8Ucv14AQHoCbaFvv6';
  try {
    const pMeta = await script.projects.get({ scriptId: scriptId });
    console.log('Proyek Script ditemukan:', {
      scriptId: pMeta.data.scriptId,
      title: pMeta.data.title,
      parentId: pMeta.data.parentId
    });
  } catch (err) {
    console.error('Error membaca proyek script:', err.message);
  }
}

main().catch(console.error);
