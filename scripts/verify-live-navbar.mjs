async function checkLive() {
  const ts = Date.now();
  console.log('Testing live website: https://kjppnanangrahayu.com/');
  const res = await fetch('https://kjppnanangrahayu.com/?_t=' + ts, {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
  });
  console.log('HTTP Status:', res.status);
  const text = await res.text();
  console.log('Contains aria-label "Buka OPINI NSR":', text.includes('Buka OPINI NSR'));
  console.log('Contains OPINI NSR span:', text.includes('<span>OPINI NSR</span>'));
  console.log('Contains old Portal text in mobile bar:', text.includes('<span>Portal</span>'));

  const m = text.match(/<button[^>]*aria-label=["']Buka OPINI NSR["'][^>]*>[\s\S]*?<\/button>/i);
  if (m) {
    console.log('Matched Live Button HTML:\n', m[0]);
  } else {
    console.log('Aria-label button not found yet (GitHub Action may still be deploying).');
    const mPortal = text.match(/<button[^>]*onclick=["']bukaModalPortal\(\)["'][^>]*>[\s\S]*?<\/button>/i);
    if (mPortal) console.log('Current button on live:\n', mPortal[0]);
  }
}

checkLive();
