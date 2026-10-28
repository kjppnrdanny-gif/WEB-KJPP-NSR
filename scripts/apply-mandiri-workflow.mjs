import fs from 'fs';
import path from 'path';

const projectRoot = 'd:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';
const phpPath = path.join(projectRoot, 'nolap-data-handler.php');
const htmlPath = path.join(projectRoot, 'portal-penugasan-jo.html');

console.log('1. Membaca file target...');
let phpCode = fs.readFileSync(phpPath, 'utf8');
let htmlCode = fs.readFileSync(htmlPath, 'utf8');

// ============================================================================
// PART 1: UPDATE nolap-data-handler.php
// ============================================================================

// A. Update listAllDualGate to filter for branch users
const oldListAll = `    if ($actionGet === 'listAllDualGate' || $actionGet === 'listAll') {
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        echo json_encode([
            'success'     => true,
            'currentUser' => [
                'nama'      => $currentUser['nama'] ?? $userDisplayName,
                'role'      => $currentUser['role'],
                'roleLabel' => $currentUser['roleLabel'] ?? $currentUser['role']
            ],
            'total'       => count($dgRecords),
            'records'     => $dgRecords
        ]);
        exit;
    }`;

const newListAll = `    if ($actionGet === 'listAllDualGate' || $actionGet === 'listAll') {
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $userBranchClean = trim(preg_replace('/^(Kantor\\s+Cabang|Cabang|Kantor)\\s+/i', '', $userBranch ?? ''));
        if (in_array($userRole, ['ADMIN_CABANG', 'CABANG'], true) && !empty($userBranchClean) && strcasecmp($userBranchClean, 'Pusat') !== 0) {
            $dgRecords = array_values(array_filter($dgRecords, function($r) use ($userBranchClean) {
                $recBranch = trim(preg_replace('/^(Kantor\\s+Cabang|Cabang|Kantor)\\s+/i', '', $r['kantorAsal'] ?? ($r['origin_branch_id'] ?? ($r['kantor_wilayah'] ?? ''))));
                return strcasecmp($recBranch, $userBranchClean) === 0;
            }));
        }
        echo json_encode([
            'success'     => true,
            'currentUser' => [
                'nama'      => $currentUser['nama'] ?? $userDisplayName,
                'role'      => $currentUser['role'],
                'roleLabel' => $currentUser['roleLabel'] ?? $currentUser['role']
            ],
            'total'       => count($dgRecords),
            'records'     => $dgRecords
        ]);
        exit;
    }`;

// B. Update suggestNextNumber to normalize branch names and fallback to 0001
const oldSuggest = `    if ($actionGet === 'suggestNextNumber') {
        $targetKantor = trim($_GET['kantor'] ?? 'Pusat');
        $targetJenis = trim($_GET['jenisDokumen'] ?? 'NoLap');
        $targetPeriode = trim($_GET['periode'] ?? date('Y'));

        $regList = muatRegisterConfig($registerConfigFile);
        $found = null;
        foreach ($regList as $r) {
            if (strcasecmp($r['kantor'] ?? '', $targetKantor) === 0 &&
                strcasecmp($r['jenisDokumen'] ?? '', $targetJenis) === 0 &&
                strcasecmp($r['periode'] ?? '', $targetPeriode) === 0) {
                $found = $r;
                break;
            }
        }

        if ($found) {
            echo json_encode([
                'success' => true,
                'kantor' => $found['kantor'],
                'kodeKantor' => $found['kodeKantor'] ?? ($OFFICIAL_BRANCH_CODES[$found['kantor']] ?? '2.0160-00'),
                'jenisDokumen' => $found['jenisDokumen'],
                'nomorTerakhir' => (int)($found['nomorTerakhir'] ?? 0),
                'kandidatBerikutnya' => $found['kandidatBerikutnya'] ?? '00001',
                'sumberBukti' => $found['sumberBukti'] ?? '',
                'status' => $found['status'] ?? 'AKTIF',
                'nomorTerpakai' => $found['nomorTerpakai'] ?? []
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'kantor' => $targetKantor,
                'kodeKantor' => $OFFICIAL_BRANCH_CODES[$targetKantor] ?? '2.0160-00',
                'jenisDokumen' => $targetJenis,
                'nomorTerakhir' => 0,
                'kandidatBerikutnya' => '00001',
                'status' => 'DEFAULT_FALLBACK',
                'nomorTerpakai' => []
            ]);
        }
        exit;
    }`;

const newSuggest = `    if ($actionGet === 'suggestNextNumber') {
        $rawKantor = trim($_GET['kantor'] ?? 'Pusat');
        $targetKantor = trim(preg_replace('/^(Kantor\\s+Cabang|Cabang|Kantor)\\s+/i', '', $rawKantor));
        if (empty($targetKantor)) $targetKantor = 'Pusat';
        $targetJenis = trim($_GET['jenisDokumen'] ?? 'NoLap');
        $targetPeriode = trim($_GET['periode'] ?? date('Y'));

        $regList = muatRegisterConfig($registerConfigFile);
        $found = null;
        foreach ($regList as $r) {
            if (strcasecmp($r['kantor'] ?? '', $targetKantor) === 0 &&
                strcasecmp($r['jenisDokumen'] ?? '', $targetJenis) === 0 &&
                strcasecmp($r['periode'] ?? '', $targetPeriode) === 0) {
                $found = $r;
                break;
            }
        }

        if ($found) {
            $lastNum = (int)($found['nomorTerakhir'] ?? 0);
            $cand = $found['kandidatBerikutnya'] ?? '';
            if (empty($cand) || !is_numeric($cand) || $cand === 'MENUNGGU_REKONSILIASI') {
                $cand = str_pad($lastNum + 1, ($targetJenis === 'NoLap' ? 5 : 4), '0', STR_PAD_LEFT);
            }
            echo json_encode([
                'success' => true,
                'kantor' => $found['kantor'],
                'kodeKantor' => $found['kodeKantor'] ?? ($OFFICIAL_BRANCH_CODES[$found['kantor']] ?? '2.0160-00'),
                'jenisDokumen' => $found['jenisDokumen'],
                'nomorTerakhir' => $lastNum,
                'kandidatBerikutnya' => $cand,
                'sumberBukti' => $found['sumberBukti'] ?? '',
                'status' => $found['status'] ?? 'AKTIF',
                'nomorTerpakai' => $found['nomorTerpakai'] ?? []
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'kantor' => $targetKantor,
                'kodeKantor' => $OFFICIAL_BRANCH_CODES[$targetKantor] ?? '2.0160-00',
                'jenisDokumen' => $targetJenis,
                'nomorTerakhir' => 0,
                'kandidatBerikutnya' => ($targetJenis === 'NoLap' ? '00001' : '0001'),
                'status' => 'DEFAULT_FALLBACK',
                'nomorTerpakai' => []
            ]);
        }
        exit;
    }`;

// C. Insert publishMandiriCabangLP and submitPengajuanPusatLP right before publishOfficialLP
const publishMandiriBlock = `    // =========================================================================
    // 4.A. PENERBITAN RESMI LINGKUP PENUGASAN (SPK) & JOB ORDER (JO) MANDIRI CABANG (JALUR A)
    // =========================================================================
    if ($action === 'publishMandiriCabangLP') {
        // 1. Otorisasi Peran: Admin Cabang, Penilai Publik / Rekan Cabang, atau SUPER ADMIN (KING)
        $isBranchAuth = in_array($userRole, ['ADMIN_CABANG', 'PENILAI', 'PENILAI_PUBLIK', 'REKAN'], true);
        $isKing = ($userRole === 'SUPER_ADMIN');
        if (!$isBranchAuth && !$isKing) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Akses Ditolak (403 Forbidden): Penerbitan nomor Lingkup Penugasan (SPK) & JO Mandiri Cabang hanya dapat dilakukan oleh Admin Cabang yang berwenang, Pimpinan Cabang, atau SUPER ADMIN (KING).'
            ]);
            exit;
        }

        $idPenugasan = trim($payload['idPenugasan'] ?? ($payload['id'] ?? ''));
        if (!$idPenugasan) {
            $idPenugasan = 'NSR-' . strtoupper(substr(md5(uniqid()), 0, 4)) . '-' . date('Y');
        }

        $rawKantor = trim($payload['kantorWilayah'] ?? ($payload['kantor_wilayah'] ?? ($userBranch ?: 'Bandung')));
        $branchName = trim(preg_replace('/^(Kantor\\s+Cabang|Cabang|Kantor)\\s+/i', '', $rawKantor));
        if (empty($branchName) || strcasecmp($branchName, 'Pusat') === 0) {
            $branchName = $userBranch ?: 'Bandung';
        }

        // Isolasi Cabang: Staf Cabang dilarang menerbitkan nomor atas nama cabang lain
        if (!$isKing && !empty($userBranch) && strcasecmp($userBranch, 'Pusat') !== 0 && strcasecmp($userBranch, $branchName) !== 0) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => "Akses Ditolak (403): Sesi Anda terikat pada Cabang '{$userBranch}', dilarang menerbitkan nomor untuk Cabang '{$branchName}'."
            ]);
            exit;
        }

        // Matriks Kewenangan Profesional Penilai Publik Cabang KJPP NSR:
        // Bandung: PP (Penilai Properti - Komprehensif & Sederhana)
        // Padang: PS (Penilai Properti Sederhana - Strictly Sederhana)
        // Makassar: PS (Penilai Properti Sederhana - Strictly Sederhana)
        // Palembang: PS (Penilai Properti Sederhana - Strictly Sederhana)
        $branchCompetencyMatrix = [
            'Bandung' => [
                'kode' => 'BDG',
                'kode_kantor' => '2.0160-04',
                'klasifikasi_cabang' => 'PP',
                'rekan_id' => 'deni_penilai',
                'rekan_nama' => 'Deni Siswandi, S.T., MAPPI (Cert.)',
                'rekan_izin' => 'P-1.20.00581',
                'rekan_klasifikasi' => 'P',
                'allowed_services' => ['PROPERTY', 'PROPERTY_SIMPLE', 'P', 'PS']
            ],
            'Padang' => [
                'kode' => 'PDG',
                'kode_kantor' => '2.0160-02',
                'klasifikasi_cabang' => 'PS',
                'rekan_id' => 'hernita_penilai',
                'rekan_nama' => 'Hernita, S.Si., MAPPI (Cert.)',
                'rekan_izin' => 'PS-1.15.00046',
                'rekan_klasifikasi' => 'PS',
                'allowed_services' => ['PROPERTY_SIMPLE', 'PS']
            ],
            'Makassar' => [
                'kode' => 'MKS',
                'kode_kantor' => '2.0160-03',
                'klasifikasi_cabang' => 'PS',
                'rekan_id' => 'amin_penilai',
                'rekan_nama' => 'Muhammad Amin Sade, S.M., MAPPI (Cert.)',
                'rekan_izin' => 'PS-1.16.00126',
                'rekan_klasifikasi' => 'PS',
                'allowed_services' => ['PROPERTY_SIMPLE', 'PS']
            ],
            'Palembang' => [
                'kode' => 'PLB',
                'kode_kantor' => '2.0160-05',
                'klasifikasi_cabang' => 'PS',
                'rekan_id' => 'dharma_penilai',
                'rekan_nama' => 'Dharma Priyanto Sih Budi Susilo, S.T., MAPPI (Cert.)',
                'rekan_izin' => 'PS-1.19.00249',
                'rekan_klasifikasi' => 'PS',
                'allowed_services' => ['PROPERTY_SIMPLE', 'PS']
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
            echo json_encode([
                'success' => false,
                'error' => "Kantor Cabang '{$branchName}' tidak terdaftar dalam matriks cabang resmi KJPP NSR (Bandung, Padang, Makassar, Palembang)."
            ]);
            exit;
        }

        $branchConfig = $branchCompetencyMatrix[$matchedBranchKey];

        // Validasi Batasan Kewenangan Profesional PP vs PS
        $serviceClass = strtoupper(trim($payload['serviceClassification'] ?? ($payload['service_classification_id'] ?? ($payload['klasifikasiJasa'] ?? ''))));
        $jenisObjek = strtolower(trim($payload['jenisObjek'] ?? ($payload['jenis_objek'] ?? '')));
        $tujuan = strtolower(trim($payload['tujuanPenilaian'] ?? ($payload['tujuan_penilaian'] ?? '')));

        $isComplexObject = (
            stripos($jenisObjek, 'hotel') !== false ||
            stripos($jenisObjek, 'mall') !== false ||
            stripos($jenisObjek, 'pabrik') !== false ||
            stripos($jenisObjek, 'industri') !== false ||
            stripos($jenisObjek, 'apartemen') !== false ||
            stripos($jenisObjek, 'komersial') !== false ||
            stripos($tujuan, 'psak') !== false ||
            stripos($tujuan, 'laporan keuangan') !== false ||
            (stripos($tujuan, 'pengadaan tanah') !== false && stripos($tujuan, 'skala kecil') === false)
        );

        if ($branchConfig['klasifikasi_cabang'] === 'PS') {
            $isExplicitComprehensive = in_array($serviceClass, ['PROPERTY', 'P', 'BUSINESS', 'B', 'PERSONAL_PROPERTY', 'PP'], true);
            if ($isExplicitComprehensive || $isComplexObject) {
                http_response_code(422); // 422 Unprocessable Entity
                echo json_encode([
                    'success' => false,
                    'error' => "Kewenangan Mandiri Cabang Ditolak (PMK 101/2014 & SPI 204): Kantor Cabang {$matchedBranchKey} memiliki kewenangan Penilai Properti Sederhana (PS). Pekerjaan berklasifikasi Komprehensif / Komersial / Industri / PSAK / Pengadaan Tanah Skala Besar tidak boleh diterbitkan secara Mandiri oleh Cabang PS dan WAJIB diajukan melalui Jalur Pengajuan Pusat (Jalur B) untuk penugasan Penilai Publik berizin P (Ir. Nanang Rahayu / Deni Siswandi).",
                    'violation' => 'INSUFFICIENT_BRANCH_COMPETENCY',
                    'rekomendasi_jalur' => 'PENGAJUAN_PUSAT',
                    'branch' => $matchedBranchKey,
                    'branch_competency' => 'PS'
                ]);
                exit;
            }
        }

        $nowWib = date('c');
        $rawTgl = $payload['tanggalSurat'] ?? ($payload['tanggal_surat'] ?? 'now');
        $dSurat = new DateTime($rawTgl);
        $thn = $dSurat->format('Y');
        $romawiArr = [1=>'I',2=>'II',3=>'III',4=>'IV',5=>'V',6=>'VI',7=>'VII',8=>'VIII',9=>'IX',10=>'X',11=>'XI',12=>'XII'];
        $romawi = $romawiArr[(int)$dSurat->format('n')] ?? 'X';
        $rawJenisLap = $payload['jenisLaporan'] ?? ($payload['jenis_laporan'] ?? 'APP');
        $jenisLap = (strtoupper($rawJenisLap) === 'RTL') ? 'PN-RTL' : 'PN-APP';

        $nomorLpResmi = trim($payload['nomorLpResmi'] ?? ($payload['nomor_lp'] ?? ''));
        $nomorAdmResmi = trim($payload['nomorAdmResmi'] ?? ($payload['nomor_adm'] ?? ''));

        // Anti-Duplikasi Keras terhadap Database Terintegrasi
        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        foreach ($dgRecords as $r) {
            if (($r['idPenugasan'] ?? '') !== $idPenugasan && ($r['gerbang1']['status'] ?? '') !== 'VOID' && ($r['gerbang1']['status'] ?? '') !== 'DIBATALKAN') {
                $existLp = trim($r['gerbang1']['nomorLpResmi'] ?? ($r['nomor_lp'] ?? ($r['nomorLp'] ?? '')));
                if ($nomorLpResmi && $existLp && strcasecmp($existLp, $nomorLpResmi) === 0) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'error' => "Penetapan ditolak (Nomor Duplikat): Nomor SPK '{$nomorLpResmi}' sudah terdaftar pada penugasan {$r['idPenugasan']} ({$r['namaKlien']}).",
                        'violation' => 'DUPLICATE_SPK_NUMBER'
                    ]);
                    exit;
                }
                $existAdm = trim($r['gerbang1']['nomorAdmResmi'] ?? ($r['nomor_adm'] ?? ($r['nomorAdm'] ?? '')));
                if ($nomorAdmResmi && $existAdm && strcasecmp($existAdm, $nomorAdmResmi) === 0) {
                    http_response_code(409);
                    echo json_encode([
                        'success' => false,
                        'error' => "Penetapan ditolak (Nomor Duplikat): Nomor JO '{$nomorAdmResmi}' sudah terdaftar pada penugasan {$r['idPenugasan']} ({$r['namaKlien']}).",
                        'violation' => 'DUPLICATE_JO_NUMBER'
                    ]);
                    exit;
                }
            }
        }

        // Smart Register Atomic Lock untuk Cabang
        $regLock = $dataDir . '/register_config.lock';
        $fpRegLock = fopen($regLock, 'c+');
        if (!$fpRegLock || !flock($fpRegLock, LOCK_EX)) {
            http_response_code(503);
            echo json_encode(['success' => false, 'error' => 'Gagal mengunci register server (Server Busy).']);
            exit;
        }

        $regList = muatRegisterConfig($registerConfigFile);
        $targetKantor = $matchedBranchKey;
        $codeCabang = $branchConfig['kode'];

        $lpRegIdx = -1;
        $joRegIdx = -1;
        foreach ($regList as $idx => $r) {
            if (strcasecmp($r['kantor'] ?? '', $targetKantor) === 0 && ($r['periode'] ?? '') === $thn) {
                if (($r['jenisDokumen'] ?? '') === 'LP_SPK') $lpRegIdx = $idx;
                if (($r['jenisDokumen'] ?? '') === 'JO') $joRegIdx = $idx;
            }
        }

        // Resolusi Sequence SPK
        $seqLp = 0;
        if (!empty($nomorLpResmi) && !str_contains($nomorLpResmi, 'MENUNGGU') && !str_contains($nomorLpResmi, 'AUTO') && !str_contains($nomorLpResmi, '[Ditetapkan')) {
            $seqLp = (int)preg_replace('/\\D/', '', explode('/', $nomorLpResmi)[0] ?? '0');
        }
        if ($seqLp <= 0) {
            $lastLp = ($lpRegIdx >= 0) ? (int)($regList[$lpRegIdx]['nomorTerakhir'] ?? 0) : 0;
            $seqLp = $lastLp + 1;
        }
        $padLp = str_pad($seqLp, 4, '0', STR_PAD_LEFT);
        $nomorLpResmi = "{$padLp}/NSR-{$codeCabang}/{$jenisLap}/{$romawi}/{$thn}";

        // Resolusi Sequence JO
        $seqAdm = 0;
        if (!empty($nomorAdmResmi) && !str_contains($nomorAdmResmi, 'MENUNGGU') && !str_contains($nomorAdmResmi, 'AUTO') && !str_contains($nomorAdmResmi, '[Ditetapkan')) {
            $seqAdm = (int)preg_replace('/\\D/', '', explode('-', $nomorAdmResmi)[1] ?? explode('/', $nomorAdmResmi)[0] ?? '0');
        }
        if ($seqAdm <= 0) {
            $lastAdm = ($joRegIdx >= 0) ? (int)($regList[$joRegIdx]['nomorTerakhir'] ?? 0) : 0;
            $seqAdm = max($lastAdm + 1, $seqLp);
        }
        $padAdm = str_pad($seqAdm, 4, '0', STR_PAD_LEFT);
        $nomorAdmResmi = "{$codeCabang}-{$padAdm}";

        // Update Register Cabang LP_SPK
        if ($lpRegIdx >= 0) {
            if (!in_array($padLp, $regList[$lpRegIdx]['nomorTerpakai'] ?? [], true)) {
                $regList[$lpRegIdx]['nomorTerpakai'][] = $padLp;
            }
            if ($seqLp > (int)($regList[$lpRegIdx]['nomorTerakhir'] ?? 0)) {
                $regList[$lpRegIdx]['nomorTerakhir'] = $seqLp;
                $regList[$lpRegIdx]['kandidatBerikutnya'] = str_pad($seqLp + 1, 4, '0', STR_PAD_LEFT);
            }
            $regList[$lpRegIdx]['status'] = 'AKTIF';
            $regList[$lpRegIdx]['updatedAt'] = $nowWib;
        }

        // Update Register Cabang JO
        if ($joRegIdx >= 0) {
            if (!in_array($padAdm, $regList[$joRegIdx]['nomorTerpakai'] ?? [], true)) {
                $regList[$joRegIdx]['nomorTerpakai'][] = $padAdm;
            }
            if ($seqAdm > (int)($regList[$joRegIdx]['nomorTerakhir'] ?? 0)) {
                $regList[$joRegIdx]['nomorTerakhir'] = $seqAdm;
                $regList[$joRegIdx]['kandidatBerikutnya'] = str_pad($seqAdm + 1, 4, '0', STR_PAD_LEFT);
            }
            $regList[$joRegIdx]['status'] = 'AKTIF';
            $regList[$joRegIdx]['updatedAt'] = $nowWib;
        }

        simpanRegisterConfig($registerConfigFile, $regList);
        flock($fpRegLock, LOCK_UN);
        fclose($fpRegLock);

        // Update Database Dual Gate Server
        $targetIdx = -1;
        foreach ($dgRecords as $i => $r) {
            if (($r['idPenugasan'] ?? '') === $idPenugasan) { $targetIdx = $i; break; }
        }

        $pejabatNama = $branchConfig['rekan_nama'];
        $pejabatIzin = $branchConfig['rekan_izin'];
        $pejabatOtorisasi = "Pimpinan Cabang {$matchedBranchKey} ({$pejabatNama})";

        $dgEntry = [
            'idPenugasan' => $idPenugasan,
            'noPermintaan' => $payload['noPermintaan'] ?? $idPenugasan,
            'createdAt' => $nowWib,
            'createdBy' => "Kantor Cabang {$matchedBranchKey}",
            'createdRole' => $userRole,
            'kantorAsal' => $matchedBranchKey,
            'kantor_wilayah' => "Kantor Cabang {$matchedBranchKey}",
            'origin_branch_id' => $matchedBranchKey,
            'origin_branch_code' => $branchConfig['kode_kantor'],
            'requested_signing_office' => strtoupper($matchedBranchKey),
            'signing_office_code' => $branchConfig['kode_kantor'],
            'jalur_penerbitan' => 'MANDIRI_CABANG',
            'status' => 'APPROVED',
            'status_approval' => 'APPROVED_CABANG',
            'nomor_lp' => $nomorLpResmi,
            'nomor_adm' => $nomorAdmResmi,
            'disetujui_oleh' => $pejabatOtorisasi,
            'tujuanPenilaian' => $payload['tujuanPenilaian'] ?? ($payload['tujuan_penilaian'] ?? 'Agunan Bank'),
            'jenisObjek' => $payload['jenisObjek'] ?? ($payload['jenis_objek'] ?? 'Properti'),
            'namaKlien' => $payload['namaKlien'] ?? ($payload['pemberi_tugas_nama'] ?? 'Klien'),
            'namaDebitur' => $payload['namaDebitur'] ?? ($payload['debitur_nama'] ?? '-'),
            'penugasan' => [
                'penilaiPublikDitunjuk' => $pejabatNama,
                'penilaiPublikId' => $branchConfig['rekan_id'],
                'penilaiPublikIzin' => $pejabatIzin,
                'rekanKlasifikasi' => $branchConfig['rekan_klasifikasi'],
                'originBranchId' => $matchedBranchKey,
                'signingOffice' => $matchedBranchKey
            ],
            'gerbang1' => [
                'status' => 'LP_DITERBITKAN',
                'jalur' => 'MANDIRI_CABANG',
                'nomorLpResmi' => $nomorLpResmi,
                'nomorAdmResmi' => $nomorAdmResmi,
                'diterbitkanPada' => $nowWib,
                'diterbitkanOleh' => $pejabatOtorisasi,
                'pejabatBerwenang' => $pejabatNama,
                'nomorIzinPejabat' => $pejabatIzin,
                'kantorPenerbit' => "Kantor Cabang {$matchedBranchKey}"
            ],
            'pengaju' => $payload['pengaju'] ?? [
                'nama' => $payload['pengaju_nama'] ?? ($currentUser['nama'] ?? $userDisplayName),
                'nik' => $payload['pengaju_nik'] ?? '-',
                'email' => $payload['pengaju_email'] ?? '',
                'whatsapp_number' => $payload['pengaju_wa'] ?? ''
            ],
            'projectData' => $payload['projectData'] ?? $payload
        ];

        if ($targetIdx >= 0) {
            $dgRecords[$targetIdx] = array_merge($dgRecords[$targetIdx], $dgEntry);
        } else {
            $dgRecords[] = $dgEntry;
        }

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        echo json_encode([
            'success' => true,
            'message' => "Nomor Lingkup Penugasan (SPK) & Job Order resmi Mandiri Cabang {$matchedBranchKey} berhasil diterbitkan dan disimpan secara resmi di server.",
            'idPenugasan' => $idPenugasan,
            'status' => 'APPROVED',
            'status_approval' => 'APPROVED_CABANG',
            'jalur' => 'MANDIRI_CABANG',
            'nomorLpResmi' => $nomorLpResmi,
            'nomorAdmResmi' => $nomorAdmResmi,
            'diterbitkanOleh' => $pejabatOtorisasi,
            'pejabatBerwenang' => $pejabatNama,
            'nomorIzinPejabat' => $pejabatIzin,
            'kantorWilayah' => "Kantor Cabang {$matchedBranchKey}"
        ]);
        exit;
    }

    // =========================================================================
    // 4.B. PENGAJUAN LINGKUP PENUGASAN CABANG KE KANTOR PUSAT (JALUR B)
    // =========================================================================
    if ($action === 'submitPengajuanPusatLP') {
        $idPenugasan = trim($payload['idPenugasan'] ?? ($payload['id'] ?? ''));
        if (!$idPenugasan) {
            $idPenugasan = 'NSR-' . strtoupper(substr(md5(uniqid()), 0, 4)) . '-' . date('Y');
        }

        $nowWib = date('c');
        $rawKantor = trim($payload['kantorWilayah'] ?? ($payload['kantor_wilayah'] ?? ($userBranch ?: 'Kantor Cabang')));
        $branchName = trim(preg_replace('/^(Kantor\\s+Cabang|Cabang|Kantor)\\s+/i', '', $rawKantor));

        $dgRecords = muatDatabaseDualGate($dualGateDbFile);
        $targetIdx = -1;
        foreach ($dgRecords as $i => $r) {
            if (($r['idPenugasan'] ?? '') === $idPenugasan) { $targetIdx = $i; break; }
        }

        $dgEntry = [
            'idPenugasan' => $idPenugasan,
            'noPermintaan' => $payload['noPermintaan'] ?? $idPenugasan,
            'createdAt' => $nowWib,
            'createdBy' => "Kantor Cabang {$branchName}",
            'createdRole' => $userRole,
            'kantorAsal' => $branchName,
            'kantor_wilayah' => "Kantor Cabang {$branchName}",
            'origin_branch_id' => $branchName,
            'origin_branch_code' => $OFFICIAL_BRANCH_CODES[$branchName] ?? '2.0160-00',
            'requested_signing_office' => 'PUSAT',
            'signing_office_code' => '2.0160-00',
            'jalur_penerbitan' => 'PENGAJUAN_PUSAT',
            'status' => 'WAITING_APPROVAL',
            'status_approval' => 'WAITING_APPROVAL',
            'nomor_lp' => '[Ditetapkan oleh Admin Pusat saat Approval]',
            'nomor_adm' => '[Ditetapkan oleh Admin Pusat saat Approval]',
            'tujuanPenilaian' => $payload['tujuanPenilaian'] ?? ($payload['tujuan_penilaian'] ?? 'Agunan Bank'),
            'jenisObjek' => $payload['jenisObjek'] ?? ($payload['jenis_objek'] ?? 'Properti'),
            'namaKlien' => $payload['namaKlien'] ?? ($payload['pemberi_tugas_nama'] ?? 'Klien'),
            'namaDebitur' => $payload['namaDebitur'] ?? ($payload['debitur_nama'] ?? '-'),
            'gerbang1' => [
                'status' => 'WAITING_APPROVAL',
                'jalur' => 'PENGAJUAN_PUSAT',
                'submittedAt' => $nowWib,
                'submittedBy' => $currentUser['nama'] ?? $userDisplayName
            ],
            'pengaju' => $payload['pengaju'] ?? [
                'nama' => $payload['pengaju_nama'] ?? ($currentUser['nama'] ?? $userDisplayName),
                'nik' => $payload['pengaju_nik'] ?? '-',
                'email' => $payload['pengaju_email'] ?? '',
                'whatsapp_number' => $payload['pengaju_wa'] ?? ''
            ],
            'projectData' => $payload['projectData'] ?? $payload
        ];

        if ($targetIdx >= 0) {
            $dgRecords[$targetIdx] = array_merge($dgRecords[$targetIdx], $dgEntry);
        } else {
            $dgRecords[] = $dgEntry;
        }

        simpanDatabaseDualGate($dualGateDbFile, $dgRecords);

        // Notifikasi ke antrean verifikasi Admin Pusat
        antrekanEmailDualGate($mailQueueFile, [
            'event'         => 'PENGAJUAN_LP_CABANG',
            'idPenugasan'   => $idPenugasan,
            'recipient'     => 'admin.pusat@kjppnanangrahayu.com',
            'recipientName' => 'Admin Kantor Pusat KJPP NSR',
            'subject'       => "[OPINI NSR] Permohonan Penerbitan SPK/JO Cabang {$branchName} - ID: {$idPenugasan}",
            'body'          => "Yth. Tim Admin Kantor Pusat,\\n\\nTelah diajukan permohonan penerbitan Lingkup Penugasan (SPK) & Job Order (JO) dari Kantor Cabang {$branchName}.\\nID Penugasan: {$idPenugasan}\\nDebitur: " . ($dgEntry['namaDebitur'] ?: '-') . "\\nKlien: " . ($dgEntry['namaKlien'] ?: '-') . "\\n\\nSilakan lakukan verifikasi & persetujuan nomor resmi melalui Portal OPINI NSR Meja Approval Pusat."
        ]);

        echo json_encode([
            'success' => true,
            'message' => "Permohonan penerbitan Lingkup Penugasan & JO berhasil diajukan ke antrean verifikasi Kantor Pusat.",
            'idPenugasan' => $idPenugasan,
            'status' => 'WAITING_APPROVAL',
            'jalur' => 'PENGAJUAN_PUSAT'
        ]);
        exit;
    }

`;

// Perform PHP replacements
console.log('2. Mengaplikasikan patch ke nolap-data-handler.php...');

// Normalize CRLF to LF temporarily for replacement, or replace with regex/indexOf
function replaceInPhp(original, target, replacement) {
    const normOrig = original.replace(/\r\n/g, '\n');
    const normTarget = target.replace(/\r\n/g, '\n');
    const normRep = replacement.replace(/\r\n/g, '\n');
    if (!normOrig.includes(normTarget)) {
        throw new Error('Target string not found in PHP file: ' + normTarget.substring(0, 50) + '...');
    }
    const res = normOrig.replace(normTarget, normRep);
    return res.replace(/\n/g, '\r\n');
}

phpCode = replaceInPhp(phpCode, oldListAll, newListAll);
phpCode = replaceInPhp(phpCode, oldSuggest, newSuggest);

const needlePublishOfficial = '    // 4. PENERBITAN NOMOR LINGKUP PENUGASAN (SPK) & JOB ORDER (JO) RESMI OLEH ADMIN PUSAT / SUPER ADMIN KING';
phpCode = replaceInPhp(phpCode, needlePublishOfficial, publishMandiriBlock + needlePublishOfficial);

fs.writeFileSync(phpPath, phpCode, 'utf8');
console.log('✓ nolap-data-handler.php berhasil diperbarui!');
