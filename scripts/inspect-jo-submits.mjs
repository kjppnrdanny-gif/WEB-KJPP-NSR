import fs from 'node:fs';

const content = fs.readFileSync('portal-penugasan-jo.html', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('function handleFormSubmit') || l.includes('const handleFormSubmit')) {
    console.log(`Found handleFormSubmit at line ${i+1}`);
    for (let j = i; j < Math.min(i + 60, lines.length); j++) {
      console.log(`${j+1}: ${lines[j]}`);
    }
  }
  if (l.includes('function eksekusiApprovalPusatSubmit') || l.includes('const eksekusiApprovalPusatSubmit')) {
    console.log(`Found eksekusiApprovalPusatSubmit at line ${i+1}`);
    for (let j = i; j < Math.min(i + 60, lines.length); j++) {
      console.log(`${j+1}: ${lines[j]}`);
    }
  }
});
