// scripts/apply-master-template-alignment.mjs
import fs from 'fs';

console.log('========================================================');
console.log('APPLY MASTER TEMPLATE ALIGNMENT & DYNAMIC NARRATIVE ENGINE');
console.log('========================================================\n');

let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. UPDATE KLAUSUL 4: OBJEK PENILAIAN DAN KEPEMILIKAN (ADAPTIVE HEADER & FOOTNOTE)
const k4MarkerStart = '<!-- 4. OBJEK PENILAIAN DAN KEPEMILIKAN -->';
const k4MarkerEnd = '<!-- 5. JENIS MATA UANG YANG DIGUNAKAN -->';

const idxK4Start = html.indexOf(k4MarkerStart);
const idxK4End = html.indexOf(k4MarkerEnd, idxK4Start);

if (idxK4Start === -1 || idxK4End === -1) {
  console.error('ERROR: Marker Klausul 4 tidak ditemukan!');
  process.exit(1);
}

const newKlausul4 = `<!-- 4. OBJEK PENILAIAN DAN KEPEMILIKAN (MASTER TEMPLATE ALIGNED) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">4. OBJEK PENILAIAN DAN KEPEMILIKAN</p>
                          \${!isMultiObjekLampiran ? \`
                            <p class="mb-2">Objek yang akan dinilai adalah berupa \${getLabelKategoriObjek(kategoriTemplate)} yaitu :</p>
                            \${(kategoriTemplate === 'PLANT_MACHINERY' || kategoriTemplate === 'VEHICLE' || (assetComp.hasPersonalProperty && !assetComp.hasRealProperty)) ? \`
                              <!-- Tabel Format Personal Properti (Mesin / Peralatan / Alat Berat / Kendaraan) Sesuai Master SPI -->
                              <table class="doc-table my-2 text-[10px]">
                                <thead>
                                  <tr>
                                    <th class="w-8 text-center">No</th>
                                    <th>Nama Debitur</th>
                                    <th>Jenis Objek</th>
                                    <th>Merek / Tipe / Spesifikasi</th>
                                    <th>No. Seri / No. Polisi / Thn</th>
                                    <th>Kapasitas / Qty</th>
                                    <th>Bukti Kepemilikan / Invoice</th>
                                    <th>Lokasi Objek</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  \${listObjek.map((o, idx) => \`
                                    <tr>
                                      <td class="text-center font-bold">\${idx + 1}</td>
                                      <td class="font-bold text-blue-900">\${p.debitur_nama}</td>
                                      <td><strong>\${getObjekNamaDisplay(o)}</strong></td>
                                      <td>\${formatObjekSpesifikasi(o)}</td>
                                      <td>\${o.no_seri || o.tahun || '-'}</td>
                                      <td class="text-center font-mono">\${o.kapasitas || '1 Unit'}</td>
                                      <td>\${formatObjekLegalitas(o, p)}</td>
                                      <td>\${o.lokasi || p.objek_lokasi || '-'}</td>
                                    </tr>
                                  \`).join('')}
                                </tbody>
                              </table>
                              <div class="text-[10px] text-slate-600 mt-2 space-y-0.5 italic">
                                <p><strong>Keterangan :</strong></p>
                                <p>Kuantitas, spesifikasi teknis, nomor identitas aset, dan kondisi mesin/peralatan/alat berat/kendaraan yang digunakan sebagai dasar penilaian adalah berdasarkan Fixed Asset Register (FAR), faktur pembelian, bukti perolehan yang sah, serta hasil verifikasi dan pemeriksaan fisik saat inspeksi lapangan.</p>
                                <p>Bukti kepemilikan dan dokumen teknis telah / akan disampaikan Pemberi Tugas setelah penawaran disetujui.</p>
                              </div>
                            \` : \`
                              <!-- Tabel Format Properti Real (Tanah & Bangunan) Sesuai Master Template Resmi KJPP NSR -->
                              <table class="doc-table my-2 text-[10px]">
                                <thead>
                                  <tr>
                                    <th class="w-8 text-center">No</th>
                                    <th>Nama Debitur</th>
                                    <th>Jenis Objek</th>
                                    <th>Luas Tanah (m²)</th>
                                    <th>Luas Bangunan (m²)</th>
                                    <th>Kepemilikan Tunggal / Bukti Legalitas</th>
                                    <th>Lokasi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  \${listObjek.map((o, idx) => \`
                                    <tr>
                                      <td class="text-center font-bold">\${idx + 1}</td>
                                      <td class="font-bold text-blue-900">\${p.debitur_nama}</td>
                                      <td><strong>\${getObjekNamaDisplay(o)}</strong></td>
                                      <td class="text-center font-mono font-semibold">\${o.lt || p.luas_tanah || '-'}</td>
                                      <td class="text-center font-mono font-semibold">\${o.lb || p.luas_bangunan || '-'}</td>
                                      <td>\${formatObjekLegalitas(o, p)}</td>
                                      <td>\${o.lokasi || p.objek_lokasi || '-'}</td>
                                    </tr>
                                  \`).join('')}
                                </tbody>
                              </table>
                              <div class="text-[10px] text-slate-600 mt-2 space-y-0.5 italic">
                                <p><strong>Keterangan :</strong></p>
                                <p>Luas tanah dan bangunan yang digunakan sebagai dasar penilaian adalah tanah berdasarkan sertifikat tanah atau bukti kepemilikan tanah lainnya. Bangunan berdasarkan hasil pengukuran pada saat inspeksi.</p>
                                <p>Bukti kepemilikan tanah akan disampaikan setelah penawaran disetujui.</p>
                              </div>
                            \`}
                          \` : \`
                            <p class="text-justify mb-2">
                              Objek yang dinilai merupakan portofolio \${getLabelKategoriObjek(kategoriTemplate)} (\${listObjek.length} objek penilaian) milik / atas nama <strong>\${p.debitur_nama}</strong>.
                            </p>
                            <div class="p-3 my-2 border border-slate-300 bg-slate-50 rounded text-slate-800 text-justify">
                              <p class="font-semibold text-slate-900 mb-1">Pengalihan Rincian ke Lampiran Resmi :</p>
                              <p>
                                Mengingat jumlah objek penilaian yang dinilai berjumlah lebih dari 3 (tiga) unit/bidang aset, maka rincian lengkap mengenai jenis objek, identitas teknis, status kepemilikan yuridis, serta lokasi persebaran objek penilaian secara mengikat dicantumkan pada <strong>Lampiran 1 (Daftar Objek Penilaian dan Kepemilikan)</strong> yang merupakan satu kesatuan dan bagian yang tidak terpisahkan dari Lingkup Penugasan ini.
                              </p>
                            </div>
                            <div class="text-[10px] text-slate-600 mt-2 space-y-0.5 italic">
                              <p><strong>Keterangan :</strong></p>
                              <p>Seluruh ketentuan, batasan tanggung jawab, maksud dan tujuan penilaian pada Lingkup Penugasan ini berlaku mengikat terhadap seluruh objek yang tercantum dalam Lampiran 1.</p>
                            </div>
                          \`}
                        </div>

                        `;

html = html.substring(0, idxK4Start) + newKlausul4 + html.substring(idxK4End);
console.log('✓ Klausul 4 diselaraskan dengan Master & Adaptive Personal/Real Property.');

// 2. UPDATE KLAUSUL 6 & 7: MAKSUD, TUJUAN & DASAR NILAI (DYNAMIC CONDITIONAL NARRATIVE)
const k6MarkerStart = '<!-- 6. MAKSUD DAN TUJUAN PENILAIAN -->';
const k7MarkerEnd = '<!-- 8. PENDEKATAN DAN METODOLOGI PENILAIAN -->';

const idxK6Start = html.indexOf(k6MarkerStart);
const idxK7End = html.indexOf(k7MarkerEnd, idxK6Start);

if (idxK6Start === -1 || idxK7End === -1) {
  console.error('ERROR: Marker Klausul 6/7 tidak ditemukan!');
  process.exit(1);
}

const newKlausul6Dan7 = `<!-- 6. MAKSUD DAN TUJUAN PENILAIAN (DYNAMIC PROFESSIONAL NARRATIVE) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">6. MAKSUD DAN TUJUAN PENILAIAN</p>
                          \${(() => {
                            const tujuan = (p.tujuan_penilaian || '').toLowerCase();
                            const isAgunan = !tujuan || tujuan.includes('agunan') || tujuan.includes('utang') || tujuan.includes('jaminan') || tujuan.includes('kredit');
                            const isLapKeuangan = tujuan.includes('keuangan') || tujuan.includes('psak') || tujuan.includes('revaluasi');
                            const isPengadaan = tujuan.includes('pengadaan tanah') || tujuan.includes('ganti kerugian');
                            const isJualBeli = tujuan.includes('jual') || tujuan.includes('beli') || tujuan.includes('transaksi');

                            if (isAgunan) {
                              return \`
                                <p class="text-justify mb-2">
                                  Penilaian ini dilaksanakan dengan maksud memberikan opini/pendapat mengenai <strong>Nilai Pasar dan Indikasi Nilai Likuidasi</strong> atas objek penilaian untuk tujuan <strong>\${p.tujuan_penilaian || 'Penjaminan Utang / Agunan Kredit'}</strong> pada <strong>\${p.pemberi_tugas_nama}</strong>.
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

                        <!-- 7. DASAR NILAI (MASTER TEMPLATE ALIGNED) -->
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
                            const isAgunan = !tujuan || tujuan.includes('agunan') || tujuan.includes('utang') || tujuan.includes('jaminan') || tujuan.includes('kredit');
                            const isLapKeuangan = tujuan.includes('keuangan') || tujuan.includes('psak') || tujuan.includes('revaluasi');
                            const isPengadaan = tujuan.includes('pengadaan tanah') || tujuan.includes('ganti kerugian');

                            if (isAgunan) {
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

html = html.substring(0, idxK6Start) + newKlausul6Dan7 + html.substring(idxK7End);
console.log('✓ Klausul 6 & 7 diselaraskan dengan Master & Dynamic Agunan/Nonagunan Logic.');

// 3. UPDATE KLAUSUL 8: TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN
const k8MarkerStart = '<!-- 8. PENDEKATAN DAN METODOLOGI PENILAIAN -->';
const k8MarkerEnd = '<!-- 9. TINGKAT KEDALAMAN INVESTIGASI -->';

const idxK8Start = html.indexOf(k8MarkerStart);
const idxK8End = html.indexOf(k8MarkerEnd, idxK8Start);

if (idxK8Start !== -1 && idxK8End !== -1) {
  const newKlausul8 = `<!-- 8. TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN (MASTER DOCX SECTION 8 & SPI 103) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">8. TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN</p>
                          <p class="text-justify mb-2">
                            <strong>Tanggal Penilaian :</strong> Tanggal penilaian yaitu tanggal pada saat nilai dinyatakan dan diberlakukan, ditetapkan pada tanggal dilaksanakannya inspeksi lapangan\${p.tanggal_penilaian ? \` (\${formatTanggalIndo(p.tanggal_penilaian)})\` : ''}.
                          </p>
                          \${getKlausul8Pendekatan(kategoriTemplate, p)}
                        </div>

                        `;
  html = html.substring(0, idxK8Start) + newKlausul8 + html.substring(idxK8End);
  console.log('✓ Klausul 8 diselaraskan dengan Master (Tanggal Penilaian & Pendekatan SPI 103).');
}

// 4. UPDATE KLAUSUL 11: ASUMSI DAN ASUMSI KHUSUS
const k11MarkerStart = '<!-- 11. ASUMSI DAN BATASAN PENUGASAN -->';
const k11MarkerEnd = '<!-- 12. PERSYARATAN ATAS PERSETUJUAN UNTUK PUBLIKASI -->';

const idxK11Start = html.indexOf(k11MarkerStart);
const idxK11End = html.indexOf(k11MarkerEnd, idxK11Start);

if (idxK11Start !== -1 && idxK11End !== -1) {
  const newKlausul11 = `<!-- 11. ASUMSI DAN ASUMSI KHUSUS (MASTER TEMPLATE ALIGNED) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">11. ASUMSI DAN ASUMSI KHUSUS</p>
                          \${getKlausul11Asumsi(kategoriTemplate, assetComp, p)}
                        </div>

                        `;
  html = html.substring(0, idxK11Start) + newKlausul11 + html.substring(idxK11End);
  console.log('✓ Klausul 11 diselaraskan dengan Master Title: ASUMSI DAN ASUMSI KHUSUS.');
}

// 5. UPDATE KLAUSUL 13: KONFIRMASI BAHWA PENILAIAN DILAKUKAN BERDASARKAN SPI
const k13MarkerStart = '<!-- 13. DOKUMEN DAN INFORMASI DARI PEMBERI TUGAS -->';
const k13MarkerEnd = '<!-- 14. LAPORAN PENILAIAN -->';

const idxK13Start = html.indexOf(k13MarkerStart);
const idxK13End = html.indexOf(k13MarkerEnd, idxK13Start);

if (idxK13Start !== -1 && idxK13End !== -1) {
  const newKlausul13 = `<!-- 13. KONFIRMASI BAHWA PENILAIAN DILAKUKAN BERDASARKAN SPI (MASTER DOCX SECTION 13) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">13. KONFIRMASI BAHWA PENILAIAN DILAKUKAN BERDASARKAN SPI</p>
                          <p class="text-justify mb-2">
                            Pekerjaan penilaian ini dilakukan berdasarkan <strong>Standar Penilaian Indonesia (SPI) Edisi VII - 2018</strong> serta <strong>Kode Etik Penilai Indonesia (KEPI)</strong> yang ditetapkan oleh Masyarakat Profesi Penilai Indonesia (MAPPI).
                          </p>
                          <p class="text-justify">
                            Penilai menjamin kepatuhan penuh terhadap standar teknis profesi, integritas, objektivitas, kompetensi profesional, serta prinsip kehati-hatian dalam seluruh tahapan investigasi, analisis kertas kerja, dan penyusunan opini nilai akhir.
                          </p>
                        </div>

                        `;
  html = html.substring(0, idxK13Start) + newKlausul13 + html.substring(idxK13End);
  console.log('✓ Klausul 13 diselaraskan dengan Master Section 13: KONFIRMASI BERDASARKAN SPI.');
}

// 6. UPDATE KLAUSUL 18: DATA-DATA YANG DIPERLUKAN
const k18MarkerStart = '<!-- 18. KELENGKAPAN DOKUMEN DAN DATA PENDUKUNG -->';
const k18MarkerEnd = '<!-- 19. HAK DAN KEWAJIBAN PARA PIHAK -->';

const idxK18Start = html.indexOf(k18MarkerStart);
const idxK18End = html.indexOf(k18MarkerEnd, idxK18Start);

if (idxK18Start !== -1 && idxK18End !== -1) {
  const newKlausul18 = `<!-- 18. DATA-DATA YANG DIPERLUKAN (MASTER DOCX SECTION 18) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">18. DATA-DATA YANG DIPERLUKAN</p>
                          <p class="mb-2">Data yang diperlukan dalam pelaksanaan pekerjaan ini adalah sebagai berikut :</p>
                          \${(kategoriTemplate === 'PLANT_MACHINERY' || kategoriTemplate === 'VEHICLE' || (assetComp.hasPersonalProperty && !assetComp.hasRealProperty)) ? \`
                            <!-- Rincian Data Dokumen Mesin / Alat Berat / Kendaraan -->
                            <ul class="list-disc pl-5 space-y-1 text-justify mb-2">
                              <li>Daftar Rincian Aset Tetap (<em>Fixed Asset Register / FAR</em>) lengkap memuat nomor seri pabrikan, merek, model, kapasitas, tahun pembuatan dan perolehan.</li>
                              <li>Copy Faktur / Invoice Pembelian, Kwitansi, Purchase Order (PO), atau Kontrak Pengadaan unit.</li>
                              <li>Copy Dokumen Pemberitahuan Impor Barang (PIB) dan Bukti Pembayaran Bea Masuk/Cukai (khusus unit impor).</li>
                              <li>Buku Manual Operasional dan Buku Log Pemeliharaan (<em>Maintenance &amp; Overhaul Log Book</em>).</li>
                              \${kategoriTemplate === 'VEHICLE' || assetComp.hasVehicle ? '<li>Copy Bukti Pemilikan Kendaraan Bermotor (BPKB), STNK, dan Buku Uji Berkala (Keur / KIR) yang masih berlaku.</li>' : ''}
                              <li>Surat Representasi mengenai kebenaran dan sifat informasi yang diberikan Pemberi Tugas (format terlampir).</li>
                              <li>Copy NPWP Pemberi Tugas / Debitur.</li>
                              <li>Dokumen-dokumen lain yang relevan.</li>
                              <li>Contact Person pendamping resmi di lapangan.</li>
                            </ul>
                          \` : \`
                            <!-- Rincian Data Dokumen Properti Real (Tanah & Bangunan) Sesuai Master Template -->
                            <ul class="list-disc pl-5 space-y-1 text-justify mb-2">
                              <li>Copy Dokumen Kepemilikan Tanah (Sertifikat Hak Milik / HGB / Hak Pakai / Girik / Akta Jual Beli) lengkap dengan gambar situasi / Surat Ukur.</li>
                              <li>Copy Izin Mendirikan Bangunan (IMB / PBG) dan Bukti Pembayaran PBB (NJOP) tahun terakhir.</li>
                              <li>Copy Denah dan Layout Bangunan (jika tersedia).</li>
                              <li>Surat Representasi mengenai kebenaran dan sifat informasi yang diberikan Pemberi Tugas (format terlampir).</li>
                              <li>Copy NPWP Pemberi Tugas / Debitur.</li>
                              <li>Dokumen-dokumen lain yang relevan.</li>
                              <li>Contact Person pendamping resmi di lapangan.</li>
                            </ul>
                          \`}
                          <p class="text-justify">
                            Pemberi Tugas wajib menyerahkan seluruh data dan dokumen sebagaimana diuraikan di atas paling lambat 2 (dua) hari kerja terhitung sejak Lingkup Penugasan ini disepakati dan ditandatangani. Apabila data belum lengkap atau terdapat perbedaan signifikan antara data tertulis dengan kondisi fisik di lapangan, maka jadwal pelaksanaan pekerjaan (SLA) akan disesuaikan secara proporsional.
                          </p>
                        </div>

                        `;
  html = html.substring(0, idxK18Start) + newKlausul18 + html.substring(idxK18End);
  console.log('✓ Klausul 18 diselaraskan dengan Master Section 18: DATA-DATA YANG DIPERLUKAN.');
}

// Write back to portal-penugasan-jo.html
fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('\nSUCCESS: Seluruh klausul Dokumen 1 berhasil diselaraskan dengan Master Template KJPP NSR.');
