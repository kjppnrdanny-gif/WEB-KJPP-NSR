import fs from 'fs';

console.log('=== Mengaplikasikan RBAC UI, Tab 2 & Tab 3 Rules ke portal-penugasan-jo.html ===');

let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. Update terapkanSesiUI
const oldRoleBranchStart = "      // 3. Konfigurasi Tampilan Tab 1 Berdasarkan Role & Set Dropdown Wilayah";
const oldRoleBranchEnd = "      // 4. Pasang Listener Edit Manual Nomor & Update Filter Dokumen di Tab 3";

const idxRoleStart = html.indexOf(oldRoleBranchStart);
const idxRoleEnd = html.indexOf(oldRoleBranchEnd, idxRoleStart);

if (idxRoleStart === -1 || idxRoleEnd === -1) {
  console.error('ERROR: Marker terapkanSesiUI tidak ditemukan!');
  process.exit(1);
}

const newRoleUiLogic = `      // 3. Konfigurasi Tampilan Tab 1 Berdasarkan Role & Set Dropdown Wilayah (PRIORITAS 1)
      const isNonAdminPengaju = (userSession.role === 'MARKETING' || userSession.role === 'SURVEYOR' || userSession.role === 'PENILAI');
      const isPenilaiPublik = (userSession.role === 'PENILAI_PUBLIK');
      const isSuperOrPusat = (userSession.role === 'ADMIN_PUSAT' || userSession.role === 'SUPER_ADMIN');

      if (noticeRole) noticeRole.classList.add('hidden');
      if (formPenugasan) formPenugasan.classList.remove('hidden');
      if (formModeBanner) formModeBanner.classList.remove('hidden');

      const mTitle = document.getElementById('mode-title');
      const mDesc = document.getElementById('mode-desc');

      if (isNonAdminPengaju) {
        if (containerDualMode) containerDualMode.classList.add('hidden');
        
        let roleRoleTitle = "Pengaju Ringkas";
        let roleRoleDesc = "Sampaikan data awal penugasan untuk diverifikasi dan disusun secara resmi oleh Tim Administrasi SPI 103.";
        let submitBtnLabel = "📤 Kirim Permintaan Awal Penugasan";

        if (userSession.role === 'MARKETING') {
          roleRoleTitle = "Mode Akses: Marketing Penugasan (Formulir Permintaan Awal)";
          roleRoleDesc = "Sampaikan data calon klien, PIC, tujuan penilaian, objek, dan penawaran awal untuk diproses Admin.";
          submitBtnLabel = "📤 Kirim Permintaan Awal Penugasan (Marketing)";
        } else if (userSession.role === 'SURVEYOR') {
          roleRoleTitle = "Mode Akses: Surveyor Lapangan (Formulir Data Teknis Objek)";
          roleRoleDesc = "Input data fisik objek, lokasi, spesifikasi teknis, dokumen objek, dan catatan kendala survei.";
          submitBtnLabel = "📤 Kirim Data Awal Survei Lapangan";
        } else if (userSession.role === 'PENILAI') {
          roleRoleTitle = "Mode Akses: Penilai Beregister Kemenkeu (Masukan & Telaah Teknis)";
          roleRoleDesc = "Sampaikan masukan teknis, lingkup investigasi (SPI 103 5.h), asumsi khusus (SPI 103 5.l), dan rekomendasi.";
          submitBtnLabel = "💾 Simpan Masukan & Rekomendasi Teknis Penilai";
        }

        if (mTitle) mTitle.textContent = roleRoleTitle;
        if (mDesc) mDesc.textContent = roleRoleDesc;
        if (btnSubmit) btnSubmit.textContent = submitBtnLabel;

        // Kunci input nomor resmi agar tidak diisi manual oleh pengaju
        const elLp = getElLp();
        const elAdm = getElAdm();
        if (elLp) {
          elLp.value = '[Ditetapkan oleh Admin saat Verifikasi]';
          elLp.readOnly = true;
          elLp.disabled = true;
        }
        if (elAdm) {
          elAdm.value = '[Nomor Referensi REQ Otomatis]';
          elAdm.readOnly = true;
          elAdm.disabled = true;
        }

        setWilayahDropdown(userSession.wilayah);
        inisialisasiDropdownPersonil();
      } else if (isSuperOrPusat) {
        if (containerDualMode) containerDualMode.classList.add('hidden');
        if (mTitle) mTitle.textContent = "Mode Akses: Kantor Pusat / Master Admin (Otorisasi Penuh)";
        if (mDesc) mDesc.innerHTML = "Staf Admin Pusat dapat menginput langsung dan menekan tombol <strong class='text-emerald-400'>'Simpan &amp; Langsung Terbitkan Nomor Resmi (Otorisasi Pusat)'</strong>.";
        if (btnSubmit) btnSubmit.textContent = "Simpan & Langsung Terbitkan Nomor Resmi (Otorisasi Pusat)";
        
        const elLp = getElLp();
        const elAdm = getElAdm();
        if (elLp) { elLp.readOnly = false; elLp.disabled = false; }
        if (elAdm) { elAdm.readOnly = false; elAdm.disabled = false; }

        setWilayahDropdown(userSession.wilayah);
        inisialisasiDropdownPersonil();
      } else if (isPenilaiPublik) {
        if (containerDualMode) containerDualMode.classList.add('hidden');
        if (mTitle) mTitle.textContent = "Mode Akses: Penilai Publik Berizin (Telaah & Otorisasi Profesional)";
        if (mDesc) mDesc.innerHTML = "Penilai Publik bertindak sebagai penanggung jawab profesional atas kepatuhan SPI 103 dan KEPI.";
        if (btnSubmit) btnSubmit.textContent = "Simpan & Otorisasi Profesional Penilai Publik";

        setWilayahDropdown(userSession.wilayah);
        inisialisasiDropdownPersonil();
      } else {
        // ADMIN_CABANG
        setWilayahDropdown(userSession.wilayah);
        inisialisasiDropdownPersonil();
        inisialisasiModeAksesDariUrl();
      }
`;

html = html.substring(0, idxRoleStart) + newRoleUiLogic + html.substring(idxRoleEnd);

// 2. Update Teks Tab 2 & Tab 3 di terapkanSesiUI
const oldTab2TextStart = "      // 2. Perbarui Teks & Badge Tab 2:";
const oldTab2TextEndMarker = "      // 3. Perbarui Indikator Kunci Mutlak Tab 3";

const idxTab2Start = html.indexOf(oldTab2TextStart);
const idxTab2End = html.indexOf(oldTab2TextEndMarker, idxTab2Start);

if (idxTab2Start !== -1 && idxTab2End !== -1) {
  const newTab2TextLogic = `      // 2. Perbarui Teks & Badge Tab 2 Sesuai Role (PRIORITAS 1):
      const tab2Btn = document.querySelector('button[onclick*="gantiTab(2)"]') || 
                      document.getElementById('btn-tab-dashboard') || 
                      document.getElementById('tab-btn-2') || 
                      document.querySelector('[data-testid="jo-tab-approval"]');
      if (tab2Btn) {
        if (isNonAdminPengaju) {
          tab2Btn.innerHTML = \`📋 2. Permintaan Saya\`;
          const badgePending = tab2Btn.querySelector('.badge-pending, span.bg-amber-500, #badge-antrean-count');
          if (badgePending) badgePending.remove();
        } else if (auth && auth.isCabang) {
          tab2Btn.innerHTML = \`📋 2. Buku Register &amp; Riwayat Cabang\`;
          const badgePending = tab2Btn.querySelector('.badge-pending, span.bg-amber-500, #badge-antrean-count');
          if (badgePending) badgePending.remove();
        } else {
          tab2Btn.innerHTML = \`
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <span>2. Dashboard &amp; Antrean Approval</span>
            <span id="badge-antrean-count" class="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black hidden">0</span>
          \`;
        }
      }

      // Sembunyikan summary metrics cards untuk pengaju non-admin
      const gridMetrics = document.getElementById('grid-metrik-monitoring') || document.querySelector('.grid-cols-2.lg\\:grid-cols-4');
      if (gridMetrics) {
        if (isNonAdminPengaju) {
          gridMetrics.classList.add('hidden');
        } else {
          gridMetrics.classList.remove('hidden');
        }
      }
`;
  html = html.substring(0, idxTab2Start) + newTab2TextLogic + html.substring(idxTab2End);
}

// 3. Tambahkan fungsi prosesPermintaanAdmin
const prosesPermintaanAdminFunction = `
    function prosesPermintaanAdmin(idPenugasan) {
      const p = projectDatabase.find(x => x.id === idPenugasan || x.noPermintaan === idPenugasan);
      if (!p) {
        alert('Data permintaan tidak ditemukan.');
        return;
      }

      // Muat data ke formulir Tab 1
      if (p.pemberi_tugas_nama) document.getElementById('pemberi_tugas_nama').value = p.pemberi_tugas_nama;
      if (p.pemberi_tugas_alamat) document.getElementById('pemberi_tugas_alamat').value = p.pemberi_tugas_alamat;
      if (p.pemberi_tugas_pic) document.getElementById('pemberi_tugas_pic').value = p.pemberi_tugas_pic;
      if (p.pemberi_tugas_kontak) document.getElementById('pemberi_tugas_kontak').value = p.pemberi_tugas_kontak;
      if (p.pemberi_tugas_email) document.getElementById('pemberi_tugas_email').value = p.pemberi_tugas_email;
      if (p.pemberi_tugas_bidang) document.getElementById('pemberi_tugas_bidang').value = p.pemberi_tugas_bidang;

      if (p.pengguna_laporan_a) document.getElementById('pengguna_laporan_a').value = p.pengguna_laporan_a;
      if (p.pengguna_laporan_a_alamat) document.getElementById('pengguna_laporan_a_alamat').value = p.pengguna_laporan_a_alamat;
      if (p.pengguna_laporan_a_pic) document.getElementById('pengguna_laporan_a_pic').value = p.pengguna_laporan_a_pic;
      if (p.pengguna_laporan_a_jabatan) document.getElementById('pengguna_laporan_a_jabatan').value = p.pengguna_laporan_a_jabatan;
      if (p.pengguna_laporan_a_kontak) document.getElementById('pengguna_laporan_a_kontak').value = p.pengguna_laporan_a_kontak;
      if (p.pengguna_laporan_a_email) document.getElementById('pengguna_laporan_a_email').value = p.pengguna_laporan_a_email;
      if (p.pengguna_laporan_a_bidang) document.getElementById('pengguna_laporan_a_bidang').value = p.pengguna_laporan_a_bidang;

      if (p.pengguna_laporan_b) document.getElementById('pengguna_laporan_b').value = p.pengguna_laporan_b;
      if (p.pengguna_laporan_b_alamat) document.getElementById('pengguna_laporan_b_alamat').value = p.pengguna_laporan_b_alamat;

      if (p.debitur_nama) document.getElementById('debitur_nama').value = p.debitur_nama;
      if (p.debitur_cp) document.getElementById('debitur_cp').value = p.debitur_cp;

      if (p.biaya_honorarium) document.getElementById('biaya_honorarium').value = p.biaya_honorarium;
      if (p.biaya_transportasi) document.getElementById('biaya_transportasi').value = p.biaya_transportasi;
      if (p.status_transportasi) document.getElementById('status_transportasi').value = p.status_transportasi;
      if (p.biaya_akomodasi) document.getElementById('biaya_akomodasi').value = p.biaya_akomodasi;
      if (p.status_akomodasi) document.getElementById('status_akomodasi').value = p.status_akomodasi;
      if (p.biaya_operasional_lain) document.getElementById('biaya_operasional_lain').value = p.biaya_operasional_lain;
      if (p.status_operasional_lain) document.getElementById('status_operasional_lain').value = p.status_operasional_lain;
      if (p.biaya_dpp) document.getElementById('biaya_dpp').value = p.biaya_dpp;

      if (p.objek_rows && Array.isArray(p.objek_rows) && p.objek_rows.length > 0) {
        window.objekRows = [...p.objek_rows];
        renderTabelObjek();
      }

      kalkulasiBiaya();
      gantiTab(1);

      alert('📋 DATA PERMINTAAN BERHASIL DIMUAT KE TAB 1:\\n\\nSilakan periksa kelengkapan administrasi SPI 103, tentukan jalur penerbitan (Mandiri Cabang / Pengajuan Pusat), dan terbitkan nomor resmi.');
    }
    window.prosesPermintaanAdmin = prosesPermintaanAdmin;
`;

html = html.replace('function renderDashboardTabel() {', prosesPermintaanAdminFunction + '\n    function renderDashboardTabel() {');

// 4. Update row action buttons di renderDashboardTabel untuk status MENUNGGU_VERIFIKASI_ADMIN
const oldBtnApproveMarker = "<!-- Tombol Approve untuk Admin Pusat -->";
const newBtnApproveCode = `<!-- Tombol Proses untuk Admin saat ada permintaan baru -->
                \${p.status === 'MENUNGGU_VERIFIKASI_ADMIN' && (userSession.role === 'ADMIN_PUSAT' || userSession.role === 'SUPER_ADMIN' || userSession.role === 'ADMIN_CABANG') ? \`
                  <button type="button" onclick="prosesPermintaanAdmin('\${escapeHtml(p.id)}')" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10.5px] transition shadow cursor-pointer flex items-center gap-1">
                    <span>⚡ Proses &amp; Susun SPK</span>
                  </button>
                \` : ''}

                <!-- Tombol Approve untuk Admin Pusat -->`;

html = html.replace(oldBtnApproveMarker, newBtnApproveCode);

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('✓ Perubahan RBAC UI Tab 2 & Tab 3 berhasil disimpan.');
