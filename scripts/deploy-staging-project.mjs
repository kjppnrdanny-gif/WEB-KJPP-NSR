import fs from 'fs';
import path from 'path';
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

async function main() {
  const authInfo = await initAuth({});
  if (!authInfo.credentials) {
    throw new Error('Not logged in!');
  }

  const script = google.script({ version: 'v1', auth: authInfo.credentials });
  const scriptId = '1rhoSmiU3bgTUwJhD5EgmCtHqybAn9oLPyeQaQlw8Ucv14AQHoCbaFvv6';

  console.log('1. Mengambil konten proyek staging saat ini...');
  const currentContent = await script.projects.getContent({ scriptId });
  console.log('File yang ada saat ini:', currentContent.data.files.map(f => f.name + ' (' + f.type + ')'));

  // Ambil manifest appsscript.json yang ada
  const manifestFile = currentContent.data.files.find(f => f.type === 'JSON' && f.name === 'appsscript');
  const manifestSource = manifestFile ? manifestFile.source : JSON.stringify({
    timeZone: 'Asia/Jakarta',
    dependencies: {},
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    webapp: {
      executeAs: 'USER_DEPLOYING',
      access: 'ANYONE'
    }
  }, null, 2);

  // Baca gas-absensi-Code.gs dan GPS.html lokal
  const codeGsSource = fs.readFileSync('gas-absensi-Code.gs', 'utf8');
  const gpsHtmlSource = fs.readFileSync('GPS.html', 'utf8');

  console.log('2. Mengunggah file gas-absensi-Code.gs dan GPS.html ke proyek staging...');
  const newFiles = [
    {
      name: 'appsscript',
      type: 'JSON',
      source: manifestSource
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
  ];

  const updateRes = await script.projects.updateContent({
    scriptId,
    requestBody: {
      files: newFiles
    }
  });
  console.log('✓ Update konten script berhasil!');

  console.log('3. Membuat versi baru (createVersion)...');
  const versionRes = await script.projects.versions.create({
    scriptId,
    requestBody: {
      description: 'Staging Release - NIK + OTP Gmail Pribadi & Session Token'
    }
  });
  const versionNumber = versionRes.data.versionNumber;
  console.log('✓ Versi proyek dibuat: Versi', versionNumber);

  console.log('4. Memeriksa deployment Web App yang ada...');
  const deploymentsRes = await script.projects.deployments.list({ scriptId });
  const existingDeployments = deploymentsRes.data.deployments || [];
  console.log('Deployments yang ada:', existingDeployments.map(d => ({
    id: d.deploymentId,
    desc: d.deploymentConfig?.description,
    version: d.deploymentConfig?.versionNumber
  })));

  console.log('4. Membuat deployment Web App baru...');
  const createDeploy = await script.projects.deployments.create({
    scriptId,
    requestBody: {
      versionNumber: versionNumber,
      description: 'Staging Release - NIK + OTP Gmail Pribadi (Versi ' + versionNumber + ')',
      manifestFileName: 'appsscript'
    }
  });

  const deploymentId = createDeploy.data.deploymentId;
  const ep = createDeploy.data.entryPoints?.find(e => e.entryPointType === 'WEB_APP');
  const webAppUrl = ep ? ep.webApp?.url : `https://script.google.com/macros/s/${deploymentId}/exec`;

  console.log('\n========================================================');
  console.log('🎉 DEPLOYMENT WEB APP STAGING BERHASIL!');
  console.log('🔗 URL STAGING WEB APP:', webAppUrl);
  console.log('========================================================\n');
}

main().catch(console.error);
