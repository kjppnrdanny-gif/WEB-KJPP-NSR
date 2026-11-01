import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import http from 'node:http';

// Authentic Official Seal for KJPP Nanang Rahayu Sigit Paryanto & Rekan
// Color: Authentic official Indonesian document stamp ink (Deep Indigo-Violet: #1e3a8a / #2e1065 / #272772)
// Center: Official stylized NSR Logo with double contour, Pemimpin Rekan, and KMK RI No. 2.19.0160
// 100% Transparent Alpha background outside circle and in negative spaces

const inkColor = '#1d3557'; // Deep formal stamp ink blue-violet

const svgStamp = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <!-- Top arc: clockwise through the top -->
    <path id="arc-top" d="M 115 300 A 185 185 0 0 1 485 300" fill="none" />
    <!-- Bottom arc: counter-clockwise through bottom so text is upright -->
    <path id="arc-bottom" d="M 115 300 A 185 185 0 0 0 485 300" fill="none" />
    
    <filter id="stamp-ink-texture">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>

  <g filter="url(#stamp-ink-texture)" fill="${inkColor}" stroke="${inkColor}" style="color: ${inkColor};">
    <!-- Outer thick ring -->
    <circle cx="300" cy="300" r="228" fill="none" stroke="${inkColor}" stroke-width="5.5" />
    <!-- Inner thin ring -->
    <circle cx="300" cy="300" r="216" fill="none" stroke="${inkColor}" stroke-width="2" />
    <!-- Core dashed circle -->
    <circle cx="300" cy="300" r="142" fill="none" stroke="${inkColor}" stroke-width="1.8" stroke-dasharray="8 4" />

    <!-- Stars separating top and bottom text -->
    <text x="105" y="307" font-size="20" text-anchor="middle" fill="${inkColor}" stroke="none">★</text>
    <text x="495" y="307" font-size="20" text-anchor="middle" fill="${inkColor}" stroke="none">★</text>

    <!-- Top Text: KANTOR JASA PENILAI PUBLIK -->
    <text font-family="'Arial Black', 'Trebuchet MS', sans-serif" font-size="21.5" font-weight="900" letter-spacing="2.6" fill="${inkColor}" stroke="none">
      <textPath href="#arc-top" startOffset="50%" text-anchor="middle">
        KANTOR JASA PENILAI PUBLIK
      </textPath>
    </text>

    <!-- Bottom Text: NANANG RAHAYU SIGIT PARYANTO & REKAN -->
    <text font-family="'Arial Black', 'Trebuchet MS', sans-serif" font-size="16.5" font-weight="900" letter-spacing="1.8" fill="${inkColor}" stroke="none">
      <textPath href="#arc-bottom" startOffset="50%" text-anchor="middle">
        NANANG RAHAYU SIGIT PARYANTO &amp; REKAN
      </textPath>
    </text>

    <!-- Center Box / Content -->
    <line x1="160" y1="240" x2="440" y2="240" stroke="${inkColor}" stroke-width="2.5" />
    <line x1="160" y1="360" x2="440" y2="360" stroke="${inkColor}" stroke-width="2.5" />

    <!-- Center Upper Text: PEMIMPIN REKAN -->
    <text x="300" y="226" font-family="'Arial', sans-serif" font-size="15" font-weight="bold" text-anchor="middle" fill="${inkColor}" stroke="none" letter-spacing="2">
      ★ PEMIMPIN REKAN ★
    </text>

    <!-- Center Logo NSR: Bold Stylized Logo Typography with Contour -->
    <g transform="translate(195, 252)">
      <!-- Letter N -->
      <path d="M 10 90 L 10 15 L 35 15 L 68 70 L 68 15 L 92 15 L 92 90 L 68 90 L 34 35 L 34 90 Z" fill="${inkColor}" stroke="${inkColor}" stroke-width="1.5" />
      <!-- Letter S -->
      <path d="M 108 72 C 110 82, 120 92, 138 92 C 158 92, 170 82, 170 68 C 170 54, 158 48, 140 44 C 122 40, 112 35, 112 25 C 112 16, 122 10, 136 10 C 150 10, 162 16, 166 26 L 148 34 C 146 28, 142 24, 136 24 C 130 24, 126 27, 126 31 C 126 36, 132 39, 146 43 C 166 48, 178 55, 178 68 C 178 86, 160 98, 138 98 C 118 98, 102 88, 96 74 Z" fill="${inkColor}" stroke="${inkColor}" stroke-width="1.5" />
      <!-- Letter R -->
      <path d="M 188 90 L 188 15 L 222 15 C 238 15, 250 24, 250 38 C 250 48, 242 56, 230 60 L 252 90 L 234 90 L 214 62 L 202 62 L 202 90 Z M 202 48 L 220 48 C 228 48, 234 44, 234 38 C 234 32, 228 28, 220 28 L 202 28 Z" fill="${inkColor}" stroke="${inkColor}" stroke-width="1.5" />
    </g>

    <!-- Center Footer: KMK RI NO. 2.19.0160 -->
    <text x="300" y="388" font-family="'Arial', sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="${inkColor}" stroke="none" letter-spacing="1.2">
      KMK RI NO. 2.19.0160
    </text>
  </g>
</svg>`;

const htmlWrapper = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: transparent !important;
      width: 600px;
      height: 600px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  ${svgStamp}
</body>
</html>`;

const PORT = 8102;
const DEBUG_PORT = 9302;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(htmlWrapper);
});

server.listen(PORT, async () => {
  console.log('Server running on port', PORT);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-sandbox',
    '--window-size=700,700',
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
        const { res, rej } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) rej(msg.error);
        else res(msg.result);
      }
    };

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 600,
      height: 600,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    await send('Page.navigate', { url: `http://localhost:${PORT}` });
    await new Promise(r => setTimeout(r, 1000));

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      omitBackground: true,
      clip: { x: 0, y: 0, width: 600, height: 600, scale: 1 }
    });

    const buffer = Buffer.from(shot.data, 'base64');
    fs.mkdirSync('assets', { recursive: true });
    fs.mkdirSync('dist/assets', { recursive: true });

    fs.writeFileSync('assets/stempel-resmi-kjpp-nsr.png', buffer);
    fs.writeFileSync('dist/assets/stempel-resmi-kjpp-nsr.png', buffer);
    console.log('✓ Successfully rendered authentic official stamp to:');
    console.log('  - assets/stempel-resmi-kjpp-nsr.png');
    console.log('  - dist/assets/stempel-resmi-kjpp-nsr.png');
    console.log('  File size:', buffer.length, 'bytes');

    ws.close();
  } catch (err) {
    console.error('Error generating stamp:', err);
  } finally {
    chrome.kill();
    server.close();
  }
});
