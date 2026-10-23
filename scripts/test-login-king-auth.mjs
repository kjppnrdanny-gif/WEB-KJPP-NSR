import { spawn } from 'node:child_process';

const PORT = 8991;

async function testAuth() {
  console.log('🚀 Menjalankan PHP Built-in Server pada port', PORT);
  const php = spawn('php', ['-S', `127.0.0.1:${PORT}`], { stdio: 'inherit' });
  
  await new Promise(r => setTimeout(r, 1200));

  try {
    console.log('\n--- UJI 1: Otentikasi Token KING (NSR8899) ---');
    const resKing = await fetch(`http://127.0.0.1:${PORT}/auth-handler.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://kjppnanangrahayu.com'
      },
      body: JSON.stringify({ token: 'NSR8899' })
    });
    
    const dataKing = await resKing.json();
    console.log('Status HTTP:', resKing.status);
    console.log('Response:', JSON.stringify(dataKing, null, 2));

    if (resKing.status === 200 && dataKing.success === true && dataKing.authenticated === true && dataKing.user.role === 'SUPER_ADMIN') {
      console.log('✅ UJI 1 PASS: Login KING dengan NSR8899 BERHASIL SEMPURNA!');
    } else {
      console.error('❌ UJI 1 FAIL: Respon tidak sesuai harapan');
      process.exitCode = 1;
    }

    console.log('\n--- UJI 2: Otentikasi Token Admin Cabang Bandung (NSR-BDG-2026) ---');
    const resBdg = await fetch(`http://127.0.0.1:${PORT}/auth-handler.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://kjppnanangrahayu.com'
      },
      body: JSON.stringify({ token: 'NSR-BDG-2026' })
    });
    const dataBdg = await resBdg.json();
    console.log('Status HTTP:', resBdg.status);
    console.log('User Role:', dataBdg.user?.role, '| Wilayah:', dataBdg.user?.wilayah);

    if (resBdg.status === 200 && dataBdg.success === true && dataBdg.user.role === 'ADMIN_CABANG') {
      console.log('✅ UJI 2 PASS: Login Admin Cabang Bandung BERHASIL!');
    } else {
      console.error('❌ UJI 2 FAIL: Respon tidak sesuai harapan');
      process.exitCode = 1;
    }

    console.log('\n--- UJI 3: Otentikasi Token Admin Operasional Pusat (NSR-ADM-2026) ---');
    const resPst = await fetch(`http://127.0.0.1:${PORT}/auth-handler.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://kjppnanangrahayu.com'
      },
      body: JSON.stringify({ token: 'NSR-ADM-2026' })
    });
    const dataPst = await resPst.json();
    console.log('Status HTTP:', resPst.status);
    console.log('User Role:', dataPst.user?.role, '| Wilayah:', dataPst.user?.wilayah);

    if (resPst.status === 200 && dataPst.success === true && dataPst.user.role === 'ADMIN_PUSAT') {
      console.log('✅ UJI 3 PASS: Login Admin Pusat BERHASIL!');
    } else {
      console.error('❌ UJI 3 FAIL: Respon tidak sesuai harapan');
      process.exitCode = 1;
    }

    console.log('\n--- UJI 4: Tolak Token Palsu / Sembarangan ---');
    const resFake = await fetch(`http://127.0.0.1:${PORT}/auth-handler.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://kjppnanangrahayu.com'
      },
      body: JSON.stringify({ token: 'INVALID_TOKEN_TEST_99' })
    });
    const dataFake = await resFake.json();
    console.log('Status HTTP:', resFake.status);
    console.log('Response:', dataFake);

    if (resFake.status === 401 && dataFake.success === false) {
      console.log('✅ UJI 4 PASS: Token palsu ditolak HTTP 401 sesuai SOP!');
    } else {
      console.error('❌ UJI 4 FAIL: Token palsu tidak ditolak dengan benar');
      process.exitCode = 1;
    }

  } finally {
    php.kill();
  }
}

testAuth();
