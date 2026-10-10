/**
 * KJPP NSR - Fail-Safe Staging Kwitansi Builder
 * (Fast-Track Keamanan Portal Kwitansi)
 * 
 * Aturan Mutlak Builder:
 * 1. Setiap pola yang wajib diganti diverifikasi secara ketat (strictReplace).
 *    Jika satu pola saja tidak ditemukan, proses build LANGSUNG BERHENTI (fail-closed halt).
 * 2. Hasil build ditulis ke file sementara (.tmp) dan diaudit ulang (post-build audit).
 * 3. Jika ditemukan referensi produksi atau token hardcoded, berkas sementara langsung dihapus dan exit(1).
 * 4. Berkas paket tujuan HANYA diterbitkan apabila seluruh audit lulus 100%.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const srcPath = path.join(ROOT_DIR, "portal-kwitansi.html");
const destPath = path.join(ROOT_DIR, "staging-isolated-package", "public", "portal-kwitansi-staging.html");
const tmpPath = destPath + ".tmp";

function strictReplace(content, search, replacement, label) {
  let matched = false;
  if (typeof search === "string") {
    matched = content.includes(search);
  } else if (search instanceof RegExp) {
    matched = search.test(content);
  }
  if (!matched) {
    throw new Error(`[BUILD_HALT_ERROR] Pola wajib '${label}' TIDAK DITEMUKAN dalam source! Proses build dibatalkan untuk mencegah sanitasi parsial.`);
  }
  return content.replace(search, replacement);
}

function buildStagingKwitansi() {
  console.log("🔨 Memulai Fail-Safe Build: portal-kwitansi-staging.html...");

  if (!fs.existsSync(srcPath)) {
    throw new Error(`[BUILD_HALT_ERROR] Berkas sumber ${srcPath} tidak ditemukan!`);
  }

  let html = fs.readFileSync(srcPath, "utf-8");

  // 1. Title & Meta Robots
  html = strictReplace(
    html,
    "<title>Portal Pengajuan &amp; Verifikasi Kwitansi Resmi | KJPP Nanang Rahayu Sigit Paryanto dan Rekan</title>",
    "<title>Portal Kwitansi (Staging Terisolasi) | KJPP Nanang Rahayu Sigit Paryanto dan Rekan</title>",
    "Halaman Title"
  );

  html = strictReplace(
    html,
    '<meta name="robots" content="noindex, nofollow">',
    '<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">',
    "Meta Robots"
  );

  // 2. Navigasi Header
  html = strictReplace(
    html,
    '<a href="portal-nolap.html"',
    '<a href="portal-nolap-staging.html"',
    "Link Portal NoLap Staging"
  );

  html = strictReplace(
    html,
    '<span id="label-sesi-cabang" class="font-bold">Akses: Menunggu Token</span>',
    `<span id="label-sesi-cabang" class="font-bold">Akses: Memeriksa Sesi...</span>
          <button id="btn-logout-header" onclick="keluarSesiKwitansi()" class="hidden ml-2 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold border border-rose-500/30">Keluar</button>`,
    "Header Session Badge"
  );

  // 3. Banner Dokumen Staging
  const bannerRegex = /<!-- ==================== BANNER INFORMASI DOKUMEN ==================== -->[\s\S]*?<\/section>/;
  const stagingBanner = `<!-- ==================== BANNER INFORMASI STAGING TERISOLASI ==================== -->
  <section class="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-b border-amber-500/30 py-2.5 px-4 no-print">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2 text-slate-300">
        <span class="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-[10px] uppercase border border-amber-400/30">LINGKUNGAN STAGING TERISOLASI</span>
        <span>Autentikasi Server &bull; Sesi HttpOnly &bull; RBAC Keuangan Pusat &amp; Cabang &bull; Data Sintetis Non-Produksi</span>
      </div>
      <div class="text-[11px] text-amber-300/90 flex items-center gap-1.5 font-bold">
        <span>🔒 Hak Akses Server-Side Aktif</span>
      </div>
    </div>
  </section>`;
  html = strictReplace(html, bannerRegex, stagingBanner, "Banner Staging");

  // 4. Ganti Box Proteksi Token Cabang dengan Dialog Login Server Terpadu
  const authCabangBoxRegex = /<!-- Box Proteksi Token Cabang -->[\s\S]*?<!-- Konten Formulir Cabang \(Terbuka setelah Token Valid\) -->/;
  const serverAuthBox = `<!-- Box Proteksi Autentikasi Server Terpadu -->
      <div id="box-auth-kwitansi" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto text-center space-y-4 shadow-2xl">
        <div class="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-400/20">
          <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div>
          <h2 class="text-base font-bold text-white">Autentikasi Server Sistem Kwitansi</h2>
          <p class="text-xs text-slate-400 mt-1">Sistem Kwitansi dilindungi autentikasi server. Masukkan nama pengguna dan kata sandi Anda.</p>
        </div>
        <div class="space-y-3 text-left">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Nama Pengguna (Username)</label>
            <input type="text" id="kwitansi-auth-username" autocomplete="username" placeholder="test_cabang_bdg / test_keuangan / test_admin" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi (Password)</label>
            <input type="password" id="kwitansi-auth-password" autocomplete="current-password" onkeydown="if(event.key==='Enter') masukSesiKwitansi()" placeholder="••••••••" class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400">
          </div>
          <button type="button" id="btn-login-kwitansi" onclick="masukSesiKwitansi()" class="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition">
            Masuk Sesi Server &rarr;
          </button>
          <p id="pesan-auth-kwitansi" class="text-xs text-rose-400 hidden text-center"></p>
        </div>
        <div class="pt-2 border-t border-slate-800/80 text-[10.5px] text-slate-500">
          <span>🔒 Akses Terproteksi: Sesi HttpOnly &bull; RBAC Mutlak Server-Side</span>
        </div>
      </div>

      <!-- Konten Formulir Cabang (Terbuka setelah Sesi Sah) -->`;
  html = strictReplace(html, authCabangBoxRegex, serverAuthBox, "Box Autentikasi Cabang");

  // Ganti placeholder nomor WhatsApp staf pengaju
  html = strictReplace(
    html,
    'placeholder="Contoh: 081220314609"',
    'placeholder="Contoh: 081200000001 (Dummy)"',
    "Placeholder WA Pengaju"
  );

  // Ganti panel notifikasi sukses dengan notifikasi server internal bersih
  const notifikasiSuksesRegex = /<!-- Notifikasi Sukses & Tombol Notifikasi Cepat -->[\s\S]*?<!-- ==========================================\s*PANEL 2: VERIFIKASI & PENGESAHAN \(PUSAT\)/;
  const notifikasiSuksesReplacement = `<!-- Notifikasi Sukses Server Terpadu -->
        <div id="panel-notifikasi-sukses" class="hidden mt-6 p-4 sm:p-5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 space-y-3 shadow-xl">
          <div class="flex items-center gap-2.5 text-emerald-300 font-bold text-xs sm:text-sm">
            <svg class="w-5 h-5 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Draf Kwitansi Berhasil Diajukan ke Sistem Keuangan Pusat!</span>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            Data pengajuan draf kwitansi Anda telah tercatat secara aman di antrean server Keuangan Kantor Pusat. Bagian Keuangan Pusat dapat memverifikasi, menetapkan nomor registrasi resmi, dan mengesahkan dokumen melalui portal.
          </p>
          <div class="p-2.5 rounded-lg bg-emerald-900/40 border border-emerald-500/30 text-xs text-emerald-200">
            <span>Status: <strong class="text-amber-300">Menunggu Verifikasi Keuangan Pusat</strong> (Tersimpan di Penyimpanan Terproteksi).</span>
          </div>
        </div>

      </div>

    </div>

  </div>

    <!-- ==========================================
         PANEL 2: VERIFIKASI & PENGESAHAN (PUSAT)`;
  html = strictReplace(html, notifikasiSuksesRegex, notifikasiSuksesReplacement, "Sanitasi Panel Notifikasi Sukses");

  // Ganti tombol ganti token / keluar di notifikasi sesi
  html = strictReplace(
    html,
    '<button type="button" onclick="kunciKembaliCabang()" class="text-[11px] text-slate-400 hover:text-rose-400 underline transition">Ganti Token / Keluar</button>',
    '<button type="button" onclick="keluarSesiKwitansi()" class="text-[11px] text-slate-400 hover:text-rose-400 underline transition">Keluar Sesi</button>',
    "Tombol Keluar Sesi Cabang"
  );

  // 5. Ganti Panel Pusat: Hapus box token terpisah dan ganti dengan guard server-side
  const authPusatBoxRegex = /<!-- Box Proteksi Token Pusat -->[\s\S]*?<!-- Form Pengesahan Resmi \(Terbuka setelah Token Valid\) -->/;
  const pusatGuardReplacement = `<!-- Banner Guard Akses Khusus Keuangan Pusat -->
      <div id="guard-akses-pusat-cabang" class="hidden bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto text-center space-y-3 shadow-2xl">
        <div class="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
          <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 class="text-base font-bold text-white">Akses Dibatasi (Keuangan Pusat)</h2>
        <p class="text-xs text-slate-400 leading-relaxed">
          Akun Anda terdaftar sebagai <strong class="text-amber-400">Kantor Cabang</strong>. Hak akses verifikasi administrasi dan pengesahan kwitansi resmi dibatasi secara eksklusif untuk Bagian Keuangan Kantor Pusat.
        </p>
      </div>

      <!-- Form Pengesahan Resmi (Terbuka untuk Keuangan Pusat & Admin Pusat) -->`;
  html = strictReplace(html, authPusatBoxRegex, pusatGuardReplacement, "Guard Panel Keuangan Pusat");

  html = strictReplace(
    html,
    `<button onclick="kunciKembaliPusat()" class="text-[10px] text-slate-400 hover:text-rose-400 underline">Kunci Panel</button>`,
    `<button onclick="keluarSesiKwitansi()" class="text-[10px] text-slate-400 hover:text-rose-400 underline">Keluar Sesi</button>`,
    "Tombol Keluar Panel Keuangan"
  );

  // 6. Ganti Script Logic Engine Seluruhnya dengan Engine Terproteksi Server-Side
  const scriptRegex = /<script>[\s\S]*?<\/script>/;
  const serverScript = `<script>
    // =========================================================================
    // KJPP NSR - LOGIKA SISTEM KWITANSI STAGING TERISOLASI (SERVER-SIDE AUTH)
    // =========================================================================

    // Status Sesi Pengguna Aktif
    let currentUser = null;

    // Daftar Pejabat Penandatangan Resmi KJPP NSR (Simulasi Staging)
    const DAFTAR_PEJABAT = {
      "1": {
        nama: "Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)",
        jabatan: "Pemimpin Rekan",
        subjabatan: "Pemimpin Rekan",
        parafDefault: "Nanang Rahayu"
      },
      "2": {
        nama: "Milda Hidayati Dewi, S.E.",
        jabatan: "Keuangan",
        subjabatan: "Keuangan",
        parafDefault: "Milda H. Dewi"
      },
      "3": {
        nama: "Ricca Noer Farikha, S.E.",
        jabatan: "Keuangan",
        subjabatan: "Keuangan",
        parafDefault: "Ricca N. Farikha"
      }
    };

    // Database Draf Aktif di Memori Sesi
    let dataKwitansiAktif = {
      idDraft: "",
      cabang: "Cabang Bandung",
      tanggal: new Date().toISOString().split('T')[0],
      klien: "PT Rekanan Simulasi Mandiri (Dummy)",
      keterangan: "Biaya Penilaian Aset Properti & Agunan Bank",
      banyaknya: "100% Pelunasan",
      hargaDasar: 25000000,
      tarifPpn: 0.11,
      nominalPpn: 2750000,
      totalBayar: 27750000,
      terbilang: "Dua Puluh Tujuh Juta Tujuh Ratus Lima Puluh Ribu Rupiah",
      noKwitansiResmi: "018/KW-NSR/X/2026",
      tempatTerbit: "Jakarta",
      tglSah: new Date().toISOString().split('T')[0],
      idPejabat: "1",
      namaPejabat: "Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)",
      jabatanPejabat: "Pemimpin Rekan",
      subjabatanPejabat: "Pemimpin Rekan",
      modeTTD: "digital",
      modeStempel: "default",
      stempelAktif: true,
      isApproved: false
    };

    // 1. Inisialisasi Saat Halaman Dimuat
    document.addEventListener('DOMContentLoaded', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tglInput = document.getElementById('tgl-pengajuan');
      const tglResmi = document.getElementById('tgl-kwitansi-resmi');
      if (tglInput) tglInput.value = today;
      if (tglResmi) tglResmi.value = today;

      const elHarga = document.getElementById('harga-dasar');
      if (elHarga && !elHarga.value) {
        elHarga.value = 25000000;
      }
      hitungKwitansi();
      gantiPejabatTTD();
      initSignaturePad();
      initPasteListeners();

      // Periksa sesi server HttpOnly secara otomatis
      await periksaSesiKwitansi();
    });

    // 2. Pemeriksaan Sesi Server-Side (GET /api/auth-verify)
    async function periksaSesiKwitansi() {
      try {
        const res = await fetch('/api/auth-verify', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const result = await res.json();
          if (result && result.authenticated && result.user) {
            terapkanSesiPengguna(result.user);
            return;
          }
        }
      } catch (e) {
        console.warn('Gagal verifikasi sesi:', e.message);
      }
      tampilkanLoginState();
    }

    // 3. Login Pengguna ke Server (POST /api/auth-login)
    async function masukSesiKwitansi() {
      const usernameInput = document.getElementById('kwitansi-auth-username');
      const passwordInput = document.getElementById('kwitansi-auth-password');
      const errEl = document.getElementById('pesan-auth-kwitansi');
      const btn = document.getElementById('btn-login-kwitansi');

      const identifier = (usernameInput?.value || '').trim();
      const password = passwordInput?.value || '';

      if (!identifier || !password) {
        if (errEl) {
          errEl.innerText = 'Nama pengguna dan kata sandi wajib diisi.';
          errEl.classList.remove('hidden');
        }
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Memverifikasi...';
      }
      if (errEl) errEl.classList.add('hidden');

      try {
        const res = await fetch('/api/auth-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          if (passwordInput) passwordInput.value = '';
          await periksaSesiKwitansi();
        } else {
          if (errEl) {
            errEl.innerText = data.error || 'Autentikasi gagal. Periksa kredensial Anda.';
            errEl.classList.remove('hidden');
          }
        }
      } catch (err) {
        if (errEl) {
          errEl.innerText = 'Gagal menghubungi server autentikasi.';
          errEl.classList.remove('hidden');
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerText = 'Masuk Sesi Server →';
        }
      }
    }

    // 4. Logout Pengguna (POST /api/auth-logout)
    async function keluarSesiKwitansi() {
      try {
        await fetch('/api/auth-logout', { method: 'POST' });
      } catch (e) {}
      currentUser = null;
      tampilkanLoginState();
    }

    function tampilkanLoginState() {
      document.getElementById('box-auth-kwitansi').classList.remove('hidden');
      document.getElementById('konten-form-cabang').classList.add('hidden');
      document.getElementById('konten-operasional-pusat').classList.add('hidden');
      document.getElementById('guard-akses-pusat-cabang').classList.add('hidden');
      document.getElementById('btn-logout-header').classList.add('hidden');
      
      const labelBadge = document.getElementById('label-sesi-cabang');
      const dot = document.getElementById('dot-sesi-cabang');
      if (labelBadge) labelBadge.innerText = 'Akses: Belum Login';
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
    }

    // 5. Terapkan Sesi Sesuai Role Pengguna
    function terapkanSesiPengguna(user) {
      currentUser = user;
      document.getElementById('box-auth-kwitansi').classList.add('hidden');
      document.getElementById('btn-logout-header').classList.remove('hidden');

      const labelBadge = document.getElementById('label-sesi-cabang');
      const dot = document.getElementById('dot-sesi-cabang');
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';

      const isCabang = user.role === 'CABANG';
      const isKeuangan = user.role === 'KEUANGAN' || user.role === 'ADMIN_PUSAT';

      if (labelBadge) {
        labelBadge.innerText = \`Akses: \${user.displayName || user.sub} (\${user.role})\`;
      }

      const labelVerified = document.getElementById('label-cabang-terverifikasi');
      if (labelVerified) {
        labelVerified.innerText = isCabang ? \`Cabang \${user.branch}\` : \`\${user.displayName} (\${user.role})\`;
      }

      // Kunci pilihan dropdown jika role Cabang
      const selCabang = document.getElementById('cabang-pengaju');
      if (selCabang && isCabang && user.branch) {
        for (let i = 0; i < selCabang.options.length; i++) {
          if (selCabang.options[i].value.toLowerCase().includes(user.branch.toLowerCase())) {
            selCabang.selectedIndex = i;
            break;
          }
        }
        selCabang.disabled = true;
      } else if (selCabang) {
        selCabang.disabled = false;
      }

      // Default buka tab cabang untuk submit draf
      document.getElementById('konten-form-cabang').classList.remove('hidden');

      // Sinkronkan panel pusat
      if (isKeuangan) {
        document.getElementById('guard-akses-pusat-cabang').classList.add('hidden');
        muatDaftarDrafPusat();
      }

      perbaruiPreviewKwitansi();
    }

    // 6. Muat Antrean Draf Kwitansi dari Server
    async function muatDaftarDrafPusat() {
      try {
        const res = await fetch('/api/kwitansi-data-proxy', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          const result = await res.json();
          if (result && result.data && result.data.length > 0) {
            const draftTerbaru = result.data[0];
            // Muat data draf ke formulir otorisasi jika ada
            if (draftTerbaru && !dataKwitansiAktif.isApproved) {
              dataKwitansiAktif.idDraft = draftTerbaru.idDraft;
              dataKwitansiAktif.klien = draftTerbaru.klien;
              dataKwitansiAktif.keterangan = draftTerbaru.keterangan;
              dataKwitansiAktif.banyaknya = draftTerbaru.banyaknya;
              dataKwitansiAktif.hargaDasar = draftTerbaru.hargaDasar;
              dataKwitansiAktif.tarifPpn = draftTerbaru.tarifPpn;
              dataKwitansiAktif.nominalPpn = draftTerbaru.nominalPpn;
              dataKwitansiAktif.totalBayar = draftTerbaru.totalBayar;
              dataKwitansiAktif.terbilang = draftTerbaru.terbilang;
              perbaruiPreviewKwitansi();
            }
          }
        }
      } catch (e) {
        console.warn('Gagal memuat antrean kwitansi:', e.message);
      }
    }

    // 7. Navigasi Antar Tab dengan Proteksi RBAC
    function gantiTab(tab) {
      if (!currentUser) {
        alert('Silakan login terlebih dahulu.');
        return;
      }

      const btnCabang = document.getElementById('tab-btn-cabang');
      const btnPusat = document.getElementById('tab-btn-pusat');
      const pCabang = document.getElementById('panel-cabang');
      const pPusat = document.getElementById('panel-pusat');

      const isKeuangan = currentUser.role === 'KEUANGAN' || currentUser.role === 'ADMIN_PUSAT';

      if (tab === 'cabang') {
        btnCabang.className = "py-3 px-4 sm:px-6 font-extrabold text-xs sm:text-sm border-b-2 border-amber-400 text-amber-400 flex items-center gap-2 transition";
        btnPusat.className = "py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-2 transition";
        pCabang.classList.remove('hidden');
        pPusat.classList.add('hidden');
      } else {
        btnPusat.className = "py-3 px-4 sm:px-6 font-extrabold text-xs sm:text-sm border-b-2 border-amber-400 text-amber-400 flex items-center gap-2 transition";
        btnCabang.className = "py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center gap-2 transition";
        pPusat.classList.remove('hidden');
        pCabang.classList.add('hidden');

        if (!isKeuangan) {
          // Role Cabang: Tampilkan peringatan pembatasan akses
          document.getElementById('guard-akses-pusat-cabang').classList.remove('hidden');
          document.getElementById('konten-operasional-pusat').classList.add('hidden');
        } else {
          // Role Keuangan/Admin: Buka panel verifikasi operasional
          document.getElementById('guard-akses-pusat-cabang').classList.add('hidden');
          document.getElementById('konten-operasional-pusat').classList.remove('hidden');
          perbaruiPreviewKwitansi();
        }
      }
    }

    // 8. Submit Pengajuan Draf ke Server Terproteksi (POST /api/kwitansi-data-proxy)
    async function prosesSubmitPengajuan(e) {
      e.preventDefault();
      if (!currentUser) {
        alert('Sesi Anda telah kedaluwarsa. Silakan login kembali.');
        return;
      }

      hitungKwitansi();

      const btn = document.getElementById('btn-submit-pengajuan');
      const textOriginal = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = \`<svg class="animate-spin h-4 w-4 text-slate-950 inline mr-1" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Mengirim ke Server Keuangan...\`;

      const tgl = document.getElementById('tgl-pengajuan').value;
      const klien = document.getElementById('identitas-klien').value;
      const ket = document.getElementById('keterangan-penugasan').value;
      const cabang = document.getElementById('cabang-pengaju').value;
      const banyaknya = document.getElementById('banyaknya-termin').value;
      const hargaDasar = document.getElementById('harga-dasar').value;
      const tarifPpn = document.getElementById('tarif-ppn').value;
      const terbilang = document.getElementById('teks-terbilang').value;
      const namaPengaju = document.getElementById('nama-staf-pengaju') ? document.getElementById('nama-staf-pengaju').value : currentUser.displayName;
      const waPengaju = document.getElementById('wa-staf-pengaju') ? document.getElementById('wa-staf-pengaju').value : '';

      try {
        const res = await fetch('/api/kwitansi-data-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submitDraft',
            payload: {
              tanggal: tgl,
              cabang,
              namaPengaju,
              waPengaju,
              klien,
              keterangan: ket,
              banyaknya,
              hargaDasar,
              tarifPpn,
              terbilang
            }
          })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          dataKwitansiAktif.idDraft = data.record?.idDraft || "DRAFT-BARU";
          document.getElementById('panel-notifikasi-sukses').classList.remove('hidden');
          perbaruiPreviewKwitansi();
        } else {
          alert('Pengajuan draf gagal: ' + (data.error || 'Terjadi kesalahan pada server.'));
        }
      } catch (err) {
        alert('Gagal menghubungi server proxy kwitansi: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = textOriginal;
      }
    }

    // 9. Pengesahan Kwitansi Resmi oleh Keuangan Pusat (POST /api/kwitansi-data-proxy)
    async function sahkanDanKunciKwitansi() {
      if (!currentUser) {
        alert('Sesi Anda telah berakhir.');
        return;
      }

      const noResmi = document.getElementById('no-kwitansi-resmi')?.value?.trim();
      if (!noResmi) {
        alert('Nomor kwitansi resmi wajib diisi.');
        return;
      }

      const btn = document.getElementById('btn-sahkan-kwitansi');
      if (btn) btn.disabled = true;

      try {
        const res = await fetch('/api/kwitansi-data-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approveKwitansi',
            payload: {
              idDraft: dataKwitansiAktif.idDraft || "DRAFT-KW-001",
              noKwitansiResmi: noResmi,
              namaPejabat: dataKwitansiAktif.namaPejabat,
              jabatanPejabat: dataKwitansiAktif.jabatanPejabat,
              subjabatanPejabat: dataKwitansiAktif.subjabatanPejabat,
              tempatTerbit: document.getElementById('tempat-kwitansi-resmi')?.value || "Jakarta"
            }
          })
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          dataKwitansiAktif.isApproved = true;
          document.getElementById('badge-status-pusat').innerText = "✅ Telah Disahkan Keuangan Pusat";
          document.getElementById('badge-status-pusat').className = "px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
          perbaruiPreviewKwitansi();
          alert("Kwitansi Resmi BERHASIL DISAHKAN DI SERVER!\\nNomor Resmi: " + noResmi + "\\nPenandatangan: " + dataKwitansiAktif.namaPejabat + "\\n\\nSekarang Anda dapat menekan tombol 'Cetak / Simpan PDF (A4)'.");
        } else {
          alert('Pengesahan kwitansi ditolak server: ' + (data.error || 'Terjadi kesalahan.'));
        }
      } catch (err) {
        alert('Gagal menghubungi server proxy: ' + err.message);
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    // 10. Logika Terbilang Rupiah Bahasa Indonesia
    function angkaKeTerbilang(nilai) {
      nilai = Math.floor(Math.abs(Number(nilai))) || 0;
      if (nilai === 0) return "Nol Rupiah";

      const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

      function konversi(n) {
        if (n < 12) return satuan[n];
        if (n < 20) return konversi(n - 10) + " Belas";
        if (n < 100) return konversi(Math.floor(n / 10)) + " Puluh " + satuan[n % 10];
        if (n < 200) return "Seratus " + konversi(n - 100);
        if (n < 1000) return konversi(Math.floor(n / 100)) + " Ratus " + konversi(n % 100);
        if (n < 2000) return "Seribu " + konversi(n - 1000);
        if (n < 1000000) return konversi(Math.floor(n / 1000)) + " Ribu " + konversi(n % 1000);
        if (n < 1000000000) return konversi(Math.floor(n / 1000000)) + " Juta " + konversi(n % 1000000);
        if (n < 1000000000000) return konversi(Math.floor(n / 1000000000)) + " Miliar " + konversi(n % 1000000000);
        if (n < 1000000000000000) return konversi(Math.floor(n / 1000000000000)) + " Triliun " + konversi(n % 1000000000000);
        return "";
      }

      const hasil = konversi(nilai).replace(/\\s+/g, ' ').trim();
      return hasil + " Rupiah";
    }

    function formatRupiah(angka) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
    }

    function hitungKwitansi() {
      const dpp = parseFloat(document.getElementById('harga-dasar')?.value) || 0;
      const tarif = parseFloat(document.getElementById('tarif-ppn')?.value) || 0.11;
      const ppn = Math.round(dpp * tarif);
      const total = dpp + ppn;

      const elPpn = document.getElementById('nominal-ppn');
      const elTotal = document.getElementById('total-bayar');
      const elPersenPpn = document.getElementById('label-persen-ppn');

      if (elPpn) elPpn.value = ppn;
      if (elTotal) elTotal.value = total;
      if (elPersenPpn) elPersenPpn.innerText = \`(\${Math.round(tarif * 100)}%)\`;

      document.getElementById('preview-harga-dasar').innerText = formatRupiah(dpp);
      document.getElementById('preview-ppn').innerText = formatRupiah(ppn);
      document.getElementById('preview-total-bayar').innerText = formatRupiah(total);

      const kalimatTerbilang = angkaKeTerbilang(total);
      const kotakTerbilang = document.getElementById('kotak-terbilang');
      const inputTerbilang = document.getElementById('teks-terbilang');
      if (kotakTerbilang) kotakTerbilang.innerText = \`"\${kalimatTerbilang}"\`;
      if (inputTerbilang) inputTerbilang.value = kalimatTerbilang;

      dataKwitansiAktif.hargaDasar = dpp;
      dataKwitansiAktif.tarifPpn = tarif;
      dataKwitansiAktif.nominalPpn = ppn;
      dataKwitansiAktif.totalBayar = total;
      dataKwitansiAktif.terbilang = kalimatTerbilang;
      
      perbaruiPreviewKwitansi();
    }

    function setTermin(teks) {
      const inp = document.getElementById('banyaknya-termin');
      if (inp) {
        inp.value = teks;
        dataKwitansiAktif.banyaknya = teks;
        perbaruiPreviewKwitansi();
      }
    }

    function gantiPejabatTTD() {
      const sel = document.getElementById('pilihan-pejabat-ttd');
      const val = sel.value;
      const boxManual = document.getElementById('kontainer-input-manual-pejabat');
      
      dataKwitansiAktif.idPejabat = val;
      if (val === 'custom') {
        boxManual.classList.remove('hidden');
        dataKwitansiAktif.namaPejabat = document.getElementById('custom-nama-pejabat').value || "Bagian Keuangan KJPP NSR";
        dataKwitansiAktif.jabatanPejabat = document.getElementById('custom-jabatan-pejabat').value || "Keuangan";
        dataKwitansiAktif.subjabatanPejabat = dataKwitansiAktif.jabatanPejabat;
      } else {
        boxManual.classList.add('hidden');
        const p = DAFTAR_PEJABAT[val];
        dataKwitansiAktif.namaPejabat = p.nama;
        dataKwitansiAktif.jabatanPejabat = p.jabatan;
        dataKwitansiAktif.subjabatanPejabat = p.subjabatan;
        document.getElementById('print-ttd-nama-default').innerText = p.parafDefault;
      }
      perbaruiPreviewKwitansi();
    }

    function perbaruiPreviewKwitansi() {
      const cabang = document.getElementById('cabang-pengaju')?.value || dataKwitansiAktif.cabang;
      const klien = document.getElementById('identitas-klien')?.value || dataKwitansiAktif.klien;
      const ket = document.getElementById('keterangan-penugasan')?.value || dataKwitansiAktif.keterangan;
      const termin = document.getElementById('banyaknya-termin')?.value || dataKwitansiAktif.banyaknya;
      const noResmi = document.getElementById('no-kwitansi-resmi')?.value || dataKwitansiAktif.noKwitansiResmi;
      const tempat = document.getElementById('tempat-kwitansi-resmi')?.value || "Jakarta";
      const tglSah = document.getElementById('tgl-kwitansi-resmi')?.value || new Date().toISOString().split('T')[0];

      const optTgl = { day: 'numeric', month: 'long', year: 'numeric' };
      const tglSahStr = new Date(tglSah).toLocaleDateString('id-ID', optTgl);

      document.getElementById('print-no-kwitansi').innerText = noResmi;
      document.getElementById('print-klien').innerText = klien;
      document.getElementById('print-total-bayar').innerText = formatRupiah(dataKwitansiAktif.totalBayar) + ",-";
      document.getElementById('print-terbilang').innerText = \`"\${dataKwitansiAktif.terbilang}"\`;
      document.getElementById('print-keterangan').innerText = ket;
      document.getElementById('print-termin').innerText = termin;
      document.getElementById('print-rincian-dpp').innerText = formatRupiah(dataKwitansiAktif.hargaDasar) + ",-";
      document.getElementById('print-rincian-ppn').innerText = formatRupiah(dataKwitansiAktif.nominalPpn) + ",-";
      document.getElementById('print-rincian-total').innerText = formatRupiah(dataKwitansiAktif.totalBayar) + ",-";
      document.getElementById('print-persen-ppn').innerText = \`\${Math.round(dataKwitansiAktif.tarifPpn * 100)}%\`;
      const namaPengajuVal = document.getElementById('nama-staf-pengaju')?.value;
      document.getElementById('print-unit-pengaju').innerText = \`• Diajukan oleh: \${cabang}\${namaPengajuVal ? \` (PIC: \${namaPengajuVal})\` : ''}\`;
      document.getElementById('print-tanggal-pengesahan').innerText = \`\${tempat}, \${tglSahStr}\`;
      document.getElementById('print-nama-pejabat').innerText = dataKwitansiAktif.namaPejabat;
      document.getElementById('print-jabatan-pejabat').innerText = dataKwitansiAktif.jabatanPejabat;
      document.getElementById('print-subjabatan-pejabat').innerText = dataKwitansiAktif.subjabatanPejabat;

      const lblTujuanCabang = document.getElementById('label-tujuan-cabang-pusat');
      if (lblTujuanCabang) lblTujuanCabang.innerText = cabang;
    }

    function cetakPDFKwitansi() {
      perbaruiPreviewKwitansi();
      window.print();
    }

    // TTD Pad & Image handling
    let canvas, ctx, isDrawing = false;
    function initSignaturePad() {
      canvas = document.getElementById('pad-ttd');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
        };
      }
      function startDraw(e) { isDrawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); }
      function draw(e) { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); }
      function endDraw() { isDrawing = false; }

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', endDraw);
      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', endDraw);
    }

    function hapusPadTTD() { if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height); }
    function simpanPadTTD() {
      if (!canvas) return;
      pasangGambarTTD(canvas.toDataURL('image/png'));
      alert('Tanda tangan berhasil disematkan!');
    }

    function pasangGambarTTD(dataUrl) {
      document.getElementById('print-img-ttd').src = dataUrl;
      document.getElementById('print-img-ttd').classList.remove('hidden');
      document.getElementById('print-ttd-default').classList.add('hidden');
    }

    function resetTTD() {
      document.getElementById('print-img-ttd').src = '';
      document.getElementById('print-img-ttd').classList.add('hidden');
      document.getElementById('print-ttd-default').classList.remove('hidden');
    }

    function initPasteListeners() {
      // Paste listener helper
    }

    function setModeTTD(mode) {
      document.getElementById('kontainer-ttd-paste').classList.toggle('hidden', mode !== 'paste');
      document.getElementById('kontainer-ttd-upload').classList.toggle('hidden', mode !== 'upload');
      document.getElementById('kontainer-ttd-pad').classList.toggle('hidden', mode !== 'pad');
      document.getElementById('kontainer-ttd-digital').classList.toggle('hidden', mode !== 'digital');
    }

    function setModeStempel(mode) {
      document.getElementById('kontainer-stempel-paste').classList.toggle('hidden', mode !== 'paste');
      document.getElementById('kontainer-stempel-upload').classList.toggle('hidden', mode !== 'upload');
    }

    function toggleStempel(aktif) {
      document.getElementById('print-kontainer-stempel').style.display = aktif ? 'flex' : 'none';
    }

    function resetStempel() {
      document.getElementById('print-img-stempel').src = '';
      document.getElementById('print-img-stempel').classList.add('hidden');
      document.getElementById('print-stempel-default').classList.remove('hidden');
    }
  </script>`;

  html = strictReplace(html, scriptRegex, serverScript, "Logika Script Server-Side");

  // Tulis ke berkas sementara .tmp
  fs.writeFileSync(tmpPath, html, "utf-8");

  // =========================================================================
  // AUDIT PASCA-BUILD (STRICT POST-BUILD AUDIT)
  // =========================================================================
  const builtContent = fs.readFileSync(tmpPath, "utf-8");

  const FORBIDDEN_STRINGS = [
    "docs.google.com/forms",
    "BDG#010",
    "JKT#00",
    "NSR-FIN",
    "NSR8899",
    "081314680998",
    "081286917333",
    "081220314609",
    "nanang_kjpp@yahoo.co.id",
    "hidayati.milda@yahoo.com",
    "ichafarikha.kjppnr@gmail.com",
    "NSR-2019-001",
    "NSR-2019-004",
    "NSR-2019-008",
    "TOKEN_CABANG_MAP",
    "TOKEN_PUSAT_VALID",
    "verifikasiTokenOtomatis"
  ];

  const leaksFound = [];
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (builtContent.includes(forbidden)) {
      leaksFound.push(forbidden);
    }
  }

  if (leaksFound.length > 0) {
    fs.unlinkSync(tmpPath);
    throw new Error(`[POST_BUILD_AUDIT_FAILED] Berkas staging terdeteksi memuat string terlarang: ${leaksFound.join(", ")}! Berkas .tmp dimusnahkan.`);
  }

  // Jika seluruh audit lulus, lakukan rename atomik
  if (fs.existsSync(destPath)) {
    fs.unlinkSync(destPath);
  }
  fs.renameSync(tmpPath, destPath);

  const stats = fs.statSync(destPath);
  console.log(`✅ Build Berhasil: ${destPath} (${stats.size} bytes). Zero leak detected!`);
  return { success: true, size: stats.size };
}

try {
  buildStagingKwitansi();
} catch (err) {
  console.error("❌ Build Gagal:", err.message);
  process.exit(1);
}
