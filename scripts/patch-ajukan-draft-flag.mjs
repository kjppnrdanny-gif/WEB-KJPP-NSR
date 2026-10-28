import fs from 'fs';

let content = fs.readFileSync('portal-nolap.html', 'utf8');

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

const needle = toCrlf(`    async function ajukanPermohonanNoLap(e) {
      if (e && e.preventDefault) e.preventDefault();

      const btn = document.getElementById('btn-submit-pengajuan');
      const textOriginal = btn ? btn.innerHTML : 'Kirim Permohonan NoLap';

      // P0 HOTFIX: Validasi Mandatory Kontak Pemohon Manual (Anti-Autofill)
      const pemohon = (document.getElementById('f-pemohon')?.value || '').trim();
      const nikPemohon = (document.getElementById('f-nik-pemohon')?.value || '').trim();
      const jabatan = (document.getElementById('f-jabatan')?.value || '').trim();
      const emailPemohon = (document.getElementById('f-email-pemohon')?.value || '').trim();
      const waPemohon = (document.getElementById('f-wa-pemohon')?.value || '').trim();

      if (!pemohon) {
        alert('⚠️ INPUT MANDATORY: Nama Pemohon (Penilai/Staf) wajib diisi secara manual.');
        document.getElementById('f-pemohon')?.focus();
        return;
      }
      if (!nikPemohon) {
        alert('⚠️ INPUT MANDATORY: NIK / ID Personel Pemohon wajib diisi secara manual.');
        document.getElementById('f-nik-pemohon')?.focus();
        return;
      }
      if (!jabatan) {
        alert('⚠️ INPUT MANDATORY: Jabatan Pemohon wajib diisi secara manual.');
        document.getElementById('f-jabatan')?.focus();
        return;
      }
      if (!emailPemohon || !emailPemohon.includes('@') || !emailPemohon.includes('.')) {
        alert('⚠️ INPUT MANDATORY: Email Pemohon wajib diisi dengan format email yang valid.');
        document.getElementById('f-email-pemohon')?.focus();
        return;
      }
      if (!waPemohon || waPemohon.replace(/\\D/g, '').length < 8) {
        alert('⚠️ INPUT MANDATORY: WhatsApp Pemohon wajib diisi dengan nomor yang valid (minimal 8 digit).');
        document.getElementById('f-wa-pemohon')?.focus();
        return;
      }

      // Validasi Wajib Sektor Industri Master 01-12 (Anti-Fallback Diam-Diam)
      const rawIndSubmit = (document.getElementById('f-industri')?.value || '').trim();
      const numIndSubmit = parseInt(rawIndSubmit, 10);
      if (!rawIndSubmit || isNaN(numIndSubmit) || numIndSubmit < 1 || numIndSubmit > 12) {
        alert('⚠️ INPUT MANDATORY: Sektor Industri Kemenkeu (01–12) wajib dipilih sesuai master klasifikasi resmi.');
        document.getElementById('f-industri')?.focus();
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Memproses Pengajuan...';
      }`);

const replacement = toCrlf(`    async function ajukanPermohonanNoLap(e, isDraft = false) {
      if (e && e.preventDefault) e.preventDefault();

      const btn = isDraft ? document.getElementById('btn-simpan-draf') : document.getElementById('btn-submit-pengajuan');
      const textOriginal = btn ? btn.innerHTML : (isDraft ? 'Simpan Draf' : 'Kirim Permohonan NoLap');

      // P0 HOTFIX: Validasi Mandatory Kontak Pemohon Manual (Anti-Autofill)
      const pemohon = (document.getElementById('f-pemohon')?.value || '').trim();
      const nikPemohon = (document.getElementById('f-nik-pemohon')?.value || '').trim();
      const jabatan = (document.getElementById('f-jabatan')?.value || '').trim();
      const emailPemohon = (document.getElementById('f-email-pemohon')?.value || '').trim();
      const waPemohon = (document.getElementById('f-wa-pemohon')?.value || '').trim();

      if (!isDraft) {
        if (!pemohon) {
          alert('⚠️ INPUT MANDATORY: Nama Pemohon (Penilai/Staf) wajib diisi secara manual.');
          navigasiKeStepWizard(1);
          document.getElementById('f-pemohon')?.focus();
          return;
        }
        if (!nikPemohon) {
          alert('⚠️ INPUT MANDATORY: NIK / ID Personel Pemohon wajib diisi secara manual.');
          navigasiKeStepWizard(1);
          document.getElementById('f-nik-pemohon')?.focus();
          return;
        }
        if (!jabatan) {
          alert('⚠️ INPUT MANDATORY: Jabatan Pemohon wajib diisi secara manual.');
          navigasiKeStepWizard(1);
          document.getElementById('f-jabatan')?.focus();
          return;
        }
        if (!emailPemohon || !emailPemohon.includes('@') || !emailPemohon.includes('.')) {
          alert('⚠️ INPUT MANDATORY: Email Pemohon wajib diisi dengan format email yang valid.');
          navigasiKeStepWizard(1);
          document.getElementById('f-email-pemohon')?.focus();
          return;
        }
        if (!waPemohon || waPemohon.replace(/\\D/g, '').length < 8) {
          alert('⚠️ INPUT MANDATORY: WhatsApp Pemohon wajib diisi dengan nomor yang valid (minimal 8 digit).');
          navigasiKeStepWizard(1);
          document.getElementById('f-wa-pemohon')?.focus();
          return;
        }

        // Validasi Wajib Sektor Industri Master 01-12 (Anti-Fallback Diam-Diam)
        const rawIndSubmit = (document.getElementById('f-industri')?.value || '').trim();
        const numIndSubmit = parseInt(rawIndSubmit, 10);
        if (!rawIndSubmit || isNaN(numIndSubmit) || numIndSubmit < 1 || numIndSubmit > 12) {
          alert('⚠️ INPUT MANDATORY: Sektor Industri Kemenkeu (01–12) wajib dipilih sesuai master klasifikasi resmi.');
          navigasiKeStepWizard(1);
          document.getElementById('f-industri')?.focus();
          return;
        }
      }

      if (btn) {
        btn.disabled = true;
        btn.innerText = isDraft ? 'Menyimpan Draf Terpadu...' : 'Memproses Pengajuan ke Kepala SPM...';
      }`);

if (content.includes(needle)) {
  content = content.replace(needle, replacement);
  fs.writeFileSync('portal-nolap.html', content, 'utf8');
  console.log('✔ ajukanPermohonanNoLap successfully patched with isDraft parameter.');
} else {
  console.error('✘ needle not found!');
}
