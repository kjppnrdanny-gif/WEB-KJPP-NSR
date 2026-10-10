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

async function testScreencast() {
  const server = http.createServer(staticServer);
  await new Promise(r => server.listen(8094, "127.0.0.1", r));

  const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    "--headless=new",
    "--remote-debugging-port=9231",
    "--no-sandbox",
    "http://127.0.0.1:8094/index.html"
  ]);

  try {
    await new Promise(r => setTimeout(r, 2500));
    const res = await fetch("http://127.0.0.1:9231/json");
    const tabs = await res.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let frameCount = 0;
    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.method === "Page.screencastFrame") {
        frameCount++;
        ws.send(JSON.stringify({
          method: "Page.screencastFrameAck",
          params: { sessionId: msg.params.sessionId }
        }));
      }
    };

    ws.send(JSON.stringify({ id: 1, method: "Page.enable" }));
    ws.send(JSON.stringify({
      id: 2,
      method: "Page.startScreencast",
      params: { format: "jpeg", quality: 80, everyNthFrame: 1 }
    }));

    await new Promise(r => setTimeout(r, 3000));
    console.log("Frames captured via screencast in 3 seconds:", frameCount);

    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    server.close();
  }
}

testScreencast().catch(console.error);
