import { createSessionToken, getJwtSecret } from "../netlify/functions/lib/auth-core.mjs";

const BASE_URL = 'https://kjppnanangrahayu.com';

async function loginUser(token) {
  const res = await fetch(`${BASE_URL}/api/auth-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  const data = await res.json().catch(() => ({}));
  const rawCookie = res.headers.get('set-cookie');
  const cookie = rawCookie ? rawCookie.split(';')[0] : '';
  return { status: res.status, data, cookie };
}

async function fetchStatusProxy(params, options = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/api/status-terintegrasi-proxy?${qs}`;
  const headers = { 'Accept': 'application/json', ...(options.headers || {}) };
  if (options.cookie) {
    headers['Cookie'] = options.cookie;
  }
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runLiveVerification() {
  console.log('======================================================================');
  console.log('🌐 VERIFIKASI LANGSUNG INTEGRASI STATUS 4-PORTAL DI SERVER PRODUKSI');
  console.log(`Target: ${BASE_URL}`);
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;
  function testAssert(cond, desc) {
    total++;
    if (cond) {
      passed++;
      console.log(`  ✔ PASS: ${desc}`);
    } else {
      console.log(`  ❌ FAIL: ${desc}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: PENGGUNA TANPA KREDENSIAL (HTTP 401)
  // -------------------------------------------------------------------------
  console.log('[1/7] Pengujian Pengguna Tanpa Kredensial');
  const unauthRes = await fetchStatusProxy({ id: '0415/LP/NSR/X/2026' });
  testAssert(unauthRes.status === 401, 'Request tanpa autentikasi ditolak HTTP 401');
  testAssert(unauthRes.data.success === false, 'Flag success bernilai false');
  testAssert(unauthRes.data.violation === 'UNAUTHORIZED_ACCESS', 'Pelanggaran tercatat UNAUTHORIZED_ACCESS');

  // -------------------------------------------------------------------------
  // TEST 2: PERCOBAAN LOGIN DENGAN HASH PENYIMPAN LANGSUNG (ANTI-HASH-BYPASS)
  // -------------------------------------------------------------------------
  console.log('\n[2/7] Pengujian Penolakan Hash Penyimpan Langsung');
  // Hash SHA-256 acak format 64 hex
  const fakeHash = '16f051a1bb53eb07ba314e472103186abcbe945520af2028688be64eb4fea42a';
  const hashLoginRes = await fetchStatusProxy({ id: '0415/LP/NSR/X/2026' }, {
    headers: { 'Authorization': `Bearer ${fakeHash}` }
  });
  testAssert(hashLoginRes.status === 401, 'Nilai hash penyimpan ditolak tegas HTTP 401 (Bukan kredensial login)');

  // -------------------------------------------------------------------------
  // TEST 3: AKUN PUSAT SAH (SUPER ADMIN)
  // -------------------------------------------------------------------------
  console.log('\n[3/7] Pengujian Akun Pusat Sah (Super Admin)');
  const pusatAuth = await loginUser('NSR-PST-2026');
  testAssert(pusatAuth.status === 200, 'Login Super Admin Pusat berhasil');

  const pusatStatusRes = await fetchStatusProxy(
    { id: '0415/LP/NSR/X/2026', noSpk: '0415/LP/NSR/X/2026' },
    { cookie: pusatAuth.cookie, headers: { 'Authorization': 'Bearer NSR-PST-2026' } }
  );
  testAssert(pusatStatusRes.status === 200, 'Akses Super Admin Pusat berhasil (HTTP 200)');
  testAssert(pusatStatusRes.data.success === true, 'Respons sukses terverifikasi');
  testAssert(pusatStatusRes.data.aksesPengguna.role === 'SUPER ADMIN', 'Role terdeteksi SUPER ADMIN');
  testAssert(pusatStatusRes.data.aksesPengguna.canSeeFee === true, 'Hak lihat nominal finansial aktif untuk Super Admin');
  testAssert(pusatStatusRes.data.nolap.statusKoneksi === 'TERHUBUNG_AKTIF', 'Sumber data NoLap terhubung aktif');
  testAssert(pusatStatusRes.data.kwitansi.statusKoneksi === 'TERHUBUNG_AKTIF', 'Sumber data Kwitansi terhubung aktif');
  testAssert(pusatStatusRes.data.operasional.statusKoneksi === 'TERHUBUNG_AKTIF', 'Sumber data e-Operasional terhubung aktif');

  // -------------------------------------------------------------------------
  // TEST 4: AKUN CABANG SAH (PADANG) PADA PENUGASAN CABANGNYA
  // -------------------------------------------------------------------------
  console.log('\n[4/7] Pengujian Akun Cabang Sah (Padang) pada Penugasan Cabangnya');
  const padangAuth = await loginUser('NSR-PDG-2026');
  testAssert(padangAuth.status === 200, 'Login Admin Cabang Padang berhasil');

  const padangOwnRes = await fetchStatusProxy(
    { id: 'SPK-PDG-001', noSpk: 'SPK-PDG-001' },
    { cookie: padangAuth.cookie, headers: { 'Authorization': 'Bearer NSR-PDG-2026' } }
  );
  testAssert(padangOwnRes.status === 200, 'Cabang Padang dapat mengakses penugasan miliknya (HTTP 200)');
  testAssert(padangOwnRes.data.aksesPengguna.role === 'ADMIN_CABANG', 'Role terdeteksi ADMIN_CABANG');
  testAssert(padangOwnRes.data.query.resolvedOffice === 'PADANG', 'Kantor penugasan terverifikasi resmi sebagai PADANG');

  // -------------------------------------------------------------------------
  // TEST 5: AKSES LINTAS CABANG DITOLAK (FAIL-CLOSED HTTP 403)
  // -------------------------------------------------------------------------
  console.log('\n[5/7] Pengujian Isolasi Antar-Cabang (Akses Lintas Cabang Ditolak)');
  const crossBranchRes = await fetchStatusProxy(
    { id: 'SPK-BDG-001', noSpk: 'SPK-BDG-001' },
    { cookie: padangAuth.cookie, headers: { 'Authorization': 'Bearer NSR-PDG-2026' } }
  );
  testAssert(crossBranchRes.status === 403, 'Akses Padang -> Bandung ditolak HTTP 403 Forbidden');
  testAssert(crossBranchRes.data.violation === 'CROSS_BRANCH_ACCESS_DENIED', 'Pelanggaran tercatat CROSS_BRANCH_ACCESS_DENIED');

  // -------------------------------------------------------------------------
  // TEST 6: PENILAI PUBLIK (FEE MASKING & SENSOR NOMINAL)
  // -------------------------------------------------------------------------
  console.log('\n[6/7] Pengujian Akses Penilai Publik (Sensor Nominal Finansial)');
  const penilaiAuth = await loginUser('NSR-VAL-2026');
  testAssert(penilaiAuth.status === 200, 'Login Penilai Publik berhasil');

  const penilaiRes = await fetchStatusProxy(
    { id: '0415/LP/NSR/X/2026', noSpk: '0415/LP/NSR/X/2026' },
    { cookie: penilaiAuth.cookie, headers: { 'Authorization': 'Bearer NSR-VAL-2026' } }
  );
  testAssert(penilaiRes.status === 200, 'Penilai Publik dapat mengakses status penugasan (HTTP 200)');
  testAssert(penilaiRes.data.aksesPengguna.role === 'PENILAI', 'Role terdeteksi PENILAI');
  testAssert(penilaiRes.data.aksesPengguna.canSeeFee === false, 'canSeeFee bernilai false untuk Penilai Publik');

  // -------------------------------------------------------------------------
  // TEST 7: INTEROPERABILITAS TOKEN JWT (NETLIFY KE PHP)
  // -------------------------------------------------------------------------
  console.log('\n[7/7] Pengujian Interoperabilitas Token JWT Netlify -> Backend PHP');
  const jwtPusat = createSessionToken({
    sub: 'jwt_admin_live',
    role: 'SUPER ADMIN',
    branch: 'PUSAT',
    seeFee: true
  });
  const jwtRes = await fetchStatusProxy(
    { id: '0415/LP/NSR/X/2026', noSpk: '0415/LP/NSR/X/2026' },
    { headers: { 'Authorization': `Bearer ${jwtPusat}` } }
  );
  testAssert(jwtRes.status === 200, 'Token JWT Netlify diverifikasi sukses oleh backend PHP (HTTP 200)');
  testAssert(jwtRes.data.aksesPengguna.role === 'SUPER ADMIN', 'Identitas JWT terpetakan resmi');

  console.log('\n======================================================================');
  console.log(`HASIL VERIFIKASI LANGSUNG PRODUKSI: ${passed} / ${total} LULUS (${Math.round(passed/total*100)}%)`);
  console.log('======================================================================');
}

runLiveVerification().catch(e => {
  console.error('Fatal live verification error:', e);
});
