import fs from 'node:fs';
import path from 'node:path';

// 1. Update netlify.toml
const netlifyPath = path.resolve('netlify.toml');
let netlifyContent = fs.readFileSync(netlifyPath, 'utf8');

const netlifyTarget = '# Proteksi Fallback Akses Internal\r\n[[redirects]]\r\n  from = "/tests/*"';
const netlifyTargetLf = '# Proteksi Fallback Akses Internal\n[[redirects]]\n  from = "/tests/*"';

const redirectRule = `# Proteksi Direktori Data & Master Backend (Cegah Kebocoran Master/Spreadsheet ID/Personel)
[[redirects]]
  from = "/data/*"
  to = "/index.html"
  status = 404
  force = true

`;

if (netlifyContent.includes(netlifyTarget)) {
  netlifyContent = netlifyContent.replace(
    netlifyTarget,
    redirectRule.replace(/\n/g, '\r\n') + netlifyTarget
  );
  fs.writeFileSync(netlifyPath, netlifyContent, 'utf8');
  console.log('✓ netlify.toml updated with /data/* blocking redirect (CRLF).');
} else if (netlifyContent.includes(netlifyTargetLf)) {
  netlifyContent = netlifyContent.replace(
    netlifyTargetLf,
    redirectRule + netlifyTargetLf
  );
  fs.writeFileSync(netlifyPath, netlifyContent, 'utf8');
  console.log('✓ netlify.toml updated with /data/* blocking redirect (LF).');
} else {
  console.error('Target not found in netlify.toml');
  process.exit(1);
}

// 2. Update scripts/build-production.mjs
const buildPath = path.resolve('scripts/build-production.mjs');
let buildContent = fs.readFileSync(buildPath, 'utf8');

// A. Add /data/ to FORBIDDEN_PATTERNS
const forbiddenTarget = `/master_personel_kontak\\.json$/i,`;
const forbiddenReplace = `/master_personel_kontak\\.json$/i,
  /^data(?:\/|\\\\|$)/i,
  /(?:^|[\/\\\\])data(?:[\/\\\\]|$)/i,`;

if (buildContent.includes(forbiddenTarget)) {
  buildContent = buildContent.replace(forbiddenTarget, forbiddenReplace);
  console.log('✓ Added data directory patterns to FORBIDDEN_PATTERNS in build-production.mjs.');
}

// B. Remove the block copying data/masters and official_register_config.json to DIST_DIR
const copyMastersStart = 'if (isCpanel) {';
const copyMastersEnd = 'console.log(\'✓ Menyalin direktori data master resmi';

const cpanelIdx = buildContent.indexOf(copyMastersStart);
if (cpanelIdx !== -1) {
  // Find where this specific isCpanel block copying masters is
  const secondCpanelIdx = buildContent.indexOf('if (isCpanel) {\n      const srcMasters', cpanelIdx) !== -1
    ? buildContent.indexOf('if (isCpanel) {\n      const srcMasters', cpanelIdx)
    : buildContent.indexOf('if (isCpanel) {\r\n      const srcMasters', cpanelIdx);

  if (secondCpanelIdx !== -1) {
    // Find closing brace of this block
    const registerLog = "console.log('✓ Menyalin berkas register resmi: data/official_register_config.json');";
    const regIdx = buildContent.indexOf(registerLog, secondCpanelIdx);
    if (regIdx !== -1) {
      const closeBraceIdx = buildContent.indexOf('}', regIdx);
      if (closeBraceIdx !== -1) {
        const fullBlock = buildContent.substring(secondCpanelIdx, closeBraceIdx + 1);
        const replacementNote = `// KEAMANAN P0: Direktori data/ dan berkas master backend HANYA untuk konsumsi server PHP / backend internal.
    // JANGAN PERNAH menyalin direktori data/ ke paket distribusi publik dist/.`;
        buildContent = buildContent.replace(fullBlock, replacementNote);
        console.log('✓ Removed data/masters copy logic from build-production.mjs.');
      }
    }
  }
}

// C. Ensure dist/data cleanup is performed before and after build
const cleanDistStart = 'if (fs.existsSync(DIST_DIR)) {';
const cleanDistReplace = `if (fs.existsSync(DIST_DIR)) {
    // Bersihkan direktori publik dist/ secara menyeluruh
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });`;

// Write back build-production.mjs
fs.writeFileSync(buildPath, buildContent, 'utf8');
console.log('✓ Successfully hardened scripts/build-production.mjs.');

// 3. Remove dist/data if currently present
const distDataDir = path.resolve('dist/data');
if (fs.existsSync(distDataDir)) {
  fs.rmSync(distDataDir, { recursive: true, force: true });
  console.log('✓ Removed dist/data directory from dist package.');
}
