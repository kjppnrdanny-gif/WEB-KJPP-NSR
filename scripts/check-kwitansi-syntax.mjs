import fs from 'fs';
import vm from 'vm';

const html = fs.readFileSync('portal-kwitansi.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
console.log('Total script blocks in portal-kwitansi.html:', scriptMatches.length);

let allValid = true;
scriptMatches.forEach((m, idx) => {
  const code = m[1];
  if (!code.trim()) return;
  try {
    new vm.Script(code);
    console.log(`Script block ${idx + 1} passed syntax check (length: ${code.length})`);
  } catch (err) {
    allValid = false;
    console.error(`Script block ${idx + 1} failed syntax check:`, err.message);
  }
});

if (allValid) {
  console.log('ALL scripts in portal-kwitansi.html are 100% syntactically VALID!');
} else {
  process.exit(1);
}
