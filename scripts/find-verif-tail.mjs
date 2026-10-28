import fs from 'fs';

const engine = fs.readFileSync('lib/opini-nsr-modal-engine.js', 'utf8');

const idx = engine.indexOf("sessionStorage.setItem('NSR_SESSION_CHECKSUM'");
if (idx !== -1) {
  console.log(engine.slice(idx, idx + 2500));
}
