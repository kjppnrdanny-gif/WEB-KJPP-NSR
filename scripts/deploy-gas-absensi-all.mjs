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
  console.log('🚀 DEPLOY GOOGLE APPS SCRIPT ABSENSI — SMART OTP RESEND & 15M TTL');
  console.log('Script ID:', SCRIPT_ID);
  console.log('Deployment ID:', DEPLOYMENT_ID);
  console.log('========================================================\n');

  console.log('1. Menginisialisasi autentikasi Google API via Clasp...');
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  console.log('2. Mengambil konten proyek GAS dari cloud...');
  const proj = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = proj.data.files;
  console.log('   File di cloud:', files.map(f => `${f.name} (${f.type})`).join(', '));

  console.log('3. Membaca sumber lokal gas-absensi-Code.gs & GPS.html...');
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

  console.log('4. Mengunggah source code ke Google Apps Script...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files }
  });
  console.log('   ✓ Source code Code.gs dan GPS.html berhasil diunggah!');

  console.log('5. Membuat versi baru...');
  const ver = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      description: 'v24: Smart Resend Idempotent OTP, 15m TTL, 5 Attempts Threshold, Alamat Email Database Sync'
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
        description: `Production Web App v${versionNumber} - Smart Resend OTP 15m TTL`
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

  // Test [1]: Reset Counter Percobaan Gagal
  const tReset = await testAction('reset_failed_attempts', { nik: 'NSR-2019-005' });
  console.log('   [1] reset_failed_attempts NSR-2019-005:', tReset.status, tReset.message);

  // Test [2]: Token Bypass NSR8899
  const tBypass = await testAction('verifikasiOTP', { nik: 'NSR-2019-005', otp: 'NSR8899' });
  console.log('   [2] verifikasiOTP NSR8899 bypass:', tBypass.status || (tBypass.success ? 'success' : 'failed'), 'Message:', tBypass.message);

  // Test [3]: Cek Karyawan Tanpa Email (NSR-2019-014 Yanto)
  const tNoEmail = await testAction('mintaOTP', { nik: 'NSR-2019-014', pdpNoticeVersion: 'PDP-NSR-2026' });
  console.log('   [3] mintaOTP Tanpa Email (NSR-2019-014):', tNoEmail.status || 'error', 'Pesan:', tNoEmail.message);

  // Test [4]: Master Karyawan Roster
  const tMaster = await testAction('get_master_karyawan');
  console.log('   [4] get_master_karyawan:', tMaster.status, 'Total karyawan:', tMaster.rows?.length);

  // Test [5]: Dashboard Summary
  const tSummary = await testAction('get_dashboard_summary');
  console.log('   [5] get_dashboard_summary:', tSummary.status, 'Summary:', tSummary.summary);

  if ((tBypass.success || tBypass.status === 'success') && String(tNoEmail.message).includes('Alamat email resmi belum terdaftar')) {
    console.log('\n========================================================');
    console.log('🎉 GOOGLE APPS SCRIPT v' + versionNumber + ' RESMI LIVE & TERVERIFIKASI!');
    console.log('========================================================\n');
  } else {
    throw new Error('Verifikasi GAS v' + versionNumber + ' tidak memenuhi kriteria: ' + JSON.stringify({ tBypass, tNoEmail }));
  }
}

main().catch(err => {
  console.error('Fatal Error Deployment GAS:', err);
  process.exit(1);
});
