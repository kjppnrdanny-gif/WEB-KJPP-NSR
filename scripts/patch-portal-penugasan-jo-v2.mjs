import fs from 'node:fs';

const filePath = 'portal-penugasan-jo.html';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF for consistent matching
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Extract the modal markup and gerbang 1 JS logic
const markerStart = `</div>\n\n  <!-- MODAL REVIEW GERBANG 1: SPM (DANNY) & DIVTEK (DENI) -->`;
const markerScriptOpen = `  <script>\n    // =========================================================================\n    // DUAL SMART MITIGATION GATE ENGINE (GERBANG 1 FRONTEND LOGIC)`;
const markerScriptClose = `    }\n  </script>\n\n</body>\n</html>\n      \`.trim();`;

const pos1 = content.indexOf(markerStart);
const pos2 = content.indexOf(markerScriptOpen);
const pos3 = content.indexOf(markerScriptClose);

console.log('pos1:', pos1, 'pos2:', pos2, 'pos3:', pos3);

if (pos1 === -1 || pos2 === -1 || pos3 === -1) {
  console.error('ERROR: Could not locate markers in portal-penugasan-jo.html');
  process.exit(1);
}

// Extract modal HTML (between pos1 + "</div>\n\n".length and pos2)
const modalHtml = content.substring(pos1 + 7, pos2).trim();

// Extract Gerbang 1 JS (between pos2 + "  <script>\n".length and pos3 + "    }\n".length)
const jsOpenTagLen = '  <script>\n'.length;
const gerbang1Js = content.substring(pos2 + jsOpenTagLen, pos3 + 6).trim();

// 2. Build the clean unduhSuratRepresentasiWord closing + Gerbang 1 JS
const cleanReplacement = `</div>
</body>
</html>
      \`.trim();

      const blob = new Blob(['\\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
    }

    // =========================================================================
    // DUAL SMART MITIGATION GATE ENGINE (GERBANG 1 FRONTEND LOGIC)
    // =========================================================================
    ` + gerbang1Js.replace('// =========================================================================\n    // DUAL SMART MITIGATION GATE ENGINE (GERBANG 1 FRONTEND LOGIC)\n    // =========================================================================\n', '');

// Replace the corrupted section in content
const endOfCorrupted = pos3 + markerScriptClose.length;
content = content.substring(0, pos1 + 6) + '\n' + cleanReplacement + content.substring(endOfCorrupted);

// 3. Insert modalHtml before <!-- ==================== JAVASCRIPT MASTER SISTEM ==================== -->
const jsMasterComment = '<!-- ==================== JAVASCRIPT MASTER SISTEM ==================== -->';
const jsMasterPos = content.indexOf(jsMasterComment);
if (jsMasterPos === -1) {
  console.error('ERROR: Could not locate jsMasterComment');
  process.exit(1);
}
content = content.substring(0, jsMasterPos) + modalHtml + '\n\n' + content.substring(jsMasterPos);

// 4. Update AUTH_HASH_REGISTRY for KING in portal-penugasan-jo.html
content = content.replace(
  /'47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0':\s*\{"valid":true,"role":"SUPER ADMIN"/g,
  `'47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0': {"valid":true,"role":"SUPER_ADMIN","roleLabel":"SUPER ADMIN • KING","displayRole":"SUPER ADMIN • KANTOR PUSAT","isKing":true,"isSuperAdmin":true,"canApprove":true,"canApprovePusat":true,"mode":"PUSAT","permissions":["spm.review","divtek.review","lp.issue","nolap.issue","system.emergency_override","opr.view","opr.submit","admin.all"]`
);
content = content.replace(
  /'387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f':\s*\{"valid":true,"role":"SUPER ADMIN"/g,
  `'387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f': {"valid":true,"role":"SUPER_ADMIN","roleLabel":"SUPER ADMIN • KING","displayRole":"SUPER ADMIN • KANTOR PUSAT","isKing":true,"isSuperAdmin":true,"canApprove":true,"canApprovePusat":true,"mode":"PUSAT","permissions":["spm.review","divtek.review","lp.issue","nolap.issue","system.emergency_override","opr.view","opr.submit","admin.all"]`
);

// 5. Add data-testid attributes
// 5a. jo-session-status and jo-current-role
content = content.replace(
  '<div id="session-badge" class="inline-flex',
  '<div id="session-badge" data-testid="jo-session-status" class="inline-flex'
);
content = content.replace(
  '<span id="session-label" class="font-bold">Memuat Sesi...</span>',
  '<span id="session-label" data-testid="jo-current-role" class="font-bold">Memuat Sesi...</span>'
);

// 5b. Tab buttons data-testid & keyboard accessibility
content = content.replace(
  '<button id="btn-tab-form" onclick="gantiTab(1)"',
  '<button id="btn-tab-form" onclick="gantiTab(1)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();gantiTab(1);}"'
);
content = content.replace(
  '<button id="btn-tab-dashboard" data-alias="tab-btn-2" onclick="gantiTab(2)"',
  '<button id="btn-tab-dashboard" data-testid="jo-tab-approval" data-alias="tab-btn-2" onclick="gantiTab(2)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();gantiTab(2);}" tabindex="0"'
);
content = content.replace(
  '<button id="btn-tab-preview" onclick="gantiTab(3)"',
  '<button id="btn-tab-preview" data-testid="jo-tab-print" onclick="gantiTab(3)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();gantiTab(3);}" tabindex="0"'
);

// 5c. Tab panels data-testid
content = content.replace(
  '<div id="tab-content-dashboard" class="hidden space-y-6">',
  '<div id="tab-content-dashboard" data-testid="jo-approval-panel" class="hidden space-y-6">'
);
content = content.replace(
  '<div id="tab-3" data-alias="tab-content-preview" class="hidden space-y-6">',
  '<div id="tab-3" data-testid="jo-print-panel" data-alias="tab-content-preview" class="hidden space-y-6">'
);
content = content.replace(
  '<div id="tab3-lock-screen" class="hidden flex-col',
  '<div id="tab3-lock-screen" data-testid="jo-print-lock-reason" class="hidden flex-col'
);

// 6. Support backend checksum in verifySessionChecksum
const oldVerifySig = `if (sess.sessionChecksum && sess.sessionChecksum === expectedChecksum) return true;`;
const newVerifySig = `const backendChecksum = sha256Hex([
        'NSR_SESSION_INTEGRITY_2026_x7k9::',
        sess.tokenHash || '',
        sess.role || '',
        sess.wilayah || '',
        sess.expiresAt || sess.loginTime || '',
        sess.isSuperAdmin ? 'TRUE' : 'FALSE',
        'NSR_ZERO_TRUST_SIG_2026_9x4m'
      ].join('::'));
      if (sess.sessionChecksum && (sess.sessionChecksum === expectedChecksum || sess.sessionChecksum === backendChecksum)) return true;`;
if (content.includes(oldVerifySig)) {
  content = content.replace(oldVerifySig, newVerifySig);
}

// 7. Update isSuperAdmin logic to include auth.isKing and SUPER_ADMIN
content = content.replace(
  /const isSuperAdmin = Boolean\(auth && \(auth\.isSuperAdmin \|\| auth\.role === 'SUPER_ADMIN' \|\| auth\.role === 'ADMIN_PUSAT'\)\);/g,
  "const isSuperAdmin = Boolean(auth && (auth.isSuperAdmin || auth.role === 'SUPER_ADMIN' || auth.role === 'SUPER ADMIN' || auth.role === 'ADMIN_PUSAT' || auth.isKing));"
);

// 8. Restore CRLF if needed
if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully patched portal-penugasan-jo.html with correct structure!');
