import fs from 'fs';
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1Hol-8rsthtC_PdY7Rhj0-VS-yZRl2Pyb7bM8kd8uytwms02lzKtbO-vX';
const DEPLOYMENT_ID = 'AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn';

async function main() {
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  console.log('1. Membaca konten proyek & source Code.gs terbaru...');
  const proj = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = proj.data.files;

  const codeGsSource = fs.readFileSync('gas-absensi-Code.gs', 'utf8');
  const codeIndex = files.findIndex(f => f.name === 'Code');
  files[codeIndex].source = codeGsSource;

  const gpsSource = fs.readFileSync('GPS.html', 'utf8');
  const gpsIndex = files.findIndex(f => f.name === 'GPS');
  if (gpsIndex !== -1) {
    files[gpsIndex].source = gpsSource;
  }

  console.log('2. Mengunggah source code ke proyek standalone...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files }
  });
  console.log('✓ Source code terupdate!');

  console.log('3. Membuat Versi 7 (PRODUCTION GO-LIVE RELEASE)...');
  const ver = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      description: 'Production Go-Live Release - Database 12gf52mLEAizuFvP03DiGddxX6HiYqD6UO5CF0Cl_C3E'
    }
  });
  const versionNumber = ver.data.versionNumber;
  console.log('✓ Versi baru:', versionNumber);

  console.log('4. Memperbarui Deployment ID:', DEPLOYMENT_ID);
  const updateRes = await script.projects.deployments.update({
    scriptId: SCRIPT_ID,
    deploymentId: DEPLOYMENT_ID,
    requestBody: {
      deploymentConfig: {
        scriptId: SCRIPT_ID,
        versionNumber,
        manifestFileName: 'appsscript',
        description: 'Staging Web App v3'
      }
    }
  });

  const ep = updateRes.data.entryPoints?.find(e => e.entryPointType === 'WEB_APP');
  const webAppUrl = ep ? ep.webApp?.url : `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

  console.log('========================================================');
  console.log('🎉 DEPLOYMENT BERHASIL DIPERBARUI KE VERSI', versionNumber);
  console.log('🔗 URL WEB APP STAGING:', webAppUrl);
  console.log('========================================================');
}

main().catch(console.error);
