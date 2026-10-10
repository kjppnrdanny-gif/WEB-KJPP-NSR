import { spawn } from "node:child_process";

async function test() {
  const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    "--headless=new",
    "--remote-debugging-port=9227",
    "--no-sandbox",
    "about:blank"
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch("http://127.0.0.1:9227/json/new?about:blank", { method: "PUT" });
    const data = await res.json();
    const ws = new WebSocket(data.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    const checkSupport = await new Promise(resolve => {
      ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.id === 1) resolve(msg.result.result.value);
      };
      ws.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression: "MediaRecorder.isTypeSupported('video/webm;codecs=vp8') || MediaRecorder.isTypeSupported('video/webm')",
          returnByValue: true
        }
      }));
    });

    console.log("MediaRecorder webm supported:", checkSupport);
    ws.close();
  } finally {
    chrome.kill("SIGKILL");
  }
}

test().catch(console.error);
