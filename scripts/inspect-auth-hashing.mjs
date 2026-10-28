import fs from 'fs';

const authHandler = fs.readFileSync('auth-handler.php', 'utf8');

// Find occurrences of hash('sha256' or similar
const lines = authHandler.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('hash(') || lines[i].includes('hash_hmac') || lines[i].includes('sha256')) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
