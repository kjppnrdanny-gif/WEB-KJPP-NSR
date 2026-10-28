import fs from 'fs';

let idx = fs.readFileSync('index.html', 'utf8');
idx = idx.replace('class="bg-gradient-to-r from-amber-400 to-emerald-400 h-2 rounded-full transition-all duration-500"', 'class="bg-amber-400 h-2 rounded-full transition-all duration-500"');
idx = idx.replace(
  "document.getElementById('pub-modal-progress-bar').style.width = (job.progress_percent || 57) + '%';",
  "const pPct = job.progress_percent || 57; const pBar = document.getElementById('pub-modal-progress-bar'); pBar.style.width = pPct + '%'; pBar.className = (pPct >= 100 ? 'bg-emerald-500' : 'bg-amber-400') + ' h-2 rounded-full transition-all duration-500';"
);
fs.writeFileSync('index.html', idx, 'utf8');
console.log('✓ index.html progress bar polished');
