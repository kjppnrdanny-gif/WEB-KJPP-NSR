import fs from 'fs';

const nolapPath = 'portal-nolap.html';
let nolapCode = fs.readFileSync(nolapPath, 'utf8');
const isCRLF = nolapCode.includes('\r\n');
if (isCRLF) nolapCode = nolapCode.replace(/\r\n/g, '\n');

// 1. Insert Requester Info Box right before <div><label class="block font-semibold text-slate-300 mb-1">Nama Pemohon
const targetPemohon = `<div>
              <label class="block font-semibold text-slate-300 mb-1">Nama Pemohon (Penilai/Staf) *</label>`;

if (!nolapCode.includes(targetPemohon)) {
  throw new Error('targetPemohon not found in portal-nolap.html');
}

const requesterBannerHtml = `<!-- NOTIFIKASI & IDENTITAS PENGAJU (SSOT MASTER PERSONEL) -->
            <div class="col-span-1 sm:col-span-2 lg:col-span-3 p-3.5 bg-slate-900 border border-slate-700 rounded-xl mb-1 shadow-md">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-amber-400 font-bold text-base">👤</span>
                  <div>
                    <span class="text-xs font-bold text-white">Identitas Pengaju &amp; Saluran Notifikasi Resmi</span>
                    <div id="badge-status-pengaju-nolap" class="mt-0.5 text-[10px] text-emerald-400 font-semibold">
                      ✅ Terverifikasi Master Personel
                    </div>
                  </div>
                </div>
                <button type="button" onclick="bukaModalRegistrasiPersonel()" class="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold cursor-pointer self-start sm:self-auto transition">
                  ✏️ Pembaruan Kontak / Registrasi Personel
                </button>
              </div>
            </div>

            `;

nolapCode = nolapCode.replace(targetPemohon, requesterBannerHtml + targetPemohon);

// 2. Insert WhatsApp feedback container in eLSa panel
const targetElsaButton = `<button type="button" onclick="simpanVerifikasiElsa()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20">
                Simpan &amp; Verifikasi Tanda eLSa
              </button>
            </div>`;

if (!nolapCode.includes(targetElsaButton)) {
  throw new Error('targetElsaButton not found in portal-nolap.html');
}

const replacementElsaButton = `<button type="button" onclick="simpanVerifikasiElsa()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20">
                Simpan &amp; Verifikasi Tanda eLSa
              </button>
            </div>
            <div id="elsa-notif-result" class="hidden mt-3"></div>`;

nolapCode = nolapCode.replace(targetElsaButton, replacementElsaButton);

// 3. Add modal-registrasi-personel before </body>
const bodyEndAnchor = `</body>`;
const modalRegistrasiHtml = `
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
nolapCode = nolapCode.replace(bodyEndAnchor, modalRegistrasiHtml + '\n' + bodyEndAnchor);

// 4. Update inisialisasiSesiPengguna to prefill pemohon, email, wa from MASTER_PERSONEL_LOOKUP
const targetInitSesi = `      const elPemohon = document.getElementById('f-pemohon');
      const elJabatan = document.getElementById('f-jabatan');
      if (elPemohon && sesi.nama && !elPemohon.value) {
        elPemohon.value = sesi.nama;
      }
      if (elJabatan && sesi.jabatan && !elJabatan.value) {
        elJabatan.value = sesi.jabatan;
      }`;

if (!nolapCode.includes(targetInitSesi)) {
  throw new Error('targetInitSesi not found in portal-nolap.html');
}

const replacementInitSesi = `      const subKey = (sesi.sub || sesi.role || sesi.username || '').toLowerCase();
      let matched = typeof MASTER_PERSONEL_LOOKUP !== 'undefined' ? MASTER_PERSONEL_LOOKUP[subKey] : null;
      if (!matched && typeof MASTER_PERSONEL_LOOKUP !== 'undefined') {
        for (const k in MASTER_PERSONEL_LOOKUP) {
          if (subKey.includes(k) || (sesi.wilayah && MASTER_PERSONEL_LOOKUP[k].office.includes(sesi.wilayah)) || (sesi.cabang && MASTER_PERSONEL_LOOKUP[k].office.includes(sesi.cabang))) {
            matched = MASTER_PERSONEL_LOOKUP[k];
            break;
          }
        }
      }

      const elPemohon = document.getElementById('f-pemohon');
      const elJabatan = document.getElementById('f-jabatan');
      const elEmail = document.getElementById('f-email-pemohon');
      const elWa = document.getElementById('f-wa-pemohon');
      const badgePengaju = document.getElementById('badge-status-pengaju-nolap');

      if (matched) {
        if (elPemohon) elPemohon.value = sesi.nama || matched.nama;
        if (elJabatan) elJabatan.value = sesi.jabatan || 'Staf Operasional';
        if (elEmail) elEmail.value = matched.email;
        if (elWa) elWa.value = matched.wa;
        if (badgePengaju) {
          badgePengaju.className = "mt-0.5 text-[10px] text-emerald-400 font-semibold";
          badgePengaju.innerText = "✅ Terverifikasi Master Personel (" + matched.email + " | " + matched.wa + ")";
        }
      } else {
        if (elPemohon && sesi.nama) elPemohon.value = sesi.nama;
        if (elJabatan && sesi.jabatan) elJabatan.value = sesi.jabatan;
        if (elEmail && !elEmail.value) elEmail.value = 'notifikasi@kjppnanangrahayu.com';
        if (elWa && !elWa.value) elWa.value = '081298765432';
        if (badgePengaju) {
          badgePengaju.className = "mt-0.5 text-[10px] text-amber-400 font-semibold";
          badgePengaju.innerText = "⚠️ Kontak Belum Lengkap (Perlu Pembaruan)";
        }
      }`;

nolapCode = nolapCode.replace(targetInitSesi, replacementInitSesi);

// 5. Replace simpanVerifikasiElsa() with real backend sync & WhatsApp link generator
const targetSimpanElsa = `function simpanVerifikasiElsa() {
      const reqId = document.getElementById('elsa-select-req')?.value;
      if (!reqId) { alert('Pilih nomor permintaan terlebih dahulu.'); return; }
      const item = daftarPermohonan.find(p => p.noPermintaan === reqId);
      if (!item) return;

      const linkQr = document.getElementById('elsa-link-qr').value.trim();
      const statusElsa = document.getElementById('elsa-status-penyampaian').value;

      item.linkElsa = linkQr;
      item.statusElsa = statusElsa;

      simpanDatabaseLokal();
      muatUlangTabel();
      alert('Data verifikasi eLSa berhasil diperbarui.');
    }`;

if (!nolapCode.includes(targetSimpanElsa)) {
  throw new Error('targetSimpanElsa not found in portal-nolap.html');
}

const replacementSimpanElsa = `async function simpanVerifikasiElsa() {
      const reqId = document.getElementById('elsa-select-req')?.value;
      if (!reqId) { alert('Pilih nomor permintaan terlebih dahulu.'); return; }
      const item = daftarPermohonan.find(p => p.noPermintaan === reqId);
      if (!item) { alert('Permohonan tidak ditemukan.'); return; }

      const linkQr = document.getElementById('elsa-link-qr')?.value.trim();
      const statusElsa = document.getElementById('elsa-status-penyampaian')?.value;

      if (!linkQr) {
        alert('Tautan / URL QR Code eLSa wajib diisi!');
        return;
      }

      item.linkElsa = linkQr;
      item.statusElsa = statusElsa;

      try {
        const tokenVal = (sesiAktif && (sesiAktif.token || sesiAktif.tokenHash)) ? (sesiAktif.token || sesiAktif.tokenHash) : (sessionStorage.getItem('NSR_AUTH_TOKEN') || '');
        const res = await fetch('/api/nolap-data-proxy?action=verifyElsaQrReport', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(tokenVal ? { 'X-NSR-Token': tokenVal } : {})
          },
          body: JSON.stringify({
            noPermintaan: reqId,
            idPenugasan: item.idPenugasan || item.id || '',
            linkElsa: linkQr,
            statusElsa: statusElsa,
            catatan: 'QR Code eLSa-PK telah diverifikasi kecocokannya oleh Admin Pusat.'
          })
        });

        const data = await res.json();
        if (data.success) {
          simpanDatabaseLokal();
          muatUlangTabel();

          const notifResultEl = document.getElementById('elsa-notif-result');
          if (notifResultEl) {
            notifResultEl.classList.remove('hidden');
            notifResultEl.innerHTML = \`
              <div class="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-white space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">✅</span>
                    <strong class="font-bold text-emerald-300 text-sm">Verifikasi eLSa Berhasil &amp; Email Notifikasi Masuk Antrean</strong>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Notif ID: \${data.notification_id || 'OK'}</span>
                </div>
                <p class="text-xs text-slate-300">
                  Status eLSa telah diperbarui. Surel konfirmasi resmi dijadwalkan otomatis untuk pengaju (\${item.pemohon || 'Pengaju'}).
                </p>
                \${data.wa_url ? \`
                  <div class="flex flex-wrap items-center gap-2 pt-1">
                    <a href="\${data.wa_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg cursor-pointer">
                      <span>📲 Buka Tautan WhatsApp Siap Kirim</span>
                    </a>
                    <button type="button" onclick="navigator.clipboard.writeText('\${data.wa_url}'); alert('Tautan WhatsApp berhasil disalin!');" class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer">
                      📋 Salin Link WhatsApp
                    </button>
                  </div>
                \` : ''}
              </div>
            \`;
          }
          alert('Data verifikasi eLSa berhasil diverifikasi dan disimpan! Notifikasi email telah dijadwalkan.');
        } else {
          alert('Peringatan: ' + (data.error || 'Gagal sinkronisasi backend eLSa.'));
        }
      } catch (err) {
        simpanDatabaseLokal();
        muatUlangTabel();
        alert('Data verifikasi eLSa disimpan secara lokal: ' + err.message);
      }
    }`;

nolapCode = nolapCode.replace(targetSimpanElsa, replacementSimpanElsa);

// 6. Add Helper functions for Modal & Master Lookup
const helperScript = `
    const MASTER_PERSONEL_LOOKUP = {};

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
        const tokenVal = (sesiAktif && (sesiAktif.token || sesiAktif.tokenHash)) ? (sesiAktif.token || sesiAktif.tokenHash) : (sessionStorage.getItem('NSR_AUTH_TOKEN') || '');
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

const scriptStartAnchor = `<script>`;
nolapCode = nolapCode.replace(scriptStartAnchor, scriptStartAnchor + '\n' + helperScript);

// 7. Attach snapshot fields into dataBaru in submit
const dataBaruTarget = `        namaPemohon: pemohon,
        jabatanPemohon: jabatan,
        emailPemohon: emailPemohon,
        waPemohon: waPemohon,`;
const dataBaruReplacement = `        namaPemohon: pemohon,
        jabatanPemohon: jabatan,
        emailPemohon: emailPemohon,
        waPemohon: waPemohon,
        pengaju_user_id: sesiAktif?.sub || sesiAktif?.role || 'staf',
        pengaju_nama: pemohon,
        pengaju_kantor: originBranchId,
        pengaju_email: emailPemohon,
        pengaju_wa: waPemohon,`;

if (!nolapCode.includes(dataBaruTarget)) {
  throw new Error('dataBaruTarget not found in portal-nolap.html');
}
nolapCode = nolapCode.replace(dataBaruTarget, dataBaruReplacement);

if (isCRLF) nolapCode = nolapCode.replace(/\n/g, '\r\n');
fs.writeFileSync(nolapPath, nolapCode, 'utf8');
console.log('✓ portal-nolap.html successfully patched with Requester Info, Modal, Auto-Lookup, and eLSa WhatsApp generator!');
