import fs from 'fs';
import { google } from 'googleapis';

const SCRIPT_ID = '1Hol-8rsthtC_PdY7Rhj0-VS-yZRl2Pyb7bM8kd8uytwms02lzKtbO-vX';
const DEPLOYMENT_ID = 'AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn';

let code = fs.readFileSync('gas-absensi-Code.gs', 'utf8');

const targetStr = "res = getMasterKaryawanFull();";
if (!code.includes("action === 'getAbsensiAll'")) {
  code = code.replace(
    targetStr,
    "res = getMasterKaryawanFull();\n    } else if (action === 'getAbsensiAll' || action === 'getRekapPresensiHariIni') {\n      res = getAbsensiAll();"
  );
  console.log('[OK] Added action getAbsensiAll to doPost routing!');
}

fs.writeFileSync('gas-absensi-Code.gs', code, 'utf8');

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
    description: 'Support getAbsensiAll for HR Dashboard live attendance sync'
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
      description: 'HR Dashboard SSOT Attendance Sync'
    }
  }
});
console.log('   ✓ Deployment berhasil diperbarui!');

// 5. Test getAbsensiAll
console.log('5. Menguji getAbsensiAll via POST...');
const res = await fetch(`https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action: 'getAbsensiAll' })
});
const data = await res.json();
console.log('Status getAbsensiAll:', data.status, 'Total absensi rows:', data.rows?.length);
console.log('Available sheets in spreadsheet:', data.availableSheets);
console.log('Headers:', data.headers);
if (data.rows && data.rows.length > 0) {
  console.log('Sample latest record:', data.rows[data.rows.length - 1]);
}
