import fs from 'fs';

const files = ['index.html', 'lib/opini-nsr-modal-engine.js'];
files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  console.log(f, 'has "cabang terlebih dahulu":', c.includes('cabang terlebih dahulu'));
});
