import fs from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('portal-operasional.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const target = "document.getElementById('print-meta-perihal').innerText = `: ${doc.maksudTujuan || doc.survey?.namaKlien || doc.meeting?.agenda || doc.umum?.maksudTujuan || '-'}`;";
const addition = `
      const elWilayah = document.getElementById('print-meta-wilayah');
      if (elWilayah) elWilayah.innerText = (doc.survey?.wilayahSurveyLabel || doc.survey?.wilayahSurvey) ? \`: \${doc.survey.wilayahSurveyLabel || doc.survey.wilayahSurvey}\` : ': -';
      const elNolap = document.getElementById('print-meta-nolap');
      if (elNolap) elNolap.innerText = (doc.survey?.idPenugasan || doc.survey?.nomorLaporan) ? \`: \${doc.survey.idPenugasan || doc.survey.nomorLaporan}\` : ': -';`;

if (html.includes(target)) {
  html = html.replace(target, target + addition);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✓ Successfully added print-meta-wilayah & print-meta-nolap in siapkanDanCetakDokumen');
} else {
  console.error('Target not found');
}
