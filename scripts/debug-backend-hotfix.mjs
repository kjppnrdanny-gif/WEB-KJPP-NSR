import http from 'http';

const testId = 'HOTFIX-TEST-DEBUG';

async function req(action, payload) {
  const data = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8893,
      path: `/?action=${action}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer NSR8899`,
        'X-Session-Token': 'NSR8899'
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        console.log(`[${action}] Status: ${res.statusCode}`);
        console.log(`[${action}] Body:`, body);
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', err => reject(err));
    req.write(data);
    req.end();
  });
}

(async () => {
  // First verify king
  const resVerif = await req('verifyPengesahKing', {
    operator: 'DENI',
    credential: 'NSR-DS-2026!P',
    idPenugasan: testId
  });

  const parsed = JSON.parse(resVerif.body);
  const proof = parsed.verification_proof;

  // Next create project in DB
  await req('submitGerbang1Awal', {
    idPenugasan: testId,
    namaKlien: 'Test Debitur',
    jenisObjek: 'Rumah',
    kantorWilayah: 'Bandung'
  });

  // Next approve with tampered proof
  await req('approveProfesionalCabangLP', {
    idPenugasan: testId,
    kantorWilayah: 'Bandung',
    verification_proof: proof + 'tampered'
  });

  // Next approve with legitimate proof
  await req('approveProfesionalCabangLP', {
    idPenugasan: testId,
    kantorWilayah: 'Bandung',
    verification_proof: proof
  });
})();
