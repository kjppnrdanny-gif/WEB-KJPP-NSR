import fs from 'fs';

let c = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const target = `    function handleFormSubmit(event) {
      event.preventDefault();

      // Guard: Penilai dan Reviewer tidak diizinkan membuat JO`;

const repl = `    function handleFormSubmit(event) {
      if (event && event.preventDefault) event.preventDefault();

      // P0 HOTFIX: Validasi Mandatory Kontak Pengaju Manual (Anti-Autofill)
      const pNama = (document.getElementById('pengaju_nama_display')?.value || '').trim();
      const pNik = (document.getElementById('pengaju_nik_input')?.value || '').trim();
      const pJabatan = (document.getElementById('pengaju_jabatan_input')?.value || '').trim();
      const pEmail = (document.getElementById('pengaju_email_display')?.value || '').trim();
      const pWa = (document.getElementById('pengaju_wa_display')?.value || '').trim();

      if (!pNama) {
        alert('⚠️ INPUT MANDATORY: Nama Petugas Pengaju wajib diisi secara manual.');
        document.getElementById('pengaju_nama_display')?.focus();
        return;
      }
      if (!pNik) {
        alert('⚠️ INPUT MANDATORY: NIK / ID Personel Petugas Pengaju wajib diisi secara manual.');
        document.getElementById('pengaju_nik_input')?.focus();
        return;
      }
      if (!pJabatan) {
        alert('⚠️ INPUT MANDATORY: Jabatan Petugas Pengaju wajib diisi secara manual.');
        document.getElementById('pengaju_jabatan_input')?.focus();
        return;
      }
      if (!pEmail || !pEmail.includes('@') || !pEmail.includes('.')) {
        alert('⚠️ INPUT MANDATORY: Email Notifikasi Aktif wajib diisi dengan format email valid.');
        document.getElementById('pengaju_email_display')?.focus();
        return;
      }
      if (!pWa || pWa.replace(/\\D/g, '').length < 8) {
        alert('⚠️ INPUT MANDATORY: Nomor WhatsApp Aktif wajib diisi dengan nomor valid (minimal 8 digit).');
        document.getElementById('pengaju_wa_display')?.focus();
        return;
      }

      // Guard: Penilai dan Reviewer tidak diizinkan membuat JO`;

c = c.replace(target.replace(/\n/g, '\r\n'), repl.replace(/\n/g, '\r\n'));

fs.writeFileSync('portal-penugasan-jo.html', c, 'utf8');
console.log('Update portal-penugasan-jo.html complete!');
