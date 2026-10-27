import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SCRIPT_ID = '1Hol-8rsthtC_PdY7Rhj0-VS-yZRl2Pyb7bM8kd8uytwms02lzKtbO-vX';
const DEPLOYMENT_ID = 'AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn';

async function main() {
  console.log('========================================================');
  console.log('🚀 DEPLOY GOOGLE APPS SCRIPT ABSENSI — NSR8899 BYPASS & 5-TAB');
  console.log('Script ID:', SCRIPT_ID);
  console.log('Deployment ID:', DEPLOYMENT_ID);
  console.log('========================================================\n');

  console.log('1. Menginisialisasi autentikasi Google API...');
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  console.log('2. Mengambil konten proyek GAS...');
  const proj = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = proj.data.files;
  console.log('   File di cloud:', files.map(f => `${f.name} (${f.type})`).join(', '));

  console.log('3. Membaca sumber lokal gas-absensi-Code.gs...');
  const codePath = path.join(ROOT_DIR, 'gas-absensi-Code.gs');
  const code = fs.readFileSync(codePath, 'utf8');

  const codeIndex = files.findIndex(f => f.name === 'Code');
  if (codeIndex === -1) throw new Error('File Code tidak ditemukan di GAS');
  files[codeIndex].source = code;

  const gpsPath = path.join(ROOT_DIR, 'GPS.html');
  if (fs.existsSync(gpsPath)) {
    const gpsIndex = files.findIndex(f => f.name === 'GPS');
    if (gpsIndex !== -1) {
      files[gpsIndex].source = fs.readFileSync(gpsPath, 'utf8');
      console.log('   ✓ GPS.html diperbarui');
    }
  }

  console.log('4. Mengunggah source code ke GAS...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files }
  });
  console.log('   ✓ Source code Code.gs berhasil diunggah!');

  console.log('5. Membuat versi baru...');
  const ver = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      description: 'v22: NSR8899 Master Token Bypass, Reset Failed Attempts Counter, 5-Tab Sync'
    }
  });
  const versionNumber = ver.data.versionNumber;
  console.log(`   ✓ Versi ${versionNumber} berhasil dibuat!`);

  console.log(`6. Memperbarui Deployment (${DEPLOYMENT_ID}) ke Versi ${versionNumber}...`);
  await script.projects.deployments.update({
    scriptId: SCRIPT_ID,
    deploymentId: DEPLOYMENT_ID,
    requestBody: {
      deploymentConfig: {
        scriptId: SCRIPT_ID,
        versionNumber,
        manifestFileName: 'appsscript',
        description: `Production Web App v${versionNumber} - NSR8899 Master Bypass & 5-Tab Sync`
      }
    }
  });
  console.log('   ✓ Deployment berhasil diperbarui ke versi ' + versionNumber + '!');

  // 7. Pengujian Endpoint Web App
  const webAppUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;
  console.log('\n7. Menguji Endpoint Web App Google Cloud (' + webAppUrl + ')...');

  async function testAction(action, payload = {}) {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    });
    return await res.json();
  }

  const tReset = await testAction('reset_failed_attempts', { nik: 'NSR-2019-005' });
  console.log('   [1] reset_failed_attempts NSR-2019-005:', tReset.status, tReset.message);

  const tBypass = await testAction('verifikasiOTP', { nik: 'NSR-2019-005', otp: 'NSR8899' });
  console.log('   [2] verifikasiOTP NSR8899 bypass:', tBypass.status || (tBypass.success ? 'success' : 'failed'), 'Message:', tBypass.message, 'SessionToken:', tBypass.sessionToken ? 'Valid' : 'None');

  const tMaster = await testAction('get_master_karyawan');
  console.log('   [3] get_master_karyawan:', tMaster.status, 'Total karyawan:', tMaster.rows?.length);

  const tAbsen = await testAction('get_absensi_all');
  console.log('   [4] get_absensi_all:', tAbsen.status, 'Total absensi:', tAbsen.rows?.length);

  const tCuti = await testAction('get_cuti_all');
  console.log('   [5] get_cuti_all:', tCuti.status, 'Total cuti:', tCuti.rows?.length);

  const tSummary = await testAction('get_dashboard_summary');
  console.log('   [6] get_dashboard_summary:', tSummary.status, 'Summary:', tSummary.summary);

  if (tBypass.success || tBypass.status === 'success') {
    console.log('\n========================================================');
    console.log('🎉 GOOGLE APPS SCRIPT BERHASIL DIPUBLIKASIKAN & LIVE AKTIF!');
    console.log('========================================================');
  } else {
    throw new Error('Verifikasi bypass NSR8899 di GAS gagal: ' + JSON.stringify(tBypass));
  }
}

main().catch(err => {
  console.error('Fatal Error Deployment GAS:', err);
  process.exit(1);
});
