import fs from 'fs';

const filePath = 'portal-presensi.html';
let txt = fs.readFileSync(filePath, 'utf8');
const isCrlf = txt.includes('\r\n');
let normalized = txt.replace(/\r\n/g, '\n');

// 1. Update HTML input auth-otp-input: allow maxlength="12" and inputmode="text" for NSR8899
const oldInputHtml = `<input type="text" id="auth-otp-input" maxlength="6" placeholder="• • • • • •" inputmode="numeric" autocomplete="one-time-code" class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-center text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20 transition">`;

const newInputHtml = `<input type="text" id="auth-otp-input" maxlength="12" placeholder="6-Digit OTP / Token NSR8899" autocomplete="one-time-code" class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-center text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/20 transition uppercase">`;

if (normalized.includes(oldInputHtml)) {
  normalized = normalized.replace(oldInputHtml, newInputHtml);
  console.log('✓ Updated auth-otp-input HTML (maxlength=12, placeholder)');
} else {
  console.warn('Old input HTML target not found');
}

// 2. Update initKaryawanNIKInput to auto-unhide OTP for NSR-2019-005
const oldNikInputListener = `      nikInputEl.addEventListener('input', function() {
        if (sessionToken && this.value.trim().toUpperCase() !== sessionNik) {
          logoutSesi();
        }
      });`;

const newNikInputListener = `      nikInputEl.addEventListener('input', function() {
        const val = this.value.trim().toUpperCase();
        if (sessionToken && val !== sessionNik) {
          logoutSesi();
        }
        if (val === 'NSR-2019-005') {
          // Buka otomatis box OTP untuk NIK Manajemen
          const boxOtp = document.getElementById('auth-box-otp-input');
          if (boxOtp) boxOtp.classList.remove('hidden');
          const targetEmailEl = document.getElementById('auth-target-email');
          if (targetEmailEl) targetEmailEl.innerHTML = '<strong>danny@kjppnanangrahayu.com</strong> <span class=\"text-amber-400 font-bold block mt-0.5\">⚡ Jalur Cepat Manajemen: Ketik Token NSR8899 pada kolom OTP di bawah untuk verifikasi instan.</span>';
          resetTombolKirimOTP();
        }
      });`;

if (normalized.includes(oldNikInputListener)) {
  normalized = normalized.replace(oldNikInputListener, newNikInputListener);
  console.log('✓ Updated initKaryawanNIKInput for instant management detection');
} else {
  console.warn('Old nikInputEl listener not found');
}

// 3. Replace eksekusiMintaOTP, mulaiCooldownOTP, resetTombolKirimOTP, and eksekusiVerifikasiOTP
const targetMintaOTPStart = `    // 8. MINTA KODE OTP GMAIL (send_otp)
    async function eksekusiMintaOTP() {`;

const targetVerifOTPEnd = `        if (btnVerif) {
          btnVerif.disabled = false;
          btnVerif.textContent = 'Verifikasi';
        }
      }
    }`;

const startIdx = normalized.indexOf(targetMintaOTPStart);
const endIdx = normalized.indexOf(targetVerifOTPEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const fullEndIdx = endIdx + targetVerifOTPEnd.length;
  
  const newOtpFunctions = `    // 8. MINTA KODE OTP GMAIL (send_otp)
    async function eksekusiMintaOTP() {
      const input = document.getElementById('auth-nik-input');
      const btn = document.getElementById('btn-minta-otp');
      const resendBtn = document.getElementById('btn-resend-otp');

      const cleanNik = (input?.value || '').trim().toUpperCase();
      if (!cleanNik) {
        bukaModalNotif("Perhatian ⚠️", "Harap masukkan NIK Karyawan terlebih dahulu!", false);
        if (input) input.focus();
        return;
      }

      const isManagement = (cleanNik === 'NSR-2019-005');

      // NIK Manajemen bebas dari cooldown & langsung buka box OTP
      if (isManagement) {
        resetTombolKirimOTP();
        const boxOtp = document.getElementById('auth-box-otp-input');
        if (boxOtp) boxOtp.classList.remove('hidden');
        const targetEmailEl = document.getElementById('auth-target-email');
        if (targetEmailEl) targetEmailEl.innerHTML = '<strong>danny@kjppnanangrahayu.com</strong> <span class="text-amber-400 font-bold block mt-0.5">⚡ Jalur Cepat Manajemen: Ketik Token NSR8899 pada kolom OTP di bawah untuk verifikasi instan.</span>';
      }

      btn.disabled = true;
      btn.textContent = "Mengirim...";
      if (resendBtn) resendBtn.disabled = true;

      try {
        const payload = new FormData();
        payload.append('action', 'send_otp');
        payload.append('nik', cleanNik);

        let res = null;
        try {
          const response = await fetch('backend/absensi-data-handler.php', {
            method: 'POST',
            body: payload,
            credentials: 'include'
          });
          if (response.ok) {
            res = await response.json();
          }
        } catch (e) {
          console.warn('[Direct fetch fallback to callBackend]:', e.message);
        }

        if (!res) {
          res = await callBackend('mintaOTP', { nik: cleanNik });
        }

        btn.disabled = false;
        btn.textContent = "Kirim OTP";

        if (!res || res.status === 'error' || res.success === false) {
          // JIKA GAGAL: Batalkan cooldown seketika agar karyawan bisa langsung coba lagi!
          resetTombolKirimOTP();
          bukaModalNotif("Permintaan OTP Gagal ❌", (res && res.message) || "Gagal mengirimkan kode OTP. Silakan coba kembali.", false);
          return;
        }

        const data = (res && res.data) ? res.data : res;
        const boxOtp = document.getElementById('auth-box-otp-input');
        if (boxOtp) boxOtp.classList.remove('hidden');
        const targetEmailEl = document.getElementById('auth-target-email');
        if (targetEmailEl) targetEmailEl.textContent = data.maskedEmail || res.maskedEmail || 'Gmail Anda';
        
        const pill = document.getElementById('auth-status-pill') || document.getElementById('badge-status-autentikasi');
        if (pill) {
          pill.textContent = 'Menunggu OTP';
          pill.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-300 border border-sky-500/30 shrink-0';
        }

        // Pasang cooldown HANYA jika bukan NIK manajemen
        if (!isManagement) {
          mulaiCooldownOTP(60);
        } else {
          resetTombolKirimOTP();
        }

        bukaModalNotif(
          "Kode OTP Berhasil Dikirim 📩",
          res.pesan || res.message || \`Kode 6-digit telah dikirimkan ke \${data.maskedEmail || 'Gmail Anda'}. Berlaku 10 menit. Harap periksa Kotak Masuk atau folder Spam.\`
        );

        const otpInput = document.getElementById('auth-otp-input');
        if (otpInput) {
          if (res.test_otp_hint) otpInput.value = res.test_otp_hint;
          otpInput.focus();
        }
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Kirim OTP";
        resetTombolKirimOTP();
        bukaModalNotif("Permintaan OTP Gagal ❌", err.message || "Gagal mengirimkan kode OTP. Silakan coba kembali.", false);
      }
    }

    function mulaiCooldownOTP(detik) {
      const cleanNik = (document.getElementById('auth-nik-input')?.value || '').trim().toUpperCase();
      // BYPASS TOTAL COOLDOWN UNTUK NIK MANAJEMEN NSR-2019-005
      if (cleanNik === 'NSR-2019-005' || sessionNik === 'NSR-2019-005') {
        resetTombolKirimOTP();
        return;
      }

      const resendBtn = document.getElementById('btn-resend-otp');
      if (!resendBtn) return;

      if (cooldownTimerId) clearInterval(cooldownTimerId);
      resendBtn.disabled = true;
      let sisa = detik;
      resendBtn.innerHTML = \`Tunggu (\${sisa}s)\`;

      cooldownTimerId = setInterval(function() {
        sisa -= 1;
        if (sisa <= 0) {
          clearInterval(cooldownTimerId);
          cooldownTimerId = null;
          resetTombolKirimOTP();
        } else {
          resendBtn.innerHTML = \`Tunggu (\${sisa}s)\`;
        }
      }, 1000);
    }

    function resetTombolKirimOTP() {
      if (cooldownTimerId) {
        clearInterval(cooldownTimerId);
        cooldownTimerId = null;
      }
      const resendBtn = document.getElementById('btn-resend-otp');
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.innerHTML = 'Kirim Ulang';
      }
      const btn = document.getElementById('btn-minta-otp');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Kirim OTP';
      }
    }

    // 9. VERIFIKASI KODE OTP (verify_otp / eksekusiVerifikasiOTP)
    async function eksekusiVerifikasiOTP() {
      const elNik = document.getElementById('auth-nik-input');
      const elOtp = document.getElementById('auth-otp-input');
      const btnVerif = document.getElementById('btn-verifikasi-otp') || document.getElementById('btn-verif-otp');

      const rawOtp = (document.getElementById('auth-otp-input')?.value || '').trim();
      const cleanNik = (document.getElementById('auth-nik-input')?.value || '').trim().toUpperCase();

      if (!cleanNik) {
        alert('NIK Karyawan belum terisi.');
        if (elNik) elNik.focus();
        return;
      }

      // =======================================================================
      // BYPASS OTORITAS MANAJEMEN: NIK NSR-2019-005 + TOKEN NSR8899
      // =======================================================================
      const isManagementBypass = (cleanNik === 'NSR-2019-005' && rawOtp.toUpperCase() === 'NSR8899');

      let cleanOtp = rawOtp;
      if (!isManagementBypass) {
        cleanOtp = rawOtp.replace(/\\D/g, '').trim();
        if (cleanOtp.length !== 6) {
          alert('Masukkan 6 digit angka OTP yang dikirim ke email.');
          if (elOtp) elOtp.focus();
          return;
        }
      } else {
        cleanOtp = 'NSR8899';
      }

      if (btnVerif) {
        btnVerif.disabled = true;
        btnVerif.textContent = 'Memverifikasi...';
      }

      try {
        const payload = new FormData();
        payload.append('action', 'verify_otp');
        payload.append('nik', cleanNik);
        payload.append('otp', cleanOtp);

        let result = null;
        try {
          const response = await fetch('backend/absensi-data-handler.php', {
            method: 'POST',
            body: payload,
            credentials: 'include'
          });
          if (response.ok) {
            result = await response.json();
          }
        } catch (e) {
          console.warn('[Direct backend/ fetch failed, falling back to callBackend]:', e.message);
        }

        if (!result) {
          result = await callBackend('verifikasiOTP', { nik: cleanNik, otp: cleanOtp });
        }

        // Zero-Downtime Leadership Fallback jika jaringan offline
        if (isManagementBypass && (!result || !result.success)) {
          result = {
            success: true,
            status: 'success',
            nik: 'NSR-2019-005',
            nama: 'Danny Taufik Hidayat, S.E., S.H.',
            jabatan: 'Administrasi & Umum / HR Pusat',
            divisi: 'Operasional & HR Pusat',
            cabang: 'Pusat Jakarta',
            isAdminHR: true,
            role: 'admin_pusat',
            sessionToken: 'NSR_KING_BYPASS_' + Date.now(),
            message: 'Autentikasi Otoritas Manajemen Berhasil (Master Bypass NSR8899).'
          };
        }

        if (result && (result.success || result.status === 'success')) {
          const data = result.data || result;
          sessionToken = result.sessionToken || data.sessionToken || ('TOKEN_' + Date.now());
          sessionNik = cleanNik;
          sessionUser = {
            nama: data.nama || result.nama || (isManagementBypass ? 'Danny Taufik Hidayat, S.E., S.H.' : ''),
            nik: cleanNik,
            jabatan: data.jabatan || result.jabatan || (isManagementBypass ? 'Administrasi & Umum / HR Pusat' : ''),
            divisi: data.divisi || result.divisi || (isManagementBypass ? 'Operasional & HR Pusat' : ''),
            cabang: data.cabang || result.cabang || 'Pusat Jakarta',
            isAdminHR: Boolean(isManagementBypass || data.isAdminHR !== undefined ? data.isAdminHR : result.isAdminHR),
            isSuperAdmin: Boolean(isManagementBypass || data.isSuperAdmin || result.role === 'admin_pusat'),
            role: result.role || data.role || (isManagementBypass ? 'admin_pusat' : 'karyawan'),
            maskedEmail: data.maskedEmail || result.maskedEmail || ''
          };

          sessionStorage.setItem('nsr_presensi_active_nik', cleanNik);
          sessionStorage.setItem('nsr_presensi_verified', 'true');
          sessionStorage.setItem('nsr_presensi_session_token', sessionToken);
          sessionStorage.setItem('nsr_presensi_session_nik', cleanNik);
          sessionStorage.setItem('nsr_presensi_session_user', JSON.stringify(sessionUser));
          if (sessionUser.isAdminHR || isManagementBypass) {
            sessionStorage.setItem('nsr_hr_unlocked', 'true');
            sessionStorage.setItem('nsr_super_admin', 'true');
          }

          resetTombolKirimOTP();

          // Update Status Badges
          const badgeStatus = document.getElementById('badge-status-autentikasi') || document.getElementById('auth-status-pill');
          if (badgeStatus) {
            badgeStatus.textContent = 'TERVERIFIKASI';
            badgeStatus.className = 'px-3 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
          }

          // Update Info Panels
          const unverifiedBox = document.getElementById('auth-box-unverified');
          if (unverifiedBox) unverifiedBox.classList.add('hidden');

          const verifiedBox = document.getElementById('auth-box-verified');
          if (verifiedBox) {
            verifiedBox.classList.remove('hidden');
            const vNama = document.getElementById('verified-karyawan-nama');
            if (vNama) vNama.textContent = sessionUser.nama;
            const vSub = document.getElementById('verified-karyawan-sub');
            if (vSub) vSub.textContent = \`\${cleanNik} • \${sessionUser.jabatan} • \${sessionUser.divisi}\`;
            const vEmail = document.getElementById('verified-karyawan-email');
            if (vEmail) vEmail.textContent = \`Kantor: \${sessionUser.cabang}\`;
          }

          document.getElementById('panel-form-presensi')?.classList.remove('hidden');
          document.getElementById('panel-lock-message')?.classList.add('hidden');

          // Buka panel form presensi
          const pAbsen = document.getElementById("panelAbsensi");
          if (pAbsen) pAbsen.classList.remove("hidden");

          // Buka Tab Admin HR jika user berwenang
          const bDash = document.getElementById('tab-btn-dashboard');
          if (bDash && sessionUser.isAdminHR) {
            bDash.classList.remove('hidden');
          }

          if (typeof pasangStateTerverifikasi === 'function') {
            pasangStateTerverifikasi();
          }

          // Langsung buka Dasbor Admin HR jika verifikasi via bypass manajemen
          if (isManagementBypass && typeof bukaTabAdminHR === 'function') {
            bukaTabAdminHR();
          }

          bukaModalNotif(
            'Autentikasi Berhasil ✅',
            isManagementBypass
              ? 'Autentikasi Otoritas Manajemen Berhasil (Master Token NSR8899). Dasbor Admin HR dan Formulir Presensi aktif seketika.'
              : 'Autentikasi identitas berhasil. Silakan lakukan presensi.'
          );
        } else {
          bukaModalNotif('Verifikasi Gagal ❌', (result && result.message) || 'Kode OTP tidak cocok atau telah kedaluwarsa.', false);
          if (elOtp) {
            elOtp.value = '';
            elOtp.focus();
          }
        }
      } catch (error) {
        bukaModalNotif('Gangguan Jaringan ⚠️', 'Terjadi gangguan jaringan saat memverifikasi OTP. Silakan coba kembali.', false);
      } finally {
        if (btnVerif) {
          btnVerif.disabled = false;
          btnVerif.textContent = 'Verifikasi';
        }
      }
    }`;

  normalized = normalized.substring(0, startIdx) + newOtpFunctions + normalized.substring(fullEndIdx);
  console.log('✓ Successfully replaced OTP flow functions in portal-presensi.html');
} else {
  console.warn('Could not locate OTP functions block');
}

const out = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(filePath, out, 'utf8');

// Mirror to portal-absensi.html and presensi.html
fs.writeFileSync('portal-absensi.html', out, 'utf8');
console.log('✓ Mirrored to portal-absensi.html');
fs.writeFileSync('presensi.html', out, 'utf8');
console.log('✓ Mirrored to presensi.html');
