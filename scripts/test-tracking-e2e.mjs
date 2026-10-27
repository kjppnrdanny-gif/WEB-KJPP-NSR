// scripts/test-tracking-e2e.mjs
import fs from 'fs';
import path from 'path';

const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec';

async function runE2ETests() {
  console.log('========================================================');
  console.log('🧪 PENGUJIAN END-TO-END (E2E) JOB TRACKING SYSTEM SSOT');
  console.log('Target Endpoint:', GAS_WEB_APP_URL);
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  // TEST 1: Track Scenario 1 - Bank BTN KPR Retail
  try {
    console.log('--- TEST 1: Track Scenario 1 (JO-JKT-2026-0001 - BTN KPR Retail) ---');
    const url = `${GAS_WEB_APP_URL}?action=track&jo=JO-JKT-2026-0001`;
    const res = await fetch(url, { redirect: 'follow' });
    const json = await res.json();
    console.log('Status code:', res.status);
    console.log('Result status:', json.status);
    console.log('JO Number:', json.data?.jo_number);
    console.log('Debitur:', json.data?.debitur);
    console.log('Aset:', json.data?.jenis_properti);
    console.log('Current Milestone:', json.data?.current_milestone);
    console.log('Milestone Title:', json.data?.current_milestone_title);
    console.log('Progress:', json.data?.progress_percent + '%');

    if (json.status === 'success' && ['M-04', 'M-05', 'M-06'].includes(json.data?.current_milestone) && json.data?.debitur?.includes('Hendra')) {
      console.log('✓ TEST 1 PASSED: Skenario 1 BTN KPR Retail terverifikasi!\n');
      passed++;
    } else {
      console.error('✗ TEST 1 FAILED: Unexpected response:', json);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 1 EXCEPTION:', err.message);
    failed++;
  }

  // TEST 2: Track Scenario 2 - Bank BTN Gudang Komersial
  try {
    console.log('--- TEST 2: Track Scenario 2 (JO-JKT-2026-0002 - BTN Gudang Pulogadung) ---');
    const url = `${GAS_WEB_APP_URL}?action=track&jo=JO-JKT-2026-0002`;
    const res = await fetch(url, { redirect: 'follow' });
    const json = await res.json();
    console.log('Status code:', res.status);
    console.log('Result status:', json.status);
    console.log('JO Number:', json.data?.jo_number);
    console.log('Debitur:', json.data?.debitur);
    console.log('Aset:', json.data?.jenis_properti);
    console.log('Current Milestone:', json.data?.current_milestone);
    console.log('Milestone Title:', json.data?.current_milestone_title);
    console.log('Progress:', json.data?.progress_percent + '%');

    if (json.status === 'success' && ['M-03', 'M-04'].includes(json.data?.current_milestone) && json.data?.debitur?.includes('Bangun Prima')) {
      console.log('✓ TEST 2 PASSED: Skenario 2 BTN Gudang Komersial terverifikasi!\n');
      passed++;
    } else {
      console.error('✗ TEST 2 FAILED: Unexpected response:', json);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 2 EXCEPTION:', err.message);
    failed++;
  }

  // TEST 3: Get Active Jobs List (Internal Task Board)
  try {
    console.log('--- TEST 3: Get Active Jobs (Internal Task Board) ---');
    const url = `${GAS_WEB_APP_URL}?action=get_active_jobs`;
    const res = await fetch(url, { redirect: 'follow' });
    const json = await res.json();
    console.log('Status code:', res.status);
    console.log('Result status:', json.status);
    const count = json.count ?? json.total ?? json.data?.length ?? 0;
    console.log('Total Active Jobs:', count);

    if (json.status === 'success' && count >= 2) {
      console.log('✓ TEST 3 PASSED: Task Board internal memuat pekerjaan aktif!\n');
      passed++;
    } else {
      console.error('✗ TEST 3 FAILED: Unexpected response:', json);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 3 EXCEPTION:', err.message);
    failed++;
  }

  // TEST 4: Advance Milestone (M-03 -> M-04 pada JO-JKT-2026-0002)
  try {
    console.log('--- TEST 4: Advance Milestone M-03 -> M-04 (Internal Approval) ---');
    const postPayload = {
      action: 'advance_milestone',
      id_jo: 'JO-JKT-2026-0002',
      target_milestone: 'M-04',
      catatan_internal: 'Inspeksi lapangan fisik tapak 4.850 m² dan gudang 3.200 m² disetujui. Siap kalkulasi nilai.',
      pesan_publik: 'Inspeksi lapangan selesai. Tim penilai memulai analisis pasar komparasi dan kalkulasi biaya.',
      eksekutor_nik: 'NSR-2019-005'
    };

    const res = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(postPayload),
      redirect: 'follow'
    });

    const json = await res.json();
    console.log('Status code:', res.status);
    console.log('Result status:', json.status);
    console.log('Message:', json.message);

    // Verifikasi kembali dengan GET track
    const checkRes = await fetch(`${GAS_WEB_APP_URL}?action=track&jo=JO-JKT-2026-0002`, { redirect: 'follow' });
    const checkJson = await checkRes.json();
    console.log('Check verified milestone:', checkJson.data?.current_milestone);
    console.log('Check verified progress:', checkJson.data?.progress_percent + '%');

    if (json.status === 'success' && checkJson.data?.current_milestone === 'M-04') {
      console.log('✓ TEST 4 PASSED: Milestone JO-JKT-2026-0002 berhasil maju ke M-04 (Analisis Penilaian)!\n');
      passed++;
    } else {
      console.error('✗ TEST 4 FAILED: Advance milestone did not update as expected:', json, checkJson);
      failed++;
    }
  } catch (err) {
    console.error('✗ TEST 4 EXCEPTION:', err.message);
    failed++;
  }

  console.log('========================================================');
  console.log(`RINGKASAN UJI E2E: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests();
