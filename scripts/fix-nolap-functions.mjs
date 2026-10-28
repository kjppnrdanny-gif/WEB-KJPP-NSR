import fs from 'fs';

let nolap = fs.readFileSync('nolap-data-handler.php', 'utf8').replace(/\r\n/g, '\n');

// 1. Ganti resolveKodeIndustri & tambahkan resolveKodeNpwpKlien
const targetIndustriFunc = `function resolveKodeIndustri($inputKode) {
    $clean = str_pad(preg_replace('/\\D/', '', (string)$inputKode), 2, '0', STR_PAD_LEFT);
    $intVal = (int)$clean;
    if ($intVal >= 1 && $intVal <= 12) {
        return $clean;
    }
    return '07'; // Default Sektor 07 Perbankan KJPP NSR
}`;

const replacementIndustriFunc = `function resolveKodeIndustri($inputKode) {
    if ($inputKode === null || trim((string)$inputKode) === '' || trim((string)$inputKode) === '--') {
        return null;
    }
    $clean = str_pad(preg_replace('/\\D/', '', (string)$inputKode), 2, '0', STR_PAD_LEFT);
    $intVal = (int)$clean;
    if ($intVal >= 1 && $intVal <= 12) {
        return $clean;
    }
    return null; // DILARANG KERAS FALLBACK DIAM-DIAM KE '07'! Harus null jika di luar rentang master 01-12.
}

function resolveKodeNpwpKlien($npwpRaw, $statusNpwp = '') {
    if ($npwpRaw === '1' || $npwpRaw === 1 || $statusNpwp === 'BER_NPWP' || $statusNpwp === '1') {
        return '1';
    }
    if ($npwpRaw === '0' || $npwpRaw === 0 || $statusNpwp === 'NON_NPWP' || $statusNpwp === '0') {
        return '0';
    }
    if ($npwpRaw !== null && trim((string)$npwpRaw) !== '' && trim((string)$npwpRaw) !== '-') {
        $str = strtolower(trim((string)$npwpRaw));
        if (strpos($str, 'non') !== false || strpos($str, 'tidak') !== false || strpos($str, 'tanpa') !== false) {
            return '0';
        }
        $cleanDigits = preg_replace('/\\D/', '', (string)$npwpRaw);
        if (strlen($cleanDigits) >= 10) {
            return '1';
        }
    }
    return '0';
}`;

if (nolap.includes(targetIndustriFunc)) {
  nolap = nolap.replace(targetIndustriFunc, replacementIndustriFunc);
  console.log('✔ resolveKodeIndustri & resolveKodeNpwpKlien replaced');
} else {
  console.log('❌ resolveKodeIndustri not found');
}

// 2. Ganti generator nomor definitif di issueDefinitiveNoLap
const targetGenNoLap = `$targetSektor = resolveKodeIndustri($dgRecords[$targetIdx]['penugasan']['kodeIndustri'] ?? '07');
            // P0 COMPLIANCE: Segmen 3 HANYA boleh PI, BS, atau PP (Dilarang keras PS!)
            if ($reportServiceCode === 'PS') { $reportServiceCode = 'PI'; }
            $noDefinitif = "{$seq}/{$signingCode}/{$reportServiceCode}/{$targetSektor}/{$penilaiIzin}/1/{$romawiBulan}/" . date('Y');`;

const replacementGenNoLap = `$rawInd = $dgRecords[$targetIdx]['penugasan']['kodeIndustri'] ?? ($dgRecords[$targetIdx]['kodeIndustri'] ?? '');
            $targetSektor = resolveKodeIndustri($rawInd);
            if (!$targetSektor) {
                if (isset($fpLock) && $fpLock) { flock($fpLock, LOCK_UN); fclose($fpLock); }
                http_response_code(422);
                echo json_encode([
                    'success' => false,
                    'error' => "Validasi Kode Industri Gagal: Kode sektor industri penugasan ('{$rawInd}') tidak valid atau kosong. Wajib dipilih dari master 01-12.",
                    'violation' => 'INVALID_OR_MISSING_INDUSTRY_CODE'
                ]);
                exit;
            }
            // P0 COMPLIANCE: Segmen 3 HANYA boleh PI, BS, atau PP (Dilarang keras PS!)
            if ($reportServiceCode === 'PS') { $reportServiceCode = 'PI'; }
            // P0 KODE NPWP: Segmen 6 wajib bernilai '1' atau '0' dinamis dari status NPWP terverifikasi
            $rawNpwp = $dgRecords[$targetIdx]['klien']['npwp'] ?? ($dgRecords[$targetIdx]['npwp'] ?? ($dgRecords[$targetIdx]['penugasan']['kodeNpwp'] ?? ($dgRecords[$targetIdx]['penugasan']['npwp'] ?? '')));
            $stNpwp = $dgRecords[$targetIdx]['klien']['statusNpwp'] ?? ($dgRecords[$targetIdx]['penugasan']['statusNpwp'] ?? '');
            $targetKodeNpwp = resolveKodeNpwpKlien($rawNpwp, $stNpwp);
            $noDefinitif = "{$seq}/{$signingCode}/{$reportServiceCode}/{$targetSektor}/{$penilaiIzin}/{$targetKodeNpwp}/{$romawiBulan}/" . date('Y');`;

if (nolap.includes(targetGenNoLap)) {
  nolap = nolap.replace(targetGenNoLap, replacementGenNoLap);
  console.log('✔ issueDefinitiveNoLap generator updated with dynamic NPWP and strict industry');
} else {
  console.log('❌ targetGenNoLap not found');
}

fs.writeFileSync('nolap-data-handler.php', nolap, 'utf8');
