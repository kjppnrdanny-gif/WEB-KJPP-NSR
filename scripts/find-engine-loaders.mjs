import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  if (html.includes('opini-nsr-modal-engine.js')) {
    console.log(f, 'loads opini-nsr-modal-engine.js');
  }
});
