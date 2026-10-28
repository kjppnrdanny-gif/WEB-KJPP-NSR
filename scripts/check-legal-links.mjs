import fs from 'fs';

['disclaimer.html', 'kebijakan-privasi.html'].forEach(file => {
  const content = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/' + file, 'utf8');
  content.split('\n').forEach((l, idx) => {
    if (l.includes('absensi') || l.includes('presensi')) {
      console.log(`${file}:${idx+1}: ${l.trim()}`);
    }
  });
});
