import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

async function testDriveCreate() {
  console.log("Testing drive.files.create for spreadsheet...");
  const authInfo = await initAuth({});
  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });

  const res = await drive.files.create({
    requestBody: {
      name: 'DATABASE TRACING PENUGASAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN',
      mimeType: 'application/vnd.google-apps.spreadsheet'
    },
    fields: 'id, name, webViewLink'
  });

  console.log("SUCCESS! Created file:", res.data);
  return res.data;
}

testDriveCreate().catch(err => {
  console.error("Drive create failed:", err.message);
});
