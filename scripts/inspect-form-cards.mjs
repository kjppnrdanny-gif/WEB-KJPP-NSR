import fs from 'fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const formStart = content.indexOf('id="tab-content-form"');
const formEnd = content.indexOf('id="tab-content-dashboard"');
const formHtml = content.slice(formStart, formEnd);

// Find headings or card titles in the form
const lines = formHtml.split('\n');
lines.forEach((l, i) => {
  if (/<h[1-6]|<span class="[^"]*font-black|<!-- (Bagian|Section|Langkah|\d)/i.test(l)) {
    console.log(`L${i+1}: ${l.trim().slice(0, 90)}`);
  }
});
