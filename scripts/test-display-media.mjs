import { spawn } from "node:child_process";

async function testDisplayMedia() {
  const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    "--headless=new",
    "--remote-debugging-port=9228",
    "--no-sandbox",
    "--enable-usermedia-screen-capturing",
    "--auto-select-desktop-capture-source=Entire screen",
    "--use-fake-ui-for-media-stream",
    "about:blank"
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch("http://127.0.0.1:9228/json/new?about:blank", { method: "PUT" });
    const data = await res.json();
    const ws = new WebSocket(data.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    const result = await new Promise(resolve => {
      ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg.id === 1) resolve(msg.result.result.value);
      };
      ws.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression: `(async () => {
            try {
              const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
              return stream.getVideoTracks().length > 0;
            } catch (err) {
              return err.message;
            }
          })()`,
          awaitPromise: true,
          returnByValue: true
        }
      }));
    });

    console.log("getDisplayMedia result:", result);
    ws.close();
  } finally {
    chrome.kill("SIGKILL");
  }
}

testDisplayMedia().catch(console.error);
