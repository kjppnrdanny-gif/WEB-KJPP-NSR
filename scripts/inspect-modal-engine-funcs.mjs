import fs from 'fs';

const engine = fs.readFileSync('lib/opini-nsr-modal-engine.js', 'utf8');

function findFunc(name) {
  const idx = engine.indexOf(name);
  if (idx !== -1) {
    console.log(`=== ${name} ===`);
    console.log(engine.slice(idx, idx + 1200));
  }
}

findFunc('function tampilkanPanelLayanan');
findFunc('function resetTokenSesi');
findFunc('function verifikasiTokenPortal');
findFunc('function tutupModalPortal');
findFunc('function bukaModalPortal');
