import fs from 'node:fs';

for (const f of ['GPS.html', 'gas-portal-absensi-template.html']) {
  let s = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  const target = `  <!-- MAIN CONTAINER: Langsung Form Presensi & Autentikasi -->
  <main class="flex-1 w-full max-w-xl mx-auto px-3 sm:px-4 py-2 sm:py-3 space-y-3.5">
  <main class="flex-1 w-full max-w-xl mx-auto px-3.5 py-4 space-y-4">`;
  const replacement = `  <!-- MAIN CONTAINER: Langsung Form Presensi & Autentikasi -->
  <main class="flex-1 w-full max-w-xl mx-auto px-3 sm:px-4 py-2 sm:py-3 space-y-3.5">`;
  
  if (s.includes(target)) {
    s = s.replace(target, replacement);
    fs.writeFileSync(f, s.replace(/\n/g, '\r\n'), 'utf8');
    console.log(`[PASS] Fixed duplicate main tag in ${f}`);
  } else {
    console.log(`[NOTE] Target not found in ${f}`);
  }
}
