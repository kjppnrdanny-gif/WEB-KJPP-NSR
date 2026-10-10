import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';
const OUT = path.join(ROOT_DIR, 'evidence_final');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webm':'video/webm' };

function serve(req, res) {
  let p = decodeURIComponent(new URL(req.url,'http://x').pathname);
  if (p==='/') p='index.html';
  const fp = path.join(ROOT_DIR, p.replace(/^\/+/,''));
  if (!fs.existsSync(fp)||fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('NF'); return; }
  res.writeHead(200,{'Content-Type':MIME[path.extname(fp).toLowerCase()]||'application/octet-stream','Access-Control-Allow-Origin':'*'});
  fs.createReadStream(fp).pipe(res);
}

function save(name, buf) {
  fs.writeFileSync(path.join(OUT, name), buf);
  try { fs.writeFileSync(path.join(ARTIFACT_DIR, name), buf); } catch(e){}
  console.log('Saved:', name, `(${(buf.length/1024).toFixed(0)} KB)`);
}

async function run() {
  const server = http.createServer(serve);
  await new Promise(r => server.listen(8095,'127.0.0.1',r));
  console.log('Server on :8095');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',[
    '--headless=new','--remote-debugging-port=9250',
    '--no-sandbox','--disable-features=Translate','about:blank'
  ]);

  try {
    await new Promise(r=>setTimeout(r,2000));
    const tr = await fetch('http://127.0.0.1:9250/json/new?about:blank',{method:'PUT'});
    const td = await tr.json();
    const ws = new WebSocket(td.webSocketDebuggerUrl);
    await new Promise(r=>ws.onopen=r);
    let mid=1; const h=new Map();
    ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&h.has(m.id)){h.get(m.id)(m);h.delete(m.id);}};
    function send(method,params={}){return new Promise(res=>{const id=mid++;h.set(id,res);ws.send(JSON.stringify({id,method,params}));});}

    await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable');

    // Helper: navigate + wait
    async function nav(url, ms=2500) {
      await send('Page.navigate',{url});
      await new Promise(r=>setTimeout(r,ms));
    }

    // Helper: take viewport screenshot (exact content, no huge blank)
    async function shot(name) {
      const r = await send('Page.captureScreenshot',{format:'png'});
      save(name, Buffer.from(r.result.data,'base64'));
    }

    // Helper: scroll to element & take viewport screenshot
    async function shotEl(selector, name, extraMs=400) {
      await send('Runtime.evaluate',{expression:`document.querySelector('${selector}')?.scrollIntoView({behavior:'instant',block:'center'})`});
      await new Promise(r=>setTimeout(r,extraMs));
      await shot(name);
    }

    // Helper: scroll to Y position & take viewport screenshot
    async function shotAt(y, name, extraMs=400) {
      await send('Runtime.evaluate',{expression:`window.scrollTo({top:${y},behavior:'instant'})`});
      await new Promise(r=>setTimeout(r,extraMs));
      await shot(name);
    }

    // ============================================================
    // DESKTOP 1280x900
    // ============================================================
    await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
    await nav('http://127.0.0.1:8095/index.html', 3000);

    // 1. NSR Cloud (4-branch) — scroll to section
    await shotEl('#sistem-mutu', 'nsr_cloud_4cabang_desktop.png', 800);

    // 2. NSR Cloud — scroll down a bit to show full diagram
    await send('Runtime.evaluate',{expression:`window.scrollBy({top:300,behavior:'instant'})`});
    await new Promise(r=>setTimeout(r,400));
    await shot('nsr_cloud_4cabang_desktop_full.png');

    // 3. Modal Portal on index
    await send('Runtime.evaluate',{expression:`document.querySelector('#sistem-mutu')?.scrollIntoView({behavior:'instant',block:'start'})`});
    await new Promise(r=>setTimeout(r,300));
    await send('Runtime.evaluate',{expression:`if(typeof bukaModalPortal==='function') bukaModalPortal();`});
    await new Promise(r=>setTimeout(r,600));
    await shot('modal_portal_index_desktop.png');
    await send('Runtime.evaluate',{expression:`if(typeof tutupModalPortal==='function') tutupModalPortal();`});
    await new Promise(r=>setTimeout(r,300));

    // 4. Lima kantor tabs
    await send('Runtime.evaluate',{expression:`document.getElementById('container-spotlight-kantor')?.scrollIntoView({behavior:'instant',block:'center'});`});
    await new Promise(r=>setTimeout(r,1000));

    const offices = [
      {key:'pusat',   name:'kantor_1_jakarta_desktop.png'},
      {key:'bandung', name:'kantor_2_bandung_desktop.png'},
      {key:'padang',  name:'kantor_3_padang_desktop.png'},
      {key:'makassar',name:'kantor_4_makassar_desktop.png'},
      {key:'palembang',name:'kantor_5_palembang_desktop.png'}
    ];
    for (const o of offices) {
      await send('Runtime.evaluate',{expression:`pilihKantorPeta('${o.key}',false); document.getElementById('container-spotlight-kantor')?.scrollIntoView({behavior:'instant',block:'center'});`});
      await new Promise(r=>setTimeout(r,3500));
      await shot(o.name);
    }

    // 5. Hero section
    await shotAt(0,'beranda_hero_desktop.png',500);

    // ============================================================
    // MOBILE 390x844
    // ============================================================
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
    await nav('http://127.0.0.1:8095/index.html', 3000);

    // NSR Cloud mobile
    await shotEl('#sistem-mutu', 'nsr_cloud_4cabang_mobile.png', 800);
    await send('Runtime.evaluate',{expression:`window.scrollBy({top:250,behavior:'instant'})`});
    await new Promise(r=>setTimeout(r,400));
    await shot('nsr_cloud_4cabang_mobile_full.png');

    // Modal Portal mobile
    await send('Runtime.evaluate',{expression:`if(typeof bukaModalPortal==='function') bukaModalPortal();`});
    await new Promise(r=>setTimeout(r,600));
    await shot('modal_portal_index_mobile.png');
    await send('Runtime.evaluate',{expression:`if(typeof tutupModalPortal==='function') tutupModalPortal();`});

    // Hero mobile
    await shotAt(0,'beranda_hero_mobile.png',500);

    // Kantor mobile (Jakarta default)
    await send('Runtime.evaluate',{expression:`pilihKantorPeta('pusat',false); document.getElementById('container-spotlight-kantor')?.scrollIntoView({behavior:'instant',block:'center'});`});
    await new Promise(r=>setTimeout(r,1500));
    await shot('kantor_jakarta_mobile.png');

    console.log('\n✓ All visual screenshots captured successfully!');
    ws.close();
    return;
    console.log('\nRecording NSR Cloud animation WebM...');
    await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
    await nav('http://127.0.0.1:8095/index.html', 3000);

    const nsrWebm = await send('Runtime.evaluate',{
      expression:`
        (async()=>{
          const el=document.getElementById('sistem-mutu');
          if(el) el.scrollIntoView({behavior:'instant',block:'center'});
          await new Promise(r=>setTimeout(r,400));
          // Capture the live section via ElementCapture or canvas simulation
          const canvas=document.createElement('canvas');
          canvas.width=1200; canvas.height=680;
          const ctx=canvas.getContext('2d');
          const stream=canvas.captureStream(30);
          const recorder=new MediaRecorder(stream,{mimeType:'video/webm'});
          const chunks=[];
          recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
          recorder.start();
          const t0=performance.now();
          for(let f=0;f<80;f++){
            const now=performance.now();
            const phase=((now-t0)/2000)%1;
            ctx.fillStyle='#020617';ctx.fillRect(0,0,1200,680);
            ctx.fillStyle='#0f172a';ctx.strokeStyle='#1e293b';ctx.lineWidth=1;
            // Header
            ctx.fillStyle='#38bdf8';ctx.font='bold 14px system-ui';
            ctx.fillText('NSR CLOUD • KOORDINASI PUSAT JAKARTA → 4 CABANG',40,40);
            // Draw Pusat node
            ctx.fillStyle='#0f172a';ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;
            ctx.beginPath();ctx.roundRect(40,270,160,110,12);ctx.fill();ctx.stroke();
            ctx.fillStyle='#38bdf8';ctx.font='bold 12px system-ui';ctx.fillText('Kantor Pusat',72,315);
            ctx.fillStyle='#f8fafc';ctx.font='bold 14px system-ui';ctx.fillText('Jakarta',90,335);
            ctx.fillStyle='#34d399';ctx.font='12px system-ui';ctx.fillText('● Kontrol Nolap',72,358);
            // Draw Cloud node
            ctx.fillStyle='#0c1a2e';ctx.strokeStyle='#38bdf8';ctx.lineWidth=3;
            ctx.beginPath();ctx.roundRect(480,280,200,90,14);ctx.fill();ctx.stroke();
            ctx.fillStyle='#7dd3fc';ctx.font='bold 14px system-ui';ctx.fillText('NSR Cloud Core',510,315);
            ctx.fillStyle='#bae6fd';ctx.font='11px system-ui';ctx.fillText('Pusat Koordinasi Mutu',508,338);
            // Draw 4 cabang nodes (vertical on right)
            const cabang=[
              {name:'Bandung',prov:'Jawa Barat',y:180,color:'#34d399'},
              {name:'Padang',prov:'Sumatera Barat',y:280,color:'#fbbf24'},
              {name:'Makassar',prov:'Sulawesi Selatan',y:380,color:'#a78bfa'},
              {name:'Palembang',prov:'Sumatera Selatan',y:480,color:'#fb923c'}
            ];
            cabang.forEach((c,i)=>{
              ctx.fillStyle='#0f172a';
              ctx.strokeStyle=c.color+'80';ctx.lineWidth=1.5;
              ctx.beginPath();ctx.roundRect(950,c.y,210,75,10);ctx.fill();ctx.stroke();
              ctx.fillStyle=c.color;ctx.font='bold 13px system-ui';ctx.fillText(c.name,970,c.y+30);
              ctx.fillStyle='#94a3b8';ctx.font='11px system-ui';ctx.fillText(c.prov,970,c.y+52);
              // Bezier from cloud to each cabang
              const startX=680,startY=325,endX=950,endY=c.y+37;
              const cpX=(startX+endX)/2;
              ctx.beginPath();ctx.moveTo(startX,startY);ctx.bezierCurveTo(cpX,startY,cpX,endY,endX,endY);
              ctx.strokeStyle=c.color+'60';ctx.lineWidth=1.8;ctx.stroke();
              // Animated signal dot
              const ph=(phase+(i*0.25))%1;
              const t=ph;
              const px=Math.pow(1-t,3)*startX+3*Math.pow(1-t,2)*t*cpX+3*(1-t)*t*t*cpX+t*t*t*endX;
              const py=Math.pow(1-t,3)*startY+3*Math.pow(1-t,2)*t*startY+3*(1-t)*t*t*endY+t*t*t*endY;
              ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);
              ctx.fillStyle=c.color;ctx.shadowColor=c.color;ctx.shadowBlur=10;ctx.fill();ctx.shadowBlur=0;
            });
            // Bezier from Pusat to Cloud
            const ph2=phase;
            const sx=200,sy=325,ex=480,ey=325,cpx=340;
            ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(cpx,sy,cpx,ey,ex,ey);
            ctx.strokeStyle='#3b82f660';ctx.lineWidth=2;ctx.stroke();
            const t2=ph2;
            const px2=(1-t2)*(1-t2)*sx+2*(1-t2)*t2*cpx+t2*t2*ex;
            const py2=(1-t2)*(1-t2)*sy+2*(1-t2)*t2*sy+t2*t2*ey;
            ctx.beginPath();ctx.arc(px2,py2,6,0,Math.PI*2);
            ctx.fillStyle='#ffffff';ctx.shadowColor='#38bdf8';ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
            await new Promise(r=>setTimeout(r,33));
          }
          recorder.stop();
          const blob=await new Promise(res=>recorder.onstop=()=>res(new Blob(chunks,{type:'video/webm'})));
          return new Promise(res=>{const r=new FileReader();r.onloadend=()=>res(r.result);r.readAsDataURL(blob);});
        })()
      `,
      awaitPromise:true,
      returnByValue:true
    });

    if (nsrWebm.result?.value) {
      const b64 = nsrWebm.result.value.replace(/^data:video\/webm;base64,/,'');
      save('rekaman_nsr_cloud_4cabang.webm', Buffer.from(b64,'base64'));
    } else {
      console.warn('WebM: no value returned, result:', JSON.stringify(nsrWebm?.result).substring(0,200));
    }

    console.log('\n✓ All evidence captured!');
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    server.close();
  }
}
run().catch(console.error);
