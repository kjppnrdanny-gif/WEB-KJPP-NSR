import { spawn } from 'node:child_process';

const php = spawn('php', ['-r', `
  $_GET['action'] = 'track';
  $_GET['jo'] = 'JO-JKT-2026-0001';
  ob_start();
  require 'backend/job-tracking-handler.php';
  $out = ob_get_clean();
  $j1 = json_decode($out, true);
  echo 'CASE 1: ' . $j1['data']['debitur'] . ' | ' . $j1['data']['jenis_properti'] . ' | Milestone: ' . $j1['data']['current_milestone'] . PHP_EOL;

  $_GET['jo'] = 'JO-JKT-2026-0002';
  ob_start();
  require 'backend/job-tracking-handler.php';
  $out2 = ob_get_clean();
  $j2 = json_decode($out2, true);
  echo 'CASE 2: ' . $j2['data']['debitur'] . ' | ' . $j2['data']['jenis_properti'] . ' | Milestone: ' . $j2['data']['current_milestone'] . PHP_EOL;
`]);

php.stdout.on('data', d => console.log(d.toString()));
php.stderr.on('data', d => console.error(d.toString()));
