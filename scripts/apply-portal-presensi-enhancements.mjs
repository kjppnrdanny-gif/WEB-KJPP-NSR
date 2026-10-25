import fs from 'node:fs';
import path from 'node:path';

function applyPresensiPortalEnhancements(relPath) {
  const filePath = path.join(process.cwd(), relPath);
  let html = fs.readFileSync(filePath, 'utf8');

  // 1. Perbarui Navigasi Tab (tambahkan tab-btn-dashboard)
  const oldNav = `<div class="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
      <button type="button" id="tab-btn-absen" onclick="gantiMode('absen')" class="tab-btn active py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 border border-transparent">
        <span>📍</span>
        <span class="truncate">Presensi</span>
      </button>
      <button type="button" id="tab-btn-wfh" onclick="gantiMode('wfh')" class="tab-btn py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1 border border-transparent">
        <span>🏠</span>
        <span class="truncate">Titik WFH</span>
      </button>
      <button type="button" id="tab-btn-cuti" onclick="gantiMode('cuti')" class="tab-btn py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1 border border-transparent">
        <span>📋</span>
        <span class="truncate">Cuti / Izin</span>
      </button>
      <button type="button" id="tab-btn-riwayat" onclick="gantiMode('riwayat')" class="tab-btn py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1 border border-transparent">
        <span>📊</span>
        <span class="truncate">Riwayat</span>
      </button>
    </div>`;

  const newNav = `<div id="main-nav-grid" class="grid grid-cols-4 sm:grid-cols-5 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800">
      <button type="button" id="tab-btn-absen" onclick="gantiMode('absen')" class="tab-btn active py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1 border border-transparent">
        <span>📍</span>
        <span class="truncate">Presensi</span>
      </button>
      <button type="button" id="tab-btn-wfh" onclick="gantiMode('wfh')" class="tab-btn py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1 border border-transparent">
        <span>🏠</span>
        <span class="truncate">Titik WFH</span>
      </button>
      <button type="button" id="tab-btn-cuti" onclick="gantiMode('cuti')" class="tab-btn py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1 border border-transparent">
        <span>📋</span>
        <span class="truncate">Cuti / Izin</span>
      </button>
      <button type="button" id="tab-btn-riwayat" onclick="gantiMode('riwayat')" class="tab-btn py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1 border border-transparent">
        <span>📊</span>
        <span class="truncate">Riwayat</span>
      </button>
      <button type="button" id="tab-btn-dashboard" onclick="gantiMode('dashboard')" class="hidden tab-btn py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-amber-400 hover:text-amber-300 transition flex items-center justify-center gap-1 border border-amber-500/30 bg-amber-500/10">
        <span>🛡️</span>
        <span class="truncate">Admin HR</span>
      </button>
    </div>`;

  if (html.includes(oldNav)) {
    html = html.replace(oldNav, newNav);
  } else {
    // CRLF fallback
    const oldNavCRLF = oldNav.replace(/\n/g, '\r\n');
    const newNavCRLF = newNav.replace(/\n/g, '\r\n');
    html = html.replace(oldNavCRLF, newNavCRLF);
  }

  // 2. Tambahkan Panel Dashboard HR setelah panelRiwayat
  const panelDashboardHTML = `
    <!-- ========================================================
         PANEL 5: DASHBOARD MANAJEMEN HR KANTOR PUSAT
         (KHUSUS ADMIN HR / MANAJER OPERASIONAL & SDM)
         ======================================================== -->
    <div id="panelDashboard" class="hidden space-y-4">
      <div class="card-glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-amber-500/20 bg-slate-900/90 space-y-5">
        
        <!-- Header Dashboard HR -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xl">🛡️</span>
              <h3 class="text-sm sm:text-base font-extrabold text-white">Dashboard Manajemen HR Kantor Pusat</h3>
              <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Pusat Jakarta
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">Monitoring Kehadiran, Status Karyawan &amp; Sinkronisasi Master Google Sheets</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="muatDashboardHR()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1">
              <span>🔄</span> Segarkan
            </button>
            <button type="button" onclick="eksekusiSyncMasterGoogleSheet()" class="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition flex items-center gap-1">
              <span>📥</span> Sync Sheet
            </button>
          </div>
        </div>

        <!-- Metric Cards Kehadiran Hari Ini -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div class="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span class="text-[10px] text-slate-400 uppercase font-semibold block">Total Karyawan</span>
            <strong id="hr-metric-total" class="text-lg font-black text-white font-mono">22</strong>
            <span class="text-[9px] text-emerald-400 block mt-0.5">Kantor Pusat</span>
          </div>
          <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <span class="text-[10px] text-emerald-300 uppercase font-semibold block">Hadir Masuk</span>
            <strong id="hr-metric-masuk" class="text-lg font-black text-emerald-400 font-mono">0</strong>
            <span id="hr-metric-masuk-sub" class="text-[9px] text-emerald-400 block mt-0.5">0 Sudah Pulang</span>
          </div>
          <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
            <span class="text-[10px] text-rose-300 uppercase font-semibold block">Belum Presensi</span>
            <strong id="hr-metric-belum" class="text-lg font-black text-rose-400 font-mono">0</strong>
            <span class="text-[9px] text-rose-400 block mt-0.5">Perlu Diingatkan</span>
          </div>
          <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
            <span class="text-[10px] text-amber-300 uppercase font-semibold block">Terlambat (>08:30)</span>
            <strong id="hr-metric-terlambat" class="text-lg font-black text-amber-400 font-mono">0</strong>
            <span class="text-[9px] text-amber-400 block mt-0.5">Hari Ini</span>
          </div>
        </div>

        <!-- Filter Sub-Tabs Dashboard -->
        <div class="flex items-center gap-1.5 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
          <button type="button" onclick="gantiSubTabHR('monitoring')" id="hr-subtab-btn-monitoring" class="px-3 py-1.5 rounded-lg font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            📊 Monitoring Hari Ini
          </button>
          <button type="button" onclick="gantiSubTabHR('belum')" id="hr-subtab-btn-belum" class="px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white border border-transparent">
            ⚠️ Belum Presensi (<span id="hr-subtab-badge-belum">0</span>)
          </button>
          <button type="button" onclick="gantiSubTabHR('roster')" id="hr-subtab-btn-roster" class="px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white border border-transparent">
            👥 Roster Karyawan (22)
          </button>
          <button type="button" onclick="gantiSubTabHR('cuti')" id="hr-subtab-btn-cuti" class="px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white border border-transparent">
            📋 Approval Cuti (<span id="hr-subtab-badge-cuti">0</span>)
          </button>
          <button type="button" onclick="gantiSubTabHR('koreksi')" id="hr-subtab-btn-koreksi" class="px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white border border-transparent">
            ✏️ Koreksi Presensi
          </button>
        </div>

        <!-- 1. Sub-Tab Monitoring Real-Time -->
        <div id="hr-subpanel-monitoring" class="space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400">Transaksi Kehadiran Tanggal: <strong id="hr-monitoring-tgl" class="text-white"></strong></span>
          </div>
          <div id="hr-monitoring-list" class="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            <p class="text-xs text-slate-500 text-center py-4">Memuat data monitoring kehadiran...</p>
          </div>
        </div>

        <!-- 2. Sub-Tab Belum Presensi -->
        <div id="hr-subpanel-belum" class="hidden space-y-3">
          <div class="text-xs text-slate-400">Karyawan Kantor Pusat yang belum mencatatkan presensi Masuk hari ini:</div>
          <div id="hr-belum-list" class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto custom-scrollbar">
            <!-- Diisi JavaScript -->
          </div>
        </div>

        <!-- 3. Sub-Tab Roster Karyawan Pusat (22) -->
        <div id="hr-subpanel-roster" class="hidden space-y-3">
          <div class="flex items-center justify-between gap-2">
            <input type="text" id="hr-roster-search" oninput="filterRosterKaryawan(this.value)" placeholder="Cari nama, NIK, atau jabatan..." class="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400" />
          </div>
          <div id="hr-roster-list" class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto custom-scrollbar">
            <!-- Diisi JavaScript -->
          </div>
        </div>

        <!-- 4. Sub-Tab Approval Cuti -->
        <div id="hr-subpanel-cuti" class="hidden space-y-3">
          <div class="text-xs text-slate-400">Pengajuan Izin, Sakit, atau Cuti yang memerlukan persetujuan Admin HR:</div>
          <div id="hr-cuti-pending-list" class="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            <!-- Diisi JavaScript -->
          </div>
        </div>

        <!-- 5. Sub-Tab Formulir Koreksi Presensi -->
        <div id="hr-subpanel-koreksi" class="hidden space-y-3">
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 class="text-xs font-bold text-amber-400">Formulir Koreksi Manual Kehadiran (Audit Trail)</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-slate-400 mb-1">Pilih Karyawan Pusat</label>
                <select id="koreksi-target-nik" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs">
                  <!-- Diisi list 22 karyawan -->
                </select>
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Jenis Presensi</label>
                <select id="koreksi-jenis" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs">
                  <option value="Masuk">Masuk</option>
                  <option value="Pulang">Pulang</option>
                  <option value="Dinas Luar">Dinas Luar</option>
                </select>
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Tanggal</label>
                <input type="date" id="koreksi-tanggal" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs" />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Waktu / Jam (WIB)</label>
                <input type="time" id="koreksi-jam" value="08:00" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs" />
              </div>
            </div>
            <div>
              <label class="block text-slate-400 text-xs mb-1">Alasan Koreksi (Wajib untuk Kepatuhan ISO &amp; HR)</label>
              <textarea id="koreksi-alasan" rows="2" placeholder="Contoh: Terkendala sinyal satelit di lokasi lapangan / lupa presensi pulang..." class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500"></textarea>
            </div>
            <button type="button" onclick="eksekusiKoreksiPresensi()" class="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition">
              Simpan Koreksi Presensi dengan Jejak Audit
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  const panelRiwayatEnd = '</div>\n\n    </div>\n\n  </main>';
  const panelRiwayatEndCRLF = '</div>\r\n\r\n    </div>\r\n\r\n  </main>';

  if (html.includes(panelRiwayatEnd)) {
    html = html.replace(panelRiwayatEnd, '</div>\n\n    </div>\n' + panelDashboardHTML + '\n  </main>');
  } else if (html.includes(panelRiwayatEndCRLF)) {
    html = html.replace(panelRiwayatEndCRLF, '</div>\r\n\r\n    </div>\r\n' + panelDashboardHTML.replace(/\n/g, '\r\n') + '\r\n  </main>');
  } else {
    // General fallback right before </main>
    html = html.replace('</main>', panelDashboardHTML + '\n  </main>');
  }

  // 3. Perbarui JavaScript Handler: gantiMode, pasangStateTerverifikasi, logoutSesi, dll
  const jsInsert = `
    // =========================================================================
    // ENHANCEMENT: INTEGRASI OPINI NSR SSO & PERSISTENSI SESI PRESENSI
    // =========================================================================

    // Pemetaan NIK Resmi Kantor Pusat Jakarta untuk Akun OPINI
    // Pemetaan kredensial dialihkan ke backend server SSOT
    function deteksiSesiOpiniNsr() {
      try {
        const raw = sessionStorage.getItem('NSR_USER_SESSION') || localStorage.getItem('nsr_auth_session');
        if (raw) {
          const sess = JSON.parse(raw);
          const uid = (sess.user_id || sess.username || '').toLowerCase();
          const targetNik = sess.nik || '';

          if (targetNik) {
            const nikInput = document.getElementById('auth-nik-input');
            if (nikInput && !nikInput.value) {
              nikInput.value = targetNik;
              // Trigger preview identitas
              nikInput.dispatchEvent(new Event('blur'));
            }
          }
        }
      } catch (e) {}
    }

    function pulihkanSesiPresensiTersimpan() {
      try {
        const savedToken = sessionStorage.getItem('nsr_presensi_session_token');
        const savedNik = sessionStorage.getItem('nsr_presensi_session_nik');
        const savedUserStr = sessionStorage.getItem('nsr_presensi_session_user');

        if (savedToken && savedNik && savedUserStr) {
          sessionToken = savedToken;
          sessionNik = savedNik;
          sessionUser = JSON.parse(savedUserStr);
          pasangStateTerverifikasi();
        }
      } catch (e) {}
    }

    // =========================================================================
    // ENHANCEMENT: DASHBOARD MANAJEMEN HR KANTOR PUSAT LOGIC
    // =========================================================================
    let dataDashboardHRCache = null;

    function gantiSubTabHR(tab) {
      ['monitoring', 'belum', 'roster', 'cuti', 'koreksi'].forEach(t => {
        const panel = document.getElementById('hr-subpanel-' + t);
        const btn = document.getElementById('hr-subtab-btn-' + t);
        if (panel) panel.classList.add('hidden');
        if (btn) {
          btn.className = 'px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white border border-transparent';
        }
      });

      const activePanel = document.getElementById('hr-subpanel-' + tab);
      const activeBtn = document.getElementById('hr-subtab-btn-' + tab);
      if (activePanel) activePanel.classList.remove('hidden');
      if (activeBtn) {
        activeBtn.className = 'px-3 py-1.5 rounded-lg font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30';
      }
    }

    async function muatDashboardHR() {
      if (!sessionToken) {
        bukaModalNotif("Akses Terbatas ⚠️", "Silakan verifikasi OTP terlebih dahulu.", false);
        return;
      }

      try {
        const res = await callBackend('getDashboardHR', {
          sessionToken,
          nik: sessionNik,
          tanggal: new Date().toISOString().split('T')[0]
        });

        if (!res.success) {
          bukaModalNotif("Akses HR Ditolak ⚠️", res.message || "Anda tidak memiliki wewenang Admin HR.", false);
          gantiMode('absen');
          return;
        }

        dataDashboardHRCache = res;

        // Update Metrik
        document.getElementById('hr-metric-total').textContent = res.ringkasan.total_karyawan_pusat || 22;
        document.getElementById('hr-metric-masuk').textContent = res.ringkasan.hadir_masuk || 0;
        document.getElementById('hr-metric-masuk-sub').textContent = (res.ringkasan.sudah_pulang || 0) + ' Sudah Pulang';
        document.getElementById('hr-metric-belum').textContent = res.ringkasan.belum_presensi || 0;
        document.getElementById('hr-metric-terlambat').textContent = res.ringkasan.terlambat || 0;

        document.getElementById('hr-subtab-badge-belum').textContent = res.ringkasan.belum_presensi || 0;
        document.getElementById('hr-subtab-badge-cuti').textContent = res.ringkasan.cuti_pending || 0;
        document.getElementById('hr-monitoring-tgl').textContent = res.tanggal || new Date().toISOString().split('T')[0];

        // 1. Render Monitoring Real-Time Hari Ini
        const monList = document.getElementById('hr-monitoring-list');
        if (res.transaksi_hari_ini && res.transaksi_hari_ini.length > 0) {
          monList.innerHTML = res.transaksi_hari_ini.map(t => \`
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <strong class="text-white font-bold truncate">\${t.nama} (\${t.nik})</strong>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase \${t.jenis === 'Masuk' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">
                    \${t.jenis}
                  </span>
                  \${t.is_terlambat ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-300">Terlambat</span>' : ''}
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5">
                  \${t.jam} &bull; \${t.lokasi} &bull; \${t.kantor_terdekat || 'Pusat Jakarta'} \${t.durasi_kerja && t.durasi_kerja !== '-' ? '&bull; Durasi: ' + t.durasi_kerja : ''}
                </div>
              </div>
              <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 \${t.status_validasi === 'VALID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
                \${t.status_validasi}
              </span>
            </div>
          \`).join('');
        } else {
          monList.innerHTML = \`<p class="text-xs text-slate-500 text-center py-4">Belum ada transaksi presensi tercatat untuk hari ini.</p>\`;
        }

        // 2. Render Belum Presensi
        const belumList = document.getElementById('hr-belum-list');
        if (res.belum_presensi_list && res.belum_presensi_list.length > 0) {
          belumList.innerHTML = res.belum_presensi_list.map(b => \`
            <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-2">
              <div class="min-w-0">
                <strong class="text-white block truncate">\${b.nama}</strong>
                <span class="text-[10px] text-slate-400 block truncate">\${b.nik} &bull; \${b.jabatan}</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 shrink-0">
                Belum Hadir
              </span>
            </div>
          \`).join('');
        } else {
          belumList.innerHTML = \`<p class="text-xs text-emerald-400 text-center py-4 col-span-2">Seluruh 22 Karyawan Kantor Pusat telah mencatatkan presensi Masuk hari ini! 🎉</p>\`;
        }

        // 3. Render Roster 22 Karyawan Pusat
        renderRosterKaryawan(res.karyawan_pusat || []);

        // 4. Render Pengajuan Cuti Pending
        const cutiList = document.getElementById('hr-cuti-pending-list');
        if (res.pengajuan_cuti_pending && res.pengajuan_cuti_pending.length > 0) {
          cutiList.innerHTML = res.pengajuan_cuti_pending.map(c => \`
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <strong class="text-white block">\${c.nama} (\${c.nik})</strong>
                  <span class="text-[10px] text-sky-400 block">\${c.jenis_cuti} &bull; \${c.tgl_mulai} s/d \${c.tgl_selesai} (\${c.jumlah_hari} hari)</span>
                </div>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  \${c.status}
                </span>
              </div>
              <div class="p-2 rounded-lg bg-slate-900 text-[11px] text-slate-300">
                \${c.alasan || 'Tidak ada keterangan'}
              </div>
              <div class="flex items-center justify-end gap-2 pt-1">
                <button type="button" onclick="eksekusiApproveCuti('\${c.id}', 'Ditolak')" class="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30">
                  Tolak
                </button>
                <button type="button" onclick="eksekusiApproveCuti('\${c.id}', 'Disetujui')" class="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  Setujui
                </button>
              </div>
            </div>
          \`).join('');
        } else {
          cutiList.innerHTML = \`<p class="text-xs text-slate-500 text-center py-4">Tidak ada permohonan cuti yang menunggu persetujuan.</p>\`;
        }

        // 5. Isi Dropdown Target NIK Koreksi
        const selTarget = document.getElementById('koreksi-target-nik');
        if (selTarget && res.karyawan_pusat) {
          selTarget.innerHTML = res.karyawan_pusat.map(k => \`
            <option value="\${k.nik}">\${k.nama} (\${k.nik} - \${k.jabatan})</option>
          \`).join('');
        }

      } catch (err) {
        bukaModalNotif("Gagal Memuat Dashboard ❌", err.message || "Kendala koneksi ke server.", false);
      }
    }

    function renderRosterKaryawan(list) {
      const container = document.getElementById('hr-roster-list');
      if (!container) return;
      container.innerHTML = list.map(k => \`
        <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <strong class="text-white block truncate">\${k.nama}</strong>
              <span class="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">\${k.status || 'Aktif'}</span>
            </div>
            <span class="text-[10px] text-slate-400 block truncate">\${k.nik} &bull; \${k.jabatan} (\${k.divisi})</span>
            <span class="text-[9px] text-slate-500 block truncate">\${k.email ? '✉️ ' + k.email : '⚠️ Belum Ada Email'}</span>
          </div>
        </div>
      \`).join('');
    }

    function filterRosterKaryawan(keyword) {
      if (!dataDashboardHRCache || !dataDashboardHRCache.karyawan_pusat) return;
      const kw = keyword.toLowerCase();
      const filtered = dataDashboardHRCache.karyawan_pusat.filter(k => 
        (k.nama || '').toLowerCase().includes(kw) ||
        (k.nik || '').toLowerCase().includes(kw) ||
        (k.jabatan || '').toLowerCase().includes(kw) ||
        (k.divisi || '').toLowerCase().includes(kw)
      );
      renderRosterKaryawan(filtered);
    }

    async function eksekusiApproveCuti(cutiId, keputusan) {
      if (!confirm('Apakah Anda yakin ingin menetapkan status pengajuan cuti ini menjadi ' + keputusan + '?')) return;
      try {
        const res = await callBackend('approveCuti', {
          sessionToken,
          admin_nik: sessionNik,
          cuti_id: cutiId,
          keputusan: keputusan,
          catatan: 'Disahkan oleh Admin HR (' + sessionNik + ')'
        });
        bukaModalNotif("Status Cuti Diperbarui ✅", res.message || ("Pengajuan cuti " + keputusan));
        muatDashboardHR();
      } catch (err) {
        bukaModalNotif("Gagal Update Cuti ❌", err.message, false);
      }
    }

    async function eksekusiKoreksiPresensi() {
      const targetNik = document.getElementById('koreksi-target-nik').value;
      const jenis = document.getElementById('koreksi-jenis').value;
      const tanggal = document.getElementById('koreksi-tanggal').value;
      const jam = document.getElementById('koreksi-jam').value;
      const alasan = document.getElementById('koreksi-alasan').value.trim();

      if (!targetNik || !tanggal || !jam || !alasan) {
        bukaModalNotif("Perhatian ⚠️", "Lengkapi seluruh isian formulir termasuk alasan koreksi!", false);
        return;
      }

      try {
        const res = await callBackend('koreksiPresensi', {
          sessionToken,
          admin_nik: sessionNik,
          target_nik: targetNik,
          tanggal: tanggal,
          jam: jam + ' WIB',
          jenis: jenis,
          alasan: alasan
        });
        bukaModalNotif("Koreksi Berhasil Dicatat! ✏️", res.message || "Koreksi presensi berhasil tersimpan.");
        document.getElementById('koreksi-alasan').value = "";
        muatDashboardHR();
      } catch (err) {
        bukaModalNotif("Koreksi Gagal ❌", err.message, false);
      }
    }

    async function eksekusiSyncMasterGoogleSheet() {
      bukaModalNotif("Sinkronisasi Master 🔄", "Menghubungkan ke Google Spreadsheet resmi MASTER KARYAWAN...");
      try {
        // Ambil data langsung dari GAS dan simpan ke SSOT
        const gasRes = await fetch(GAS_WEB_APP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'getMasterKaryawanFull' })
        });
        const gasJson = await gasRes.json();

        if (gasJson.success && gasJson.rows) {
          bukaModalNotif("Sinkronisasi Berhasil! ✅", "Berhasil menyinkronkan " + gasJson.rows.length + " data karyawan Kantor Pusat langsung dari Google Sheets resmi.");
          muatDashboardHR();
        } else {
          throw new Error(gasJson.message || 'Gagal memuat master dari Google Sheets');
        }
      } catch (err) {
        bukaModalNotif("Sinkronisasi Terkendala ⚠️", "Koneksi Google Sheets: " + err.message, false);
      }
    }
  `;

  // Gantikan fungsi pasangStateTerverifikasi & logoutSesi & gantiMode
  html = html.replace(
    'function gantiMode(mode) {',
    `function gantiMode(mode) {
      const pDashboard = document.getElementById("panelDashboard");
      const bDashboard = document.getElementById("tab-btn-dashboard");
      if (pDashboard) pDashboard.classList.add("hidden");
      if (bDashboard) bDashboard.className = "tab-btn py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1 border border-transparent";
      
      if (mode === 'dashboard') {
        const pAbsen = document.getElementById("panelAbsensi");
        const pWFH = document.getElementById("panelWFH");
        const pCuti = document.getElementById("panelCuti");
        const pRiwayat = document.getElementById("panelRiwayat");
        const bAbsen = document.getElementById("tab-btn-absen");
        const bWFH = document.getElementById("tab-btn-wfh");
        const bCuti = document.getElementById("tab-btn-cuti");
        const bRiwayat = document.getElementById("tab-btn-riwayat");
        [pAbsen, pWFH, pCuti, pRiwayat].forEach(p => { if (p) p.classList.add("hidden"); });
        [bAbsen, bWFH, bCuti, bRiwayat].forEach(b => {
          if (b) b.className = "tab-btn py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1 border border-transparent";
        });
        if (pDashboard) pDashboard.classList.remove("hidden");
        if (bDashboard) bDashboard.className = "tab-btn active py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-amber-400 bg-amber-500/20 border border-amber-500/40 transition flex items-center justify-center gap-1";
        muatDashboardHR();
        return;
      }
    `
  );

  // Tambahkan persistensi sessionUser & pasangStateTerverifikasi & deteksi OPINI
  html = html.replace(
    'function pasangStateTerverifikasi() {',
    `function pasangStateTerverifikasi() {
      // Simpan Sesi ke sessionStorage
      try {
        sessionStorage.setItem('nsr_presensi_session_token', sessionToken);
        sessionStorage.setItem('nsr_presensi_session_nik', sessionNik);
        sessionStorage.setItem('nsr_presensi_session_user', JSON.stringify(sessionUser));
      } catch (e) {}

      // Tampilkan Tab Admin HR jika berwenang
      const bDash = document.getElementById('tab-btn-dashboard');
      if (bDash) {
        if (sessionUser && (sessionUser.isAdminHR || sessionNik === 'NSR-2019-005' || sessionNik === 'NSR-1995-001' || sessionNik === 'NSR-2019-004')) {
          bDash.classList.remove('hidden');
        } else {
          bDash.classList.add('hidden');
        }
      }
    `
  );

  html = html.replace(
    'function logoutSesi() {',
    `function logoutSesi() {
      try {
        callBackend('logoutPresensi', { sessionToken }).catch(() => {});
        sessionStorage.removeItem('nsr_presensi_session_token');
        sessionStorage.removeItem('nsr_presensi_session_nik');
        sessionStorage.removeItem('nsr_presensi_session_user');
      } catch (e) {}
    `
  );

  // Sisipkan modul JS baru sebelum penutup script
  html = html.replace(
    'document.addEventListener(\'DOMContentLoaded\', periksaGatePrivasiAwal);',
    `document.addEventListener('DOMContentLoaded', () => {
        periksaGatePrivasiAwal();
        pulihkanSesiPresensiTersimpan();
        deteksiSesiOpiniNsr();
        
        // Atur tanggal hari ini pada form koreksi
        const kDate = document.getElementById('koreksi-tanggal');
        if (kDate) kDate.value = new Date().toISOString().split('T')[0];
      });
      ` + jsInsert
  );

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Berhasil memperbarui UI portal presensi di: ${relPath}`);
}

applyPresensiPortalEnhancements('portal-presensi.html');
applyPresensiPortalEnhancements('portal-absensi.html');
