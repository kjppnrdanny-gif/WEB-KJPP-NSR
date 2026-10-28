import fs from 'node:fs';
import path from 'node:path';

function updateFile(relPath) {
  const filePath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping non-existent file: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace button in modal footer
  const oldBtnRegex = /<button type="button"\s+id="btn-(?:konfirmasi|setuju)-privasi(?:-presensi)?"[\s\S]*?<\/button>/;
  const newBtn = `<button type="button" 
        id="btn-setuju-privasi-presensi" 
        onclick="konfirmasiSetujuPrivasi()" 
        class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer">
  Saya Menyetujui & Lanjutkan
</button>`;

  if (oldBtnRegex.test(content)) {
    content = content.replace(oldBtnRegex, newBtn);
    console.log(`✓ Replaced button in ${relPath}`);
  } else {
    console.log(`Button pattern not found in ${relPath}`);
  }

  // 2. Replace JS implementation of modal functions
  const oldJsStart = "function tampilkanModalPrivasiGate() {";
  const oldJsEnd = "// Inisialisasi awal saat dokumen siap";

  const sIdx = content.indexOf(oldJsStart);
  const eIdx = content.indexOf(oldJsEnd, sIdx);

  if (sIdx !== -1 && eIdx !== -1) {
    const newJs = `function tampilkanModalPrivasiGate() {
      isGateMode = true;
      const modal = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
      const btnX = document.getElementById('btn-tutup-privasi-x');
      const badgeWajib = document.getElementById('badge-gate-wajib');
      const btnKonfirmasi = document.getElementById('btn-setuju-privasi-presensi') || document.getElementById('btn-konfirmasi-privasi');

      if (btnX) btnX.style.display = 'none';
      if (badgeWajib) badgeWajib.style.display = 'inline-flex';
      if (btnKonfirmasi) {
        btnKonfirmasi.textContent = 'Saya Menyetujui & Lanjutkan';
        btnKonfirmasi.onclick = konfirmasiSetujuPrivasi;
      }

      if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    }

    function konfirmasiSetujuPrivasi() {
      privasiConfirmed = true;
      try {
        sessionStorage.setItem('nsr_privasi_confirmed_version', PRIVACY_NOTICE_VERSION);
        sessionStorage.setItem('nsr_privasi_confirmed_at', new Date().toISOString());
        localStorage.setItem('nsr_presensi_privacy_ack', JSON.stringify({
          ack: true,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {}

      isGateMode = false;
      const modal = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
      if (typeof ambilGPS === 'function') {
        ambilGPS();
      }
      const nikInput = document.getElementById('auth-nik-input');
      if (nikInput) nikInput.focus();
    }
    window.konfirmasiSetujuPrivasi = konfirmasiSetujuPrivasi;
    window.konfirmasiPrivasiKaryawan = konfirmasiSetujuPrivasi;

    function bukaModalPrivasiKaryawan() {
      isGateMode = false;
      const modal = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
      const btnX = document.getElementById('btn-tutup-privasi-x');
      const badgeWajib = document.getElementById('badge-gate-wajib');
      const btnKonfirmasi = document.getElementById('btn-setuju-privasi-presensi') || document.getElementById('btn-konfirmasi-privasi');

      if (btnX) btnX.style.display = '';
      if (badgeWajib) badgeWajib.style.display = 'none';
      if (btnKonfirmasi) {
        btnKonfirmasi.textContent = 'Saya Mengerti';
        btnKonfirmasi.onclick = tutupModalPrivasiKaryawan;
      }

      if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }
    }
    window.bukaModalPrivasiKaryawan = bukaModalPrivasiKaryawan;

    function tutupModalPrivasiKaryawan() {
      if (isGateMode && !privasiConfirmed) return;
      const modal = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
    window.tutupModalPrivasiKaryawan = tutupModalPrivasiKaryawan;

    `;

    content = content.slice(0, sIdx) + newJs + content.slice(eIdx);
    console.log(`✓ Replaced JS modal functions in ${relPath}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

// Update portal-presensi.html and portal-absensi.html
updateFile('portal-presensi.html');
updateFile('portal-absensi.html');

// Also update lib/privacy-consent.js
const libPath = path.join(process.cwd(), 'lib/privacy-consent.js');
if (fs.existsSync(libPath)) {
  let libContent = fs.readFileSync(libPath, 'utf8');
  
  const oldLibBlockStart = "window.bukaModalPrivasiKaryawan = function () {";
  const oldLibBlockEnd = "// REKAM BUKTI PERSETUJUAN (PROOF OF CONSENT)";
  
  const lsIdx = libContent.indexOf(oldLibBlockStart);
  const leIdx = libContent.indexOf(oldLibBlockEnd, lsIdx);
  
  if (lsIdx !== -1 && leIdx !== -1) {
    const newLibBlock = `const prevBukaModalPrivasiKaryawan = window.bukaModalPrivasiKaryawan;
  window.bukaModalPrivasiKaryawan = function () {
    if (typeof prevBukaModalPrivasiKaryawan === 'function') {
      prevBukaModalPrivasiKaryawan();
      return;
    }
    injectEmployeePrivacyModal();
    const m = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
    if (m) {
      m.classList.remove('hidden');
      m.style.display = 'flex';
    }
  };

  const prevTutupModalPrivasiKaryawan = window.tutupModalPrivasiKaryawan;
  window.tutupModalPrivasiKaryawan = function () {
    if (typeof prevTutupModalPrivasiKaryawan === 'function') {
      prevTutupModalPrivasiKaryawan();
      return;
    }
    const m = document.getElementById('modal-privasi-karyawan') || document.getElementById('modal-privacy-karyawan');
    if (m) {
      m.classList.add('hidden');
      m.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  const prevKonfirmasiPrivasiKaryawan = window.konfirmasiPrivasiKaryawan;
  window.konfirmasiPrivasiKaryawan = function () {
    try {
      localStorage.setItem(PDP_CONFIG.employeeAckKey, JSON.stringify({
        ack: true,
        version: PDP_CONFIG.policyVersion,
        timestamp: new Date().toISOString()
      }));
    } catch (_) {}
    window.tutupModalPrivasiKaryawan();
    if (typeof window.konfirmasiSetujuPrivasi === 'function') {
      window.konfirmasiSetujuPrivasi();
    } else if (typeof prevKonfirmasiPrivasiKaryawan === 'function' && prevKonfirmasiPrivasiKaryawan !== window.konfirmasiPrivasiKaryawan) {
      prevKonfirmasiPrivasiKaryawan();
    }
  };

  `;
    libContent = libContent.slice(0, lsIdx) + newLibBlock + libContent.slice(leIdx);
    fs.writeFileSync(libPath, libContent, 'utf8');
    console.log(`✓ Updated lib/privacy-consent.js`);
  }
}
