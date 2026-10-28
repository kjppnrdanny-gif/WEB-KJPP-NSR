import fs from 'node:fs';

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

for (let i = 2130; i < 3370; i++) {
  const line = lines[i];
  if (!line) continue;
  const t = line.trim();
  if (t.includes('id="tab-') || t.includes('class="tab-') || t.includes('<section') || t.includes('id="profil-') || t.includes('id="layanan') || t.includes('id="spm') || t.includes('id="mutu') || t.includes('id="cloud') || t.includes('id="portofolio') || t.includes('id="kantor') || t.includes('id="legalitas') || t.includes('id="portal-')) {
    console.log(`${i + 1}: ${t.slice(0, 110)}`);
  }
}
