import fs from 'fs';

let c = fs.readFileSync('portal-nolap.html', 'utf8');

const target = `    async function ajukanPermohonanNoLap(e) {
      e.preventDefault();

      const btn = document.getElementById('btn-submit-pengajuan');
      const textOriginal = btn.innerHTML;
      btn.disabled = true;
      btn.innerText = 'Memproses Pengajuan...';`;

const repl = `    async function ajukanPermohonanNoLap(e) {
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

      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Memproses Pengajuan...';
      }`;

c = c.replace(target.replace(/\n/g, '\r\n'), repl.replace(/\n/g, '\r\n'));

fs.writeFileSync('portal-nolap.html', c, 'utf8');
console.log('Update portal-nolap.html complete!');
