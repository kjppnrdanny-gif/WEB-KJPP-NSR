import fs from 'fs';

console.log('Writing and applying Phase 3 (kalkulasiBiaya, draft builder, eksekusiApprovalPusatSubmit, and renderers)...');
let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. UPDATE kalkulasiBiaya() to support opsi_pajak_ppn (11, 12, 0)
const oldKalkulasiPpn = `const ppn = kenaPpn ? Math.round(dpp * 0.11) : 0;`;
const newKalkulasiPpn = `const tarifPpn = parseFloat(document.getElementById('opsi_pajak_ppn')?.value) ?? 11;
      const ppn = (kenaPpn && tarifPpn > 0) ? Math.round(dpp * (tarifPpn / 100)) : 0;`;

if (html.includes(oldKalkulasiPpn)) {
  html = html.replace(oldKalkulasiPpn, newKalkulasiPpn);
  console.log('✔ Updated kalkulasiBiaya() with configurable tax rate');
}

// 2. UPDATE bangunDraftDariForm() to capture tanggal_laporan, opsi_pajak_ppn, eti_answers, eti_status
const draftAnchor = 'biaya_ppn: parseFloat(document.getElementById(\'biaya_ppn\')?.value) || 0,';
const draftAdditions = `biaya_ppn: parseFloat(document.getElementById('biaya_ppn')?.value) || 0,
        tarif_ppn_persen: parseFloat(document.getElementById('opsi_pajak_ppn')?.value) ?? 11,
        tanggal_laporan: document.getElementById('tanggal_laporan')?.value || document.getElementById('target_selesai')?.value || tglStr,
        eti_answers: (typeof evaluasiStatusEtiLive === 'function') ? evaluasiStatusEtiLive() : null,
        eti_status: document.getElementById('badge_status_eti')?.textContent || 'BELUM DIISI',
        eti_info: document.getElementById('eti_info_deklarasi')?.textContent || '',`;

if (html.includes(draftAnchor)) {
  html = html.replace(draftAnchor, draftAdditions);
  console.log('✔ Updated bangunDraftDariForm() with tanggal_laporan, tarif_ppn, and eti_answers');
}

// 3. UPDATE eksekusiApprovalPusatSubmit() for KING operator & audit trail
const oldApprovalOleh = `const isKing = Boolean(auth && (auth.isKing || auth.isSuperAdmin || auth.role === 'SUPER_ADMIN'));
      p.disetujui_oleh = isKing ? \`SUPER ADMIN (KING) (\${userSession.displayName || 'OTORISASI_KING'})\` : \`Admin Pusat (\${userSession.displayName || 'OTORISASI_PUSAT'})\`;`;

const newApprovalOleh = `const isKing = Boolean(auth && (auth.isKing || auth.isSuperAdmin || auth.role === 'SUPER_ADMIN'));
      let namaOperatorAktif = userSession.displayName || 'Admin Pusat';
      let peranOperatorAktif = 'Administrasi';
      let buktiVerifikasiAktif = 'OTORISASI_RESMI';

      if (isKing) {
        const opPilihan = document.querySelector('input[name="operator_king_pilihan"]:checked')?.value || stateKingOperator || 'DANNY';
        if (opPilihan === 'NANANG') {
          if (!stateKingVerifiedPenilai) {
            alert('Pengesahan Ditolak: Anda memilih pengesahan profesional atas nama Ir. Nanang Rahayu. Harap verifikasi PIN kredensial pribadi sebelum melanjutkan.');
            if (btnAppr) { delete btnAppr.dataset.submitting; btnAppr.disabled = false; if (labelAppr) labelAppr.textContent = origApprText; }
            return;
          }
          namaOperatorAktif = 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
          peranOperatorAktif = 'Pemimpin Rekan & Penilai Publik (P)';
          p.disetujui_oleh = 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.) (Pemimpin Rekan / KING)';
          p.pejabat_pengesah_profesional = 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
          buktiVerifikasiAktif = 'PIN_PENILAI_PUBLIK_TERVERIFIKASI';
        } else if (opPilihan === 'DENI') {
          if (!stateKingVerifiedPenilai) {
            alert('Pengesahan Ditolak: Anda memilih pengesahan profesional atas nama Deni Siswandi, S.T. Harap verifikasi PIN kredensial pribadi sebelum melanjutkan.');
            if (btnAppr) { delete btnAppr.dataset.submitting; btnAppr.disabled = false; if (labelAppr) labelAppr.textContent = origApprText; }
            return;
          }
          namaOperatorAktif = 'Deni Siswandi, S.T., MAPPI (Cert.)';
          peranOperatorAktif = 'Rekan Cabang Bandung & Penilai Publik (P)';
          p.disetujui_oleh = 'Deni Siswandi, S.T., MAPPI (Cert.) (Rekan Cabang Bandung / KING)';
          p.pejabat_pengesah_profesional = 'Deni Siswandi, S.T., MAPPI (Cert.)';
          buktiVerifikasiAktif = 'PIN_PENILAI_PUBLIK_TERVERIFIKASI';
        } else {
          // Danny Taufik Hidayat (Administrasi & Operasional KING)
          namaOperatorAktif = 'Danny Taufik Hidayat';
          peranOperatorAktif = 'Pengelolaan Administrasi & Operasional SUPER ADMIN (KING)';
          p.disetujui_oleh = 'SUPER ADMIN (KING) • Danny Taufik Hidayat';
          // Pejabat profesional tetap mengacu pada Penilai Publik berizin dari penugasan (tanpa klaim fiktif)
          p.pejabat_pengesah_profesional = p.rekan_nama || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
          buktiVerifikasiAktif = 'OTORISASI_ADMINISTRATIF_SUPER_ADMIN_KING';
        }
      } else {
        p.disetujui_oleh = \`Admin Pusat (\${userSession.displayName || 'OTORISASI_PUSAT'})\`;
        p.pejabat_pengesah_profesional = p.rekan_nama || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
      }

      p.operator_aktual = namaOperatorAktif;
      p.operator_peran = peranOperatorAktif;

      // Audit Trail Terperinci
      if (!p.audit_trail) p.audit_trail = [];
      p.audit_trail.push({
        waktu: new Date().toISOString(),
        aksi: 'OTORISASI_PENERBITAN_NOMOR_RESMI',
        role_akun: isKing ? 'SUPER_ADMIN (KING)' : 'ADMIN_PUSAT',
        operator_nama: namaOperatorAktif,
        operator_peran: peranOperatorAktif,
        pejabat_pengesah_profesional: p.pejabat_pengesah_profesional,
        metode_verifikasi: buktiVerifikasiAktif,
        nomor_spk: finalLp,
        nomor_jo: finalAdm,
        keterangan: 'Penerbitan nomor resmi dan otorisasi penugasan melalui portal NSR.'
      });`;

if (html.includes(oldApprovalOleh)) {
  html = html.replace(oldApprovalOleh, newApprovalOleh);
  console.log('✔ Updated eksekusiApprovalPusatSubmit() with KING operator discrimination and audit trail');
}

// 4. UPDATE Klausul 6 & 7 in renderSemuaDokumen() for strict Likuidasi consistency
const oldKlausul6Block = `const isAgunan = !tujuan || tujuan.includes('agunan') || tujuan.includes('utang') || tujuan.includes('jaminan') || tujuan.includes('kredit');
                            const isLapKeuangan = tujuan.includes('keuangan') || tujuan.includes('psak') || tujuan.includes('revaluasi');
                            const isPengadaan = tujuan.includes('pengadaan tanah') || tujuan.includes('ganti kerugian');
                            const isJualBeli = tujuan.includes('jual') || tujuan.includes('beli') || tujuan.includes('transaksi');

                            if (isAgunan) {
                              return \`
                                <p class="text-justify mb-2">
                                  Penilaian ini dilaksanakan dengan maksud memberikan opini/pendapat mengenai <strong>Nilai Pasar dan Indikasi Nilai Likuidasi</strong> atas objek penilaian untuk tujuan <strong>\${p.tujuan_penilaian || 'Penjaminan Utang / Agunan Kredit'}</strong> pada <strong>\${p.pemberi_tugas_nama}</strong>.
                                </p>
                              \`;`;

const newKlausul6Block = `const dasarNilaiStr = (p.dasar_nilai || '').toLowerCase();
                            const includesLikuidasi = dasarNilaiStr.includes('likuidasi') || dasarNilaiStr.includes('spi 202');
                            const isAgunan = !tujuan || tujuan.includes('agunan') || tujuan.includes('utang') || tujuan.includes('jaminan') || tujuan.includes('kredit') || tujuan.includes('lelang');
                            const isLapKeuangan = tujuan.includes('keuangan') || tujuan.includes('psak') || tujuan.includes('revaluasi');
                            const isPengadaan = tujuan.includes('pengadaan tanah') || tujuan.includes('ganti kerugian');
                            const isJualBeli = tujuan.includes('jual') || tujuan.includes('beli') || tujuan.includes('transaksi');

                            if (isAgunan) {
                              const narasiOpiniAset = includesLikuidasi 
                                ? '<strong>Nilai Pasar dan Indikasi Nilai Likuidasi</strong>' 
                                : '<strong>Nilai Pasar</strong>';
                              return \`
                                <p class="text-justify mb-2">
                                  Penilaian ini dilaksanakan dengan maksud memberikan opini/pendapat mengenai \${narasiOpiniAset} atas objek penilaian untuk tujuan <strong>\${p.tujuan_penilaian || 'Penjaminan Utang / Agunan Kredit'}</strong> pada <strong>\${p.pemberi_tugas_nama}</strong>.
                                </p>
                              \`;`;

if (html.includes(oldKlausul6Block)) {
  html = html.replace(oldKlausul6Block, newKlausul6Block);
  console.log('✔ Updated Klausul 6 with conditional Likuidasi matching Dasar Nilai');
}

// In Klausul 7:
const oldKlausul7Likuidasi = `if (isAgunan) {
                              return \`
                                <p class="text-justify">
                                  Beberapa pemberi pinjaman membutuhkan penilaian dengan asumsi likuidasi atau menentukan batas waktu penjualan hipotesis dari properti. Karena harga dalam periode pemasaran akan tergantung dari kondisi saat penjualan terjadi. Asumsi Dasar Nilai dinyatakan sebagai Indikasi Nilai Likuidasi dan hanya berlaku pada tanggal penilaian dan mungkin tidak berlaku pada saat terjadinya kredit macet atau gagal bayar pembiayaan di masa yang akan datang, karena kondisi pasar dan keadaan penjualan dapat berbeda (SPI 202 butir 5.1.e), 2018).
                                </p>
                              \`;`;

const newKlausul7Likuidasi = `const dasarNilaiStr7 = (p.dasar_nilai || '').toLowerCase();
                            const includesLikuidasi7 = dasarNilaiStr7.includes('likuidasi') || dasarNilaiStr7.includes('spi 202');
                            if (isAgunan && includesLikuidasi7) {
                              return \`
                                <p class="text-justify">
                                  Beberapa pemberi pinjaman membutuhkan penilaian dengan asumsi likuidasi atau menentukan batas waktu penjualan hipotesis dari properti. Karena harga dalam periode pemasaran akan tergantung dari kondisi saat penjualan terjadi. Asumsi Dasar Nilai dinyatakan sebagai Indikasi Nilai Likuidasi dan hanya berlaku pada tanggal penilaian dan mungkin tidak berlaku pada saat terjadinya kredit macet atau gagal bayar pembiayaan di masa yang akan datang, karena kondisi pasar dan keadaan penjualan dapat berbeda (SPI 202 butir 5.1.e), 2018).
                                </p>
                              \`;`;

if (html.includes(oldKlausul7Likuidasi)) {
  html = html.replace(oldKlausul7Likuidasi, newKlausul7Likuidasi);
  console.log('✔ Updated Klausul 7 to display Likuidasi clause ONLY when requested in Dasar Nilai');
}

// 5. UPDATE Klausul 8 (Date Separation) in Dokumen 1
const oldKlausul8Date = `<strong>Tanggal Penilaian :</strong> Tanggal penilaian yaitu tanggal pada saat nilai dinyatakan dan diberlakukan, ditetapkan pada tanggal dilaksanakannya inspeksi lapangan\${p.tanggal_penilaian ? \` (\${formatTanggalIndo(p.tanggal_penilaian)})\` : ''}.`;
const newKlausul8Date = `<strong>Tanggal Penilaian (Tanggal Efektif Opini Nilai) :</strong> Tanggal penilaian yaitu tanggal pada saat opini nilai dinyatakan dan diberlakukan, ditetapkan per tanggal <strong>\${formatTanggalIndo(p.tanggal_penilaian || p.survey_tanggal || p.tanggal_surat)}</strong>. Adapun tanggal pelaksanaan inspeksi fisik lapangan adalah pada tanggal <strong>\${formatTanggalIndo(p.survey_tanggal || p.tanggal_penilaian)}</strong>, tanggal perikatan penugasan (SPK) pada tanggal <strong>\${formatTanggalIndo(p.tanggal_surat)}</strong>, dan target penerbitan laporan pada tanggal <strong>\${formatTanggalIndo(p.tanggal_laporan || p.target_selesai || p.tanggal_surat)}</strong>.`;

if (html.includes(oldKlausul8Date)) {
  html = html.replace(oldKlausul8Date, newKlausul8Date);
  console.log('✔ Updated Klausul 8 with distinct dates (Penugasan, Inspeksi, Efektif, Laporan)');
}

// 6. UPDATE Klausul 21 (Fee breakdown with custom tax rate) in Dokumen 1
const oldKlausul21Ppn = `<tr><td class="font-semibold">Pajak Pertambahan Nilai (PPN 11%)</td><td>:</td><td><strong>Rp \${feePpnText}</strong></td></tr>`;
const newKlausul21Ppn = `<tr><td class="font-semibold">Pajak Pertambahan Nilai (PPN \${p.tarif_ppn_persen !== undefined ? p.tarif_ppn_persen : 11}%)</td><td>:</td><td><strong>\${(p.biaya_ppn && p.biaya_ppn > 0) ? ('Rp ' + feePpnText) : 'Bebas PPN / Non-PPN (Rp 0)'}</strong></td></tr>`;

if (html.includes(oldKlausul21Ppn)) {
  html = html.replace(oldKlausul21Ppn, newKlausul21Ppn);
  console.log('✔ Updated Klausul 21 PPN display with configurable rate');
}

// 7. UPDATE Dokumen 3F (ETI) - Dynamic questionnaire answers & no hardcoded [ X ]
const oldEtiTable = `<table class="doc-table mb-3 text-[10px]">
                        <thead>
                          <tr>
                            <th class="w-8 text-center">No.</th>
                            <th>Uraian Evaluasi Kepatuhan Kode Etik Penilai Indonesia (KEPI) &amp; SPI</th>
                            <th class="w-12 text-center">Ya</th>
                            <th class="w-14 text-center">Tidak</th>
                            <th>Keterangan</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td class="text-center font-bold">a.</td>
                            <td>Memiliki Afiliasi bisnis dengan klien</td>
                            <td class="text-center font-bold"></td>
                            <td class="text-center font-bold text-blue-900">[ X ]</td>
                            <td class="text-slate-600">Tidak ada afiliasi bisnis</td>
                          </tr>
                          <tr>
                            <td class="text-center font-bold">b.</td>
                            <td>Memiliki saham klien</td>
                            <td class="text-center font-bold"></td>
                            <td class="text-center font-bold text-blue-900">[ X ]</td>
                            <td class="text-slate-600">Tidak memiliki saham</td>
                          </tr>
                          <tr>
                            <td class="text-center font-bold">c.</td>
                            <td>Memiliki perikatan pinjaman dengan klien</td>
                            <td class="text-center font-bold"></td>
                            <td class="text-center font-bold text-blue-900">[ X ]</td>
                            <td class="text-slate-600">Tidak ada perikatan pinjaman</td>
                          </tr>
                          <tr>
                            <td class="text-center font-bold">d.</td>
                            <td>Pernah menjadi pengurus pada klien</td>
                            <td class="text-center font-bold"></td>
                            <td class="text-center font-bold text-blue-900">[ X ]</td>
                            <td class="text-slate-600">Bukan pengurus klien</td>
                          </tr>
                          <tr>
                            <td class="text-center font-bold">e.</td>
                            <td>Memiliki ikatan saudara dengan klien</td>
                            <td class="text-center font-bold"></td>
                            <td class="text-center font-bold text-blue-900">[ X ]</td>
                            <td class="text-slate-600">Tidak ada hubungan keluarga</td>
                          </tr>
                          <tr>
                            <td class="text-center font-bold">f.</td>
                            <td>Memiliki ikatan saudara dengan pemilik saham pada klien</td>
                            <td class="text-center font-bold"></td>
                            <td class="text-center font-bold text-blue-900">[ X ]</td>
                            <td class="text-slate-600">Tidak ada ikatan saudara pemegang saham</td>
                          </tr>
                          <tr>
                            <td class="text-center font-bold">g.</td>
                            <td>Terdapat hal-hal yang berpotensi menjadi ancaman terhadap independensi</td>
                            <td class="text-center font-bold"></td>
                            <td class="text-center font-bold text-blue-900">[ X ]</td>
                            <td class="text-slate-600">Bebas benturan kepentingan &amp; independen</td>
                          </tr>
                        </tbody>
                      </table>`;

const newEtiTable = `\${(() => {
                        const answers = p.eti_answers || {};
                        const qItems = [
                          { k: 'a', t: 'Memiliki Afiliasi bisnis dengan klien', safe: 'Tidak ada afiliasi bisnis', risk: 'Terdapat afiliasi bisnis' },
                          { k: 'b', t: 'Memiliki saham klien', safe: 'Tidak memiliki saham', risk: 'Memiliki kepemilikan saham' },
                          { k: 'c', t: 'Memiliki perikatan pinjaman dengan klien', safe: 'Tidak ada perikatan pinjaman', risk: 'Terdapat perikatan kredit/pinjaman' },
                          { k: 'd', t: 'Pernah menjadi pengurus pada klien', safe: 'Bukan pengurus klien', risk: 'Pernah menjabat pengurus klien' },
                          { k: 'e', t: 'Memiliki ikatan saudara dengan klien', safe: 'Tidak ada hubungan keluarga', risk: 'Terdapat ikatan keluarga' },
                          { k: 'f', t: 'Memiliki ikatan saudara dengan pemilik saham pada klien', safe: 'Tidak ada ikatan pemegang saham', risk: 'Terdapat hubungan pemegang saham' },
                          { k: 'g', t: 'Terdapat hal-hal yang berpotensi menjadi ancaman terhadap independensi', safe: 'Bebas benturan kepentingan &amp; independen', risk: 'Terdapat potensi ancaman independensi' }
                        ];

                        return \`
                          <table class="doc-table mb-3 text-[10px]">
                            <thead>
                              <tr>
                                <th class="w-8 text-center">No.</th>
                                <th>Uraian Evaluasi Kepatuhan Kode Etik Penilai Indonesia (KEPI) &amp; SPI</th>
                                <th class="w-12 text-center">Ya</th>
                                <th class="w-14 text-center">Tidak</th>
                                <th>Keterangan Deklarasi</th>
                              </tr>
                            </thead>
                            <tbody>
                              \${qItems.map(item => {
                                const ans = answers[item.k];
                                const isYa = (ans === 'YA');
                                const isTidak = (ans === 'TIDAK');
                                const isUnset = (!ans || ans === 'BELUM_DIISI');

                                let boxYa = '[ &nbsp; ]';
                                let boxTidak = '[ &nbsp; ]';
                                let ketText = '<span class="text-slate-400 italic font-mono">[Belum Dideklarasikan]</span>';

                                if (isTidak) {
                                  boxTidak = '<span class="text-blue-900 font-bold">[ X ]</span>';
                                  ketText = item.safe;
                                } else if (isYa) {
                                  boxYa = '<span class="text-rose-700 font-bold">[ X ]</span>';
                                  ketText = '<strong class="text-rose-700">⚠️ ' + item.risk + ' (Perlu Penanganan Khusus)</strong>';
                                }

                                return \`
                                  <tr>
                                    <td class="text-center font-bold">\${item.k}.</td>
                                    <td>\${item.t}</td>
                                    <td class="text-center font-mono">\${boxYa}</td>
                                    <td class="text-center font-mono">\${boxTidak}</td>
                                    <td class="text-slate-700">\${ketText}</td>
                                  </tr>
                                \`;
                              }).join('')}
                            </tbody>
                          </table>
                        \`;
                      })()}`;

if (html.includes(oldEtiTable)) {
  html = html.replace(oldEtiTable, newEtiTable);
  console.log('✔ Updated Dokumen 3F (ETI) with dynamic declaration rendering (zero automatic [X])');
}

// In Dokumen 3F: update conclusion paragraph based on real answers
const oldEtiConclusion = `<p class="text-[9.5px] mb-3 text-justify">
                            Berdasarkan hasil kuesioner evaluasi di atas, seluruh personil yang dievaluasi dinyatakan independen, objektif, dan tidak memiliki benturan kepentingan terhadap penugasan penilaian properti ini.
                          </p>`;

const newEtiConclusion = `\${(() => {
                            const answers = p.eti_answers || {};
                            const hasYa = Object.values(answers).some(v => v === 'YA');
                            const hasUnset = Object.keys(answers).length === 0 || Object.values(answers).some(v => v === 'BELUM_DIISI');

                            if (hasYa) {
                              return \`
                                <div class="p-2.5 mb-3 rounded bg-rose-50 border border-rose-300 text-rose-900 text-[9.5px] text-justify">
                                  <strong>⚠️ CATATAN EVALUASI MUTU / PERLU REVIEW:</strong> Berdasarkan kuesioner evaluasi di atas, teridentifikasi potensi ancaman terhadap independensi yang memerlukan penanganan/mitigasi atau penggantian personil penilai sesuai Kode Etik Penilai Indonesia (KEPI).
                                </div>
                              \`;
                            } else if (hasUnset) {
                              return \`
                                <p class="text-[9.5px] mb-3 text-justify text-amber-800 italic">
                                  * Kuesioner Evaluasi Tingkat Independensi (ETI) ini masih menunggu deklarasi konfirmasi mandiri resmi dari seluruh personil tim penilai yang bertugas sebelum penandatanganan final.
                                </p>
                              \`;
                            } else {
                              return \`
                                <p class="text-[9.5px] mb-3 text-justify">
                                  Berdasarkan hasil kuesioner evaluasi di atas, seluruh personil yang dievaluasi dinyatakan independen, objektif, dan tidak memiliki benturan kepentingan terhadap penugasan penilaian properti ini.
                                </p>
                              \`;
                            }
                          })()}`;

if (html.includes(oldEtiConclusion)) {
  html = html.replace(oldEtiConclusion, newEtiConclusion);
  console.log('✔ Updated Dokumen 3F conclusion narrative to match actual ETI answers');
}

// In Dokumen 3F signature block: support multi-personnel properly with distinct credentials
const oldEtiSignatures = `<div class="signature-block-container avoid-break signature-block mt-2">
                          <p class="font-bold text-xs mb-2">Yang dievaluasi,</p>
                          <table class="w-full text-center text-xs">
                            <tr>
                              <td class="w-1/3">
                                <p class="font-bold mb-10">Reviewer,</p>
                                <p class="font-bold underline">\${p.reviewer_nama}</p>
                                <p class="text-[10px] font-mono">No. MAPPI: \${viewReviewerMappi}</p>
                                <p class="text-[9px] text-slate-500 font-mono">No. Register: \${reviewerMeta.rmk || '-'}</p>
                              </td>
                              <td class="w-1/3">
                                <p class="font-bold mb-10">Penilai Lapangan,</p>
                                <p class="font-bold underline">\${p.penilai_nama}</p>
                                <p class="text-[10px] font-mono">No. MAPPI: \${viewPenilaiMappi}</p>
                                <p class="text-[9px] text-slate-500 font-mono">No. Register: \${penilaiMeta.rmk || '-'}</p>
                              </td>
                              <td class="w-1/3">
                                <p class="font-bold mb-10">Asisten Penilai,</p>
                                <p class="font-bold underline">\${p.asisten_nama}</p>
                                <p class="text-[10px] font-mono">No. MAPPI: \${viewAsistenMappi}</p>
                                <p class="text-[9px] text-slate-500">Pelaksana Lapangan</p>
                              </td>
                            </tr>
                          </table>
                        </div>`;

const newEtiSignatures = `<div class="signature-block-container avoid-break signature-block mt-2">
                          <p class="font-bold text-xs mb-2">Yang dievaluasi (Seluruh Tim Penugasan),</p>
                          <div class="grid grid-cols-3 gap-2 text-center text-xs">
                            <div class="border border-slate-200 p-2 rounded bg-slate-50/50">
                              <p class="font-bold mb-8">Reviewer Mutu,</p>
                              <p class="font-bold underline text-[10px]">\${reviewerTampilan}</p>
                              <p class="text-[9px] font-mono text-slate-600">No. MAPPI: \${viewReviewerMappi}</p>
                              <p class="text-[8.5px] text-slate-500 font-mono">No. Register: \${viewReviewerRmk}</p>
                            </div>
                            <div class="border border-slate-200 p-2 rounded bg-slate-50/50">
                              <p class="font-bold mb-8">Penilai Pelaksana Lapangan,</p>
                              \${listPenilai.map(pen => \`
                                <div class="mb-1 pb-1 border-b border-slate-200 last:border-b-0">
                                  <p class="font-bold underline text-[10px]">\${pen.nama}</p>
                                  <p class="text-[9px] font-mono text-slate-600">No. MAPPI: \${pen.mappi || '-'}</p>
                                  <p class="text-[8.5px] text-slate-500 font-mono">No. Register: \${pen.rmk || '-'}</p>
                                </div>
                              \`).join('')}
                            </div>
                            <div class="border border-slate-200 p-2 rounded bg-slate-50/50">
                              <p class="font-bold mb-8">Asisten Penilai / Surveyor,</p>
                              \${listAsisten.map(as => \`
                                <div class="mb-1 pb-1 border-b border-slate-200 last:border-b-0">
                                  <p class="font-bold underline text-[10px]">\${as.nama}</p>
                                  <p class="text-[9px] font-mono text-slate-600">No. MAPPI: \${as.mappi || '-'}</p>
                                  <p class="text-[8.5px] text-slate-500 font-mono">No. Register: \${as.rmk || '-'}</p>
                                </div>
                              \`).join('')}
                            </div>
                          </div>
                        </div>`;

if (html.includes(oldEtiSignatures)) {
  html = html.replace(oldEtiSignatures, newEtiSignatures);
  console.log('✔ Updated Dokumen 3F signature blocks to cleanly render multi-personnel with individual MAPPI/RMK numbers');
}

// In Dokumen 3G: update 4 signature blocks to support multi-personnel properly with distinct credentials
const oldPiSignatures = `<td class="w-1/4 align-top">
                                <p class="font-bold mb-10">Penilai,</p>
                                <p class="font-bold underline text-[10.5px]">\${listPenilai.map(p => p.nama).join('<br>')}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. MAPPI: \${viewPenilaiMappi}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. Register: \${penilaiMeta.rmk || '-'}</p>
                              </td>
                              <td class="w-1/4 align-top">
                                <p class="font-bold mb-10">Asisten Penilai,</p>
                                <p class="font-bold underline text-[10.5px]">\${listAsisten.map(a => a.nama).join('<br>')}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. MAPPI: \${viewAsistenMappi}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. Register: -</p>
                              </td>`;

const newPiSignatures = `<td class="w-1/4 align-top">
                                <p class="font-bold mb-6">Penilai Pelaksana,</p>
                                \${listPenilai.map(pen => \`
                                  <div class="mb-1.5 pb-1 border-b border-slate-200 last:border-b-0">
                                    <p class="font-bold underline text-[10px]">\${pen.nama}</p>
                                    <p class="text-[8.5px] text-slate-600 font-mono">MAPPI: \${pen.mappi || '-'}</p>
                                    <p class="text-[8px] text-slate-500 font-mono">RMK: \${pen.rmk || '-'}</p>
                                  </div>
                                \`).join('')}
                              </td>
                              <td class="w-1/4 align-top">
                                <p class="font-bold mb-6">Asisten Penilai,</p>
                                \${listAsisten.map(as => \`
                                  <div class="mb-1.5 pb-1 border-b border-slate-200 last:border-b-0">
                                    <p class="font-bold underline text-[10px]">\${as.nama}</p>
                                    <p class="text-[8.5px] text-slate-600 font-mono">MAPPI: \${as.mappi || '-'}</p>
                                    <p class="text-[8px] text-slate-500 font-mono">RMK: \${as.rmk || '-'}</p>
                                  </div>
                                \`).join('')}
                              </td>`;

if (html.includes(oldPiSignatures)) {
  html = html.replace(oldPiSignatures, newPiSignatures);
  console.log('✔ Updated Dokumen 3G (PI) signature block for multi-personnel with individual MAPPI/RMK numbers');
}

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('Phase 3 applied successfully!');
