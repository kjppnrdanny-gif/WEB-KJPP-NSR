import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('nolap-data-handler.php');
let content = fs.readFileSync(filePath, 'utf8');

const searchStr = 'function evaluasiKonsistensiGerbang2Engine($record, $payloadAkhir)';
const idx = content.indexOf(searchStr);
if (idx === -1) {
  console.error('searchStr not found');
  process.exit(1);
}
const endSearchStr = 'function muatDatabaseDualGate($dbFile)';
const endIdx = content.indexOf(endSearchStr, idx);
if (endIdx === -1) {
  console.error('endSearchStr not found');
  process.exit(1);
}

const newFunction = `function evaluasiKonsistensiGerbang2Engine($record, $payloadAkhir) {
    $checklistAkhir = $payloadAkhir['checklistAkhir'] ?? [];
    $deltaAnalysis = $payloadAkhir['deltaAnalysis'] ?? [];
    $fotoGeotagLengkap = !empty($checklistAkhir['fotoGeotagLengkap']);
    $tigaPembandingTersedia = !empty($checklistAkhir['tigaPembandingTersedia']);
    $hasUnjustifiedDev = !empty($deltaAnalysis['deviasiMaterialTanpaJustifikasi']) && $deltaAnalysis['deviasiMaterialTanpaJustifikasi'] === true;

    // Evaluasi Luas Fisik vs Yuridis (Kalkulator Diagnostik Faktual Internal KJPP NSR)
    $luasYuridis = (float)($deltaAnalysis['luasYuridis'] ?? 0);
    $luasFisik = (float)($deltaAnalysis['luasFisik'] ?? 0);
    $persenDeviasi = 0;
    if ($luasYuridis > 0 && $luasFisik > 0) {
        $persenDeviasi = round((abs($luasFisik - $luasYuridis) / $luasYuridis) * 100, 2);
    }

    $outcome = 'CONSISTENT_AND_VERIFIED';
    $escalationLevel = 'NORMAL';
    $reasons = [];

    // 1. Audit Red Flag Legalitas (Sengketa, Sita, Pemblokiran BPN, atau Perkara Yuridis)
    // Sesuai prinsip hukum, risiko legalitas memicu HOLD secara mandiri terlepas dari persentase deviasi luas fisik.
    $redFlagLegalitas = !empty($checklistAkhir['redFlagLegalitas']) || 
                        !empty($deltaAnalysis['redFlagLegalitas']) ||
                        !empty($deltaAnalysis['isSengketa']) ||
                        !empty($deltaAnalysis['isSitaBlokir']);

    if ($redFlagLegalitas) {
        $outcome = 'HOLD_LEGAL_ISSUE';
        $escalationLevel = 'HOLD_PENDING_MITIGATION';
        $reasons[] = 'Terdeteksi Red Flag Legalitas (sengketa kepemilikan/blokir BPN/sita eksekusi/perkara hukum). Penugasan wajib di-HOLD untuk mitigasi risiko hukum sesuai prinsip SPI 103 & 105.';
    }

    // 2. Evaluasi Materialitas Deviasi Luas (Kalkulator Faktual & Pertimbangan Profesional KPUP 14)
    $hasJustifikasi = !empty($deltaAnalysis['justifikasiPenilai']) || !empty($deltaAnalysis['keterangan']) || !empty($payloadAkhir['baiUrl']) || !empty($deltaAnalysis['baiUrl']);

    if (!$redFlagLegalitas) {
        if ($persenDeviasi > 15) {
            if ($hasJustifikasi) {
                // Deviasi luas > 15% dengan justifikasi tertulis dan BAI diselesaikan secara profesional
                $outcome = 'RESOLVED_WITH_EVIDENCE';
                $escalationLevel = 'NORMAL_WITH_DISCLOSURE';
                $reasons[] = 'Teridentifikasi deviasi luas ' . $persenDeviasi . '% (skrining internal > 15%), namun telah dijustifikasi secara tertulis oleh Penilai Publik dan didukung Berita Acara Inspeksi (BAI) sesuai pertimbangan materialitas KPUP 14 & SPI 104.';
            } else {
                // Belum ada justifikasi tertulis/BAI: minta konfirmasi dan pertimbangan profesional Penilai
                $outcome = 'MATERIAL_CHANGE_REVIEW';
                $escalationLevel = 'ADVISORY_JUSTIFICATION_REQUIRED';
                $reasons[] = 'Teridentifikasi deviasi luas ' . $persenDeviasi . '% (> 15% batas skrining internal) tanpa justifikasi tertulis atau BAI. Memerlukan konfirmasi profesional Penilai Publik dan telaah perubahan Lingkup Penugasan (SPI 103 Klausul 5.5).';
            }
        } elseif ($persenDeviasi > 5 && $persenDeviasi <= 15) {
            if ($hasJustifikasi) {
                $outcome = 'RESOLVED_WITH_EVIDENCE';
                $escalationLevel = 'NORMAL_WITH_DISCLOSURE';
                $reasons[] = 'Terdapat deviasi luas ' . $persenDeviasi . '%, telah didukung Berita Acara Inspeksi dan penjelasan pengungkapan profesional.';
            } else {
                $outcome = 'INSUFFICIENT_EVIDENCE';
                $escalationLevel = 'HOLD_PENDING_EVIDENCE';
                $reasons[] = 'Terdapat deviasi luas ' . $persenDeviasi . '% tetapi belum dilengkapi penjelasan tertulis atau BAI.';
            }
        } elseif ($persenDeviasi > 0 && $persenDeviasi <= 5) {
            $outcome = 'CONSISTENT_AND_VERIFIED';
            $escalationLevel = 'NORMAL';
            $reasons[] = 'Deviasi luas fisik vs yuridis sebesar ' . $persenDeviasi . '% berada dalam batas toleransi wajar (<= 5%) dan diungkapkan dalam catatan laporan.';
        }
    }

    // 3. Verifikasi Bukti Wajib Pengendalian (Foto Geotag & 3 Pembanding Pasar)
    if (!$fotoGeotagLengkap || !$tigaPembandingTersedia) {
        $outcome = 'INSUFFICIENT_EVIDENCE';
        $escalationLevel = 'HOLD_PENDING_EVIDENCE';
        $reasons[] = 'Bukti foto geotag atau minimal 3 data pembanding belum lengkap memenuhi standar SPI 104.';
    }

    // Nomor Laporan diizinkan terbit HANYA jika status CONSISTENT_AND_VERIFIED atau RESOLVED_WITH_EVIDENCE dan TIDAK ADA Red Flag Legalitas
    $allowNolap = in_array($outcome, ['CONSISTENT_AND_VERIFIED', 'RESOLVED_WITH_EVIDENCE'], true) && !$redFlagLegalitas;

    return [
        'outcome' => $outcome,
        'escalationLevel' => $escalationLevel,
        'allowNolap' => $allowNolap,
        'persenDeviasi' => $persenDeviasi,
        'redFlagLegalitas' => $redFlagLegalitas,
        'reasons' => $reasons,
        'evaluatedAt' => date('c')
    ];
}

`;

content = content.substring(0, idx) + newFunction + content.substring(endIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated evaluasiKonsistensiGerbang2Engine in nolap-data-handler.php');
