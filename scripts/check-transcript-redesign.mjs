import fs from 'fs';

const logFile = 'C:/Users/HP/.gemini/antigravity/brain/5b357e59-98db-42c8-a216-3b795e1f1b2d/.system_generated/logs/transcript.jsonl';
if (fs.existsSync(logFile)) {
  const content = fs.readFileSync(logFile, 'utf8');
  const matches = content.match(/.{0,100}redesign_login.{0,100}/gi);
  console.log('Matches in transcript:', matches);
} else {
  console.log('transcript.jsonl not found');
}
