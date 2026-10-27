// scripts/deploy-integrated-gas.mjs
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

const SCRIPT_ID = '1fEabBtkeN2D4O9C2efEKZKePIHqBSaGUN6BgiMtVh2s_9MYtf1gLwa_l';
const DEPLOYMENT_ID = 'AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d';
const TRACKING_SPREADSHEET_ID = '1Rg-1F4sZHvYvSamuvuslyBKN5Xe14_y3u7wn2VjNzbM';

async function main() {
  console.log('========================================================');
  console.log('🚀 DEPLOY INTEGRASI GAS ENGINE TRACKING & PENUGASAN');
  console.log('Script ID:', SCRIPT_ID);
  console.log('Deployment ID:', DEPLOYMENT_ID);
  console.log('Tracking SSOT Spreadsheet ID:', TRACKING_SPREADSHEET_ID);
  console.log('========================================================\n');

  console.log('1. Autentikasi via Clasp...');
  const authInfo = await initAuth({});
  const script = google.script({ version: 'v1', auth: authInfo.credentials });

  console.log('2. Mengambil konten proyek GAS live...');
  const proj = await script.projects.getContent({ scriptId: SCRIPT_ID });
  let files = proj.data.files;
  console.log('   File live:', files.map(f => `${f.name} (${f.type})`).join(', '));

  // Ambil source Kode.gs
  const kodeIndex = files.findIndex(f => f.name === 'Kode');
  if (kodeIndex === -1) throw new Error('File Kode tidak ditemukan di project');
  let kodeSource = files[kodeIndex].source;

  // Siapkan modul JobTracking
  const gasTrackingPath = path.join(ROOT_DIR, 'gas-job-tracking.gs');
  let trackingSource = fs.readFileSync(gasTrackingPath, 'utf8');

  // Set Spreadsheet ID di JobTracking
  trackingSource = trackingSource.replace(
    /SPREADSHEET_ID:\s*['"][^'"]*['"]/,
    `SPREADSHEET_ID: '${TRACKING_SPREADSHEET_ID}'`
  );

  // Rename fungsi di trackingSource agar modular
  trackingSource = trackingSource.replace(/function getSpreadsheet_\(\)/g, 'function getTrackingSpreadsheet_()');
  trackingSource = trackingSource.replace(/getSpreadsheet_\(\)/g, 'getTrackingSpreadsheet_()');
  trackingSource = trackingSource.replace(/function handleSetupDatabase_\(\)/g, 'function handleSetupTrackingDatabase_()');
  trackingSource = trackingSource.replace(/handleSetupDatabase_\(\)/g, 'handleSetupTrackingDatabase_()');

  // Hindari bentrok doGet dan doPost dengan Kode.gs
  trackingSource = trackingSource.replace('function doGet(e)', 'function trackingDoGet_(e)');
  trackingSource = trackingSource.replace('function doPost(e)', 'function trackingDoPost_(e)');

  // Sekarang pastikan Kode.gs merutekan action tracking di doGet dan doPost
  if (!kodeSource.includes('handlePublicTrack_')) {
    console.log('3. Menyuntikkan routing Job Tracking ke Kode.gs...');

    // Inject ke doGet(e)
    const doGetTarget = 'const params = (e && e.parameter) || {};';
    const doGetReplacement = `const params = (e && e.parameter) || {};

    // --- INTEGRASI MODUL JOB TRACKING 7 MILESTONE ---
    if (params.action === 'track_public' || params.action === 'track') {
      const jo = (params.id_jo || params.jo || '').trim();
      const phone = (params.telepon_pic || params.phone || '').trim();
      return handlePublicTrack_(jo, phone);
    }
    if (params.action === 'get_active_jobs' || params.action === 'list') {
      return handleGetActiveJobs_();
    }
    if (params.action === 'get_mitra_sla') {
      return handleGetMitraSla_();
    }
    if (params.action === 'setup_database' || params.action === 'setup_tracking_database') {
      return handleSetupTrackingDatabase_();
    }`;

    kodeSource = kodeSource.replace(doGetTarget, doGetReplacement);

    // Inject ke doPost(e) sebelum pengecekan auth token jika action adalah track publik
    const doPostTarget = 'const action = payload.action || \'CREATE_SUBMISSION\';';
    const doPostReplacement = `const action = payload.action || 'CREATE_SUBMISSION';

    // --- BYPASS OTORISASI UNTUK PELACAKAN PUBLIK JOB TRACKING ---
    if (action === 'track_public' || action === 'track') {
      const jo = (payload.id_jo || payload.jo || '').trim();
      const phone = (payload.telepon_pic || payload.phone || '').trim();
      return handlePublicTrack_(jo, phone);
    }
    if (action === 'get_active_jobs' || action === 'list') {
      return handleGetActiveJobs_();
    }
    if (action === 'get_mitra_sla') {
      return handleGetMitraSla_();
    }
    if (action === 'setup_database' || action === 'setup_tracking_database') {
      return handleSetupTrackingDatabase_();
    }
    if (action === 'create_job_order' || action === 'create_tracking_job') {
      return handleCreateJobOrder_(payload);
    }
    if (action === 'advance_milestone') {
      return handleAdvanceMilestone_(payload);
    }`;

    kodeSource = kodeSource.replace(doPostTarget, doPostReplacement);
    files[kodeIndex].source = kodeSource;
  }

  // Tambah atau update file JobTracking di project
  const trackingFileIndex = files.findIndex(f => f.name === 'JobTracking');
  if (trackingFileIndex >= 0) {
    files[trackingFileIndex].source = trackingSource;
  } else {
    files.push({
      name: 'JobTracking',
      type: 'SERVER_JS',
      source: trackingSource
    });
  }

  console.log('4. Mengunggah perubahan ke cloud Apps Script...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files }
  });
  console.log('   ✓ File Kode.gs dan JobTracking.gs berhasil diperbarui di cloud!');

  console.log('5. Membuat Versi Rilis Baru...');
  const verRes = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      description: 'v6.0: Full Integration 7-Milestone Job Tracking SSOT (2 BTN Scenarios & Penilai Pelaksana)'
    }
  });
  const newVersion = verRes.data.versionNumber;
  console.log(`   ✓ Versi baru: v${newVersion}`);

  console.log(`6. Memperbarui Deployment Publik (${DEPLOYMENT_ID}) ke Versi ${newVersion}...`);
  const updateRes = await script.projects.deployments.update({
    scriptId: SCRIPT_ID,
    deploymentId: DEPLOYMENT_ID,
    requestBody: {
      deploymentConfig: {
        scriptId: SCRIPT_ID,
        versionNumber: newVersion,
        manifestFileName: 'appsscript',
        description: `Production Web App v${newVersion} - Integrated 7-Milestone Tracking Engine`
      }
    }
  });

  const ep = updateRes.data.entryPoints?.find(e => e.entryPointType === 'WEB_APP');
  const webAppUrl = ep ? ep.webApp?.url : `https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec`;

  console.log('   ✓ Deployment berhasil diperbarui!');
  console.log('   ✓ Live Web App URL:', webAppUrl);

  // Simpan ke konfigurasi cloud
  const configOutput = {
    spreadsheetTitle: 'DATABASE TRACING PENUGASAN - KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN',
    spreadsheetId: TRACKING_SPREADSHEET_ID,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${TRACKING_SPREADSHEET_ID}/edit`,
    scriptId: SCRIPT_ID,
    deploymentId: DEPLOYMENT_ID,
    webAppUrl: webAppUrl,
    version: newVersion,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(ROOT_DIR, 'data/job_tracking_cloud_config.json'),
    JSON.stringify(configOutput, null, 2),
    'utf8'
  );
  console.log('   ✓ Konfigurasi disimpan ke data/job_tracking_cloud_config.json');

  console.log('\n7. Menginisialisasi Database Spreadsheet via Web App...');
  const setupUrl = `${webAppUrl}?action=setup_database`;
  console.log('   Calling:', setupUrl);
  const setupRes = await fetch(setupUrl, { redirect: 'follow' });
  const setupText = await setupRes.text();
  console.log('   Status setup:', setupRes.status);
  console.log('   Respons setup:', setupText.substring(0, 300));
}

main().catch(err => {
  console.error('Deployment error:', err);
  process.exit(1);
});
