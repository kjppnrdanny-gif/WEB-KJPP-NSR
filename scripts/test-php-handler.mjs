// scripts/test-php-handler.mjs
import { spawn } from 'child_process';

const phpScript = `
$_GET = ['action' => 'track', 'jo' => 'JO-JKT-2026-0001'];
require 'backend/job-tracking-handler.php';
`;

const proc = spawn('php', ['-r', phpScript]);
let stdout = '';
let stderr = '';

proc.stdout.on('data', d => stdout += d.toString());
proc.stderr.on('data', d => stderr += d.toString());

proc.on('close', code => {
  console.log('Exit code:', code);
  console.log('Stdout:', stdout);
  if (stderr) console.error('Stderr:', stderr);
});
