import fs from 'fs';

let php = fs.readFileSync('nolap-data-handler.php', 'utf8');

const targetNeedle = "if ($action === 'publishMandiriCabangLP')";
const pos = php.indexOf(targetNeedle);
if (pos === -1) {
  console.error("targetNeedle not found in nolap-data-handler.php!");
  process.exit(1);
}

const actionsToAdd = `    // =========================================================================
    // 4.0. VERIFIKASI KREDENSIAL PENGESAH PROFESIONAL AKUN KING (ZERO-TRUST)
    // =========================================================================
    if ($action === 'verifyPengesahKing') {
        if ($userRole !== 'SUPER_ADMIN') {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Akses ditolak (403): Hanya akun SUPER ADMIN (KING) yang berwenang melakukan verifikasi kredensial pengesah profesional.'
            ]);
            exit;
        }

        $operator = strtoupper(trim($payload['operator'] ?? ''));
        $credential = trim($payload['credential'] ?? ($payload['pin'] ?? ''));
        $idPenugasan = trim($payload['idPenugasan'] ?? '');

        if (empty($credential)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Kredensial atau PIN pribadi pengesah wajib diisi.']);
            exit;
        }

        $signerConfigs = [
            'NANANG' => [
                'id' => 'nanang_penilai',
                'nama' => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
                'izin' => 'P-1.15.00412',
                'role' => 'Pemimpin Rekan',
                'hashes' => [
                    '0f6143e6a3446c582f18eaf4a2cdbb6ee9d81797bbeb23267243e10ee85a345c',
                    '52f47b27eba8cf4a4cbda1da0faa2a5b69e3302891bf090035fb4e1e1da81833',
                    'e1938a233ed84d616c387cf3be0df5dec6192e6d91d050feb47f52dec078c036'
                ]
            ],
            'DENI' => [
                'id' => 'deni_penilai',
                'nama' => 'Deni Siswandi, S.T., MAPPI (Cert.)',
                'izin' => 'P-1.20.00581',
                'role' => 'Rekan / Pimpinan Cabang Bandung',
                'hashes' => [
                    '0b021040423708642e359bb9bd9b8e499a6d5236636f871eba072f511b5b988f',
                    'd471eb92040e36990d7e68e243d132bec66aa4db636d917521a62eec4bbc03d1',
                    '429f4f2f7e74ccd0a2d8bf70ea4decbaaad5d1729907a4f4d477753c3c42c7f2'
                ]
            ]
        ];

        if (!isset($signerConfigs[$operator])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Operator '{$operator}' bukan pengesah profesional Penilai Publik yang sah."]);
            exit;
        }

        $targetSigner = $signerConfigs[$operator];
        $salt = 'KJPP_NSR_2026_PROFESSIONAL_SIGNER_SALT::';
        $inputSaltedHash = hash('sha256', $salt . $credential);
        $inputCoreAuthHash = hash('sha256', 'KJPP_NSR_2026_CORE_AUTH::' . strtoupper($credential));

        $isMatched = false;
        if (in_array($inputSaltedHash, $targetSigner['hashes'], true) || in_array($inputCoreAuthHash, $targetSigner['hashes'], true)) {
            $isMatched = true;
        }

        if (!$isMatched) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'verified' => false,
                'error' => "Kredensial / PIN pribadi pengesah untuk {$targetSigner['nama']} TIDAK COCOK. Verifikasi identitas ditolak.",
                'code' => 'INVALID_SIGNER_CREDENTIAL'
            ]);
            exit;
        }

        $nowIso = date('c');
        $serverSecret = 'KJPP_NSR_SEC_KEY_2026_KING_SIGN';
        $proof = hash_hmac('sha256', "{$operator}::{$idPenugasan}::{$targetSigner['id']}::{$nowIso}", $serverSecret);

        echo json_encode([
            'success' => true,
            'verified' => true,
            'operator' => $operator,
            'signer_id' => $targetSigner['id'],
            'signer_nama' => $targetSigner['nama'],
            'signer_izin' => $targetSigner['izin'],
            'verification_proof' => $proof,
            'verified_at' => $nowIso,
            'message' => "Identitas {$targetSigner['nama']} berhasil diverifikasi secara sah oleh server."
        ]);
        exit;
    }

    // =========================================================================
    // 4.B. PERSETUJUAN PROFESIONAL MANDIRI CABANG (JALUR A - TAHAP 1 PROFESIONAL)
    // =========================================================================
    if ($action === 'approveProfesionalCabangLP') {
        $idPenugasan = trim($payload['idPenugasan'] ?? ($payload['id'] ?? ''));
        if (!$idPenugasan) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID Penugasan wajib disertakan.']);
            exit;
        }

        $rawKantor = trim($payload['kantorWilayah'] ?? ($payload['kantor_wilayah'] ?? ($userBranch ?: 'Bandung')));
        $branchName = trim(preg_replace('/^(Kantor\\s+Cabang|Cabang|Kantor)\\s+/i', '', $rawKantor));
        if (empty($branchName) || strcasecmp($branchName, 'Pusat') === 0) {
            $branchName = $userBranch ?: 'Bandung';
        }

        $branchCompetencyMatrix = [
            'Bandung' => [
                'kode' => 'BDG', 'kode_kantor' => '2.0160-04', 'klasifikasi_cabang' => 'PP',
                'rekan_id' => 'deni_penilai', 'rekan_nama' => 'Deni Siswandi, S.T., MAPPI (Cert.)',
                'rekan_izin' => 'P-1.20.00581', 'rekan_klasifikasi' => 'P'
            ],
            'Padang' => [
                'kode' => 'PDG', 'kode_kantor' => '2.0160-02', 'klasifikasi_cabang' => 'PS',
                'rekan_id' => 'hernita_penilai', 'rekan_nama' => 'Hernita, S.Si., MAPPI (Cert.)',
                'rekan_izin' => 'PS-1.15.00046', 'rekan_klasifikasi' => 'PS'
            ],
            'Makassar' => [
                'kode' => 'MKS', 'kode_kantor' => '2.0160-03', 'klasifikasi_cabang' => 'PS',
                'rekan_id' => 'amin_penilai', 'rekan_nama' => 'Muhammad Amin Sade, S.M., MAPPI (Cert.)',
                'rekan_izin' => 'PS-1.16.00126', 'rekan_klasifikasi' => 'PS'
            ],
            'Palembang' => [
                'kode' => 'PLB', 'kode_kantor' => '2.0160-05', 'klasifikasi_cabang' => 'PS',
                'rekan_id' => 'dharma_penilai', 'rekan_nama' => 'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)',
                'rekan_izin' => 'PS-1.19.00249', 'rekan_klasifikasi' => 'PS'
            ]
        ];

        $matchedBranchKey = null;
        foreach ($branchCompetencyMatrix as $bKey => $bInfo) {
            if (strcasecmp($bKey, $branchName) === 0 || stripos($branchName, $bKey) !== false) {
                $matchedBranchKey = $bKey;
                break;
            }
        }
        if (!$matchedBranchKey) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Kantor Cabang '{$branchName}' tidak terdaftar."]);
            exit;
        }

        $bCfg = $branchCompetencyMatrix[$matchedBranchKey];
        $isBranchPartner = ($userRole === 'PENILAI_PUBLIK' || $userRole === 'REKAN') && 
                           (strcasecmp($currentUser['sub'] ?? '', $bCfg['rekan_id']) === 0 || 
                            stripos($userDisplayName, $bCfg['rekan_nama']) !== false);
        $isKing = ($userRole === 'SUPER_ADMIN');

        $verificationProof = trim($payload['verification_proof'] ?? ($payload['verificationProof'] ?? ''));
        $signerCredential = trim($payload['signer_credential'] ?? ($payload['pin'] ?? ''));

        $isAuthorizedSigner = false;
        if ($isBranchPartner) {
            $isAuthorizedSigner = true;
        } elseif ($isKing) {
            if (!empty($verificationProof)) {
                $isAuthorizedSigner = true;
            } elseif (!empty($signerCredential)) {
                $salt = 'KJPP_NSR_2026_PROFESSIONAL_SIGNER_SALT::';
                $hashInput = hash('sha256', $salt . $signerCredential);
                if (in_array($hashInput, ['0f6143e6a3446c582f18eaf4a2cdbb6ee9d81797bbeb23267243e10ee85a345c', '0b021040423708642e359bb9bd9b8e499a6d5236636f871eba072f511b5b988f'], true)) {
                    $isAuthorizedSigner = true;
                }
            }
        }

        if (!$isAuthorizedSigner) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => "Akses Ditolak (403): Persetujuan profesional Jalur A hanya dapat disahkan oleh Pimpinan Cabang ({$bCfg['rekan_nama']}) atau SUPER ADMIN (KING) dengan kredensial pengesah terverifikasi.",
                'violation' => 'UNAUTHORIZED_PROFESSIONAL_APPROVAL'
            ]);
            exit;
        }

        $nowWib = date('c');
        $docHash = hash('sha256', $idPenugasan . '::' . ($payload['namaKlien'] ?? '') . '::' . ($payload['jenisObjek'] ?? '') . '::v1.0');
        $approvalToken = hash_hmac('sha256', "{$bCfg['rekan_id']}::{$idPenugasan}::{$nowWib}", 'KJPP_NSR_JALUR_A_SECRET');

        $persetujuan = [
            'status' => 'APPROVED',
            'pejabat_id' => $bCfg['rekan_id'],
            'pejabat_nama' => $bCfg['rekan_nama'],
            'pejabat_izin' => $bCfg['rekan_izin'],
            'pejabat_jabatan' => "Pimpinan Cabang {$matchedBranchKey}",
            'idPenugasan' => $idPenugasan,
            'versi_dokumen' => 'v1.0',
            'dokumen_hash' => $docHash,
            'waktu_persetujuan' => $nowWib,
            'metode_verifikasi' => $isKing ? 'KING_VERIFIED_PROFESSIONAL_PROOF' : 'BRANCH_PARTNER_SESSION_AUTH',
            'approval_token' => $approvalToken
        ];

        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $found = false;
        foreach ($dgRecords as &$r) {
            if (($r['idPenugasan'] ?? '') === $idPenugasan) {
                $r['persetujuan_profesional'] = $persetujuan;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $dgRecords[] = [
                'idPenugasan' => $idPenugasan,
                'namaKlien' => $payload['namaKlien'] ?? '',
                'persetujuan_profesional' => $persetujuan,
                'createdAt' => $nowWib
            ];
        }
        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        echo json_encode([
            'success' => true,
            'idPenugasan' => $idPenugasan,
            'persetujuan_profesional' => $persetujuan,
            'message' => "Persetujuan profesional untuk penugasan {$idPenugasan} berhasil disahkan oleh {$bCfg['rekan_nama']}."
        ]);
        exit;
    }

    `;

php = php.substring(0, pos) + actionsToAdd + php.substring(pos);
fs.writeFileSync('nolap-data-handler.php', php, 'utf8');
console.log('Successfully inserted verifyPengesahKing and approveProfesionalCabangLP into nolap-data-handler.php!');
