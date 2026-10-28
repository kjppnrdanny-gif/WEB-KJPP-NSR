import fs from 'fs';

console.log('Applying KING Full Authority, Workflow & Master Template Alignment to portal-penugasan-jo.html and nolap-data-handler.php...');

// =========================================================================
// 1. UPDATE nolap-data-handler.php
// =========================================================================
let php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// Standardize Deni in branchCompetencyMatrix to MAPPI (Cert.)
if (php.includes("'rekan_nama' => 'Deni Siswandi, S.T., MAPPI',")) {
  php = php.replace(
    "'rekan_nama' => 'Deni Siswandi, S.T., MAPPI',",
    "'rekan_nama' => 'Deni Siswandi, S.T., MAPPI (Cert.)',"
  );
  console.log('✔ Updated Deni Siswandi to MAPPI (Cert.) in nolap-data-handler.php branchCompetencyMatrix');
}

fs.writeFileSync('nolap-data-handler.php', php, 'utf8');

// =========================================================================
// 2. UPDATE portal-penugasan-jo.html
// =========================================================================
let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 2.1 Operator Identification in modal-approval-pusat
const operatorKingHtml = `
          <!-- SECTION OPERATOR KHUSUS AKUN SUPER ADMIN (KING) -->
          <div id="section-operator-king" class="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2.5 mb-3">
            <div class="flex items-center justify-between pb-1.5 border-b border-amber-500/20">
              <label class="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                <span>👑 Konfirmasi Identitas Operator Akun KING</span>
              </label>
              <span class="text-[9.5px] text-amber-300 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">Otoritas Tertinggi</span>
            </div>
            <p class="text-[10px] text-slate-300 leading-relaxed">
              Akun KING digunakan bersama secara internal. Pilih operator aktual untuk pencatatan audit trail yang sah dan pemisahan kewenangan administratif vs. pengesahan profesional penilai publik:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label class="flex items-start gap-2 p-2.5 rounded-lg border border-amber-500/40 bg-slate-900 cursor-pointer hover:border-amber-400 select-none">
                <input type="radio" name="operator_king_pilihan" id="op_king_danny" value="DANNY" checked onchange="handleOperatorKingChange()" class="mt-0.5 accent-amber-500">
                <div>
                  <p class="font-bold text-white text-[11px]">Danny Taufik H.</p>
                  <p class="text-[9px] text-slate-400 leading-tight">Pengelolaan Administrasi &amp; Operasional</p>
                </div>
              </label>
              <label class="flex items-start gap-2 p-2.5 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer hover:border-amber-400 select-none">
                <input type="radio" name="operator_king_pilihan" id="op_king_nanang" value="NANANG" onchange="handleOperatorKingChange()" class="mt-0.5 accent-amber-500">
                <div>
                  <p class="font-bold text-white text-[11px]">Ir. Nanang Rahayu</p>
                  <p class="text-[9px] text-emerald-400 leading-tight">Pemimpin Rekan &bull; Penilai Publik (P)</p>
                </div>
              </label>
              <label class="flex items-start gap-2 p-2.5 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer hover:border-amber-400 select-none">
                <input type="radio" name="operator_king_pilihan" id="op_king_deni" value="DENI" onchange="handleOperatorKingChange()" class="mt-0.5 accent-amber-500">
                <div>
                  <p class="font-bold text-white text-[11px]">Deni Siswandi, S.T.</p>
                  <p class="text-[9px] text-emerald-400 leading-tight">Rekan Cab. Bandung &bull; Penilai Publik (P)</p>
                </div>
              </label>
            </div>
            
            <!-- Box Verifikasi Tambahan Khusus Pengesahan Profesional Penilai Publik -->
            <div id="box-verifikasi-profesional-king" class="hidden p-2.5 rounded-lg bg-slate-900/90 border border-emerald-500/40 space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-[10.5px] font-bold text-emerald-300">
                  🔒 Verifikasi Pengesahan Profesional Penilai Publik <span class="text-rose-400">*</span>
                </label>
                <span id="badge-status-pin-king" class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Belum Terverifikasi</span>
              </div>
              <p class="text-[9.5px] text-slate-300">
                Pengesahan profesional atas nama Penilai Publik wajib melalui verifikasi kredensial pribadi untuk memastikan tindakan sah.
              </p>
              <div class="flex items-center gap-2">
                <input type="password" id="input-pin-pengesah-king" placeholder="Ketik PIN / Token Kredensial Pribadi Pejabat" class="flex-1 h-8 px-2.5 rounded bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-400">
                <button type="button" onclick="verifikasiKredensialPengesahKing()" class="px-3 h-8 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] transition">
                  Verifikasi
                </button>
              </div>
              <p id="msg-verifikasi-pengesah-king" class="text-[9px] text-slate-400">
                Gunakan PIN otorisasi resmi atau token sah milik pejabat bersangkutan.
              </p>
            </div>

            <!-- Catatan Pemisahan Kewenangan Danny vs Nanang/Deni -->
            <div id="note-kewenangan-king" class="text-[9.5px] text-slate-400 italic bg-slate-950/60 p-2 rounded border border-slate-800">
              ℹ️ <strong>Kewenangan Danny Taufik Hidayat:</strong> Melakukan penerbitan administratif resmi atas nama Super Admin KING. Pejabat pengesah profesional dokumen tetap merujuk pada Penilai Publik berizin yang ditugaskan pada berkas penugasan.
            </div>
          </div>
`;

if (!html.includes('id="section-operator-king"')) {
  const targetForm = '<form id="form-approval-pusat" onsubmit="eksekusiApprovalPusatSubmit(event)" class="space-y-3.5">\n          <input type="hidden" id="appr-target-project-id" value="">';
  const targetFormCRLF = '<form id="form-approval-pusat" onsubmit="eksekusiApprovalPusatSubmit(event)" class="space-y-3.5">\r\n          <input type="hidden" id="appr-target-project-id" value="">';
  
  if (html.includes(targetForm)) {
    html = html.replace(targetForm, targetForm + '\n' + operatorKingHtml);
    console.log('✔ Inserted section-operator-king into form-approval-pusat (LF)');
  } else if (html.includes(targetFormCRLF)) {
    html = html.replace(targetFormCRLF, targetFormCRLF + '\r\n' + operatorKingHtml);
    console.log('✔ Inserted section-operator-king into form-approval-pusat (CRLF)');
  } else {
    console.error('❌ Could not find targetForm in html');
  }
}

// 2.2 Date Separation (Add Tanggal Laporan in Tab 1 Seksi 04)
const targetDateBlock = '<label id="lbl_tanggal_penilaian" for="tanggal_penilaian" class="block font-semibold text-slate-300 mb-1">Tanggal Penilaian (Cut-off Inspeksi) <span class="text-rose-400">*</span></label>\n              <input type="date" id="tanggal_penilaian" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-400">';
const targetDateBlockCRLF = '<label id="lbl_tanggal_penilaian" for="tanggal_penilaian" class="block font-semibold text-slate-300 mb-1">Tanggal Penilaian (Cut-off Inspeksi) <span class="text-rose-400">*</span></label>\r\n              <input type="date" id="tanggal_penilaian" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-400">';

const replacementDateBlock = `<div>
                <label id="lbl_tanggal_penilaian" for="tanggal_penilaian" class="block font-semibold text-slate-300 mb-1">Tanggal Efektif Penilaian <span class="text-rose-400">*</span></label>
                <input type="date" id="tanggal_penilaian" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-400">
                <p class="text-[10px] text-slate-400 mt-1">Tanggal penetapan opini nilai (Cut-off).</p>
              </div>

              <div>
                <label for="tanggal_laporan" class="block font-semibold text-slate-300 mb-1">Tanggal Laporan Penilaian <span class="text-rose-400">*</span></label>
                <input type="date" id="tanggal_laporan" required class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-400">
                <p class="text-[10px] text-slate-400 mt-1">Tanggal penyerahan / buku laporan final.</p>
              </div>`;

if (!html.includes('id="tanggal_laporan"')) {
  if (html.includes(targetDateBlock)) {
    html = html.replace(targetDateBlock, replacementDateBlock);
    console.log('✔ Inserted tanggal_laporan into Tab 1 Seksi 04 (LF)');
  } else if (html.includes(targetDateBlockCRLF)) {
    html = html.replace(targetDateBlockCRLF, replacementDateBlock);
    console.log('✔ Inserted tanggal_laporan into Tab 1 Seksi 04 (CRLF)');
  } else {
    // Try single line marker
    const marker = 'id="tanggal_penilaian" required';
    const idx = html.indexOf(marker);
    if (idx !== -1) {
      console.log('Found tanggal_penilaian around char:', idx);
    }
  }
}

// 2.3 Add Configurable Tax Rate (PPN 11%, 12%, Non-PPN) in Section 07
if (!html.includes('id="opsi_pajak_ppn"')) {
  const targetPpnLabel = '<label class="font-semibold text-slate-300">PPN 11% (Rp)</label>';
  const replacementPpnLabel = `
                  <div class="flex items-center gap-1.5">
                    <label class="font-semibold text-slate-300">Pajak PPN (Rp)</label>
                    <select id="opsi_pajak_ppn" onchange="kalkulasiBiaya()" class="text-[10px] font-bold px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 focus:outline-none">
                      <option value="11" selected>PPN 11%</option>
                      <option value="12">PPN 12%</option>
                      <option value="0">Bebas PPN (0%)</option>
                    </select>
                  </div>`;
  if (html.includes(targetPpnLabel)) {
    html = html.replace(targetPpnLabel, replacementPpnLabel);
    console.log('✔ Inserted opsi_pajak_ppn into Tab 1 Seksi 07');
  }
}

// 2.4 Add Interactive ETI Declaration Panel in Section 05
if (!html.includes('id="panel_deklarasi_eti"')) {
  const etiPanelHtml = `
            <!-- PANEL DEKLARASI & EVALUASI TINGKAT INDEPENDENSI (ETI) - SPI 103 & KEPI -->
            <div id="panel_deklarasi_eti" class="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h4 class="font-black text-amber-300 text-xs flex items-center gap-2">
                    <span class="w-5 h-5 rounded bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">ETI</span>
                    <span>Evaluasi Tingkat Independensi Tim (Dokumen 3F &amp; 3G)</span>
                  </h4>
                  <p class="text-[10.5px] text-slate-400">Deklarasi kepatuhan Kode Etik Penilai Indonesia (KEPI 5.8) &amp; SPI 103.</p>
                </div>
                <div class="flex items-center gap-2">
                  <span id="badge_status_eti" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">BELUM DIISI</span>
                  <button type="button" onclick="deklarasiSemuaIndependen()" class="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer">
                    <span>✔ Deklarasi Bebas Benturan Kepentingan</span>
                  </button>
                </div>
              </div>
              
              <!-- Tabel 7 Butir Kuesioner ETI Sesuai Master Template JO.xlsx -->
              <div class="overflow-x-auto">
                <table class="w-full text-[10.5px] border-collapse text-slate-300">
                  <thead>
                    <tr class="border-b border-slate-800 text-slate-400">
                      <th class="py-1 px-1.5 text-center w-8">No</th>
                      <th class="py-1 px-2 text-left">Pernyataan Kepatuhan Independensi (KEPI)</th>
                      <th class="py-1 px-2 text-center w-24">Jawaban Tim</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60">
                    <tr>
                      <td class="py-1 px-1.5 text-center font-bold">a.</td>
                      <td class="py-1 px-2">Memiliki Afiliasi bisnis dengan klien</td>
                      <td class="py-1 px-2 text-center">
                        <select id="eti_q_a" onchange="evaluasiStatusEtiLive()" class="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 text-xs font-bold">
                          <option value="BELUM_DIISI" selected>Belum Diisi</option>
                          <option value="TIDAK">Tidak (Aman)</option>
                          <option value="YA">Ya (Konflik)</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-1 px-1.5 text-center font-bold">b.</td>
                      <td class="py-1 px-2">Memiliki saham klien</td>
                      <td class="py-1 px-2 text-center">
                        <select id="eti_q_b" onchange="evaluasiStatusEtiLive()" class="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 text-xs font-bold">
                          <option value="BELUM_DIISI" selected>Belum Diisi</option>
                          <option value="TIDAK">Tidak (Aman)</option>
                          <option value="YA">Ya (Konflik)</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-1 px-1.5 text-center font-bold">c.</td>
                      <td class="py-1 px-2">Memiliki perikatan pinjaman dengan klien</td>
                      <td class="py-1 px-2 text-center">
                        <select id="eti_q_c" onchange="evaluasiStatusEtiLive()" class="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 text-xs font-bold">
                          <option value="BELUM_DIISI" selected>Belum Diisi</option>
                          <option value="TIDAK">Tidak (Aman)</option>
                          <option value="YA">Ya (Konflik)</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-1 px-1.5 text-center font-bold">d.</td>
                      <td class="py-1 px-2">Pernah menjadi pengurus pada klien</td>
                      <td class="py-1 px-2 text-center">
                        <select id="eti_q_d" onchange="evaluasiStatusEtiLive()" class="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 text-xs font-bold">
                          <option value="BELUM_DIISI" selected>Belum Diisi</option>
                          <option value="TIDAK">Tidak (Aman)</option>
                          <option value="YA">Ya (Konflik)</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-1 px-1.5 text-center font-bold">e.</td>
                      <td class="py-1 px-2">Memiliki ikatan saudara dengan klien</td>
                      <td class="py-1 px-2 text-center">
                        <select id="eti_q_e" onchange="evaluasiStatusEtiLive()" class="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 text-xs font-bold">
                          <option value="BELUM_DIISI" selected>Belum Diisi</option>
                          <option value="TIDAK">Tidak (Aman)</option>
                          <option value="YA">Ya (Konflik)</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-1 px-1.5 text-center font-bold">f.</td>
                      <td class="py-1 px-2">Memiliki ikatan saudara dengan pemilik saham pada klien</td>
                      <td class="py-1 px-2 text-center">
                        <select id="eti_q_f" onchange="evaluasiStatusEtiLive()" class="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 text-xs font-bold">
                          <option value="BELUM_DIISI" selected>Belum Diisi</option>
                          <option value="TIDAK">Tidak (Aman)</option>
                          <option value="YA">Ya (Konflik)</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td class="py-1 px-1.5 text-center font-bold">g.</td>
                      <td class="py-1 px-2">Terdapat hal-hal yang berpotensi menjadi ancaman terhadap independensi</td>
                      <td class="py-1 px-2 text-center">
                        <select id="eti_q_g" onchange="evaluasiStatusEtiLive()" class="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-0.5 text-xs font-bold">
                          <option value="BELUM_DIISI" selected>Belum Diisi</option>
                          <option value="TIDAK">Tidak (Aman)</option>
                          <option value="YA">Ya (Konflik)</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p id="eti_info_deklarasi" class="text-[10px] text-slate-400 italic">
                Deklarasi ETI ini mengikat pada Dokumen 3F (Evaluasi Tingkat Independensi) dan Dokumen 3G (Pernyataan Independensi).
              </p>
            </div>
`;

  const targetSection05End = '<!-- 6. IDENTITAS PENGINPUT / ADMIN PEMBUAT RECORD -->';
  if (html.includes(targetSection05End)) {
    html = html.replace(targetSection05End, etiPanelHtml + '\n\n          ' + targetSection05End);
    console.log('✔ Inserted panel_deklarasi_eti into Tab 1 Seksi 05');
  }
}

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('Phase 1 applied successfully!');
