import assert from 'node:assert';
import { spawn } from 'node:child_process';

const phpServer = spawn('php', ['-S', '127.0.0.1:8392', 'backend/job-tracking-handler.php']);

await new Promise(r => setTimeout(r, 1200));

async function run() {
  console.log('=== TESTING NEW DELTA FEATURES ===');

  // Test 1: Public tracking strips evidence_link, opini_nilai_pasar, opini_nilai_likuidasi
  const trackRes = await fetch('http://127.0.0.1:8392/?action=track&jo=JO-JKT-2026-0001');
  const trackJson = await trackRes.json();
  assert.strictEqual(trackJson.status, 'success', 'Track should succeed');
  assert.strictEqual(trackJson.data.opini_nilai_pasar, undefined, 'opini_nilai_pasar must be stripped');
  assert.strictEqual(trackJson.data.opini_nilai_likuidasi, undefined, 'opini_nilai_likuidasi must be stripped');
  assert.strictEqual(trackJson.data.evidence_link, undefined, 'evidence_link must be stripped from public track');
  console.log('[PASS] Test 1: Public endpoint strictly strips internal financial values & evidence_link');

  // Test 2: Update milestone with evidence_link (Reviewer SPM on M-05)
  const upM5 = await fetch('http://127.0.0.1:8392/?action=advance_milestone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: 'JO-JKT-2026-0001',
      target_milestone: 'M-05',
      nik: 'NSR-2019-007', // Tedi Setiadi (Reviewer SPM)
      pin: '123456',
      note: 'Pemeriksaan SPM lengkap.',
      evidence_link: 'https://drive.google.com/test-evidence-spm'
    })
  });
  const upM5Json = await upM5.json();
  if (upM5Json.status !== 'success') console.error('upM5Json error:', upM5Json);
  assert.strictEqual(upM5Json.status, 'success', 'M-05 advance should succeed');
  assert.strictEqual(upM5Json.data.evidence_link, 'https://drive.google.com/test-evidence-spm', 'evidence_link saved');
  assert.strictEqual(upM5Json.data.current_milestone, 'M-05');
  console.log('[PASS] Test 2: Advance to M-05 with evidence_link succeeded');

  // Test 3: Rollback / Revision from M-05 to M-04 by Reviewer SPM
  const revM4 = await fetch('http://127.0.0.1:8392/?action=advance_milestone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jo: 'JO-JKT-2026-0001',
      target_milestone: 'M-04',
      nik: 'NSR-2019-007', // Tedi Setiadi (Reviewer SPM)
      pin: '123456',
      note: '[REVISI SPM]: Koreksi data pembanding properti ruko sejenis di Jl. Rawa Gelam.',
      evidence_link: 'https://drive.google.com/test-evidence-revision'
    })
  });
  const revM4Json = await revM4.json();
  assert.strictEqual(revM4Json.status, 'success', 'Rollback to M-04 should succeed');
  assert.strictEqual(revM4Json.data.current_milestone, 'M-04', 'current_milestone rolled back to M-04');
  assert.strictEqual(revM4Json.data.milestones['M-04'].status, 'in_progress', 'M-04 is in_progress');
  assert.strictEqual(revM4Json.data.milestones['M-05'].status, 'pending', 'M-05 is reset to pending');
  console.log('[PASS] Test 3: SPM Reviewer rollback to M-04 with mandatory revision findings succeeded');

  // Test 4: Verify audit log recorded the revision
  const auditRes = await fetch('http://127.0.0.1:8392/?action=get_audit_log&jo=JO-JKT-2026-0001');
  const auditJson = await auditRes.json();
  assert.strictEqual(auditJson.status, 'success');
  console.log('Audit log data length:', auditJson.data.length);
  console.log('Last logs:', auditJson.data.slice(-3));
  const revisionLog = auditJson.data.find(l => l.milestone_baru === 'M-04' || (l.catatan_progres && l.catatan_progres.includes('REVISI SPM')));
  assert(revisionLog, 'Found revision log in audit trail');
  assert(revisionLog.catatan_progres.includes('REVISI SPM'), 'Audit trail reflects revision finding note');
  console.log('[PASS] Test 4: Audit trail faithfully captured the revision log');

  console.log('================================================================');
  console.log('🎉 ALL NEW DELTA FEATURE TESTS PASSED 100%! 🎉');
  console.log('================================================================');
}

run()
  .catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  })
  .finally(() => {
    phpServer.kill();
  });
