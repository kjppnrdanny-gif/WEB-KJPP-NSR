import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';
import { google } from 'googleapis';

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';
const SPREADSHEET_ID = '1X7kJ8tJbb_bOC08RWmy6us9O-U1fkoSRTxQ3rx8b9VY';

async function testOnce() {
  // Test anonymous access
  const res = await fetch(WEB_APP_URL, { redirect: 'follow' });
  const html = await res.text();

  if (res.status === 200 && (html.includes('Portal Absensi') || html.includes('auth-nik-input') || html.includes('Absensi Online KJPP NSR'))) {
    console.log('✅ WEB APP STAGING SUDAH AKTIF & DAPAT DIAKSES PUBLIK!');
    console.log('Panjang HTML:', html.length, 'karakter');
    return true;
  }
  
  if (html.includes('Authorization needed')) {
    console.log('⏳ Masih menunggu persetujuan (Review Permissions) di browser...');
    return false;
  }

  console.log('Status HTTP:', res.status, '| HTML title:', html.match(/<title>([^<]+)<\/title>/i)?.[1]);
  return false;
}

testOnce().then(isReady => {
  process.exit(isReady ? 0 : 1);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
