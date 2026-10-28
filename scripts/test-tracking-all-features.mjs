import { execSync } from 'child_process';
import fs from 'fs';

function runPhp(script) {
  const tmpFile = 'tmp_test_runner_' + Date.now() + '.php';
  fs.writeFileSync(tmpFile, script, 'utf8');
  try {
    const out = execSync(`php ${tmpFile}`, { encoding: 'utf8' });
    return out;
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

console.log('================================================================');
console.log('   PENGUJIAN MENYELURUH MODAL JOB TRACKING 7-MILESTONE NSR     ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] Test ${totalTests}: ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// 1. ISOLASI WILAYAH CABANG (BANDUNG, PADANG, MAKASSAR, PALEMBANG)
console.log('--- 1. PENGUJIAN ISOLASI WILAYAH CABANG ---');

// Bandung
const testBdgList = `<?php
\$_GET['action'] = 'list';
\$_GET['auth_nik'] = 'NSR-BDG-2020-39'; // Ardi Nurmayadi - Bandung
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resBdg = JSON.parse(runPhp(testBdgList));
assert(resBdg.status === 'success', 'Status list cabang Bandung berhasil');
assert(resBdg.access_mode === 'BRANCH_ISOLATED', 'Access mode Bandung terisolasi (BRANCH_ISOLATED)');
assert(resBdg.data.every(j => j.kantor_code === 'BDG'), 'Semua penugasan untuk staf Bandung hanya penugasan wilayah BDG');

// Padang
const testPdgList = `<?php
\$_GET['action'] = 'list';
\$_GET['auth_nik'] = 'NSR-PDG-2019-24'; // Rahmad Andika - Padang
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resPdg = JSON.parse(runPhp(testPdgList));
assert(resPdg.status === 'success', 'Status list cabang Padang berhasil');
assert(resPdg.access_mode === 'BRANCH_ISOLATED', 'Access mode Padang terisolasi (BRANCH_ISOLATED)');
assert(resPdg.data.every(j => j.kantor_code === 'PDG'), 'Semua penugasan untuk staf Padang hanya penugasan wilayah PDG');

// Makassar
const testMksList = `<?php
\$_GET['action'] = 'list';
\$_GET['auth_nik'] = 'NSR-MKS-2019-31'; // Wawan Kurniawan - Makassar
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resMks = JSON.parse(runPhp(testMksList));
assert(resMks.status === 'success', 'Status list cabang Makassar berhasil');
assert(resMks.data.every(j => j.kantor_code === 'MKS'), 'Semua penugasan untuk staf Makassar hanya penugasan wilayah MKS');

// Palembang
const testPlbList = `<?php
\$_GET['action'] = 'list';
\$_GET['auth_nik'] = 'NSR-PLB-2022-45'; // Rafdinal Ardhi - Palembang
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resPlb = JSON.parse(runPhp(testPlbList));
assert(resPlb.status === 'success', 'Status list cabang Palembang berhasil');
assert(resPlb.data.every(j => j.kantor_code === 'PLM'), 'Semua penugasan untuk staf Palembang hanya penugasan wilayah PLM');

// Manajemen / Admin Pusat (Nationwide Full Access)
const testCentralList = `<?php
\$_GET['action'] = 'list';
\$_GET['auth_nik'] = 'NSR-2019-005'; // Danny Taufik Hidayat - Pusat
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resCentral = JSON.parse(runPhp(testCentralList));
assert(resCentral.status === 'success', 'Status list Admin Pusat berhasil');
assert(resCentral.access_mode === 'NATIONWIDE_FULL_ACCESS', 'Admin Pusat memiliki mode NATIONWIDE_FULL_ACCESS');
const branchesPresent = new Set(resCentral.data.map(j => j.kantor_code));
assert(branchesPresent.size >= 4, 'Admin Pusat dapat memantau seluruh kantor wilayah');

// Cross-Branch Violation Check
const testCrossBranch = `<?php
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-MKS-2026-0008'; // Job Makassar
\$_POST['target_milestone'] = 'M-03';
\$_POST['nik'] = 'NSR-BDG-2020-39'; // Staf Bandung
\$_POST['pin'] = '123456';
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resCross = JSON.parse(runPhp(testCrossBranch));
assert(resCross.status === 'error', 'Pembaruan lintas cabang oleh staf cabang diblokir');
assert(resCross.message.includes('Akses Ditolak'), 'Pesan penolakan isolasi wilayah cabang akurat');

// 2. OTORISASI MILESTONE VIA NIK + PIN (OPSI B) & LOG_PROGRESS
console.log('\n--- 2. PENGUJIAN OTORISASI NIK + PIN & LOG_PROGRESS ---');

// Test PIN Salah
const testWrongPin = `<?php
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-05';
\$_POST['nik'] = 'NSR-2019-007'; // Tedi Setiadi
\$_POST['pin'] = '999999'; // PIN Salah
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resWrongPin = JSON.parse(runPhp(testWrongPin));
assert(resWrongPin.status === 'error', 'Percobaan dengan PIN salah diblokir (401)');
assert(resWrongPin.message.includes('PIN') || resWrongPin.message.includes('Verifikasi'), 'Pesan penolakan PIN salah jelas');

// Test Wewenang Jabatan Salah (Admin coba otorisasi SPM M-05)
const testWrongAuthority = `<?php
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-05';
\$_POST['nik'] = 'NSR-2025-021'; // Dhea Shafitri - Staf Admin
\$_POST['pin'] = '123456';
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resWrongAuth = JSON.parse(runPhp(testWrongAuthority));
assert(resWrongAuth.status === 'error', 'Staf Admin tidak berwenang mengesahkan M-05 Kendali Mutu SPM');
assert(resWrongAuth.message.includes('Otorisasi Ditolak'), 'Pesan penolakan wewenang jabatan SPI akurat');

// Test Otorisasi Sah M-05 oleh Reviewer SPM Tedi Setiadi
const testValidM05 = `<?php
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-05';
\$_POST['nik'] = 'NSR-2019-007'; // Tedi Setiadi - Reviewer SPM Pusat
\$_POST['pin'] = '123456';
\$_POST['catatan'] = 'Reviewer SPM: Kertas kerja kalkulasi DRC telah sesuai petunjuk SPI 105.';
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resValidM05 = JSON.parse(runPhp(testValidM05));
assert(resValidM05.status === 'success', 'Reviewer SPM sah memperbarui M-05');
assert(resValidM05.audit && resValidM05.audit.nik_eksekutor === 'NSR-2019-007', 'Log audit mencatat NIK eksekutor personal');
assert(resValidM05.audit.nama_eksekutor === 'Tedi Setiadi', 'Log audit mencatat nama eksekutor');
assert(resValidM05.audit.milestone_baru === 'M-05', 'Log audit mencatat milestone target');

// Test Otorisasi M-06 oleh Penilai Publik Berizin (Ir. Nanang Rahayu)
const testValidM06 = `<?php
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-06';
\$_POST['nik'] = 'NSR-2019-001'; // Ir. Nanang Rahayu - Pemimpin Rekan
\$_POST['pin'] = '123456';
\$_POST['catatan'] = 'Opini final disetujui dan alokasi Nolap resmi terbit.';
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resValidM06 = JSON.parse(runPhp(testValidM06));
assert(resValidM06.status === 'success', 'Penilai Publik Berizin sah mengesahkan M-06');
assert(resValidM06.data.current_milestone === 'M-06', 'Milestone JO dimajukan ke M-06');

// Test Otorisasi M-07 (Laporan Final Diserahkan & 100% Selesai)
const testValidM07 = `<?php
\$_GET['action'] = 'advance_milestone';
\$_POST['jo'] = 'JO-JKT-2026-0001';
\$_POST['target_milestone'] = 'M-07';
\$_POST['nik'] = 'NSR-2019-005'; // Danny Taufik Hidayat - Manager Admin
\$_POST['pin'] = '889900';
\$_POST['catatan'] = 'Laporan penilaian final telah diserahkan resmi ke Bank BTN KC Kuningan.';
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resValidM07 = JSON.parse(runPhp(testValidM07));
assert(resValidM07.status === 'success', 'Admin sah menyerahkan laporan final M-07');
assert(resValidM07.data.progress_percent === 100, 'Progres penugasan mencapai 100% selesai');
assert(resValidM07.data.sla_status === 'completed', 'SLA status tercatat completed');

// Test Verifikasi Audit Log File
const testGetAudit = `<?php
\$_GET['action'] = 'get_audit_log';
\$_GET['jo'] = 'JO-JKT-2026-0001';
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resAudit = JSON.parse(runPhp(testGetAudit));
assert(resAudit.status === 'success', 'Berhasil mengambil riwayat log audit');
assert(resAudit.data.length >= 3, 'Log audit mencatat seluruh pembaruan tahapan (M-05, M-06, M-07)');

// 3. FITUR TARIK DATA JO & KOLOM BEBAS EDITABLE
console.log('\n--- 3. PENGUJIAN TARIK DATA JO & REGISTRASI FLEKSIBEL ---');

const testSuggestions = `<?php
\$_GET['action'] = 'get_jo_suggestions';
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resSug = JSON.parse(runPhp(testSuggestions));
assert(resSug.status === 'success', 'Pengambilan saran JO dari database berhasil');
assert(resSug.count > 0, `Daftar saran JO memuat ${resSug.count} nomor registrasi terdaftar`);

// Registrasi JO Baru dengan Isian Bebas
const testCreateJob = `<?php
\$_GET['action'] = 'create';
\$_POST['spk_number'] = 'SPK-TEST-FLEX-2026/099';
\$_POST['spk_date'] = '2026-10-28';
\$_POST['lingkup_penugasan'] = 'Penilaian Kelayakan Aset Agunan Khusus (Bebas)';
\$_POST['tanggal_lingkup'] = '2026-10-28';
\$_POST['instansi'] = 'PT Bank Pembangunan Daerah Kalimantan Barat (Isian Bebas)';
\$_POST['unit_kerja'] = 'KCU Pontianak';
\$_POST['kantor'] = 'Kantor Pusat Jakarta';
\$_POST['debitur'] = 'PT Borneo Sawit Mandiri';
\$_POST['pic_contact'] = '081255667788';
\$_POST['jenis_properti'] = 'Pabrik Minyak Kelapa Sawit (CPO Mill) & Dermaga Jetty';
\$_POST['lokasi_aset'] = 'Jl. Trans Kalimantan KM 45, Kalimantan Barat';
\$_POST['penilai_pelaksana'] = 'Fadri Nurdin';
\$_POST['surveyor'] = 'Fadri Nurdin';
\$_POST['reviewer'] = 'Tedi Setiadi';
\$_POST['reviewer_spm'] = 'Tedi Setiadi';
\$_POST['penilai_publik'] = 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) - Pemimpin Rekan (Pusat / P-1.09.00218)';
\$_POST['sla_days'] = 5;
\$_POST['sla_target_text'] = 'H+5 Setelah Survei Lapangan Tuntas (Target Bebas)';
\$_POST['auth_nik'] = 'NSR-2019-005';
\$_POST['auth_pin'] = '889900';
ob_start();
require 'backend/job-tracking-handler.php';
echo ob_get_clean();
`;
const resCreate = JSON.parse(runPhp(testCreateJob));
assert(resCreate.status === 'success', 'Registrasi Job Order dengan isian bebas berhasil');
assert(resCreate.data.kode_lacak && resCreate.data.kode_lacak.startsWith('TRK-JKT-'), 'Kode Lacak Unik TRK berhasil diterbitkan');
assert(resCreate.data.sla_label === 'H+5 Setelah Survei Lapangan Tuntas (Target Bebas)', 'Target SLA teks bebas tersimpan dengan benar');

console.log('\n================================================================');
console.log(`   SEMUA ${passedTests} PENGUJIAN OTOMATIS BERHASIL 100%!        `);
console.log('================================================================\n');
