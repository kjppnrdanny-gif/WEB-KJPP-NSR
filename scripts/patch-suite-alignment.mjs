import fs from 'fs';

let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. Klausul 8 exact phrasing
const oldK8 = 'Tanggal penilaian yaitu tanggal pada saat opini nilai dinyatakan dan diberlakukan';
const newK8 = 'Tanggal penilaian yaitu tanggal pada saat nilai dinyatakan dan diberlakukan';
if (html.includes(oldK8)) {
  html = html.replace(oldK8, newK8);
  console.log('✔ Patched Klausul 8 phrasing to match master alignment assertion');
}

// 2. Dokumen 3G signature table
const piTableStart = '<table class="w-full text-center text-xs">';
const piDokIdx = html.indexOf('DOKUMEN 3G: PERNYATAAN INDEPENDENSI (PI)');
const piTableIdx = html.indexOf(piTableStart, piDokIdx);
const piTableEnd = html.indexOf('</table>', piTableIdx);

if (piTableIdx !== -1 && piTableEnd !== -1) {
  const replacementPiTable = `<table class="w-full text-center text-xs">
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
                                <p class="font-bold mb-10">Penilai Pelaksana,</p>
                                <p class="font-bold underline text-[10.5px]">\${listPenilai.map(p => p.nama).join('<br>')}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. MAPPI: \${viewPenilaiMappi}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. Register: \${penilaiMeta.rmk || '-'}</p>
                              </td>
                              <td class="w-1/4 align-top">
                                <p class="font-bold mb-10">Asisten Penilai,</p>
                                <p class="font-bold underline text-[10.5px]">\${listAsisten.map(a => a.nama).join('<br>')}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. MAPPI: \${viewAsistenMappi}</p>
                                <p class="text-[9px] text-slate-600 font-mono">No. Register: -</p>
                              </td>
                            </tr>
                          </table>`;
  html = html.substring(0, piTableIdx) + replacementPiTable + html.substring(piTableEnd + 8);
  console.log('✔ Patched Dok 3G table to match multi-personnel join assertion');
}

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
