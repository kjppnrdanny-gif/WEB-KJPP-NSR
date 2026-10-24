import fs from 'fs';
import { spawn } from 'child_process';
import http from 'http';

console.log('========================================================================');
console.log('TEST SUITE: SINGLE-TOKEN PORTAL & AUTO-BYPASS VERIFICATION');
console.log('========================================================================\n');

// 1. Verifikasi Kode HTML di portal-nolap.html
console.log('[1] VERIFIKASI STRUKTUR HTML MODAL DI portal-nolap.html:');
const html = fs.readFileSync('portal-nolap.html', 'utf8');

const hasSingleTokenInput = html.includes('id="input-token-nolap"');
const hasLabel = html.includes('Masukkan Token Akses NSR');
const hasButton = html.includes('Buka Portal NoLap &rarr;') || html.includes('Buka Portal NoLap →');
const hasOldUsernamePass = html.includes('Nama Pengguna Terdaftar') || html.includes('autocomplete="current-password"');
const hasFailsafeScript = html.includes('nsr-auth-passed');
const hasCacheMeta = html.includes('2026.10.25-SINGLE-TOKEN-V2');

if (hasSingleTokenInput && hasLabel && hasButton && !hasOldUsernamePass && hasFailsafeScript && hasCacheMeta) {
  console.log('  ✔ PASS: Form 2-kolom lama telah dibongkar total!');
  console.log('  ✔ PASS: Input Single-Token (#input-token-nolap) terpasang dengan label "Masukkan Token Akses NSR".');
  console.log('  ✔ PASS: Tombol "Buka Portal NoLap →" terpasang.');
  console.log('  ✔ PASS: Failsafe CSS & script milidetik pertama (nsr-auth-passed) terpasang di <head>.');
  console.log('  ✔ PASS: Cache-busting meta tag 2026.10.25-SINGLE-TOKEN-V2 aktif.');
} else {
  console.error('  ❌ FAIL: Verifikasi struktur HTML modal gagal!', {
    hasSingleTokenInput, hasLabel, hasButton, hasOldUsernamePass, hasFailsafeScript, hasCacheMeta
  });
  process.exit(1);
}

// 2. Simulasi JS Execution: Auto-Bypass via URL Parameter & Form Submission
console.log('\n[2] SIMULASI LOGIKA EKSEKUSI JAVASCRIPT:');

function createEl() {
  const classes = new Set();
  return {
    innerText: '',
    value: '',
    style: {},
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      contains: (x) => classes.has(x),
      has: (x) => classes.has(x)
    }
  };
}

const store = { session: {}, local: {} };
const elements = {
  'box-auth-token': createEl(),
  'panel-aplikasi-utama': createEl(),
  'label-sesi': createEl(),
  'dot-sesi': createEl(),
  'info-user-kantor': createEl(),
  'info-user-role': createEl(),
  'badge-admin-pusat': createEl(),
  'input-token-nolap': createEl(),
  'input-auth-id': createEl(),
  'input-auth-pass': createEl(),
  'btn-buka-nolap': createEl(),
  'btn-login-submit': createEl(),
  'pesan-auth-error': createEl()
};
elements['panel-aplikasi-utama'].classList.add('hidden');

const dom = {
  getElementById: (id) => {
    if (!elements[id]) elements[id] = createEl();
    return elements[id];
  },
  documentElement: {
    classList: {
      add: () => {},
      remove: () => {}
    }
  }
};

const fakeWindow = {
  document: dom,
  sessionStorage: {
    getItem: (k) => store.session[k] || null,
    setItem: (k, v) => { store.session[k] = v; },
    removeItem: (k) => { delete store.session[k]; }
  },
  localStorage: {
    getItem: (k) => store.local[k] || null,
    setItem: (k, v) => { store.local[k] = v; },
    removeItem: (k) => { delete store.local[k]; }
  },
  location: {
    search: '?token=NSR8899',
    pathname: '/portal-nolap.html'
  },
  history: {
    replaceState: () => {}
  },
  fetch: async () => ({ ok: false }),
  MASTER_KANTOR: { Pusat: { kode: '2.19.0160' } },
  sinkronkanDariServerProxy: () => {},
  muatUlangTabel: () => {},
  updateLivePreview: () => {},
  inisialisasiSesiPengguna: () => {},
  applyRBAC: () => {}
};

// Ekstrak kode fungsi yang relevan dari HTML
const tokenCode = html.slice(html.indexOf('function resolveUnifiedTokenNoLap'), html.indexOf('window.resolveUnifiedTokenNoLap = resolveUnifiedTokenNoLap;') + 60);
const panelCode = html.slice(html.indexOf('function aktifkanPanelUtama()'), html.indexOf('function updateLivePreview()'));
const authCode = html.slice(html.indexOf('async function periksaSesiServer()'), html.indexOf('function inisialisasiSesiPengguna(sesi) {'));

const runnerScript = `
  let sesiAktif = null;
  let currentUser = null;
  const document = window.document;
  const sessionStorage = window.sessionStorage;
  const localStorage = window.localStorage;
  const location = window.location;
  const history = window.history;
  const fetch = window.fetch;
  // dependencies from window
  var MASTER_KANTOR = window.MASTER_KANTOR;
  var sinkronkanDariServerProxy = window.sinkronkanDariServerProxy;
  var muatUlangTabel = window.muatUlangTabel;
  var updateLivePreview = window.updateLivePreview;
  var inisialisasiSesiPengguna = window.inisialisasiSesiPengguna;
  var applyRBAC = window.applyRBAC;

  ${tokenCode}
  ${panelCode}
  ${authCode}

  // 1. Uji Auto-Bypass via Parameter URL ?token=NSR8899
  return periksaSesiServer().then(() => {
    const autoBypassSuccess = elements['box-auth-token'].classList.has('hidden') && 
                              !elements['panel-aplikasi-utama'].classList.has('hidden') &&
                              sesiAktif && sesiAktif.isKing;

    // Reset untuk uji manual form input
    sesiAktif = null;
    elements['box-auth-token'].classList.remove('hidden');
    elements['panel-aplikasi-utama'].classList.add('hidden');
    window.location.search = '';

    // 2. Uji Form Input Token Tunggal (NSR8899)
    elements['input-token-nolap'].value = 'NSR8899';
    return loginKeServer({ preventDefault: () => {} }).then(() => {
      const formInputSuccess = elements['box-auth-token'].classList.has('hidden') && 
                               !elements['panel-aplikasi-utama'].classList.has('hidden') &&
                               sesiAktif && sesiAktif.isKing;

      return { autoBypassSuccess, formInputSuccess, sesiAktif };
    });
  });
`;

const fn = new Function('window', 'elements', runnerScript);
const simResult = await fn(fakeWindow, elements);

if (simResult.autoBypassSuccess) {
  console.log('  ✔ PASS: Auto-Bypass via parameter URL (?token=NSR8899) lolos seketika tanpa menampilkan modal!');
} else {
  console.error('  ❌ FAIL: Auto-Bypass via URL gagal!');
  process.exit(1);
}

if (simResult.formInputSuccess) {
  console.log('  ✔ PASS: Input Single-Token langsung membuka portal dan mengaktifkan peran KING!');
} else {
  console.error('  ❌ FAIL: Input Single-Token gagal membuka portal!');
  process.exit(1);
}

// 3. Uji Backend PHP Server Endpoint nolap-data-handler.php?action=verifyToken
console.log('\n[3] TESTING BACKEND API ENDPOINT (nolap-data-handler.php?action=verifyToken):');

const phpServer = spawn('php', ['-S', '127.0.0.1:8897'], { stdio: 'pipe' });

await new Promise(resolve => setTimeout(resolve, 800));

try {
  const testUrl = 'http://127.0.0.1:8897/nolap-data-handler.php?action=verifyToken';
  const res = await fetch(testUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-NSR-Token': 'NSR8899'
    },
    body: JSON.stringify({ token: 'NSR8899' })
  });
  const data = await res.json();

  if (res.ok && data.success && data.isKing) {
    console.log('  ✔ PASS: Backend nolap-data-handler.php memverifikasi token NSR8899 via URL parameter (isKing: true)!');
  } else {
    console.error('  ❌ FAIL: Backend gagal memverifikasi token!', { status: res.status, data });
    phpServer.kill();
    process.exit(1);
  }
} finally {
  phpServer.kill();
}

console.log('\n========================================================================');
console.log('HASIL PENGUJIAN: SEMUA 5 KRITERIA TERPENUHI (100% PASS)');
console.log('========================================================================\n');
process.exit(0);
