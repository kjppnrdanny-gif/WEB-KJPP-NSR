import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

function findChrome() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Edge binary not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(new Error(data.error.message));
          else cb.resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async close() {
    if (this.ws) this.ws.close();
  }
}

async function startServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/portal-penugasan-jo.html';
    const filePath = path.join(ROOT_DIR, decodeURIComponent(reqPath));

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  await new Promise(r => server.listen(8789, r));
  return server;
}

async function main() {
  const server = await startServer();
  const chromePath = findChrome();
  const port = 9335;
  const userDataDir = path.join(ROOT_DIR, '.tmp_chrome_kop_test');

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1280,1024',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
    const pages = await listRes.json();
    const wsUrl = pages[0].webSocketDebuggerUrl;

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');

    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8789/portal-penugasan-jo.html' });
    
    // Wait for verifikasiTokenLogin to be ready
    let ready = false;
    for (let i = 0; i < 30; i++) {
      const chk = await cdp.send('Runtime.evaluate', { expression: 'typeof window.verifikasiTokenLogin === "function"', returnByValue: true });
      if (chk.result?.value) { ready = true; break; }
      await new Promise(r => setTimeout(r, 200));
    }

    // Log in with Admin Token and render Dokumen 1
    await cdp.send('Runtime.evaluate', {
      expression: `
        (async function() {
          window.alert = () => {};
          window.confirm = () => true;
          sessionStorage.clear();
          document.getElementById('input_token_auth').value = (process.env.NSR_PUSAT_TOKEN || "NSR_MOCK_PUSAT_TOKEN");
          await verifikasiTokenLogin();
        })()
      `,
      awaitPromise: true
    });
    await new Promise(r => setTimeout(r, 800));

    await cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          pindahTab('preview');
          if (projectDatabase.length > 0) {
            bukaPratinjauProyek(projectDatabase[0].id);
          }
          const sel = document.getElementById('pilih_tampilan_dokumen');
          if (sel) {
            sel.value = 'DOK1';
            gantiTampilanDokumen();
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 1000));

    // Check rendered DOM for Kop Surat & alignment
    const evalRes = await cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const kopImg = document.querySelector('.kop-img-resmi');
          const previewArea = document.getElementById('preview-rendered-area');
          const docPage = document.querySelector('.doc-page');
          const identRow = docPage ? docPage.querySelector('.w-full.flex.justify-between') : null;
          const tabelKlausul = docPage ? docPage.querySelector('.doc-table') : null;
          
          const imgRect = kopImg ? kopImg.getBoundingClientRect() : null;
          const previewRect = previewArea ? previewArea.getBoundingClientRect() : null;
          const docRect = docPage ? docPage.getBoundingClientRect() : null;
          const identRect = identRow ? identRow.getBoundingClientRect() : null;
          const tabelRect = tabelKlausul ? tabelKlausul.getBoundingClientRect() : null;

          return {
            imgNaturalWidth: kopImg ? kopImg.naturalWidth : 0,
            imgNaturalHeight: kopImg ? kopImg.naturalHeight : 0,
            imgWidth: imgRect ? imgRect.width : 0,
            identWidth: identRect ? identRect.width : 0,
            tabelWidth: tabelRect ? tabelRect.width : 0,
            isImgAlignedWithIdent: (imgRect && identRect) ? Math.abs(imgRect.left - identRect.left) < 2 && Math.abs(imgRect.right - identRect.right) < 2 : false,
            isImgAlignedWithTable: (imgRect && tabelRect) ? Math.abs(imgRect.left - tabelRect.left) < 2 && Math.abs(imgRect.right - tabelRect.right) < 2 : false
          };
        })()
      `,
      returnByValue: true
    });

    console.log('DOM Evaluation Result for Dokumen 1:', evalRes.result.value);

    // Capture screenshot of Dokumen 1
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(ARTIFACT_DIR, 'test_dokumen_kop_surat_resmi.png');
    fs.writeFileSync(shotPath, Buffer.from(screenshot.data, 'base64'));
    console.log('✓ Screenshot saved to:', shotPath);

    // Test printToPDF for Dokumen 1
    const pdfResDOK1 = await cdp.send('Page.printToPDF', {
      paperWidth: 8.27, // 210mm in inches
      paperHeight: 11.69, // 297mm in inches
      marginTop: 0.59, // 15mm in inches
      marginBottom: 0.79, // 20mm in inches
      marginLeft: 0.79, // 20mm in inches
      marginRight: 0.79, // 20mm in inches
      printBackground: true
    });
    const pdfPathDOK1 = path.join(ARTIFACT_DIR, 'dokumen1_spk_print_test.pdf');
    fs.writeFileSync(pdfPathDOK1, Buffer.from(pdfResDOK1.data, 'base64'));
    console.log('✓ PDF Dokumen 1 saved to:', pdfPathDOK1, 'size:', pdfResDOK1.data.length);

    // Switch to ALL documents and test printToPDF
    await cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const sel = document.getElementById('pilih_tampilan_dokumen');
          if (sel) {
            sel.value = 'ALL';
            gantiTampilanDokumen();
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const pdfResALL = await cdp.send('Page.printToPDF', {
      paperWidth: 8.27,
      paperHeight: 11.69,
      marginTop: 0.59,
      marginBottom: 0.79,
      marginLeft: 0.79,
      marginRight: 0.79,
      printBackground: true
    });
    const pdfPathALL = path.join(ARTIFACT_DIR, 'dokumen_all_9_bundel_print_test.pdf');
    fs.writeFileSync(pdfPathALL, Buffer.from(pdfResALL.data, 'base64'));
    console.log('✓ PDF Bundel Lengkap (ALL) saved to:', pdfPathALL, 'size:', pdfResALL.data.length);

    await cdp.close();
  } finally {
    chromeProc.kill();
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
