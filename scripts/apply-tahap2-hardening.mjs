import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'portal-penugasan-jo.html');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. BACKUP SEBELUM HARDENING
fs.writeFileSync(filePath + '.bak-hardening', content, 'utf-8');
console.log('✔ Backup tersimpan di portal-penugasan-jo.html.bak-hardening');

// 2. TANDAI SEMUA ITEM SEED_PROJECTS DENGAN is_seed: true, is_demo: true
content = content.replace(/id:\s*"NSR-2026-(\d{4}|REQ-\d{3})",/g, (match) => {
  return `${match}\n        is_seed: true,\n        is_demo: true,`;
});
console.log('✔ Flag is_seed: true & is_demo: true ditambahkan pada SEED_PROJECTS.');

// 3. UPDATE renderDashboardTabel UNTUK:
//    - Menonaktifkan tombol selesai/buka (read-only monitoring)
//    - Menyaring data demo/seed dari pekerjaan nyata
//    - Menyelaraskan angka metrik kartu agar persis sama dengan jumlah baris tabel pada filter aktif

const oldRenderStart = '// 10. RENDER TABEL DASHBOARD ANTREAN & MONITORING PENUGASAN (TAHAP 2)';
const oldRenderIdx = content.indexOf(oldRenderStart);

const printEngineNeedle = '// 11. MESIN RENDER 9 DOKUMEN (PRINT & PREVIEW ENGINE)';
const printEngineIdx = content.indexOf(printEngineNeedle);

if (oldRenderIdx === -1 || printEngineIdx === -1) {
  console.error('❌ Batas renderDashboardTabel tidak ditemukan!');
  process.exit(1);
}

const preComment = content.lastIndexOf('// ==========================================================', oldRenderIdx);

const newModuleCode = `// ==========================================================
    // 9B. MODUL MONITORING PENUGASAN, SLA & DEADLINE (TAHAP 2 HARDENED)
    // ==========================================================
    let activeMonitoringFilter = null; // 'AKTIF' | 'DEADLINE_NEAR' | 'OVERDUE' | 'SELESAI' | null

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    /**
     * Dapatkan tanggal hari ini dalam format YYYY-MM-DD zona waktu Asia/Jakarta (WIB)
     */
    function getTodayDateWIB() {
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        return formatter.format(new Date());
      } catch (e) {
        const now = new Date();
        const wibMs = now.getTime() + (7 * 3600 * 1000 + now.getTimezoneOffset() * 60 * 1000);
        const d = new Date(wibMs);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return \`\${y}-\${m}-\${day}\`;
      }
    }

    /**
     * Memeriksa apakah suatu item adalah data demo/simulasi awal
     * Sesuai Poin 3: Data SEED/demo tidak boleh dihitung sebagai pekerjaan nyata
     */
    function isSeedOrDemo(p) {
      if (!p) return false;
      if (p.is_seed === true || p.is_demo === true) return true;
      const idStr = String(p.id || '').toUpperCase();
      const deb = String(p.debitur_nama || '').toUpperCase();
      const kln = String(p.pemberi_tugas_nama || '').toUpperCase();
      if (idStr.includes('SIMULASI') || idStr.includes('DEMO')) return true;
      if (deb.includes('(CONTOH)') || deb.includes('(SIMULASI)') || kln.includes('(SIMULASI)')) return true;
      return false;
    }

    /**
     * Memeriksa apakah penugasan sudah purna/selesai berdasarkan sumber resmi
     */
    function isProjectSelesai(p) {
      if (!p) return false;
      const st = String(p.status || '').toUpperCase().trim();
      const stKerja = String(p.status_pekerjaan || '').toUpperCase().trim();
      if (['SELESAI', 'COMPLETED', 'LAPORAN_TERBIT', 'CLOSED', 'FINISH', 'FINISHED'].includes(st) ||
          ['SELESAI', 'COMPLETED', 'LAPORAN_TERBIT', 'CLOSED', 'FINISH', 'FINISHED'].includes(stKerja)) {
        return true;
      }
      if (p.is_selesai === true) return true;
      return false;
    }

    /**
     * Ekstraksi tanggal target penyelesaian riil dari field resmi database
     * Sesuai Poin 3: Target deadline harus berasal dari field resmi yang benar-benar tersimpan
     */
    function getProjectTargetDate(p) {
      if (!p) return null;
      // Urutan prioritas field resmi tersimpan: Target_Selesai, Tgl_Target_Selesai, Deadline, Masa_Berlaku_LP
      const raw = p.target_selesai || p.tgl_target_selesai || p.deadline || p.Target_Selesai || p.Tgl_Target_Selesai || p.Deadline || p.masa_berlaku_lp || p.Masa_Berlaku_LP;
      if (!raw) return null;
      const str = String(raw).trim();
      if (!str || str === '-' || str.toLowerCase() === 'belum ditentukan' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
        return null;
      }
      const m = str.match(/(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})/);
      if (m) {
        return \`\${m[1]}-\${String(m[2]).padStart(2, '0')}-\${String(m[3]).padStart(2, '0')}\`;
      }
      return null;
    }

    /**
     * Menghitung selisih hari tanggal target dengan hari ini (WIB)
     */
    function hitungSelisihHariTenggat(targetDateStr, todayStr = getTodayDateWIB()) {
      if (!targetDateStr) return null;
      const [tY, tM, tD] = targetDateStr.split('-').map(Number);
      const [nowY, nowM, nowD] = todayStr.split('-').map(Number);
      if (!tY || !tM || !tD || !nowY || !nowM || !nowD) return null;
      
      const targetUtc = Date.UTC(tY, tM - 1, tD);
      const todayUtc = Date.UTC(nowY, nowM - 1, nowD);
      return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
    }

    /**
     * Evaluasi Status & Deadline Badge Sesuai Aturan Ketat:
     * 1. Selesai -> Kategori SELESAI (TIDAK PERNAH DIHITUNG OVERDUE)
     * 2. Tanpa Target -> Kategori BELUM_DITENTUKAN (BUKAN OVERDUE)
     * 3. Diff < 0 -> OVERDUE
     * 4. Diff 0 s.d 3 -> DEADLINE_NEAR (H-3 s.d H-0)
     * 5. Diff > 3 -> AMAN
     */
    function evaluasiDeadlinePenugasan(p, todayStr = getTodayDateWIB()) {
      const isSelesai = isProjectSelesai(p);
      const targetStr = getProjectTargetDate(p);

      if (isSelesai) {
        return {
          kategori: 'SELESAI',
          label: 'Selesai',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold',
          icon: '✔',
          diff: null,
          targetStr: targetStr || '-'
        };
      }

      if (!targetStr) {
        return {
          kategori: 'BELUM_DITENTUKAN',
          label: 'Belum ditentukan',
          badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700 font-medium',
          icon: '⏳',
          diff: null,
          targetStr: '-'
        };
      }

      const diff = hitungSelisihHariTenggat(targetStr, todayStr);

      if (diff < 0) {
        const lewat = Math.abs(diff);
        return {
          kategori: 'OVERDUE',
          label: \`Overdue (\${lewat} hr)\`,
          badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-black animate-pulse',
          icon: '⚠️',
          diff: diff,
          targetStr: targetStr
        };
      } else if (diff <= 3) {
        const sisa = diff === 0 ? 'Hari Ini (H-0)' : (diff === 1 ? 'Besok (H-1)' : \`H-\${diff}\`);
        return {
          kategori: 'DEADLINE_NEAR',
          label: sisa,
          badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
          icon: '⏰',
          diff: diff,
          targetStr: targetStr
        };
      } else {
        return {
          kategori: 'AMAN',
          label: \`\${diff} hr lagi\`,
          badgeClass: 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium',
          icon: '🗓️',
          diff: diff,
          targetStr: targetStr
        };
      }
    }

    /**
     * Ambil daftar personil unik (Penilai, Reviewer, Marketing) untuk filter dinamis
     */
    function ambilDaftarPICUnik(list) {
      const setPic = new Set();
      list.forEach(p => {
        [p.penilai_nama, p.reviewer_nama, p.pic_marketing, p.marketing_nama, p.rekan_nama, p.asisten_nama].forEach(name => {
          if (name && typeof name === 'string') {
            const clean = name.trim();
            if (clean && clean !== '-' && clean.length > 2) {
              setPic.add(clean);
            }
          }
        });
      });
      return Array.from(setPic).sort((a, b) => a.localeCompare(b, 'id'));
    }

    /**
     * Interaktivitas Klik-to-Filter dari 4 Kartu Ringkasan
     */
    function filterDariKartu(filterType) {
      if (activeMonitoringFilter === filterType) {
        // Klik ulang kartu yang sama -> Reset ke Semua
        activeMonitoringFilter = null;
      } else {
        activeMonitoringFilter = filterType;
      }

      const selectStatus = document.getElementById('filter_status');
      if (selectStatus) {
        selectStatus.value = activeMonitoringFilter ? activeMonitoringFilter : 'ALL';
      }

      renderDashboardTabel();
    }

    /**
     * Handler saat dropdown status diubah manual
     */
    function tanganiGantiFilterStatus() {
      const selectStatus = document.getElementById('filter_status');
      const val = selectStatus ? selectStatus.value : 'ALL';
      if (['AKTIF', 'DEADLINE_NEAR', 'OVERDUE', 'SELESAI'].includes(val)) {
        activeMonitoringFilter = val;
      } else {
        activeMonitoringFilter = null;
      }
      renderDashboardTabel();
    }

    /**
     * Update visual ring & badge pill pada 4 kartu monitoring
     */
    function perbaruiTampilanKartuAktif(activeStatus) {
      const mapCards = {
        'AKTIF': { card: 'card-metric-aktif', pill: 'pill-filter-aktif', ring: 'ring-2 ring-blue-400 border-blue-500 bg-blue-950/40 shadow-blue-900/30' },
        'DEADLINE_NEAR': { card: 'card-metric-near', pill: 'pill-filter-near', ring: 'ring-2 ring-amber-400 border-amber-500 bg-amber-950/40 shadow-amber-900/30' },
        'OVERDUE': { card: 'card-metric-overdue', pill: 'pill-filter-overdue', ring: 'ring-2 ring-rose-400 border-rose-500 bg-rose-950/40 shadow-rose-900/30' },
        'SELESAI': { card: 'card-metric-selesai', pill: 'pill-filter-selesai', ring: 'ring-2 ring-emerald-400 border-emerald-500 bg-emerald-950/40 shadow-emerald-900/30' }
      };

      Object.entries(mapCards).forEach(([k, info]) => {
        const elCard = document.getElementById(info.card);
        const elPill = document.getElementById(info.pill);
        if (elCard) {
          info.ring.split(' ').forEach(cls => elCard.classList.remove(cls));
          if (activeStatus === k) {
            info.ring.split(' ').forEach(cls => elCard.classList.add(cls));
          }
        }
        if (elPill) {
          if (activeStatus === k) elPill.classList.remove('hidden');
          else elPill.classList.add('hidden');
        }
      });
    }

    /**
     * Reset semua filter ke kondisi awal
     */
    function resetSemuaFilterMonitoring() {
      activeMonitoringFilter = null;
      const s1 = document.getElementById('filter_status'); if (s1) s1.value = 'ALL';
      const s2 = document.getElementById('filter_wilayah'); if (s2) s2.value = 'ALL';
      const s3 = document.getElementById('filter_pic'); if (s3) s3.value = 'ALL';
      const s4 = document.getElementById('filter_periode'); if (s4) s4.value = 'ALL';
      const s5 = document.getElementById('cari_proyek'); if (s5) s5.value = '';
      renderDashboardTabel();
    }

    // ==========================================================
    // 10. RENDER TABEL DASHBOARD ANTREAN & MONITORING PENUGASAN (TAHAP 2 HARDENED)
    // ==========================================================
    function renderDashboardTabel() {
      // 1. Ambil sesi autentikasi aktif:
      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const tbody = document.getElementById('tbody_antrean') || document.querySelector('#tab-2 tbody') || document.getElementById('tbody-dashboard') || document.querySelector('#tab-content-dashboard tbody');
      if (!tbody) return;

      const fStatus = document.getElementById('filter_status')?.value || 'ALL';
      const fWil = document.getElementById('filter_wilayah')?.value || 'ALL';
      const fPic = document.getElementById('filter_pic')?.value || 'ALL';
      const fPeriode = document.getElementById('filter_periode')?.value || 'ALL';
      const query = document.getElementById('cari_proyek')?.value.toLowerCase().trim() || '';

      const isCabangUser = Boolean(auth && (auth.isCabang || (auth.mode === 'CABANG' && !auth.isSuperAdmin)));

      // Kunci/sembunyikan filter wilayah untuk pengguna kantor cabang demi kepatuhan RBAC isolasi data
      const wrapWil = document.getElementById('wrapper-filter-wilayah');
      if (wrapWil) {
        if (isCabangUser) {
          wrapWil.classList.add('hidden');
        } else {
          wrapWil.classList.remove('hidden');
        }
      }

      // Gabungkan data cloud dengan arsip privat lokal cabang pengguna
      const localPrivate = ambilDataPrivatCabang((auth && auth.wilayah) || userSession.wilayah);
      let combined = [...localPrivate];
      projectDatabase.forEach(p => {
        if (!combined.some(x => x.id === p.id)) {
          combined.push(p);
        }
      });

      // 2. ISOLASI CABANG KETAT (RBAC): Cabang hanya boleh mengakses data miliknya
      let namaCabangSesi = '';
      if (auth && auth.isCabang) {
        const namaCabang = (auth.wilayahLabel || auth.wilayah || '').toLowerCase();
        const kataKunci = namaCabang.replace('kantor cabang', '').replace('kantor', '').trim();
        const kodeKemenkeu = (auth.kodeWilayah || auth.kode || auth.kodeKantor || '').toLowerCase();
        namaCabangSesi = kataKunci;

        combined = combined.filter(item => {
          const wilayahItem = (item.kantor_wilayah || item.wilayah || '').toLowerCase();
          const kodeItem = (item.kode_kantor || item.kode || item.kodeWilayah || '').toLowerCase();
          const noSpkItem = (item.nomor_spk || item.no_spk || item.nomor_lp || '').toLowerCase();
          const noAdmItem = (item.nomor_adm || item.id || '').toLowerCase();
          const shortCode = (auth.wilayahCode || kataKunci.substring(0, 3)).toLowerCase();
          
          return wilayahItem.includes(kataKunci) || 
                 (kodeKemenkeu && kodeItem.includes(kodeKemenkeu)) || 
                 (noSpkItem && (noSpkItem.includes(\`nsr-\${shortCode}\`) || noSpkItem.includes(\`/\${shortCode}/\`) || noSpkItem.includes(\`nsr-\${kataKunci.substring(0, 3)}\`))) ||
                 (noAdmItem && (noAdmItem.includes(\`nsr-\${shortCode}\`) || noAdmItem.includes(\`/\${shortCode}/\`)));
        });
      }

      // 3. ATURAN DATA RESMI (Poin 3): Data SEED/demo tidak boleh dihitung sebagai pekerjaan nyata
      // Cek apakah mode demo aktif secara eksplisit via URL query (?demo=1)
      const isDemoExplicit = (typeof window !== 'undefined' && window.location && new URLSearchParams(window.location.search).get('demo') === '1');
      if (!isDemoExplicit) {
        combined = combined.filter(p => !isSeedOrDemo(p));
      }

      // 4. POPULASI FILTER PIC DINAMIS DARI DATA AKTIF
      const selectPic = document.getElementById('filter_pic');
      if (selectPic) {
        const currentSelectedPic = selectPic.value || 'ALL';
        const picList = ambilDaftarPICUnik(combined);
        const optHtml = ['<option value="ALL">Semua PIC &amp; Tim Penilai</option>'];
        picList.forEach(pic => {
          const sel = (pic === currentSelectedPic) ? ' selected' : '';
          optHtml.push(\`<option value="\${escapeHtml(pic)}"\${sel}>\${escapeHtml(pic)}</option>\`);
        });
        selectPic.innerHTML = optHtml.join('');
      }

      // 5. PENYELARASAN METRIK KARTU & FILTER (Poin 3)
      // Metrik dihitung dari basis data yang telah disaring kantor, PIC, periode, dan pencarian,
      // sehingga angka pada kartu SELALU PERSIS SAMA dengan jumlah data di tabel saat difilter!
      const todayWIB = getTodayDateWIB();

      // Saring basis metrik sesuai filter non-status (Wilayah, PIC, Periode, Query)
      const baseForMetrics = combined.filter(p => {
        // Filter Wilayah (hanya untuk pusat)
        if (!isCabangUser && fWil !== "ALL" && p.kantor_wilayah !== fWil) return false;

        // Filter PIC & Tim Penilai
        if (fPic !== "ALL") {
          const timList = [p.penilai_nama, p.reviewer_nama, p.pic_marketing, p.marketing_nama, p.rekan_nama, p.asisten_nama]
            .filter(Boolean)
            .map(s => String(s).trim().toLowerCase());
          if (!timList.includes(fPic.trim().toLowerCase())) return false;
        }

        // Filter Periode Waktu
        if (fPeriode !== "ALL") {
          const refDateStr = p.tanggal_surat || p.created_at || p.target_selesai;
          if (!refDateStr) return false;
          const dRef = new Date(refDateStr);
          const now = new Date();
          if (fPeriode === "THIS_MONTH") {
            if (dRef.getFullYear() !== now.getFullYear() || dRef.getMonth() !== now.getMonth()) return false;
          } else if (fPeriode === "LAST_MONTH") {
            const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            const lastMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
            if (dRef.getFullYear() !== lastMonthYear || dRef.getMonth() !== lastMonthIdx) return false;
          } else if (fPeriode === "THIS_YEAR") {
            if (dRef.getFullYear() !== now.getFullYear() && dRef.getFullYear() !== 2026) return false;
          }
        }

        // Pencarian Cepat
        if (query) {
          const matchKlien = (p.pemberi_tugas_nama || "").toLowerCase().includes(query);
          const matchDebitur = (p.debitur_nama || "").toLowerCase().includes(query);
          const matchNo = (p.nomor_lp || p.nomor_spk || p.nomor_adm || p.id || "").toLowerCase().includes(query);
          const matchPic = [p.penilai_nama, p.reviewer_nama, p.pic_marketing, p.marketing_nama].some(s => (s || '').toLowerCase().includes(query));
          const matchWil = (p.kantor_wilayah || "").toLowerCase().includes(query);
          if (!matchKlien && !matchDebitur && !matchNo && !matchPic && !matchWil) return false;
        }

        return true;
      });

      let countAktif = 0;
      let countNear = 0;
      let countOverdue = 0;
      let countSelesai = 0;

      baseForMetrics.forEach(p => {
        const isSelesai = isProjectSelesai(p);
        if (isSelesai) {
          countSelesai++;
        } else {
          countAktif++;
          const ev = evaluasiDeadlinePenugasan(p, todayWIB);
          if (ev.kategori === 'DEADLINE_NEAR') countNear++;
          else if (ev.kategori === 'OVERDUE') countOverdue++;
        }
      });

      const elValAktif = document.getElementById('metric-val-aktif');
      const elValNear = document.getElementById('metric-val-near');
      const elValOverdue = document.getElementById('metric-val-overdue');
      const elValSelesai = document.getElementById('metric-val-selesai');
      if (elValAktif) elValAktif.textContent = countAktif;
      if (elValNear) elValNear.textContent = countNear;
      if (elValOverdue) elValOverdue.textContent = countOverdue;
      if (elValSelesai) elValSelesai.textContent = countSelesai;

      // Update highlight kartu aktif
      perbaruiTampilanKartuAktif(fStatus);

      // Tampilkan/sembunyikan tombol Reset Filter
      const btnReset = document.getElementById('btn-reset-filter');
      if (btnReset) {
        const isAnyFilterActive = (fStatus !== 'ALL') || (!isCabangUser && fWil !== 'ALL') || (fPic !== 'ALL') || (fPeriode !== 'ALL') || Boolean(query);
        if (isAnyFilterActive) btnReset.classList.remove('hidden');
        else btnReset.classList.add('hidden');
      }

      // Update badge antrean count
      const waitingCount = baseForMetrics.filter(p => p.status === "WAITING_APPROVAL" || p.status === "WAITING_BRANCH_ADMIN").length;
      const badgeCount = document.getElementById('badge-antrean-count');
      if (badgeCount) {
        if (isCabangUser) {
          badgeCount.classList.add('hidden');
        } else if (waitingCount > 0) {
          badgeCount.textContent = waitingCount;
          badgeCount.classList.remove('hidden');
        } else {
          badgeCount.classList.add('hidden');
        }
      }

      // Counter Terakhir
      const badgeCounter = document.getElementById('counter-val-badge');
      if (badgeCounter) {
        if (isCabangUser) {
          badgeCounter.textContent = combined.length;
        } else {
          badgeCounter.textContent = serverCounter.LAST_NO_ADM_JO || 415;
        }
      }

      // 6. SARING TABEL BERDASARKAN STATUS
      let list = baseForMetrics.filter(p => {
        const isSelesai = isProjectSelesai(p);
        const ev = evaluasiDeadlinePenugasan(p, todayWIB);

        if (fStatus === "AKTIF") {
          if (isSelesai) return false;
        } else if (fStatus === "DEADLINE_NEAR") {
          if (isSelesai || ev.kategori !== "DEADLINE_NEAR") return false;
        } else if (fStatus === "OVERDUE") {
          if (isSelesai || ev.kategori !== "OVERDUE") return false;
        } else if (fStatus === "SELESAI") {
          if (!isSelesai) return false;
        } else if (fStatus === "WAITING_APPROVAL") {
          if (p.status !== "WAITING_APPROVAL" && p.status !== "WAITING_BRANCH_ADMIN") return false;
        } else if (fStatus === "APPROVED") {
          if (p.status !== "APPROVED" || isSelesai) return false;
        }

        return true;
      });

      // 7. EMPTY STATE JIKA TIDAK ADA DATA
      if (list.length === 0) {
        if (auth && auth.isCabang) {
          tbody.innerHTML = \`
            <tr>
              <td colspan="9" class="text-center py-12 text-slate-400 bg-slate-800/20">
                <div class="flex flex-col items-center justify-center gap-2">
                  <span class="text-3xl">📋</span>
                  <p class="font-semibold text-slate-300">Belum Ada Riwayat Penugasan untuk \${escapeHtml(auth.wilayahLabel || 'Kantor Cabang')}</p>
                  <p class="text-xs text-slate-500">Seluruh penerbitan SPK &amp; JO mandiri cabang akan tercatat secara otomatis di sini.</p>
                </div>
              </td>
            </tr>
          \`;
        } else {
          tbody.innerHTML = \`
            <tr>
              <td colspan="9" class="py-12 text-center text-slate-400 bg-slate-800/10">
                <div class="flex flex-col items-center justify-center gap-2">
                  <span class="text-2xl">🔍</span>
                  <p class="font-semibold text-slate-300">Tidak ada penugasan yang sesuai kriteria filter.</p>
                  <p class="text-xs text-slate-500">Coba ubah status, pilihan PIC, atau klik tombol Reset Filter.</p>
                  <button type="button" onclick="resetSemuaFilterMonitoring()" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700">
                    Reset Semua Filter
                  </button>
                </div>
              </td>
            </tr>\`;
        }
        return;
      }

      // 8. RENDER 9 KOLOM RESMI (DASHBOARD BACA-SAJA & MONITORING DEADLINE)
      // Sesuai Poin 1: Aksi Selesai / Buka dinonaktifkan sementara agar monitoring tetap berfungsi murni baca-saja
      tbody.innerHTML = list.map(p => {
        const isApproved = (p.status === "APPROVED");
        const isSelesai = isProjectSelesai(p);
        const ev = evaluasiDeadlinePenugasan(p, todayWIB);

        // Status Badge Pekerjaan
        let statusBadge = "";
        if (p.is_private) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
               🔒 MANDIRI CABANG
             </span>\`;
        } else if (isSelesai) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
               ✔ SELESAI
             </span>\`;
        } else if (isApproved) {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
               <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span> SPK Terbit (Aktif)
             </span>\`;
        } else {
          statusBadge = \`<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
               <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Menunggu Otorisasi
             </span>\`;
        }

        const displayFee = getMaskedFeeDisplay(p.biaya_total, userSession.role);
        const isFeeMasked = (userSession.role === 'REVIEWER' || userSession.role === 'PENILAI' || userSession.role === 'MARKETING');

        // Target Tenggat Display
        const targetStr = getProjectTargetDate(p);
        const targetFormatted = targetStr ? formatTanggalIndo(targetStr) : 'Belum ditentukan';
        const slaTotalText = p.sla_total ? \`\${p.sla_total} Hari Kerja\` : '-';

        // Objek Display
        const objekText = p.objek_list && p.objek_list[0] ? (p.objek_list[0].jenis || p.objek_list[0].debitur || 'Objek Properti') : '-';

        return \`
          <tr class="hover:bg-slate-800/40 transition">
            <!-- 1. No. Pengajuan / ID -->
            <td class="py-3 px-3.5 font-mono font-bold text-slate-300 text-xs">
              <span class="block">\${escapeHtml(p.id)}</span>
              \${p.is_private ? \`<span class="block text-[9.5px] text-emerald-400 font-semibold">Zero-Cloud Lokal</span>\` : ''}
            </td>

            <!-- 2. Kantor Wilayah & Tanggal Surat -->
            <td class="py-3 px-3.5 text-xs">
              <span class="block font-bold text-white leading-tight">\${escapeHtml(p.kantor_wilayah || 'Kantor Pusat Jakarta')}</span>
              <span class="text-slate-400 text-[10px] font-mono block pt-0.5">\${formatTanggalIndo(p.tanggal_surat)}</span>
            </td>

            <!-- 3. Pemberi Tugas & Debitur -->
            <td class="py-3 px-3.5 text-xs">
              <span class="block font-extrabold text-amber-300 line-clamp-1 leading-snug">\${escapeHtml(p.debitur_nama || '-')}</span>
              <span class="block text-[10.5px] text-slate-300 line-clamp-1 pt-0.5">\${escapeHtml(p.pemberi_tugas_nama || '-')}</span>
            </td>

            <!-- 4. Objek & Nilai Kontrak -->
            <td class="py-3 px-3.5 text-xs">
              <span class="block font-semibold text-slate-200 line-clamp-1">\${escapeHtml(objekText)}</span>
              <span class="block font-mono text-[11px] pt-0.5 \${isFeeMasked ? 'text-amber-300 font-semibold italic' : 'text-emerald-400 font-bold'}">\${displayFee}</span>
            </td>

            <!-- 5. PIC & Tim Penilai -->
            <td class="py-3 px-3.5 text-[11px]">
              <div class="space-y-0.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono uppercase font-bold shrink-0">Penilai</span>
                  <span class="text-slate-200 font-medium truncate max-w-[120px]">\${escapeHtml(p.penilai_nama || '-')}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono uppercase font-bold shrink-0">Review</span>
                  <span class="text-slate-300 truncate max-w-[120px]">\${escapeHtml(p.reviewer_nama || '-')}</span>
                </div>
                \${p.pic_marketing ? \`
                  <div class="flex items-center gap-1.5 text-slate-400">
                    <span class="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-500 font-mono uppercase font-bold shrink-0">Mktg</span>
                    <span class="truncate max-w-[120px]">\${escapeHtml(p.pic_marketing)}</span>
                  </div>
                \` : ''}
              </div>
            </td>

            <!-- 6. Target Penyelesaian (SLA) & Deadline Badge -->
            <td class="py-3 px-3.5 text-xs">
              <div class="space-y-1">
                <span class="block font-semibold \${targetStr ? 'text-slate-200' : 'text-slate-500 italic'}">\${targetFormatted}</span>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] \${ev.badgeClass}">
                    <span>\${ev.icon}</span>
                    <span>\${ev.label}</span>
                  </span>
                  \${p.sla_total ? \`<span class="text-[9.5px] text-slate-400 font-mono">(\${slaTotalText})</span>\` : ''}
                </div>
              </div>
            </td>

            <!-- 7. Nomor Resmi (SPK & JO) -->
            <td class="py-3 px-3.5 font-mono text-[11px]">
              <span class="block font-bold \${isApproved ? 'text-sky-300' : 'text-slate-500'} truncate max-w-[140px]">\${escapeHtml(p.nomor_lp)}</span>
              <span class="block text-[10px] \${isApproved ? 'text-amber-400' : 'text-slate-600'} truncate max-w-[140px]">\${escapeHtml(p.nomor_adm)}</span>
            </td>

            <!-- 8. Status Pekerjaan -->
            <td class="py-3 px-3.5 text-center">
              \${statusBadge}
            </td>

            <!-- 9. Aksi Resmi (Approval Pusat & Pratinjau Dokumen Cetak) -->
            <td class="py-3 px-3.5 text-right">
              <div class="inline-flex items-center gap-1.5 flex-wrap justify-end">
                
                <!-- Tombol Approve untuk Admin Pusat -->
                \${!isApproved && !p.is_private && (userSession.isSuperAdmin || userSession.role === "ADMIN_PUSAT" || userSession.role === "SUPER_ADMIN" || userSession.role === "SUPER ADMIN") ? \`
                  <button type="button" onclick="approveProyekPusat('\${p.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] transition shadow cursor-pointer" title="Approve &amp; Terbitkan Nomor Resmi">
                    Approve
                  </button>
                \` : ''}

                <!-- Cetak 9 Dokumen Resmi -->
                \${isApproved && p.metode_pengesahan === 'SCAN_BASAH' && p.berkas_scan_pdf ? \`
                  <a href="\${p.berkas_scan_pdf.file_url}" target="_blank" download="\${p.berkas_scan_pdf.nama_file}" class="px-2 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10.5px] transition shadow flex items-center gap-1" title="Unduh Berkas Scan Basah PDF">
                    Unduh Scan
                  </a>
                \` : \`
                  <button type="button" onclick="bukaPratinjauProyek('\${p.id}')" class="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10.5px] transition shadow cursor-pointer" title="Buka &amp; Cetak 9 Dokumen A4">
                    \${isApproved ? 'Pratinjau' : 'Cetak 9 Dok'}
                  </button>
                \`}

                <!-- Hapus Proyek (Otorisasi) -->
                \${(!isCabangUser && (auth.isSuperAdmin || userSession.role === 'ADMIN_PUSAT' || userSession.role === 'SUPER_ADMIN' || userSession.role === 'SUPER ADMIN')) || (isCabangUser && (p.is_private || (p.kantor_wilayah || '').toLowerCase().includes(namaCabangSesi))) ? \`
                  <button type="button" onclick="hapusProyek('\${p.id}')" class="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition cursor-pointer" title="Hapus">
                    <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                \` : ''}
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }
\n    `;

content = content.substring(0, preComment) + newModuleCode + content.substring(printEngineIdx);
fs.writeFileSync(filePath, content, 'utf-8');
console.log('✔ portal-penugasan-jo.html berhasil di-harden.');
