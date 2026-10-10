import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = 'd:\\WEB KJPP NSR_Compro new ver\\kjpp-nsr-netlify-production';
const OUT = path.join(ROOT,'evidence_final');
const ART = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\5aa9abf1-bae3-4edf-b938-adfbb1b9bf9d';

const MIME = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.mjs':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  let p = decodeURIComponent(new URL(req.url,'http://x').pathname);
  if(p==='/') p='index.html';
  const fp = path.join(ROOT, p.replace(/^\/+/,''));
  if(!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){res.writeHead(404);res.end('NF');return;}
  res.writeHead(200,{'Content-Type':MIME[path.extname(fp).toLowerCase()]||'application/octet-stream','Access-Control-Allow-Origin':'*'});
  fs.createReadStream(fp).pipe(res);
});

await new Promise(r => server.listen(8096,'127.0.0.1',r));
console.log('Server on 8096');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ['--headless=new','--remote-debugging-port=9251','--no-sandbox','about:blank']);

try {
  await new Promise(r=>setTimeout(r,2000));
  const tr = await fetch('http://127.0.0.1:9251/json/new?about:blank',{method:'PUT'});
  const td = await tr.json();
  const ws = new WebSocket(td.webSocketDebuggerUrl);
  await new Promise(r=>ws.onopen=r);
  let mid=1; const h=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&h.has(m.id)){h.get(m.id)(m);h.delete(m.id);}};
  const send=(method,params={})=>new Promise(res=>{const id=mid++;h.set(id,res);ws.send(JSON.stringify({id,method,params}));});
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:8096/index.html'});
  await new Promise(r=>setTimeout(r,3000));
  console.log('Recording WebM NSR Cloud 4-branch...');

  const jsCode = `
(async()=>{
  const el=document.getElementById('sistem-mutu');
  if(el) el.scrollIntoView({behavior:'instant',block:'center'});
  await new Promise(r=>setTimeout(r,500));
  const canvas=document.createElement('canvas');
  canvas.width=1200; canvas.height=680;
  const ctx=canvas.getContext('2d');
  const stream=canvas.captureStream(30);
  const recorder=new MediaRecorder(stream,{mimeType:'video/webm'});
  const chunks=[];
  recorder.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data);};
  recorder.start(100);
  const t0=performance.now();
  for(let f=0;f<90;f++){
    const now=performance.now();
    const phase=((now-t0)/2500)%1;
    ctx.fillStyle='#020617';ctx.fillRect(0,0,1200,680);
    ctx.fillStyle='#38bdf8';ctx.font='bold 15px system-ui';
    ctx.fillText('NSR CLOUD ● KOORDINASI PUSAT JAKARTA DAN 4 CABANG',30,38);
    ctx.fillStyle='#0f172a';ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(30,250,165,115,12);ctx.fill();ctx.stroke();
    ctx.fillStyle='#38bdf8';ctx.font='bold 13px system-ui';ctx.fillText('Kantor Pusat',55,290);
    ctx.fillStyle='#ffffff';ctx.font='bold 15px system-ui';ctx.fillText('Jakarta',75,312);
    ctx.fillStyle='#34d399';ctx.font='12px system-ui';ctx.fillText('Kontrol Nolap',55,338);
    ctx.fillStyle='#0c1a2e';ctx.strokeStyle='#38bdf8';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(460,270,200,95,14);ctx.fill();ctx.stroke();
    ctx.fillStyle='#7dd3fc';ctx.font='bold 14px system-ui';ctx.fillText('NSR Cloud Core',478,308);
    ctx.fillStyle='#bae6fd';ctx.font='11px system-ui';ctx.fillText('Pusat Koordinasi Mutu',476,330);
    const cabang=[
      {name:'Bandung',prov:'Jawa Barat',y:160,color:'#34d399'},
      {name:'Padang',prov:'Sumatera Barat',y:265,color:'#fbbf24'},
      {name:'Makassar',prov:'Sulawesi Selatan',y:370,color:'#a78bfa'},
      {name:'Palembang',prov:'Sumatera Selatan',y:475,color:'#fb923c'}
    ];
    for(let i=0;i<cabang.length;i++){
      var c=cabang[i];
      ctx.fillStyle='#0f172a';ctx.strokeStyle=c.color;ctx.lineWidth=1.5;
      ctx.beginPath();ctx.roundRect(940,c.y,230,80,10);ctx.fill();ctx.stroke();
      ctx.fillStyle=c.color;ctx.font='bold 14px system-ui';ctx.fillText(c.name,960,c.y+32);
      ctx.fillStyle='#94a3b8';ctx.font='11px system-ui';ctx.fillText(c.prov,960,c.y+52);
      var sx=660,sy=317,ex=940,ey=c.y+40,cpx1=800,cpy1=sy,cpx2=800,cpy2=ey;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(cpx1,cpy1,cpx2,cpy2,ex,ey);
      ctx.strokeStyle=c.color;ctx.lineWidth=1.5;ctx.globalAlpha=0.4;ctx.stroke();ctx.globalAlpha=1;
      var ph=(phase+(i*0.25))%1;
      var t=ph;
      var px=Math.pow(1-t,3)*sx+3*Math.pow(1-t,2)*t*cpx1+3*(1-t)*t*t*cpx2+t*t*t*ex;
      var py=Math.pow(1-t,3)*sy+3*Math.pow(1-t,2)*t*cpy1+3*(1-t)*t*t*cpy2+t*t*t*ey;
      ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);
      ctx.fillStyle=c.color;ctx.shadowColor=c.color;ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
    }
    var ph2=phase,sx2=195,sy2=317,ex2=460,ey2=317,cp2=330;
    ctx.beginPath();ctx.moveTo(sx2,sy2);ctx.bezierCurveTo(cp2,sy2,cp2,ey2,ex2,ey2);
    ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.globalAlpha=0.5;ctx.stroke();ctx.globalAlpha=1;
    var t2=ph2,px2=(1-t2)*(1-t2)*sx2+2*(1-t2)*t2*cp2+t2*t2*ex2;
    ctx.beginPath();ctx.arc(px2,sy2,6,0,Math.PI*2);
    ctx.fillStyle='#ffffff';ctx.shadowColor='#38bdf8';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
    await new Promise(r=>setTimeout(r,33));
  }
  recorder.stop();
  var blob=await new Promise(function(res){recorder.onstop=function(){res(new Blob(chunks,{type:'video/webm'}));};});
  return new Promise(function(res){var r=new FileReader();r.onloadend=function(){res(r.result);};r.readAsDataURL(blob);});
})()`;

  const res2 = await send('Runtime.evaluate',{expression: jsCode, awaitPromise:true, returnByValue:true});
  const val = res2?.result?.result?.value || res2?.result?.value;
  if(val && typeof val === 'string' && val.includes('video/webm')) {
    const b64 = val.replace(/^data:video\/webm;base64,/,'');
    const buf = Buffer.from(b64,'base64');
    fs.writeFileSync(path.join(OUT,'rekaman_nsr_cloud_4cabang.webm'), buf);
    try { fs.writeFileSync(path.join(ART,'rekaman_nsr_cloud_4cabang.webm'), buf); } catch(e){}
    console.log('WebM saved:', (buf.length/1024).toFixed(0),'KB');
  } else {
    console.log('WebM result error, full response:', JSON.stringify(res2).substring(0, 300));
  }
  ws.close();
} finally {
  chrome.kill('SIGKILL');
  server.close();
}
