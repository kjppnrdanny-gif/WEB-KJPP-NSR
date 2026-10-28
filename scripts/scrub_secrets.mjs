import fs from 'node:fs';
import path from 'node:path';

const SCRATCH_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\scratch';

if (fs.existsSync(SCRATCH_DIR)) {
  const files = fs.readdirSync(SCRATCH_DIR);
  let scrubbedCount = 0;
  for (const file of files) {
    const fullPath = path.join(SCRATCH_DIR, file);
    try {
      if (fs.statSync(fullPath).isFile()) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('bdvmTzCYmqj121')) {
          content = content.replaceAll('bdvmTzCYmqj121', '$env:NSR_FTP_PASS');
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Scrubbed secret from: ${file}`);
          scrubbedCount++;
        }
      }
    } catch (e) {}
  }
  console.log(`Total scratch files scrubbed: ${scrubbedCount}`);
}
