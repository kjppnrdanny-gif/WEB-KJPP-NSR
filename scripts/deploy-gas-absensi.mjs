import fs from 'node:fs';
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const SCRIPT_ID = '1Hol-8rsthtC_PdY7Rhj0-VS-yZRl2Pyb7bM8kd8uytwms02lzKtbO-vX';
const DEPLOYMENT_ID = 'AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn';

async function main() {
  console.log('========================================================');
  console.log('🚀 DEPLOY GOOGLE APPS SCRIPT ABSENSI — HEADER RESMI NSR');
  console.log('Script ID:', SCRIPT_ID);
  console.log('Deployment ID:', DEPLOYMENT_ID);
  console.log('========================================================\n');

  console.log('1. Menginisialisasi autentikasi Google API...');
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  console.log('2. Mengambil konten proyek GAS...');
  const proj = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = proj.data.files;
  console.log('   File yang ditemukan:', files.map(f => `${f.name} (${f.type})`).join(', '));

  console.log('3. Membaca sumber lokal gas-absensi-Code.gs dan GPS.html...');
  const codeGsSource = fs.readFileSync('gas-absensi-Code.gs', 'utf8');
  const gpsHtmlSource = fs.readFileSync('GPS.html', 'utf8');

  const codeIndex = files.findIndex(f => f.name === 'Code');
  if (codeIndex === -1) throw new Error('File Code tidak ditemukan di proyek GAS');
  files[codeIndex].source = codeGsSource;

  const gpsIndex = files.findIndex(f => f.name === 'GPS');
  if (gpsIndex === -1) throw new Error('File GPS tidak ditemukan di proyek GAS');
  files[gpsIndex].source = gpsHtmlSource;

  console.log('4. Mengunggah source code ke Google Apps Script...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files }
  });
  console.log('   ✓ Source code Code.gs dan GPS.html berhasil diunggah!');

  console.log('5. Membuat Versi Baru Proyek...');
  const verRes = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      description: 'Footer Presensi Interaktif: Modal Pemberitahuan Privasi Karyawan (UU PDP No. 27/2022), Tautan Resmi Kebijakan Privasi & Disclaimer Profesi'
    }
  });
  const versionNumber = verRes.data.versionNumber;
  console.log(`   ✓ Versi ${versionNumber} berhasil dibuat!`);

  console.log(`6. Memperbarui Deployment Publik (${DEPLOYMENT_ID}) ke Versi ${versionNumber}...`);
  const updateRes = await script.projects.deployments.update({
    scriptId: SCRIPT_ID,
    deploymentId: DEPLOYMENT_ID,
    requestBody: {
      deploymentConfig: {
        scriptId: SCRIPT_ID,
        versionNumber,
        manifestFileName: 'appsscript',
        description: `Production Web App v${versionNumber} - Footer Presensi Interaktif UU PDP`
      }
    }
  });

  const ep = updateRes.data.entryPoints?.find(e => e.entryPointType === 'WEB_APP');
  const webAppUrl = ep ? ep.webApp?.url : `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

  console.log('\n========================================================');
  console.log(`🎉 DEPLOYMENT GOOGLE APPS SCRIPT SUKSES KE VERSI ${versionNumber}!`);
  console.log('🔗 URL Live Web App:', webAppUrl);
  console.log('========================================================');
}

main().catch(err => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});
