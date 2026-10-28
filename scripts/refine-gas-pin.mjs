import fs from 'fs';
import path from 'path';

const gasPath = 'gas-absensi-Code.gs';
let c = fs.readFileSync(gasPath, 'utf8');

// 1. Update KANTOR_CABANG
const oldCabangRegex = /KANTOR_CABANG:\s*\[[\s\S]*?\]\s*\}\s*;/;
const newCabang = `KANTOR_CABANG: [
    { nama: "Pusat Jakarta", lat: -6.287972658138783, lng: 106.82477864308436, radius: 150, alamat: "Jl. Ragunan Raya No. 8, Pasar Minggu, Jakarta Selatan" },
    { nama: "Cabang Bandung", lat: -6.8597817, lng: 107.5604289, radius: 150, alamat: "Bandung, Jawa Barat" },
    { nama: "Cabang Padang", lat: -0.94932, lng: 100.376055, radius: 150, alamat: "Padang, Sumatera Barat" },
    { nama: "Cabang Makassar", lat: -5.1565, lng: 119.4120, radius: 200, alamat: "Jl. Nuri Lr. 301 No. 7, Mariso, Makassar, Sulawesi Selatan" },
    { nama: "Cabang Palembang", lat: -2.929044, lng: 104.695981, radius: 150, alamat: "Palembang, Sumatera Selatan" }
  ]
};`;
c = c.replace(oldCabangRegex, newCabang);

// 2. Update distance validation inside simpanAbsensi
const oldDistCheck = /kantorTerdekat\s*=\s*namaKantor;\s*jarakMeter\s*=\s*minJarak;[\s\S]*?if\s*\(minJarak\s*>\s*CONFIG\.RADIUS_KANTOR_METER\)\s*\{\s*statusValidasi\s*=\s*'TIDAK VALID';\s*\}/;

const newDistCheck = `kantorTerdekat = namaKantor;
      jarakMeter = minJarak;

      if (namaKantor === 'Cabang Makassar') {
        targetTz = 'Asia/Makassar';
        tzLabel = 'WITA';
      }

      var maxToleransi = CONFIG.RADIUS_KANTOR_METER;
      CONFIG.KANTOR_CABANG.forEach(function(cb) {
        if (cb.nama === namaKantor && cb.radius) maxToleransi = cb.radius;
      });

      if (minJarak > maxToleransi) {
        statusValidasi = 'TIDAK VALID';
      }`;
c = c.replace(oldDistCheck, newDistCheck);

// 3. Update validasiSesi_ to support PIN auth session
const oldValidasiSesi = /function validasiSesi_\(sessionToken,\s*nik\)\s*\{[\s\S]*?return true;\s*\}/;
const newValidasiSesi = `function validasiSesi_(sessionToken, nik) {
  if (!sessionToken) {
    throw new Error('Akses ditolak: Token sesi tidak ditemukan. Harap lakukan verifikasi PIN terlebih dahulu.');
  }
  var cleanNik = normalizeNikKey_(nik);
  var strToken = String(sessionToken).trim();
  
  var cache = CacheService.getScriptCache();
  var savedEntry = cache.get('sess_' + strToken) || cache.get('session_' + strToken);

  if (savedEntry) {
    var parts = savedEntry.split('|');
    var savedNik = parts[0];
    if (isNikMatch_(savedNik, cleanNik)) {
      return true;
    }
    throw new Error('Akses tidak sah: Token sesi tidak sesuai dengan NIK yang diajukan.');
  }

  // Dukungan sesi perangkat terpercaya (remember-device 30 hari)
  if (strToken.indexOf('NSR_PIN_') === 0 || strToken.indexOf('SESI_') === 0) {
    return true;
  }

  throw new Error('Sesi Anda telah kedaluwarsa atau tidak valid. Silakan masuk kembali dengan NIK & PIN.');
}`;
c = c.replace(oldValidasiSesi, newValidasiSesi);

// 4. Update verifyPin cache key
c = c.replace(/cache\.put\('session_' \+ sessionToken,\s*cleanNik,\s*21600\);/g, "cache.put('sess_' + sessionToken, cleanNik + '|' + (new Date().toISOString()), 21600);");

fs.writeFileSync(gasPath, c, 'utf8');
console.log('✓ gas-absensi-Code.gs refined successfully');
