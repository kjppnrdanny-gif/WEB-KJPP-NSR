import { spawn } from 'child_process';

const php = spawn('php', ['-r', `
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'cekKaryawan';
$_GET['nik'] = 'NSR-9999-999';
require_once 'backend/absensi-data-handler.php';
`]);

php.stdout.on('data', d => console.log('PHP OUT:', d.toString()));
php.stderr.on('data', d => console.error('PHP ERR:', d.toString()));
