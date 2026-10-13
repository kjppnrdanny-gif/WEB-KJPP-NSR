// scripts/update-pdp-compliance.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const rfpNoticeBlock = `        <!-- PEMBERITAHUAN PRIVASI & PERSETUJUAN PEMROSESAN DATA (UU PDP NO. 27/2022) -->
        <div class="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5 text-left">
          <p class="text-[11px] text-slate-300 leading-relaxed">
            Data dan dokumen yang Anda sampaikan melalui Form Permohonan RFP akan diproses oleh KJPP NSR untuk memeriksa permohonan, mengidentifikasi kebutuhan penugasan, melakukan komunikasi, dan menyiapkan tanggapan atau penawaran jasa profesional.
          </p>
          <p class="text-[10.5px] text-slate-400">
            Informasi lebih lanjut mengenai jenis data, dasar pemrosesan, penggunaan, penyimpanan, pengamanan, dan hak Anda tersedia dalam <button type="button" onclick="bukaModalPrivasi()" class="text-sky-400 underline font-semibold hover:text-sky-300">Kebijakan Privasi dan Perlindungan Data Klien</button>.
          </p>
          
          <div class="space-y-2 pt-1.5 border-t border-slate-800">
            <div class="flex items-start gap-2.5">
              <input type="checkbox" id="rfp-consent-notice" required class="mt-0.5 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 shrink-0">
              <label for="rfp-consent-notice" class="text-[11px] text-slate-300 leading-snug cursor-pointer">
                Saya telah membaca dan memahami <button type="button" onclick="bukaModalPrivasi()" class="text-sky-400 underline font-semibold hover:text-sky-300">Kebijakan Privasi dan Perlindungan Data Klien</button>.
              </label>
            </div>
            
            <div class="flex items-start gap-2.5">
              <input type="checkbox" id="rfp-consent-process" required class="mt-0.5 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 shrink-0">
              <label for="rfp-consent-process" class="text-[11px] text-slate-300 leading-snug cursor-pointer">
                Saya secara sadar dan sukarela memberikan persetujuan kepada KJPP NSR untuk memproses data pribadi yang saya sampaikan bagi tujuan yang telah dijelaskan dalam pemberitahuan privasi.
              </label>
            </div>
          </div>
        </div>

        <div class="pt-1">
          <button type="submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2">
            <span>Kirim Permohonan via WhatsApp Resmi KJPP NSR</span>
            <span>&rarr;</span>
          </button>
        </div>

        <p class="text-[10px] text-slate-400 text-center leading-relaxed">
          Catatan: Pengiriman permohonan RFP tidak otomatis membentuk hubungan penugasan profesional atau perjanjian jasa penilaian. Hubungan penugasan resmi wajib dituangkan dalam Surat Perintah Kerja (SPK) / Kontrak Penugasan yang disepakati para pihak.
        </p>`;

const newFooterLinksHtml = `<div class="flex flex-wrap items-center gap-3">
          <button type="button" onclick="bukaModalPrivasi()" class="hover:text-amber-400 transition cursor-pointer">Kebijakan Privasi</button>
          <span>&bull;</span>
          <button type="button" onclick="bukaModalDisclaimer()" class="hover:text-amber-400 transition cursor-pointer">Disclaimer Profesi</button>
          <span>&bull;</span>
          <button onclick="bukaModalPortal()" class="text-amber-400 hover:underline cursor-pointer">Portal Internal</button>
          <span>&bull;</span>
          <a href="Company%20Profile%20KJPP%20NSR%202026_S.pdf" download class="hover:text-white">Download Company Profile</a>
        </div>`;

const targetPages = [
  'portofolio-rekanan.html',
  'profil-legalitas.html',
  'tim-cabang.html',
  'wawasan-regulasi.html'
];

targetPages.forEach(filename => {
  const filePath = path.join(ROOT_DIR, filename);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace RFP checkbox block
  const oldConsentRegex = /<div class="flex items-start gap-2\.5 bg-slate-950\/80 border border-slate-700\/80 rounded-xl p-3">[\s\S]*?<\/div>[\s\S]*?<div class="pt-1">[\s\S]*?<\/button>[\s\S]*?<\/div>/;
  if (oldConsentRegex.test(content)) {
    content = content.replace(oldConsentRegex, rfpNoticeBlock);
    console.log(`[${filename}] Replaced RFP consent block with PDP block.`);
  }

  // 2. Update kirimWhatsAppRFP validation
  if (content.includes('function kirimWhatsAppRFP(e) {') && !content.includes('rfp-consent-notice')) {
    const fnTarget = 'const nama = document.getElementById(\'rfp-nama\')?.value || \'\';';
    const validationCode = `const noticeChk = document.getElementById('rfp-consent-notice');
      const processChk = document.getElementById('rfp-consent-process');
      if (!noticeChk || !noticeChk.checked || !processChk || !processChk.checked) {
        alert('Harap beri tanda centang pada kedua konfirmasi kepatuhan privasi dan persetujuan pemrosesan data pribadi.');
        return;
      }

      if (typeof window.rekamPersetujuanPDP === 'function') {
        window.rekamPersetujuanPDP({
          form_type: 'RFP',
          consent_notice: true,
          consent_processing: true,
          nama: document.getElementById('rfp-nama')?.value || '',
          kontak: document.getElementById('rfp-wa')?.value || '',
          instansi: '-',
          purpose: 'Permohonan Penawaran Biaya (RFP Online)'
        });
      }

      const nama = document.getElementById('rfp-nama')?.value || '';`;
    content = content.replace(fnTarget, validationCode);
    console.log(`[${filename}] Updated kirimWhatsAppRFP with PDP validation & logging.`);
  }

  // 3. Update footer
  const oldFooterLinksRegex = /<div class="flex items-center gap-4">[\s\S]*?<button onclick="bukaModalPortal\(\)"[\s\S]*?<\/div>/;
  if (oldFooterLinksRegex.test(content)) {
    content = content.replace(oldFooterLinksRegex, newFooterLinksHtml);
    console.log(`[${filename}] Updated footer with Privacy & Disclaimer buttons.`);
  }

  // 4. Ensure privacy-consent.js script is included
  if (!content.includes('lib/privacy-consent.js')) {
    content = content.replace('</body>', '  <!-- Modul Kepatuhan UU PDP & Disclaimer Profesi -->\n  <script src="lib/privacy-consent.js"></script>\n\n</body>');
    console.log(`[${filename}] Added lib/privacy-consent.js.`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
});

// Update portal-absensi.html
const absensiPath = path.join(ROOT_DIR, 'portal-absensi.html');
if (fs.existsSync(absensiPath)) {
  let absContent = fs.readFileSync(absensiPath, 'utf8');

  // Update footer
  const oldAbsFooter = `<footer class="bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-slate-500 text-[11px] mt-auto">
    <p>&copy; 2026 KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan. All Rights Reserved.</p>
    <p class="text-[10px] text-slate-600 mt-0.5">Sistem Pengendalian Mutu (SPM) Terpadu &bull; Kode Etik Penilai Indonesia (KEPI)</p>
  </footer>`;

  const newAbsFooter = `<footer class="bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-slate-500 text-[11px] mt-auto">
    <p>&copy; 2026 KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan. All Rights Reserved.</p>
    <div class="flex flex-wrap items-center justify-center gap-3 mt-1.5 text-[10.5px]">
      <button type="button" onclick="bukaModalPrivasiKaryawan()" class="text-amber-400 hover:underline cursor-pointer">Pemberitahuan Privasi Karyawan</button>
      <span>&bull;</span>
      <button type="button" onclick="bukaModalPrivasi()" class="text-slate-400 hover:text-white cursor-pointer">Kebijakan Privasi (UU PDP)</button>
      <span>&bull;</span>
      <button type="button" onclick="bukaModalDisclaimer()" class="text-slate-400 hover:text-white cursor-pointer">Disclaimer Profesi</button>
    </div>
    <p class="text-[10px] text-slate-600 mt-1">Sistem Presensi &amp; Layanan Mandiri Karyawan &bull; Kepatuhan UU No. 27/2022 tentang Pelindungan Data Pribadi</p>
  </footer>`;

  if (absContent.includes('Sistem Pengendalian Mutu (SPM) Terpadu &bull; Kode Etik Penilai Indonesia (KEPI)')) {
    absContent = absContent.replace(oldAbsFooter, newAbsFooter);
    console.log(`[portal-absensi.html] Updated footer.`);
  }

  if (!absContent.includes('lib/privacy-consent.js')) {
    absContent = absContent.replace('</body>', '  <!-- Modul Kepatuhan UU PDP & Disclaimer Profesi -->\n  <script src="lib/privacy-consent.js"></script>\n\n</body>');
    console.log(`[portal-absensi.html] Added lib/privacy-consent.js.`);
  }

  fs.writeFileSync(absensiPath, absContent, 'utf8');
}

// Update GPS.html
const gpsPath = path.join(ROOT_DIR, 'GPS.html');
if (fs.existsSync(gpsPath)) {
  let gpsContent = fs.readFileSync(gpsPath, 'utf8');

  if (!gpsContent.includes('bukaModalPrivasiKaryawan()')) {
    const gpsFooter = `  <!-- FOOTER PRIVASI KARYAWAN -->
  <footer class="bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-slate-500 text-[11px] mt-auto">
    <p>&copy; 2026 KJPP Nanang Rahayu Sigit Paryanto &amp; Rekan. All Rights Reserved.</p>
    <div class="flex flex-wrap items-center justify-center gap-3 mt-1.5 text-[10.5px]">
      <button type="button" onclick="bukaModalPrivasiKaryawan()" class="text-amber-400 hover:underline cursor-pointer">Pemberitahuan Privasi Karyawan</button>
      <span>&bull;</span>
      <button type="button" onclick="bukaModalPrivasi()" class="text-slate-400 hover:text-white cursor-pointer">Kebijakan Privasi (UU PDP)</button>
      <span>&bull;</span>
      <button type="button" onclick="bukaModalDisclaimer()" class="text-slate-400 hover:text-white cursor-pointer">Disclaimer Profesi</button>
    </div>
    <p class="text-[10px] text-slate-600 mt-1">Sistem Presensi Karyawan &bull; Kepatuhan UU No. 27/2022</p>
  </footer>\n`;

    gpsContent = gpsContent.replace('</main>', '</main>\n\n' + gpsFooter);
    console.log(`[GPS.html] Added footer.`);
  }

  if (!gpsContent.includes('lib/privacy-consent.js')) {
    gpsContent = gpsContent.replace('</body>', '  <!-- Modul Kepatuhan UU PDP & Disclaimer Profesi -->\n  <script src="lib/privacy-consent.js"></script>\n\n</body>');
    console.log(`[GPS.html] Added lib/privacy-consent.js.`);
  }

  fs.writeFileSync(gpsPath, gpsContent, 'utf8');
}

// Update portal-nolap.html
const nolapPath = path.join(ROOT_DIR, 'portal-nolap.html');
if (fs.existsSync(nolapPath)) {
  let nolapContent = fs.readFileSync(nolapPath, 'utf8');

  if (!nolapContent.includes('bukaModalPrivasi()')) {
    const nolapTarget = '<p class="text-[11px] text-slate-400">';
    const nolapReplacement = `<div class="flex flex-wrap items-center justify-center gap-3 text-[11px] mb-1">
        <button type="button" onclick="bukaModalPrivasi()" class="text-slate-400 hover:text-amber-400 transition cursor-pointer">Kebijakan Privasi &amp; Perlindungan Data</button>
        <span class="text-slate-700">&bull;</span>
        <button type="button" onclick="bukaModalDisclaimer()" class="text-slate-400 hover:text-amber-400 transition cursor-pointer">Disclaimer Profesi Penilai</button>
      </div>
      <p class="text-[11px] text-slate-400">`;
    nolapContent = nolapContent.replace(nolapTarget, nolapReplacement);
    console.log(`[portal-nolap.html] Added privacy & disclaimer links.`);
  }

  if (!nolapContent.includes('lib/privacy-consent.js')) {
    nolapContent = nolapContent.replace('</body>', '  <!-- Modul Kepatuhan UU PDP & Disclaimer Profesi -->\n  <script src="lib/privacy-consent.js"></script>\n\n</body>');
    console.log(`[portal-nolap.html] Added lib/privacy-consent.js.`);
  }

  fs.writeFileSync(nolapPath, nolapContent, 'utf8');
}

// Update portal-kwitansi.html
const kwitansiPath = path.join(ROOT_DIR, 'portal-kwitansi.html');
if (fs.existsSync(kwitansiPath)) {
  let kwContent = fs.readFileSync(kwitansiPath, 'utf8');

  if (!kwContent.includes('bukaModalPrivasi()')) {
    const kwTarget = '  </main>';
    const kwFooter = `    <!-- FOOTER RESMI PRIVASI & DISCLAIMER -->
    <div class="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-900 mt-6 no-print">
      <div class="flex flex-wrap items-center justify-center gap-3 text-[11px] mb-1">
        <button type="button" onclick="bukaModalPrivasi()" class="text-slate-400 hover:text-amber-400 transition cursor-pointer">Kebijakan Privasi &amp; Perlindungan Data</button>
        <span class="text-slate-700">&bull;</span>
        <button type="button" onclick="bukaModalDisclaimer()" class="text-slate-400 hover:text-amber-400 transition cursor-pointer">Disclaimer Profesi Penilai</button>
      </div>
      <p class="text-[10px] text-slate-600">Sistem Kwitansi Elektronik &bull; KJPP Nanang Rahayu Sigit Paryanto dan Rekan</p>
    </div>
  </main>`;
    kwContent = kwContent.replace(kwTarget, kwFooter);
    console.log(`[portal-kwitansi.html] Added privacy & disclaimer links.`);
  }

  if (!kwContent.includes('lib/privacy-consent.js')) {
    kwContent = kwContent.replace('</body>', '  <!-- Modul Kepatuhan UU PDP & Disclaimer Profesi -->\n  <script src="lib/privacy-consent.js"></script>\n\n</body>');
    console.log(`[portal-kwitansi.html] Added lib/privacy-consent.js.`);
  }

  fs.writeFileSync(kwitansiPath, kwContent, 'utf8');
}

console.log('✅ Selesai memperbarui kepatuhan PDP di seluruh berkas proyek!');
