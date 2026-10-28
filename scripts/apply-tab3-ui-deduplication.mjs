import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'portal-penugasan-jo.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. UPDATE HTML MARKUP: Ganti dua tombol menjadi 1 status badge read-only + 1 tombol tindakan
const oldToolbarMarkupRegex = /<button type="button"\s+id="btn-approval-toolbar-tab3"[\s\S]*?<\/button>\s*<button type="button"\s+id="btn-tab3-otorisasi"[\s\S]*?<\/button>/;

const newToolbarMarkup = `<!-- Indikator Status Otorisasi (Read-Only Badge, BUKAN Tombol) -->
          <div id="btn-tab3-otorisasi" 
               data-testid="indikator-status-otorisasi-tab3"
               class="hidden items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold select-none cursor-default border transition-all"
               role="status"
               aria-live="polite">
            <span id="label-tab3-otorisasi" class="tracking-wide">Belum Diotorisasi</span>
          </div>
          <!-- Satu Tombol Tindakan Pengesahan (Lihat Detail Pengesahan / Otorisasi) -->
          <button type="button" 
                  id="btn-approval-toolbar-tab3" 
                  onclick="bukaModalApprovalDariTab3()" 
                  class="hidden items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer">
            <span class="text-base">⚖️</span>
            <span id="label-btn-approval-tab3">Otorisasi Penugasan</span>
          </button>`;

if (!oldToolbarMarkupRegex.test(content)) {
  console.error('ERROR: oldToolbarMarkupRegex tidak cocok dengan markup toolbar eksisting!');
  process.exit(1);
}

content = content.replace(oldToolbarMarkupRegex, newToolbarMarkup);
console.log('✅ Berhasil memperbarui markup toolbar Tab 3.');

// 2. UPDATE LOGIKA PERBARUIINDIKATORTAB3
const oldLogicStart = "const btnApprovalTab3 = document.getElementById('btn-approval-toolbar-tab3');";
const oldLogicEnd = "function gantiTab(tabIdx)";

const startIdx = content.indexOf(oldLogicStart);
const endIdx = content.indexOf(oldLogicEnd, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('ERROR: Indeks logika perbaruiIndikatorTab3 tidak ditemukan!');
  process.exit(1);
}

const newLogicCode = `const btnApprovalTab3 = document.getElementById('btn-approval-toolbar-tab3');
      const labelBtnApproval = document.getElementById('label-btn-approval-tab3');
      const indikatorStatusTab3 = document.getElementById('btn-tab3-otorisasi');
      const labelStatusTab3 = document.getElementById('label-tab3-otorisasi');
      const btnTab3WaEl = document.getElementById('btn-tab3-notif-wa');

      if (!proyekAktif) {
        if (btnApprovalTab3) {
          btnApprovalTab3.classList.add('hidden');
          btnApprovalTab3.style.setProperty('display', 'none', 'important');
        }
        if (indikatorStatusTab3) {
          indikatorStatusTab3.classList.add('hidden');
          indikatorStatusTab3.style.setProperty('display', 'none', 'important');
        }
        if (btnTab3WaEl) {
          btnTab3WaEl.classList.add('hidden');
          btnTab3WaEl.style.setProperty('display', 'none', 'important');
        }
        return;
      }

      // 1. TENTUKAN KONDISI DOKUMEN RESMI BERDASARKAN STATUS BACKEND
      const rawStatus = String(proyekAktif.status_approval || proyekAktif.status || '').toUpperCase();
      const alurMode = String(proyekAktif.alur || proyekAktif.mode_alur || proyekAktif.mode_pengaju || currentModeAlur || '').toUpperCase();
      const isCabangAlur = alurMode === 'MANDIRI' || alurMode === 'PRIVATE_CABANG' || rawStatus.includes('CABANG');

      let condition = 'DRAFT';
      let statusLabel = 'Belum Diotorisasi';
      let iconStatus = '📝 ';
      let badgeClass = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 select-none cursor-default shadow-sm';

      const isApprovedBackend = Boolean(
        rawStatus === 'APPROVED' || 
        rawStatus === 'APPROVED_CABANG' || 
        rawStatus === 'APPROVED_PUSAT' || 
        rawStatus === 'TERBIT' || 
        rawStatus === 'DISETUJUI' ||
        (proyekAktif.pejabat_pengesah && proyekAktif.pejabat_pengesah.nomor_izin_penilai)
      );

      if (rawStatus === 'APPROVED_CABANG' || (isCabangAlur && isApprovedBackend && rawStatus !== 'APPROVED_PUSAT')) {
        condition = 'APPROVED_CABANG';
        statusLabel = 'Diotorisasi Pimpinan Cabang';
        iconStatus = '✅ ';
        badgeClass = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 select-none cursor-default shadow-sm';
      } else if (rawStatus === 'APPROVED_PUSAT' || (!isCabangAlur && isApprovedBackend)) {
        condition = 'APPROVED_PUSAT';
        statusLabel = 'Diotorisasi melalui Pusat';
        iconStatus = '✅ ';
        badgeClass = 'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 select-none cursor-default shadow-sm';
      } else if (rawStatus === 'WAITING_APPROVAL' || rawStatus === 'MENUNGGU' || rawStatus === 'MENUNGGU_VERIFIKASI_ADMIN' || rawStatus.includes('WAITING') || rawStatus.includes('MENUNGGU')) {
        condition = 'WAITING_APPROVAL';
        statusLabel = 'Menunggu Persetujuan';
        iconStatus = '⏳ ';
        badgeClass = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/40 select-none cursor-default shadow-sm';
      } else {
        condition = 'DRAFT';
        statusLabel = 'Belum Diotorisasi';
        iconStatus = '📝 ';
        badgeClass = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 select-none cursor-default shadow-sm';
      }

      // 2. PERBARUI INDIKATOR STATUS READ-ONLY (BUKAN TOMBOL)
      if (indikatorStatusTab3) {
        indikatorStatusTab3.classList.remove('hidden');
        indikatorStatusTab3.style.display = 'inline-flex';
        indikatorStatusTab3.className = badgeClass;
        indikatorStatusTab3.setAttribute('data-condition', condition);
        indikatorStatusTab3.setAttribute('title', 'Status Resmi Dokumen: ' + statusLabel);
        if (labelStatusTab3) {
          labelStatusTab3.textContent = iconStatus + statusLabel;
        }
      }

      // 3. SATU TOMBOL TINDAKAN (RBAC: HANYA PRIVILEGED / PEJABAT BERWENANG)
      // Marketing, Surveyor, Penilai Beregister TIDAK memperoleh tombol administrasi
      const userRole = String(auth && auth.role || '').toUpperCase();
      const isRestrictedRole = (
        userRole === 'MARKETING' || 
        userRole === 'SURVEYOR' || 
        userRole === 'PENILAI' || 
        userRole === 'PENILAI_BEREGISTER'
      );

      if (!isPrivileged || isRestrictedRole || (isCabang && condition !== 'APPROVED_CABANG')) {
        if (btnApprovalTab3) {
          btnApprovalTab3.classList.add('hidden');
          btnApprovalTab3.style.setProperty('display', 'none', 'important');
        }
        if (btnTab3WaEl) {
          btnTab3WaEl.classList.add('hidden');
          btnTab3WaEl.style.setProperty('display', 'none', 'important');
        }
      } else {
        // SUPER ADMIN / KING / ADMIN PUSAT:
        if (btnApprovalTab3) {
          btnApprovalTab3.classList.remove('hidden');
          btnApprovalTab3.style.display = 'inline-flex';

          if (condition === 'APPROVED_CABANG' || condition === 'APPROVED_PUSAT') {
            btnApprovalTab3.className = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 transition-all cursor-pointer shadow-sm';
            if (labelBtnApproval) labelBtnApproval.textContent = '🔍 Lihat Detail Pengesahan';
          } else if (condition === 'WAITING_APPROVAL') {
            btnApprovalTab3.className = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 animate-pulse transition-all cursor-pointer';
            if (labelBtnApproval) labelBtnApproval.textContent = '⚖️ Otorisasi Penugasan';
          } else {
            // DRAFT
            btnApprovalTab3.className = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer';
            if (labelBtnApproval) labelBtnApproval.textContent = '⚖️ Otorisasi Penugasan';
          }
        }

        if (btnTab3WaEl) {
          if ((condition === 'APPROVED_CABANG' || condition === 'APPROVED_PUSAT') && isPrivileged) {
            btnTab3WaEl.classList.remove('hidden');
            btnTab3WaEl.style.display = 'inline-flex';
          } else {
            btnTab3WaEl.classList.add('hidden');
            btnTab3WaEl.style.display = 'none';
          }
        }
      }
    }

    `;

content = content.slice(0, startIdx) + newLogicCode + content.slice(endIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Berhasil memperbarui perbaruiIndikatorTab3 di portal-penugasan-jo.html.');
