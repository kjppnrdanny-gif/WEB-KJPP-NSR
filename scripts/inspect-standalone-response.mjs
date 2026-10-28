import fs from 'fs';

async function test() {
  const url = 'https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec';
  const res = await fetch(url, { redirect: 'follow' });
  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('HTML length:', text.length);
  const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
  console.log('Title:', titleMatch ? titleMatch[1] : 'No title');
  
  // check for echo / iframe / sandbox
  const iframeMatch = text.match(/src="([^"]+macros\/echo[^"]+)"/);
  if (iframeMatch) {
    console.log('Found iframe echo URL:', iframeMatch[1]);
    const echoRes = await fetch(iframeMatch[1]);
    console.log('Echo response status:', echoRes.status);
    const echoText = await echoRes.text();
    console.log('Echo text length:', echoText.length);
    console.log('Echo contains Portal Absensi:', echoText.includes('Portal Absensi') || echoText.includes('KJPP'));
    console.log('Echo contains NIK:', echoText.includes('auth-nik-input') || echoText.includes('Autentikasi NIK'));
    fs.writeFileSync('scripts/echo-preview.html', echoText.slice(0, 2000), 'utf8');
  } else {
    console.log('No echo iframe URL found. First 500 chars:');
    console.log(text.slice(0, 500));
  }
}

test().catch(console.error);
