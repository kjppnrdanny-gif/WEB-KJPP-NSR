// scripts/inspect-wawasan-links.mjs
import fs from 'node:fs';

const html = fs.readFileSync('D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production/wawasan-regulasi.html', 'utf8');

const matches = [...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
console.log(`Total <a> tags in wawasan-regulasi.html: ${matches.length}`);

matches.forEach((m, idx) => {
  const href = m[1];
  const text = m[2].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
  console.log(`[${idx + 1}] href="${href}" -> "${text.substring(0, 45)}"`);
});
