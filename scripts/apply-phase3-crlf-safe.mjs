import fs from 'fs';

console.log('Running CRLF-safe string replacement for Phase 3...');
let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. eksekusiApprovalPusatSubmit()
const targetApprMarker = 'p.disetujui_oleh = isKing ?';
const apprIdx = html.indexOf(targetApprMarker);
console.log('apprIdx found:', apprIdx);
if (apprIdx !== -1) {
  // Find start of line: const isKing = Boolean(auth && (auth.isKing || auth.isSuperAdmin || auth.role === 'SUPER_ADMIN'));
  const lineStart = html.lastIndexOf('const isKing = Boolean(auth', apprIdx);
  const lineEnd = html.indexOf('p.nomor_spk_pusat = finalLp;', apprIdx);
  if (lineStart !== -1 && lineEnd !== -1) {
    const snippetToReplace = html.substring(lineStart, lineEnd);
    console.log('Replacing snippet in eksekusiApprovalPusatSubmit, len:', snippetToReplace.length);

    const replacement = `const isKing = Boolean(auth && (auth.isKing || auth.isSuperAdmin || auth.role === 'SUPER_ADMIN'));
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
          p.pejabat_pengesah_profesional = p.rekan_nama || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
          buktiVerifikasiAktif = 'OTORISASI_ADMINISTRATIF_SUPER_ADMIN_KING';
        }
      } else {
        p.disetujui_oleh = \`Admin Pusat (\${userSession.displayName || 'OTORISASI_PUSAT'})\`;
        p.pejabat_pengesah_profesional = p.rekan_nama || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
      }

      p.operator_aktual = namaOperatorAktif;
      p.operator_peran = peranOperatorAktif;

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
      });
      `;
    html = html.substring(0, lineStart) + replacement + html.substring(lineEnd);
    console.log('✔ Successfully patched eksekusiApprovalPusatSubmit with KING operator logic & audit trail');
  }
}

// 2. Klausul 6 & Klausul 7 in renderSemuaDokumen()
const k6Marker = '<!-- 6. MAKSUD DAN TUJUAN PENILAIAN (DYNAMIC PROFESSIONAL NARRATIVE) -->';
const k6Idx = html.indexOf(k6Marker);
console.log('k6Idx found:', k6Idx);
if (k6Idx !== -1) {
  const k7Marker = '<!-- 7. DASAR NILAI (MASTER TEMPLATE ALIGNED) -->';
  const k8Marker = '<!-- 8. TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN';
  const k7Idx = html.indexOf(k7Marker, k6Idx);
  const k8Idx = html.indexOf(k8Marker, k7Idx);

  if (k7Idx !== -1 && k8Idx !== -1) {
    const k6Block = html.substring(k6Idx, k7Idx);
    const k7Block = html.substring(k7Idx, k8Idx);

    // Update k6Block
    const newK6 = `<!-- 6. MAKSUD DAN TUJUAN PENILAIAN (DYNAMIC PROFESSIONAL NARRATIVE) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">6. MAKSUD DAN TUJUAN PENILAIAN</p>
                          \${(() => {
                            const tujuan = (p.tujuan_penilaian || '').toLowerCase();
                            const dasarNilaiStr = (p.dasar_nilai || '').toLowerCase();
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
                              \`;
                            } else if (isLapKeuangan) {
                              return \`
                                <p class="text-justify mb-2">
                                  Penilaian ini dilaksanakan dengan maksud memberikan opini/pendapat mengenai <strong>Nilai Pasar / Nilai Wajar</strong> atas objek penilaian untuk tujuan <strong>\${p.tujuan_penilaian}</strong> pada <strong>\${p.pemberi_tugas_nama}</strong>.
                                </p>
                              \`;
                            } else if (isPengadaan) {
                              return \`
                                <p class="text-justify mb-2">
                                  Penilaian ini dilaksanakan dengan maksud memberikan opini/pendapat mengenai <strong>Nilai Penggantian Wajar (Nilai Ganti Kerugian)</strong> atas objek penilaian untuk tujuan <strong>\${p.tujuan_penilaian}</strong> berpedoman pada Standar Penilaian Indonesia (SPI 204) pada <strong>\${p.pemberi_tugas_nama}</strong>.
                                </p>
                              \`;
                            } else if (isJualBeli) {
                              return \`
                                <p class="text-justify mb-2">
                                  Penilaian ini dilaksanakan dengan maksud memberikan opini/pendapat mengenai <strong>Nilai Pasar</strong> atas objek penilaian untuk tujuan <strong>\${p.tujuan_penilaian}</strong> pada <strong>\${p.pemberi_tugas_nama}</strong>.
                                </p>
                              \`;
                            } else {
                              return \`
                                <p class="text-justify mb-2">
                                  Penilaian ini dilaksanakan dengan maksud memberikan opini/pendapat mengenai <strong>Nilai Pasar</strong> atas objek penilaian untuk tujuan <strong>\${p.tujuan_penilaian || 'Penilaian Aset'}</strong> pada <strong>\${p.pemberi_tugas_nama}</strong>.
                                </p>
                              \`;
                            }
                          })()}
                          <p class="text-justify">
                            Laporan hasil penilaian tidak untuk digunakan diluar konteks atau tujuan yang dimaksudkan. Penilai tidak bertanggung jawab apabila Laporan Penilaian digunakan selain dari tujuan yang telah disebutkan diatas.
                          </p>
                        </div>
                        
                        `;

    const newK7 = `<!-- 7. DASAR NILAI (MASTER TEMPLATE ALIGNED) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">7. DASAR NILAI</p>
                          <p class="text-justify mb-2">
                            Dasar Nilai yang digunakan sesuai maksud dan tujuan diatas adalah <strong>\${p.dasar_nilai || 'Nilai Pasar'}</strong>.
                          </p>
                          <p class="text-justify mb-2">
                            Nilai Pasar didefinisikan sebagai estimasi sejumlah uang yang dapat diperoleh atau dibayar untuk penukaran suatu aset atau liabilitas pada tanggal penilaian, antara pembeli yang berminat membeli dengan penjual yang berminat menjual, dalam suatu transaksi bebas ikatan, yang pemasarannya dilakukan secara layak, dimana kedua pihak masing-masing bertindak atas dasar pemahaman yang dimilikinya, kehati-hatian dan tanpa paksaan (SPI 101 butir 3.1, 2018).
                          </p>
                          \${(() => {
                            const tujuan = (p.tujuan_penilaian || '').toLowerCase();
                            const dasarNilaiStr = (p.dasar_nilai || '').toLowerCase();
                            const includesLikuidasi = dasarNilaiStr.includes('likuidasi') || dasarNilaiStr.includes('spi 202');
                            const isAgunan = !tujuan || tujuan.includes('agunan') || tujuan.includes('utang') || tujuan.includes('jaminan') || tujuan.includes('kredit');
                            const isLapKeuangan = tujuan.includes('keuangan') || tujuan.includes('psak') || tujuan.includes('revaluasi');
                            const isPengadaan = tujuan.includes('pengadaan tanah') || tujuan.includes('ganti kerugian');

                            if (isAgunan && includesLikuidasi) {
                              return \`
                                <p class="text-justify">
                                  Beberapa pemberi pinjaman membutuhkan penilaian dengan asumsi likuidasi atau menentukan batas waktu penjualan hipotesis dari properti. Karena harga dalam periode pemasaran akan tergantung dari kondisi saat penjualan terjadi. Asumsi Dasar Nilai dinyatakan sebagai Indikasi Nilai Likuidasi dan hanya berlaku pada tanggal penilaian dan mungkin tidak berlaku pada saat terjadinya kredit macet atau gagal bayar pembiayaan di masa yang akan datang, karena kondisi pasar dan keadaan penjualan dapat berbeda (SPI 202 butir 5.1.e), 2018).
                                </p>
                              \`;
                            } else if (isLapKeuangan) {
                              return \`
                                <p class="text-justify">
                                  Untuk kepentingan pelaporan keuangan, dasar nilai merujuk pada Nilai Wajar (Fair Value) sebagaimana diatur dalam Standar Penilaian Indonesia (SPI 102 butir 3.1) dan Standar Akuntansi Keuangan (SAK), yaitu harga yang akan diterima untuk menjual suatu aset atau harga yang akan dibayar untuk mengalihkan suatu liabilitas dalam transaksi teratur antara pelaku pasar pada tanggal pengukuran.
                                </p>
                              \`;
                            } else if (isPengadaan) {
                              return \`
                                <p class="text-justify">
                                  Untuk pengadaan tanah bagi kepentingan umum, dasar nilai yang digunakan adalah Nilai Penggantian Wajar (Fair Replacement Value) berpedoman pada SPI 204, yang mencakup penggantian atas kerugian fisik (tanah, bangunan, tanaman, sarana) dan kerugian non-fisik yang dapat dinilai secara wajar menurut ketentuan perundang-undangan.
                                </p>
                              \`;
                            } else {
                              return '';
                            }
                          })()}
                        </div>
                        
                        `;

    html = html.substring(0, k6Idx) + newK6 + newK7 + html.substring(k8Idx);
    console.log('✔ Successfully replaced Klausul 6 and Klausul 7 with Likuidasi consistency');
  }
}

// 3. Dokumen 3F (ETI) - Dynamic questionnaire answers & multi-personnel signatures
const etiHeaderMarker = '<!-- Tabel Kuesioner Independensi (Poin a s.d. g) Sesuai Excel -->';
const etiHeaderIdx = html.indexOf(etiHeaderMarker);
console.log('etiHeaderIdx found:', etiHeaderIdx);
if (etiHeaderIdx !== -1) {
  const etiDokEndMarker = '<!-- ----------------------------------------------------';
  const etiDokEndIdx = html.indexOf('DOKUMEN 3G: PERNYATAAN INDEPENDENSI (PI)', etiHeaderIdx);
  if (etiDokEndIdx !== -1) {
    const etiTableSnippet = html.substring(etiHeaderIdx, etiDokEndIdx);
    console.log('ETI table snippet len:', etiTableSnippet.length);

    const replacementEti = `<!-- Tabel Kuesioner Independensi (Poin a s.d. g) Sesuai Excel -->
                      \${(() => {
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
                      })()}

                      <!-- PERLINDUNGAN TANDA TANGAN ANTI-ORPHAN -->
                      <div class="signature-protection-wrapper">
                        <div class="klausul-penutup">
                          \${(() => {
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
                          })()}
                        </div>

                        <!-- Tanda Tangan Seluruh Tim (Yang Dievaluasi Multi-Personel) -->
                        <div class="signature-block-container avoid-break signature-block mt-2">
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
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        \`;
        htmlDocs.push(dok3F);
      }

      // ----------------------------------------------------
      // `;
    html = html.substring(0, etiHeaderIdx) + replacementEti + html.substring(etiDokEndIdx);
    console.log('✔ Successfully replaced Dokumen 3F with dynamic ETI questionnaire and multi-personnel signatures');
  }
}

// 4. Dokumen 3G (PI) - Multi-personnel 4-block signatures
const piSignTableMarker = '<table class="w-full text-center text-xs">';
const piSignTableIdx = html.indexOf(piSignTableMarker, html.indexOf('DOKUMEN 3G: PERNYATAAN INDEPENDENSI (PI)'));
console.log('piSignTableIdx found:', piSignTableIdx);
if (piSignTableIdx !== -1) {
  const piSignTableEnd = html.indexOf('</table>', piSignTableIdx);
  if (piSignTableEnd !== -1) {
    const newPiTable = `<table class="w-full text-center text-xs">
                            <tr>
                              <td class="w-1/4 align-top">
                                <p class="font-bold">Penilai Publik / Rekan,</p>
                                \${renderTtdOverlay()}
                                <p class="font-bold underline text-[10.5px]">\${rekanTampilan}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. MAPPI: \${rekanObj.mappi}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. Izin: \${rekanObj.izin}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. Register: \${rekanObj.rmk}</p>
                              </td>
                              <td class="w-1/4 align-top">
                                <p class="font-bold mb-10">Reviewer Mutu,</p>
                                <p class="font-bold underline text-[10.5px]">\${reviewerTampilan}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. MAPPI: \${viewReviewerMappi}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. Register: \${viewReviewerRmk}</p>
                              </td>
                              <td class="w-1/4 align-top">
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
                              </td>
                            </tr>
                          </table>`;
    html = html.substring(0, piSignTableIdx) + newPiTable + html.substring(piSignTableEnd + 8);
    console.log('✔ Successfully replaced Dokumen 3G signature table with multi-personnel support');
  }
}

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('Phase 3 CRLF-safe completed successfully!');
