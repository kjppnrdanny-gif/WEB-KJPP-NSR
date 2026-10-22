const fs = require('fs');

console.log('1. Membersihkan SEED_PROJECTS di portal-penugasan-jo.html...');
let joHtml = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// Replace SEED_PROJECTS array with empty array
const joSeedRegex = /const SEED_PROJECTS = \[[\s\S]*?\n    \];/;
if (!joSeedRegex.test(joHtml)) {
  console.error('SEED_PROJECTS not found in portal-penugasan-jo.html');
  process.exit(1);
}
joHtml = joHtml.replace(joSeedRegex, 'const SEED_PROJECTS = [];');

// Replace muatDatabaseLokal implementation
const oldMuatJo = `    function muatDatabaseLokal() {
      const stored = localStorage.getItem('kjpp_jo_database');
      if (stored) {
        try {
          projectDatabase = JSON.parse(stored);
          if (Array.isArray(projectDatabase)) {
            SEED_PROJECTS.forEach(seedItem => {
              if (!projectDatabase.some(p => p.id === seedItem.id)) {
                projectDatabase.push(seedItem);
              }
            });
            projectDatabase.forEach(item => {
              // Audit Tahap 3: Target selesai tidak disalin dari masa_berlaku_lp
              if (item.nomor_adm && item.nomor_adm.includes('4172027')) {
                item.nomor_adm = item.nomor_adm.replace('4172027', '0416');
              }
              if (item.nomor_lp && item.nomor_lp.includes('4172027')) {
                item.nomor_lp = item.nomor_lp.replace('4172027', '0416');
              }
            });
          }
        } catch (e) {
          projectDatabase = SEED_PROJECTS;
        }
      } else {
        projectDatabase = SEED_PROJECTS;
        simpanDatabaseLokal();
      }
    }`;

const newMuatJo = `    function muatDatabaseLokal() {
      // Auto-purge data simulasi pra-golive untuk memastikan dashboard 0 transaksi bersih
      const dataVer = localStorage.getItem('nsr_jo_data_version');
      if (dataVer !== '2026.10.GO_LIVE_CLEAN') {
        localStorage.removeItem('kjpp_jo_database');
        localStorage.setItem('nsr_jo_data_version', '2026.10.GO_LIVE_CLEAN');
        projectDatabase = [];
        simpanDatabaseLokal();
        return;
      }
      const stored = localStorage.getItem('kjpp_jo_database');
      if (stored) {
        try {
          projectDatabase = JSON.parse(stored);
          if (!Array.isArray(projectDatabase)) projectDatabase = [];
        } catch (e) {
          projectDatabase = [];
        }
      } else {
        projectDatabase = [];
        simpanDatabaseLokal();
      }
    }`;

// Match regardless of line endings
const normalize = s => s.replace(/\r\n/g, '\n');
const joNorm = normalize(joHtml);
const oldMuatJoNorm = normalize(oldMuatJo);

if (joNorm.includes(oldMuatJoNorm)) {
  const isCrlf = joHtml.includes('\r\n');
  const replacementText = isCrlf ? newMuatJo.replace(/\n/g, '\r\n') : newMuatJo;
  const targetText = isCrlf ? oldMuatJo.replace(/\n/g, '\r\n') : oldMuatJo;
  joHtml = joHtml.replace(targetText, replacementText);
  console.log('✔ muatDatabaseLokal di portal-penugasan-jo.html diperbarui');
} else {
  console.error('Target muatDatabaseLokal not found in portal-penugasan-jo.html');
  process.exit(1);
}

fs.writeFileSync('portal-penugasan-jo.html', joHtml, 'utf8');
console.log('✔ portal-penugasan-jo.html berhasil dibersihkan dari seed data!');

console.log('\n2. Membersihkan DATABASE_AWAL_RESMI di portal-nolap.html...');
let nolapHtml = fs.readFileSync('portal-nolap.html', 'utf8');

const nolapSeedRegex = /const DATABASE_AWAL_RESMI = \[[\s\S]*?\n    \];/;
if (!nolapSeedRegex.test(nolapHtml)) {
  console.error('DATABASE_AWAL_RESMI not found in portal-nolap.html');
  process.exit(1);
}
nolapHtml = nolapHtml.replace(nolapSeedRegex, 'const DATABASE_AWAL_RESMI = [];');

// Also update inisialisasiSistem in portal-nolap.html to purge old dummy localStorage
const oldInisialisasiNolap = `    async function inisialisasiSistem() {
      perbaruiIdempotencyKey();
      // Muat database lokal jika ada, atau gunakan master awal
      const savedData = localStorage.getItem('nsr_nolap_database');
      if (savedData) {
        try {
          daftarPermohonan = JSON.parse(savedData);
        } catch (e) {
          daftarPermohonan = [...DATABASE_AWAL_RESMI];
        }
      } else {
        daftarPermohonan = [...DATABASE_AWAL_RESMI];
        simpanDatabaseLokal();
      }`;

const newInisialisasiNolap = `    async function inisialisasiSistem() {
      perbaruiIdempotencyKey();
      // Auto-purge data simulasi pra-golive untuk memastikan dashboard 0 transaksi bersih
      const dataVer = localStorage.getItem('nsr_nolap_data_version');
      if (dataVer !== '2026.10.GO_LIVE_CLEAN') {
        localStorage.removeItem('nsr_nolap_database');
        localStorage.setItem('nsr_nolap_data_version', '2026.10.GO_LIVE_CLEAN');
        daftarPermohonan = [];
        simpanDatabaseLokal();
      } else {
        const savedData = localStorage.getItem('nsr_nolap_database');
        if (savedData) {
          try {
            daftarPermohonan = JSON.parse(savedData);
            if (!Array.isArray(daftarPermohonan)) daftarPermohonan = [];
          } catch (e) {
            daftarPermohonan = [];
          }
        } else {
          daftarPermohonan = [];
          simpanDatabaseLokal();
        }
      }`;

const nolapNorm = normalize(nolapHtml);
const oldInisialisasiNolapNorm = normalize(oldInisialisasiNolap);

if (nolapNorm.includes(oldInisialisasiNolapNorm)) {
  const isCrlf = nolapHtml.includes('\r\n');
  const repText = isCrlf ? newInisialisasiNolap.replace(/\n/g, '\r\n') : newInisialisasiNolap;
  const tgtText = isCrlf ? oldInisialisasiNolap.replace(/\n/g, '\r\n') : oldInisialisasiNolap;
  nolapHtml = nolapHtml.replace(tgtText, repText);
  console.log('✔ inisialisasiSistem di portal-nolap.html diperbarui');
} else {
  console.error('Target inisialisasiSistem not found in portal-nolap.html');
  process.exit(1);
}

fs.writeFileSync('portal-nolap.html', nolapHtml, 'utf8');
console.log('✔ portal-nolap.html berhasil dibersihkan dari seed data!');
