import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const MIME_MAP = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function staticServer(req, res) {
  let pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.normalize(path.join(ROOT_DIR, pathname));
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME_MAP[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

async function inspectCarousel() {
  const server = http.createServer(staticServer);
  await new Promise(r => server.listen(8089, "127.0.0.1", r));

  const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    "--headless=new",
    "--remote-debugging-port=9236",
    "--no-sandbox",
    "about:blank"
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch("http://127.0.0.1:9236/json/new?about:blank", { method: "PUT" });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    class Cdp {
      constructor(w) { this.ws = w; this.id = 1; this.map = new Map(); }
      init() {
        this.ws.onmessage = e => {
          const m = JSON.parse(e.data);
          if (m.method === "Runtime.consoleAPICalled") {
            console.log("Console:", m.params.type, m.params.args.map(a => a.value || a.description).join(" "));
          }
          if (m.id && this.map.has(m.id)) {
            const { res, rej } = this.map.get(m.id);
            this.map.delete(m.id);
            if (m.error) rej(m.error);
            else res(m.result);
          }
        };
      }
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const id = this.id++;
          this.map.set(id, { res, rej });
          this.ws.send(JSON.stringify({ id, method, params }));
        });
      }
    }

    const cdp = new Cdp(ws);
    cdp.init();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    console.log("Navigating to index.html...");
    await cdp.send("Page.navigate", { url: "http://127.0.0.1:8089/index.html" });
    await new Promise(r => setTimeout(r, 3000));

    // Force call runCarouselInit directly
    const runRes = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        if (typeof runCarouselInit === 'function') {
          runCarouselInit();
        }
        const c = document.getElementById('galeri-flex-carousel');
        return {
          hasContainer: Boolean(c),
          containerRect: c ? c.getBoundingClientRect() : null,
          childrenCount: c ? c.children.length : 0,
          canvasCount: c ? c.querySelectorAll('canvas').length : 0,
          innerHtml: c ? c.innerHTML.slice(0, 300) : '',
          hasWindowInitFlexCarousel: typeof window.initFlexCarousel !== 'undefined',
          hasFlexCarouselModule: typeof FlexCarouselModule !== 'undefined',
          hasIndexCarousel: typeof window.indexCarousel !== 'undefined'
        };
      })()`,
      returnByValue: true
    });

    console.log("Carousel DOM Status:", runRes.result.value);

    // Wait 2 seconds for WebGL render
    await new Promise(r => setTimeout(r, 2000));

    const checkCanvas = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const canvas = document.querySelector('#galeri-flex-carousel canvas');
        if (!canvas) return { hasCanvas: false };
        return {
          hasCanvas: true,
          width: canvas.width,
          height: canvas.height,
          style: canvas.getAttribute('style')
        };
      })()`,
      returnByValue: true
    });
    console.log("Canvas status:", checkCanvas.result.value);

    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    server.close();
  }
}

inspectCarousel().catch(console.error);
