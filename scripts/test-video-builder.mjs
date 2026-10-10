import http from "node:http";
import fs from "node:fs";
import { spawn } from "node:child_process";

const htmlEncoder = `<!DOCTYPE html>
<html>
<body>
<canvas id="c" width="800" height="450" style="background:#0f172a"></canvas>
<script>
window.recordVideoFromImages = async function(base64Images, fps = 5) {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  
  const loadedImgs = [];
  for (const b64 of base64Images) {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = 'data:image/png;base64,' + b64;
    });
    loadedImgs.push(img);
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

  recorder.start();

  const frameDuration = 1000 / fps;
  const totalFrames = base64Images.length * 3; // 3 loops
  
  for (let i = 0; i < totalFrames; i++) {
    const curImg = loadedImgs[i % loadedImgs.length];
    ctx.clearRect(0, 0, 800, 450);
    ctx.drawImage(curImg, 0, 0, 800, 450);
    await new Promise(r => setTimeout(r, frameDuration));
  }

  return new Promise(resolve => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    };
    recorder.stop();
  });
};
</script>
</body>
</html>`;

async function main() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(htmlEncoder);
  });
  await new Promise(r => server.listen(8092, "127.0.0.1", r));

  const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    "--headless=new",
    "--remote-debugging-port=9233",
    "--no-sandbox",
    "about:blank"
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const targetRes = await fetch("http://127.0.0.1:9233/json/new?about:blank", { method: "PUT" });
    const targetData = await targetRes.json();
    const ws = new WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    class Cdp {
      constructor(w) { this.ws = w; this.id = 1; this.map = new Map(); }
      init() {
        this.ws.onmessage = e => {
          const m = JSON.parse(e.data);
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
    await cdp.send("Page.navigate", { url: "http://127.0.0.1:8092/" });
    await new Promise(r => setTimeout(r, 1500));

    // Read 5 NSR Cloud frames
    const frameB64s = [];
    for (let f = 1; f <= 5; f++) {
      const p = `screenshots/nsr_cloud_anim_frame${f}.png`;
      if (fs.existsSync(p)) {
        frameB64s.push(fs.readFileSync(p).toString("base64"));
      }
    }
    console.log("Frames count:", frameB64s.length);

    console.log("Encoding video in Chrome MediaRecorder...");
    const evalRes = await cdp.send("Runtime.evaluate", {
      expression: `window.recordVideoFromImages(${JSON.stringify(frameB64s)}, 4)`,
      awaitPromise: true,
      returnByValue: true
    });

    const videoBuf = Buffer.from(evalRes.result.value, "base64");
    fs.writeFileSync("test_nsr_cloud.webm", videoBuf);
    console.log("🎉 SUCCESS! Video generated: test_nsr_cloud.webm, size:", videoBuf.length, "bytes!");

    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    server.close();
  }
}

main().catch(console.error);
