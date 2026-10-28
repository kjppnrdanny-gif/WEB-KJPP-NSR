import fs from 'fs';
import path from 'path';

const file = path.resolve('operasional-data-handler.php');
let code = fs.readFileSync(file, 'utf8');
const newline = code.includes('\r\n') ? '\r\n' : '\n';

// Find the start of action approveTier
const startApprove = code.indexOf("// F. ACTION: approveTier");
if (startApprove === -1) {
  console.error("Could not find startApprove");
  process.exit(1);
}

// Find the end before "// Action tidak dikenali"
const endAction = code.indexOf("// Action tidak dikenali");
if (endAction === -1) {
  console.error("Could not find endAction");
  process.exit(1);
}

const replacement = `// F. ACTION: approveTier (Otorisasi Bertingkat Dinamis & RBAC Ketat)
if ($action === 'approveTier') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $id = trim($payload['id'] ?? '');
    $tier = (int)($payload['tier'] ?? 0);

    if (!$id || $tier < 1 || $tier > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parameter id dan tier (1..5) wajib diisi.']);
        exit;
    }

    // 1. ISOLASI KREDENSIAL STAGING: Tolak token staging di environment produksi
    if (!empty($currentUser['isStaging']) && !isStagingEnvironment()) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => 'Akses Ditolak (403 Forbidden): Kredensial staging/demo tidak diizinkan untuk melakukan otorisasi pada sistem produksi.'
        ]);
        exit;
    }

    // 2. BLOKIR SELURUH TOKEN STAF (FAIL-CLOSED)
    $userCanApprove = !empty($currentUser['canApprove']);
    $userPermissions = $currentUser['permissions'] ?? [];
    if (!$userCanApprove || empty($userPermissions)) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) adalah akun staf dan tidak memiliki wewenang approval dokumen operasional."
        ]);
        exit;
    }

    // 3. FAST-FAIL RBAC: Jika user tidak memiliki izin sama sekali untuk tier ini
    if ($tier === 1 && !in_array('APPROVE_TEKNIK', $userPermissions, true) && !in_array('APPROVE_ADMIN', $userPermissions, true)) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) tidak memiliki izin APPROVE_TEKNIK atau APPROVE_ADMIN untuk mengesahkan Tingkat 1."
        ]);
        exit;
    }

    $result = mutateDatabaseOperasional($dataFile, $lockFile, function(&$records) use ($id, $tier, $currentUser, $userRole, $userPermissions, $SERVER_SECRET) {
        $now = date('Y-m-d H:i:s');
        $targetIndex = -1;

        foreach ($records as $idx => $r) {
            if (($r['id'] ?? '') === $id || ($r['noRegistrasi'] ?? '') === $id) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex < 0) {
            return ['success' => false, 'http_code' => 404, 'error' => 'Dokumen pengajuan tidak ditemukan.'];
        }

        $doc = $records[$targetIndex];

        // Status dokumen harus SUBMITTED atau IN_REVIEW
        $status = $doc['status'] ?? 'DRAFT';
        if ($status === 'DRAFT') {
            return ['success' => false, 'http_code' => 400, 'error' => 'Dokumen masih berstatus DRAFT dan belum disubmit oleh pemohon.'];
        }
        if ($status === 'REJECTED') {
            return ['success' => false, 'http_code' => 400, 'error' => 'Dokumen berstatus REJECTED. Pemohon harus mengajukan revisi sebelum otorisasi dapat dilanjutkan.'];
        }
        if ($status === 'APPROVED') {
            return ['success' => false, 'http_code' => 400, 'error' => 'Dokumen sudah disetujui sepenuhnya (Semua Tingkat Selesai).'];
        }

        if (!isset($doc['approvals'][$tier])) {
            return ['success' => false, 'http_code' => 400, 'error' => "Tahap otorisasi Tier {$tier} tidak terdapat pada alur dokumen ini."];
        }

        // Periksa apakah Tier ini sudah disetujui sebelumnya
        if (!empty($doc['approvals'][$tier]['approved'])) {
            return ['success' => false, 'http_code' => 400, 'error' => "Tier {$tier} sudah disetujui sebelumnya."];
        }

        // PEMETAAN HAK AKSES PER-TIER SECARA KETAT (STRICT SEPARATION OF DUTIES)
        $step = $doc['approvals'][$tier] ?? [];
        $roleKey = $step['roleKey'] ?? '';
        $labelTarget = $step['label'] ?? "Tier {$tier}";
        $isLegacy5Tier = (($doc['workflowSystem'] ?? '') === '5_TIER') || (count($doc['approvals'] ?? []) === 5 && !isset($step['tingkat']));

        $requiredPerm = null;
        $authorizedRoleTitle = '';
        if ($roleKey === 'TEKNIK') {
            $requiredPerm = 'APPROVE_TEKNIK';
            $authorizedRoleTitle = 'Manager Teknik (Deni Siswandi, S.T.)';
        } elseif ($roleKey === 'ADMIN_UMUM') {
            $requiredPerm = 'APPROVE_ADMIN';
            $authorizedRoleTitle = 'Manager Admin & Umum (Danny Taufik Hidayat, S.H.)';
        } elseif ($roleKey === 'KEUANGAN') {
            $requiredPerm = 'APPROVE_KEUANGAN';
            $authorizedRoleTitle = 'Manager Keuangan (Milda Hidayati Dewi, S.E.)';
        } elseif ($roleKey === 'KEPALA_KEUANGAN') {
            $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
            $authorizedRoleTitle = 'Kepala Keuangan (Ir. Nanang Rahayu, M.Ec.Dev.)';
        } elseif ($isLegacy5Tier) {
            if ($tier === 2) {
                $requiredPerm = 'APPROVE_TEKNIK';
                $authorizedRoleTitle = 'Manager Teknik (Deni Siswandi, S.T.)';
            } elseif ($tier === 3) {
                $requiredPerm = 'APPROVE_ADMIN';
                $authorizedRoleTitle = 'Manager Admin & Umum (Danny Taufik Hidayat, S.H.)';
            } elseif ($tier === 4) {
                $requiredPerm = 'APPROVE_KEUANGAN';
                $authorizedRoleTitle = 'Manager Keuangan (Milda Hidayati Dewi, S.E.)';
            } elseif ($tier === 5) {
                $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
                $authorizedRoleTitle = 'Kepala Keuangan (Ir. Nanang Rahayu, M.Ec.Dev.)';
            }
        }

        if (!$requiredPerm || !in_array($requiredPerm, $userPermissions, true)) {
            return [
                'success'   => false,
                'http_code' => 403,
                'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) tidak memiliki izin {$requiredPerm} untuk mengesahkan {$labelTarget}. Wewenang ini khusus untuk {$authorizedRoleTitle}."
            ];
        }

        // PENEGAKAN URUTAN PERSATUAN (SEQUENTIAL ENFORCEMENT)
        $alurDoc = strtoupper(trim($doc['alur'] ?? ''));
        $targetTingkat = $step['tingkat'] ?? $tier;

        if ($isLegacy5Tier) {
            if ($tier > 1) {
                $prevTier = $tier - 1;
                $prevApproval = $doc['approvals'][$prevTier] ?? null;
                if (!$prevApproval || empty($prevApproval['approved'])) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan harus berurutan. Tahap {$prevTier} (" . ($prevApproval['label'] ?? '') . ") belum disetujui."
                    ];
                }
            }
        } elseif ($alurDoc === 'LINTAS_DIVISI' || $alurDoc === 'LINTAS') {
            if ($targetTingkat === 2 || $tier === 3) {
                $tier1Approved = !empty($doc['approvals'][1]['approved']);
                $tier2Approved = !empty($doc['approvals'][2]['approved']);
                if (!$tier1Approved || !$tier2Approved) {
                    $belum = [];
                    if (!$tier1Approved) $belum[] = $doc['approvals'][1]['label'] ?? 'Manager Teknik';
                    if (!$tier2Approved) $belum[] = $doc['approvals'][2]['label'] ?? 'Manager Admin & Umum';
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan Lintas Divisi memerlukan persetujuan lengkap Tingkat 1 sebelum lanjut ke Keuangan. Tahap yang belum disetujui: " . implode(' & ', $belum) . "."
                    ];
                }
            } elseif ($targetTingkat === 3 || $tier === 4) {
                $keuApproved = !empty($doc['approvals'][3]['approved']);
                if (!$keuApproved) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan akhir Kepala Keuangan (Tingkat 3) hanya dapat dilakukan setelah Verifikasi Manager Keuangan (Tingkat 2) disetujui."
                    ];
                }
            }
        } else {
            if ($targetTingkat === 2 || $tier === 2) {
                $prevApproval = $doc['approvals'][1] ?? null;
                if (!$prevApproval || empty($prevApproval['approved'])) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan harus berurutan. Tahap 1 (" . ($prevApproval['label'] ?? 'Manager Divisi') . ") belum disetujui."
                    ];
                }
            } elseif ($targetTingkat === 3 || $tier === 3) {
                $prevApproval = $doc['approvals'][2] ?? null;
                if (!$prevApproval || empty($prevApproval['approved'])) {
                    return [
                        'success'   => false,
                        'http_code' => 400,
                        'error'     => "Persetujuan harus berurutan. Tahap 2 (" . ($prevApproval['label'] ?? 'Manager Keuangan') . ") belum disetujui."
                    ];
                }
            }
        }

        // TENTUKAN NAMA & JABATAN PEJABAT RESMI
        $pejabatNama = !empty($currentUser['displayName']) ? $currentUser['displayName'] : ($step['pejabat'] ?? 'Pejabat Berwenang');
        $pejabatJabatan = $step['jabatan'] ?? 'Pejabat';

        // HITUNG CRYPTOGRAPHIC HMAC TOKEN
        $contentDigest = generateContentDigest($doc);
        $hmac = generateTierHmac(
            $doc['id'],
            $tier,
            $doc['versi'] ?? 1,
            $contentDigest,
            $pejabatNama,
            $pejabatJabatan,
            $now,
            $SERVER_SECRET
        );

        $qrUrl = generateQrVerificationUrl($doc['noRegistrasi'] ?: $doc['id'], $tier, $hmac);

        // REKAM PERSETUJUAN
        $doc['approvals'][$tier]['approved'] = true;
        $doc['approvals'][$tier]['approvedAt'] = $now;
        $doc['approvals'][$tier]['approvedBy'] = $pejabatNama;
        $doc['approvals'][$tier]['pejabat'] = $pejabatNama;
        $doc['approvals'][$tier]['hmacHash'] = $hmac;
        $doc['approvals'][$tier]['qrUrl'] = $qrUrl;

        // Update status dokumen (Jika semua tier selesai -> APPROVED)
        $allDone = true;
        foreach ($doc['approvals'] as $a) {
            if (empty($a['approved'])) {
                $allDone = false;
                break;
            }
        }
        if ($allDone) {
            $doc['status'] = 'APPROVED';
        } else {
            $doc['status'] = 'IN_REVIEW';
        }
        $doc['updatedAt'] = $now;

        $doc['auditTrail'][] = [
            'action'     => 'APPROVE_TIER_' . $tier,
            'timestamp'  => $now,
            'user'       => $pejabatNama,
            'role'       => $userRole,
            'keterangan' => "Tier {$tier} (" . ($doc['approvals'][$tier]['label'] ?? '') . ") disetujui secara sah oleh {$pejabatNama}."
        ];

        $records[$targetIndex] = $doc;

        return [
            'success' => true,
            'records' => $records,
            'data'    => $doc,
            'message' => "Persetujuan Tier {$tier} (" . ($doc['approvals'][$tier]['label'] ?? '') . ") berhasil disahkan oleh {$pejabatNama}."
        ];
    });

    if (empty($result['success'])) {
        http_response_code($result['http_code'] ?? 500);
        echo json_encode($result);
        exit;
    }

    echo json_encode($result);
    exit;
}

// G. ACTION: rejectWithNote (Penolakan dengan Alasan Minimal 10 Karakter & RBAC Ketat)
if ($action === 'rejectWithNote') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        $payload = $_POST;
    }

    $id = trim($payload['id'] ?? '');
    $alasan = trim($payload['alasan'] ?? '');
    $tier = (int)($payload['tier'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Parameter id dokumen wajib diisi.']);
        exit;
    }

    if (strlen($alasan) < 10) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Alasan penolakan wajib diisi secara jelas dengan minimal 10 karakter.'
        ]);
        exit;
    }

    // 1. ISOLASI KREDENSIAL STAGING: Tolak token staging di environment produksi
    if (!empty($currentUser['isStaging']) && !isStagingEnvironment()) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => 'Akses Ditolak (403 Forbidden): Kredensial staging/demo tidak diizinkan untuk menolak dokumen pada sistem produksi.'
        ]);
        exit;
    }

    // 2. BLOKIR SELURUH TOKEN STAF (FAIL-CLOSED)
    $userCanApprove = !empty($currentUser['canApprove']);
    $userPermissions = $currentUser['permissions'] ?? [];
    if (!$userCanApprove || empty($userPermissions)) {
        http_response_code(403);
        echo json_encode([
            'success'   => false,
            'error'     => "Akses Ditolak (403 Forbidden): Akun Anda ({$userRole}) adalah akun staf dan tidak memiliki hak wewenang otorisasi penolakan dokumen operasional."
        ]);
        exit;
    }

    $result = mutateDatabaseOperasional($dataFile, $lockFile, function(&$records) use ($id, $alasan, $tier, $currentUser, $userRole, $userPermissions) {
        $now = date('Y-m-d H:i:s');
        $targetIndex = -1;

        foreach ($records as $idx => $r) {
            if (($r['id'] ?? '') === $id || ($r['noRegistrasi'] ?? '') === $id) {
                $targetIndex = $idx;
                break;
            }
        }

        if ($targetIndex < 0) {
            return ['success' => false, 'http_code' => 404, 'error' => 'Dokumen pengajuan tidak ditemukan.'];
        }

        $doc = $records[$targetIndex];

        // 3. VALIDASI WEWENANG PENOLAKAN SESUAI TIER
        if ($tier > 0 && isset($doc['approvals'][$tier])) {
            $step = $doc['approvals'][$tier];
            $roleKey = $step['roleKey'] ?? '';
            $requiredPerm = null;
            if ($roleKey === 'TEKNIK') $requiredPerm = 'APPROVE_TEKNIK';
            elseif ($roleKey === 'ADMIN_UMUM') $requiredPerm = 'APPROVE_ADMIN';
            elseif ($roleKey === 'KEUANGAN') $requiredPerm = 'APPROVE_KEUANGAN';
            elseif ($roleKey === 'KEPALA_KEUANGAN') $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';

            if ($requiredPerm && !in_array($requiredPerm, $userPermissions, true)) {
                return [
                    'success'   => false,
                    'http_code' => 403,
                    'error'     => "Akses Ditolak (403 Forbidden): Anda tidak memiliki izin {$requiredPerm} untuk menolak pengajuan pada tahap ini."
                ];
            }
        } else {
            $hasAnyApproval = false;
            foreach (['APPROVE_TEKNIK', 'APPROVE_ADMIN', 'APPROVE_KEUANGAN', 'APPROVE_KEPALA_KEUANGAN'] as $p) {
                if (in_array($p, $userPermissions, true)) {
                    $hasAnyApproval = true;
                    break;
                }
            }
            if (!$hasAnyApproval) {
                return [
                    'success'   => false,
                    'http_code' => 403,
                    'error'     => "Akses Ditolak (403 Forbidden): Anda tidak memiliki hak otorisasi penolakan dokumen operasional."
                ];
            }
        }

        $penolakNama = $currentUser['displayName'] ?? 'Pejabat Berwenang';

        // Status dokumen diubah menjadi REJECTED
        $doc['status'] = 'REJECTED';
        $doc['updatedAt'] = $now;
        $doc['penolakan'] = [
            'alasan'      => $alasan,
            'ditolakOleh' => $penolakNama,
            'tglDitolak'  => $now,
            'tierDitolak' => $tier ?: 0
        ];

        $doc['auditTrail'][] = [
            'action'     => 'REJECT_DOCUMENT',
            'timestamp'  => $now,
            'user'       => $penolakNama,
            'role'       => $userRole,
            'keterangan' => "Pengajuan ditolak pada Tier " . ($tier ?: 'Review') . " oleh {$penolakNama}. Alasan: " . $alasan
        ];

        $records[$targetIndex] = $doc;

        return [
            'success' => true,
            'records' => $records,
            'data'    => $doc,
            'message' => 'Pengajuan berhasil ditolak dan catatan telah disampaikan.'
        ];
    });

    if (empty($result['success'])) {
        http_response_code($result['http_code'] ?? 500);
        echo json_encode($result);
        exit;
    }

    echo json_encode($result);
    exit;
}

`;

code = code.substring(0, startApprove) + replacement.replace(/\n/g, newline) + code.substring(endAction);
fs.writeFileSync(file, code, 'utf8');
console.log("Successfully patched approveTier and rejectWithNote!");
