import fs from 'fs';
import path from 'path';

const ROOT_DIR = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

const targetFiles = [
  'lib/opini-nsr-modal-engine.js',
  'index.html',
  'portofolio-rekanan.html',
  'layanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

const OLD_BLOCK_ENGINE = `      // 1. Validasi Otoritatif Server-Side (PHP cPanel Zero-Trust Endpoint)
      try {
        const resp = await fetch('/api/auth-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ token: input }),
          credentials: 'include'
        });
        if (resp.ok) {
          const srv = await resp.json();
          if (srv && srv.authenticated && srv.user) {
            auth = {
              ...srv.user,
              valid: true,
              token: input,
              tokenHash: srv.tokenHash || computeTokenHashSync(input),
              sessionChecksum: srv.sessionChecksum,
              expiresAt: srv.expiresAt || (Date.now() + (8 * 3600 * 1000))
            };
          }
        }
      } catch (_) {
        // Offline / mode berkas statis
      }

      // 2. Fallback Resolver jika lingkungan serverless/offline
      if (!auth) {
        auth = window.resolveUnifiedToken(input);
      }`;

const NEW_BLOCK_ENGINE = `      // 1. Validasi Otoritatif Server-Side (PHP cPanel Zero-Trust Endpoint)
      let backendRejectionReason = null;
      let serverContacted = false;

      try {
        const resp = await fetch('/api/auth-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ token: input }),
          credentials: 'include'
        });
        serverContacted = true;
        const srv = await resp.json().catch(() => null);
        if (resp.ok && srv && srv.authenticated && srv.user) {
          auth = {
            ...srv.user,
            valid: true,
            token: input,
            tokenHash: srv.tokenHash || computeTokenHashSync(input),
            sessionChecksum: srv.sessionChecksum,
            expiresAt: srv.expiresAt || (Date.now() + (8 * 3600 * 1000))
          };
        } else {
          // Server merespons namun menolak token (HTTP 401 / 403 / non-auth)
          backendRejectionReason = (srv && srv.error) ? srv.error : 'Akses Ditolak: Token otorisasi tidak valid.';
        }
      } catch (_) {
        // Jika berada di protokol HTTP/HTTPS web, kegagalan fetch adalah kegagalan koneksi backend
        if (window.location.protocol.startsWith('http')) {
          serverContacted = true;
          backendRejectionReason = 'Gagal menghubungi server autentikasi resmi. Akses ditolak.';
        }
      }

      // 2. Fallback Resolver: HANYA jika murni mode file statis offline lokal tanpa web server (file:///)
      // Di hosting web/cPanel (http/https), wajib diverifikasi backend. Dilarang login via fallback browser!
      if (!auth && !serverContacted && window.location.protocol === 'file:') {
        auth = typeof window.resolveUnifiedToken === 'function' ? window.resolveUnifiedToken(input) : null;
      }`;

targetFiles.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Normalize CRLF to LF for matching
  const isCrlf = content.includes('\r\n');
  const normalized = content.replace(/\r\n/g, '\n');

  if (normalized.includes(OLD_BLOCK_ENGINE)) {
    const replaced = normalized.replace(OLD_BLOCK_ENGINE, NEW_BLOCK_ENGINE);
    const finalContent = isCrlf ? replaced.replace(/\n/g, '\r\n') : replaced;
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log(`SUCCESS: Enforced strict backend auth in ${file}`);
  } else {
    // If exact block not found, search with regex
    const regex = /\/\/\s*1\.\s*Validasi Otoritatif Server-Side[\s\S]*?\/\/\s*2\.\s*Fallback Resolver[\s\S]*?auth\s*=\s*(?:window\.)?resolveUnifiedToken\(input\);?\s*\}/i;
    if (regex.test(normalized)) {
      const replaced = normalized.replace(regex, NEW_BLOCK_ENGINE);
      const finalContent = isCrlf ? replaced.replace(/\n/g, '\r\n') : replaced;
      fs.writeFileSync(filePath, finalContent, 'utf8');
      console.log(`SUCCESS (via regex): Enforced strict backend auth in ${file}`);
    } else {
      console.error(`FAILED to find auth block in ${file}`);
    }
  }
});
