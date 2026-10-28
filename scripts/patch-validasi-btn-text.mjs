import fs from 'fs';

let content = fs.readFileSync('portal-nolap.html', 'utf8');

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

const target = toCrlf(`          btn.className = "px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20 cursor-pointer";
          btn.innerHTML = 'Ajukan Nomor Laporan Sekarang &rarr;';`);

const replacement = toCrlf(`          btn.className = "px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-xl shadow-teal-500/20 cursor-pointer flex items-center gap-2";
          btn.innerHTML = '<span>🚀</span><span>Ajukan Verifikasi ke Kepala SPM &rarr;</span>';`);

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('portal-nolap.html', content, 'utf8');
  console.log('✔ Button text updated in validasiFormDanMitigasiLive.');
} else {
  console.error('✘ target not found!');
}
