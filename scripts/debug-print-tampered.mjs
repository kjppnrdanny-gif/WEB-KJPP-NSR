import http from 'http';

const testId = 'HOTFIX-TEST-PRINT';

function req(action, payload, token = 'NSR8899') {
  const data = JSON.stringify(payload);
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8895,
      path: `/?action=${action}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`,
        'X-Session-Token': token
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.write(data);
    req.end();
  });
}

(async () => {
  const { spawn } = await import('child_process');
  const server = spawn('php', ['-S', '127.0.0.1:8895', 'nolap-data-handler.php']);
  await new Promise(r => setTimeout(r, 1000));

  // Create project
  const c = await req('submitGerbang1Awal', {
    idPenugasan: testId,
    namaKlien: 'Test Debitur',
    jenisObjek: 'Rumah',
    kantorWilayah: 'Bandung',
    kodeIndustri: '01',
    npwp: '01.234.567.8-901.000',
    statusNpwp: 'VALID_NPWP',
    namaPemohon: 'Budi Santoso',
    emailPemohon: 'budi@kjppnanangrahayu.com',
    waPemohon: '081234567890'
  }, 'NSR-BDG-2026');
  console.log('Create project status:', c.status, c.body);

  // Approve tampered
  const t = await req('approveProfesionalCabangLP', {
    idPenugasan: testId,
    kantorWilayah: 'Bandung',
    verification_proof: 'fake.proof'
  }, 'NSR8899');
  console.log('Approve tampered status:', t.status, t.body);

  server.kill();
})();
