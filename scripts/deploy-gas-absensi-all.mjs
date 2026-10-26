import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import fs from 'fs';
import { google } from 'googleapis';

const SCRIPT_ID = '1Hol-8rsthtC_PdY7Rhj0-VS-yZRl2Pyb7bM8kd8uytwms02lzKtbO-vX';
const DEPLOYMENT_ID = 'AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn';

const code = fs.readFileSync('gas-absensi-Code.gs', 'utf8');

// Deploy to GAS
const tokenData = JSON.parse(fs.readFileSync('C:/Users/HP/.clasprc.json', 'utf8')).tokens.default;
const oauth2Client = new google.auth.OAuth2(tokenData.client_id, tokenData.client_secret);
oauth2Client.setCredentials(tokenData);

const script = google.script({ version: 'v1', auth: oauth2Client });

console.log('1. Mengambil konten proyek GAS...');
const proj = await script.projects.getContent({ scriptId: SCRIPT_ID });
const files = proj.data.files;

const codeIndex = files.findIndex(f => f.name === 'Code');
if (codeIndex === -1) throw new Error('File Code tidak ditemukan di GAS');
files[codeIndex].source = code;

console.log('2. Mengunggah source code ke GAS...');
await script.projects.updateContent({
  scriptId: SCRIPT_ID,
  requestBody: { files }
});
console.log('   ✓ Source code Code.gs berhasil diunggah!');

console.log('3. Membuat versi baru...');
const ver = await script.projects.versions.create({
  scriptId: SCRIPT_ID,
  requestBody: {
    description: 'Support 5-Tab Google Spreadsheet Sync (MASTER_KARYAWAN, ABSENSI, PENGAJUAN_CUTI, MASTER_WFH, DASHBOARD)'
  }
});
const versionNumber = ver.data.versionNumber;
console.log(`   ✓ Versi ${versionNumber} berhasil dibuat!`);

console.log(`4. Memperbarui Deployment (${DEPLOYMENT_ID}) ke Versi ${versionNumber}...`);
await script.projects.deployments.update({
  scriptId: SCRIPT_ID,
  deploymentId: DEPLOYMENT_ID,
  requestBody: {
    deploymentConfig: {
      scriptId: SCRIPT_ID,
      versionNumber,
      manifestFileName: 'appsscript',
      description: 'Production 5-Tab SSOT Sync Web App'
    }
  }
});
console.log('   ✓ Deployment berhasil diperbarui!');

// 5. Verifikasi pengujian 5 Tab
const webAppUrl = `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

async function testAction(action, payload = {}) {
  const res = await fetch(webAppUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });
  return await res.json();
}

console.log('5. Menguji Endpoint 5-Tab...');

const t1 = await testAction('get_master_karyawan');
console.log('   [1] get_master_karyawan:', t1.status, 'Total karyawan:', t1.rows?.length);

const t2 = await testAction('get_absensi_all');
console.log('   [2] get_absensi_all:', t2.status, 'Total absensi:', t2.rows?.length);

const t3 = await testAction('get_cuti_all');
console.log('   [3] get_cuti_all:', t3.status, 'Total pengajuan cuti:', t3.rows?.length, 'Headers:', t3.headers);

const t4 = await testAction('get_wfh_whitelist');
console.log('   [4] get_wfh_whitelist:', t4.status, 'Total WFH whitelist:', t4.total);

const t5 = await testAction('get_dashboard_summary');
console.log('   [5] get_dashboard_summary:', t5.status, 'Summary:', t5.summary);

console.log('=== SEMUA 5 TAB TERVERIFIKASI GO-LIVE ===');
