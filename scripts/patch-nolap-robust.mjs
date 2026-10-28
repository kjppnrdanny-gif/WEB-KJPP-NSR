import fs from 'fs';

let php = fs.readFileSync('nolap-data-handler.php', 'utf8');

// 1. Locate the block from "// 4.0. VERIFIKASI KREDENSIAL PENGESAH PROFESIONAL AKUN KING (ZERO-TRUST)"
// down to "if ($action === 'publishMandiriCabangLP') {"
const startMarker = "// 4.0. VERIFIKASI KREDENSIAL PENGESAH PROFESIONAL AKUN KING (ZERO-TRUST)";
const endMarker = "if ($action === 'publishMandiriCabangLP') {";

const startPos = php.indexOf(startMarker);
const endPos = php.indexOf(endMarker);

if (startPos === -1 || endPos === -1) {
  console.error("Markers not found! startPos:", startPos, "endPos:", endPos);
  process.exit(1);
}

const replacementKingActions = `// 4.0. VERIFIKASI KREDENSIAL PENGESAH PROFESIONAL AKUN KING & JALUR A (ZERO-TRUST BACKEND)
    // =========================================================================

    if (!function_exists('loadSignerPrivateVault')) {
        function loadSignerPrivateVault($dataDir) {
            static $cachedVault = null;
            if ($cachedVault !== null) {
                return $cachedVault;
            }

            $secretsFile = $dataDir . '/config/credentials.secrets.php';
            $secrets = [];
            if (file_exists($secretsFile)) {
                $loaded = @include $secretsFile;
                if (is_array($loaded)) {
                    $secrets = $loaded;
                }
            }

            $cryptoKey = $secrets['crypto_secret_key'] ?? '';
            if (empty($cryptoKey)) {
                $keyFile = $dataDir . '/.operasional_secret';
                if (file_exists($keyFile)) {
                    $cryptoKey = trim(@file_get_contents($keyFile));
                }
                if (empty($cryptoKey)) {
                    $cryptoKey = 'f9cfdf6917d2722e3fa0ec3e77a3e312888fdc5fb248a899afaaceb1548d1c9b';
                }
            }

            $signers = $secrets['signer_vault'] ?? [
                'NANANG' => [
                    'id' => 'nanang_penilai',
                    'nama' => 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
                    'izin' => 'P-1.15.00412',
                    'role' => 'Pemimpin Rekan',
                    'password_hash' => '$2y$10$/fgTYdYGaWfnUIQAqLonD.HNOg/9v2t1HqCY62H1KLhleHc9RpVem'
                ],
                'DENI' => [
                    'id' => 'deni_penilai',
                    'nama' => 'Deni Siswandi, S.T., MAPPI (Cert.)',
                    'izin' => 'P-1.20.00581',
                    'role' => 'Rekan / Pimpinan Cabang Bandung',
                    'password_hash' => '$2y$10$yJCStT23r6GmZ6aIkkl2me.1vUjmhTFSZBn17Ase4Je9R/kx4AXjW'
                ]
            ];

            $cachedVault = [
                'crypto_key' => $cryptoKey,
                'signers'    => $signers
            ];
            return $cachedVault;
        }
    }

    if (!function_exists('validateSignerProof')) {
        function validateSignerProof($proof, $expectedOperator, $expectedIdPenugasan, $expectedSignerId, $dataDir) {
            if (empty($proof) || !is_string($proof)) {
                return ['valid' => false, 'error' => 'Bukti verifikasi pengesah tidak disertakan (EMPTY_PROOF)'];
            }

            $parts = explode('.', $proof);
            if (count($parts) !== 2) {
                return ['valid' => false, 'error' => 'Format token bukti verifikasi tidak valid (MALFORMED_PROOF)'];
            }

            list($b64Payload, $signature) = $parts;
            $signerVault = loadSignerPrivateVault($dataDir);
            $expectedSig = hash_hmac('sha256', $b64Payload, $signerVault['crypto_key']);

            if (!hash_equals($expectedSig, $signature)) {
                return ['valid' => false, 'error' => 'Tanda tangan kriptografis bukti verifikasi tidak sah (TAMPERED_PROOF)'];
            }

            $jsonStr = base64_decode(strtr($b64Payload, '-_', '+/'));
            $claims = json_decode($jsonStr, true);
            if (!is_array($claims)) {
                return ['valid' => false, 'error' => 'Payload klaim bukti verifikasi rusak (INVALID_PAYLOAD)'];
            }

            if (empty($claims['exp']) || time() > (int)$claims['exp']) {
                return ['valid' => false, 'error' => 'Bukti verifikasi telah kedaluwarsa (EXPIRED_PROOF)'];
            }

            if (!empty($expectedOperator) && strcasecmp($claims['op'] ?? '', $expectedOperator) !== 0) {
                return ['valid' => false, 'error' => 'Bukti verifikasi tidak cocok dengan operator yang bertindak (MISMATCHED_OPERATOR)'];
            }
            if (!empty($expectedSignerId) && strcasecmp($claims['signer_id'] ?? '', $expectedSignerId) !== 0) {
                return ['valid' => false, 'error' => 'Bukti verifikasi tidak cocok dengan pejabat penilai penanggung jawab (MISMATCHED_SIGNER)'];
            }

            if (!empty($expectedIdPenugasan) && !empty($claims['idPenugasan']) && strcasecmp($claims['idPenugasan'], $expectedIdPenugasan) !== 0) {
                return ['valid' => false, 'error' => 'Bukti verifikasi terikat pada penugasan lain (MISMATCHED_PENUGASAN)'];
            }

            $nonce = $claims['nonce'] ?? '';
            if (empty($nonce)) {
                return ['valid' => false, 'error' => 'Bukti verifikasi tidak memiliki pengaman nonce (NO_NONCE)'];
            }

            $usedNoncesFile = $dataDir . '/.used_proof_nonces.json';
            $usedNonces = [];
            if (file_exists($usedNoncesFile)) {
                $usedNonces = @json_decode(@file_get_contents($usedNoncesFile), true) ?: [];
            }

            if (isset($usedNonces[$nonce])) {
                return ['valid' => false, 'error' => 'Bukti verifikasi sudah pernah digunakan / replay attack ditolak (REPLAYED_PROOF)'];
            }

            $usedNonces[$nonce] = [
                'op' => $claims['op'] ?? '',
                'idPenugasan' => $claims['idPenugasan'] ?? '',
                'used_at' => time()
            ];
            $cutoff = time() - 3600;
            foreach ($usedNonces as $k => $v) {
                if (($v['used_at'] ?? 0) < $cutoff) unset($usedNonces[$k]);
            }
            @file_put_contents($usedNoncesFile, json_encode($usedNonces), LOCK_EX);

            return ['valid' => true, 'claims' => $claims];
        }
    }

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

        $signerVault = loadSignerPrivateVault($dataDir);
        if (!isset($signerVault['signers'][$operator])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Operator '{$operator}' bukan pengesah profesional Penilai Publik yang sah."]);
            exit;
        }

        $targetSigner = $signerVault['signers'][$operator];
        $isMatched = false;

        // Validasi password_verify standar industri
        if (!empty($targetSigner['password_hash']) && password_verify($credential, $targetSigner['password_hash'])) {
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

        $now = time();
        $expires = $now + 300; // Berlaku tepat 5 menit
        $nonce = bin2hex(random_bytes(16)); // Single-use 128-bit random nonce
        
        $proofClaims = [
            'op' => $operator,
            'signer_id' => $targetSigner['id'],
            'signer_nama' => $targetSigner['nama'],
            'signer_izin' => $targetSigner['izin'],
            'idPenugasan' => $idPenugasan,
            'iat' => $now,
            'exp' => $expires,
            'nonce' => $nonce,
            'session_sub' => $currentUser['sub'] ?? 'super_admin_king'
        ];

        $b64Payload = rtrim(strtr(base64_encode(json_encode($proofClaims)), '+/', '-_'), '=');
        $sig = hash_hmac('sha256', $b64Payload, $signerVault['crypto_key']);
        $verificationProof = $b64Payload . '.' . $sig;

        echo json_encode([
            'success' => true,
            'verified' => true,
            'operator' => $operator,
            'signer_id' => $targetSigner['id'],
            'signer_nama' => $targetSigner['nama'],
            'signer_izin' => $targetSigner['izin'],
            'verification_proof' => $verificationProof,
            'expires_at' => date('c', $expires),
            'message' => "Identitas {$targetSigner['nama']} berhasil diverifikasi secara kriptografis oleh server."
        ]);
        exit;
    }

    if ($action === 'approveProfesionalCabangLP') {
        $idPenugasan = trim($payload['idPenugasan'] ?? ($payload['id'] ?? ''));
        if (!$idPenugasan) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'ID Penugasan wajib disertakan.']);
            exit;
        }

        // WAJIB: ID Penugasan harus ditemukan dalam database resmi!
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $targetIdx = -1;
        foreach ($dgRecords as $i => $r) {
            if (($r['idPenugasan'] ?? '') === $idPenugasan) {
                $targetIdx = $i;
                break;
            }
        }
        if ($targetIdx < 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => "Persetujuan ditolak (404 Not Found): ID Penugasan '{$idPenugasan}' tidak ditemukan dalam database resmi.",
                'code' => 'PROJECT_NOT_FOUND'
            ]);
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

        $isAuthorizedSigner = false;
        $metodeVerifikasi = 'BRANCH_PARTNER_SESSION_AUTH';

        if ($isBranchPartner) {
            $isAuthorizedSigner = true;
        } elseif ($isKing) {
            $valRes = validateSignerProof($verificationProof, 'DENI', $idPenugasan, $bCfg['rekan_id'], $dataDir);
            if (!$valRes['valid']) {
                $valResNanang = validateSignerProof($verificationProof, 'NANANG', $idPenugasan, 'nanang_penilai', $dataDir);
                if ($valResNanang['valid']) {
                    $isAuthorizedSigner = true;
                    $metodeVerifikasi = 'KING_VERIFIED_NANANG_PROOF';
                } else {
                    http_response_code(403);
                    echo json_encode([
                        'success' => false,
                        'error' => "Akses Ditolak (403 Forbidden): Bukti verifikasi pengesah profesional tidak sah: " . ($valRes['error'] ?? 'Bukti tidak valid.'),
                        'violation' => 'INVALID_SIGNER_PROOF',
                        'details' => $valRes['error']
                    ]);
                    exit;
                }
            } else {
                $isAuthorizedSigner = true;
                $metodeVerifikasi = 'KING_VERIFIED_DENI_PROOF';
            }
        }

        if (!$isAuthorizedSigner) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => "Akses Ditolak (403): Persetujuan profesional Jalur A hanya dapat disahkan oleh Pimpinan Cabang ({$bCfg['rekan_nama']}) atau SUPER ADMIN (KING) dengan bukti kriptografis sah tervalidasi.",
                'violation' => 'UNAUTHORIZED_PROFESSIONAL_APPROVAL'
            ]);
            exit;
        }

        $nowWib = date('c');
        $docHash = hash('sha256', $idPenugasan . '::' . ($payload['namaKlien'] ?? '') . '::' . ($payload['jenisObjek'] ?? '') . '::v1.0');
        $signerVault = loadSignerPrivateVault($dataDir);
        $approvalToken = hash_hmac('sha256', "{$bCfg['rekan_id']}::{$idPenugasan}::{$nowWib}", $signerVault['crypto_key']);

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
            'metode_verifikasi' => $metodeVerifikasi,
            'approval_token' => $approvalToken
        ];

        $dgRecords[$targetIdx]['persetujuan_profesional'] = $persetujuan;
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

php = php.substring(0, startPos) + replacementKingActions + php.substring(endPos);
console.log('Replaced KING actions in nolap-data-handler.php successfully!');

// 2. Also update validateSignerProof inside publishMandiriCabangLP if King calls with proof
const targetKingProofInPublish = `if ($isBranchPartnerCaller || ($isKing && !empty($kingProof))) {`;
const targetKingProofPos = php.indexOf(targetKingProofInPublish);
if (targetKingProofPos !== -1) {
  const replaceKingProofInPublish = `if ($isBranchPartnerCaller) {
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
                    'metode_verifikasi' => 'BRANCH_PARTNER_DIRECT',
                    'approval_token' => hash_hmac('sha256', "{$branchConfig['rekan_id']}::{$idPenugasan}::{$nowWib}", loadSignerPrivateVault($dataDir)['crypto_key'])
                ];
            } elseif ($isKing && !empty($kingProof)) {
                $valRes = validateSignerProof($kingProof, 'DENI', $idPenugasan, $branchConfig['rekan_id'], $dataDir);
                if (!$valRes['valid']) {
                    $valResNanang = validateSignerProof($kingProof, 'NANANG', $idPenugasan, 'nanang_penilai', $dataDir);
                    if ($valResNanang['valid']) {
                        $valRes = $valResNanang;
                    }
                }

                if ($valRes['valid']) {
                    $persetujuanTervalidasi = [
                        'status' => 'APPROVED',
                        'pejabat_id' => $valRes['claims']['signer_id'] ?? $branchConfig['rekan_id'],
                        'pejabat_nama' => $valRes['claims']['signer_nama'] ?? $branchConfig['rekan_nama'],
                        'pejabat_izin' => $valRes['claims']['signer_izin'] ?? $branchConfig['rekan_izin'],
                        'pejabat_jabatan' => "Pimpinan Cabang {$matchedBranchKey}",
                        'idPenugasan' => $idPenugasan,
                        'versi_dokumen' => 'v1.0',
                        'dokumen_hash' => hash('sha256', $idPenugasan . '::v1.0'),
                        'waktu_persetujuan' => $nowWib,
                        'metode_verifikasi' => 'KING_VERIFIED_PROOF',
                        'approval_token' => hash_hmac('sha256', "{$branchConfig['rekan_id']}::{$idPenugasan}::{$nowWib}", loadSignerPrivateVault($dataDir)['crypto_key'])
                    ];
                } else {
                    http_response_code(422);
                    echo json_encode([
                        'success' => false,
                        'error' => "Penerbitan Mandiri Cabang Ditolak (Bukti Verifikasi King Tidak Sah): " . $valRes['error'],
                        'code' => 'INVALID_KING_PROOF',
                        'violation' => 'INVALID_KING_PROOF'
                    ]);
                    exit;
                }
            } else if (false) {`;

  // Find the closing of that block
  const endOfBlock = php.indexOf(`http_response_code(422); // 422 Unprocessable Entity`, targetKingProofPos);
  if (endOfBlock !== -1) {
    // Replace from targetKingProofPos up to endOfBlock
    const oldSlice = php.substring(targetKingProofPos, endOfBlock);
    php = php.replace(oldSlice, replaceKingProofInPublish + `\n                `);
    console.log('Updated publishMandiriCabangLP kingProof validation!');
  }
}

fs.writeFileSync('nolap-data-handler.php', php, 'utf8');
console.log('Successfully written updated nolap-data-handler.php!');
