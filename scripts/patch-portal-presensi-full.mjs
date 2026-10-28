import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const targetFile = path.join(ROOT_DIR, 'portal-presensi.html');
let html = fs.readFileSync(targetFile, 'utf8');

const isCRLF = html.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

// 1. Clean Input Labels: remove examples and PIN default hints
const oldNikLabel = `<label for="auth-nik-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>1. NIK Karyawan <span class="text-rose-400">*</span></span>
            <span class="text-slate-400 font-mono text-[10px] font-normal normal-case">Contoh: NSR-2019-005, NSR-MKS-2019-30</span>
          </label>`.replace(/\n/g, nl);

const newNikLabel = `<label for="auth-nik-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            <span>1. NIK Karyawan <span class="text-rose-400">*</span></span>
          </label>`.replace(/\n/g, nl);

if (!html.includes(oldNikLabel)) {
  throw new Error('oldNikLabel not found in portal-presensi.html');
}
html = html.replace(oldNikLabel, newNikLabel);
console.log('1. NIK input label cleaned.');

const oldPinLabel = `<label for="auth-pin-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>2. PIN Presensi (6 Digit) <span class="text-rose-400">*</span></span>
            <span class="text-slate-400 text-[10px] font-normal normal-case">PIN Default Standar: 123456</span>
          </label>`.replace(/\n/g, nl);

const newPinLabel = `<label for="auth-pin-input" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            <span>2. PIN Presensi (6 Digit) <span class="text-rose-400">*</span></span>
          </label>`.replace(/\n/g, nl);

if (!html.includes(oldPinLabel)) {
  throw new Error('oldPinLabel not found in portal-presensi.html');
}
html = html.replace(oldPinLabel, newPinLabel);
console.log('2. PIN input label cleaned.');

// Clean reset input placeholder & alert texts
html = html.replace(
  'id="reset-nik-input" placeholder="Contoh: NSR-2019-012"',
  'id="reset-nik-input" placeholder="Ketik NIK Karyawan"'
);
html = html.replace(
  'Harap masukkan 6 Digit PIN Presensi Anda! (Default: 123456)',
  'Harap masukkan 6 digit PIN Presensi Anda!'
);

// 2. Standardize KANTOR_REF
const oldKantorRefRegex = /const KANTOR_REF\s*=\s*\[[\s\S]*?\];/;
const newKantorRef = `const KANTOR_REF = [
      { nama: "Pusat Jakarta", lat: -6.28797, lng: 106.82478, radius: 150, timezone: "Asia/Jakarta", tz: "WIB", alamat: "Jl. Hankam No. 5 RT.006 RW.001, Kel. Ragunan, Kec. Pasar Minggu, Jakarta Selatan 12550" },
      { nama: "Cabang Bandung", lat: -6.85978, lng: 107.56043, radius: 150, timezone: "Asia/Jakarta", tz: "WIB", alamat: "Perumahan Pancanaka Royal Garden II, Jl. Pangrango II No. 1A RT.001 RW.012, Kel. Citeureup, Kec. Cimahi Utara, Kota Cimahi, Jawa Barat 40512" },
      { nama: "Cabang Padang", lat: -0.94932, lng: 100.37606, radius: 150, timezone: "Asia/Jakarta", tz: "WIB", alamat: "Jl. Parak Gadang VIII No. 19, Kel. Simpang Haru, Kec. Padang Timur, Kota Padang, Sumatera Barat" },
      { nama: "Cabang Makassar", lat: -5.15650, lng: 119.41200, radius: 200, timezone: "Asia/Makassar", tz: "WITA", alamat: "Jl. Nuri Lr. 301 No. 7, Mariso, Makassar, Sulawesi Selatan" },
      { nama: "Cabang Palembang", lat: -2.92904, lng: 104.69598, radius: 150, timezone: "Asia/Jakarta", tz: "WIB", alamat: "Komplek Griya Hero Abadi Maskarebet, Kec. Alang-Alang Lebar, Kota Palembang, Sumatera Selatan" }
    ];`.replace(/\n/g, nl);

if (!oldKantorRefRegex.test(html)) {
  throw new Error('oldKantorRefRegex not found');
}
html = html.replace(oldKantorRefRegex, newKantorRef);
console.log('3. KANTOR_REF standardized with official 5 addresses.');

// 3. Update Email Modal text: "Daftarkan Email Resmi Presensi" & "💾 Simpan & Lanjutkan"
html = html.replace(
  '<h3 class="text-sm font-bold text-white uppercase tracking-wide">Lengkapi Alamat Email Resmi</h3>',
  '<h3 class="text-sm font-bold text-white uppercase tracking-wide">Daftarkan Email Resmi Presensi</h3>'
);
html = html.replace(
  '💾 Simpan &amp; Lanjutkan Presensi',
  '💾 Simpan &amp; Lanjutkan'
);

// 4. Add Warning Banner in Tab 1 (Presensi Kehadiran) right above formAbsensi
const targetFormAbsen = `<form id="formAbsensi" onsubmit="event.preventDefault(); kirimAbsensi();" class="space-y-4">`.replace(/\n/g, nl);

const newFormAbsenWithBanner = `<div id="banner-warning-default-pin" class="hidden p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200 mb-3">
        <span class="text-base shrink-0">⚠️</span>
        <div class="flex-1">
          <strong class="font-bold text-amber-300">Peringatan Keamanan PIN Default:</strong>
          <p class="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
            Anda saat ini menggunakan PIN default standar (123456). Untuk presensi berikutnya, sistem mewajibkan PIN pribadi demi keamanan akun. Disarankan mengganti PIN sekarang.
          </p>
          <button type="button" onclick="bukaModalGantiPinLangsungManual()" class="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition cursor-pointer">
            Ganti PIN Sekarang
          </button>
        </div>
      </div>

      <form id="formAbsensi" onsubmit="event.preventDefault(); kirimAbsensi();" class="space-y-4">`.replace(/\n/g, nl);

if (!html.includes(targetFormAbsen)) {
  throw new Error('targetFormAbsen not found');
}
html = html.replace(targetFormAbsen, newFormAbsenWithBanner);
console.log('4. Banner warning default PIN added above formAbsensi.');

// 5. Update #panelWFH with locked card
const targetPanelWFH = `<div id="panelWFH" class="hidden space-y-4">
      <form id="formWFH" onsubmit="event.preventDefault(); kirimWFH();" class="space-y-4">`.replace(/\n/g, nl);

const newPanelWFH = `<div id="panelWFH" class="hidden space-y-4">
      <!-- KARTU WFH TERKUNCI PERMANEN (JIKA SUDAH TERDAFTAR) -->
      <div id="wfh-locked-card" class="hidden p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5">
        <div class="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
          <span>📍</span>
          <span>Titik Rumah WFH Terkunci Permanen</span>
        </div>
        <p class="text-xs text-slate-200 leading-relaxed">
          <strong class="text-slate-400">Alamat Terdaftar:</strong> <br><span id="wfh-locked-alamat" class="text-white font-medium">-</span>
        </p>
        <p class="text-xs text-slate-300 font-mono">
          <strong class="text-slate-400 font-sans">Koordinat GPS:</strong> <span id="wfh-locked-gps" class="text-emerald-300 font-bold">-</span>
        </p>
        <div class="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-slate-400">
          <span class="text-emerald-400 font-semibold">✓ Terdaftar Resmi di HR KJPP NSR</span>
          <span class="text-slate-400 text-[10px]">(Registrasi ulang dinonaktifkan)</span>
        </div>
      </div>

      <form id="formWFH" onsubmit="event.preventDefault(); kirimWFH();" class="space-y-4">`.replace(/\n/g, nl);

if (!html.includes(targetPanelWFH)) {
  throw new Error('targetPanelWFH not found');
}
html = html.replace(targetPanelWFH, newPanelWFH);
console.log('5. wfh-locked-card added to panelWFH.');

// 6. Add Modal Ganti PIN Langsung (#modal-ganti-pin-langsung) right before modal-reset-pin
const targetBeforeModalReset = `  <!-- ========================================================
       MODAL RESET / GANTI PIN MANDIRI VIA EMAIL
       ======================================================== -->
  <div id="modal-reset-pin"`.replace(/\n/g, nl);

const modalGantiPinLangsungHTML = `  <!-- ========================================================
       MODAL GANTI PIN DEFAULT WAJIB (ON-SCREEN DIRECT UPDATE)
       ======================================================== -->
  <div id="modal-ganti-pin-langsung" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
      <div class="flex items-center gap-3 border-b border-slate-800 pb-3">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg">
          🔒
        </div>
        <div>
          <h3 class="text-sm font-bold text-white uppercase tracking-wide">PIN Default Wajib Diganti</h3>
          <p class="text-[11px] text-amber-400 font-medium">Pengamanan Akun Presensi Karyawan KJPP NSR</p>
        </div>
      </div>

      <div class="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs space-y-1">
        <p class="text-slate-200">Halo <strong id="modal-pin-nama" class="text-amber-300">-</strong> (<span id="modal-pin-nik" class="font-mono text-slate-300">-</span>),</p>
        <p class="text-[11px] text-slate-300 leading-relaxed">
          PIN default standar (<strong class="text-white font-mono">123456</strong>) wajib diganti sebelum melanjutkan presensi ke-2 dan seterusnya demi keamanan identitas Anda.
        </p>
      </div>

      <form id="form-ganti-pin-langsung" onsubmit="event.preventDefault(); eksekusiSimpanPinLangsung();" class="space-y-3">
        <div>
          <label for="input-pin-baru" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
            PIN Baru (6 Digit Angka) <span class="text-rose-400">*</span>
          </label>
          <input type="password" id="input-pin-baru" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="Ketik 6 Digit Angka" required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono tracking-widest focus:outline-none focus:border-amber-400 transition">
        </div>

        <div>
          <label for="input-pin-baru-konf" class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
            Konfirmasi PIN Baru <span class="text-rose-400">*</span>
          </label>
          <input type="password" id="input-pin-baru-konf" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="Ulangi 6 Digit PIN Baru" required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono tracking-widest focus:outline-none focus:border-amber-400 transition">
        </div>

        <p id="err-pin-langsung" class="text-[11px] text-rose-400 font-semibold hidden"></p>

        <button type="submit" id="btn-simpan-pin-langsung" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 btn-tactile cursor-pointer">
          💾 Simpan PIN Baru &amp; Lanjutkan
        </button>
      </form>
    </div>
  </div>

  <!-- ========================================================
       MODAL RESET / GANTI PIN MANDIRI VIA EMAIL
       ======================================================== -->
  <div id="modal-reset-pin"`.replace(/\n/g, nl);

if (!html.includes(targetBeforeModalReset)) {
  throw new Error('targetBeforeModalReset not found');
}
html = html.replace(targetBeforeModalReset, modalGantiPinLangsungHTML);
console.log('6. modal-ganti-pin-langsung added.');

// 7. Add direct_change_pin in actionsSupportedByGAS
html = html.replace(
  `const actionsSupportedByGAS = ['cekKaryawan', 'verify_pin', 'verifyPin',`,
  `const actionsSupportedByGAS = ['cekKaryawan', 'verify_pin', 'verifyPin', 'direct_change_pin', 'directChangePin',`
);

// 8. Update JavaScript logic: force_change_pin check
const targetEksekusiMasukPinCheck = `        // Periksa apakah karyawan belum memiliki email di database (Auto-Prompt Mandiri)
        if (res.needs_email_update) {
          pendingNikForEmailUpdate = cleanNik;
          pendingUserForEmailUpdate = res;
          bukaModalLengkapiEmail(res.nama || cleanNik, cleanNik);
          return;
        }`.replace(/\n/g, nl);

const newEksekusiMasukPinCheck = `        // Periksa apakah karyawan belum memiliki email di database (Auto-Prompt Mandiri)
        if (res.needs_email_update) {
          pendingNikForEmailUpdate = cleanNik;
          pendingUserForEmailUpdate = res;
          bukaModalLengkapiEmail(res.nama || cleanNik, cleanNik);
          return;
        }

        // Periksa apakah PIN default wajib diganti (Presensi ke-2 dan seterusnya)
        if (res.force_change_pin) {
          pendingNikForPinChange = cleanNik;
          pendingUserForPinChange = res;
          bukaModalGantiPinLangsung(res.nama || cleanNik, cleanNik);
          return;
        }`.replace(/\n/g, nl);

if (!html.includes(targetEksekusiMasukPinCheck)) {
  throw new Error('targetEksekusiMasukPinCheck not found');
}
html = html.replace(targetEksekusiMasukPinCheck, newEksekusiMasukPinCheck);
console.log('7. force_change_pin check added to eksekusiMasukPin.');

// Update sessionUser creation in eksekusiMasukPin
const targetSessionUserAssign = `        sessionUser = {
          nama: data.nama || res.nama || 'Karyawan',
          jabatan: data.jabatan || res.jabatan || '',
          divisi: data.divisi || res.divisi || '',
          cabang: data.cabang || res.cabang || 'Pusat Jakarta',
          isAdminHR: !!(data.isAdminHR || res.isAdminHR || cleanNik === 'NSR-2019-005')
        };`.replace(/\n/g, nl);

const newSessionUserAssign = `        sessionUser = {
          nama: data.nama || res.nama || 'Karyawan',
          jabatan: data.jabatan || res.jabatan || '',
          divisi: data.divisi || res.divisi || '',
          cabang: data.cabang || res.cabang || 'Pusat Jakarta',
          email: data.email || res.email || '',
          gps_wfh: data.gps_wfh || res.gps_wfh || '',
          alamat_wfh: data.alamat_wfh || res.alamat_wfh || '',
          isAdminHR: !!(data.isAdminHR || res.isAdminHR || cleanNik === 'NSR-2019-005')
        };

        const warnBanner = document.getElementById('banner-warning-default-pin');
        if (warnBanner) {
          if (res.warning_default_pin) {
            warnBanner.classList.remove('hidden');
          } else {
            warnBanner.classList.add('hidden');
          }
        }`.replace(/\n/g, nl);

if (!html.includes(targetSessionUserAssign)) {
  throw new Error('targetSessionUserAssign not found');
}
html = html.replace(targetSessionUserAssign, newSessionUserAssign);
console.log('8. sessionUser extended with WFH and default PIN warning.');

// Add global pendingNikForPinChange and modal functions
const targetModalLengkapiEmailFunc = `    function bukaModalLengkapiEmail(nama, nik) {`.replace(/\n/g, nl);

const newPinFunctions = `    let pendingNikForPinChange = "";
    let pendingUserForPinChange = null;

    function bukaModalGantiPinLangsung(nama, nik) {
      const modal = document.getElementById('modal-ganti-pin-langsung');
      const elNama = document.getElementById('modal-pin-nama');
      const elNik = document.getElementById('modal-pin-nik');
      const inpBaru = document.getElementById('input-pin-baru');
      const inpKonf = document.getElementById('input-pin-baru-konf');
      const errEl = document.getElementById('err-pin-langsung');

      if (elNama) elNama.textContent = nama;
      if (elNik) elNik.textContent = nik;
      if (inpBaru) inpBaru.value = '';
      if (inpKonf) inpKonf.value = '';
      if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden'); }
      if (modal) modal.classList.remove('hidden');
      setTimeout(() => { if (inpBaru) inpBaru.focus(); }, 200);
    }

    function tutupModalGantiPinLangsung() {
      const modal = document.getElementById('modal-ganti-pin-langsung');
      if (modal) modal.classList.add('hidden');
    }

    function bukaModalGantiPinLangsungManual() {
      if (!sessionNik) return;
      pendingNikForPinChange = sessionNik;
      bukaModalGantiPinLangsung(sessionUser ? sessionUser.nama : sessionNik, sessionNik);
    }

    async function eksekusiSimpanPinLangsung() {
      const inpBaru = document.getElementById('input-pin-baru');
      const inpKonf = document.getElementById('input-pin-baru-konf');
      const errEl = document.getElementById('err-pin-langsung');
      const btn = document.getElementById('btn-simpan-pin-langsung');

      const pinBaru = (inpBaru?.value || '').trim();
      const pinKonf = (inpKonf?.value || '').trim();

      if (!/^\\d{6}$/.test(pinBaru)) {
        if (errEl) { errEl.textContent = 'PIN Baru harus tepat 6 digit angka!'; errEl.classList.remove('hidden'); }
        if (inpBaru) inpBaru.focus();
        return;
      }

      if (pinBaru === '123456') {
        if (errEl) { errEl.textContent = 'PIN Baru tidak boleh menggunakan PIN default standar (123456)!'; errEl.classList.remove('hidden'); }
        if (inpBaru) inpBaru.focus();
        return;
      }

      if (pinBaru !== pinKonf) {
        if (errEl) { errEl.textContent = 'Konfirmasi PIN Baru tidak cocok!'; errEl.classList.remove('hidden'); }
        if (inpKonf) inpKonf.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Menyimpan PIN Baru...';
      }

      try {
        const payload = new FormData();
        payload.append('action', 'direct_change_pin');
        payload.append('nik', pendingNikForPinChange || sessionNik);
        payload.append('new_pin', pinBaru);

        let res = null;
        try {
          const response = await fetch('backend/absensi-data-handler.php', {
            method: 'POST',
            body: payload,
            credentials: 'include'
          });
          if (response.ok) {
            res = await response.json();
          } else {
            res = await response.json().catch(() => null);
          }
        } catch (e) {
          console.warn('[Direct change_pin fetch fallback]:', e.message);
        }

        if (!res) {
          res = await callBackend('direct_change_pin', {
            nik: pendingNikForPinChange || sessionNik,
            new_pin: pinBaru
          });
        }

        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Simpan PIN Baru & Lanjutkan';
        }

        if (!res || res.status === 'error' || res.success === false) {
          if (errEl) {
            errEl.textContent = (res && res.message) || 'Gagal menyimpan PIN baru. Silakan coba kembali.';
            errEl.classList.remove('hidden');
          }
          return;
        }

        tutupModalGantiPinLangsung();

        // Autentikasi sesi aktif
        const data = res.data || res;
        sessionToken = res.sessionToken || data.sessionToken || ('NSR_PIN_' + Date.now());
        sessionNik = pendingNikForPinChange || sessionNik;
        sessionUser = {
          nama: data.nama || res.nama || (sessionUser ? sessionUser.nama : 'Karyawan'),
          jabatan: data.jabatan || res.jabatan || (sessionUser ? sessionUser.jabatan : ''),
          divisi: data.divisi || res.divisi || (sessionUser ? sessionUser.divisi : ''),
          cabang: data.cabang || res.cabang || (sessionUser ? sessionUser.cabang : 'Pusat Jakarta'),
          email: data.email || res.email || (sessionUser ? sessionUser.email : ''),
          gps_wfh: data.gps_wfh || res.gps_wfh || (sessionUser ? sessionUser.gps_wfh : ''),
          alamat_wfh: data.alamat_wfh || res.alamat_wfh || (sessionUser ? sessionUser.alamat_wfh : ''),
          isAdminHR: !!(data.isAdminHR || res.isAdminHR || sessionNik === 'NSR-2019-005')
        };

        const warnBanner = document.getElementById('banner-warning-default-pin');
        if (warnBanner) warnBanner.classList.add('hidden');

        pasangStateTerverifikasi();
        bukaModalNotif('PIN Berhasil Diperbarui ✅', 'PIN Baru Anda telah aktif. Anda dapat langsung melanjutkan presensi.');
      } catch (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Simpan PIN Baru & Lanjutkan';
        }
        if (errEl) {
          errEl.textContent = err.message || 'Gagal menyimpan PIN baru.';
          errEl.classList.remove('hidden');
        }
      }
    }

    function bukaModalLengkapiEmail(nama, nik) {`.replace(/\n/g, nl);

if (!html.includes(targetModalLengkapiEmailFunc)) {
  throw new Error('targetModalLengkapiEmailFunc not found');
}
html = html.replace(targetModalLengkapiEmailFunc, newPinFunctions);
console.log('9. direct change PIN JS functions added.');

// 10. Update pasangStateTerverifikasi to lock WFH card if registered
const targetPasangStateBadges = `      updateIdentitasBadges();
    }`.replace(/\n/g, nl);

const newPasangStateBadges = `      updateIdentitasBadges();

      // Kunci Titik Rumah WFH jika sudah terdaftar
      const wfhLockedCard = document.getElementById('wfh-locked-card');
      const formWFH = document.getElementById('formWFH');
      if (wfhLockedCard && formWFH) {
        if (sessionUser && sessionUser.gps_wfh) {
          wfhLockedCard.classList.remove('hidden');
          formWFH.classList.add('hidden');
          const alEl = document.getElementById('wfh-locked-alamat');
          const gpsEl = document.getElementById('wfh-locked-gps');
          if (alEl) alEl.textContent = sessionUser.alamat_wfh || 'Alamat Terdaftar di Database Resmi';
          if (gpsEl) gpsEl.textContent = sessionUser.gps_wfh;
        } else {
          wfhLockedCard.classList.add('hidden');
          formWFH.classList.remove('hidden');
        }
      }
    }`.replace(/\n/g, nl);

if (!html.includes(targetPasangStateBadges)) {
  throw new Error('targetPasangStateBadges not found');
}
html = html.replace(targetPasangStateBadges, newPasangStateBadges);
console.log('10. pasangStateTerverifikasi updated with WFH lock check.');

// 11. Update location radio switch & nearest office calculation for WFH
const targetUpdateNearestOffice = `    function updateNearestOffice(lat, lng) {
      let minDistance = Infinity;
      let nearestOffice = "";

      KANTOR_REF.forEach(k => {
        const d = calculateDistance(lat, lng, k.lat, k.lng);
        if (d < minDistance) {
          minDistance = d;
          nearestOffice = k.nama;
        }
      });

      const offName = document.getElementById('nearest-office-name');
      const offDist = document.getElementById('nearest-office-dist');
      if (offName) offName.innerText = nearestOffice;
      if (offDist) {
        if (minDistance < 1) {
          offDist.innerText = \`\${Math.round(minDistance * 1000)} meter\`;
        } else {
          offDist.innerText = \`\${minDistance.toFixed(1)} km\`;
        }
      }

      const connPill = document.getElementById('conn-status-pill');
      if (connPill) {
        document.getElementById('conn-indicator-text').innerText = 'Terhubung ke Database';
      }
    }`.replace(/\n/g, nl);

const newUpdateNearestOffice = `    function updateNearestOffice(lat, lng) {
      const locVal = document.getElementById('lokasi')?.value || 'KANTOR';
      const offName = document.getElementById('nearest-office-name');
      const offDist = document.getElementById('nearest-office-dist');

      if (locVal === 'WFH') {
        if (sessionUser && sessionUser.gps_wfh) {
          const wParts = sessionUser.gps_wfh.split(',');
          if (wParts.length >= 2) {
            const wLat = parseFloat(wParts[0].trim());
            const wLng = parseFloat(wParts[1].trim());
            const distKm = calculateDistance(lat, lng, wLat, wLng);
            const distM = Math.round(distKm * 1000);
            if (offName) offName.innerText = 'Rumah (WFH)';
            if (offDist) {
              offDist.innerText = distM < 1000 ? \`\${distM} meter\` : \`\${distKm.toFixed(1)} km\`;
              if (distM <= 100) {
                offDist.className = "font-mono text-emerald-400 font-bold";
              } else {
                offDist.className = "font-mono text-rose-400 font-bold";
              }
            }
            return;
          }
        }
        if (offName) offName.innerText = 'Rumah (Belum Terdaftar)';
        if (offDist) offDist.innerText = '-';
        return;
      }

      let minDistance = Infinity;
      let nearestOffice = "";

      KANTOR_REF.forEach(k => {
        const d = calculateDistance(lat, lng, k.lat, k.lng);
        if (d < minDistance) {
          minDistance = d;
          nearestOffice = k.nama;
        }
      });

      if (offName) offName.innerText = nearestOffice;
      if (offDist) {
        offDist.className = "font-mono text-sky-400 font-bold";
        if (minDistance < 1) {
          offDist.innerText = \`\${Math.round(minDistance * 1000)} meter\`;
        } else {
          offDist.innerText = \`\${minDistance.toFixed(1)} km\`;
        }
      }

      const connPill = document.getElementById('conn-status-pill');
      if (connPill) {
        document.getElementById('conn-indicator-text').innerText = 'Terhubung ke Database';
      }
    }

    function onLokasiChange(mode) {
      document.getElementById('lokasi').value = mode;
      if (userLat && userLng) {
        updateNearestOffice(userLat, userLng);
      }
    }`.replace(/\n/g, nl);

if (!html.includes(targetUpdateNearestOffice)) {
  throw new Error('targetUpdateNearestOffice not found');
}
html = html.replace(targetUpdateNearestOffice, newUpdateNearestOffice);
console.log('11. updateNearestOffice updated to handle WFH calculations.');

// Update radio onchange in HTML
html = html.replace(
  `onchange="document.getElementById('lokasi').value='KANTOR'"`,
  `onchange="onLokasiChange('KANTOR')"`
);
html = html.replace(
  `onchange="document.getElementById('lokasi').value='WFH'"`,
  `onchange="onLokasiChange('WFH')"`
);
console.log('12. Radio onchange handlers updated.');

fs.writeFileSync(targetFile, html, 'utf8');
console.log('portal-presensi.html updated successfully!');

// Replicate to presensi.html and portal-absensi.html
fs.writeFileSync(path.join(ROOT_DIR, 'presensi.html'), html, 'utf8');
fs.writeFileSync(path.join(ROOT_DIR, 'portal-absensi.html'), html, 'utf8');
console.log('Mirrors presensi.html and portal-absensi.html synchronized successfully!');
