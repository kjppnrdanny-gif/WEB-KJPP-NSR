import fs from 'fs';

const filePath = 'portal-nolap.html';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ganti placeholder & text deskripsi 7 segmen
const oldPlaceholder = 'placeholder="[Urut]/[Kantor]/[Jasa]/[Bulan]/[Izin]/[Revisi]/[Tahun]"';
const newPlaceholder = 'placeholder="[Urut]/[Kantor]/[Jasa]/[Industri]/[Izin]/[NPWP: 1/0]/[Bulan]/[Tahun]"';
content = content.replace(oldPlaceholder, newPlaceholder);

const oldDesc = '<p class="text-[10px] text-slate-400 mt-1">Struktur: Segmen 1 (Urut 5 Digit) / Segmen 2 (Kode Kantor) / Segmen 3 (Jenis Jasa PI/BS/PP) / Segmen 4 (Bulan Romawi) / Segmen 5 (Izin Penilai) / Segmen 6 (Revisi/Booking) / Segmen 7 (Tahun).</p>';
const newDesc = '<p class="text-[10px] text-slate-400 mt-1">Struktur Baku SE-6/PPPK/2018: Segmen 1 (Urut 5 Digit) / Segmen 2 (Kode Kantor) / Segmen 3 (Jenis Jasa PI/BS/PP) / Segmen 4 (Kode Industri) / Segmen 5 (Izin Penilai) / Segmen 6 (Kode NPWP 1/0) / Segmen 7 (Bulan Romawi/Tahun).</p>';
content = content.replace(oldDesc, newDesc);

// 2. Di dalam function sinkronkanSeqKeNoLap()
const fnMarker = 'function sinkronkanSeqKeNoLap() {';
const fnPos = content.indexOf(fnMarker);
if (fnPos === -1) {
  throw new Error('function sinkronkanSeqKeNoLap() not found');
}

const targetOld = `      const isBooking = Boolean(item.modePengajuan === 'BOOKING' || item.isBooking === true);
      const kodeRevisiBooking = isBooking ? 'B' : '0';

      const inputTgl = document.getElementById('input-manual-tgl-terbit');
      const refDate = inputTgl?.value ? new Date(inputTgl.value) : (item.tglPenilaian ? new Date(item.tglPenilaian) : new Date());
      const bulanRomawi = BULAN_ROMAWI[refDate.getMonth()] || 'X';
      const tahun = refDate.getFullYear() || 2026;
      const strWaktu = \`\${bulanRomawi}/\${tahun}\`;

      // Format 7 Segmen Baku
      const fullNo = \`\${strUrut}/\${kodeKantor}/\${kodeJasa}/\${kodeIndustri}/\${izinPenilai}/\${kodeRevisiBooking}/\${strWaktu}\`;`;

const targetNew = `      // Sesuai SE-6/PPPK/2018: Segmen 6 adalah Kode NPWP Klien, HANYA '0' (Non-NPWP) atau '1' (Ber-NPWP).
      // Dilarang keras menggunakan huruf 'B' atau kode status lain pada segmen NoLap Kemenkeu!
      let kodeNpwp = '0';
      if (item.kodeNpwp === '1' || item.kodeNpwp === 1) {
        kodeNpwp = '1';
      } else if (item.kodeNpwp === '0' || item.kodeNpwp === 0) {
        kodeNpwp = '0';
      } else if (item.npwp && String(item.npwp).trim() !== '' && String(item.npwp).trim() !== '-') {
        const cleanDigits = String(item.npwp).replace(/\\D/g, '');
        kodeNpwp = cleanDigits.length >= 10 ? '1' : '0';
      } else if (item.isPemerintahBumn) {
        kodeNpwp = '1';
      }

      const inputTgl = document.getElementById('input-manual-tgl-terbit');
      const refDate = inputTgl?.value ? new Date(inputTgl.value) : (item.tglPenilaian ? new Date(item.tglPenilaian) : new Date());
      const bulanRomawi = BULAN_ROMAWI[refDate.getMonth()] || 'X';
      const tahun = refDate.getFullYear() || 2026;
      const strWaktu = \`\${bulanRomawi}/\${tahun}\`;

      // Format 7 Segmen Baku Sesuai SE-6/PPPK/2018 (Segmen 6 = NPWP)
      const fullNo = \`\${strUrut}/\${kodeKantor}/\${kodeJasa}/\${kodeIndustri}/\${izinPenilai}/\${kodeNpwp}/\${strWaktu}\`;`;

if (content.includes(targetOld)) {
  content = content.replace(targetOld, targetNew);
  console.log('sinkronkanSeqKeNoLap patched (LF)');
} else if (content.includes(targetOld.replace(/\n/g, '\r\n'))) {
  content = content.replace(targetOld.replace(/\n/g, '\r\n'), targetNew.replace(/\n/g, '\r\n'));
  console.log('sinkronkanSeqKeNoLap patched (CRLF)');
} else {
  throw new Error('targetOld not found in sinkronkanSeqKeNoLap');
}

// 3. Tambahkan validasi penolakan huruf 'B' di validasiManualNoLapInput()
const fnValMarker = 'function validasiManualNoLapInput() {';
const fnValPos = content.indexOf(fnValMarker);
if (fnValPos === -1) {
  throw new Error('function validasiManualNoLapInput() not found');
}

const checkOld = 'if (!inputNoLap) return;';
const checkNew = `if (!inputNoLap) return;

      // Validasi Kepatuhan SE-6/PPPK/2018: Segmen ke-6 HANYA boleh bernilai '0' atau '1' (Kode NPWP Klien)
      // Huruf 'B' atau kode status lain dilarang keras!
      const segs = inputNoLap.split('/');
      if (segs.length >= 7) {
        const seg6 = (segs[5] || '').trim();
        if (seg6 !== '0' && seg6 !== '1') {
          if (warnDuplikat) {
            warnDuplikat.classList.remove('hidden');
            const warnText = document.getElementById('manual-warning-duplikat-text');
            if (warnText) {
              warnText.textContent = \`⛔ KODE SEGMEN KE-6 TIDAK SAH (Input: "\${seg6}"): Berdasarkan SE-6/PPPK/2018, segmen ke-6 adalah Kode NPWP Klien dan HANYA boleh berupa angka '1' (Ber-NPWP) atau '0' (Non-NPWP). Penggunaan huruf 'B' atau kode status booking dilarang keras!\`;
            }
          }
          if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.classList.add('opacity-40', 'cursor-not-allowed');
          }
          return;
        }
      }`;

const searchPos = content.indexOf(checkOld, fnValPos);
if (searchPos !== -1 && searchPos < fnValPos + 300) {
  content = content.slice(0, searchPos) + checkNew + content.slice(searchPos + checkOld.length);
  console.log('validasiManualNoLapInput patched with Segmen 6 NPWP check');
}

// 4. Tambahkan validasi penolakan huruf 'B' di simpanPenerbitanManual()
const fnSimpanMarker = 'async function simpanPenerbitanManual() {';
const fnSimpanPos = content.indexOf(fnSimpanMarker);
if (fnSimpanPos !== -1) {
  const targetAlert = "alert('Harap masukkan Nomor Laporan Resmi.');";
  const posAlert = content.indexOf(targetAlert, fnSimpanPos);
  if (posAlert !== -1 && posAlert < fnSimpanPos + 400) {
    const returnPos = content.indexOf('return;', posAlert) + 'return;'.length;
    const injectSimpan = `

      // Validasi Kepatuhan SE-6/PPPK/2018: Segmen ke-6 HANYA boleh bernilai '0' atau '1'
      const segsSimpan = inputNoLap.split('/');
      if (segsSimpan.length >= 7) {
        const seg6Simpan = (segsSimpan[5] || '').trim();
        if (seg6Simpan !== '0' && seg6Simpan !== '1') {
          alert(\`⛔ PENETAPAN NOMOR DITOLAK!\\n\\nSesuai SE-6/PPPK/2018, segmen ke-6 nomor laporan wajib berupa Kode NPWP Klien: angka '1' (Ber-NPWP) atau angka '0' (Non-NPWP).\\n\\nSegmen ke-6 bernilai "\${seg6Simpan}". Huruf 'B' atau kode status booking tidak diperbolehkan pada nomor resmi Kemenkeu.\\n\\nMode Booking tetap dicatat pada status dan atribut internal tanpa merusak formula penomoran baku.\`);
          return;
        }
      }`;
    content = content.slice(0, returnPos) + injectSimpan + content.slice(returnPos);
    console.log('simpanPenerbitanManual patched with Segmen 6 NPWP check');
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ portal-nolap.html berhasil dipatch!');
