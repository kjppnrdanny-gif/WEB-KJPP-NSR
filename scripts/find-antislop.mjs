import fs from 'fs';

const files = ['portal-tracking.html', 'index.html', 'portal-penugasan-jo.html', 'portal-nolap.html'];
const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (emojiRegex.test(line)) {
      console.log(`[EMOJI] ${f}:${idx + 1}: ${line.trim().slice(0, 100)}`);
    }
    if (/animate-pulse|pulse-amber-stage/.test(line)) {
      console.log(`[PULSE] ${f}:${idx + 1}: ${line.trim().slice(0, 100)}`);
    }
    if (/cth:|Contoh: NSR/i.test(line)) {
      console.log(`[SPILL] ${f}:${idx + 1}: ${line.trim().slice(0, 100)}`);
    }
  });
}
