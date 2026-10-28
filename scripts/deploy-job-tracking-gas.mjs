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

const SPREADSHEET_ID = '1Rg-1F4sZHvYvSamuvuslyBKN5Xe14_y3u7wn2VjNzbM';
const SCRIPT_ID = '1rNKsYZ_Rd2PAg47NcCbuwHKbSMYgpDbV0aVS2GHd57rxR0sR02daIZ5a';

async function deployGAS() {
  console.log('========================================================');
  console.log('🚀 DEPLOY GOOGLE APPS SCRIPT ENGINE JOB TRACKING');
  console.log('Spreadsheet ID:', SPREADSHEET_ID);
  console.log('Script ID:', SCRIPT_ID);
  console.log('========================================================\n');

  console.log('1. Menginisialisasi autentikasi Google API via Clasp...');
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  console.log('2. Membaca sumber lokal gas-job-tracking.gs...');
  const gasCodePath = path.join(ROOT_DIR, 'gas-job-tracking.gs');
  let gasSource = fs.readFileSync(gasCodePath, 'utf8');

  // Pastikan SPREADSHEET_ID terkonfigurasi di dalam skrip
  gasSource = gasSource.replace(
    /SPREADSHEET_ID:\s*['"][^'"]*['"]/,
    `SPREADSHEET_ID: '${SPREADSHEET_ID}'`
  );

  const manifest = JSON.stringify({
    timeZone: 'Asia/Jakarta',
    dependencies: {},
    exceptionLogging: 'STACKDRIVER',
    runtimeVersion: 'V8',
    webapp: {
      executeAs: 'USER_DEPLOYING',
      access: 'ANYONE'
    }
  }, null, 2);

  console.log('3. Mengunggah source code ke Apps Script...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: {
      files: [
        {
          name: 'appsscript',
          type: 'JSON',
          source: manifest
        },
        {
          name: 'Code',
          type: 'SERVER_JS',
          source: gasSource
        }
      ]
    }
  });
  console.log('   ✓ Source code berhasil diunggah ke cloud!');

  console.log('4. Membuat versi rilis baru...');
  const verRes = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      description: 'v1.0: Dedicated SSOT 7-Milestone Engine (2 BTN Scenarios & Penilai Pelaksana)'
    }
  });
  const versionNumber = verRes.data.versionNumber;
  console.log(`   ✓ Versi terbit: v${versionNumber}`);

  console.log('5. Membuat deployment Web App...');
  const deployRes = await script.projects.deployments.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      versionNumber: versionNumber,
      description: 'Production Web App v1.0'
    }
  });

  const deploymentId = deployRes.data.deploymentId;
  const webAppUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
  console.log(`   ✓ Deployment ID: ${deploymentId}`);
  console.log(`   ✓ Web App URL: ${webAppUrl}`);

  // Simpan konfigurasi cloud
  const configOutput = {
    spreadsheetTitle: 'DATABASE TRACING PENUGASAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN',
    spreadsheetId: SPREADSHEET_ID,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
    scriptId: SCRIPT_ID,
    deploymentId: deploymentId,
    webAppUrl: webAppUrl,
    deployedAt: new Date().toISOString()
  };

  const configPath = path.join(ROOT_DIR, 'data', 'job_tracking_cloud_config.json');
  fs.writeFileSync(configPath, JSON.stringify(configOutput, null, 2), 'utf8');
  console.log(`   ✓ Konfigurasi disimpan ke: data/job_tracking_cloud_config.json`);

  return configOutput;
}

deployGAS().catch(err => {
  console.error('Deployment error:', err);
  process.exit(1);
});
