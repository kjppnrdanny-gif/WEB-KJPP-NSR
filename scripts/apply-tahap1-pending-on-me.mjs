/**
 * KJPP NSR — Skrip Penerapan Tahap 1: "Pending On Me" e-Operasional
 * 1. Backend: Tambahkan evaluatePengajuanPendingStatus() dan filter pendingOnMe di operasional-data-handler.php
 * 2. Frontend: Tambahkan Tab "Menunggu Persetujuan Saya", badge counter dinamis, timeline persetujuan 1->2->3, dan alert penolakan/revisi di portal-operasional.html
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🚀 Memulai penerapan Tahap 1: Pending on Me e-Operasional...');

// ============================================================================
// 1. UPDATE operasional-data-handler.php
// ============================================================================
const phpPath = path.join(ROOT_DIR, 'operasional-data-handler.php');
let phpContent = fs.readFileSync(phpPath, 'utf8');

// A. Insert evaluatePengajuanPendingStatus() before resolveCurrentUser()
const targetBeforeAuth = `// -------------------------------------------------------------
// 7. AUTENTIKASI PENGGUNA
// -------------------------------------------------------------
function resolveCurrentUser($officialTokenHashes) {`;

const pendingFunctionCode = `/**
 * KJPP NSR — Evaluasi Status Persetujuan "Menunggu Tindakan Saya" (Pending On Me)
 * Memetakan dokumen pengajuan terhadap wewenang (RBAC) dan urutan sequential pengguna saat ini.
 *
 * @param array $doc Dokumen pengajuan operasional
 * @param array $user Data pengguna terautentikasi
 * @return array Hasil evaluasi: isPending (bool), pendingTier (int|null), tierInfo (array|null), reason (string)
 */
function evaluatePengajuanPendingStatus($doc, $user) {
    $status = strtoupper(trim($doc['status'] ?? 'DRAFT'));
    $approvals = $doc['approvals'] ?? [];
    $userPermissions = $user['permissions'] ?? [];
    $userRole = strtoupper(trim($user['role'] ?? ''));
    $userDisplayName = trim($user['displayName'] ?? '');
    $userSub = trim($user['sub'] ?? '');

    // 1. Dokumen APPROVED sudah sah sepenuhnya, tidak menunggu tindakan siapapun
    if ($status === 'APPROVED') {
        return [
            'isPending'    => false,
            'pendingTier'  => null,
            'tierInfo'     => null,
            'reason'       => 'SELESAI'
        ];
    }

    // 2. Dokumen REJECTED: Menunggu revisi dari pemohon / pembuat dokumen
    if ($status === 'REJECTED') {
        $pemohonSub = trim($doc['pemohon']['sub'] ?? $doc['createdBy']['sub'] ?? '');
        $pemohonNama = trim($doc['pemohon']['nama'] ?? $doc['createdBy']['userLogin'] ?? $doc['namaPengaju'] ?? '');
        $isMyDoc = ($userSub && $pemohonSub && $userSub === $pemohonSub) ||
                   ($userDisplayName && $pemohonNama && strcasecmp($userDisplayName, $pemohonNama) === 0) ||
                   in_array($userRole, ['SURVEYOR', 'STAFF'], true) ||
                   empty($user['canApprove']);

        if ($isMyDoc) {
            return [
                'isPending'    => true,
                'pendingTier'  => null,
                'tierInfo'     => null,
                'reason'       => 'REVISI_PEMOHON'
            ];
        }
        return [
            'isPending'    => false,
            'pendingTier'  => null,
            'tierInfo'     => null,
            'reason'       => 'MENUNGGU_REVISI_PEMOHON'
        ];
    }

    // 3. Dokumen DRAFT: Menunggu kirim resmi dari pemohon
    if ($status === 'DRAFT') {
        $pemohonSub = trim($doc['pemohon']['sub'] ?? $doc['createdBy']['sub'] ?? '');
        $pemohonNama = trim($doc['pemohon']['nama'] ?? $doc['createdBy']['userLogin'] ?? $doc['namaPengaju'] ?? '');
        $isMyDoc = ($userSub && $pemohonSub && $userSub === $pemohonSub) ||
                   ($userDisplayName && $pemohonNama && strcasecmp($userDisplayName, $pemohonNama) === 0) ||
                   empty($user['canApprove']);

        if ($isMyDoc) {
            return [
                'isPending'    => true,
                'pendingTier'  => null,
                'tierInfo'     => null,
                'reason'       => 'DRAFT_PEMOHON'
            ];
        }
        return [
            'isPending'    => false,
            'pendingTier'  => null,
            'tierInfo'     => null,
            'reason'       => 'DRAFT_OTHER'
        ];
    }

    // 4. Dokumen SUBMITTED / IN_REVIEW: Evaluasi alur berurutan (Sequential Enforcement)
    if (in_array($status, ['SUBMITTED', 'IN_REVIEW'], true)) {
        if (empty($user['canApprove']) || empty($userPermissions)) {
            // Akun staf/surveyor biasa tidak memiliki wewenang approval
            return [
                'isPending'    => false,
                'pendingTier'  => null,
                'tierInfo'     => null,
                'reason'       => 'DALAM_PROSES_REVIEW'
            ];
        }

        $tierKeys = array_map('intval', array_keys($approvals));
        sort($tierKeys);

        $isLegacy5Tier = (($doc['workflowSystem'] ?? '') === '5_TIER') || (count($approvals) === 5 && !isset($approvals[1]['tingkat']));
        $alurDoc = strtoupper(trim($doc['alur'] ?? ''));

        $actionableTiers = [];

        if (!$isLegacy5Tier && ($alurDoc === 'LINTAS_DIVISI' || $alurDoc === 'LINTAS')) {
            // Lintas Divisi: Tingkat 1 (Teknik & Admin) dapat diproses bersamaan
            $tier1Done = !empty($approvals[1]['approved']);
            $tier2Done = !empty($approvals[2]['approved']);
            $tier3Done = !empty($approvals[3]['approved']);
            $tier4Done = !empty($approvals[4]['approved']);

            if (!$tier1Done) $actionableTiers[] = 1;
            if (!$tier2Done) $actionableTiers[] = 2;

            if ($tier1Done && $tier2Done && !$tier3Done) {
                $actionableTiers[] = 3;
            }
            if ($tier1Done && $tier2Done && $tier3Done && !$tier4Done) {
                $actionableTiers[] = 4;
            }
        } else {
            // Alur Linier (3-Tingkat Standar maupun Legacy 5-Tier)
            foreach ($tierKeys as $t) {
                if (empty($approvals[$t]['approved'])) {
                    $prevDone = true;
                    if ($t > 1) {
                        for ($p = 1; $p < $t; $p++) {
                            if (empty($approvals[$p]['approved'])) {
                                $prevDone = false;
                                break;
                            }
                        }
                    }
                    if ($prevDone) {
                        $actionableTiers[] = $t;
                    }
                    break; // Hanya satu tier yang aktif pada alur linier
                }
            }
        }

        foreach ($actionableTiers as $actTier) {
            $step = $approvals[$actTier] ?? [];
            $roleKey = $step['roleKey'] ?? '';

            $requiredPerm = null;
            if ($roleKey === 'TEKNIK') {
                $requiredPerm = 'APPROVE_TEKNIK';
            } elseif ($roleKey === 'ADMIN_UMUM') {
                $requiredPerm = 'APPROVE_ADMIN';
            } elseif ($roleKey === 'KEUANGAN') {
                $requiredPerm = 'APPROVE_KEUANGAN';
            } elseif ($roleKey === 'KEPALA_KEUANGAN') {
                $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
            } elseif ($isLegacy5Tier) {
                if ($actTier === 2) {
                    $requiredPerm = 'APPROVE_TEKNIK';
                } elseif ($actTier === 3) {
                    $requiredPerm = 'APPROVE_ADMIN';
                } elseif ($actTier === 4) {
                    $requiredPerm = 'APPROVE_KEUANGAN';
                } elseif ($actTier === 5) {
                    $requiredPerm = 'APPROVE_KEPALA_KEUANGAN';
                }
            }

            if ($requiredPerm && in_array($requiredPerm, $userPermissions, true)) {
                return [
                    'isPending'    => true,
                    'pendingTier'  => $actTier,
                    'tierInfo'     => $step,
                    'requiredPerm' => $requiredPerm,
                    'reason'       => 'WAITING_APPROVAL'
                ];
            }
        }
    }

    return [
        'isPending'    => false,
        'pendingTier'  => null,
        'tierInfo'     => null,
        'reason'       => 'NOT_PENDING_ON_USER'
    ];
}

// -------------------------------------------------------------
// 7. AUTENTIKASI PENGGUNA
// -------------------------------------------------------------
function resolveCurrentUser($officialTokenHashes) {`;

if (!phpContent.includes('function evaluatePengajuanPendingStatus(')) {
  const marker = 'function resolveCurrentUser($officialTokenHashes) {';
  if (phpContent.includes(marker)) {
    phpContent = phpContent.replace(marker, pendingFunctionCode + '\r\n' + marker);
    console.log('✔ Menambahkan function evaluatePengajuanPendingStatus() ke operasional-data-handler.php');
  } else {
    console.error('❌ Marker resolveCurrentUser tidak ditemukan!');
  }
}

// B. Update getPengajuanList
const targetGetList = `// C. ACTION: getPengajuanList
if ($action === 'getPengajuanList') {
    $records = readDatabaseOperasional($dataFile, $lockFile);

    $branchFilter = trim($_GET['branch'] ?? $_GET['cabang'] ?? '');
    $statusFilter = trim($_GET['status'] ?? '');
    $jenisFilter  = trim($_GET['jenis'] ?? '');

    $filtered = [];
    foreach ($records as $r) {
        if ($branchFilter && !empty($r['kantor']) && strcasecmp($r['kantor'], $branchFilter) !== 0) {
            continue;
        }
        if ($statusFilter && !empty($r['status']) && strcasecmp($r['status'], $statusFilter) !== 0) {
            continue;
        }
        if ($jenisFilter && !empty($r['jenisOperasional']) && strcasecmp($r['jenisOperasional'], $jenisFilter) !== 0) {
            continue;
        }
        $filtered[] = $r;
    }

    // Urutkan dari yang terbaru (LIFO)
    usort($filtered, function($a, $b) {
        return strcmp($b['updatedAt'] ?? $b['createdAt'] ?? '', $a['updatedAt'] ?? $a['createdAt'] ?? '');
    });

    echo json_encode([
        'success'     => true,
        'currentUser' => [
            'displayName' => $currentUser['displayName'] ?? '',
            'role'        => $userRole,
            'roleLabel'   => $currentUser['roleLabel'] ?? '',
            'title'       => $currentUser['title'] ?? '',
            'branch'      => $userBranch,
            'isMaster'    => $isMaster,
            'isSuperAdmin'=> !empty($currentUser['isSuperAdmin'])
        ],
        'total'       => count($filtered),
        'data'        => $filtered
    ]);
    exit;
}`;

const updatedGetList = `// C. ACTION: getPengajuanList
if ($action === 'getPengajuanList') {
    $records = readDatabaseOperasional($dataFile, $lockFile);

    $branchFilter  = trim($_GET['branch'] ?? $_GET['cabang'] ?? '');
    $statusFilter  = trim($_GET['status'] ?? '');
    $jenisFilter   = trim($_GET['jenis'] ?? '');
    $pendingFilter = trim($_GET['pendingOnMe'] ?? $_GET['pending_on_me'] ?? '');
    $isPendingOnly = ($pendingFilter === 'true' || $pendingFilter === '1' || $statusFilter === 'PENDING_ON_ME');

    $totalPendingOnMe = 0;
    $filtered = [];

    foreach ($records as $r) {
        // Evaluasi status approval pending pada dokumen
        $pendingEval = evaluatePengajuanPendingStatus($r, $currentUser);
        $r['isPendingOnMe'] = $pendingEval['isPending'];
        $r['pendingTier']   = $pendingEval['pendingTier'];
        $r['pendingReason'] = $pendingEval['reason'];
        $r['pendingInfo']   = $pendingEval['tierInfo'] ?? null;

        if ($pendingEval['isPending']) {
            $totalPendingOnMe++;
        }

        // Filter: Hanya yang Menunggu Tindakan Saya jika parameter pendingOnMe diaktifkan
        if ($isPendingOnly && !$pendingEval['isPending']) {
            continue;
        }

        if ($branchFilter && !empty($r['kantor']) && strcasecmp($r['kantor'], $branchFilter) !== 0) {
            continue;
        }
        if ($statusFilter && $statusFilter !== 'PENDING_ON_ME' && !empty($r['status']) && strcasecmp($r['status'], $statusFilter) !== 0) {
            continue;
        }
        if ($jenisFilter && !empty($r['jenisOperasional']) && strcasecmp($r['jenisOperasional'], $jenisFilter) !== 0) {
            continue;
        }
        $filtered[] = $r;
    }

    // Urutkan dari yang terbaru (LIFO)
    usort($filtered, function($a, $b) {
        return strcmp($b['updatedAt'] ?? $b['createdAt'] ?? '', $a['updatedAt'] ?? $a['createdAt'] ?? '');
    });

    echo json_encode([
        'success'      => true,
        'currentUser'  => [
            'displayName' => $currentUser['displayName'] ?? '',
            'role'        => $userRole,
            'roleLabel'   => $currentUser['roleLabel'] ?? '',
            'title'       => $currentUser['title'] ?? '',
            'branch'      => $userBranch,
            'isMaster'    => $isMaster,
            'isSuperAdmin'=> !empty($currentUser['isSuperAdmin']),
            'permissions' => $currentUser['permissions'] ?? [],
            'canApprove'  => !empty($currentUser['canApprove'])
        ],
        'pendingCount' => $totalPendingOnMe,
        'total'        => count($filtered),
        'data'         => $filtered
    ]);
    exit;
}`;

if (phpContent.includes(targetGetList)) {
  phpContent = phpContent.replace(targetGetList, updatedGetList);
  console.log('✔ Memperbarui action getPengajuanList di operasional-data-handler.php');
} else {
  // Check CRLF variations
  const targetGetListNorm = targetGetList.replace(/\r?\n/g, '\n');
  const phpContentNorm = phpContent.replace(/\r?\n/g, '\n');
  if (phpContentNorm.includes(targetGetListNorm)) {
    phpContent = phpContentNorm.replace(targetGetListNorm, updatedGetList.replace(/\r?\n/g, '\n'));
    console.log('✔ Memperbarui action getPengajuanList (setelah normalisasi newline)');
  } else {
    console.warn('⚠️ Target getPengajuanList tidak cocok persis.');
  }
}

// C. Update getPengajuanDetail to attach pending status as well
const targetGetDetail = `    if (!$found) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Dokumen pengajuan operasional tidak ditemukan.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'data'    => $found
    ]);
    exit;`;

const updatedGetDetail = `    if (!$found) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Dokumen pengajuan operasional tidak ditemukan.']);
        exit;
    }

    $pendingEval = evaluatePengajuanPendingStatus($found, $currentUser);
    $found['isPendingOnMe'] = $pendingEval['isPending'];
    $found['pendingTier']   = $pendingEval['pendingTier'];
    $found['pendingReason'] = $pendingEval['reason'];
    $found['pendingInfo']   = $pendingEval['tierInfo'] ?? null;

    echo json_encode([
        'success' => true,
        'data'    => $found
    ]);
    exit;`;

if (phpContent.includes(targetGetDetail)) {
  phpContent = phpContent.replace(targetGetDetail, updatedGetDetail);
  console.log('✔ Memperbarui action getPengajuanDetail di operasional-data-handler.php');
} else {
  const targetGetDetailNorm = targetGetDetail.replace(/\r?\n/g, '\n');
  const phpContentNorm = phpContent.replace(/\r?\n/g, '\n');
  if (phpContentNorm.includes(targetGetDetailNorm)) {
    phpContent = phpContentNorm.replace(targetGetDetailNorm, updatedGetDetail.replace(/\r?\n/g, '\n'));
    console.log('✔ Memperbarui action getPengajuanDetail (setelah normalisasi newline)');
  }
}

fs.writeFileSync(phpPath, phpContent, 'utf8');
console.log('💾 Berhasil menyimpan operasional-data-handler.php');

// ============================================================================
// 2. UPDATE portal-operasional.html
// ============================================================================
const portalPath = path.join(ROOT_DIR, 'portal-operasional.html');
let portalContent = fs.readFileSync(portalPath, 'utf8');

// A. Sub-Nav Tabs: Tambahkan Tab "Menunggu Persetujuan Saya"
const targetTabs = `<button type="button" onclick="gantiTabUtama('riwayat')" id="btn-tab-riwayat"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700">
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Riwayat &amp; Status Approval</span>
          <span id="badge-total-pengajuan" class="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] text-amber-300 font-mono">0</span>
        </button>
      </div>`;

const updatedTabs = `<button type="button" onclick="gantiTabUtama('riwayat')" id="btn-tab-riwayat"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700">
          <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Semua Riwayat</span>
          <span id="badge-total-pengajuan" class="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] text-amber-300 font-mono">0</span>
        </button>

        <button type="button" onclick="gantiTabUtama('pending')" id="btn-tab-pending"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700 relative">
          <svg class="w-4 h-4 text-rose-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Menunggu Persetujuan Saya</span>
          <span id="badge-pending-me" class="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold">0</span>
        </button>
      </div>`;

if (portalContent.includes(targetTabs)) {
  portalContent = portalContent.replace(targetTabs, updatedTabs);
  console.log('✔ Menambahkan Tab "Menunggu Persetujuan Saya" pada Sub-Nav');
} else {
  const targetTabsNorm = targetTabs.replace(/\r?\n/g, '\n');
  const portalNorm = portalContent.replace(/\r?\n/g, '\n');
  if (portalNorm.includes(targetTabsNorm)) {
    portalContent = portalNorm.replace(targetTabsNorm, updatedTabs.replace(/\r?\n/g, '\n'));
    console.log('✔ Menambahkan Tab "Menunggu Persetujuan Saya" (setelah normalisasi newline)');
  }
}

// B. Riwayat Filter Bar: Tambahkan Quick Pills & Opsi Status PENDING_ON_ME
const targetFilterBar = `<div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          
          <div>
            <label for="filter_jenis" class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Jenis Operasional</label>
            <select id="filter_jenis" onchange="muatDaftarPengajuan()"
              class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200">
              <option value="">Semua Jenis</option>
              <option value="OPR-SRV">Allowance Survey Lapangan</option>
              <option value="OPR-MTG">Allowance Meeting</option>
              <option value="OPR-UMM">Operasional Umum</option>
            </select>
          </div>

          <div>
            <label for="filter_status" class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Status Persetujuan</label>
            <select id="filter_status" onchange="muatDaftarPengajuan()"
              class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200">
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>`;

const updatedFilterBar = `<div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          
          <!-- Quick Status Pills -->
          <div class="w-full pb-2 mb-1 border-b border-slate-800/80 flex flex-wrap items-center gap-2">
            <span class="text-[10px] uppercase font-bold text-slate-500 mr-1">Filter Cepat:</span>
            <button type="button" onclick="setQuickStatusFilter('')" id="btn-quick-all"
              class="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 transition">
              Semua Pengajuan
            </button>
            <button type="button" onclick="setQuickStatusFilter('PENDING_ON_ME')" id="btn-quick-pending"
              class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-rose-500/40 flex items-center gap-1.5 transition">
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Menunggu Persetujuan Saya</span>
              <span id="badge-filter-pending" class="px-1.5 py-0.2 rounded-full bg-rose-600 text-[10px] text-white font-mono font-bold">0</span>
            </button>
            <button type="button" onclick="setQuickStatusFilter('REJECTED')" id="btn-quick-rejected"
              class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition">
              <span>Perlu Revisi (Ditolak)</span>
            </button>
            <button type="button" onclick="setQuickStatusFilter('APPROVED')" id="btn-quick-approved"
              class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition">
              Disetujui Sah
            </button>
          </div>

          <div>
            <label for="filter_jenis" class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Jenis Operasional</label>
            <select id="filter_jenis" onchange="muatDaftarPengajuan()"
              class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200">
              <option value="">Semua Jenis</option>
              <option value="OPR-SRV">Allowance Survey Lapangan</option>
              <option value="OPR-MTG">Allowance Meeting</option>
              <option value="OPR-UMM">Operasional Umum</option>
            </select>
          </div>

          <div>
            <label for="filter_status" class="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Status Persetujuan</label>
            <select id="filter_status" onchange="muatDaftarPengajuan()"
              class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold">
              <option value="">Semua Status</option>
              <option value="PENDING_ON_ME" class="text-rose-400 font-bold">⚡ Menunggu Persetujuan Saya</option>
              <option value="SUBMITTED">SUBMITTED (Diajukan)</option>
              <option value="IN_REVIEW">IN_REVIEW (Proses Approval)</option>
              <option value="APPROVED">APPROVED (Disetujui Sah)</option>
              <option value="REJECTED">REJECTED (Perlu Revisi)</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>`;

if (portalContent.includes(targetFilterBar)) {
  portalContent = portalContent.replace(targetFilterBar, updatedFilterBar);
  console.log('✔ Menambahkan Quick Status Pills & Opsi PENDING_ON_ME pada filter');
} else {
  const targetFilterBarNorm = targetFilterBar.replace(/\r?\n/g, '\n');
  const portalNorm = portalContent.replace(/\r?\n/g, '\n');
  if (portalNorm.includes(targetFilterBarNorm)) {
    portalContent = portalNorm.replace(targetFilterBarNorm, updatedFilterBar.replace(/\r?\n/g, '\n'));
    console.log('✔ Menambahkan Quick Status Pills (setelah normalisasi newline)');
  }
}

// C. Ubah Header Kolom Tabel: dari "Progress 5-Tier" ke "Timeline Otorisasi (Tingkat 1 → 2 → 3)"
const targetHeader = `<th class="py-3 px-4 min-w-[160px] text-center">Progress 5-Tier</th>`;
const updatedHeader = `<th class="py-3 px-4 min-w-[280px]">Timeline Otorisasi (Tingkat 1 &rarr; 2 &rarr; 3)</th>`;
portalContent = portalContent.replace(targetHeader, updatedHeader);

// D. Update JavaScript gantiTabUtama()
const targetJsGantiTab = `    // Switch Tabs
    function gantiTabUtama(tab) {
      const btnForm = document.getElementById('btn-tab-form');
      const btnRiwayat = document.getElementById('btn-tab-riwayat');
      const contentForm = document.getElementById('tab-form-content');
      const contentRiwayat = document.getElementById('tab-riwayat-content');

      if (tab === 'form') {
        btnForm.className = "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-amber-400 text-slate-950 shadow-md";
        btnRiwayat.className = "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700";
        contentForm.classList.remove('hidden');
        contentRiwayat.classList.add('hidden');
      } else {
        btnRiwayat.className = "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-amber-400 text-slate-950 shadow-md";
        btnForm.className = "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700";
        contentRiwayat.classList.remove('hidden');
        contentForm.classList.add('hidden');
        muatDaftarPengajuan();
      }
    }`;

const updatedJsGantiTab = `    // Helper Escape HTML
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Quick Status Filter
    function setQuickStatusFilter(statusVal) {
      const sel = document.getElementById('filter_status');
      if (sel) {
        sel.value = statusVal;
        muatDaftarPengajuan();
      }
    }

    // Switch Tabs
    function gantiTabUtama(tab) {
      const btnForm = document.getElementById('btn-tab-form');
      const btnRiwayat = document.getElementById('btn-tab-riwayat');
      const btnPending = document.getElementById('btn-tab-pending');
      const contentForm = document.getElementById('tab-form-content');
      const contentRiwayat = document.getElementById('tab-riwayat-content');
      const selStatus = document.getElementById('filter_status');

      const btnInactive = "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-slate-300 hover:bg-slate-700";
      const btnActiveAmber = "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-amber-400 text-slate-950 shadow-md";
      const btnActiveRose = "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-rose-500 text-white shadow-md";

      if (tab === 'form') {
        btnForm.className = btnActiveAmber;
        btnRiwayat.className = btnInactive;
        if (btnPending) btnPending.className = btnInactive;
        contentForm.classList.remove('hidden');
        contentRiwayat.classList.add('hidden');
      } else if (tab === 'pending') {
        if (btnPending) btnPending.className = btnActiveRose;
        btnForm.className = btnInactive;
        btnRiwayat.className = btnInactive;
        if (selStatus) selStatus.value = 'PENDING_ON_ME';
        contentRiwayat.classList.remove('hidden');
        contentForm.classList.add('hidden');
        muatDaftarPengajuan();
      } else {
        btnRiwayat.className = btnActiveAmber;
        btnForm.className = btnInactive;
        if (btnPending) btnPending.className = btnInactive;
        if (selStatus && selStatus.value === 'PENDING_ON_ME') selStatus.value = '';
        contentRiwayat.classList.remove('hidden');
        contentForm.classList.add('hidden');
        muatDaftarPengajuan();
      }
    }`;

if (portalContent.includes(targetJsGantiTab)) {
  portalContent = portalContent.replace(targetJsGantiTab, updatedJsGantiTab);
  console.log('✔ Memperbarui fungsi JavaScript gantiTabUtama() & helper');
} else {
  const targetJsGantiTabNorm = targetJsGantiTab.replace(/\r?\n/g, '\n');
  const portalNorm = portalContent.replace(/\r?\n/g, '\n');
  if (portalNorm.includes(targetJsGantiTabNorm)) {
    portalContent = portalNorm.replace(targetJsGantiTabNorm, updatedJsGantiTab.replace(/\r?\n/g, '\n'));
    console.log('✔ Memperbarui fungsi gantiTabUtama (setelah normalisasi newline)');
  }
}

// E. Update muatDaftarPengajuan() & renderTabelRiwayat()
const targetMuatDaftar = `    // Muat Daftar Riwayat
    async function muatDaftarPengajuan() {
      const tbody = document.getElementById('tbody-riwayat');
      tbody.innerHTML = \`<tr><td colspan="9" class="py-10 text-center text-slate-400">Memuat data riwayat...</td></tr>\`;

      const jenis = document.getElementById('filter_jenis').value;
      const status = document.getElementById('filter_status').value;
      const cabang = document.getElementById('filter_cabang').value;

      try {
        const res = await fetch(\`operasional-data-handler.php?action=getPengajuanList&jenis=\${encodeURIComponent(jenis)}&status=\${encodeURIComponent(status)}&cabang=\${encodeURIComponent(cabang)}\`, {
          headers: getAuthHeaders()
        });

        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          tampilkanAksesDitolakCabang(errData.error);
          return;
        }

        const json = await res.json();

        if (json.success) {
          if (json.currentUser) {
            CURRENT_USER = json.currentUser;
            const lblRole = document.getElementById('label-sesi-role');
            if (lblRole) {
              lblRole.innerText = \`\${CURRENT_USER.displayName} (\${CURRENT_USER.title || CURRENT_USER.roleLabel || CURRENT_USER.role})\`;
            }
            const inpNama = document.getElementById('input_nama_pengaju');
            if (inpNama && !inpNama.value.trim() && CURRENT_USER.displayName) {
              inpNama.value = CURRENT_USER.displayName;
            }
          }

          DATA_LIST = json.data || [];
          document.getElementById('badge-total-pengajuan').innerText = DATA_LIST.length;
          renderTabelRiwayat(DATA_LIST);
        } else {
          tbody.innerHTML = \`<tr><td colspan="9" class="py-10 text-center text-rose-400">\${json.error || 'Gagal memuat data'}</td></tr>\`;
        }
      } catch (err) {
        tbody.innerHTML = \`<tr><td colspan="9" class="py-10 text-center text-rose-400">Kesalahan: \${err.message}</td></tr>\`;
      }
    }

    function renderTabelRiwayat(list) {
      const tbody = document.getElementById('tbody-riwayat');
      if (!list || list.length === 0) {
        tbody.innerHTML = \`<tr><td colspan="9" class="py-12 text-center text-slate-500 italic">Belum ada pengajuan operasional yang tercatat.</td></tr>\`;
        return;
      }

      const statusBadges = {
        'DRAFT': 'bg-slate-800 text-slate-300 border-slate-700',
        'SUBMITTED': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        'IN_REVIEW': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        'APPROVED': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'REJECTED': 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      };

      let html = '';
      list.forEach((item, idx) => {
        const statusClass = statusBadges[item.status] || 'bg-slate-800 text-slate-300';
        
        // Progress mini dots dinamis
        const totalTiers = Object.keys(item.approvals || {}).length || 3;
        let tierDots = '<div class="flex items-center justify-center gap-1.5">';
        for (let t = 1; t <= totalTiers; t++) {
          const app = item.approvals && item.approvals[t];
          const isDone = app && app.approved;
          if (item.status === 'REJECTED') {
            tierDots += \`<span title="Tier \${t}: \${app ? app.label : ''}" class="w-2.5 h-2.5 rounded-full \${isDone ? 'bg-emerald-500' : 'bg-rose-500/50'}"></span>\`;
          } else {
            tierDots += \`<span title="Tier \${t}: \${app ? app.label : ''}" class="w-2.5 h-2.5 rounded-full \${isDone ? 'bg-emerald-400' : 'bg-slate-700'}"></span>\`;
          }
        }
        tierDots += '</div>';

        html += \`
          <tr class="hover:bg-slate-800/40 transition">
            <td class="py-3 px-3 text-center text-slate-500">\${idx + 1}</td>
            <td class="py-3 px-4 font-mono font-bold text-amber-300">\${item.noRegistrasi || item.id}</td>
            <td class="py-3 px-3">
              <span class="font-semibold text-slate-200 block">\${item.jenisLabel || item.jenisOperasional}</span>
              <span class="text-[10px] text-slate-400">Versi \${item.versi || 1}</span>
            </td>
            <td class="py-3 px-3 text-slate-300">\${item.kantor || 'Pusat'}</td>
            <td class="py-3 px-3 text-slate-400 font-mono text-[11px]">\${item.tglPengajuan || '-'}</td>
            <td class="py-3 px-4 text-right font-mono font-bold text-slate-200">\${formatRupiah(item.totalEstimasi || 0)}</td>
            <td class="py-3 px-3 text-center">
              <span class="inline-block px-2 py-0.5 rounded text-[10px] font-black border \${statusClass}">
                \${item.status}
              </span>
            </td>
            <td class="py-3 px-4 text-center">\${tierDots}</td>
            <td class="py-3 px-4 text-center">
              <div class="flex items-center justify-center gap-1.5">
                <button type="button" onclick="bukaModalDetail('\${item.id}')"
                  class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition">
                  Detail / Alur
                </button>
                <button type="button" onclick="cetakLangsung('\${item.id}')" title="Cetak PDF Dokumen"
                  class="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition">
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        \`;
      });
      tbody.innerHTML = html;
    }`;

const updatedMuatDaftar = `    // Muat Daftar Riwayat
    async function muatDaftarPengajuan() {
      const tbody = document.getElementById('tbody-riwayat');
      tbody.innerHTML = \`<tr><td colspan="9" class="py-10 text-center text-slate-400">Memuat data riwayat...</td></tr>\`;

      const jenis = document.getElementById('filter_jenis').value;
      const status = document.getElementById('filter_status').value;
      const cabang = document.getElementById('filter_cabang').value;
      const isPendingMe = (status === 'PENDING_ON_ME');

      let url = \`operasional-data-handler.php?action=getPengajuanList&jenis=\${encodeURIComponent(jenis)}&cabang=\${encodeURIComponent(cabang)}\`;
      if (isPendingMe) {
        url += \`&pendingOnMe=true\`;
      } else if (status) {
        url += \`&status=\${encodeURIComponent(status)}\`;
      }

      try {
        const res = await fetch(url, {
          headers: getAuthHeaders()
        });

        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          tampilkanAksesDitolakCabang(errData.error);
          return;
        }

        const json = await res.json();

        if (json.success) {
          if (json.currentUser) {
            CURRENT_USER = json.currentUser;
            const lblRole = document.getElementById('label-sesi-role');
            if (lblRole) {
              lblRole.innerText = \`\${CURRENT_USER.displayName} (\${CURRENT_USER.title || CURRENT_USER.roleLabel || CURRENT_USER.role})\`;
            }
            const inpNama = document.getElementById('input_nama_pengaju');
            if (inpNama && !inpNama.value.trim() && CURRENT_USER.displayName) {
              inpNama.value = CURRENT_USER.displayName;
            }
          }

          // Perbarui badge counter "Menunggu Persetujuan Saya"
          const pendingCount = (typeof json.pendingCount === 'number') ? json.pendingCount : 0;
          const elBadgeMe = document.getElementById('badge-pending-me');
          if (elBadgeMe) {
            elBadgeMe.innerText = pendingCount;
            if (pendingCount > 0) {
              elBadgeMe.className = "px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold animate-pulse";
            } else {
              elBadgeMe.className = "px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono text-[10px]";
            }
          }
          const elBadgeFilter = document.getElementById('badge-filter-pending');
          if (elBadgeFilter) elBadgeFilter.innerText = pendingCount;

          // Perbarui status aktif quick filter pills
          const btnQAll = document.getElementById('btn-quick-all');
          const btnQPending = document.getElementById('btn-quick-pending');
          const btnQRejected = document.getElementById('btn-quick-rejected');
          const btnQApproved = document.getElementById('btn-quick-approved');
          if (btnQAll && btnQPending && btnQRejected) {
            btnQAll.className = (status === '') ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 transition' : 'px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition';
            btnQPending.className = (status === 'PENDING_ON_ME') ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500 text-white shadow transition flex items-center gap-1.5' : 'px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-rose-500/40 flex items-center gap-1.5 transition';
            btnQRejected.className = (status === 'REJECTED') ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white transition' : 'px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition';
            if (btnQApproved) {
              btnQApproved.className = (status === 'APPROVED') ? 'px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 transition' : 'px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition';
            }
          }

          DATA_LIST = json.data || [];
          document.getElementById('badge-total-pengajuan').innerText = DATA_LIST.length;
          renderTabelRiwayat(DATA_LIST);
        } else {
          tbody.innerHTML = \`<tr><td colspan="9" class="py-10 text-center text-rose-400">\${json.error || 'Gagal memuat data'}</td></tr>\`;
        }
      } catch (err) {
        tbody.innerHTML = \`<tr><td colspan="9" class="py-10 text-center text-rose-400">Kesalahan: \${err.message}</td></tr>\`;
      }
    }

    // Render Timeline Otorisasi Dinamis (Tingkat 1 -> 2 -> 3)
    function renderApprovalTimeline(item) {
      const approvals = item.approvals || {};
      const tierKeys = Object.keys(approvals).map(Number).sort((a,b) => a - b);
      if (tierKeys.length === 0) return '<span class="text-slate-500 italic text-[11px]">-</span>';

      let stepsHtml = [];
      tierKeys.forEach((t, idx) => {
        const app = approvals[t];
        const isApproved = !!(app && app.approved);
        const tingkat = app?.tingkat || t;
        const label = app?.label || \`Tingkat \${tingkat}\`;
        const shortPejabat = app?.pejabat ? app.pejabat.split(',')[0].trim() : '-';
        const dateStr = (app && app.approvedAt) ? app.approvedAt.substring(5, 16) : ''; // e.g. "10-21 09:15"

        let stepBadge = '';
        if (isApproved) {
          stepBadge = \`
            <div class="flex flex-col items-start bg-emerald-950/40 border border-emerald-500/40 px-2 py-1 rounded-lg text-left" title="\${escapeHtml(label)}: Disetujui oleh \${escapeHtml(app.pejabat)} (\${app.approvedAt})">
              <div class="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>T\${tingkat} Disetujui</span>
              </div>
              <span class="text-[11px] font-semibold text-slate-200 truncate max-w-[115px]">\${escapeHtml(shortPejabat)}</span>
              <span class="text-[9px] font-mono text-emerald-400/90">\${dateStr}</span>
            </div>
          \`;
        } else if (item.status === 'REJECTED') {
          const isRejectedHere = (item.penolakan && (item.penolakan.tierDitolak == t || (!item.penolakan.tierDitolak && idx === 0)));
          if (isRejectedHere) {
            stepBadge = \`
              <div class="flex flex-col items-start bg-rose-950/60 border border-rose-500/50 px-2 py-1 rounded-lg text-left shadow-sm" title="\${escapeHtml(label)}: Ditolak / Perlu Revisi">
                <div class="flex items-center gap-1 text-[10px] font-extrabold text-rose-300">
                  <span>✕ T\${tingkat} Ditolak</span>
                </div>
                <span class="text-[11px] font-medium text-rose-200 truncate max-w-[115px]">\${escapeHtml(shortPejabat)}</span>
                <span class="text-[9px] font-mono text-rose-400 font-bold">Stop Revisi</span>
              </div>
            \`;
          } else {
            stepBadge = \`
              <div class="flex flex-col items-start bg-slate-900/60 border border-slate-800 px-2 py-1 rounded-lg text-left opacity-40" title="\${escapeHtml(label)}">
                <div class="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                  <span>○ T\${tingkat}</span>
                </div>
                <span class="text-[11px] font-medium text-slate-400 truncate max-w-[115px]">\${escapeHtml(shortPejabat)}</span>
                <span class="text-[9px] font-mono text-slate-600">-</span>
              </div>
            \`;
          }
        } else {
          // Sedang menunggu persetujuan
          const isActionable = (item.pendingTier === t) || (idx === 0 && !isApproved);
          if (isActionable) {
            stepBadge = \`
              <div class="flex flex-col items-start bg-amber-950/40 border border-amber-500/50 px-2 py-1 rounded-lg text-left shadow-sm ring-1 ring-amber-500/30" title="\${escapeHtml(label)}: Menunggu Persetujuan">
                <div class="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>T\${tingkat} Menunggu</span>
                </div>
                <span class="text-[11px] font-bold text-amber-200 truncate max-w-[115px]">\${escapeHtml(shortPejabat)}</span>
                <span class="text-[9px] font-mono text-amber-400/90 font-medium">Antrean Aktif</span>
              </div>
            \`;
          } else {
            stepBadge = \`
              <div class="flex flex-col items-start bg-slate-900/50 border border-slate-800 px-2 py-1 rounded-lg text-left opacity-70" title="\${escapeHtml(label)}: Menunggu Tahap Sebelumnya">
                <div class="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                  <span>○ T\${tingkat}</span>
                </div>
                <span class="text-[11px] font-medium text-slate-400 truncate max-w-[115px]">\${escapeHtml(shortPejabat)}</span>
                <span class="text-[9px] font-mono text-slate-600">Pending</span>
              </div>
            \`;
          }
        }
        stepsHtml.push(stepBadge);
      });

      return \`<div class="flex items-center gap-1.5 flex-nowrap overflow-x-auto py-1">\${stepsHtml.join('<span class="text-slate-600 text-xs font-bold shrink-0">&rarr;</span>')}</div>\`;
    }

    function renderTabelRiwayat(list) {
      const tbody = document.getElementById('tbody-riwayat');
      if (!list || list.length === 0) {
        tbody.innerHTML = \`<tr><td colspan="9" class="py-12 text-center text-slate-500 italic">Belum ada pengajuan operasional yang tercatat sesuai filter.</td></tr>\`;
        return;
      }

      const statusBadges = {
        'DRAFT': 'bg-slate-800 text-slate-300 border-slate-700',
        'SUBMITTED': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        'IN_REVIEW': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        'APPROVED': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        'REJECTED': 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      };

      let html = '';
      list.forEach((item, idx) => {
        const statusClass = statusBadges[item.status] || 'bg-slate-800 text-slate-300';
        const timelineHtml = renderApprovalTimeline(item);

        // Badge Penolakan / Revisi yang Jelas
        let rejectionBox = '';
        if (item.status === 'REJECTED' && item.penolakan) {
          rejectionBox = \`
            <div class="mt-2 p-2 rounded-xl bg-rose-950/60 border border-rose-500/50 text-[11px] text-rose-200 text-left">
              <div class="flex items-center justify-between font-bold text-rose-300 mb-0.5">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  Catatan Penolakan (Tingkat \${item.penolakan.tierDitolak || 'Review'}):
                </span>
                <span class="text-[10px] font-mono text-rose-300/70">\${item.penolakan.tglDitolak ? item.penolakan.tglDitolak.substring(0, 16) : ''}</span>
              </div>
              <p class="text-slate-100 font-medium bg-black/40 p-1.5 rounded border border-rose-900/60 italic">
                &ldquo;\${escapeHtml(item.penolakan.alasan || 'Memerlukan perbaikan')}&rdquo;
              </p>
              <div class="mt-1 text-[10px] text-rose-300/80">
                Oleh: <strong>\${escapeHtml(item.penolakan.ditolakOleh || 'Pejabat Berwenang')}</strong>
              </div>
            </div>
          \`;
        }

        // Tag Menunggu Persetujuan Saya
        let pendingTag = '';
        if (item.isPendingOnMe) {
          if (item.status === 'REJECTED') {
            pendingTag = \`<div class="mt-1"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>Perlu Revisi Anda</span></div>\`;
          } else {
            pendingTag = \`<div class="mt-1"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>Menunggu Otorisasi Anda</span></div>\`;
          }
        }

        // Tombol Tindakan
        let actionButtons = \`<div class="flex items-center justify-center gap-1.5 flex-wrap">\`;
        if (item.isPendingOnMe && item.status !== 'REJECTED' && item.status !== 'DRAFT') {
          actionButtons += \`
            <button type="button" onclick="bukaModalDetail('\${item.id}')"
              class="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow flex items-center gap-1 transition">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
              <span>⚡ Setujui</span>
            </button>
          \`;
        }
        if (item.status === 'REJECTED') {
          actionButtons += \`
            <button type="button" onclick="siapkanRevisiPengajuan('\${item.id}')"
              class="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow flex items-center gap-1 transition animate-bounce">
              <span>✏️ Ajukan Revisi</span>
            </button>
          \`;
        }
        actionButtons += \`
            <button type="button" onclick="bukaModalDetail('\${item.id}')"
              class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition">
              Detail / Alur
            </button>
            <button type="button" onclick="cetakLangsung('\${item.id}')" title="Cetak PDF Dokumen"
              class="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition">
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 0 0 2-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
        \`;

        html += \`
          <tr class="hover:bg-slate-800/40 transition">
            <td class="py-3 px-3 text-center text-slate-500">\${idx + 1}</td>
            <td class="py-3 px-4 font-mono font-bold text-amber-300">
              <div>\${item.noRegistrasi || item.id}</div>
              \${pendingTag}
              \${rejectionBox}
            </td>
            <td class="py-3 px-3">
              <span class="font-semibold text-slate-200 block">\${item.jenisLabel || item.jenisOperasional}</span>
              <span class="text-[10px] text-slate-400">Versi \${item.versi || 1}</span>
            </td>
            <td class="py-3 px-3 text-slate-300">\${item.kantor || 'Pusat'}</td>
            <td class="py-3 px-3 text-slate-400 font-mono text-[11px]">\${item.tglPengajuan || '-'}</td>
            <td class="py-3 px-4 text-right font-mono font-bold text-slate-200">\${formatRupiah(item.totalEstimasi || 0)}</td>
            <td class="py-3 px-3 text-center">
              <span class="inline-block px-2 py-0.5 rounded text-[10px] font-black border \${statusClass}">
                \${item.status}
              </span>
            </td>
            <td class="py-3 px-4">\${timelineHtml}</td>
            <td class="py-3 px-4 text-center">\${actionButtons}</td>
          </tr>
        \`;
      });
      tbody.innerHTML = html;
    }`;

if (portalContent.includes(targetMuatDaftar)) {
  portalContent = portalContent.replace(targetMuatDaftar, updatedMuatDaftar);
  console.log('✔ Memperbarui muatDaftarPengajuan() & renderTabelRiwayat() dengan Timeline & Penolakan');
} else {
  const targetMuatDaftarNorm = targetMuatDaftar.replace(/\r?\n/g, '\n');
  const portalNorm = portalContent.replace(/\r?\n/g, '\n');
  if (portalNorm.includes(targetMuatDaftarNorm)) {
    portalContent = portalNorm.replace(targetMuatDaftarNorm, updatedMuatDaftar.replace(/\r?\n/g, '\n'));
    console.log('✔ Memperbarui muatDaftarPengajuan() (setelah normalisasi newline)');
  }
}

fs.writeFileSync(portalPath, portalContent, 'utf8');
console.log('💾 Berhasil menyimpan portal-operasional.html');
console.log('\n🎉 Penerapan Tahap 1: Pending on Me e-Operasional Selesai!');
