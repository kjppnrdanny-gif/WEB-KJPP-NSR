import { authorize, getUnauthorizedOuth2Client, getUserInfo, initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/script.deployments',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.webapp.deploy',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/service.management',
  'https://www.googleapis.com/auth/logging.read',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cloud-platform',
];

async function main() {
  console.log('Inisialisasi otorisasi Google Apps Script (clasp)...');
  const authInfo = await initAuth({});
  const oauth2Client = getUnauthorizedOuth2Client();
  console.log('Menjalankan server otorisasi lokal pada port 8990...');
  
  // Custom flow untuk print auth URL ke console juga
  const client = await authorize({
    store: authInfo.credentialStore,
    userKey: authInfo.user,
    oauth2Client,
    scopes: DEFAULT_SCOPES,
    noLocalServer: false,
    redirectPort: 8990
  });
  const user = await getUserInfo(client);
  console.log('LOGIN BERHASIL! User Google:', user);
}

main().catch(console.error);
