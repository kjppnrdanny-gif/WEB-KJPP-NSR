import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.resolve();
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const server = http.createServer((req, res) => {
  const fp = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  if (fs.existsSync(fp) && !fs.statSync(fp).isDirectory()) {
    res.writeHead(200);
    fs.createReadStream(fp).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port;
  const cdpPort = 9876;
  const chrome = spawn(CHROME_PATH, ["--headless=new", "--remote-debugging-port=" + cdpPort, "--disable-gpu"], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 1000));
  const res = await fetch("http://127.0.0.1:" + cdpPort + "/json/new?about:blank", { method: "PUT" });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1;
  function send(method, params = {}) {
    return new Promise((r) => {
      const mid = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === mid) {
          ws.removeEventListener("message", handler);
          r(d.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  }
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: "http://127.0.0.1:" + port + "/index.html" });
  await new Promise((r) => setTimeout(r, 2500));
  const info = await send("Runtime.evaluate", {
    expression: `(() => {
      const el = document.querySelector("#profil [data-aos]");
      return JSON.stringify({
        hasH1: !!document.querySelector("#profil h1"),
        h1Text: document.querySelector("#profil h1")?.innerText,
        elOpacity: el ? window.getComputedStyle(el).opacity : null,
        elTransform: el ? window.getComputedStyle(el).transform : null,
        classes: el?.className,
        rect: el?.getBoundingClientRect()
      });
    })()`,
    returnByValue: true
  });
  console.log("DOM INFO:", info.result.value);
  ws.close();
  chrome.kill();
  server.close();
});
