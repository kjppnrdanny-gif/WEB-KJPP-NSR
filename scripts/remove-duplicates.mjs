import fs from 'fs';

// 1. Clean portal-penugasan-jo.html
let jo = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const joTarget = `            const pNama = (document.getElementById('pengaju_nama_display')?.value || '').trim();
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
      }`;

if (jo.includes(joTarget.replace(/\n/g, '\r\n'))) {
  jo = jo.replace(joTarget.replace(/\n/g, '\r\n'), '// (Validasi mandatory pengaju telah dijalankan di awal fungsi)');
  fs.writeFileSync('portal-penugasan-jo.html', jo, 'utf8');
  console.log('portal-penugasan-jo.html duplicate removed!');
} else {
  console.log('portal-penugasan-jo.html target not matched directly, checking normalized...');
  const joNorm = jo.replace(/\r\n/g, '\n');
  if (joNorm.includes(joTarget)) {
    jo = joNorm.replace(joTarget, '// (Validasi mandatory pengaju telah dijalankan di awal fungsi)').replace(/\n/g, '\r\n');
    fs.writeFileSync('portal-penugasan-jo.html', jo, 'utf8');
    console.log('portal-penugasan-jo.html duplicate removed via normalized!');
  }
}

// 2. Clean portal-nolap.html
let nolap = fs.readFileSync('portal-nolap.html', 'utf8');
const nolapTarget = `      const pemohon = document.getElementById('f-pemohon').value.trim();
      const nikPemohon = (document.getElementById('f-nik-pemohon')?.value || '').trim();
      const jabatan = document.getElementById('f-jabatan').value.trim();
      const emailPemohon = document.getElementById('f-email-pemohon').value.trim();
      const waPemohon = document.getElementById('f-wa-pemohon').value.trim();

      if (!pemohon) {
        alert('⚠️ INPUT MANDATORY: Nama Pemohon (Penilai/Staf) wajib diisi secara manual.');
        document.getElementById('f-pemohon')?.focus();
        btn.disabled = false;
        btn.innerHTML = textOriginal;
        return;
      }
      if (!nikPemohon) {
        alert('⚠️ INPUT MANDATORY: NIK / ID Personel Pemohon wajib diisi secara manual.');
        document.getElementById('f-nik-pemohon')?.focus();
        btn.disabled = false;
        btn.innerHTML = textOriginal;
        return;
      }
      if (!jabatan) {
        alert('⚠️ INPUT MANDATORY: Jabatan Pemohon wajib diisi secara manual.');
        document.getElementById('f-jabatan')?.focus();
        btn.disabled = false;
        btn.innerHTML = textOriginal;
        return;
      }
      if (!emailPemohon || !emailPemohon.includes('@') || !emailPemohon.includes('.')) {
        alert('⚠️ INPUT MANDATORY: Email Pemohon wajib diisi dengan format email yang valid.');
        document.getElementById('f-email-pemohon')?.focus();
        btn.disabled = false;
        btn.innerHTML = textOriginal;
        return;
      }
      if (!waPemohon || waPemohon.replace(/\\D/g, '').length < 8) {
        alert('⚠️ INPUT MANDATORY: WhatsApp Pemohon wajib diisi dengan nomor yang valid (minimal 8 digit).');
        document.getElementById('f-wa-pemohon')?.focus();
        btn.disabled = false;
        btn.innerHTML = textOriginal;
        return;
      }`;

if (nolap.includes(nolapTarget.replace(/\n/g, '\r\n'))) {
  nolap = nolap.replace(nolapTarget.replace(/\n/g, '\r\n'), '// (Validasi mandatory pemohon telah dijalankan di awal fungsi)');
  fs.writeFileSync('portal-nolap.html', nolap, 'utf8');
  console.log('portal-nolap.html duplicate removed!');
} else {
  console.log('portal-nolap.html target not matched directly, checking normalized...');
  const nolapNorm = nolap.replace(/\r\n/g, '\n');
  if (nolapNorm.includes(nolapTarget)) {
    nolap = nolapNorm.replace(nolapTarget, '// (Validasi mandatory pemohon telah dijalankan di awal fungsi)').replace(/\n/g, '\r\n');
    fs.writeFileSync('portal-nolap.html', nolap, 'utf8');
    console.log('portal-nolap.html duplicate removed via normalized!');
  }
}
