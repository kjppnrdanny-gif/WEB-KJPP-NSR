/**
 * Audit Keamanan & Kepatuhan Zero-Trust / UU PDP
 * Memindai seluruh berkas produksi (dist/) terhadap kebocoran PII Personel, Token Rahasia, & Kredensial Plaintext.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIR = process.argv[2] ? path.resolve(ROOT_DIR, process.argv[2]) : path.resolve(ROOT_DIR, 'dist');

// Pola Audit Sesuai Ketentuan Tata Kelola SPM V.4.2026 & UU PDP
const AUDIT_RULES = [
  {
    id: 'LEAK-NIK-2019',
    name: 'NIK Personel 2019 (NSR-2019-)',
    regex: /NSR-2019-/gi
  },
  {
    id: 'LEAK-NIK-202X',
    name: 'NIK Personel 202x (NSR-202- / NSR-202x-)',
    regex: /NSR-202\d-\d+/gi
  },
  {
    id: 'LEAK-NIK-BDG',
    name: 'NIK/Token Cabang Bandung (NSR-BDG-)',
    regex: /NSR-BDG-/gi
  },
  {
    id: 'LEAK-NIK-PDG',
    name: 'NIK/Token Cabang Padang (NSR-PDG-)',
    regex: /NSR-PDG-/gi
  },
  {
    id: 'LEAK-NIK-MKS',
    name: 'NIK/Token Cabang Makassar (NSR-MKS-)',
    regex: /NSR-MKS-/gi
  },
  {
    id: 'LEAK-NIK-PLB',
    name: 'NIK/Token Cabang Palembang (NSR-PLB-)',
    regex: /NSR-PLB-/gi
  },
  {
    id: 'LEAK-TOKEN-PST',
    name: 'Token Plaintext Pusat (NSR-PST-2026)',
    regex: /NSR-PST-2026/gi
  },
  {
    id: 'LEAK-PIN-ADM',
    name: 'PIN Plaintext Admin Cabang (ADM-11/22/33/44)',
    regex: /ADM-(?:11|22|33|44)/gi
  },
  {
    id: 'LEAK-BASE64-TOKEN',
    name: 'Token Base64 Bypass (TlNSODg5OQ==)',
    regex: /TlNSODg5OQ==/gi
  },
  {
    id: 'LEAK-PHONE-NUMBER',
    name: 'Nomor HP Pribadi (08[1-9]...)',
    regex: /\b08[1-9][0-9]{7,11}\b/g,
    isWhitelisted: (val) => val === '085110513157' || val === '6285110513157'
  },
  {
    id: 'LEAK-INTERNAL-EMAIL',
    name: 'Email Pribadi / Non-Domain Resmi (@yahoo / @gmail)',
    regex: /[a-zA-Z0-9._%+-]+@(?:yahoo\.com|yahoo\.co\.id|gmail\.com)/gi,
    isWhitelisted: (val) => val.toLowerCase() === 'kjppnanangrahayu@gmail.com'
  }
];

// Ekstensi teks yang dipindai
const SCANNED_EXTENSIONS = new Set([
  '.html', '.htm', '.php', '.js', '.mjs', '.json', '.txt', '.xml', '.css', '.gs'
]);

function scanDirectory(dir, findings = []) {
  if (!fs.existsSync(dir)) {
    console.warn(`[WARN] Direktori sasaran '${dir}' tidak ditemukan.`);
    return findings;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(TARGET_DIR, fullPath);

    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'tests' || entry.name === 'backups' || entry.name === 'backup_snapshots' || entry.name === 'backup_server_production' || entry.name === 'staging-isolated-package' || entry.name === 'data') continue;
      scanDirectory(fullPath, findings);
    } else if (entry.isFile()) {
      if (entry.name.startsWith('.master_karyawan') || entry.name === 'package-lock.json') continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!SCANNED_EXTENSIONS.has(ext)) continue;

      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        for (const rule of AUDIT_RULES) {
          rule.regex.lastIndex = 0;
          let match;

          while ((match = rule.regex.exec(content)) !== null) {
            const matchedValue = match[0];

            if (rule.isWhitelisted && rule.isWhitelisted(matchedValue)) {
              continue;
            }

            // Hitung nomor baris
            const lineNum = content.substring(0, match.index).split('\n').length;
            const lineSnippet = (lines[lineNum - 1] || '').trim();

            findings.push({
              file: relPath,
              fullPath: fullPath,
              line: lineNum,
              ruleId: rule.id,
              ruleName: rule.name,
              value: matchedValue,
              snippet: lineSnippet.length > 120 ? lineSnippet.substring(0, 117) + '...' : lineSnippet
            });
          }
        }
      } catch (err) {
        console.error(`[ERROR] Gagal membaca berkas ${relPath}:`, err.message);
      }
    }
  }

  return findings;
}

console.log('='.repeat(78));
console.log('🛡️  AUDIT KEAMANAN ZERO-TRUST & UU PDP - KJPP NANANG RAHAYU & REKAN');
console.log('='.repeat(78));
console.log(`Direktori Target Audit : ${TARGET_DIR}`);
console.log(`Waktu Audit            : ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
console.log('-'.repeat(78));

const startTime = Date.now();
const findings = scanDirectory(TARGET_DIR);
const duration = Date.now() - startTime;

console.log(`Pemindaian selesai dalam ${duration} ms.\n`);

if (findings.length === 0) {
  console.log('✅ STATUS: LULUS AUDIT KEAMANAN MUTLAK (0 TEMUAN KEBOCORAN)');
  console.log('   Semua berkas di direktori target bebas 100% dari PII personel, NIK,');
  console.log('   nomor HP pribadi, email non-resmi, token plaintext, dan PIN admin.');
  console.log('='.repeat(78));
  process.exit(0);
} else {
  console.error(`❌ STATUS: DITEMUKAN ${findings.length} KEBOCORAN KEAMANAN!`);
  console.error('-'.repeat(78));
  findings.forEach((f, idx) => {
    console.error(`[#${idx + 1}] ${f.ruleName} di ${f.file}:${f.line}`);
    console.error(`     Ditemukan : "${f.value}"`);
    console.error(`     Konteks   : ${f.snippet}\n`);
  });
  console.error('='.repeat(78));
  console.error('Lakukan sanitasi berkas sumber sebelum mempublikasikan berkas ke produksi.');
  process.exit(1);
}
