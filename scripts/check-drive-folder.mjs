import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

async function checkFolder() {
  const authInfo = await initAuth({});
  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });
  const folder = await drive.files.get({
    fileId: '1SP1qV6ky_ZyDZ3yrbgYr_HoyWxz9vvB1',
    fields: 'id, name, modifiedTime, trashed'
  });
  console.log('Staging Drive Folder:', folder.data);

  const list = await drive.files.list({
    q: "'1SP1qV6ky_ZyDZ3yrbgYr_HoyWxz9vvB1' in parents and trashed = false",
    fields: 'files(id, name, mimeType, webViewLink)'
  });
  console.log('Files in Staging Folder:', list.data.files);
}
checkFolder().catch(console.error);
