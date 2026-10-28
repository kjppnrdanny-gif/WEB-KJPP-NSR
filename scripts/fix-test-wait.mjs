import fs from 'fs';

let content = fs.readFileSync('scripts/test-nolap-approval-smart-register.mjs', 'utf8');

// Add loadEventFired listener and loop
const navTarget = `  await send('Page.navigate', { url: URL });
  await new Promise(r => setTimeout(r, 2000));`;

const navRep = `  let loadFired = false;
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.method === 'Page.loadEventFired') loadFired = true;
  });

  await send('Page.navigate', { url: URL });
  for (let i = 0; i < 40; i++) {
    if (loadFired) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1200));`;

content = content.replace(navTarget, navRep);
fs.writeFileSync('scripts/test-nolap-approval-smart-register.mjs', content, 'utf8');
console.log('✓ Added loadEventFired to test-nolap-approval-smart-register.mjs');
