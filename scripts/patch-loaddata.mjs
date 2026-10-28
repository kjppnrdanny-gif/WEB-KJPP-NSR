import fs from 'node:fs';

let file = fs.readFileSync('backend/job-tracking-handler.php', 'utf8');
let norm = file.replace(/\r\n/g, '\n');

const target = `            // Pastikan seluruh 5 kantor wilayah dari seed ada dalam database
            $updated = false;
            foreach ($initial as $k => $item) {
                if (!isset($json[$k])) {
                    $json[$k] = $item;
                    $updated = true;
                }
            }`;

const replacement = `            // Pastikan seluruh 5 kantor wilayah dari seed ada dalam database
            $updated = false;
            foreach ($initial as $k => $item) {
                if (!isset($json[$k])) {
                    $json[$k] = $item;
                    $updated = true;
                }
            }

            // Migrasi & Sinkronisasi SPI 103 untuk seluruh penugasan lama
            foreach ($json as $k => &$row) {
                if (!isset($row['pemberi_tugas'])) {
                    $row['pemberi_tugas'] = $row['instansi'] ?? 'PT Bank Tabungan Negara (Persero) Tbk';
                    $updated = true;
                }
                if (!isset($row['pengguna_laporan'])) {
                    $row['pengguna_laporan'] = $row['pemberi_tugas'];
                    $updated = true;
                }
                if (!isset($row['client_pic_name'])) {
                    $row['client_pic_name'] = $row['pic_pemohon'] ?? 'PIC Pemohon';
                    $updated = true;
                }
                if (!isset($row['client_pic_phone'])) {
                    $row['client_pic_phone'] = $row['pic_contact'] ?? '081288997766';
                    $updated = true;
                }
                if (!isset($row['survey_contact_name'])) {
                    $row['survey_contact_name'] = $row['debitur'] ?? 'Debitur / Pengelola';
                    $updated = true;
                }
                if (!isset($row['survey_contact_phone'])) {
                    $row['survey_contact_phone'] = '081388772211';
                    $updated = true;
                }
                if (!isset($row['klasifikasi_izin_objek'])) {
                    $row['klasifikasi_izin_objek'] = (stripos($row['jenis_properti'] ?? '', 'Pabrik') !== false || stripos($row['jenis_properti'] ?? '', 'Gudang') !== false || stripos($row['jenis_properti'] ?? '', 'Industri') !== false) ? 'P' : 'PS';
                    $updated = true;
                }
                if (!isset($row['tujuan_penilaian'])) {
                    $row['tujuan_penilaian'] = 'Penjaminan Utang / Agunan Kredit';
                    $updated = true;
                }
            }
            unset($row);`;

if (norm.includes(target)) {
  norm = norm.replace(target, replacement);
  fs.writeFileSync('backend/job-tracking-handler.php', norm.replace(/\n/g, '\r\n'), 'utf8');
  console.log('✓ Successfully patched loadData in backend/job-tracking-handler.php');
} else {
  console.log('Target not found in loadData');
}
