import assert from 'node:assert';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const GAS_DRIVE_URL = 'https://script.google.com/macros/s/AKfycbyHSr5eOHzJFaStZ0xwLLIddf5rD6VCdydRHI5O7khtMzuuCv_GCy6vwGnuTFssAghh/exec';
const PORT = 8433;
const BASE_PHP = `http://127.0.0.1:${PORT}`;

console.log('================================================================');
console.log('   PENGUJIAN INTEGRASI GOOGLE DRIVE RIIL (GAS PRODUCTION)       ');
console.log('   Akun Google Drive: kjppnr.danny (OPINI NSR)                 ');
console.log('================================================================\n');

async function testDirectGasEndpoint() {
  console.log('--- TAHAP 1: Pengujian Langsung ke Endpoint Produksi GAS ---');
  console.log(`URL: ${GAS_DRIVE_URL}`);

  const payload = {
    action: 'create_job_folder',
    tahun: '2026',
    kode_cabang: 'PST',
    kode_trk: 'TRK-TEST-REAL',
    nama_debitur: 'Uji Integrasi Drive Danny'
  };

  console.log('Mengirimkan payload:', JSON.stringify(payload));
  const startTime = Date.now();
  const res = await fetch(GAS_DRIVE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow'
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Respons diterima dalam ${durationSec} detik. Status HTTP: ${res.status}`);

  assert.strictEqual(res.status, 200, 'HTTP status harus 200');
  const json = await res.json();

  assert.strictEqual(json.status, 'success', 'Status JSON harus success');
  const data = json.data || json;

  assert.ok(data.folder_id, 'folder_id harus ada');
  assert.ok(data.folder_url, 'folder_url harus ada');
  assert.ok(data.folder_url.startsWith('https://drive.google.com/drive/folders/'), 'folder_url harus menuju domain Google Drive riil');

  console.log(`[PASS] Folder Induk Penugasan Tercipta Nyata:`);
  console.log(`       - Nama Folder : ${data.folder_name || 'TRK-TEST-REAL - Uji Integrasi Drive Danny'}`);
  console.log(`       - Folder ID   : ${data.folder_id}`);
  console.log(`       - Folder URL  : ${data.folder_url}`);
  if (data.path) console.log(`       - Direktori   : ${data.path}`);

  // Validasi 5 Subfolder Standar
  const expectedSubfolders = [
    '01_Dokumen_Yuridis_SPK',
    '02_Foto_Inspeksi_Geotag',
    '03_Data_Pasar_Pembanding',
    '04_Kertas_Kerja_Analisis',
    '05_Laporan_Final_PDF'
  ];

  const sub = data.subfolders || {};
  console.log('\n[PASS] Memverifikasi 5 Subfolder Standar Fisik:');
  expectedSubfolders.forEach((subName, i) => {
    let subItem = sub[subName];
    if (!subItem && Array.isArray(sub)) {
      subItem = sub.find(s => s.name === subName);
    }
    assert.ok(subItem, `Subfolder ${subName} harus ada dalam respons`);
    assert.ok(subItem.url, `Subfolder ${subName} harus memiliki URL`);
    assert.ok(subItem.url.startsWith('https://drive.google.com/drive/folders/'), `URL subfolder ${subName} harus valid`);
    console.log(`       ${i + 1}. [✓] ${subName} -> ${subItem.url}`);
  });

  return data;
}

async function testBackendIntegration() {
  console.log('\n--- TAHAP 2: Pengujian Integrasi End-to-End via Backend Handler PHP ---');
  
  const phpExtDir = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\\ext';
  const phpArgs = [
    '-d', `extension_dir=${phpExtDir}`,
    '-d', 'extension=curl',
    '-d', 'extension=openssl',
    '-S', `127.0.0.1:${PORT}`,
    'backend/job-tracking-handler.php'
  ];
  const phpServer = spawn('php', phpArgs);
  await new Promise(r => setTimeout(r, 1200));

  try {
    const timestamp = Date.now().toString().slice(-4);
    const testJo = `JO-PST-2026-REAL-${timestamp}`;
    const testDebitur = `PT Danny Solusi Digital ${timestamp}`;

    console.log(`Mendaftarkan penugasan baru di M-01: ${testJo}`);
    const regPayload = {
      jo_number: testJo,
      spk_number: `SPK/NSR-PST/${timestamp}/2026`,
      pemberi_tugas: 'PT Bank Central Asia Tbk',
      pengguna_laporan: 'PT Bank Central Asia Tbk - Divisi Bisnis Komersial',
      debitur: testDebitur,
      jenis_properti: 'Gedung Kantor Komersial 5 Lantai',
      lokasi_aset: 'Jl. Jenderal Sudirman Kav. 28, Jakarta Pusat',
      kantor: 'Kantor Pusat Jakarta',
      client_pic_name: 'Bapak Kevin Hartono',
      client_pic_phone: '081299881122',
      penilai_publik: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)'
    };

    const regRes = await fetch(`${BASE_PHP}/?action=create_job_order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload)
    });

    const regJson = await regRes.json();
    assert.strictEqual(regJson.status, 'success');
    const job = regJson.data;

    console.log(`[PASS] Registrasi M-01 Sukses. Data Drive tersimpan di database:`);
    console.log(`       - Nomor JO         : ${job.jo_number}`);
    console.log(`       - Kode Lacak TRK   : ${job.kode_lacak}`);
    console.log(`       - Drive Folder URL : ${job.drive_folder_url}`);
    console.log(`       - Evidence Link    : ${job.evidence_link}`);
    console.log(`       - Total Subfolder  : ${job.subfolders.length}`);

    assert.ok(job.drive_folder_url.startsWith('https://drive.google.com/drive/folders/'));
    assert.strictEqual(job.drive_folder_url, job.evidence_link);
    assert.strictEqual(job.subfolders.length, 5);

    // Verifikasi Audit Log
    const auditRes = await fetch(`${BASE_PHP}/?action=get_audit_log&jo=${job.jo_number}`);
    const auditJson = await auditRes.json();
    const driveAudit = (auditJson.data || []).find(a => a.milestone_baru === 'M-01-DRIVE-PROVISION');
    assert.ok(driveAudit, 'Audit log M-01-DRIVE-PROVISION harus tercatat');
    console.log(`[PASS] Audit Trail Tersimpan: [${driveAudit.milestone_baru}] -> ${driveAudit.catatan_progres}`);

    // Verifikasi Penyekaan KEPI pada Endpoint Publik
    const trackRes = await fetch(`${BASE_PHP}/?action=track&jo=${job.kode_lacak}`);
    const trackJson = await trackRes.json();
    assert.strictEqual(trackJson.data.drive_folder_url, undefined, 'KEPI Guard: drive_folder_url harus diseka');
    assert.strictEqual(trackJson.data.evidence_link, undefined, 'KEPI Guard: evidence_link harus diseka');
    assert.strictEqual(trackJson.data.subfolders, undefined, 'KEPI Guard: subfolders harus diseka');
    console.log('[PASS] Proteksi KEPI Terverifikasi: URL folder internal 100% aman diseka dari publik!');

    return job;
  } finally {
    phpServer.kill();
  }
}

async function main() {
  const directData = await testDirectGasEndpoint();
  const backendJob = await testBackendIntegration();

  console.log('\n================================================================');
  console.log('🏆 INTEGRASI GOOGLE DRIVE RIIL (kjppnr.danny) SUKSES 100%! 🏆');
  console.log('================================================================');
  console.log('\nRingkasan Tautan Folder Nyata yang Terbuat di Google Drive:');
  console.log(`1. Test Uji Langsung : ${directData.folder_url}`);
  console.log(`2. Test M-01 Backend  : ${backendJob.drive_folder_url}`);
}

main().catch(err => {
  console.error('\n[FAIL] Terjadi kesalahan dalam pengujian:', err);
  process.exit(1);
});
