import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';

async function checkStatus() {
  const authInfo = await initAuth({});
  const token = (await authInfo.credentials.getAccessToken()).token;

  // 1. Cek via unauthenticated GET
  try {
    const resAnon = await fetch(WEB_APP_URL, { redirect: 'follow' });
    const textAnon = await resAnon.text();
    const isReadyAnon = resAnon.status === 200 && (textAnon.includes('Portal Absensi') || textAnon.includes('auth-nik-input') || textAnon.includes('KJPP NSR'));
    if (isReadyAnon) {
      console.log('STATUS: READY_ANON ✅ (Aplikasi sudah aktif dan dapat diakses publik tanpa login Google!)');
      return true;
    }
  } catch (e) {
    console.log('Anon check error:', e.message);
  }

  // 2. Cek via authenticated GET
  try {
    const resAuth = await fetch(WEB_APP_URL, {
      headers: { 'Authorization': 'Bearer ' + token },
      redirect: 'follow'
    });
    const textAuth = await resAuth.text();
    const titleMatch = textAuth.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : '';
    console.log('Status saat ini:', resAuth.status, '| Judul:', title);
    if (title.includes('Authorization needed')) {
      console.log('STATUS: WAITING_USER_CONSENT ⏳');
      return false;
    }
    if (resAuth.status === 200 && (textAuth.includes('Portal Absensi') || textAuth.includes('auth-nik-input') || textAuth.includes('KJPP NSR'))) {
      console.log('STATUS: READY_AUTH ✅');
      return true;
    }
  } catch (e) {
    console.log('Auth check error:', e.message);
  }

  return false;
}

checkStatus().then(ready => {
  process.exit(ready ? 0 : 1);
});
