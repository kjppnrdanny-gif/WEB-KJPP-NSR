import fs from 'fs';

let content = fs.readFileSync('merge-tags-engine.php', 'utf8');

// 1. Standardize name in merge-tags-engine.php
content = content.replace(/KJPP\s+NANANG\s+RAHAYU\s*&\s*REKAN/g, 'KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN');
content = content.replace(/KJPP\s+NANANG\s+RAHAYU\s*&amp;\s*REKAN/g, 'KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN');
content = content.replace(/KJPP\s+NANANG\s+RAHAYU\s+SIGIT\s+PARYANTO\s*&\s*REKAN/g, 'KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN');
content = content.replace(/KJPP\s+NANANG\s+RAHAYU\s+SIGIT\s+PARYANTO\s*&amp;\s*REKAN/g, 'KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN');

// 2. Add tags for sub_header_cabang and wilayah_operasional in buildMergeTagsDictionary
const dictNeedle = `        '{{nomor_ijin_penilai}}'     => sanitizeMergeTagValue($izin),
        '{{kode_cabang}}'            => sanitizeMergeTagValue($record['cabang'] ?? 'Pusat')
    ];`;

const dictReplacement = `        '{{nomor_ijin_penilai}}'     => sanitizeMergeTagValue($izin),
        '{{kode_cabang}}'            => sanitizeMergeTagValue($record['cabang'] ?? 'Pusat'),
        '{{sub_header_cabang}}'      => (empty($record['cabang']) || strcasecmp(trim($record['cabang']), 'Pusat') === 0 || strcasecmp(trim($record['cabang']), 'Jakarta') === 0) ? '' : ' | Kantor Cabang ' . sanitizeMergeTagValue($record['cabang']),
        '{{wilayah_operasional}}'    => (empty($record['cabang']) || strcasecmp(trim($record['cabang']), 'Pusat') === 0 || strcasecmp(trim($record['cabang']), 'Jakarta') === 0) ? 'Kantor Pusat' : 'Kantor Cabang ' . sanitizeMergeTagValue($record['cabang'])
    ];`;

if (content.includes(dictNeedle)) {
  content = content.replace(dictNeedle, dictReplacement);
  console.log('✔ Updated buildMergeTagsDictionary with {{sub_header_cabang}} and {{wilayah_operasional}}');
} else {
  console.error('✘ dictNeedle not found in merge-tags-engine.php');
}

// 3. Update Surat Tugas template
content = content.replace(
  'Izin Usaha Kantor Jasa Penilai Publik No. 2.19.0160 | Cabang: {{kode_cabang}}',
  'Izin Usaha Kemenkeu No. 2.19.0160{{sub_header_cabang}}'
);

// 4. Update QA Checklist template
content = content.replace(
  '<div>Cabang: {{kode_cabang}}</div>',
  '<div>{{wilayah_operasional}}</div>'
);

// 5. Update Tanda Terima template
content = content.replace(
  'Izin Usaha Kemenkeu No. 2.19.0160 | Cabang: {{kode_cabang}}',
  'Izin Usaha Kemenkeu No. 2.19.0160{{sub_header_cabang}}'
);

fs.writeFileSync('merge-tags-engine.php', content, 'utf8');
console.log('✔ merge-tags-engine.php successfully updated.');
