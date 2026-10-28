import fs from 'node:fs';

const NEW_BUTTON_INDEX = `            <button type="button" onclick="bukaModalPortal()" class="inline-flex items-center gap-1 whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition shadow-sm shadow-amber-400/20 active:scale-95" aria-label="Buka OPINI NSR">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
              <svg class="w-3.5 h-3.5 text-slate-950 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span>OPINI NSR</span>
            </button>`;

const NEW_BUTTON_SECONDARY = `          <button type="button" onclick="bukaModalPortal()" class="sm:hidden inline-flex items-center gap-1 whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition shadow-sm shadow-amber-400/20 active:scale-95" aria-label="Buka OPINI NSR">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
            <svg class="w-3.5 h-3.5 text-slate-950 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <span>OPINI NSR</span>
          </button>`;

// 1. Update index.html
function updateIndex() {
  let content = fs.readFileSync('index.html', 'utf8');
  const isCrlf = content.includes('\r\n');
  const eol = isCrlf ? '\r\n' : '\n';

  // Match the button in the mobile navigation bar of index.html
  const pattern = /<button[^>]*bukaModalPortal\(\)[^>]*class="[^"]*(?:inline-flex|rounded-md)[^"]*"[^>]*>[\s\S]*?<span>OPINI NSR<\/span>[\s\S]*?<\/button>/;

  if (pattern.test(content)) {
    content = content.replace(pattern, NEW_BUTTON_INDEX.replace(/\n/g, eol).trim());
    fs.writeFileSync('index.html', content, 'utf8');
    console.log('✓ index.html successfully updated with approved OPINI NSR mobile button!');
  } else {
    console.error('✗ Pattern not matched in index.html');
  }
}

// 2. Update secondary pages
const secondaryPages = [
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

function updateSecondaryPages() {
  secondaryPages.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    const isCrlf = content.includes('\r\n');
    const eol = isCrlf ? '\r\n' : '\n';

    // Replace existing button in mobile bar
    const btnRegex = /<button[^>]*onclick="bukaModalPortal\(\)"[^>]*class="sm:hidden[^"]*"[^>]*>[\s\S]*?<span>OPINI NSR<\/span>[\s\S]*?<\/button>/;

    if (btnRegex.test(content)) {
      content = content.replace(btnRegex, NEW_BUTTON_SECONDARY.replace(/\n/g, eol).trim());
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✓ ${file} successfully updated with approved OPINI NSR mobile button!`);
    } else {
      console.warn(`! Existing mobile OPINI NSR button not found in ${file}`);
    }
  });
}

updateIndex();
updateSecondaryPages();
