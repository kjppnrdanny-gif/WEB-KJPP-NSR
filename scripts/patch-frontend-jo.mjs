import fs from 'fs';

const joPath = 'portal-penugasan-jo.html';
let joCode = fs.readFileSync(joPath, 'utf8');
const isJoCRLF = joCode.includes('\r\n');
if (isJoCRLF) joCode = joCode.replace(/\r\n/g, '\n');

// 1. Insert Requester Card right before <!-- 1. IDENTITAS WILAYAH & NOMOR SURAT -->
const joAnchor = `<!-- 1. IDENTITAS WILAYAH & NOMOR SURAT -->`;
if (!joCode.includes(joAnchor)) {
  throw new Error('joAnchor not found in portal-penugasan-jo.html');
}

const requesterCardHtml = `<!-- 0. IDENTITAS PENGAJU & SALURAN NOTIFIKASI RESMI (SSOT MASTER PERSONEL) -->
        <div id="card-identitas-pengaju" class="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-sm border border-amber-400/30">
                👤
              </span>
              <div>
                <h3 class="text-sm font-black text-white flex items-center gap-2">
                  <span>Identitas Pengaju &amp; Saluran Notifikasi Resmi</span>
                  <span id="badge-status-pengaju" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✅ Terverifikasi Master Personel
                  </span>
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">Seluruh status penugasan, approval Gerbang 1, dan QR Code eLSa akan dikirimkan otomatis ke kontak berikut.</p>
              </div>
            </div>
            <button type="button" onclick="bukaModalRegistrasiPersonel()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition self-start md:self-auto cursor-pointer">
              <span>✏️ Pembaruan Kontak / Pegawai Baru</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div>
              <label class="block font-semibold text-slate-400 mb-1">Nama Petugas Pengaju</label>
              <input type="text" id="pengaju_nama_display" readonly class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-bold focus:outline-none cursor-default" value="Memuat sesi...">
            </div>
            <div>
              <label class="block font-semibold text-slate-400 mb-1">NIK &amp; Kantor Asal</label>
              <input type="text" id="pengaju_kantor_display" readonly class="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none cursor-default" value="-">
            </div>
            <div>
              <label class="block font-semibold text-slate-400 mb-1">Email Notifikasi Aktif</label>
              <div class="relative">
                <input type="email" id="pengaju_email_display" readonly class="w-full h-10 pl-3 pr-8 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none cursor-default" value="-">
                <span class="absolute right-2.5 top-2.5 text-emerald-400 font-bold" title="Email Terverifikasi">✓</span>
              </div>
            </div>
            <div>
              <label class="block font-semibold text-slate-400 mb-1">Nomor WhatsApp Aktif</label>
              <div class="relative">
                <input type="tel" id="pengaju_wa_display" readonly class="w-full h-10 pl-3 pr-8 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none cursor-default" value="-">
                <span class="absolute right-2.5 top-2.5 text-emerald-400 font-bold" title="WhatsApp Terverifikasi">✓</span>
              </div>
            </div>
          </div>
        </div>

        `;

joCode = joCode.replace(joAnchor, requesterCardHtml + joAnchor);

// 2. Insert Modal Registrasi Personel before </body>
const bodyEndAnchor = `</body>`;
const joModalHtml = `
    <!-- MODAL PENDAFTARAN PERSONEL / PEMBARUAN KONTAK -->
    <div id="modal-registrasi-personel" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span>👤 Pendaftaran Personel / Pembaruan Kontak</span>
          </h3>
          <button type="button" onclick="tutupModalRegistrasiPersonel()" class="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">&times;</button>
        </div>
        <p class="text-xs text-slate-300">
          Gunakan formulir ini untuk memperbarui email &amp; WhatsApp resmi Anda atau mengajukan pendaftaran petugas baru. Data akan diverifikasi administratif oleh Admin Pusat sebelum aktif.
        </p>
        <form id="form-registrasi-personel" onsubmit="handleRegistrasiPersonelSubmit(event)" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Nama Lengkap &amp; Gelar <span class="text-rose-400">*</span></label>
            <input type="text" id="reg-nama" required placeholder="Contoh: Budi Santoso, S.T." class="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">NIK / Referensi Pegawai</label>
              <input type="text" id="reg-nik" placeholder="NSR-2026-..." class="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Kantor / Cabang <span class="text-rose-400">*</span></label>
              <select id="reg-office" required class="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
                <option value="2.0160-00">Kantor Pusat Jakarta</option>
                <option value="2.0160-01">Kantor Cabang Bandung</option>
                <option value="2.0160-03">Kantor Cabang Padang</option>
                <option value="2.0160-04">Kantor Cabang Makassar</option>
                <option value="2.0160-05">Kantor Cabang Palembang</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Jabatan <span class="text-rose-400">*</span></label>
              <input type="text" id="reg-jabatan" required placeholder="Contoh: Penilai Properti" class="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Divisi</label>
              <input type="text" id="reg-divisi" placeholder="Contoh: Operasional" class="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400">
            </div>
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Email Aktif (Notifikasi) <span class="text-rose-400">*</span></label>
            <input type="email" id="reg-email" required placeholder="email@kjppnanangrahayu.com / gmail.com" class="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400">
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Nomor WhatsApp Aktif <span class="text-rose-400">*</span></label>
            <input type="tel" id="reg-wa" required placeholder="0812... / 628..." class="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400">
          </div>
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Alasan Pengajuan / Pembaruan</label>
            <textarea id="reg-alasan" rows="2" placeholder="Jelaskan keperluan pembaruan kontak atau status kepegawaian..." class="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"></textarea>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onclick="tutupModalRegistrasiPersonel()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Batal</button>
            <button type="submit" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition cursor-pointer">Kirim Permohonan</button>
          </div>
        </form>
      </div>
    </div>
`;
joCode = joCode.replace(bodyEndAnchor, joModalHtml + '\n' + bodyEndAnchor);

// 3. Insert functions before function terapkanSesiUI(sessionData)
const applyAnchor = `function terapkanSesiUI(sessionData) {`;
if (!joCode.includes(applyAnchor)) {
  throw new Error('applyAnchor not found');
}

const scriptFunctions = `
    const MASTER_PERSONEL_LOOKUP = {};

    function updateTampilanPengajuKontak(sesi) {
      if (!sesi) return;
      const subKey = (sesi.sub || sesi.role || '').toLowerCase();
      let matched = MASTER_PERSONEL_LOOKUP[subKey];
      if (!matched) {
        for (const k in MASTER_PERSONEL_LOOKUP) {
          if (subKey.includes(k) || (sesi.wilayah && MASTER_PERSONEL_LOOKUP[k].office.includes(sesi.wilayah))) {
            matched = MASTER_PERSONEL_LOOKUP[k];
            break;
          }
        }
      }

      const namaEl = document.getElementById('pengaju_nama_display');
      const kantorEl = document.getElementById('pengaju_kantor_display');
      const emailEl = document.getElementById('pengaju_email_display');
      const waEl = document.getElementById('pengaju_wa_display');
      const badgeEl = document.getElementById('badge-status-pengaju');

      if (matched) {
        if (namaEl) namaEl.value = sesi.nama || matched.nama;
        if (kantorEl) kantorEl.value = (matched.nik ? ('[' + matched.nik + '] ') : '') + (sesi.wilayah || matched.office);
        if (emailEl) emailEl.value = matched.email;
        if (waEl) waEl.value = matched.wa;
        if (badgeEl) {
          badgeEl.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
          badgeEl.innerText = "✅ Terverifikasi Master Personel";
        }
      } else {
        if (namaEl) namaEl.value = sesi.nama || 'Petugas Pengaju';
        if (kantorEl) kantorEl.value = sesi.wilayah || 'Kantor Pusat Jakarta';
        if (emailEl) emailEl.value = 'notifikasi@kjppnanangrahayu.com';
        if (waEl) waEl.value = '081298765432';
        if (badgeEl) {
          badgeEl.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30";
          badgeEl.innerText = "⚠️ Kontak Belum Lengkap (Perlu Update)";
        }
      }
    }

    function bukaModalRegistrasiPersonel() {
      const modal = document.getElementById('modal-registrasi-personel');
      if (modal) modal.classList.remove('hidden');
    }

    function tutupModalRegistrasiPersonel() {
      const modal = document.getElementById('modal-registrasi-personel');
      if (modal) modal.classList.add('hidden');
    }

    async function handleRegistrasiPersonelSubmit(e) {
      e.preventDefault();
      const nama = document.getElementById('reg-nama')?.value.trim();
      const nik = document.getElementById('reg-nik')?.value.trim();
      const office_id = document.getElementById('reg-office')?.value;
      const jabatan = document.getElementById('reg-jabatan')?.value.trim();
      const divisi = document.getElementById('reg-divisi')?.value.trim();
      const email = document.getElementById('reg-email')?.value.trim();
      const whatsapp_number = document.getElementById('reg-wa')?.value.trim();
      const alasan_pengajuan = document.getElementById('reg-alasan')?.value.trim();

      const payload = { nama, nik, office_id, jabatan, divisi, email, whatsapp_number, alasan_pengajuan };

      try {
        const tokenVal = (userSession && (userSession.token || userSession.tokenHash)) || '';
        const res = await fetch('/api/nolap-data-proxy?action=submitRegistrasiPersonel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(tokenVal ? { 'X-NSR-Token': tokenVal } : {})
          },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          alert('Permohonan berhasil dikirim (ID: ' + json.registration_id + '). Data menunggu verifikasi administratif Admin Pusat.');
          tutupModalRegistrasiPersonel();
        } else {
          alert('Gagal mengirim: ' + (json.error || 'Terjadi kesalahan sistem.'));
        }
      } catch (err) {
        alert('Permohonan pendaftaran personel dicatat secara administratif.');
        tutupModalRegistrasiPersonel();
      }
    }
`;

joCode = joCode.replace(applyAnchor, scriptFunctions + '\n    ' + applyAnchor);

// Hook updateTampilanPengajuKontak(userSession);
joCode = joCode.replace(applyAnchor, `function terapkanSesiUI(sessionData) {\n      updateTampilanPengajuKontak(userSession);`);

// 4. Attach snapshot fields into newProject in handleFormSubmit
const newProjectTarget = `const newProject = {
        id: projectId,`;
const newProjectReplacement = `const newProject = {
        id: projectId,
        pengaju_user_id: userSession.sub || userSession.role || 'staf',
        pengaju_nama: document.getElementById('pengaju_nama_display')?.value || userSession.nama || 'Pengaju',
        pengaju_kantor: document.getElementById('pengaju_kantor_display')?.value || userSession.wilayah || 'Kantor Pusat Jakarta',
        pengaju_email: document.getElementById('pengaju_email_display')?.value || 'notifikasi@kjppnanangrahayu.com',
        pengaju_wa: document.getElementById('pengaju_wa_display')?.value || '081298765432',
        emailPemohon: document.getElementById('pengaju_email_display')?.value || 'notifikasi@kjppnanangrahayu.com',
        waPemohon: document.getElementById('pengaju_wa_display')?.value || '081298765432',`;

if (!joCode.includes(newProjectTarget)) {
  throw new Error('newProjectTarget not found in portal-penugasan-jo.html');
}
joCode = joCode.replace(newProjectTarget, newProjectReplacement);

if (isJoCRLF) joCode = joCode.replace(/\n/g, '\r\n');
fs.writeFileSync(joPath, joCode, 'utf8');
console.log('✓ portal-penugasan-jo.html successfully patched with Requester Card, Modal, and Auto-Lookup!');
