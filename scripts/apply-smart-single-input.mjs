import fs from 'fs';
import path from 'path';

const basePath = 'D:/WEB KJPP NSR_Compro new ver/kjpp-nsr-netlify-production';

// =========================================================================
// 1. UPDATE index.html
// =========================================================================
console.log('--- 1. Memperbarui index.html ---');
const indexPath = path.join(basePath, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// A. Label & Placeholder Modal #modal-portal
const oldLabelRegex = /<span id="label-token-portal">.*?<\/span>/;
const newLabelHtml = '<span id="label-token-portal">TOKEN OTORISASI / NIK KARYAWAN <span class="text-rose-400">*</span></span>';
indexHtml = indexHtml.replace(oldLabelRegex, newLabelHtml);

const oldPlaceholderRegex = /placeholder="Masukkan token otorisasi\.\.\."/;
const newPlaceholder = 'placeholder="Masukkan Token Akses atau NIK (cth: NSR-2019-005)"';
indexHtml = indexHtml.replace(oldPlaceholderRegex, newPlaceholder);

// B. Logika Deteksi Cerdas pada verifikasiTokenPortal(e)
const targetVerifikasiHead = /async function verifikasiTokenPortal\(e\) \{[\s\S]*?if \(!input\) \{[\s\S]*?return;\s*\}/;

const smartDetectionLogic = `async function verifikasiTokenPortal(e) {
      if (e) e.preventDefault();
      const inputEl = document.getElementById('input-token');
      const btnSubmit = document.getElementById('btn-submit-token');
      const errEl = document.getElementById('pesan-error');
      const errText = document.getElementById('pesan-error-text');
      if (!inputEl) return;
      const rawInput = inputEl.value.trim();
      const cleanInput = rawInput.toUpperCase().replace(/\\s+/g, '').replace(/_/g, '-');
      window._currentAuthToken = rawInput;

      if (!rawInput) {
        if (errEl) errEl.classList.remove('hidden');
        if (errText) errText.innerText = 'Silakan masukkan Token Akses resmi atau NIK Karyawan terlebih dahulu.';
        inputEl.focus();
        return;
      }

      // =====================================================================
      // KONDISI A: INPUT TUNGGAL CERDAS - NIK KARYAWAN PRESENSI (NSR-...)
      // =====================================================================
      if (cleanInput.startsWith('NSR-') || /^NSR\\d/i.test(cleanInput)) {
        if (errEl) errEl.classList.add('hidden');
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerHTML = '<span>Memverifikasi NIK Karyawan...</span>';
        }

        // Master 48 NIK Karyawan Resmi KJPP NSR (Pusat & 4 Cabang)
        const MASTER_48_NIKS = [
          "NSR-2019-001", "NSR-2019-002", "NSR-2019-003", "NSR-2019-004", "NSR-2019-005",
          "NSR-2019-006", "NSR-2019-007", "NSR-2019-008", "NSR-2019-009", "NSR-2019-010",
          "NSR-2019-011", "NSR-2019-012", "NSR-2019-013", "NSR-2019-014", "NSR-2019-015",
          "NSR-2019-016", "NSR-2019-017", "NSR-2019-018", "NSR-2019-019", "NSR-2019-020",
          "NSR-2025-021", "NSR-2026-022", "NSR-PDG-2019-23", "NSR-PDG-2019-24", "NSR-PDG-2019-25",
          "NSR-PDG-2019-26", "NSR-PDG-2019-27", "NSR-PDG-2019-28", "NSR-PDG-2019-29", "NSR-MKS-2019-30",
          "NSR-MKS-2019-31", "NSR-MKS-2019-32", "NSR-MKS-2020-33", "NSR-MKS-2021-34", "NSR-MKS-2020-35",
          "NSR-MKS-2019-36", "NSR-MKS-2019-37", "NSR-BDG-2020-38", "NSR-BDG-2020-39", "NSR-BDG-2020-40",
          "NSR-BDG-2020-41", "NSR-BDG-2020-42", "NSR-BDG-2020-43", "NSR-PLB-2022-44", "NSR-PLB-2022-45",
          "NSR-PLB-2022-46", "NSR-PLB-2022-47", "NSR-PLB-2022-48"
        ];

        let isNikValid = MASTER_48_NIKS.includes(cleanInput);
        let employeeData = null;

        // Verifikasi ke endpoint backend server
        try {
          const resp = await fetch('backend/absensi-data-handler.php?action=cekKaryawan&nik=' + encodeURIComponent(cleanInput), {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
          });
          const resJson = await resp.json().catch(() => null);
          if (resJson && (resJson.status === 'success' || resJson.success)) {
            isNikValid = true;
            employeeData = resJson;
          } else if (resJson && resJson.status === 'error' && resp.status === 404) {
            isNikValid = false;
          }
        } catch (_) {
          try {
            const respFallback = await fetch('absensi-data-handler.php?action=cekKaryawan&nik=' + encodeURIComponent(cleanInput), {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              credentials: 'include'
            });
            const resFallback = await respFallback.json().catch(() => null);
            if (resFallback && (resFallback.status === 'success' || resFallback.success)) {
              isNikValid = true;
              employeeData = resFallback;
            } else if (resFallback && resFallback.status === 'error' && respFallback.status === 404) {
              isNikValid = false;
            }
          } catch (_) {}
        }

        if (isNikValid) {
          // 1. Simpan NIK ke sesi peramban
          sessionStorage.setItem('auth_nik', cleanInput);
          sessionStorage.setItem('nsr_presensi_active_nik', cleanInput);
          sessionStorage.setItem('nsr_presensi_session_nik', cleanInput);
          if (employeeData) {
            sessionStorage.setItem('nsr_presensi_session_user', JSON.stringify(employeeData));
            sessionStorage.setItem('nsr_presensi_active_user', JSON.stringify(employeeData));
          }

          if (btnSubmit) {
            btnSubmit.innerHTML = '<span>NIK Terverifikasi! Mengalihkan ke Presensi... 🚀</span>';
          }

          // 2. Langsung alihkan detik itu juga ke portal presensi
          window.location.href = 'portal-presensi.html';
          return;
        } else {
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<span id=\"btn-submit-text\">Verifikasi &amp; Masuk</span> <svg class=\"w-4 h-4 text-blue-200\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/></svg>';
          }
          if (errEl) errEl.classList.remove('hidden');
          if (errText) {
            errText.innerText = 'NIK Karyawan tidak terdaftar dalam database resmi KJPP NSR.';
          }
          inputEl.select();
          return;
        }
      }

      // =====================================================================
      // KONDISI B: INPUT ADALAH TOKEN OPERASIONAL (BUKAN FORMAT NIK)
      // =====================================================================
      const input = rawInput;`;

indexHtml = indexHtml.replace(targetVerifikasiHead, smartDetectionLogic);
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('✓ index.html berhasil diperbarui dengan Input Tunggal Cerdas.\n');

// =========================================================================
// 2. UPDATE absensi-data-handler.php
// =========================================================================
console.log('--- 2. Memperbarui absensi-data-handler.php ---');
const handlerPath = path.join(basePath, 'absensi-data-handler.php');
let handlerPhp = fs.readFileSync(handlerPath, 'utf8');

handlerPhp = handlerPhp.replace(
  /\$nik = \$payload\['nik'\] \?\? \$_GET\['nik'\] \?\? '';/,
  "$nik = $payload['nik'] ?? $_POST['nik'] ?? $_GET['nik'] ?? '';"
);

fs.writeFileSync(handlerPath, handlerPhp, 'utf8');
console.log('✓ absensi-data-handler.php berhasil diperbarui.\n');

// =========================================================================
// 3. UPDATE portal-presensi.html
// =========================================================================
console.log('--- 3. Memperbarui portal-presensi.html ---');
const presensiPath = path.join(basePath, 'portal-presensi.html');
let presensiHtml = fs.readFileSync(presensiPath, 'utf8');

// Pastikan kunciInputNikSecaraMutlak otomatis fokus ke auth-pin-input jika sessionToken belum ada
const oldKunciNikRegex = /function kunciInputNikSecaraMutlak\(nik, userObj = null\) \{[\s\S]*?if \(preview\) preview\.classList\.add\('hidden'\);\s*\}/;

const newKunciNik = `function kunciInputNikSecaraMutlak(nik, userObj = null) {
      if (!nik) return;
      const inp = document.getElementById('auth-nik-input');
      const badge = document.getElementById('nik-lockdown-badge');
      const labelNik = document.getElementById('locked-nik-label');
      const labelUser = document.getElementById('locked-user-label');
      const statusNik = document.getElementById('badge-lock-status');
      const preview = document.getElementById('auth-nik-preview');
      const pinInput = document.getElementById('auth-pin-input');

      if (inp) {
        inp.value = nik;
        inp.setAttribute('readonly', 'true');
        inp.classList.add('bg-slate-900', 'text-emerald-300', 'border-emerald-500/50', 'cursor-not-allowed', 'select-none');
        inp.tabIndex = -1;
      }
      if (statusNik) {
        statusNik.textContent = '🔒 Terkunci Sesi';
        statusNik.className = 'text-[10px] text-emerald-400 font-bold';
      }
      if (badge && labelNik) {
        labelNik.textContent = nik;
        if (userObj) {
          labelUser.textContent = (userObj.nama || '') + ' • ' + (userObj.kantor || userObj.cabang || 'KJPP NSR') + ' • ' + (userObj.jabatan || '');
        }
        badge.classList.remove('hidden');
      }
      if (preview) preview.classList.add('hidden');

      // Fokus kursor otomatis berpindah ke kolom PIN Presensi (6 Digit)
      if (pinInput && (!sessionToken || sessionToken === '')) {
        setTimeout(() => {
          pinInput.focus();
        }, 200);
      }
    }`;

presensiHtml = presensiHtml.replace(oldKunciNikRegex, newKunciNik);

// Update pulihkanSesiPresensiTersimpan untuk menangani boundNik tanpa boundUser
const oldPulihkanRegex = /if \(boundNik\) \{\s*kunciInputNikSecaraMutlak\(boundNik, boundUser\);[\s\S]*?return;\s*\}\s*\}/;

const newPulihkan = `if (boundNik) {
          kunciInputNikSecaraMutlak(boundNik, boundUser);
          if (!boundUser) {
            callBackend('cekKaryawan', { nik: boundNik }).then(res => {
              const data = (res && res.data) ? res.data : res;
              if (data && (res.status === 'success' || res.success || data.nama)) {
                kunciInputNikSecaraMutlak(boundNik, data);
              }
            }).catch(() => {});
          }
          if (boundToken) {
            sessionToken = boundToken;
            sessionNik = boundNik;
            sessionUser = boundUser || { nik: boundNik, nama: boundNik };
            pasangStateTerverifikasi();
            return;
          } else {
            const pinInp = document.getElementById('auth-pin-input');
            if (pinInp) setTimeout(() => pinInp.focus(), 250);
          }
        }`;

presensiHtml = presensiHtml.replace(oldPulihkanRegex, newPulihkan);
fs.writeFileSync(presensiPath, presensiHtml, 'utf8');
console.log('✓ portal-presensi.html berhasil diperbarui.\n');

console.log('Semua modul Input Tunggal Cerdas sukses disinkronkan!');
