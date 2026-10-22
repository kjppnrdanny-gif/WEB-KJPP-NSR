/**
 * OPINI NSR 2026 — SCRIPT PEMBERSIHAN TERKONTROL DATA SIMULASI
 * Sesuai Master Perintah Final Bagian VIII & IX
 */

import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups', 'pre_reset_snapshot_' + new Date().toISOString().replace(/[:.]/g, '-'));

console.log('================================================================');
console.log('   OPINI NSR 2026 — PEMBERSIHAN TERKONTROL DATA SIMULASI        ');
console.log('================================================================');

// 1. Buat Snapshot Backup Tambahan
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
console.log(`[1] Membuat snapshot cadangan di: ${BACKUP_DIR}`);

const filesToSnapshot = [
  'data/dual_gate_database.json',
  'data/nolap_database.json',
  'data/mail_queue.json',
  'data/official_register_config.json',
  'data/register_audit_logs.json',
  'data/emergency_override_logs.json'
];

filesToSnapshot.forEach(f => {
  const src = path.join(ROOT_DIR, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(BACKUP_DIR, path.basename(f)));
    console.log(`    - Disalin: ${f}`);
  }
});

// 2. Kosongkan Database Operasional Transaksional
console.log('\n[2] Mengosongkan data transaksi simulasi (JO, NoLap, Mail Queue)...');
fs.writeFileSync(path.join(DATA_DIR, 'dual_gate_database.json'), '[]\n', 'utf8');
console.log('    ✔ data/dual_gate_database.json -> [] (0 transaksi)');

fs.writeFileSync(path.join(DATA_DIR, 'nolap_database.json'), '[]\n', 'utf8');
console.log('    ✔ data/nolap_database.json -> [] (0 transaksi)');

fs.writeFileSync(path.join(DATA_DIR, 'mail_queue.json'), '[]\n', 'utf8');
console.log('    ✔ data/mail_queue.json -> [] (0 antrean)');

// 3. Setel Ulang Konfigurasi Register Resmi ke Mode MENUNGGU_REKONSILIASI
console.log('\n[3] Menyetel status Register Resmi (15 Register) ke MENUNGGU_REKONSILIASI...');
const regPath = path.join(DATA_DIR, 'official_register_config.json');
let regConfig = [];
if (fs.existsSync(regPath)) {
  regConfig = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  regConfig = regConfig.map(r => ({
    ...r,
    nomorTerakhir: 0,
    kandidatBerikutnya: 'MENUNGGU_REKONSILIASI',
    nomorTerpakai: [],
    nomorDibatalkan: [],
    nomorDicadangkan: [],
    status: 'MENUNGGU_REKONSILIASI',
    alasanPenyesuaian: 'Menunggu input rekonsiliasi saldo buku register fisik KJPP NSR 2026',
    sumberBukti: 'Buku Register Fisik Operasional KJPP NSR 2026',
    updatedAt: new Date().toISOString()
  }));
  fs.writeFileSync(regPath, JSON.stringify(regConfig, null, 4) + '\n', 'utf8');
  console.log('    ✔ 15 Register resmi disiapkan dalam status MENUNGGU_REKONSILIASI (Anti-Asumsi 00001)');
}

// 4. Catat Audit Log Pembersihan
const auditPath = path.join(DATA_DIR, 'register_audit_logs.json');
let auditLogs = [];
if (fs.existsSync(auditPath)) {
  try { auditLogs = JSON.parse(fs.readFileSync(auditPath, 'utf8')); } catch (e) { auditLogs = []; }
}
auditLogs.unshift({
  id: 'audit_reset_simulasi_' + Date.now(),
  registerId: 'ALL_REGISTERS',
  kantor: 'ALL',
  jenisDokumen: 'ALL',
  nomorLama: 'SIMULASI_TEST',
  nomorBaru: 'MENUNGGU_REKONSILIASI',
  alasan: 'Pembersihan Terkontrol Data Simulasi Pra-Go Live OPINI NSR 2026',
  sumberBukti: 'Master Perintah Pemilik Sistem KJPP NSR',
  petugas: 'AI Developer / SUPER ADMIN KING (Otorisasi Pemilik Sistem)',
  ipAddress: '127.0.0.1 (CLI)',
  timestamp: new Date().toISOString()
});
fs.writeFileSync(auditPath, JSON.stringify(auditLogs, null, 4) + '\n', 'utf8');
console.log('    ✔ Audit trail pembersihan tercatat di data/register_audit_logs.json');

console.log('\n================================================================');
console.log('✔ PEMBERSIHAN DATA SIMULASI BACKEND SELESAI DENGAN AMAN!');
console.log('================================================================');
