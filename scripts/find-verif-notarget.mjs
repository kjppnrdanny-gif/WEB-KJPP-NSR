import fs from 'fs';

const engine = fs.readFileSync('lib/opini-nsr-modal-engine.js', 'utf8');

const idx = engine.indexOf("if (auth.isSuperAdmin) {");
if (idx !== -1) {
  console.log(engine.slice(idx, idx + 1500));
}
