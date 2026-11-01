import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DEBUG_PORT = 9315;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const inputImgPath = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d/.user_uploaded/media_1793555286306_0377ff29.png';
const ARTIFACT_DIR = 'C:/Users/HP/.gemini/antigravity/brain/5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

async function main() {
  const imgBuffer = fs.readFileSync(inputImgPath);
  const base64Data = imgBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64Data}`;

  const userDataDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d\\.tmp_chrome_proc_stamp';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' });
    const targetData = await targetRes.json();
    const ws = new globalThis.WebSocket(targetData.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const callbacks = new Map();
    const send = (method, params = {}) => new Promise((res, rej) => {
      const msgId = id++;
      callbacks.set(msgId, { res, rej });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const { res } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        res(msg.result);
      }
    };

    await send('Runtime.enable');

    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const img = new Image();
          img.src = "${dataUri}";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          // Center of the stamp
          const cx = w / 2;
          const cy = h / 2;

          // Find the outer circular ring limit.
          // In the image, the outer circle text has radius up to around 132-135px.
          // Let's filter out noise outside the radius, and clean white/near-white pixels.
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4;
              let r = data[idx];
              let g = data[idx+1];
              let b = data[idx+2];
              let a = data[idx+3];

              // Remove isolated speckles (scanner dust)
              if (x > 194 && x < 206 && y > 35 && y < 50) {
                data[idx+3] = 0;
                continue;
              }
              if (x > 237 && x < 246 && y > 168 && y < 180) {
                data[idx+3] = 0;
                continue;
              }

              // Remove low-alpha ghosting / noise
              if (a < 12) {
                data[idx+3] = 0;
                continue;
              }

              // Background transparency:
              // Ink in this stamp is either RED (high R, low G, low B) or BLUE (high B, low R, low G).
              // Background is white / off-white / light grey.
              const minVal = Math.min(r, g, b);
              const maxVal = Math.max(r, g, b);
              const saturation = maxVal > 0 ? (maxVal - minVal) / maxVal : 0;

              // Any pixel that is white / light-grey (saturation < 0.16 and minVal > 185)
              if (saturation < 0.16 && minVal > 185) {
                data[idx+3] = 0;
                continue;
              }

              // For anti-aliased edge pixels that are mostly background
              if (saturation < 0.22 && minVal > 210) {
                data[idx+3] = 0;
                continue;
              }

              // True ink enhancement
              if (a > 50) {
                data[idx+3] = Math.min(255, Math.round(a * 1.15));
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);

          return {
            width: w,
            height: h,
            dataUrl: canvas.toDataURL('image/png')
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    const result = evalRes.result.value;
    const base64Out = result.dataUrl.replace(/^data:image\/png;base64,/, '');
    const outBuffer = Buffer.from(base64Out, 'base64');

    const target1 = path.join(process.cwd(), 'assets/stempel-resmi-kjpp-nsr.png');
    const target2 = path.join(process.cwd(), 'dist/assets/stempel-resmi-kjpp-nsr.png');
    const targetArtifact = path.join(ARTIFACT_DIR, 'stempel_asli_transparan_preview.png');

    fs.writeFileSync(target1, outBuffer);
    console.log(`Saved to ${target1} (${outBuffer.length} bytes)`);

    if (fs.existsSync(path.dirname(target2))) {
      fs.writeFileSync(target2, outBuffer);
      console.log(`Saved to ${target2} (${outBuffer.length} bytes)`);
    }

    fs.writeFileSync(targetArtifact, outBuffer);
    console.log(`Saved to ${targetArtifact}`);

    await send('Browser.close');
  } finally {
    try { chrome.kill(); } catch (e) {}
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
