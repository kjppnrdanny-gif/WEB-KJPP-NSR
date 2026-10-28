import fs from 'fs';

let auth = fs.readFileSync('auth-handler.php', 'utf8').replace(/\r\n/g, '\n');

// Perbaiki urutan perhitungan $expiresAt sebelum simpanSesiServer
auth = auth.replaceAll(
  `$sessionToken = bin2hex(random_bytes(16));\n        $_SESSION['nsr_session_token'] = $sessionToken;\n        simpanSesiServer($sessionsFile, $sessionToken, $user, $expiresAt);\n\n        $expiresAt = (time() + 28800) * 1000;`,
  `$sessionToken = 'nsr_sess_' . bin2hex(random_bytes(16));\n        $_SESSION['nsr_session_token'] = $sessionToken;\n        $expiresAt = (time() + 28800) * 1000;\n        simpanSesiServer($sessionsFile, $sessionToken, $user, $expiresAt);`
);

fs.writeFileSync('auth-handler.php', auth, 'utf8');
console.log('✔ auth-handler.php expiresAt order fixed');
