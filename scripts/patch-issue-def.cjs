const fs = require('fs');

let code = fs.readFileSync('nolap-data-handler.php', 'utf8');

// Match lines around issueDefinitiveNoLap
const targetRegex = /\/\/ Tentukan nomor definitif: Gunakan nomor yang disediakan atau generate unik 7 segmen[\r\n]+(\s*)\$noDefinitif = trim\(\$payload\['nomorLaporan'\] \?\? ''\);[\r\n]+(\s*)if \(empty\(\$noDefinitif\)\) \{[\s\S]*?\$noDefinitif = "{\$seq}\/{\$signingCode}\/PI\/07\/{\$penilaiIzin}\/1\/{\$romawiBulan}\/" \. date\('Y'\);[\r\n]+(\s*)\}/;

const replacement = `// Tentukan kantor penandatangan resmi
        $signingCode = $dgRecords[$targetIdx]['penugasan']['signingOfficeCode'] ?? $dgRecords[$targetIdx]['signing_office_code'] ?? '2.0160-00';
        $signingOffice = ($signingCode === '2.0160-00') ? 'Pusat' : ($dgRecords[$targetIdx]['kantorAsal'] ?? 'Pusat');
        foreach ($OFFICIAL_BRANCH_CODES as $kName => $kCode) {
            if ($kCode === $signingCode) { $signingOffice = $kName; break; }
        }

        // Tentukan nomor definitif: Gunakan nomor yang disediakan atau generate unik 7 segmen berbasis register
        $noDefinitif = trim($payload['nomorLaporan'] ?? '');
        if (empty($noDefinitif)) {
            $regListForSeq = muatRegisterConfig($registerConfigFile);
            $candidateSeq = '';
            foreach ($regListForSeq as $r) {
                if (strcasecmp($r['kantor'] ?? '', $signingOffice) === 0 &&
                    strcasecmp($r['jenisDokumen'] ?? '', 'NoLap') === 0 &&
                    strcasecmp($r['periode'] ?? '', date('Y')) === 0) {
                    $nextCandidate = (int)($r['kandidatBerikutnya'] ?? 1);
                    $usedList = $r['nomorTerpakai'] ?? [];
                    while (in_array(str_pad($nextCandidate, 5, '0', STR_PAD_LEFT), $usedList, true)) {
                        $nextCandidate++;
                    }
                    $candidateSeq = str_pad($nextCandidate, 5, '0', STR_PAD_LEFT);
                    break;
                }
            }
            if (empty($candidateSeq)) {
                $candidateSeq = str_pad(count($dgRecords) + 600, 5, '0', STR_PAD_LEFT);
            }
            $seq = $candidateSeq;
            $romawiBulan = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][(int)date('n') - 1];
            $penilaiIzin = $dgRecords[$targetIdx]['penugasan']['appraiserLicenseCode'] ?? ((($dgRecords[$targetIdx]['penugasan']['penilaiPublikId'] ?? '') === 'nanang_penilai') ? '0218' : '00581');
            $noDefinitif = "{$seq}/{$signingCode}/PI/07/{$penilaiIzin}/1/{$romawiBulan}/" . date('Y');
        }`;

if (!targetRegex.test(code)) {
  console.error('Target regex did not match in nolap-data-handler.php!');
  process.exit(1);
}

code = code.replace(targetRegex, replacement);
fs.writeFileSync('nolap-data-handler.php', code, 'utf8');
console.log('Successfully patched nolap-data-handler.php with register-aware sequence generator!');
