import fs from 'node:fs';

console.log('=== MEMULAI PENGHAPUSAN HEADER GANDA & PERAPIHAN STATUS BAR ===');

// 1. Modifikasi GPS.html (GAS Template)
const gpsPath = 'GPS.html';
let gpsHtml = fs.readFileSync(gpsPath, 'utf8').replace(/\r\n/g, '\n');

// Hapus block <header>...</header> dan clock di GPS.html
const gpsHeaderStart = gpsHtml.indexOf('<!-- TOP HEADER -->');
const gpsMainStart = gpsHtml.indexOf('<!-- MAIN CONTAINER -->');

if (gpsHeaderStart === -1 || gpsMainStart === -1) {
  console.error('[FAIL] Blok header atau main tidak ditemukan di GPS.html');
  process.exit(1);
}

const newGpsTop = `<!-- MAIN CONTAINER: Langsung Form Presensi & Autentikasi -->
  <main class="flex-1 w-full max-w-xl mx-auto px-3 sm:px-4 py-2 sm:py-3 space-y-3.5">`;

// Ganti dari <!-- TOP HEADER --> sampai tag pembuka <main ...>
const gpsMainTagEnd = gpsHtml.indexOf('>', gpsMainStart) + 1;
gpsHtml = gpsHtml.substring(0, gpsHeaderStart) + newGpsTop + gpsHtml.substring(gpsMainTagEnd);

// Bersihkan juga interval live-clock di script GPS.html agar tidak mencari el yang sudah dihapus
gpsHtml = gpsHtml.replace(
  `    function updateClock() {
      const now = new Date();
      const hari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][now.getDay()];
      const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][now.getMonth()];
      const el = document.getElementById('live-clock');
      if (el) el.textContent = \`\${hari}, \${now.getDate()} \${bulan} \${now.getFullYear()} • \${String(now.getHours()).padStart(2,'0')}:\${String(now.getMinutes()).padStart(2,'0')}:\${String(now.getSeconds()).padStart(2,'0')} WIB\`;
    }
    setInterval(updateClock, 1000);`,
  `    // Jam & status bar terpusat pada header utama portal-presensi.html`
);

fs.writeFileSync(gpsPath, gpsHtml.replace(/\n/g, '\r\n'), 'utf8');
console.log('✓ GPS.html: Header kedua dan clock duplikat berhasil dihapus! Form presensi langsung tampil paling atas.');

// 2. Sinkronkan gas-portal-absensi-template.html
const tplPath = 'gas-portal-absensi-template.html';
if (fs.existsSync(tplPath)) {
  fs.writeFileSync(tplPath, gpsHtml.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✓ gas-portal-absensi-template.html berhasil disinkronkan dengan GPS.html.');
}

// 3. Update portal-presensi.html (Status Bar Sesuai Format: Tanggal & Jam WIB | Status GPS | Status Koneksi | OTP Gmail Terproteksi)
const presensiPath = 'portal-presensi.html';
let presensiHtml = fs.readFileSync(presensiPath, 'utf8').replace(/\r\n/g, '\n');

const statusBarStart = presensiHtml.indexOf('<!-- ========================================================\n       LIVE STATUS & GPS DIAGNOSTIC TICKER');
const mainAppStart = presensiHtml.indexOf('<!-- ========================================================\n       MAIN APPLICATION WRAPPER');

if (statusBarStart === -1 || mainAppStart === -1) {
  console.error('[FAIL] Blok status bar tidak ditemukan di portal-presensi.html');
  process.exit(1);
}

const newStatusBar = `<!-- ========================================================
       SATU STATUS BAR TERPADU
       Format: Tanggal & Jam WIB | Status GPS | Status Koneksi | OTP Gmail Terproteksi
       ======================================================== -->
  <div id="unified-status-bar" class="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/90 py-1.5 px-3 sm:px-6 text-[11px] text-slate-300 shrink-0 select-none">
    <div class="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
      
      <!-- 1. Tanggal & Jam WIB (Real-time Clock) -->
      <div class="flex items-center gap-1.5 shrink-0" title="Waktu server & perangkat terverifikasi">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        <span id="live-clock" class="font-mono text-slate-200 font-semibold text-[11px]">Memuat waktu...</span>
      </div>

      <span class="text-slate-700 hidden xs:inline shrink-0">|</span>

      <!-- 2. Status GPS (Refleksi Izin & Akurasi Nyata) -->
      <div class="flex items-center gap-1 shrink-0">
        <button type="button"
                id="btn-test-gps"
                onclick="testDeviceGps()"
                title="Klik untuk menguji atau memperbarui izin GPS pada peramban"
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-bold transition bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 btn-tactile cursor-pointer">
          <span id="gps-indicator-dot" class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span id="gps-indicator-text">Mendeteksi GPS...</span>
        </button>
      </div>

      <span class="text-slate-700 hidden sm:inline shrink-0">|</span>

      <!-- 3. Status Koneksi (Online / Offline Real-time) -->
      <div id="conn-status-pill" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-800 text-emerald-300 border border-slate-700 shrink-0" title="Status koneksi jaringan perangkat ke server">
        <span id="conn-indicator-dot" class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span id="conn-indicator-text">Terhubung</span>
      </div>

      <span class="text-slate-700 hidden md:inline shrink-0">|</span>

      <!-- 4. OTP Gmail Terproteksi -->
      <div class="hidden sm:inline-flex items-center gap-1.5 text-emerald-400 font-medium text-[10.5px] shrink-0" title="Verifikasi 2FA kode OTP otomatis dikirim ke alamat email pribadi terdaftar">
        <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>OTP Gmail Terproteksi</span>
      </div>

      <!-- Lampiran Notice (Compact) -->
      <div class="hidden xl:inline-flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
        <span class="text-slate-700">&bull;</span>
        <span>Lampiran: Hanya Tautan Drive</span>
      </div>

    </div>
  </div>\n\n  `;

presensiHtml = presensiHtml.substring(0, statusBarStart) + newStatusBar + presensiHtml.substring(mainAppStart);

// Tambahkan Connection Monitor script ke portal-presensi.html jika belum ada
if (!presensiHtml.includes('function updateConnectionStatus()')) {
  const insertBeforeScriptEnd = presensiHtml.lastIndexOf('</script>');
  const connScript = `
    // 4. Real-time Connection Status Monitor
    function updateConnectionStatus() {
      const dot = document.getElementById('conn-indicator-dot');
      const text = document.getElementById('conn-indicator-text');
      const pill = document.getElementById('conn-status-pill');
      if (navigator.onLine) {
        if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
        if (text) text.textContent = 'Terhubung';
        if (pill) pill.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-800 text-emerald-300 border border-emerald-500/30 shrink-0';
      } else {
        if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-rose-500';
        if (text) text.textContent = 'Terputus (Offline)';
        if (pill) pill.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-500/40 shrink-0';
      }
    }
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();
  `;
  presensiHtml = presensiHtml.substring(0, insertBeforeScriptEnd) + connScript + presensiHtml.substring(insertBeforeScriptEnd);
}

fs.writeFileSync(presensiPath, presensiHtml.replace(/\n/g, '\r\n'), 'utf8');
console.log('✓ portal-presensi.html: Status bar tunggal berhasil dirapikan dan connection monitor aktif!');

console.log('=== SEMUA FILE LOKAL SELESAI DIMODIFIKASI SECARA BERSIH ===');
