import https from 'https';

async function waitLive() {
  for (let i = 1; i <= 20; i++) {
    const res = await new Promise((resolve) => {
      https.get('https://kjppnanangrahayu.com/index.html?nocache=' + Date.now(), r => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => resolve({ len: d.length, data: d }));
      });
    });

    console.log(`[Attempt ${i}] Live index.html length: ${res.len}`);
    if (res.data.includes('id="kartu-e-operasional"') && res.len > 550000) {
      console.log('✅ Updated index.html is live on production cPanel!');
      return true;
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  return false;
}

waitLive().then(ok => {
  if (!ok) console.log('Still waiting or using cached edge...');
});
