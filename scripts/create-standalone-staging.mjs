import fs from 'fs';
import path from 'path';
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1X7kJ8tJbb_bOC08RWmy6us9O-U1fkoSRTxQ3rx8b9VY';
const FOLDER_ID = '1SP1qV6ky_ZyDZ3yrbgYr_HoyWxz9vvB1';

async function main() {
  const authInfo = await initAuth({});
  if (!authInfo.credentials) throw new Error('Not logged in');

  const script = google.script({ version: 'v1', auth: authInfo.credentials });
  const drive = google.drive({ version: 'v3', auth: authInfo.credentials });

  console.log('1. Membuat Proyek Standalone Google Apps Script untuk Staging...');
  const newProj = await script.projects.create({
    requestBody: {
      title: '[STAGING] Portal Absensi KJPP NSR'
    }
  });
  const scriptId = newProj.data.scriptId;
  console.log('✓ Proyek Standalone berhasil dibuat! Script ID:', scriptId);

  // Pindahkan file proyek ke dalam folder Drive Staging
  try {
    await drive.files.update({
      fileId: scriptId,
      addParents: FOLDER_ID,
      fields: 'id, parents'
    });
    console.log('✓ File proyek dipindahkan ke folder Staging Drive');
  } catch(e) {
    console.log('Catatan parent folder:', e.message);
  }

  console.log('2. Membaca kode lokal Code.gs dan GPS.html...');
  const codeGsSource = fs.readFileSync('gas-absensi-Code.gs', 'utf8');
  const gpsHtmlSource = fs.readFileSync('GPS.html', 'utf8');

  const manifest = {
    timeZone: 'Asia/Jakarta',
    dependencies: {},
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    webapp: {
      executeAs: 'USER_DEPLOYING',
      access: 'ANYONE'
    }
  };

  console.log('3. Mengunggah source code ke proyek standalone...');
  await script.projects.updateContent({
    scriptId,
    requestBody: {
      files: [
        {
          name: 'appsscript',
          type: 'JSON',
          source: JSON.stringify(manifest, null, 2)
        },
        {
          name: 'Code',
          type: 'SERVER_JS',
          source: codeGsSource
        },
        {
          name: 'GPS',
          type: 'HTML',
          source: gpsHtmlSource
        }
      ]
    }
  });
  console.log('✓ File Code.gs dan GPS.html berhasil diunggah!');

  console.log('4. Membuat Versi 1...');
  const ver = await script.projects.versions.create({
    scriptId,
    requestBody: {
      description: 'Staging Production Candidate - NIK + OTP Gmail Pribadi & Session Token'
    }
  });
  const versionNumber = ver.data.versionNumber;
  console.log('✓ Versi berhasil dibuat: Versi', versionNumber);

  console.log('5. Membuat Deployment Web App Publik (Execute as: Me / Access: Anyone)...');
  const deploy = await script.projects.deployments.create({
    scriptId,
    requestBody: {
      versionNumber,
      description: 'Staging Web App v1',
      manifestFileName: 'appsscript'
    }
  });

  const deploymentId = deploy.data.deploymentId;
  const ep = deploy.data.entryPoints?.find(e => e.entryPointType === 'WEB_APP');
  const webAppUrl = ep ? ep.webApp?.url : `https://script.google.com/macros/s/${deploymentId}/exec`;

  console.log('\n========================================================');
  console.log('🎉 STANDALONE STAGING WEB APP BERHASIL DIDEPLOY!');
  console.log('🔗 URL WEB APP STAGING:', webAppUrl);
  console.log('========================================================\n');

  fs.writeFileSync('scripts/staging-webapp-url.txt', webAppUrl);
}

main().catch(console.error);
