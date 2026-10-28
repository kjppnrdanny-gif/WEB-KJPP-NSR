// scripts/apply-tracking-code-system.mjs
import fs from 'fs';
import path from 'path';

console.log('=== MENERAPKAN SISTEM KODE UNIK LACAK & PEMBERSIHAN SEARCH FALLBACK ===');

// 1. UPDATE backend/job-tracking-handler.php
const phpPath = path.resolve('backend/job-tracking-handler.php');
let php = fs.readFileSync(phpPath, 'utf8');

// Tambah helper generateTrackingCode sebelum getInitialSeedData jika belum ada
if (!php.includes('function generateTrackingCode(')) {
  const codeHelper = `
// Generator Kode Unik Pelacakan SPK / JO: TRK-[KANTOR]-[TAHUN]-[4 ALFANUMERIK]
function generateTrackingCode($kantorCode = 'PUSAT', $year = null) {
    $kantor = 'JKT';
    $uKantor = strtoupper($kantorCode);
    if (strpos($uKantor, 'BDG') !== false || strpos($uKantor, 'BANDUNG') !== false) $kantor = 'BDG';
    elseif (strpos($uKantor, 'PDG') !== false || strpos($uKantor, 'PADANG') !== false) $kantor = 'PDG';
    elseif (strpos($uKantor, 'MKS') !== false || strpos($uKantor, 'MAKASSAR') !== false) $kantor = 'MKS';
    elseif (strpos($uKantor, 'PLM') !== false || strpos($uKantor, 'PALEMBANG') !== false) $kantor = 'PLM';
    elseif ($uKantor === 'PUSAT' || strpos($uKantor, 'JAKARTA') !== false) $kantor = 'JKT';

    if (!$year) $year = date('Y');
    
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $rand = '';
    $maxLen = strlen($chars) - 1;
    for ($i = 0; $i < 4; $i++) {
        $rand .= $chars[random_int(0, $maxLen)];
    }
    return 'TRK-' . $kantor . '-' . $year . '-' . $rand;
}
`;
  php = php.replace('// Inisialisasi Mock Data Awal dengan 2 Skenario Bank BTN + Mandiri & BRI', codeHelper + '\n// Inisialisasi Mock Data Awal dengan 2 Skenario Bank BTN + Mandiri & BRI');
  console.log('✓ Added generateTrackingCode() helper in backend/job-tracking-handler.php');
}

// Tambahkan kode_lacak ke item1 s/d item5
if (!php.includes("'kode_lacak' => 'TRK-JKT-2026-A89F'")) {
  php = php.replace(
    "'id' => 'JO-JKT-2026-0001',\n        'jo_number' => 'JO-JKT-2026-0001',",
    "'id' => 'JO-JKT-2026-0001',\n        'jo_number' => 'JO-JKT-2026-0001',\n        'kode_lacak' => 'TRK-JKT-2026-A89F',"
  );
  php = php.replace(
    "'id' => 'JO-JKT-2026-0002',\n        'jo_number' => 'JO-JKT-2026-0002',",
    "'id' => 'JO-JKT-2026-0002',\n        'jo_number' => 'JO-JKT-2026-0002',\n        'kode_lacak' => 'TRK-JKT-2026-C42B',"
  );
  php = php.replace(
    "'id' => 'JO-BDG-2026-0015',\n        'jo_number' => 'JO-BDG-2026-0015',",
    "'id' => 'JO-BDG-2026-0015',\n        'jo_number' => 'JO-BDG-2026-0015',\n        'kode_lacak' => 'TRK-BDG-2026-M512',"
  );
  php = php.replace(
    "'id' => 'JO-MKS-2026-0008',\n        'jo_number' => 'JO-MKS-2026-0008',",
    "'id' => 'JO-MKS-2026-0008',\n        'jo_number' => 'JO-MKS-2026-0008',\n        'kode_lacak' => 'TRK-MKS-2026-K734',"
  );
  php = php.replace(
    "'id' => 'JO-JKT-2026-0003',\n        'jo_number' => 'JO-JKT-2026-0003',",
    "'id' => 'JO-JKT-2026-0003',\n        'jo_number' => 'JO-JKT-2026-0003',\n        'kode_lacak' => 'TRK-JKT-2026-B901',"
  );
  console.log('✓ Added static kode_lacak to 5 seed scenarios');
}

// Update action === 'track' logic in PHP to search both jo_number and kode_lacak, and return 404 when not found
const oldTrackLogicRegex = /\/\/ =========================================================================\s*\/\/ 1\. ACTION: TRACK[\s\S]*?\/\/ =========================================================================\s*\/\/ 2\. ACTION: LIST/;
const newTrackLogic = `// =========================================================================
// 1. ACTION: TRACK (Pencarian Publik 7 Milestone Berbasis JO / Kode Lacak)
// =========================================================================
if ($action === 'track' || $action === 'track_public') {
    $joInput = trim($_GET['jo'] ?? $_POST['jo'] ?? $_GET['id_jo'] ?? $_POST['id_jo'] ?? '');
    $phoneInput = trim($_GET['phone'] ?? $_POST['phone'] ?? $_GET['telepon_pic'] ?? $_POST['telepon_pic'] ?? '');

    // Sanitasi input pencarian
    $cleanJo = strtoupper(preg_replace('/[^a-zA-Z0-9\-]/', '', $joInput));
    $cleanPhone = preg_replace('/[^0-9]/', '', $phoneInput);

    // 1. Coba proxy query ke SSOT Google Apps Script terlebih dahulu jika ada parameter
    if (!empty($cleanJo) || !empty($cleanPhone)) {
        $gasTrack = callGASTrackingService('track', ['id_jo' => $cleanJo, 'telepon_pic' => $cleanPhone], 'GET');
        if ($gasTrack && isset($gasTrack['status']) && $gasTrack['status'] === 'success' && !empty($gasTrack['data'])) {
            echo json_encode([
                'status' => 'success',
                'source' => 'GAS_SSOT_LIVE',
                'data' => $gasTrack['data']
            ]);
            exit;
        }
    }

    $found = null;

    // 2. Pencarian exact match JO Number atau Kode Lacak
    if (!empty($cleanJo)) {
        foreach ($jobs as $id => $job) {
            $jJo = strtoupper($job['jo_number'] ?? '');
            $jKode = strtoupper($job['kode_lacak'] ?? '');
            if ($jJo === $cleanJo || $jKode === $cleanJo) {
                $found = $job;
                break;
            }
        }
    }

    // 3. Jika belum ketemu, cari pencarian nomor kontak
    if (!$found && !empty($cleanPhone)) {
        foreach ($jobs as $id => $job) {
            $jPhone = preg_replace('/[^0-9]/', '', $job['pic_contact'] ?? '');
            if (!empty($jPhone) && strlen($cleanPhone) >= 6 && substr($jPhone, -6) === substr($cleanPhone, -6)) {
                $found = $job;
                break;
            }
        }
    }

    // 4. Jika belum ketemu, cari pencarian parsial nomor JO atau Kode Lacak
    if (!$found && !empty($cleanJo)) {
        foreach ($jobs as $id => $job) {
            $jJo = strtoupper($job['jo_number'] ?? '');
            $jKode = strtoupper($job['kode_lacak'] ?? '');
            if ((!empty($jJo) && strpos($jJo, $cleanJo) !== false) || (!empty($jKode) && strpos($jKode, $cleanJo) !== false)) {
                $found = $job;
                break;
            }
        }
    }

    // 5. Validasi: Jika tidak ditemukan, kembalikan respons 404 (DILARANG FALLBACK KE DATA MOCK)
    if (!$found) {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'Status penugasan dengan Nomor JO / Kode Lacak atau Nomor WhatsApp tersebut tidak ditemukan.',
            'data' => null
        ]);
        exit;
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Status penugasan ditemukan.',
        'data' => $found
    ]);
    exit;
}

// =========================================================================
// 2. ACTION: LIST`;

if (oldTrackLogicRegex.test(php)) {
  php = php.replace(oldTrackLogicRegex, newTrackLogic);
  console.log('✓ Updated track action in backend/job-tracking-handler.php (no blind mock fallback, supports kode_lacak)');
}

// Update action === 'create' to generate kode_lacak
if (!php.includes('$kodeLacak = generateTrackingCode($kantorCode, $year);')) {
  const oldCreateTarget = `$nextSeq = str_pad(count($jobs) + 1, 4, '0', STR_PAD_LEFT);
    $joNumber = 'JO-' . ($kantorCode === 'PUSAT' ? 'JKT' : $kantorCode) . '-' . $year . '-' . $nextSeq;`;
  
  const newCreateTarget = `$nextSeq = str_pad(count($jobs) + 1, 4, '0', STR_PAD_LEFT);
    $joNumber = 'JO-' . ($kantorCode === 'PUSAT' ? 'JKT' : $kantorCode) . '-' . $year . '-' . $nextSeq;
    $kodeLacak = generateTrackingCode($kantorCode, $year);`;
  
  php = php.replace(oldCreateTarget, newCreateTarget);

  const oldNewJobTarget = `'id' => $joNumber,
        'jo_number' => $joNumber,`;
  const newNewJobTarget = `'id' => $joNumber,
        'jo_number' => $joNumber,
        'kode_lacak' => $kodeLacak,`;
  php = php.replace(oldNewJobTarget, newNewJobTarget);
  console.log('✓ Integrated kode_lacak generation in create action in backend/job-tracking-handler.php');
}

fs.writeFileSync(phpPath, php, 'utf8');
console.log('✓ backend/job-tracking-handler.php saved.');


// 2. UPDATE gas-job-tracking.gs
const gasPath = path.resolve('gas-job-tracking.gs');
let gas = fs.readFileSync(gasPath, 'utf8');

// Add generateTrackingCode_ in gas-job-tracking.gs
if (!gas.includes('function generateTrackingCode_(')) {
  const gasHelper = `
/**
 * Generator Kode Unik Pelacakan SPK / JO: TRK-[KANTOR]-[TAHUN]-[4 ALFANUMERIK]
 */
function generateTrackingCode_(kantorCode, year) {
  let kantor = 'JKT';
  const u = String(kantorCode || '').toUpperCase();
  if (u.includes('BDG') || u.includes('BANDUNG')) kantor = 'BDG';
  else if (u.includes('PDG') || u.includes('PADANG')) kantor = 'PDG';
  else if (u.includes('MKS') || u.includes('MAKASSAR')) kantor = 'MKS';
  else if (u.includes('PLM') || u.includes('PALEMBANG')) kantor = 'PLM';
  else if (u.includes('PUSAT') || u.includes('JAKARTA')) kantor = 'JKT';

  if (!year) year = Utilities.formatDate(new Date(), CONFIG_TRACKING.TIMEZONE, 'yyyy');

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'TRK-' + kantor + '-' + year + '-' + rand;
}
`;
  gas = gas.replace('const MILESTONE_DEFINITIONS = {', gasHelper + '\nconst MILESTONE_DEFINITIONS = {');
  console.log('✓ Added generateTrackingCode_ helper to gas-job-tracking.gs');
}

// Update handlePublicTrack_ in GAS:
// Support searching by kode_lacak, and DO NOT fallback to values[1]
const gasTrackRegex = /\/\*\*[\s\S]*?1\. ACTION: TRACK_PUBLIC[\s\S]*?function handlePublicTrack_\(joInput, phoneInput\) {[\s\S]*?\/\/ Jika input kosong atau tidak ketemu, berikan default sampel Bank BTN[\s\S]*?if \(!foundRow && values\.length > 1\) {[\s\S]*?foundRow = values\[1\];[\s\S]*?}[\s\S]*?if \(!foundRow\) {[\s\S]*?return createJsonResponse_\({ status: 'error', message: 'Data penugasan tidak ditemukan\.' }, 404\);[\s\S]*?}/;

const newGasTrackFunc = `/**
 * =========================================================================
 * 1. ACTION: TRACK_PUBLIC (Pelacakan Publik Aman Berbasis JO / Kode Lacak)
 * =========================================================================
 */
function handlePublicTrack_(joInput, phoneInput) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG_TRACKING.SHEET_DATA);
  if (!sheet) {
    return createJsonResponse_({ status: 'error', message: 'Sheet DATA_PENUGASAN belum diinisialisasi.' }, 404);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return createJsonResponse_({ status: 'error', message: 'Belum ada data penugasan terdaftar.' }, 404);
  }

  const headers = values[0];
  const colMap = {};
  headers.forEach((h, i) => colMap[String(h).trim().toLowerCase()] = i);

  const cleanJo = String(joInput || '').toUpperCase().replace(/[^A-Z0-9\\-]/g, '');
  const cleanPhone = String(phoneInput || '').replace(/[^0-9]/g, '');

  let foundRow = null;

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowJo = String(row[colMap['id_jo'] !== undefined ? colMap['id_jo'] : 0] || '').trim().toUpperCase();
    const rowKode = String(row[colMap['kode_lacak'] !== undefined ? colMap['kode_lacak'] : -1] || '').trim().toUpperCase();
    const rowPhone = String(row[colMap['telepon_pic'] !== undefined ? colMap['telepon_pic'] : 4] || '').replace(/[^0-9]/g, '');

    // Cocokkan JO resmi atau Kode Lacak
    if (cleanJo && (rowJo === cleanJo || (rowKode && rowKode === cleanJo))) {
      foundRow = row;
      break;
    }

    // Cocokkan nomor telepon PIC
    if (cleanPhone && cleanPhone.length >= 6 && rowPhone.endsWith(cleanPhone.slice(-6))) {
      foundRow = row;
      break;
    }
  }

  // Jika belum ditemukan, coba pencarian parsial
  if (!foundRow && cleanJo) {
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const rowJo = String(row[colMap['id_jo'] !== undefined ? colMap['id_jo'] : 0] || '').trim().toUpperCase();
      const rowKode = String(row[colMap['kode_lacak'] !== undefined ? colMap['kode_lacak'] : -1] || '').trim().toUpperCase();
      if ((rowJo && rowJo.includes(cleanJo)) || (rowKode && rowKode.includes(cleanJo))) {
        foundRow = row;
        break;
      }
    }
  }

  // VALIDASI KETAT: Jika tidak ketemu, kembalikan respons 404 tanpa fallback mock
  if (!foundRow) {
    return createJsonResponse_({
      status: 'error',
      message: 'Status penugasan dengan Nomor JO / Kode Lacak atau Nomor WhatsApp tersebut tidak ditemukan.'
    }, 404);
  }`;

if (gasTrackRegex.test(gas)) {
  gas = gas.replace(gasTrackRegex, newGasTrackFunc);
  console.log('✓ Updated handlePublicTrack_ in gas-job-tracking.gs');
}

// Pastikan publicData di GAS menyertakan kode_lacak
if (!gas.includes("kode_lacak: foundRow[colMap['kode_lacak']]")) {
  gas = gas.replace(
    "id: idJo,\n    jo_number: idJo,",
    "id: idJo,\n    jo_number: idJo,\n    kode_lacak: (colMap['kode_lacak'] !== undefined && foundRow[colMap['kode_lacak']]) ? String(foundRow[colMap['kode_lacak']]) : '',"
  );
  console.log('✓ Added kode_lacak to publicData in GAS');
}

// Pastikan handleGetActiveJobs_ di GAS menyertakan kode_lacak
if (!gas.includes("kode_lacak: (colMap['kode_lacak'] !== undefined")) {
  gas = gas.replace(
    "id: idJo,\n      jo_number: idJo,",
    "id: idJo,\n      jo_number: idJo,\n      kode_lacak: (colMap['kode_lacak'] !== undefined && row[colMap['kode_lacak']]) ? String(row[colMap['kode_lacak']]) : '',"
  );
  console.log('✓ Added kode_lacak to handleGetActiveJobs_ in GAS');
}

// Pastikan handleCreateJobOrder_ di GAS menerbitkan kode_lacak
if (!gas.includes('const kodeLacak = generateTrackingCode_(kantorCode, year);')) {
  gas = gas.replace(
    "const idJo = 'JO-' + kantorCode + '-' + year + '-' + nextSeq;",
    "const idJo = 'JO-' + kantorCode + '-' + year + '-' + nextSeq;\n  const kodeLacak = generateTrackingCode_(kantorCode, year);"
  );
  console.log('✓ Added kodeLacak generation to handleCreateJobOrder_ in GAS');
}

fs.writeFileSync(gasPath, gas, 'utf8');
console.log('✓ gas-job-tracking.gs saved.');


// 3. UPDATE portal-tracking.html
const trackingHtmlPath = path.resolve('portal-tracking.html');
let trkHtml = fs.readFileSync(trackingHtmlPath, 'utf8');

// Tampilkan badge kode_lacak di kolom 1 tabel Task Board
if (!trkHtml.includes('${j.kode_lacak ?')) {
  trkHtml = trkHtml.replace(
    '<strong class="font-mono text-white text-xs block">${j.jo_number}</strong>',
    `<strong class="font-mono text-white text-xs block">\${j.jo_number}</strong>
              \${j.kode_lacak ? \`<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 mt-0.5">\${j.kode_lacak}</span>\` : ''}`
  );
  console.log('✓ Added kode_lacak badge in portal-tracking.html table');
}

// Tambahkan badge kode_lacak di modal-tracking-stepper header jika belum ada
if (!trkHtml.includes('modal-kode-lacak')) {
  trkHtml = trkHtml.replace(
    '<h4 id="modal-jo-number" class="text-sm font-mono font-black text-amber-400 tracking-wider">JO-JKT-2026-0001</h4>',
    `<h4 id="modal-jo-number" class="text-sm font-mono font-black text-amber-400 tracking-wider">JO-JKT-2026-0001</h4>
              <span id="modal-kode-lacak" class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">TRK-JKT-2026-A89F</span>`
  );
  trkHtml = trkHtml.replace(
    "document.getElementById('modal-jo-number').textContent = job.jo_number;",
    `document.getElementById('modal-jo-number').textContent = job.jo_number;
      const elKodeModal = document.getElementById('modal-kode-lacak');
      if (elKodeModal) {
        elKodeModal.textContent = job.kode_lacak ? ('Kode: ' + job.kode_lacak) : '';
        elKodeModal.style.display = job.kode_lacak ? 'inline-flex' : 'none';
      }`
  );
  console.log('✓ Added modal-kode-lacak in modal-tracking-stepper in portal-tracking.html');
}

// Perbaiki alert registrasi JO untuk menampilkan nomor JO dan kode lacak unik
if (!trkHtml.includes('Kode Lacak Unik:')) {
  trkHtml = trkHtml.replace(
    "alert('✓ Sukses! Job Order baru diterbitkan dengan nomor: ' + res.data.jo_number);",
    `alert('✓ Sukses! Job Order baru berhasil diterbitkan:\\n\\n• Nomor JO: ' + res.data.jo_number + '\\n• Kode Lacak Unik: ' + (res.data.kode_lacak || '-') + '\\n• Debitur: ' + (res.data.debitur || '-') + '\\n\\nKode Lacak ini dapat diberikan langsung kepada PIC Pemohon / Debitur untuk melacak penugasan di halaman beranda.');`
  );
  console.log('✓ Enhanced registration alert in portal-tracking.html with unique tracking code');
}

fs.writeFileSync(trackingHtmlPath, trkHtml, 'utf8');
console.log('✓ portal-tracking.html saved.');


// 4. UPDATE portal-operasional.html & portal-penugasan-jo.html NAV LINKS
const oprPath = path.resolve('portal-operasional.html');
let oprHtml = fs.readFileSync(oprPath, 'utf8');
if (!oprHtml.includes('portal-tracking.html')) {
  const oprNavTarget = `<a href="portal-penugasan-jo.html" title="Buka Portal SPK &amp; Job Order" class="hidden md:inline-flex px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700">
          SPK/JO
        </a>`;
  const oprNavReplacement = `<a href="portal-tracking.html" title="Buka Job Tracking 7-Milestone" class="hidden md:inline-flex px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-bold transition border border-amber-500/30">
          Tracking (7M)
        </a>
        <a href="portal-penugasan-jo.html" title="Buka Portal SPK &amp; Job Order" class="hidden md:inline-flex px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700">
          SPK/JO
        </a>`;
  oprHtml = oprHtml.replace(oprNavTarget, oprNavReplacement);
  fs.writeFileSync(oprPath, oprHtml, 'utf8');
  console.log('✓ Added Tracking (7M) nav button to portal-operasional.html');
}

const joPath = path.resolve('portal-penugasan-jo.html');
let joHtml = fs.readFileSync(joPath, 'utf8');
if (!joHtml.includes('portal-tracking.html')) {
  const joNavTarget = `<a href="portal-operasional.html" id="nav-link-operasional"`;
  const joNavReplacement = `<a href="portal-tracking.html" id="nav-link-tracking" class="hidden md:inline-flex px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-bold transition border border-amber-500/30" title="Buka Monitoring Job Tracking 7-Milestone">
          Tracking (7M)
        </a>
        <a href="portal-operasional.html" id="nav-link-operasional"`;
  joHtml = joHtml.replace(joNavTarget, joNavReplacement);
  fs.writeFileSync(joPath, joHtml, 'utf8');
  console.log('✓ Added Tracking (7M) nav button to portal-penugasan-jo.html');
}

console.log('=== SEMUA PENERAPAN SELESAI DENGAN SUKSES ===');
