import http from "node:http";
import fs from "node:fs";
import { spawn } from "node:child_process";

// Simple test to record 3 seconds of a canvas animation into a real WebM file
async function testRecord() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<!DOCTYPE html>
<html>
<body>
<canvas id="c" width="400" height="300" style="background:#000"></canvas>
<script>
window.startRec = async function() {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let angle = 0;
  
  function draw() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 400, 300);
    ctx.save();
    ctx.translate(200, 150);
    ctx.rotate(angle);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-50, -50, 100, 100);
    ctx.restore();
    angle += 0.05;
    requestAnimationFrame(draw);
  }
  draw();

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
  const chunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  
  recorder.start();
  await new Promise(r => setTimeout(r, 2000));
  
  return new Promise(resolve => {
    recorder.onstop = async () => {
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
</html>`);
  });

  await new Promise(r => server.listen(8095, "127.0.0.1", r));
  console.log("Test server running at http://127.0.0.1:8095");

  const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    "--headless=new",
    "--remote-debugging-port=9229",
    "--no-sandbox",
    "http://127.0.0.1:8095"
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch("http://127.0.0.1:9229/json");
    const tabs = await res.json();
    const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    const base64Video = await new Promise((resolve, reject) => {
      ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.id === 1) {
          if (msg.result.exceptionDetails) reject(msg.result.exceptionDetails);
          else resolve(msg.result.result.value);
        }
      };
      ws.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression: "window.startRec()",
          awaitPromise: true,
          returnByValue: true
        }
      }));
    });

    const buf = Buffer.from(base64Video, "base64");
    fs.writeFileSync("test_recording.webm", buf);
    console.log("Successfully generated test_recording.webm, size:", buf.length, "bytes");

    ws.close();
  } finally {
    chrome.kill("SIGKILL");
    server.close();
  }
}

testRecord().catch(console.error);
