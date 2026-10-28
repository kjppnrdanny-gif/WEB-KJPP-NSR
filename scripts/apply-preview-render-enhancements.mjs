import fs from 'fs';

console.log('=== Mengupdate Render Dokumen Preview Tab 3 ===');

let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. Update Klausul 3 Pengguna Laporan render
const oldKlausul3Start = '<!-- 3. PENGGUNA LAPORAN -->';
const oldKlausul3EndMarker = '<!-- 4. OBJEK PENILAIAN DAN KEPEMILIKAN -->';

const idxK3Start = html.indexOf(oldKlausul3Start);
const idxK3End = html.indexOf(oldKlausul3EndMarker, idxK3Start);

if (idxK3Start === -1 || idxK3End === -1) {
  console.error('ERROR: Marker Klausul 3 tidak ditemukan!');
  process.exit(1);
}

const newKlausul3Code = `<!-- 3. PENGGUNA LAPORAN (SPI 103 Klausul 3) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">3. PENGGUNA LAPORAN</p>
                          <div class="pl-4 space-y-3">
                            <div>
                              <p class="font-bold text-slate-800">a. Pengguna Laporan Utama :</p>
                              <table class="doc-table-clean pl-4" style="width: auto;">
                                <tr><td class="w-52 font-semibold">Nama Instansi</td><td class="w-3">:</td><td class="font-bold">\${p.pengguna_laporan_a_nama || (p.pengguna_laporan_a ? p.pengguna_laporan_a.split(', Alamat:')[0] : p.pemberi_tugas_nama)}</td></tr>
                                <tr><td class="font-semibold">Alamat Kantor</td><td>:</td><td>\${p.pengguna_laporan_a_alamat || (p.pengguna_laporan_a && p.pengguna_laporan_a.includes(', Alamat:') ? p.pengguna_laporan_a.split(', Alamat:')[1] : (p.pemberi_tugas_alamat || '-'))}</td></tr>
                                <tr><td class="font-semibold">PIC / Penanggung Jawab</td><td>:</td><td>\${p.pengguna_laporan_a_pic || p.pemberi_tugas_pic || '-'}</td></tr>
                                <tr><td class="font-semibold">Jabatan PIC</td><td>:</td><td>\${p.pengguna_laporan_a_jabatan || p.pemberi_tugas_jabatan || '-'}</td></tr>
                                <tr><td class="font-semibold">No. Telepon / WhatsApp</td><td>:</td><td>\${p.pengguna_laporan_a_kontak || p.pemberi_tugas_kontak || p.pemberi_tugas_telp || '-'}</td></tr>
                                <tr><td class="font-semibold">Email Aktif</td><td>:</td><td>\${p.pengguna_laporan_a_email || p.pemberi_tugas_email || '-'}</td></tr>
                                <tr><td class="font-semibold">Bidang Usaha</td><td>:</td><td>\${p.pengguna_laporan_a_bidang || p.pemberi_tugas_bidang || 'Perbankan / Finansial'}</td></tr>
                              </table>
                            </div>
                            <div>
                              <p class="font-bold text-slate-800">b. Pengguna Laporan Tambahan / Debitur :</p>
                              \${p.pengguna_laporan_b && p.pengguna_laporan_b !== '-' ? \`
                              <table class="doc-table-clean pl-4" style="width: auto;">
                                <tr><td class="w-52 font-semibold">Nama</td><td class="w-3">:</td><td class="font-bold">\${p.pengguna_laporan_b_nama || p.pengguna_laporan_b.split(', Alamat:')[0]}</td></tr>
                                <tr><td class="font-semibold">Alamat</td><td>:</td><td>\${p.pengguna_laporan_b_alamat || (p.pengguna_laporan_b.includes(', Alamat:') ? p.pengguna_laporan_b.split(', Alamat:')[1] : (p.pengguna_b_alamat || '-'))}</td></tr>
                                <tr><td class="font-semibold">Keterangan / Status</td><td>:</td><td>\${p.pengguna_b_pic || 'Debitur / Pihak Berkepentingan'}</td></tr>
                              </table>
                              \` : \`
                              <p class="pl-4 text-slate-600">- (Tidak ada pihak pengguna laporan tambahan)</p>
                              \`}
                            </div>
                          </div>
                        </div>

                        `;

html = html.substring(0, idxK3Start) + newKlausul3Code + html.substring(idxK3End);

// 2. Update Klausul 21 Biaya Jasa Penilaian render
const oldKlausul21Start = '<!-- 21. BIAYA JASA PENILAIAN -->';
const oldKlausul21EndMarker = '<!-- 22. CARA PEMBAYARAN -->';

const idxK21Start = html.indexOf(oldKlausul21Start);
const idxK21End = html.indexOf(oldKlausul21EndMarker, idxK21Start);

if (idxK21Start !== -1 && idxK21End !== -1) {
  const newKlausul21Code = `<!-- 21. BIAYA JASA PENILAIAN (SPI 103) -->
                        <div class="klausul-item avoid-break">
                          <p class="klausul-header font-bold border-b border-slate-900 pb-1 mb-2 uppercase tracking-wide">21. BIAYA JASA PENILAIAN</p>
                          <p class="text-justify mb-2">
                            Dalam menentukan besarnya biaya atas jasa penilaian, kami tidak mengkaitkannya dengan besarnya nilai objek yang tercakup dalam penilaian, tetapi berdasarkan pada perhitungan beban kerja, kompetensi teknis, serta alokasi waktu kerja dari masing-masing personil penilai yang melaksanakan pekerjaan.
                          </p>
                          \${p.biaya_belum_disepakati || p.biaya_total === 'Belum Disepakati' ? \`
                            <div class="p-3 my-2 border border-amber-300 bg-amber-50 rounded text-slate-800 text-justify">
                              <p class="font-bold text-amber-900 mb-1">Status Biaya: Dalam Tahap Penawaran / Belum Disepakati Final</p>
                              <p class="text-xs">
                                Besaran Biaya Jasa Penilaian masih dalam proses konfirmasi teknis dan akan dituangkan secara definitif melalui Surat Penawaran Biaya Jasa (Fee Proposal) serta addendum tertulis yang disepakati Para Pihak.
                              </p>
                            </div>
                          \` : \`
                            <table class="doc-table-clean pl-4 mb-2" style="width: auto;">
                              <tr><td class="w-56 font-semibold">Honorarium Jasa (Professional Fee)</td><td class="w-3">:</td><td><strong>Rp \${feeDppText}</strong></td></tr>
                              \${p.biaya_transportasi && p.status_transportasi === 'EXCLUDED' ? \`<tr><td class="font-semibold">Transportasi Lapangan</td><td>:</td><td>Rp \${formatRupiah(p.biaya_transportasi)} (Ditagihkan Terpisah)</td></tr>\` : ''}
                              \${p.biaya_akomodasi && p.status_akomodasi === 'EXCLUDED' ? \`<tr><td class="font-semibold">Akomodasi &amp; Penginapan</td><td>:</td><td>Rp \${formatRupiah(p.biaya_akomodasi)} (Ditagihkan Terpisah)</td></tr>\` : ''}
                              <tr><td class="font-semibold">Pajak Pertambahan Nilai (PPN 11%)</td><td>:</td><td><strong>Rp \${feePpnText}</strong></td></tr>
                              <tr class="font-bold border-t border-slate-300"><td>Total Biaya Penugasan (All In)</td><td>:</td><td>Rp \${feeTotalText}</td></tr>
                            </table>
                            <p class="pl-4 italic">(\${terbilangText})</p>
                          \`}
                        </div>

                        `;
  html = html.substring(0, idxK21Start) + newKlausul21Code + html.substring(idxK21End);
}

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('✓ Dokumen Preview Tab 3 berhasil diperbarui.');
