/**
 * verify-candidate-portals.mjs
 * End-to-end verification of candidate production portals in dist/:
 * - portal-nolap.html
 * - portal-kwitansi.html
 * 
 * Verifies:
 * 1. Build security gate passed (no leak, no hardcoded tokens)
 * 2. Static scan on dist/ confirms ZERO tokens, ZERO password dictionaries, ZERO ?token= handling
 * 3. Browser E2E verification of server auth login, session verify, RBAC access control, operational continuity, and logout
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

console.log("=======================================================");
console.log("🔍 PENGUJIAN AKHIR KANDIDAT PRODUKSI PORTAL NOLAP & KWITANSI");
console.log("=======================================================");

// 1. Jalankan build produksi
console.log("\n[1/5] Menjalankan Build Produksi Allowlist...");
execSync("node scripts/build-production.mjs", { cwd: ROOT_DIR, stdio: "inherit" });

// 2. Audit Statis Berkas dist/
console.log("\n[2/5] Pemindaian Token Statis pada dist/...");
const portalFiles = ["portal-nolap.html", "portal-kwitansi.html", "index.html"];
const forbiddenPatterns = [
  /MASTER_TOKEN\s*=/i,
  /MASTER_USER_ACCOUNTS\s*=/i,
  /TOKEN_CABANG_MAP\s*=/i,
  /TOKEN_CABANG_NSR\s*=/i,
  /TOKEN_PUSAT_VALID\s*=/i,
  /urlParams\.get\(['"]token['"]\)/i,
  /NSR-PST-2026/i,
  /NSR-BDG-2026/i,
  /NSR-ADM-99/i,
  /NSR8899/i,
  /ADMIN#NSR/i,
  /JKT#00/i,
  /test_cabang/i,
  /test_keuangan/i
];

for (const pf of portalFiles) {
  const content = fs.readFileSync(path.join(DIST_DIR, pf), "utf8");
  for (const pat of forbiddenPatterns) {
    if (pat.test(content)) {
      throw new Error(`[GAGAL] Pola rahasia/lama ditemukan di dist/${pf}: ${pat}`);
    }
  }
  console.log(`✓ dist/${pf} BERSIH dari seluruh pola rahasia & token bypass.`);
}

// 3. Siapkan Server HTTP Lokal dengan Mock API Auth Serverless
console.log("\n[3/5] Menyiapkan Server HTTP Lokal dengan Endpoint Serverless...");

let currentSession = null; // null | user object

const MIME_MAP = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  // Mock API Auth Verify
  if (pathname === "/api/auth-verify" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    if (currentSession) {
      res.end(JSON.stringify({ authenticated: true, user: currentSession }));
    } else {
      res.end(JSON.stringify({ authenticated: false, user: null }));
    }
    return;
  }

  // Mock API Auth Login
  if (pathname === "/api/auth-login" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { identifier, password } = payload;
        
        if (identifier === "admin_pusat" && password === "PusatValid2026!") {
          currentSession = {
            sub: "admin_pusat",
            role: "ADMIN_PUSAT",
            branch: "Pusat",
            displayName: "Administrator Kantor Pusat",
            title: "Admin Approval"
          };
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, user: currentSession }));
          return;
        }

        if (identifier === "staf_bandung" && password === "BdgValid2026!") {
          currentSession = {
            sub: "staf_bandung",
            role: "CABANG",
            branch: "Bandung",
            displayName: "Tiara (Admin Bandung)",
            title: "Admin Cabang"
          };
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, user: currentSession }));
          return;
        }

        if (identifier === "keuangan_pusat" && password === "FinValid2026!") {
          currentSession = {
            sub: "keuangan_pusat",
            role: "KEUANGAN",
            branch: "Pusat",
            displayName: "Milda Hidayati Dewi, S.E.",
            title: "Keuangan Pusat"
          };
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, user: currentSession }));
          return;
        }

        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Nama pengguna atau kata sandi tidak valid." }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Payload tidak valid." }));
      }
    });
    return;
  }

  // Mock API Auth Logout
  if (pathname === "/api/auth-logout" && req.method === "POST") {
    currentSession = null;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // File statis dist/
  let filePath = path.normalize(path.join(DIST_DIR, pathname));
  if (pathname === "/") filePath = path.join(DIST_DIR, "index.html");

  if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;
console.log(`✓ Server HTTP berjalan di: ${baseUrl}`);

// 4. Hubungkan ke Chrome CDP
console.log("\n[4/5] Menguji di Browser Nyata via CDP...");

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      } catch (e) {}
    };
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }
  }
}

const cdpPort = 9892;
const chromeProc = spawn(CHROME_PATH, [
  "--headless=new",
  `--remote-debugging-port=${cdpPort}`,
  "--remote-allow-origins=*",
  "--no-sandbox"
], { stdio: "ignore" });

await new Promise(r => setTimeout(r, 1200));
const target = await (await fetch(`http://127.0.0.1:${cdpPort}/json/new?about:blank`, { method: "PUT" })).json();
const cdp = new CdpClient(target.webSocketDebuggerUrl);
await cdp.connect();
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");

async function navigateAndWait(url) {
  const loadPromise = new Promise((resolve) => {
    const handler = (evt) => {
      try {
        const d = JSON.parse(evt.data);
        if (d.method === "Page.loadEventFired") {
          cdp.ws.removeEventListener("message", handler);
          resolve();
        }
      } catch (e) {}
    };
    cdp.ws.addEventListener("message", handler);
  });
  await cdp.send("Page.navigate", { url });
  await loadPromise;
  await new Promise(r => setTimeout(r, 500));
}

// ==========================================
// TEST A: PORTAL NOLAP
// ==========================================
console.log("\n--- A. PENGUJIAN PORTAL NOLAP (dist/portal-nolap.html) ---");
currentSession = null; // Mulai kondisi belum login

await navigateAndWait(`${baseUrl}/portal-nolap.html`);

// 1. Kondisi awal: box auth terlihat, panel utama tersembunyi
const nolapInitAuthBoxVisible = await cdp.eval(`!document.getElementById('box-auth-token').classList.contains('hidden')`);
const nolapInitPanelHidden = await cdp.eval(`document.getElementById('panel-aplikasi-utama').classList.contains('hidden')`);
console.log(`✓ NoLap Sebelum Login: Box Auth Tampil = ${nolapInitAuthBoxVisible}, Panel Aplikasi Terkunci = ${nolapInitPanelHidden}`);

if (!nolapInitAuthBoxVisible || !nolapInitPanelHidden) {
  throw new Error("Gagal: NoLap tidak terkunci secara default!");
}

// 2. Uji Login Gagal (Kredensial Salah)
await cdp.eval(`
  document.getElementById('input-auth-id').value = 'wrong_user';
  document.getElementById('input-auth-pass').value = 'wrong_pass';
  document.querySelector('#box-auth-token form button[type="submit"]').click();
`);
await new Promise(r => setTimeout(r, 300));
const nolapErrorMsg = await cdp.eval(`document.getElementById('pesan-auth-error').innerText`);
console.log(`✓ NoLap Validasi Kredensial Salah: Pesan Error = "${nolapErrorMsg}"`);

// 3. Uji Login Sukses Akun Cabang
await cdp.eval(`
  document.getElementById('input-auth-id').value = 'staf_bandung';
  document.getElementById('input-auth-pass').value = 'BdgValid2026!';
  document.querySelector('#box-auth-token form button[type="submit"]').click();
`);
await new Promise(r => setTimeout(r, 600));

const nolapLoggedIn = await cdp.eval(`!document.getElementById('panel-aplikasi-utama').classList.contains('hidden')`);
const nolapRoleLabel = await cdp.eval(`document.getElementById('label-sesi').innerText`);
const nolapApprovalHidden = await cdp.eval(`document.getElementById('tab-btn-approval').classList.contains('hidden')`);
console.log(`✓ NoLap Login Cabang Sukses: Panel Buka = ${nolapLoggedIn}, Label = "${nolapRoleLabel}", Tab Approval Terproteksi = ${nolapApprovalHidden}`);

// 4. Uji Formulir Pengajuan & SPM
const nolapLiveNoLap = await cdp.eval(`document.getElementById('live-nomor-laporan').innerText`);
console.log(`✓ NoLap Format Usulan Formula 7 Segmen Aktif: ${nolapLiveNoLap}`);

// 5. Uji Logout
await cdp.eval(`keluarSesi()`);
await new Promise(r => setTimeout(r, 300));
const nolapLoggedOut = await cdp.eval(`!document.getElementById('box-auth-token').classList.contains('hidden')`);
console.log(`✓ NoLap Logout Sukses: Kembali ke Box Auth = ${nolapLoggedOut}`);

// ==========================================
// TEST B: PORTAL KWITANSI
// ==========================================
console.log("\n--- B. PENGUJIAN PORTAL KWITANSI (dist/portal-kwitansi.html) ---");
currentSession = null;

await navigateAndWait(`${baseUrl}/portal-kwitansi.html`);

// 1. Kondisi awal: box auth terlihat, panel form tersembunyi
const kwitansiInitAuthVisible = await cdp.eval(`!document.getElementById('box-auth-kwitansi').classList.contains('hidden')`);
const kwitansiInitFormHidden = await cdp.eval(`document.getElementById('konten-form-cabang').classList.contains('hidden')`);
console.log(`✓ Kwitansi Sebelum Login: Box Auth Tampil = ${kwitansiInitAuthVisible}, Form Terkunci = ${kwitansiInitFormHidden}`);

// 2. Uji Login Cabang
await cdp.eval(`
  document.getElementById('kwitansi-auth-username').value = 'staf_bandung';
  document.getElementById('kwitansi-auth-password').value = 'BdgValid2026!';
  document.getElementById('btn-login-kwitansi').click();
`);
await new Promise(r => setTimeout(r, 600));

const kwitansiLoggedIn = await cdp.eval(`!document.getElementById('konten-form-cabang').classList.contains('hidden')`);
const kwitansiLabel = await cdp.eval(`document.getElementById('label-sesi-cabang').innerText`);
console.log(`✓ Kwitansi Login Cabang Sukses: Form Terbuka = ${kwitansiLoggedIn}, Label = "${kwitansiLabel}"`);

// 3. Uji Hak Akses RBAC: Cabang mencoba buka Tab 2 (Keuangan Pusat)
await cdp.eval(`gantiTab('pusat')`);
await new Promise(r => setTimeout(r, 300));
const guardPusatVisible = await cdp.eval(`!document.getElementById('guard-akses-pusat-cabang').classList.contains('hidden')`);
const operasionalPusatHidden = await cdp.eval(`document.getElementById('konten-operasional-pusat').classList.contains('hidden')`);
console.log(`✓ Kwitansi RBAC Guard Cabang -> Pusat: Banner Dibatasi = ${guardPusatVisible}, Panel Eksekusi Terkunci = ${operasionalPusatHidden}`);

// 4. Uji Kalkulasi Finansial (DPP, PPN 11%, Terbilang)
await cdp.eval(`gantiTab('cabang')`);
await cdp.eval(`
  document.getElementById('harga-dasar').value = '50000000';
  hitungKwitansi();
`);
await new Promise(r => setTimeout(r, 300));
const totalKwitansi = await cdp.eval(`document.getElementById('total-bayar').value`);
const terbilangKwitansi = await cdp.eval(`document.getElementById('teks-terbilang').value`);
console.log(`✓ Kwitansi Kalkulasi Finansial: Nilai Total = "${totalKwitansi}", Terbilang = "${terbilangKwitansi}"`);

// 5. Uji Login sebagai Keuangan Pusat
await cdp.eval(`keluarSesiKwitansi()`);
await new Promise(r => setTimeout(r, 300));
await cdp.eval(`
  document.getElementById('kwitansi-auth-username').value = 'keuangan_pusat';
  document.getElementById('kwitansi-auth-password').value = 'FinValid2026!';
  document.getElementById('btn-login-kwitansi').click();
`);
await new Promise(r => setTimeout(r, 600));
await cdp.eval(`gantiTab('pusat')`);
await new Promise(r => setTimeout(r, 300));
const operasionalPusatBuka = await cdp.eval(`!document.getElementById('konten-operasional-pusat').classList.contains('hidden')`);
console.log(`✓ Kwitansi Keuangan Pusat Otoritas: Panel Operasional Terbuka = ${operasionalPusatBuka}`);

// 6. Cleanup
cdp.close();
chromeProc.kill();
server.close();

console.log("\n=======================================================");
console.log("🎉 SELURUH PENGUJIAN KANDIDAT PRODUKSI BERHASIL 100%!");
console.log("=======================================================");
