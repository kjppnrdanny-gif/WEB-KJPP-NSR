import fs from 'fs';

const html = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/daftar-token-akses-internal.html', 'utf8');

[3, 5, 7, 9].forEach(no => {
  const re = new RegExp(`<td class="p-2\\.5 text-center font-bold text-slate-400">${no}<\\/td>[\\s\\S]*?<\\/tr>`);
  const m = html.match(re);
  if (m) {
    const textOnly = m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`No ${no}: ${textOnly}`);
  } else {
    console.log(`No ${no} not found`);
  }
});
