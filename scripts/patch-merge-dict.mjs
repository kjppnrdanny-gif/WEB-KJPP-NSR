import fs from 'fs';

let content = fs.readFileSync('merge-tags-engine.php', 'utf8');

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

const needle = toCrlf(`        '{{nomor_ijin_penilai}}'     => sanitizeMergeTagValue($izin),
        '{{kode_cabang}}'            => sanitizeMergeTagValue($record['cabang'] ?? 'Pusat')
    ];`);

const replacement = toCrlf(`        '{{nomor_ijin_penilai}}'     => sanitizeMergeTagValue($izin),
        '{{kode_cabang}}'            => sanitizeMergeTagValue($record['cabang'] ?? 'Pusat'),
        '{{sub_header_cabang}}'      => (empty($record['cabang']) || strcasecmp(trim($record['cabang']), 'Pusat') === 0 || strcasecmp(trim($record['cabang']), 'Jakarta') === 0) ? '' : ' | Kantor Cabang ' . sanitizeMergeTagValue($record['cabang']),
        '{{wilayah_operasional}}'    => (empty($record['cabang']) || strcasecmp(trim($record['cabang']), 'Pusat') === 0 || strcasecmp(trim($record['cabang']), 'Jakarta') === 0) ? 'Kantor Pusat' : 'Kantor Cabang ' . sanitizeMergeTagValue($record['cabang'])
    ];`);

if (content.includes(needle)) {
  content = content.replace(needle, replacement);
  fs.writeFileSync('merge-tags-engine.php', content, 'utf8');
  console.log('✔ Dictionary in merge-tags-engine.php successfully updated with CRLF.');
} else {
  console.error('✘ needle still not found!');
}
