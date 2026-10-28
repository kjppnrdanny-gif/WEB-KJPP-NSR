import https from 'node:https';

https.get('https://kjppnanangrahayu.com/nolap-data-handler.php?action=verifyToken&token=NSR-ADMIN-BDG-2026', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', d);
  });
});
