import fs from 'fs';

let content = fs.readFileSync('tests/test-spm-divtek-rbac-workflow.mjs', 'utf8');

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

const target = `  // TEST 8: Generator Dokumen Ganda (Dual Output: TANDA_TERIMA & QA_CHECKLIST)
  const targetReqId = regulerValidRes.data?.record?.noPermintaan || regulerValidRes.data?.record?.idPenugasan;
  const tandaTerimaRes = await request(\`/nolap-data-handler.php?action=renderDocumentTemplate&templateName=TANDA_TERIMA&noReq=\${encodeURIComponent(targetReqId)}\`);
  assert(tandaTerimaRes.status === 200 && (typeof tandaTerimaRes.data?.raw === 'string' && tandaTerimaRes.data.raw.length > 100),
    'Dual Output 1: Lembar Registrasi & Tanda Terima NoLap Resmi berhasil di-render (HTTP 200, HTML Content Valid)');

  const qaChecklistRes = await request(\`/nolap-data-handler.php?action=renderDocumentTemplate&templateName=QA_CHECKLIST&noReq=\${encodeURIComponent(targetReqId)}\`);
  assert(qaChecklistRes.status === 200 && (typeof qaChecklistRes.data?.raw === 'string' && qaChecklistRes.data.raw.length > 100),
    'Dual Output 2: Lembar Kertas Kerja Mitigasi SPM Sah Format Cetak A4 berhasil di-render (HTTP 200, HTML Content Valid)');`;

const replacement = `  // TEST 8: Generator Dokumen Ganda (Dual Output: TANDA_TERIMA & QA_CHECKLIST)
  const targetReqId = regulerValidRes.data?.record?.noPermintaan || regulerValidRes.data?.record?.idPenugasan;
  const tandaTerimaRes = await request(\`/nolap-data-handler.php?action=renderDocumentTemplate&templateName=TANDA_TERIMA&noReq=\${encodeURIComponent(targetReqId)}\`, {
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN }
  });
  assert(tandaTerimaRes.status === 200 && tandaTerimaRes.data?.success === true && typeof tandaTerimaRes.data?.html === 'string' && tandaTerimaRes.data.html.length > 100,
    'Dual Output 1: Lembar Registrasi & Tanda Terima NoLap Resmi berhasil di-render (HTTP 200, HTML Content Valid)');

  const qaChecklistRes = await request(\`/nolap-data-handler.php?action=renderDocumentTemplate&templateName=QA_CHECKLIST&noReq=\${encodeURIComponent(targetReqId)}\`, {
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN }
  });
  assert(qaChecklistRes.status === 200 && qaChecklistRes.data?.success === true && typeof qaChecklistRes.data?.html === 'string' && qaChecklistRes.data.html.length > 100,
    'Dual Output 2: Lembar Kertas Kerja Mitigasi SPM Sah Format Cetak A4 berhasil di-render (HTTP 200, HTML Content Valid)');`;

const normTarget = target.replace(/\r\n/g, '\n');
const normReplacement = replacement.replace(/\r\n/g, '\n');

if (content.includes(normTarget)) {
  content = content.replace(normTarget, normReplacement);
  fs.writeFileSync('tests/test-spm-divtek-rbac-workflow.mjs', content, 'utf8');
  console.log('✔ tests/test-spm-divtek-rbac-workflow.mjs successfully updated with headers.');
} else {
  console.error('✘ target not found in test-spm-divtek-rbac-workflow.mjs');
}
