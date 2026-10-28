import { initAuth } from '../node_modules/@google/clasp/build/src/auth/auth.js';

async function testWithAuth() {
  const authInfo = await initAuth({});
  const token = (await authInfo.credentials.getAccessToken()).token;
  const url = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    redirect: 'follow'
  });
  console.log('Status with Auth:', res.status, res.statusText);
  const text = await res.text();
  console.log('Length:', text.length);
  const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
  console.log('Title:', titleMatch ? titleMatch[1] : 'No title');
}

testWithAuth().catch(console.error);
