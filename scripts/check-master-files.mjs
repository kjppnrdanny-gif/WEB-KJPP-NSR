import fs from 'fs';
import path from 'path';

// Let's find any xlsx or docx files uploaded or in workspace
const files = fs.readdirSync('.');
console.log('Workspace files matching xlsx/docx:');
files.filter(f => f.endsWith('.xlsx') || f.endsWith('.docx')).forEach(f => console.log(' - ' + f));

// Check .user_uploaded in artifact dir
const userUploadDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\.user_uploaded';
if (fs.existsSync(userUploadDir)) {
  console.log('\nUser uploaded files:');
  fs.readdirSync(userUploadDir).forEach(f => console.log(' - ' + f));
}
