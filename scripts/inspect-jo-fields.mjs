import fs from 'node:fs';

const html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

const queries = [
  'Jenis Laporan Penilaian',
  'Nomor SPK',
  'Nomor JO',
  'Kantor Wilayah Operasional',
  'Tanggal Surat',
  'Section 01',
  'Section 05',
  'Section 08',
  'publishOfficialLP',
  'LAST_NO_LP_SPK',
  'LAST_NO_ADM_JO',
  '0001/NSR-PST/PN-APP/X/2026',
  '0416/NSR/PN-APP/X/2026'
];

for (const q of queries) {
  let count = 0;
  let pos = 0;
  let firstIdx = -1;
  while ((pos = html.indexOf(q, pos)) !== -1) {
    if (count === 0) firstIdx = pos;
    count++;
    pos += q.length;
  }
  console.log(`Query "${q}": found ${count} times, first at index ${firstIdx}`);
  if (count > 0 && count <= 3) {
    console.log(`Snippet around "${q}":\n`, html.substring(Math.max(0, firstIdx - 150), Math.min(html.length, firstIdx + 250)));
    console.log('----------------------------------------------------');
  }
}
