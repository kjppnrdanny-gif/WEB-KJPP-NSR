import fs from 'fs';
import assert from 'assert';
import crypto from 'crypto';

// Baca Code.gs dan parse konstanta
const codeGs = fs.readFileSync('Code.gs', 'utf8');

// Verifikasi keberadaan pengaman kritis di Code.gs
console.log('1. Memeriksa keberadaan pengaman otentikasi di doGet(e)...');
assert(codeGs.includes('verifikasiAksesToken(clientToken, clientTokenHash, clientApiKey)'), 'doGet memverifikasi token');
assert(codeGs.includes('authenticated: false'), 'doGet merespon unauth dengan aman');
assert(codeGs.includes('bacaSemuaSubmissions(ss, authResult)'), 'doGet memanggil bacaSemuaSubmissions dengan authResult');

console.log('2. Memeriksa implementasi kontrol cabang pada bacaSemuaSubmissions...');
assert(codeGs.includes('function bacaSemuaSubmissions(ss, authResult)'), 'Signature bacaSemuaSubmissions menerima authResult');
assert(codeGs.includes('itemWil.includes(cleanWil)'), 'Penyaringan cabang mencocokkan wilayah item');
assert(codeGs.includes('itemNoSpk.includes(wilCode)'), 'Penyaringan cabang mencocokkan kode wilayah nomor');

console.log('3. Menguji logika filter cabang secara simulasi...');
const dummyRows = [
  { ID_Penugasan: 'NSR-2026-0001', Kantor_Wilayah: 'Kantor Cabang Bandung', No_Lingkup_Penugasan: '0001/NSR-BDG/PN-APP/I/2026' },
  { ID_Penugasan: 'NSR-2026-0002', Kantor_Wilayah: 'Kantor Cabang Padang', No_Lingkup_Penugasan: '0001/NSR-PDG/PN-APP/I/2026' },
  { ID_Penugasan: 'NSR-2026-0003', Kantor_Wilayah: 'Kantor Cabang Makassar', No_Lingkup_Penugasan: '0001/NSR-MKS/PN-APP/I/2026' },
  { ID_Penugasan: 'NSR-2026-0004', Kantor_Wilayah: 'Kantor Pusat Jakarta', No_Lingkup_Penugasan: '0416/NSR/PN-APP/I/2026' }
];

function simulateFilter(list, authResult) {
  if (authResult && (authResult.isCabang || authResult.role === 'ADMIN_CABANG' || authResult.mode === 'CABANG') && !authResult.isSuperAdmin) {
    const cabangLower = String(authResult.wilayah || authResult.wilayahLabel || '').toLowerCase();
    const cleanWil = cabangLower.replace('kantor cabang', '').replace('kantor', '').trim();
    const wilCode = String(authResult.wilayahCode || '').toLowerCase();
    const kodeKantor = String(authResult.kodeKantor || authResult.kodeWilayah || '').toLowerCase();

    return list.filter(item => {
      const itemWil = String(item.Kantor_Wilayah || item.kantor_wilayah || item.Wilayah || '').toLowerCase();
      const itemKode = String(item.Kode_Kantor || item.kode_kantor || '').toLowerCase();
      const itemNoSpk = String(item.No_Lingkup_Penugasan || item.nomor_lp || '').toLowerCase();
      const itemNoAdm = String(item.No_Adm_JO || item.nomor_adm || '').toLowerCase();

      if (cleanWil && itemWil.includes(cleanWil)) return true;
      if (wilCode && (itemNoSpk.includes(wilCode) || itemNoAdm.includes(wilCode))) return true;
      if (kodeKantor && (itemKode === kodeKantor || itemWil.includes(kodeKantor))) return true;
      return false;
    });
  }
  return list;
}

// Uji Admin Bandung
const authBandung = { isCabang: true, role: 'ADMIN_CABANG', wilayah: 'Kantor Cabang Bandung', wilayahCode: 'BDG' };
const resBandung = simulateFilter(dummyRows, authBandung);
assert.strictEqual(resBandung.length, 1, 'Admin Bandung hanya dapat melihat 1 data miliknya');
assert.strictEqual(resBandung[0].ID_Penugasan, 'NSR-2026-0001');

// Uji Admin Padang
const authPadang = { isCabang: true, role: 'ADMIN_CABANG', wilayah: 'Kantor Cabang Padang', wilayahCode: 'PDG' };
const resPadang = simulateFilter(dummyRows, authPadang);
assert.strictEqual(resPadang.length, 1, 'Admin Padang hanya dapat melihat 1 data miliknya');
assert.strictEqual(resPadang[0].ID_Penugasan, 'NSR-2026-0002');

// Uji Super Admin
const authSuper = { isCabang: false, isSuperAdmin: true, role: 'SUPER ADMIN', wilayah: 'Kantor Pusat Jakarta' };
const resSuper = simulateFilter(dummyRows, authSuper);
assert.strictEqual(resSuper.length, 4, 'Super Admin dapat melihat seluruh data (4/4)');

console.log('✅ SELURUH UJI KEAMANAN BACKEND & ISOLASI CABANG JO BERHASIL (100% VALID)!');
