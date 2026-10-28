import fs from 'fs';

let content = fs.readFileSync('tests/test-spm-divtek-rbac-workflow.mjs', 'utf8');

const target = `  // TEST 6: Central functional staff (Surveyor Pusat) submission -> routed to MENUNGGU_VERIFIKASI_ADMIN
  const pusatSurveyorRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': PUSAT_SURVEYOR_TOKEN },
    body: {
      origin_branch_id: 'Pusat',
      namaKlien: 'PT Korporasi Niaga Jakarta',
      kodeIndustri: '05',
      namaPemohon: 'Budi Surveyor Pusat',
      emailPemohon: 'budi.surveyor@kjppnanangrahayu.com',
      waPemohon: '081211223344',
      isBooking: false,
      modePengajuan: 'REGULER',
      linkLaporan: 'https://drive.google.com/lap_jkt.pdf',
      linkPembanding: 'https://drive.google.com/pem_jkt.xlsx',
      linkBai: 'https://drive.google.com/bai_jkt.pdf',
      smart_mitigasi: {
        pembandingValid: true,
        bebasKonflik: true,
        bebasSengketa: true,
        deltaAnalysisFisikYuridis: true
      }
    }
  });
  assert(pusatSurveyorRes.status === 200 && pusatSurveyorRes.data?.record?.status === 'MENUNGGU_VERIFIKASI_ADMIN', 
    'Staf Pusat Fungsional: Pengajuan NoLap dialirkan ke antrean verifikasi Admin Pusat (Status: MENUNGGU_VERIFIKASI_ADMIN)');`;

const replacement = `  // TEST 6: Central functional staff (Surveyor Pusat) submission -> routed directly to SPM (No Admin Intercept)
  const pusatSurveyorRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': PUSAT_SURVEYOR_TOKEN },
    body: {
      origin_branch_id: 'Pusat',
      namaKlien: 'PT Korporasi Niaga Jakarta',
      kodeIndustri: '05',
      namaPemohon: 'Budi Surveyor Pusat',
      emailPemohon: 'budi.surveyor@kjppnanangrahayu.com',
      waPemohon: '081211223344',
      isBooking: false,
      modePengajuan: 'REGULER',
      linkLaporan: 'https://drive.google.com/lap_jkt.pdf',
      linkPembanding: 'https://drive.google.com/pem_jkt.xlsx',
      linkBai: 'https://drive.google.com/bai_jkt.pdf',
      smart_mitigasi: {
        pembandingValid: true,
        bebasKonflik: true,
        bebasSengketa: true,
        deltaAnalysisFisikYuridis: true
      }
    }
  });
  assert(pusatSurveyorRes.status === 200 && pusatSurveyorRes.data?.record?.status === 'MENUNGGU_SPM_AKHIR', 
    'Staf Pusat Fungsional: Pengajuan NoLap langsung ke antrean telaah Kepala SPM tanpa intersep admin (Status: MENUNGGU_SPM_AKHIR)');

  // TEST 7: Simpan Draf Terpadu (isDraft: true) -> PASS (200 OK, Status: DRAFT, bypass strict links/mitigasi checks)
  const draftRes = await request('/nolap-data-handler.php?action=submitRequest', {
    method: 'POST',
    headers: { 'X-NSR-Token': ADMIN_BDG_TOKEN },
    body: {
      origin_branch_id: 'Bandung',
      namaKlien: 'PT Progres Draft Konstruksi',
      kodeIndustri: '03',
      namaPemohon: 'Staf Admin Cabang Bandung',
      emailPemohon: 'admin.bdg@kjppnanangrahayu.com',
      waPemohon: '081234567890',
      isDraft: true,
      modePengajuan: 'DRAFT',
      linkLaporan: '',
      linkPembanding: '',
      linkBai: '',
      smart_mitigasi: []
    }
  });
  assert(draftRes.status === 200 && draftRes.data?.success === true && draftRes.data?.record?.status === 'DRAFT',
    'Simpan Draf Terpadu: Simpan progres awal berhasil tanpa blokir berkas/mitigasi (HTTP 200, Status: DRAFT)');

  // TEST 8: Generator Dokumen Ganda (Dual Output: TANDA_TERIMA & QA_CHECKLIST)
  const targetReqId = regulerValidRes.data?.record?.noPermintaan || regulerValidRes.data?.record?.idPenugasan;
  const tandaTerimaRes = await request(\`/nolap-data-handler.php?action=renderDocumentTemplate&templateName=TANDA_TERIMA&noReq=\${encodeURIComponent(targetReqId)}\`);
  assert(tandaTerimaRes.status === 200 && (typeof tandaTerimaRes.data?.raw === 'string' && tandaTerimaRes.data.raw.length > 100),
    'Dual Output 1: Lembar Registrasi & Tanda Terima NoLap Resmi berhasil di-render (HTTP 200, HTML Content Valid)');

  const qaChecklistRes = await request(\`/nolap-data-handler.php?action=renderDocumentTemplate&templateName=QA_CHECKLIST&noReq=\${encodeURIComponent(targetReqId)}\`);
  assert(qaChecklistRes.status === 200 && (typeof qaChecklistRes.data?.raw === 'string' && qaChecklistRes.data.raw.length > 100),
    'Dual Output 2: Lembar Kertas Kerja Mitigasi SPM Sah Format Cetak A4 berhasil di-render (HTTP 200, HTML Content Valid)');`;

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

const normTarget = toCrlf(target);
const normReplacement = toCrlf(replacement);

if (content.includes(normTarget)) {
  content = content.replace(normTarget, normReplacement);
  fs.writeFileSync('tests/test-spm-divtek-rbac-workflow.mjs', content, 'utf8');
  console.log('✔ tests/test-spm-divtek-rbac-workflow.mjs successfully updated.');
} else {
  // Try LF
  const lfTarget = target.replace(/\r\n/g, '\n');
  const lfReplacement = replacement.replace(/\r\n/g, '\n');
  if (content.includes(lfTarget)) {
    content = content.replace(lfTarget, lfReplacement);
    fs.writeFileSync('tests/test-spm-divtek-rbac-workflow.mjs', content, 'utf8');
    console.log('✔ tests/test-spm-divtek-rbac-workflow.mjs successfully updated (LF).');
  } else {
    console.error('✘ Target not found in tests/test-spm-divtek-rbac-workflow.mjs');
  }
}
