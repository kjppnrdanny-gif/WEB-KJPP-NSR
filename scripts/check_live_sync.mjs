import https from 'https';

function check() {
  https.get('https://kjppnanangrahayu.com/index.html?t=' + Date.now(), res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('index.html length:', data.length);
      const idx = data.indexOf('id="kartu-e-operasional"');
      console.log('Position of kartu-e-operasional:', idx);
      const sublinkEnd = data.indexOf('</div>\r\n          </div>\r\n\r\n          <!-- KARTU 4: PORTAL PENGAJUAN OPERASIONAL');
      console.log('Double closing div found:', sublinkEnd !== -1);
    });
  });
}

check();
