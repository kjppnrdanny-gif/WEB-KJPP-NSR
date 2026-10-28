import fs from 'fs';

const filePath = 'portal-penugasan-jo.html';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('function updateNomorOtomatisPreview(') || l.includes('function handleFormSubmit(') || l.includes('function approveProyekPusat(') || l.includes('function eksekusiApprovalPusatSubmit(')) {
    console.log(`Line ${i + 1}: ${l}`);
  }
});
