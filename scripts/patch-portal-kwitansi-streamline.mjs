import fs from 'node:fs';

let html = fs.readFileSync('portal-kwitansi.html', 'utf8');

// 1. Update Submit Buttons on Panel 1 (lines ~488-508)
// Make btn-submit-pengajuan always visible, and btn-terbit-resmi-cabang secondary
const oldButtonsHtml = `          <!-- TOMBOL DUAL MODE PENERBITAN KWITANSI -->
          <div class="pt-2 space-y-2.5">
            <!-- Mode Cabang: Kwitansi Resmi Kasir Cabang (Otorisasi PIN Finance) -->
            <button type="button" onclick="bukaModalPinFinanceCabang()" id="btn-terbit-resmi-cabang" class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>
              <span>🏛️ Sahkan Kuitansi Cabang (PIN Otorisasi)</span>
            </button>

            <!-- Mode Cabang: Draf Tagihan DP / Proforma (Marketing, Tanpa PIN) -->
            <button type="button" onclick="terbitkanDrafMarketing()" id="btn-terbit-draf-dp" class="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs tracking-wide border border-amber-400/40 shadow transition flex items-center justify-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-amber-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>⚡ Terbitkan Draf Tagihan DP / Proforma (Tanpa PIN)</span>
            </button>

            <!-- Mode Pusat: Ajukan Permohonan ke Pusat (Tanpa Popup PIN Finance Cabang) -->
            <button type="submit" id="btn-submit-pengajuan" class="hidden w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition flex items-center justify-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span>📤 Ajukan Permohonan ke Pusat</span>
            </button>
          </div>`;

const newButtonsHtml = `          <!-- TOMBOL PENGAJUAN / PENERBITAN KWITANSI -->
          <div class="pt-2 space-y-2.5">
            <!-- Tombol Utama: Ajukan Permohonan Kwitansi ke Keuangan Pusat (Aktif untuk Mode Cabang & Mode Pusat) -->
            <button type="submit" id="btn-submit-pengajuan" class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition flex items-center justify-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span id="label-teks-submit-pengajuan">📤 Ajukan Permohonan Kwitansi ke Keuangan Pusat</span>
            </button>

            <!-- Mode Cabang Opsional: Draf Tagihan DP / Proforma (Marketing, Tanpa PIN) -->
            <button type="button" onclick="terbitkanDrafMarketing()" id="btn-terbit-draf-dp" class="w-full py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs tracking-wide border border-amber-400/40 shadow transition flex items-center justify-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 text-amber-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>⚡ Terbitkan Draf Tagihan DP / Proforma (Pra-Penagihan Cabang)</span>
            </button>

            <!-- Opsional: Kasbon Mandiri Internal Cabang (Otorisasi PIN Finance) -->
            <button type="button" onclick="bukaModalPinFinanceCabang()" id="btn-terbit-resmi-cabang" class="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 font-medium text-[11px] border border-slate-800 transition flex items-center justify-center gap-2 cursor-pointer">
              <svg class="w-3.5 h-3.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>🔒 Kuitansi Kas Operasional Internal Cabang (PIN Mandiri)</span>
            </button>
          </div>`;

if (html.includes(oldButtonsHtml)) {
  html = html.replace(oldButtonsHtml, newButtonsHtml);
  console.log('✓ Replaced panel 1 action buttons');
} else {
  console.log('⚠️ Could not find exact oldButtonsHtml block, checking normalized CRLF');
  const normalizedHtml = html.replace(/\r\n/g, '\n');
  const normalizedOld = oldButtonsHtml.replace(/\r\n/g, '\n');
  if (normalizedHtml.includes(normalizedOld)) {
    html = normalizedHtml.replace(normalizedOld, newButtonsHtml);
    console.log('✓ Replaced panel 1 action buttons (normalized CRLF)');
  }
}

// 2. Update pilihModePenerbitan
const oldPilihMode = `        // Mode Cabang: Aktifkan tombol Sahkan Cabang (PIN) & Draf DP, sembunyikan kirim ke pusat
        if (btnTerbitResmiCabang) btnTerbitResmiCabang.classList.remove('hidden');
        if (btnTerbitDrafDp) btnTerbitDrafDp.classList.remove('hidden');
        if (btnSubmitPengajuan) btnSubmitPengajuan.classList.add('hidden');`;

const newPilihMode = `        // Mode Cabang: Sesuai instruksi, fungsi utama adalah mengajukan nomor kwitansi ke Keuangan Pusat
        if (btnSubmitPengajuan) {
          btnSubmitPengajuan.classList.remove('hidden');
          btnSubmitPengajuan.removeAttribute('style');
          const lbl = document.getElementById('label-teks-submit-pengajuan');
          if (lbl) lbl.innerText = '📤 Ajukan Permohonan Kwitansi Cabang ke Keuangan Pusat';
        }
        if (btnTerbitDrafDp) btnTerbitDrafDp.classList.remove('hidden');
        if (btnTerbitResmiCabang) btnTerbitResmiCabang.classList.remove('hidden');`;

html = html.replace(oldPilihMode, newPilihMode);

// Mode pusat label update in pilihModePenerbitan
const oldPusatBtn = `        // Mode Pusat: Hilangkan popup & tombol PIN Finance Cabang, tampilkan tombol Ajukan ke Pusat
        if (btnTerbitResmiCabang) btnTerbitResmiCabang.classList.add('hidden');
        if (btnTerbitDrafDp) btnTerbitDrafDp.classList.add('hidden');
        if (btnSubmitPengajuan) {
          btnSubmitPengajuan.classList.remove('hidden');
          btnSubmitPengajuan.removeAttribute('style');
        }`;

const newPusatBtn = `        // Mode Pusat: Ajukan Permohonan Kwitansi Rekan ke Keuangan Pusat
        if (btnSubmitPengajuan) {
          btnSubmitPengajuan.classList.remove('hidden');
          btnSubmitPengajuan.removeAttribute('style');
          const lbl = document.getElementById('label-teks-submit-pengajuan');
          if (lbl) lbl.innerText = '📤 Ajukan Permohonan Kwitansi Rekan ke Keuangan Pusat';
        }
        if (btnTerbitResmiCabang) btnTerbitResmiCabang.classList.add('hidden');
        if (btnTerbitDrafDp) btnTerbitDrafDp.classList.remove('hidden');`;

html = html.replace(oldPusatBtn, newPusatBtn);

// 3. Update AUTH_HASH_REGISTRY for Keuangan Pusat to have canApprove: true, canApprovePusat: true
html = html.replace(
  `"role":"KEUANGAN","roleLabel":"Keuangan Pusat","displayRole":"Divisi Keuangan & Kasir Pusat","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","cabang":"Pusat","label":"Kantor Pusat Jakarta (Keuangan Pusat)","jabatan":"Divisi Keuangan & Kasir Pusat","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canSubmit":true,"canInputForm":true`,
  `"role":"KEUANGAN","roleLabel":"Keuangan Pusat","displayRole":"Divisi Keuangan & Kasir Pusat","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","cabang":"Pusat","label":"Kantor Pusat Jakarta (Keuangan Pusat)","jabatan":"Divisi Keuangan & Kasir Pusat","isCabang":false,"isSuperAdmin":false,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canSubmit":true,"canInputForm":true`
);

html = html.replace(
  `"role":"KEUANGAN","roleLabel":"Keuangan Pusat (Milda H)","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahCode":"PST","cabang":"Pusat","isCabang":false,"isSuperAdmin":false,"canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canSubmit":true,"canInputForm":true`,
  `"role":"KEUANGAN","roleLabel":"Keuangan Pusat (Milda H)","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahCode":"PST","cabang":"Pusat","isCabang":false,"isSuperAdmin":false,"canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canSubmit":true,"canInputForm":true`
);

// 4. Update periksaSesiKwitansi and masukSesiKwitansi logic
const oldPeriksaSimUser = `              const isPusatKeuangan = Boolean(auth.isSuperAdmin) || auth.role === 'ADMIN_PUSAT' || auth.role === 'SUPER ADMIN' || auth.role === 'SUPER_ADMIN' || auth.role === 'KEUANGAN';
              const simUser = {
                sub: isPusatKeuangan ? 'admin_pusat' : \`admin_\${auth.wilayahCode.toLowerCase()}\`,
                role: isPusatKeuangan ? 'KEUANGAN' : 'CABANG',
                branch: isPusatKeuangan ? 'PUSAT' : auth.wilayahCode,
                displayName: auth.wilayahLabel || auth.wilayah,
                token: auth.token || auth.tokenHash,
                tokenHash: auth.tokenHash,
                isCabang: !isPusatKeuangan,
                isSuperAdmin: Boolean(auth.isSuperAdmin)
              };`;

const newPeriksaSimUser = `              const isPusatKeuangan = Boolean(auth.isSuperAdmin) || auth.role === 'ADMIN_PUSAT' || auth.role === 'SUPER ADMIN' || auth.role === 'SUPER_ADMIN' || auth.role === 'KEUANGAN' || auth.wilayahCode === 'PST' || auth.wilayah === 'PUSAT' || auth.mode === 'PUSAT';
              const simUser = {
                sub: isPusatKeuangan ? 'admin_pusat' : \`admin_\${(auth.wilayahCode || 'cab').toLowerCase()}\`,
                role: isPusatKeuangan ? 'KEUANGAN' : 'CABANG',
                branch: isPusatKeuangan ? 'PUSAT' : (auth.wilayahCode || auth.wilayah),
                displayName: isPusatKeuangan ? (auth.roleLabel || 'Keuangan Kantor Pusat') : (auth.wilayahLabel || auth.wilayah),
                token: auth.token || auth.tokenHash,
                tokenHash: auth.tokenHash,
                isCabang: !isPusatKeuangan,
                isSuperAdmin: Boolean(auth.isSuperAdmin),
                canApprove: isPusatKeuangan
              };`;

html = html.replace(oldPeriksaSimUser, newPeriksaSimUser);

const oldMasukSimUser = `          const isPusatKeuangan = Boolean(auth.isSuperAdmin) || auth.role === 'ADMIN_PUSAT' || auth.role === 'SUPER ADMIN' || auth.role === 'SUPER_ADMIN' || auth.role === 'KEUANGAN';
          const simUser = {
            sub: isPusatKeuangan ? 'admin_pusat' : \`admin_\${auth.wilayahCode.toLowerCase()}\`,
            role: isPusatKeuangan ? 'KEUANGAN' : 'CABANG',
            branch: isPusatKeuangan ? 'PUSAT' : auth.wilayahCode,
            displayName: auth.wilayahLabel || auth.wilayah,
            token: auth.token,
            isCabang: !isPusatKeuangan,
            isSuperAdmin: Boolean(auth.isSuperAdmin)
          };
          sessionStorage.setItem('NSR_AUTH_TOKEN', auth.token);
          sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
            branch: auth.wilayah,
            token: auth.token,
            role: auth.role,
            roleLabel: auth.roleLabel,
            canAccessKwitansi: true,
            expiresAt: Date.now() + (8 * 3600 * 1000)
          }));
          terapkanSesiPengguna(simUser);`;

const newMasukSimUser = `          const isPusatKeuangan = Boolean(auth.isSuperAdmin) || auth.role === 'ADMIN_PUSAT' || auth.role === 'SUPER ADMIN' || auth.role === 'SUPER_ADMIN' || auth.role === 'KEUANGAN' || auth.wilayahCode === 'PST' || auth.wilayah === 'PUSAT' || auth.mode === 'PUSAT';
          const simUser = {
            sub: isPusatKeuangan ? 'admin_pusat' : \`admin_\${(auth.wilayahCode || 'cab').toLowerCase()}\`,
            role: isPusatKeuangan ? 'KEUANGAN' : 'CABANG',
            branch: isPusatKeuangan ? 'PUSAT' : (auth.wilayahCode || auth.wilayah),
            displayName: isPusatKeuangan ? (auth.roleLabel || 'Keuangan Kantor Pusat') : (auth.wilayahLabel || auth.wilayah),
            token: auth.token || auth.tokenHash,
            tokenHash: auth.tokenHash,
            isCabang: !isPusatKeuangan,
            isSuperAdmin: Boolean(auth.isSuperAdmin),
            canApprove: isPusatKeuangan
          };
          sessionStorage.setItem('NSR_AUTH_TOKEN', simUser.tokenHash);
          sessionStorage.setItem('TOKEN_AUTH_NSR', simUser.tokenHash);
          sessionStorage.setItem('CURRENT_AUTH_TOKEN', simUser.tokenHash);
          sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(simUser));
          sessionStorage.setItem('kjpp_token_internal', JSON.stringify({
            branch: simUser.branch,
            token: simUser.tokenHash,
            role: simUser.role,
            roleLabel: simUser.displayName,
            canAccessKwitansi: true,
            expiresAt: Date.now() + (8 * 3600 * 1000)
          }));
          terapkanSesiPengguna(simUser);`;

html = html.replace(oldMasukSimUser, newMasukSimUser);

// 5. Update terapkanSesiPengguna
const oldTerapkanRoles = `      const isCabang = user.role === 'CABANG' || Boolean(user.isCabang);
      const isKeuangan = user.role === 'KEUANGAN' || user.role === 'ADMIN_PUSAT' || user.role === 'ADMIN' || Boolean(user.isSuperAdmin);`;

const newTerapkanRoles = `      const isCabang = user.role === 'CABANG' || user.role === 'ADMIN_CABANG' || (Boolean(user.isCabang) && user.branch !== 'PUSAT');
      const isKeuangan = !isCabang && (user.role === 'KEUANGAN' || user.role === 'ADMIN_PUSAT' || user.role === 'ADMIN' || user.role === 'SUPER ADMIN' || user.role === 'SUPER_ADMIN' || user.branch === 'PUSAT' || Boolean(user.isSuperAdmin));`;

html = html.replace(oldTerapkanRoles, newTerapkanRoles);

// Update badge in terapkanSesiPengguna
const oldBadges = `      if (labelBadge) {
        labelBadge.innerText = \`Akses: \${user.displayName || user.sub} (\${user.role})\`;
      }

      const labelVerified = document.getElementById('label-cabang-terverifikasi');
      if (labelVerified) {
        labelVerified.innerText = isCabang ? \`Cabang \${user.branch}\` : \`\${user.displayName || user.sub} (\${user.role})\`;
      }`;

const newBadges = `      if (labelBadge) {
        labelBadge.innerText = isKeuangan
          ? \`Akses: \${user.displayName || 'Kantor Pusat Jakarta'} (KEUANGAN PUSAT)\`
          : \`Akses: \${user.displayName || user.sub} (CABANG)\`;
      }

      const labelVerified = document.getElementById('label-cabang-terverifikasi');
      if (labelVerified) {
        labelVerified.innerText = isKeuangan
          ? \`Keuangan Pusat (\${user.displayName || 'Milda H'})\`
          : \`Cabang \${user.branch || user.displayName}\`;
      }`;

html = html.replace(oldBadges, newBadges);

// 6. Update gantiTab logic
const oldGantiTabIsKeuangan = `      const isKeuangan = currentUser && (currentUser.role === 'KEUANGAN' || currentUser.role === 'ADMIN_PUSAT' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER ADMIN' || currentUser.role === 'PEMIMPIN_REKAN' || Boolean(currentUser.isSuperAdmin));`;

const newGantiTabIsKeuangan = `      const isCabang = currentUser && (currentUser.role === 'CABANG' || currentUser.role === 'ADMIN_CABANG' || (Boolean(currentUser.isCabang) && currentUser.branch !== 'PUSAT'));
      const isKeuangan = currentUser && !isCabang && (currentUser.role === 'KEUANGAN' || currentUser.role === 'ADMIN_PUSAT' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.branch === 'PUSAT' || Boolean(currentUser.isSuperAdmin));`;

html = html.replace(oldGantiTabIsKeuangan, newGantiTabIsKeuangan);

// 7. Normalize incoming data in muatDaftarKwitansi
const oldDataMap = `            daftarKwitansiGlobal = json.data.map(item => ({
              ...item,
              idKwitansi: item.idKwitansi || item.idDraft,
              idDraft: item.idDraft || item.idKwitansi
            }));`;

const newDataMap = `            daftarKwitansiGlobal = json.data.map(item => ({
              ...item,
              idKwitansi: item.idKwitansi || item.idDraft || item.noPermohonan || 'KW-DRAFT',
              idDraft: item.idDraft || item.idKwitansi,
              cabang: item.cabang || item.kantorCabang || item.branch || 'Pusat',
              klien: item.klien || item.sudahDiterimaDari || item.namaKlien || '-',
              totalBayar: item.totalBayar || item.sejumlahUang || item.nominal || 0,
              keterangan: item.keterangan || item.untukPembayaran || '-',
              banyaknya: item.banyaknya || item.peruntukan || item.untukPembayaran || 'Termin / Pelunasan',
              noSpk: item.noSpk || item.noPermohonan || '-'
            }));`;

html = html.replace(oldDataMap, newDataMap);

// 8. Auto-suggest next sequential receipt number in pilihDrafUntukVerifikasi
const oldPilihVerifikasiNo = `      if (document.getElementById('no-kwitansi-resmi') && item.noKwitansiResmi && item.status === 'DISAHKAN') {
        document.getElementById('no-kwitansi-resmi').value = item.noKwitansiResmi;
      }`;

const newPilihVerifikasiNo = `      if (document.getElementById('no-kwitansi-resmi')) {
        if (item.noKwitansiResmi && item.status === 'DISAHKAN') {
          document.getElementById('no-kwitansi-resmi').value = item.noKwitansiResmi;
        } else {
          let maxKw = 0;
          (daftarKwitansiGlobal || []).forEach(k => {
            const m = (k.noKwitansiResmi || '').match(/^(\\d+)\\/KW-NSR\\//i);
            if (m) {
              const num = parseInt(m[1], 10);
              if (num > maxKw) maxKw = num;
            }
          });
          const nextNum = String(maxKw + 1).padStart(3, '0');
          const d = new Date();
          const romawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][d.getMonth()];
          document.getElementById('no-kwitansi-resmi').value = \`\${nextNum}/KW-NSR/\${romawi}/\${d.getFullYear()}\`;
        }
      }
      if (document.getElementById('tgl-kwitansi-resmi')) {
        const todayStr = new Date().toISOString().split('T')[0];
        document.getElementById('tgl-kwitansi-resmi').value = item.tglSah || todayStr;
      }`;

html = html.replace(oldPilihVerifikasiNo, newPilihVerifikasiNo);

// 9. Update approval permission check in sahkanDanKunciKwitansi
const oldApproveCheck = `      if (!currentUser || (currentUser.role !== 'KEUANGAN' && currentUser.role !== 'ADMIN_PUSAT' && currentUser.role !== 'ADMIN')) {`;
const newApproveCheck = `      const isKeuanganAuth = currentUser && (currentUser.role === 'KEUANGAN' || currentUser.role === 'ADMIN_PUSAT' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER ADMIN' || currentUser.role === 'SUPER_ADMIN' || Boolean(currentUser.isSuperAdmin));
      if (!isKeuanganAuth) {`;

html = html.replace(oldApproveCheck, newApproveCheck);

// 10. Also update kembalikanDrafKwitansi and verifikasiCepatKwitansiPusat
html = html.replace(
  `      if (!currentUser || (currentUser.role !== 'KEUANGAN' && currentUser.role !== 'ADMIN_PUSAT' && currentUser.role !== 'ADMIN')) {\n        alert('Akses Ditolak: Hanya Bagian Keuangan Pusat yang berhak mengembalikan draf.');`,
  `      const isKeuanganAuth = currentUser && (currentUser.role === 'KEUANGAN' || currentUser.role === 'ADMIN_PUSAT' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER ADMIN' || currentUser.role === 'SUPER_ADMIN' || Boolean(currentUser.isSuperAdmin));\n      if (!isKeuanganAuth) {\n        alert('Akses Ditolak: Hanya Bagian Keuangan Pusat yang berhak mengembalikan draf.');`
);

html = html.replace(
  `      if (!currentUser || (currentUser.role !== 'KEUANGAN' && currentUser.role !== 'ADMIN_PUSAT' && currentUser.role !== 'ADMIN')) {\n        alert('Akses Ditolak: Hanya Bagian Keuangan Pusat yang berhak mengesahkan kwitansi resmi.');`,
  `      const isKeuanganAuth = currentUser && (currentUser.role === 'KEUANGAN' || currentUser.role === 'ADMIN_PUSAT' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER ADMIN' || currentUser.role === 'SUPER_ADMIN' || Boolean(currentUser.isSuperAdmin));\n      if (!isKeuanganAuth) {\n        alert('Akses Ditolak: Hanya Bagian Keuangan Pusat yang berhak mengesahkan kwitansi resmi.');`
);

fs.writeFileSync('portal-kwitansi.html', html, 'utf8');
console.log('✓ portal-kwitansi.html successfully updated with streamlined Cabang & Pusat workflow!');
