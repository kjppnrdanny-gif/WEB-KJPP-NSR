import fs from 'fs';

const htmlPath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(htmlPath, 'utf8');

console.log('Original content length:', content.length);

// 1. Periksa Section 01
const s1Target = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">`;
if (!content.includes(s1Target)) {
  console.error('Target Section 01 not found!');
  process.exit(1);
}

// 2. Periksa Modal Approval
const modalTarget = `<div id="modal-approval-pusat"`;
if (!content.includes(modalTarget)) {
  console.error('Target modal-approval-pusat not found!');
  process.exit(1);
}

console.log('Targets verified successfully.');
