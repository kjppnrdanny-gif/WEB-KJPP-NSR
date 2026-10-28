import fs from 'fs';

let php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const startNeedle = "$pejabatPengesah = [";
const pos = php.indexOf(startNeedle);
if (pos === -1) {
  console.error("startNeedle not found!");
  process.exit(1);
}

const endNeedle = "];";
const endPos = php.indexOf(endNeedle, pos);
if (endPos === -1) {
  console.error("endNeedle not found!");
  process.exit(1);
}

const targetBlock = php.substring(pos, endPos + endNeedle.length);
console.log('Target block to replace:');
console.log(targetBlock);

const replacement = `// VALIDASI PERSYARATAN PERSETUJUAN PROFESIONAL SEBELUM PENERBITAN ADMINISTRATIF (JALUR A)
        // Admin Cabang dilarang menerbitkan nomor secara sepihak jika belum ada bukti persetujuan profesional yang tervalidasi.
        $persetujuanTervalidasi = null;

        // 1. Cek di payload apakah ada bukti persetujuan profesional yang sah
        $payloadPersetujuan = $payload['persetujuan_profesional'] ?? ($payload['persetujuanProfesional'] ?? null);
        if ($payloadPersetujuan && is_array($payloadPersetujuan) && ($payloadPersetujuan['status'] ?? '') === 'APPROVED') {
            if (($payloadPersetujuan['idPenugasan'] ?? '') === $idPenugasan && ($payloadPersetujuan['pejabat_id'] ?? '') === $branchConfig['rekan_id']) {
                $persetujuanTervalidasi = $payloadPersetujuan;
            }
        }

        // 2. Cek di database dual gate apakah sudah tersimpan persetujuan profesional sebelumnya
        if (!$persetujuanTervalidasi) {
            foreach ($dgRecords as $r) {
                if (($r['idPenugasan'] ?? '') === $idPenugasan && !empty($r['persetujuan_profesional'])) {
                    $pp = $r['persetujuan_profesional'];
                    if (($pp['status'] ?? '') === 'APPROVED' && ($pp['pejabat_id'] ?? '') === $branchConfig['rekan_id']) {
                        $persetujuanTervalidasi = $pp;
                        break;
                    }
                }
            }
        }

        // 3. Jika pemanggil saat ini adalah Penilai Publik cabang itu sendiri atau KING dengan verifikasi sah, izinkan persetujuan langsung
        $isBranchPartnerCaller = ($userRole === 'PENILAI_PUBLIK' || $userRole === 'REKAN') && 
                                 (strcasecmp($currentUser['sub'] ?? '', $branchConfig['rekan_id']) === 0 || 
                                  stripos($userDisplayName, $branchConfig['rekan_nama']) !== false);
        $kingProof = trim($payload['verification_proof'] ?? ($payload['verificationProof'] ?? ''));

        if (!$persetujuanTervalidasi) {
            if ($isBranchPartnerCaller || ($isKing && !empty($kingProof))) {
                $persetujuanTervalidasi = [
                    'status' => 'APPROVED',
                    'pejabat_id' => $branchConfig['rekan_id'],
                    'pejabat_nama' => $branchConfig['rekan_nama'],
                    'pejabat_izin' => $branchConfig['rekan_izin'],
                    'pejabat_jabatan' => "Pimpinan Cabang {$matchedBranchKey}",
                    'idPenugasan' => $idPenugasan,
                    'versi_dokumen' => 'v1.0',
                    'dokumen_hash' => hash('sha256', $idPenugasan . '::v1.0'),
                    'waktu_persetujuan' => $nowWib,
                    'metode_verifikasi' => $isKing ? 'KING_VERIFIED_PROOF' : 'BRANCH_PARTNER_DIRECT',
                    'approval_token' => hash_hmac('sha256', "{$branchConfig['rekan_id']}::{$idPenugasan}::{$nowWib}", 'KJPP_NSR_JALUR_A_SECRET')
                ];
            } else {
                http_response_code(422); // 422 Unprocessable Entity
                echo json_encode([
                    'success' => false,
                    'error' => "Penerbitan Mandiri Cabang Ditolak (Belum Disetujui Profesional): Penugasan '{$idPenugasan}' belum memiliki bukti persetujuan profesional yang tervalidasi dari Pimpinan Cabang ({$branchConfig['rekan_nama']}). Admin Cabang hanya dapat menerbitkan secara administratif setelah dokumen disetujui secara profesional.",
                    'code' => 'UNAPPROVED_PROFESSIONAL_LP',
                    'violation' => 'UNAPPROVED_PROFESSIONAL_LP'
                ]);
                exit;
            }
        }

        $pejabatPengesah = [
            'id' => $persetujuanTervalidasi['pejabat_id'],
            'nama' => $persetujuanTervalidasi['pejabat_nama'],
            'izin' => $persetujuanTervalidasi['pejabat_izin'],
            'jabatan' => $persetujuanTervalidasi['pejabat_jabatan'],
            'klasifikasi_profesional' => $branchConfig['klasifikasi_cabang'],
            'dasar_kewenangan' => "PMK 101/2014 & SPI 204 — Otorisasi Rekan Pemimpin Cabang {$matchedBranchKey} (Izin No. {$persetujuanTervalidasi['pejabat_izin']})",
            'status_persetujuan' => 'DISETUJUI_PIMPINAN_CABANG',
            'waktu_pengesahan' => $persetujuanTervalidasi['waktu_persetujuan'],
            'dokumen_hash' => $persetujuanTervalidasi['dokumen_hash'] ?? hash('sha256', $idPenugasan),
            'approval_token' => $persetujuanTervalidasi['approval_token'] ?? ''
        ];`;

php = php.substring(0, pos) + replacement + php.substring(endPos + endNeedle.length);
fs.writeFileSync('nolap-data-handler.php', php, 'utf8');
console.log('Successfully replaced pejabatPengesah block!');
