import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('portal-operasional.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const target = `if (doc.jenisOperasional === 'OPR-SRV' && doc.survey) {
        html += \`
          <div class="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-slate-800">
            <div><span class="text-slate-500">ID Penugasan:</span> <span class="font-mono text-amber-300">\${doc.survey.idPenugasan || '-'}</span></div>
            <div><span class="text-slate-500">No. Laporan:</span> <span class="font-mono text-slate-300">\${doc.survey.nomorLaporan || '-'}</span></div>
            <div class="col-span-2"><span class="text-slate-500">Klien &amp; Lokasi:</span> <span class="text-white">\${doc.survey.namaKlien || '-'} (\${doc.survey.lokasiObjek || '-'})</span></div>
          </div>
          <div class="flex justify-between items-center text-xs pt-1">
            <span class="text-slate-400">Subtotal Biaya Personal:</span>
            <span class="font-mono font-bold text-slate-200">\${formatRupiah(doc.survey.subtotalPersonal || 0)}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400">Subtotal Biaya Kolektif:</span>
            <span class="font-mono font-bold text-slate-200">\${formatRupiah(doc.survey.subtotalKolektif || 0)}</span>
          </div>
        \`;`;

const replacement = `if (doc.jenisOperasional === 'OPR-SRV' && doc.survey) {
        let rincianItemsHtml = '';
        if (doc.survey.biayaPersonal && doc.survey.biayaPersonal.length > 0) {
          rincianItemsHtml += '<div class="space-y-1 pt-1.5"><span class="text-[10px] font-bold uppercase text-amber-400 block tracking-wider">Rincian Allowance Personal:</span>';
          doc.survey.biayaPersonal.forEach(p => {
            const jml = p.jumlahPersonel || 1;
            const dur = p.durasi ?? p.volume ?? 1;
            const sat = p.satuan || 'Hari';
            const trf = p.tarif || 0;
            const tot = p.total ?? (jml * dur * trf);
            rincianItemsHtml += \`
              <div class="flex justify-between text-[11px] bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                <span class="text-slate-200">\${p.uraian || 'Allowance'} <span class="text-slate-400 font-mono">(\${jml} Org &times; \${dur} \${sat} @ \${formatRupiah(trf)})</span></span>
                <span class="font-mono font-bold text-amber-300">\${formatRupiah(tot)}</span>
              </div>
            \`;
          });
          rincianItemsHtml += '</div>';
        }

        if (doc.survey.biayaKolektif && doc.survey.biayaKolektif.length > 0) {
          rincianItemsHtml += '<div class="space-y-1 pt-1.5"><span class="text-[10px] font-bold uppercase text-sky-400 block tracking-wider">Rincian Biaya Kolektif:</span>';
          doc.survey.biayaKolektif.forEach(k => {
            const vol = k.volume || 1;
            const sat = k.satuan || 'Paket';
            const trf = k.tarif || 0;
            const tot = k.total ?? (vol * trf);
            rincianItemsHtml += \`
              <div class="flex justify-between text-[11px] bg-slate-950/60 px-2 py-1 rounded border border-slate-800/80">
                <span class="text-slate-200">\${k.uraian || 'Biaya Kolektif'} <span class="text-slate-400 font-mono">(\${vol} \${sat} @ \${formatRupiah(trf)})</span></span>
                <span class="font-mono font-bold text-sky-300">\${formatRupiah(tot)}</span>
              </div>
            \`;
          });
          rincianItemsHtml += '</div>';
        }

        html += \`
          <div class="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-slate-800">
            <div><span class="text-slate-500">ID Penugasan:</span> <span class="font-mono text-amber-300">\${doc.survey.idPenugasan || '-'}</span></div>
            <div><span class="text-slate-500">No. Laporan:</span> <span class="font-mono text-slate-300">\${doc.survey.nomorLaporan || '-'}</span></div>
            <div><span class="text-slate-500">Wilayah Survey:</span> <span class="font-bold text-amber-300">\${doc.survey.wilayahSurveyLabel || doc.survey.wilayahSurvey || 'Jabodetabek'}</span></div>
            <div><span class="text-slate-500">Snapshot Versi:</span> <span class="font-mono text-slate-300">\${doc.survey.tarifSnapshot?.versi || '2026.1'}</span></div>
            <div class="col-span-2"><span class="text-slate-500">Klien &amp; Lokasi:</span> <span class="text-white font-medium">\${doc.survey.namaKlien || '-'} (\${doc.survey.lokasiObjek || '-'})</span></div>
          </div>
          \${rincianItemsHtml}
          <div class="flex justify-between items-center text-xs pt-2 border-t border-slate-800">
            <span class="text-slate-400">Subtotal Biaya Personal:</span>
            <span class="font-mono font-bold text-slate-200">\${formatRupiah(doc.survey.subtotalPersonal || 0)}</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-slate-400">Subtotal Biaya Kolektif:</span>
            <span class="font-mono font-bold text-slate-200">\${formatRupiah(doc.survey.subtotalKolektif || 0)}</span>
          </div>
        \`;`;

// Find and replace
const p1 = html.indexOf("if (doc.jenisOperasional === 'OPR-SRV' && doc.survey) {");
const p2 = html.indexOf("} else if (doc.jenisOperasional === 'OPR-MTG' && doc.meeting) {", p1);

if (p1 !== -1 && p2 !== -1) {
  html = html.substring(0, p1) + replacement + '\n      ' + html.substring(p2);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✓ Successfully enhanced renderModalBiaya with detailed allowance breakdown');
} else {
  console.error('Could not locate renderModalBiaya survey block');
  process.exit(1);
}
