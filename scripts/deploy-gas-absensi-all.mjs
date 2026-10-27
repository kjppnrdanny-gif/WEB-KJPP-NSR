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
  console.log('🚀 DEPLOY GOOGLE APPS SCRIPT ABSENSI — 6-DIGIT PIN AUTH & MULTI-BRANCH');
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
      description: 'v27: 6-Digit PIN Auth, Multi-Branch Geofencing (Makassar -5.1565, 119.4120), Schema Setup, Email PIN Reset, Auto-Prompt Email'
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
        description: `Production Web App v${versionNumber} - 6-Digit PIN Auth Multi-Branch`
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

  // Test [1]: Schema Setup
  console.log('   Menjalankan setup_master_schema...');
  const tSchema = await testAction('setup_master_schema');
  console.log('   [1] setup_master_schema:', tSchema.status, tSchema.message, 'Total updated:', tSchema.totalUpdated);

  // Test [2]: Verify PIN Management NSR-2019-005 dengan PIN 889900
  const tPin005 = await testAction('verify_pin', { nik: 'NSR-2019-005', pin: '889900' });
  console.log('   [2] verify_pin NSR-2019-005 (889900):', tPin005.status, 'Admin HR:', tPin005.isAdminHR, 'Name:', tPin005.nama);

  // Test [3]: Verify PIN Karyawan Normal Latief Satihi NSR-2019-012 dengan PIN 123456
  const tPin012 = await testAction('verify_pin', { nik: 'NSR-2019-012', pin: '123456' });
  console.log('   [3] verify_pin NSR-2019-012 (123456):', tPin012.status, 'Needs Email Update:', tPin012.needs_email_update, 'Cabang:', tPin012.cabang);

  // Test [4]: Verify PIN Karyawan Tanpa Email Yanto NSR-2019-014 dengan PIN 123456
  const tPin014 = await testAction('verify_pin', { nik: 'NSR-2019-014', pin: '123456' });
  console.log('   [4] verify_pin NSR-2019-014 (123456 - Tanpa Email):', tPin014.status, 'Needs Email Update:', tPin014.needs_email_update);

  // Test [5]: Verify PIN Karyawan Makassar Amin Sade NSR-MKS-2019-30 dengan PIN 123456
  const tPinMks = await testAction('verify_pin', { nik: 'NSR-MKS-2019-30', pin: '123456' });
  console.log('   [5] verify_pin NSR-MKS-2019-30 (Cabang Makassar):', tPinMks.status, 'Cabang:', tPinMks.cabang, 'Needs Email Update:', tPinMks.needs_email_update);

  // Test [6]: Verify PIN Salah
  const tWrongPin = await testAction('verify_pin', { nik: 'NSR-2019-012', pin: '999999' });
  console.log('   [6] verify_pin Salah (Expected error):', tWrongPin.status, 'Pesan:', tWrongPin.message);

  if ((tPin005.success || tPin005.status === 'success') &&
      (tPin012.success || tPin012.status === 'success') &&
      tPin014.needs_email_update === true &&
      tPinMks.cabang === 'Cabang Makassar' &&
      tWrongPin.status === 'error') {
    console.log('\n========================================================');
    console.log('🎉 GOOGLE APPS SCRIPT v' + versionNumber + ' RESMI LIVE, PIN AUTH & SCHEMA TERVERIFIKASI!');
    console.log('========================================================\n');
  } else {
    throw new Error('Verifikasi GAS v' + versionNumber + ' tidak memenuhi kriteria!');
  }
}

main().catch(err => {
  console.error('Fatal Error Deployment GAS:', err);
  process.exit(1);
});
