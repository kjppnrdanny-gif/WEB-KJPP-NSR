/**
 * P0 Fast Track RBAC Approval Verification Test
 */

const BASE_URL = 'http://127.0.0.1:8099';
const HANDLER = `${BASE_URL}/operasional-data-handler.php`;

const TOKENS = {
  VAL   : 'NSR-VAL-2026',
  SRV   : 'NSR-SRV-2026',
  MKT   : 'NSR-MKT-2026',
  REK   : 'NSR-REK-2026',
  REV   : 'NSR-REV-2026',
  DIVTEK: 'NSR-DIVTEK-2026',
  ADM   : 'NSR-ADM-2026',
  KEU   : 'NSR-KEU-2026',
  MASTER: (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN"),
};

async function callApi(token, action, method = 'GET', body = null) {
  const url = `${HANDLER}?action=${action}`;
  const opts = {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-NSR-Token': token,
    }
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    let json = null;
    try { json = await res.json(); } catch (_) {}
    return { status: res.status, json };
  } catch (err) {
    return { status: -1, error: err.message, json: null };
  }
}

let passed = 0;
let failed = 0;

function assert(name, condition, extra = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name} ${extra}`);
  }
}

async function run() {
  console.log('====================================================');
  console.log(' P0 FAST TRACK RBAC APPROVAL VERIFICATION');
  console.log(' Target:', BASE_URL);
  console.log('====================================================\n');

  // 1. Submit a fresh TEKNIS document using staff token
  console.log('--- Step 0: Create Test Pengajuan (Teknis) ---');
  const createRes = await callApi(TOKENS.SRV, 'simpanPengajuan', 'POST', {
    jenisOperasional: 'OPR-SRV',
    namaPengaju: 'Holik Kelana',
    jabatanPengaju: 'Surveyor',
    divisiPengaju: 'Teknik Penilaian',
    maksudTujuan: 'Survey objek jaminan di Bekasi',
    isDraft: false,
    itemBiaya: [
      { uraian: 'Transport', nominal: 250000 }
    ]
  });
  assert('Create pengajuan by staff token', createRes.status === 200 && createRes.json?.success === true, JSON.stringify(createRes.json));
  const docId = createRes.json?.data?.id;
  console.log('Created doc ID:', docId);

  // 2. CHECK 1: Token VAL / SRV / MKT / REK / REV BLOCKED from all approvals
  console.log('\n--- CHECK 1: Staff and General Tokens Blocked from All Approvals ---');
  for (const [name, token] of [
    ['NSR-VAL-2026 (Penilai)', TOKENS.VAL],
    ['NSR-SRV-2026 (Surveyor)', TOKENS.SRV],
    ['NSR-MKT-2026 (Marketing)', TOKENS.MKT],
    ['NSR-REK-2026 (Rekan Umum)', TOKENS.REK],
    ['NSR-REV-2026 (Reviewer)', TOKENS.REV]
  ]) {
    // Attempt Tier 1
    const r1 = await callApi(token, 'approveTier', 'POST', { id: docId, tier: 1 });
    assert(`${name} -> approveTier 1 rejected with 403`, r1.status === 403, `Got ${r1.status}`);

    // Attempt Tier 2
    const r2 = await callApi(token, 'approveTier', 'POST', { id: docId, tier: 2 });
    assert(`${name} -> approveTier 2 rejected with 403`, r2.status === 403, `Got ${r2.status}`);

    // Attempt Tier 3
    const r3 = await callApi(token, 'approveTier', 'POST', { id: docId, tier: 3 });
    assert(`${name} -> approveTier 3 rejected with 403`, r3.status === 403, `Got ${r3.status}`);

    // Attempt rejectWithNote
    const rRej = await callApi(token, 'rejectWithNote', 'POST', { id: docId, alasan: 'Mencoba menolak dokumen tanpa wewenang.', tier: 1 });
    assert(`${name} -> rejectWithNote rejected with 403`, rRej.status === 403, `Got ${rRej.status}`);
  }

  // 3. CHECK 4A: Sequence skipping rejected
  console.log('\n--- CHECK 4A: Sequence Skipping Rejected ---');
  // Attempting to approve Tier 2 before Tier 1 is approved
  const skipToTier2 = await callApi(TOKENS.KEU, 'approveTier', 'POST', { id: docId, tier: 2 });
  assert('Manager Keuangan approve Tier 2 before Tier 1 -> rejected with 400', skipToTier2.status === 400, `Got ${skipToTier2.status}: ${skipToTier2.json?.error}`);

  // Attempting to approve Tier 3 before Tier 1 & 2 are approved
  const skipToTier3 = await callApi(TOKENS.MASTER, 'approveTier', 'POST', { id: docId, tier: 3 });
  assert('Kepala Keuangan approve Tier 3 before Tier 2 -> rejected with 400', skipToTier3.status === 400, `Got ${skipToTier3.status}: ${skipToTier3.json?.error}`);

  // 4. CHECK 2: Manager Teknik (NSR-DIVTEK-2026) authorization
  console.log('\n--- CHECK 2: Manager Teknik Token Authorization ---');
  // Manager Teknik trying to approve Tier 2 (Keuangan) -> 403
  const tekOnTier2 = await callApi(TOKENS.DIVTEK, 'approveTier', 'POST', { id: docId, tier: 2 });
  assert('Manager Teknik -> approveTier 2 (Keuangan) rejected with 403', tekOnTier2.status === 403, `Got ${tekOnTier2.status}`);

  // Manager Teknik trying to approve Tier 3 (Kepala Keuangan) -> 403
  const tekOnTier3 = await callApi(TOKENS.DIVTEK, 'approveTier', 'POST', { id: docId, tier: 3 });
  assert('Manager Teknik -> approveTier 3 (Final) rejected with 403', tekOnTier3.status === 403, `Got ${tekOnTier3.status}`);

  // Manager Teknik approving Tier 1 (Teknis) -> SUCCESS 200
  const tekOnTier1 = await callApi(TOKENS.DIVTEK, 'approveTier', 'POST', { id: docId, tier: 1 });
  assert('Manager Teknik -> approveTier 1 (Teknis) SUCCEEDS with 200', tekOnTier1.status === 200 && tekOnTier1.json?.success === true, `Got ${tekOnTier1.status}: ${tekOnTier1.json?.error}`);

  // 5. CHECK 3: Manager Keuangan & Kepala Keuangan strict boundaries
  console.log('\n--- CHECK 3: Strict Per-Tier Separation (Keuangan & Kepala Keuangan) ---');
  // Manager Admin trying to approve Tier 2 (Keuangan) -> 403
  const admOnTier2 = await callApi(TOKENS.ADM, 'approveTier', 'POST', { id: docId, tier: 2 });
  assert('Manager Admin -> approveTier 2 (Keuangan) rejected with 403', admOnTier2.status === 403, `Got ${admOnTier2.status}`);

  // Kepala Keuangan trying to approve Tier 2 before it's approved by Manager Keuangan -> 403 (no APPROVE_KEUANGAN)
  const masterOnTier2 = await callApi(TOKENS.MASTER, 'approveTier', 'POST', { id: docId, tier: 2 });
  assert('Kepala Keuangan -> approveTier 2 rejected with 403 (Zero SuperAdmin Bypass)', masterOnTier2.status === 403, `Got ${masterOnTier2.status}`);

  // Manager Keuangan trying to approve Tier 3 (Kepala Keuangan) -> 403
  const keuOnTier3 = await callApi(TOKENS.KEU, 'approveTier', 'POST', { id: docId, tier: 3 });
  assert('Manager Keuangan -> approveTier 3 rejected with 403', keuOnTier3.status === 403, `Got ${keuOnTier3.status}`);

  // Manager Keuangan approving Tier 2 (Keuangan) -> SUCCESS 200
  const keuOnTier2 = await callApi(TOKENS.KEU, 'approveTier', 'POST', { id: docId, tier: 2 });
  assert('Manager Keuangan -> approveTier 2 SUCCEEDS with 200', keuOnTier2.status === 200 && keuOnTier2.json?.success === true, `Got ${keuOnTier2.status}: ${keuOnTier2.json?.error}`);

  // Kepala Keuangan approving Tier 3 (Final) -> SUCCESS 200
  const masterOnTier3 = await callApi(TOKENS.MASTER, 'approveTier', 'POST', { id: docId, tier: 3 });
  assert('Kepala Keuangan -> approveTier 3 SUCCEEDS with 200', masterOnTier3.status === 200 && masterOnTier3.json?.success === true, `Got ${masterOnTier3.status}: ${masterOnTier3.json?.error}`);

  // Document should now be APPROVED
  const detailRes = await callApi(TOKENS.MASTER, 'getPengajuanDetail', 'GET');
  assert('Approval completes workflow to APPROVED', masterOnTier3.json?.data?.status === 'APPROVED', `Status: ${masterOnTier3.json?.data?.status}`);

  // 6. CHECK LINTAS DIVISI: Requires BOTH Tier 1 (Teknik) & Tier 2 (Admin) before Keuangan
  console.log('\n--- CHECK 4B: Lintas Divisi Requires BOTH Tingkat 1 Approvals ---');
  const lintasRes = await callApi(TOKENS.SRV, 'simpanPengajuan', 'POST', {
    jenisOperasional: 'OPR-UMM',
    namaPengaju: 'Deni / Danny Team',
    jabatanPengaju: 'Koordinator',
    divisiPengaju: 'Lintas Divisi Teknik & Umum',
    maksudTujuan: 'Pengadaan peralatan survey lintas divisi',
    isDraft: false,
    itemBiaya: [{ uraian: 'Alat ukur laser', nominal: 1500000 }]
  });
  const lintasDocId = lintasRes.json?.data?.id;
  console.log('Created Lintas Divisi doc ID:', lintasDocId);

  // Attempting to approve Tier 3 (Keuangan) before ANY Tingkat 1 approved -> rejected 400
  const lintasKeuEarly = await callApi(TOKENS.KEU, 'approveTier', 'POST', { id: lintasDocId, tier: 3 });
  assert('Lintas Divisi: Keuangan rejected when Tingkat 1 incomplete', lintasKeuEarly.status === 400, `Got ${lintasKeuEarly.status}: ${lintasKeuEarly.json?.error}`);

  // Manager Teknik approves Tier 1 (Teknik)
  const lintasTek1 = await callApi(TOKENS.DIVTEK, 'approveTier', 'POST', { id: lintasDocId, tier: 1 });
  assert('Lintas Divisi: Manager Teknik approves Tier 1', lintasTek1.status === 200, `Got ${lintasTek1.status}`);

  // Attempting to approve Tier 3 (Keuangan) when only Tier 1 is approved (Admin still pending) -> rejected 400!
  const lintasKeuHalf = await callApi(TOKENS.KEU, 'approveTier', 'POST', { id: lintasDocId, tier: 3 });
  assert('Lintas Divisi: Keuangan still rejected when only Teknik approved (Admin pending)', lintasKeuHalf.status === 400, `Got ${lintasKeuHalf.status}: ${lintasKeuHalf.json?.error}`);

  // Manager Admin approves Tier 2 (Admin)
  const lintasAdm2 = await callApi(TOKENS.ADM, 'approveTier', 'POST', { id: lintasDocId, tier: 2 });
  assert('Lintas Divisi: Manager Admin approves Tier 2', lintasAdm2.status === 200, `Got ${lintasAdm2.status}`);

  // Now Manager Keuangan approves Tier 3 -> SUCCEEDS 200!
  const lintasKeu3 = await callApi(TOKENS.KEU, 'approveTier', 'POST', { id: lintasDocId, tier: 3 });
  assert('Lintas Divisi: Keuangan SUCCEEDS after both Tier 1 & 2 approved', lintasKeu3.status === 200, `Got ${lintasKeu3.status}: ${lintasKeu3.json?.error}`);

  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
