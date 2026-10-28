import https from 'https';

https.get('https://kjppnanangrahayu.com/index.html?t=' + Date.now(), res => {
  console.log('HTTP Status:', res.statusCode);
  console.log('Server:', res.headers['server']);
  console.log('All Headers:', res.headers);
});
