KJPP NSR — DEPLOY NETLIFY DENGAN COUNTER OTOMATIS

ISI PAKET
- index.html                         Website utama
- netlify/functions/visitor-stats.mjs  Penghitung browser anonim
- netlify.toml                      Konfigurasi Netlify
- package.json                      Dependensi Netlify Blobs

CARA DEPLOY YANG DIREKOMENDASIKAN
1. Simpan folder ini ke GitHub/GitLab/Bitbucket.
2. Di Netlify pilih Add new site / Import an existing project.
3. Hubungkan repository.
4. Build command boleh dikosongkan.
5. Publish directory: .
6. Deploy.

Atau gunakan Netlify CLI dari folder ini:
  npm install
  npx netlify deploy --prod

CATATAN COUNTER
- Rekap awal total: 18.454 perangkat.
- Rekap awal tanggal 03-10-2026: 128 perangkat.
- Setelah fungsi aktif, browser baru akan dihitung otomatis di server.
- Browser dikenali melalui cookie acak HttpOnly selama 1 tahun.
- ID disimpan sebagai hash SHA-256; alamat IP tidak disimpan oleh kode counter.
- Bot/crawler umum diabaikan.
- Angka adalah perkiraan browser/perangkat, bukan jumlah orang, klien, proyek, atau laporan.
- Saat ganti hari WIB, hitungan "Hari Ini" otomatis mulai dari 0.

CATATAN PORTAL INTERNAL CABANG
- Akses melalui tombol kuning "☁ Portal Internal & SOP" di navbar.
- Layanan tersedia: 
  1. Folder Dokumen & SOP Cabang (Google Drive Terproteksi)
  2. Permintaan Kwitansi Cabang (Google Forms)
  3. Pengajuan Nolap (Cloud Web App)
  4. Presensi Online
- Token akses cabang resmi:
  * Jakarta Pusat: NSR-PST-2026
  * Bandung:       NSR-BDG-2026
  * Padang:        NSR-PDG-2026
  * Makassar:      NSR-MKS-2026
  * Palembang:     NSR-PLB-2026
  * Master Akses:  NSR8899 / NSR2026

PENTING
Jika hanya mengunggah index.html sebagai file statis tanpa Netlify Function,
website tetap berjalan tetapi statistik akan tampil sebagai rekap terakhir 18.454 / 128,
bukan counter global otomatis.

