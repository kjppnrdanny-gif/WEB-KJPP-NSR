/**
 * OPINI NSR — Unified Internal Portal Modal Engine
 * Standar Tunggal Otorisasi & Navigasi Internal KJPP Nanang Rahayu Sigit Paryanto & Rekan
 */
(function() {
    // ==========================================================
    // OPINI NSR — SSOT MODAL HEADER TEMPLATE & RESILIENCE ENGINE
    // KJPP Nanang Rahayu Sigit Paryanto dan Rekan • Izin KMK No. 2.19.0160
    // ==========================================================
    const OPINI_NSR_MODAL_HEADER_HTML = `<!-- HEADER RESMI MODAL OPINI NSR -->
<div class="space-y-2.5 mb-5 select-none">
  <!-- Baris Badge Identitas & Izin Usaha -->
  <div class="flex flex-wrap items-center gap-2">
    <!-- Kapsul Identitas Resmi Entitas & Izin KMK -->
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/30 shadow-sm">
      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
      <span class="leading-snug break-words">KJPP Nanang Rahayu Sigit Paryanto dan Rekan • Izin KMK No. 2.19.0160</span>
    </div>

    <!-- Kapsul Akses Operasional -->
    <div class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold text-slate-300 bg-slate-800/80 border border-slate-700/80">
      Akses Terpadu 5 Kantor
    </div>
  </div>

  <!-- Baris Judul & Akronim Resmi -->
  <div>
    <h3 class="text-xl sm:text-2xl md:text-3xl font-black text-amber-400 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
      <span>OPINI NSR</span>
      <span class="text-xs sm:text-sm md:text-base font-semibold text-slate-300">
        (Otorisasi Penilaian, Informasi, & Navigasi Internal KJPP NSR)
      </span>
    </h3>
    <p class="text-[11px] sm:text-xs md:text-sm text-amber-400/90 font-medium mt-0.5">
      OPINI NSR • Dari Data Lapangan Menjadi Opini yang Andal
    </p>
  </div>
</div>`;
    window.OPINI_NSR_MODAL_HEADER_HTML = OPINI_NSR_MODAL_HEADER_HTML;

    const NSR_SECURITY_SALT = 'KJPP_NSR_2026_CORE_AUTH::';
    const NSR_CHECKSUM_SALT = 'NSR_SESSION_INTEGRITY_2026_x7k9::';
    const NSR_SEC_SALT = 'NSR_ZERO_TRUST_SIG_2026_9x4m';

    function sha256Hex(ascii) {
      function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
      var mathPow = Math.pow, maxWord = mathPow(2, 32), l = ascii.length, i, j, res = '', words = [];
      var asciiBitLength = l * 8, hash = [], k = [], primeCounter = 0, isComp = {};
      for (var c = 2; primeCounter < 64; c++) {
        if (!isComp[c]) {
          for (i = 0; i < 313; i += c) isComp[i] = c;
          hash[primeCounter] = (mathPow(c, .5) * maxWord) | 0;
          k[primeCounter++] = (mathPow(c, 1/3) * maxWord) | 0;
        }
      }
      ascii += '\x80';
      while (ascii.length % 64 - 56) ascii += '\x00';
      for (i = 0; i < ascii.length; i++) {
        j = ascii.charCodeAt(i);
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
      }
      words[words.length] = ((asciiBitLength / maxWord) | 0);
      words[words.length] = (asciiBitLength) | 0;
      for (j = 0; j < words.length;) {
        var w = words.slice(j, j += 16), oldHash = hash;
        hash = hash.slice(0, 8);
        for (i = 0; i < 64; i++) {
          var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
          var t1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
          var t2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
          hash = [(t1 + t2) | 0].concat(hash);
          hash[4] = (hash[4] + t1) | 0;
        }
        for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
      }
      for (i = 0; i < 8; i++) {
        for (var i2 = 3; i2 >= 0; i2--) {
          var b = (hash[i] >> (i2 * 8)) & 255;
          res += ((b < 16) ? '0' : '') + b.toString(16);
        }
      }
      return res;
    }

    function computeTokenHashSync(rawToken) {
      if (!rawToken || typeof rawToken !== 'string') return '';
      const clean = rawToken.trim().toUpperCase();
      return sha256Hex(NSR_SECURITY_SALT + clean);
    }

    function computeSessionChecksum(tokenHash, role, wilayah, expiresAt, isSuperAdmin) {
      const payload = [tokenHash || '', role || '', wilayah || '', expiresAt || '', isSuperAdmin ? '1' : '0', NSR_CHECKSUM_SALT].join('|');
      return sha256Hex(payload);
    }

    function verifySessionChecksum(sess) {
      if (!sess || !sess.tokenHash) return false;
      const expectedChecksum = computeSessionChecksum(
        sess.tokenHash,
        sess.role,
        sess.wilayah,
        sess.expiresAt || sess.loginTime,
        sess.isSuperAdmin
      );
      if (sess.sessionChecksum && sess.sessionChecksum === expectedChecksum) return true;
      if (sess.sig) {
        const legacyExpected = sha256Hex(String(sess.tokenHash || '') + ':' + String(sess.loginTime || sess.expiresAt || '') + ':' + String(sess.role || '') + ':' + (sess.isSuperAdmin ? '1' : '0') + ':' + NSR_SEC_SALT);
        if (sess.sig === legacyExpected) return true;
      }
      return false;
    }

    function generateSessionSignature(tokenHash, loginTime, role, isSuperAdmin) {
      return computeSessionChecksum(tokenHash, role, '', loginTime, isSuperAdmin);
    }

    function verifySessionSignature(sess) {
      return verifySessionChecksum(sess);
    }

    function auditSessionIntegrity() {
      const rawSession = sessionStorage.getItem('NSR_USER_SESSION');
      if (!rawSession) return true;
      try {
        const parsed = JSON.parse(rawSession);
        if (!verifySessionChecksum(parsed)) {
          console.warn('⚠️ Anti-Tampering Violation: Manipulasi data sesi lokal terdeteksi.');
          sessionStorage.clear();
          localStorage.removeItem('kjpp_token_auth');
          localStorage.removeItem('kjpp_session_token');
          alert('⚠️ PELANGGARAN INTEGRITAS KEAMANAN!\n\nManipulasi data sesi lokal terdeteksi oleh sistem Zero-Trust. Sesi Anda telah dimatikan secara paksa.');
          window.location.replace('index.html');
          return false;
        }
      } catch (_) {
        sessionStorage.clear();
        return false;
      }
      return true;
    }

    window.sha256Hex = sha256Hex;
    window.computeTokenHashSync = computeTokenHashSync;
    window.computeSessionChecksum = computeSessionChecksum;
    window.verifySessionChecksum = verifySessionChecksum;
    window.generateSessionSignature = generateSessionSignature;
    window.verifySessionSignature = verifySessionSignature;
    window.auditSessionIntegrity = auditSessionIntegrity;

    function resolveUnifiedToken(rawToken) {
      if (!rawToken || typeof rawToken !== 'string') return null;

      function _internalSha256Hex(ascii) {
        function rightRotate(v, a) { return (v >>> a) | (v << (32 - a)); }
        var mathPow = Math.pow, maxWord = mathPow(2, 32), l = ascii.length, i, j, res = '', words = [];
        var asciiBitLength = l * 8, hash = [], k = [], primeCounter = 0, isComp = {};
        for (var c = 2; primeCounter < 64; c++) {
          if (!isComp[c]) {
            for (i = 0; i < 313; i += c) isComp[i] = c;
            hash[primeCounter] = (mathPow(c, .5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(c, 1/3) * maxWord) | 0;
          }
        }
        ascii += '\x80';
        while (ascii.length % 64 - 56) ascii += '\x00';
        for (i = 0; i < ascii.length; i++) {
          j = ascii.charCodeAt(i);
          words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words.length] = ((asciiBitLength / maxWord) | 0);
        words[words.length] = (asciiBitLength) | 0;
        for (j = 0; j < words.length;) {
          var w = words.slice(j, j += 16), oldHash = hash;
          hash = hash.slice(0, 8);
          for (i = 0; i < 64; i++) {
            var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
            var t1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
            var t2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
            hash = [(t1 + t2) | 0].concat(hash);
            hash[4] = (hash[4] + t1) | 0;
          }
          for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
        }
        for (i = 0; i < 8; i++) {
          for (var i2 = 3; i2 >= 0; i2--) {
            var b = (hash[i] >> (i2 * 8)) & 255;
            res += ((b < 16) ? '0' : '') + b.toString(16);
          }
        }
        return res;
      }

      const clean = rawToken.trim().toUpperCase();
      const AUTH_HASH_REGISTRY = {
      'f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721': {"valid":true,"role":"SURVEYOR","roleLabel":"Surveyor","displayRole":"Surveyor Lapangan","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","cabang":"Pusat","label":"Kantor Pusat Jakarta (Surveyor)","jabatan":"Surveyor Lapangan","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721"},
      '422e642284f66071b52b6cd23e4856ee7e5acf6735f0bc5754173c270c487d4b': {"valid":true,"role":"SURVEYOR","roleLabel":"Surveyor","displayRole":"Surveyor Lapangan","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","cabang":"Pusat","label":"Kantor Pusat Jakarta (Surveyor)","jabatan":"Surveyor Lapangan","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"f0e728cbb8ea9ea8b8b53908922bffc081dc22e50855f9d4601a14ed513d7721"},
      '57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0': {"valid":true,"role":"KEUANGAN","roleLabel":"Keuangan Pusat","displayRole":"Divisi Keuangan & Kasir Pusat","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","cabang":"Pusat","label":"Kantor Pusat Jakarta (Keuangan Pusat)","jabatan":"Divisi Keuangan & Kasir Pusat","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":false,"feeMaskText":"","tokenHash":"57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0"},
      '107ee87beefd50d3ecf4c3ea6716c22cbff5330505ee747ce5d800f77c94f32d': {"valid":true,"role":"KEUANGAN","roleLabel":"Keuangan Pusat","displayRole":"Divisi Keuangan & Kasir Pusat","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","cabang":"Pusat","label":"Kantor Pusat Jakarta (Keuangan Pusat)","jabatan":"Divisi Keuangan & Kasir Pusat","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":false,"feeMaskText":"","tokenHash":"57344967696ffd47737ce0558f151d480c8ac15ee94ecfbe9b045d25d123e6a0"},
      'a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9': {"valid":true,"role":"KEUANGAN_CABANG","roleLabel":"Keuangan Cabang","displayRole":"Kasir & Keuangan Cabang","wilayah":"CABANG","wilayahLabel":"Kantor Cabang Operasional","wilayahResmi":"Kantor Cabang Operasional","wilayahCode":"CAB","nama":"Kantor Cabang Operasional","kantor":"Kantor Cabang Operasional","namaKantor":"Kantor Cabang Operasional","cabang":"Cabang","label":"Kantor Cabang Operasional (Keuangan Cabang)","jabatan":"Kasir & Keuangan Cabang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"feeMaskText":"","tokenHash":"a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9"},
      'a01d6024094ea8618268233f1e73d79e400c76d36abb144b2d087896f2e3a6ca': {"valid":true,"role":"KEUANGAN_CABANG","roleLabel":"Keuangan Cabang","displayRole":"Kasir & Keuangan Cabang","wilayah":"CABANG","wilayahLabel":"Kantor Cabang Operasional","wilayahResmi":"Kantor Cabang Operasional","wilayahCode":"CAB","nama":"Kantor Cabang Operasional","kantor":"Kantor Cabang Operasional","namaKantor":"Kantor Cabang Operasional","cabang":"Cabang","label":"Kantor Cabang Operasional (Keuangan Cabang)","jabatan":"Kasir & Keuangan Cabang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"feeMaskText":"","tokenHash":"a9a08ee5cc8f8f8281a4f846624a35ed29a8af6ea20614089e8b64cfb01d32e9"},
      '387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f"},
      '47e9420b3a60a28be92802a6b88515da8f3fdaa624a86a9d9e57d60b859ab7c0': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"387f1132894c759ea61674434d9e7f34958a5445dc4f20c408a4a5b251396e5f"},
      '87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c"},
      '34e689e4b4b12f107e810fd8f48f8a4677e1a1645f0dd4232a9240fecc2d10c2': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"87a9fd928aecca6f78beb856d1bb5a1399c1be00d5cbe97a8fd1b098dfdd7b2c"},
      'c1def53c9c35c3e150d4f070fd2387a16f5e0ca57f6ca9fe23f368769ee4bc2f': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"c1def53c9c35c3e150d4f070fd2387a16f5e0ca57f6ca9fe23f368769ee4bc2f"},
      'c8a385e623ccc15d78c5c7d3632f07f089a873de23b1098cbafb2c21415f2b91': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"c1def53c9c35c3e150d4f070fd2387a16f5e0ca57f6ca9fe23f368769ee4bc2f"},
      '4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04"},
      '116f1fc38a65e1f069d617ef30be1bd2c693e9cb69950ea475a694af2594dd99': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"4bdd71ba9f372106b9b52f9f0e8c1e6cfa4afb12857ff3f760b3df74dce0ca04"},
      'd65d47db2033ecca88859a0dc76f1245b5a71cdefeea2043b5c4177a1162cf79': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"d65d47db2033ecca88859a0dc76f1245b5a71cdefeea2043b5c4177a1162cf79"},
      '1bc922ff0ec6e30513822137b153bd0f067c8dd2d93c615ae8efc74f62867aaa': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"d65d47db2033ecca88859a0dc76f1245b5a71cdefeea2043b5c4177a1162cf79"},
      'b95dca135f05d89f9481f7f7a23d67d11088edcaad811c2538869925fdd9cf9b': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"b95dca135f05d89f9481f7f7a23d67d11088edcaad811c2538869925fdd9cf9b"},
      '90dcc577539898e27a73039150b137fe6ef7d437eb3e2425ff52d3a7cb7cfd3c': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"b95dca135f05d89f9481f7f7a23d67d11088edcaad811c2538869925fdd9cf9b"},
      '12bbe38f31dcdd0d7e16bbb237fadc8dec07265ed0e1bb3da271f599592e835c': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"12bbe38f31dcdd0d7e16bbb237fadc8dec07265ed0e1bb3da271f599592e835c"},
      'b347f814a2f3d21306b0b8eae02611c1f4947abfd2f4e17d3bff343cfb6339c1': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"12bbe38f31dcdd0d7e16bbb237fadc8dec07265ed0e1bb3da271f599592e835c"},
      'b9638cd7124e4905ed4e72d6300ec44c5e369421469fe8d7801e20d337633021': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"b9638cd7124e4905ed4e72d6300ec44c5e369421469fe8d7801e20d337633021"},
      '58e70e6ee9bc4c777170b7af6645b0be5b17c238ea81451c7c7cacadf2de469a': {"valid":true,"role":"SUPER ADMIN","roleLabel":"SUPER ADMIN • KANTOR PUSAT","displayRole":"SUPER ADMIN • KANTOR PUSAT","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (SUPER ADMIN • KANTOR PUSAT)","jabatan":"Super Admin / Master Otoritas","isCabang":false,"isSuperAdmin":true,"aksesApproval":true,"aksesKwitansi":true,"aksesFee":true,"mode":"PUSAT","canAccessKwitansi":true,"seeFee":true,"canApprove":true,"canApprovePusat":true,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":true,"tokenHash":"b9638cd7124e4905ed4e72d6300ec44c5e369421469fe8d7801e20d337633021"},
      '974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d': {"valid":true,"kode":"2.0160-04","kodeKantor":"2.0160-04","kodeWilayah":"2.0160-04","nama":"Kantor Cabang Bandung","kantor":"Kantor Cabang Bandung","namaKantor":"Kantor Cabang Bandung","rekan":"Deni Siswandi, S.T., MAPPI (Cert.)","rekanNama":"Deni Siswandi, S.T., MAPPI (Cert.)","pimpinan":"Deni Siswandi, S.T., MAPPI (Cert.)","otoritas":"Deni Siswandi, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Bandung","displayRole":"Admin Kantor Cabang Bandung","label":"Kantor Cabang Bandung (Admin Cabang Bandung)","wilayah":"Bandung","wilayahLabel":"Kantor Cabang Bandung","wilayahResmi":"Kantor Cabang Bandung","wilayahCode":"BDG","cabang":"Bandung","jabatan":"Admin Kantor Cabang Bandung","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d"},
      'bcd695bca78dc5ba9049afde667fc0c0e81409e9f4aee317936b24634d8bb818': {"valid":true,"kode":"2.0160-04","kodeKantor":"2.0160-04","kodeWilayah":"2.0160-04","nama":"Kantor Cabang Bandung","kantor":"Kantor Cabang Bandung","namaKantor":"Kantor Cabang Bandung","rekan":"Deni Siswandi, S.T., MAPPI (Cert.)","rekanNama":"Deni Siswandi, S.T., MAPPI (Cert.)","pimpinan":"Deni Siswandi, S.T., MAPPI (Cert.)","otoritas":"Deni Siswandi, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Bandung","displayRole":"Admin Kantor Cabang Bandung","label":"Kantor Cabang Bandung (Admin Cabang Bandung)","wilayah":"Bandung","wilayahLabel":"Kantor Cabang Bandung","wilayahResmi":"Kantor Cabang Bandung","wilayahCode":"BDG","cabang":"Bandung","jabatan":"Admin Kantor Cabang Bandung","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"974e90dc35652f926a4951c49ab969a70df89f90f82af08419a0d13bfe4e927d"},
      '2744adc6a1f8ddcb761536669297f5c662d9226b6f41f6b1bcdc7b5e3f68d053': {"valid":true,"kode":"2.0160-04","kodeKantor":"2.0160-04","kodeWilayah":"2.0160-04","nama":"Kantor Cabang Bandung","kantor":"Kantor Cabang Bandung","namaKantor":"Kantor Cabang Bandung","rekan":"Deni Siswandi, S.T., MAPPI (Cert.)","rekanNama":"Deni Siswandi, S.T., MAPPI (Cert.)","pimpinan":"Deni Siswandi, S.T., MAPPI (Cert.)","otoritas":"Deni Siswandi, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Bandung","displayRole":"Admin Kantor Cabang Bandung","label":"Kantor Cabang Bandung (Admin Cabang Bandung)","wilayah":"Bandung","wilayahLabel":"Kantor Cabang Bandung","wilayahResmi":"Kantor Cabang Bandung","wilayahCode":"BDG","cabang":"Bandung","jabatan":"Admin Kantor Cabang Bandung","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"2744adc6a1f8ddcb761536669297f5c662d9226b6f41f6b1bcdc7b5e3f68d053"},
      '8d8ec827ee483752270d6256bb79de6662253f891e52842625ecc60af6e25878': {"valid":true,"kode":"2.0160-04","kodeKantor":"2.0160-04","kodeWilayah":"2.0160-04","nama":"Kantor Cabang Bandung","kantor":"Kantor Cabang Bandung","namaKantor":"Kantor Cabang Bandung","rekan":"Deni Siswandi, S.T., MAPPI (Cert.)","rekanNama":"Deni Siswandi, S.T., MAPPI (Cert.)","pimpinan":"Deni Siswandi, S.T., MAPPI (Cert.)","otoritas":"Deni Siswandi, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Bandung","displayRole":"Admin Kantor Cabang Bandung","label":"Kantor Cabang Bandung (Admin Cabang Bandung)","wilayah":"Bandung","wilayahLabel":"Kantor Cabang Bandung","wilayahResmi":"Kantor Cabang Bandung","wilayahCode":"BDG","cabang":"Bandung","jabatan":"Admin Kantor Cabang Bandung","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"2744adc6a1f8ddcb761536669297f5c662d9226b6f41f6b1bcdc7b5e3f68d053"},
      'db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495': {"valid":true,"kode":"2.0160-01","kodeKantor":"2.0160-01","kodeWilayah":"2.0160-01","nama":"Kantor Cabang Padang","kantor":"Kantor Cabang Padang","namaKantor":"Kantor Cabang Padang","rekan":"Hernita, S.E., MAPPI (Cert.)","rekanNama":"Hernita, S.E., MAPPI (Cert.)","pimpinan":"Hernita, S.E., MAPPI (Cert.)","otoritas":"Hernita, S.E., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Padang","displayRole":"Admin Kantor Cabang Padang","label":"Kantor Cabang Padang (Admin Cabang Padang)","wilayah":"Padang","wilayahLabel":"Kantor Cabang Padang","wilayahResmi":"Kantor Cabang Padang","wilayahCode":"PDG","cabang":"Padang","jabatan":"Admin Kantor Cabang Padang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495"},
      '45b948d3c75010dcf2b4963c1275e2f0c982df88658616b3d0edaae59e9cd62c': {"valid":true,"kode":"2.0160-01","kodeKantor":"2.0160-01","kodeWilayah":"2.0160-01","nama":"Kantor Cabang Padang","kantor":"Kantor Cabang Padang","namaKantor":"Kantor Cabang Padang","rekan":"Hernita, S.E., MAPPI (Cert.)","rekanNama":"Hernita, S.E., MAPPI (Cert.)","pimpinan":"Hernita, S.E., MAPPI (Cert.)","otoritas":"Hernita, S.E., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Padang","displayRole":"Admin Kantor Cabang Padang","label":"Kantor Cabang Padang (Admin Cabang Padang)","wilayah":"Padang","wilayahLabel":"Kantor Cabang Padang","wilayahResmi":"Kantor Cabang Padang","wilayahCode":"PDG","cabang":"Padang","jabatan":"Admin Kantor Cabang Padang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"db6da2b4cde952d408263966d2106faebe6ff26c5df15656961d5c1e64ab0495"},
      'e8abc5817053f821e6b38767d7f72456d150295007b9969e7f4bf946e0b38e0f': {"valid":true,"kode":"2.0160-01","kodeKantor":"2.0160-01","kodeWilayah":"2.0160-01","nama":"Kantor Cabang Padang","kantor":"Kantor Cabang Padang","namaKantor":"Kantor Cabang Padang","rekan":"Hernita, S.E., MAPPI (Cert.)","rekanNama":"Hernita, S.E., MAPPI (Cert.)","pimpinan":"Hernita, S.E., MAPPI (Cert.)","otoritas":"Hernita, S.E., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Padang","displayRole":"Admin Kantor Cabang Padang","label":"Kantor Cabang Padang (Admin Cabang Padang)","wilayah":"Padang","wilayahLabel":"Kantor Cabang Padang","wilayahResmi":"Kantor Cabang Padang","wilayahCode":"PDG","cabang":"Padang","jabatan":"Admin Kantor Cabang Padang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"e8abc5817053f821e6b38767d7f72456d150295007b9969e7f4bf946e0b38e0f"},
      'a9df00e327795467cd60fad518eee698a0d82730f5c940816c07f176bf77f2c3': {"valid":true,"kode":"2.0160-01","kodeKantor":"2.0160-01","kodeWilayah":"2.0160-01","nama":"Kantor Cabang Padang","kantor":"Kantor Cabang Padang","namaKantor":"Kantor Cabang Padang","rekan":"Hernita, S.E., MAPPI (Cert.)","rekanNama":"Hernita, S.E., MAPPI (Cert.)","pimpinan":"Hernita, S.E., MAPPI (Cert.)","otoritas":"Hernita, S.E., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Padang","displayRole":"Admin Kantor Cabang Padang","label":"Kantor Cabang Padang (Admin Cabang Padang)","wilayah":"Padang","wilayahLabel":"Kantor Cabang Padang","wilayahResmi":"Kantor Cabang Padang","wilayahCode":"PDG","cabang":"Padang","jabatan":"Admin Kantor Cabang Padang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"e8abc5817053f821e6b38767d7f72456d150295007b9969e7f4bf946e0b38e0f"},
      'f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569': {"valid":true,"kode":"2.0160-02","kodeKantor":"2.0160-02","kodeWilayah":"2.0160-02","nama":"Kantor Cabang Makassar","kantor":"Kantor Cabang Makassar","namaKantor":"Kantor Cabang Makassar","rekan":"M. Amin Sade, S.E., MAPPI (Cert.)","rekanNama":"M. Amin Sade, S.E., MAPPI (Cert.)","pimpinan":"M. Amin Sade, S.E., MAPPI (Cert.)","otoritas":"M. Amin Sade, S.E., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Makassar","displayRole":"Admin Kantor Cabang Makassar","label":"Kantor Cabang Makassar (Admin Cabang Makassar)","wilayah":"Makassar","wilayahLabel":"Kantor Cabang Makassar","wilayahResmi":"Kantor Cabang Makassar","wilayahCode":"MKS","cabang":"Makassar","jabatan":"Admin Kantor Cabang Makassar","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569"},
      '26b296fa1352b67bae6d91added689f695fe52d2500aa9d58f7cbf91826e613e': {"valid":true,"kode":"2.0160-02","kodeKantor":"2.0160-02","kodeWilayah":"2.0160-02","nama":"Kantor Cabang Makassar","kantor":"Kantor Cabang Makassar","namaKantor":"Kantor Cabang Makassar","rekan":"M. Amin Sade, S.E., MAPPI (Cert.)","rekanNama":"M. Amin Sade, S.E., MAPPI (Cert.)","pimpinan":"M. Amin Sade, S.E., MAPPI (Cert.)","otoritas":"M. Amin Sade, S.E., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Makassar","displayRole":"Admin Kantor Cabang Makassar","label":"Kantor Cabang Makassar (Admin Cabang Makassar)","wilayah":"Makassar","wilayahLabel":"Kantor Cabang Makassar","wilayahResmi":"Kantor Cabang Makassar","wilayahCode":"MKS","cabang":"Makassar","jabatan":"Admin Kantor Cabang Makassar","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"f5aadfecaf3ab9a3440cf6e0886514d80a7ea78925e9e8eaa9e303f7f0474569"},
      'b3102a30c374eb0726ef2ba4ef6a9e0d324ee99e775b83683182eb9117bfd1c6': {"valid":true,"kode":"2.0160-02","kodeKantor":"2.0160-02","kodeWilayah":"2.0160-02","nama":"Kantor Cabang Makassar","kantor":"Kantor Cabang Makassar","namaKantor":"Kantor Cabang Makassar","rekan":"M. Amin Sade, S.E., MAPPI (Cert.)","rekanNama":"M. Amin Sade, S.E., MAPPI (Cert.)","pimpinan":"M. Amin Sade, S.E., MAPPI (Cert.)","otoritas":"M. Amin Sade, S.E., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Makassar","displayRole":"Admin Kantor Cabang Makassar","label":"Kantor Cabang Makassar (Admin Cabang Makassar)","wilayah":"Makassar","wilayahLabel":"Kantor Cabang Makassar","wilayahResmi":"Kantor Cabang Makassar","wilayahCode":"MKS","cabang":"Makassar","jabatan":"Admin Kantor Cabang Makassar","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"b3102a30c374eb0726ef2ba4ef6a9e0d324ee99e775b83683182eb9117bfd1c6"},
      '05080f9dc585d39a2234f19ba420a83162249731bfea9e3ca0e733953d5efd95': {"valid":true,"kode":"2.0160-02","kodeKantor":"2.0160-02","kodeWilayah":"2.0160-02","nama":"Kantor Cabang Makassar","kantor":"Kantor Cabang Makassar","namaKantor":"Kantor Cabang Makassar","rekan":"M. Amin Sade, S.E., MAPPI (Cert.)","rekanNama":"M. Amin Sade, S.E., MAPPI (Cert.)","pimpinan":"M. Amin Sade, S.E., MAPPI (Cert.)","otoritas":"M. Amin Sade, S.E., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Makassar","displayRole":"Admin Kantor Cabang Makassar","label":"Kantor Cabang Makassar (Admin Cabang Makassar)","wilayah":"Makassar","wilayahLabel":"Kantor Cabang Makassar","wilayahResmi":"Kantor Cabang Makassar","wilayahCode":"MKS","cabang":"Makassar","jabatan":"Admin Kantor Cabang Makassar","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"b3102a30c374eb0726ef2ba4ef6a9e0d324ee99e775b83683182eb9117bfd1c6"},
      'e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827': {"valid":true,"kode":"2.0160-03","kodeKantor":"2.0160-03","kodeWilayah":"2.0160-03","nama":"Kantor Cabang Palembang","kantor":"Kantor Cabang Palembang","namaKantor":"Kantor Cabang Palembang","rekan":"Dharma Priyanto, S.T., MAPPI (Cert.)","rekanNama":"Dharma Priyanto, S.T., MAPPI (Cert.)","pimpinan":"Dharma Priyanto, S.T., MAPPI (Cert.)","otoritas":"Dharma Priyanto, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Palembang","displayRole":"Admin Kantor Cabang Palembang","label":"Kantor Cabang Palembang (Admin Cabang Palembang)","wilayah":"Palembang","wilayahLabel":"Kantor Cabang Palembang","wilayahResmi":"Kantor Cabang Palembang","wilayahCode":"PLB","cabang":"Palembang","jabatan":"Admin Kantor Cabang Palembang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827"},
      '1a3789dcc80802cfeeee3436a5297f946f88fd5e0e576de39849a3bffc0af31b': {"valid":true,"kode":"2.0160-03","kodeKantor":"2.0160-03","kodeWilayah":"2.0160-03","nama":"Kantor Cabang Palembang","kantor":"Kantor Cabang Palembang","namaKantor":"Kantor Cabang Palembang","rekan":"Dharma Priyanto, S.T., MAPPI (Cert.)","rekanNama":"Dharma Priyanto, S.T., MAPPI (Cert.)","pimpinan":"Dharma Priyanto, S.T., MAPPI (Cert.)","otoritas":"Dharma Priyanto, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Palembang","displayRole":"Admin Kantor Cabang Palembang","label":"Kantor Cabang Palembang (Admin Cabang Palembang)","wilayah":"Palembang","wilayahLabel":"Kantor Cabang Palembang","wilayahResmi":"Kantor Cabang Palembang","wilayahCode":"PLB","cabang":"Palembang","jabatan":"Admin Kantor Cabang Palembang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"e5298836aaaed72f1974a3191d5a23d59bb3990003ca7a288f9a41b2045d9827"},
      'a36ae83ec2bf554d6181fba2a0dca6ed8a50418834eab7233a050b93fccb0fb2': {"valid":true,"kode":"2.0160-03","kodeKantor":"2.0160-03","kodeWilayah":"2.0160-03","nama":"Kantor Cabang Palembang","kantor":"Kantor Cabang Palembang","namaKantor":"Kantor Cabang Palembang","rekan":"Dharma Priyanto, S.T., MAPPI (Cert.)","rekanNama":"Dharma Priyanto, S.T., MAPPI (Cert.)","pimpinan":"Dharma Priyanto, S.T., MAPPI (Cert.)","otoritas":"Dharma Priyanto, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Palembang","displayRole":"Admin Kantor Cabang Palembang","label":"Kantor Cabang Palembang (Admin Cabang Palembang)","wilayah":"Palembang","wilayahLabel":"Kantor Cabang Palembang","wilayahResmi":"Kantor Cabang Palembang","wilayahCode":"PLB","cabang":"Palembang","jabatan":"Admin Kantor Cabang Palembang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"a36ae83ec2bf554d6181fba2a0dca6ed8a50418834eab7233a050b93fccb0fb2"},
      'c20c16d688a686f8cd5ac12f4949b8dac6b4937d513f92a00514ee6122368ed2': {"valid":true,"kode":"2.0160-03","kodeKantor":"2.0160-03","kodeWilayah":"2.0160-03","nama":"Kantor Cabang Palembang","kantor":"Kantor Cabang Palembang","namaKantor":"Kantor Cabang Palembang","rekan":"Dharma Priyanto, S.T., MAPPI (Cert.)","rekanNama":"Dharma Priyanto, S.T., MAPPI (Cert.)","pimpinan":"Dharma Priyanto, S.T., MAPPI (Cert.)","otoritas":"Dharma Priyanto, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Palembang","displayRole":"Admin Kantor Cabang Palembang","label":"Kantor Cabang Palembang (Admin Cabang Palembang)","wilayah":"Palembang","wilayahLabel":"Kantor Cabang Palembang","wilayahResmi":"Kantor Cabang Palembang","wilayahCode":"PLB","cabang":"Palembang","jabatan":"Admin Kantor Cabang Palembang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"a36ae83ec2bf554d6181fba2a0dca6ed8a50418834eab7233a050b93fccb0fb2"},
      'd54abce9045452c4900da5ab86ce8cd17051d7b24c3d42a1cc764c029c91db97': {"valid":true,"kode":"2.0160-03","kodeKantor":"2.0160-03","kodeWilayah":"2.0160-03","nama":"Kantor Cabang Palembang","kantor":"Kantor Cabang Palembang","namaKantor":"Kantor Cabang Palembang","rekan":"Dharma Priyanto, S.T., MAPPI (Cert.)","rekanNama":"Dharma Priyanto, S.T., MAPPI (Cert.)","pimpinan":"Dharma Priyanto, S.T., MAPPI (Cert.)","otoritas":"Dharma Priyanto, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Palembang","displayRole":"Admin Kantor Cabang Palembang","label":"Kantor Cabang Palembang (Admin Cabang Palembang)","wilayah":"Palembang","wilayahLabel":"Kantor Cabang Palembang","wilayahResmi":"Kantor Cabang Palembang","wilayahCode":"PLB","cabang":"Palembang","jabatan":"Admin Kantor Cabang Palembang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"d54abce9045452c4900da5ab86ce8cd17051d7b24c3d42a1cc764c029c91db97"},
      '4ea09485c491d4b43e42ebf0b64f912fcfa9608b5ceecd8b413f6b349298fadb': {"valid":true,"kode":"2.0160-03","kodeKantor":"2.0160-03","kodeWilayah":"2.0160-03","nama":"Kantor Cabang Palembang","kantor":"Kantor Cabang Palembang","namaKantor":"Kantor Cabang Palembang","rekan":"Dharma Priyanto, S.T., MAPPI (Cert.)","rekanNama":"Dharma Priyanto, S.T., MAPPI (Cert.)","pimpinan":"Dharma Priyanto, S.T., MAPPI (Cert.)","otoritas":"Dharma Priyanto, S.T., MAPPI (Cert.)","role":"ADMIN_CABANG","roleLabel":"Admin Cabang Palembang","displayRole":"Admin Kantor Cabang Palembang","label":"Kantor Cabang Palembang (Admin Cabang Palembang)","wilayah":"Palembang","wilayahLabel":"Kantor Cabang Palembang","wilayahResmi":"Kantor Cabang Palembang","wilayahCode":"PLB","cabang":"Palembang","jabatan":"Admin Kantor Cabang Palembang","isCabang":true,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":true,"aksesFee":true,"mode":"CABANG","canAccessKwitansi":true,"seeFee":true,"canApprove":false,"canApproveCabang":true,"canSubmit":true,"canInputForm":true,"lockWilayah":true,"canManageSU":false,"tokenHash":"d54abce9045452c4900da5ab86ce8cd17051d7b24c3d42a1cc764c029c91db97"},
      '9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59': {"valid":true,"role":"MARKETING","roleLabel":"Marketing","displayRole":"Divisi Business Development & Marketing","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Marketing)","jabatan":"Divisi Business Development & Marketing","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59"},
      '336c1d03b83f9a89f3f1fc33cc42192345b435f6e72f8e72ad43aaaaae6310fe': {"valid":true,"role":"MARKETING","roleLabel":"Marketing","displayRole":"Divisi Business Development & Marketing","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Marketing)","jabatan":"Divisi Business Development & Marketing","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"9977faeecaba8f98d6639482a0d7160d66a3886f5af70be176de7f9632562b59"},
      'eff2b43ab4c8698bb7693f0d10d39a2545901700a725bfe0261a64ab763fca8a': {"valid":true,"role":"MARKETING","roleLabel":"Marketing","displayRole":"Divisi Business Development & Marketing","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Marketing)","jabatan":"Divisi Business Development & Marketing","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"eff2b43ab4c8698bb7693f0d10d39a2545901700a725bfe0261a64ab763fca8a"},
      '4e3adf0db7e032e6355260d6c6d2428756e6b9b1cd2c0a00daab5672d336ec52': {"valid":true,"role":"MARKETING","roleLabel":"Marketing","displayRole":"Divisi Business Development & Marketing","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Marketing)","jabatan":"Divisi Business Development & Marketing","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":true,"canInputForm":true,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"eff2b43ab4c8698bb7693f0d10d39a2545901700a725bfe0261a64ab763fca8a"},
      'cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9': {"valid":true,"role":"REVIEWER","roleLabel":"Reviewer QC","displayRole":"Reviewer KKP / Quality Control","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Reviewer QC)","jabatan":"Reviewer KKP / Quality Control","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai Kontrak / Khusus Admin]","tokenHash":"cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9"},
      'da9ed250de0559c0e8cf6631bbd6e93375eec43c4d114d0f4f1ae17a4f5dd3a9': {"valid":true,"role":"REVIEWER","roleLabel":"Reviewer QC","displayRole":"Reviewer KKP / Quality Control","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Reviewer QC)","jabatan":"Reviewer KKP / Quality Control","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai Kontrak / Khusus Admin]","tokenHash":"cf86dd7ad31d605d308c86f51f623664dfe786bcd0933d67b7b024a768f704f9"},
      'a2dea243d23fe702639787f0c7e7ecd838d34d4a9deff284ed5d6abbeb42f142': {"valid":true,"role":"REVIEWER","roleLabel":"Reviewer QC","displayRole":"Reviewer KKP / Quality Control","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Reviewer QC)","jabatan":"Reviewer KKP / Quality Control","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai Kontrak / Khusus Admin]","tokenHash":"a2dea243d23fe702639787f0c7e7ecd838d34d4a9deff284ed5d6abbeb42f142"},
      'd5eb840afe2f787c046b3754890d59f9d462cb53ca1a3e86f98ce00827649240': {"valid":true,"role":"REVIEWER","roleLabel":"Reviewer QC","displayRole":"Reviewer KKP / Quality Control","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Reviewer QC)","jabatan":"Reviewer KKP / Quality Control","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai Kontrak / Khusus Admin]","tokenHash":"a2dea243d23fe702639787f0c7e7ecd838d34d4a9deff284ed5d6abbeb42f142"},
      'd50a896599ef1420ccf19551893fb17466dca8a3da39215efe6e23013d98202e': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"d50a896599ef1420ccf19551893fb17466dca8a3da39215efe6e23013d98202e"},
      '52dd65caf53c6a54b9fa2bbbfdedbfbe5e31dcda86a09dc4b325f107f511e68b': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"d50a896599ef1420ccf19551893fb17466dca8a3da39215efe6e23013d98202e"},
      '2a86216c1c0cee274b01471cf9fe846002b640b71ab60d420a26cdca726f65fe': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"2a86216c1c0cee274b01471cf9fe846002b640b71ab60d420a26cdca726f65fe"},
      '7c0febba4184aabfaa1fa8f036901bca942f44a44134922c734c6812845a5cbe': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"2a86216c1c0cee274b01471cf9fe846002b640b71ab60d420a26cdca726f65fe"},
      '279c051e1b870f443e841b618c10f99b090ed3f2dd4cd8b4871f00c6289c72f5': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"279c051e1b870f443e841b618c10f99b090ed3f2dd4cd8b4871f00c6289c72f5"},
      '1d3ae4e60990bf3163099b17e0fb80575701e1f96e70e866c7a99145361ae896': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"279c051e1b870f443e841b618c10f99b090ed3f2dd4cd8b4871f00c6289c72f5"},
      'd20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"d20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e"},
      '5801bb3891c492e6497bd5c0eb4d583606d07eed0058c05f8d4238c114b9f3e1': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"d20c67b282eb9d0ad3ce9c651ce01b8d6f35466e11c80a20cbeef67656436c2e"},
      'a277d4cd593bed7d14e4b2ad08a8630c8b21dc80ed9b32dc05b876adcb3e735a': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"a277d4cd593bed7d14e4b2ad08a8630c8b21dc80ed9b32dc05b876adcb3e735a"},
      '14b4b51a13a2c3f62cb68bc65a229c6622ceee7528b9aa41f4964491d9e88e22': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"a277d4cd593bed7d14e4b2ad08a8630c8b21dc80ed9b32dc05b876adcb3e735a"},
      '5910706a97e5516a993a5a03bef13af6771281b2cd20f111b586dba4811e74c3': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"5910706a97e5516a993a5a03bef13af6771281b2cd20f111b586dba4811e74c3"},
      '440f1c13a002657dcd4c3b0c06ce2c072df1a3d3e91c1d6cf0d2d5111e4daf70': {"valid":true,"role":"PENILAI","roleLabel":"Penilai","displayRole":"Penilai Lapangan / Surveyor","wilayah":"PUSAT","wilayahLabel":"Kantor Pusat Jakarta","wilayahResmi":"Kantor Pusat Jakarta","wilayahCode":"PST","nama":"Kantor Pusat Jakarta","kantor":"Kantor Pusat Jakarta","namaKantor":"Kantor Pusat Jakarta","kode":"2.19.0160","kodeKantor":"2.19.0160","kodeWilayah":"2.19.0160","rekan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","rekanNama":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","pimpinan":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","otoritas":"Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)","cabang":"Pusat","label":"Kantor Pusat Jakarta (Penilai)","jabatan":"Penilai Lapangan / Surveyor","isCabang":false,"isSuperAdmin":false,"aksesApproval":false,"aksesKwitansi":false,"aksesFee":false,"mode":"PUSAT","canAccessKwitansi":false,"seeFee":false,"canApprove":false,"canSubmit":false,"canInputForm":false,"lockWilayah":false,"canManageSU":false,"feeMaskText":"[Sesuai SPK / Khusus Admin]","tokenHash":"5910706a97e5516a993a5a03bef13af6771281b2cd20f111b586dba4811e74c3"}
      };

      // 1. Direct hex lookup if 64-character hash is passed
      const lower = clean.toLowerCase();
      if (clean.length === 64 && /^[0-9a-f]{64}$/i.test(clean) && AUTH_HASH_REGISTRY[lower]) {
        const auth = AUTH_HASH_REGISTRY[lower];
        return {
          ...auth,
          token: clean,
          tokenHash: lower
        };
      }

      // 2. Salted SHA-256 One-Way Hash computation
      const saltedHash = _internalSha256Hex('KJPP_NSR_2026_CORE_AUTH::' + clean);
      const auth = AUTH_HASH_REGISTRY[saltedHash];
      if (!auth) {
        // Fallback to unsalted hash for backward compatibility
        const unsaltedHash = _internalSha256Hex(clean);
        if (AUTH_HASH_REGISTRY[unsaltedHash]) {
          return {
            ...AUTH_HASH_REGISTRY[unsaltedHash],
            token: clean,
            tokenHash: saltedHash
          };
        }
        return null;
      }

      return {
        ...auth,
        token: clean,
        tokenHash: saltedHash
      };
    }
    window.resolveUnifiedToken = resolveUnifiedToken;

    function setupPanelKwitansiLink(allowed, roleLabel) {
      const linkKwitansi = document.getElementById('link-portal-kwitansi');
      if (!linkKwitansi) return;
      if (!allowed) {
        linkKwitansi.classList.add('opacity-50', 'cursor-not-allowed');
        linkKwitansi.onclick = (e) => {
          e.preventDefault();
          alert(`Akses Ditolak: Modul Permintaan Kwitansi & Penagihan hanya dapat diakses oleh Admin Pusat dan Admin Cabang. Token Anda terdaftar sebagai ${roleLabel}.`);
          return false;
        };
      } else {
        linkKwitansi.classList.remove('opacity-50', 'cursor-not-allowed');
        linkKwitansi.onclick = null;
      }
    }

        // ==========================================================
    // CIPHER ENKRIPSI URL TERTUTUP (XOR + BASE64)
    // MENCEGAH EKSPOSUR LINK GOOGLE DRIVE & APPS SCRIPT DI HTML STATIS
    // ==========================================================
    const _VAULT_KEY = 'NSR_VAULT_KEY_2026';
    const _ENC_URL_SOP_DRIVE = 'JicmLyV7emMwLSIzPHFVX11RIjZ8PDkseigmNj0gdjldXFZTPCB9bmc2E38WJwQTHS8BRUBXD2Azbz8IBCg/BhssIzleYXpMcSYhL2syPS0mNiUi';
    const _ENC_URL_ABSENSI = 'JicmLyV7emMnPDksKSscV11ZKT83cTUuOGM5Pig3NiwdQx13BTUrPDQ2HGEbDgYDDg5oQkhELxQ5CmYsERVsEg99ATV+R0JbIWMZLBkvFmE1HCoIGwBxaXZOJwx/JzEpZH0aFQ4yDQ8BW1wZKys3PA==';

    function _dekripsiUrlAman(encoded, key = 'NSR_VAULT_KEY_2026') {
      try {
        if (!encoded) return '';
        const raw = atob(encoded);
        let res = '';
        for (let i = 0; i < raw.length; i++) {
          res += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return res;
      } catch (e) {
        return '';
      }
    }
    window._dekripsiUrlAman = _dekripsiUrlAman;

    function dapatkanSesiTervalidasi() {
      try {
        const raw = sessionStorage.getItem('NSR_USER_SESSION');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && typeof verifySessionChecksum === 'function' && verifySessionChecksum(parsed)) {
          return parsed;
        }
        return null;
      } catch (_) {
        return null;
      }
    }

    function bukaAksesSopDrive(e) {
      if (e) e.preventDefault();
      const sess = dapatkanSesiTervalidasi();
      if (!sess) {
        bukaModalPortal('sop');
        return;
      }
      if (sess.isCabang || sess.mode === 'CABANG') {
        bukaModalRequestDokumenSOP();
        return;
      }
      if (sess.isSuperAdmin) {
        const url = _dekripsiUrlAman(_ENC_URL_SOP_DRIVE);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        bukaModalRequestDokumenSOP();
      }
    }

    function bukaAksesAbsen(e) {
      if (e) e.preventDefault();
      window.location.href = 'portal-presensi.html';
    }

    function updateDynamicSmartCards(auth) {
      const isCabang = auth && (auth.isCabang || auth.mode === 'CABANG');
      const rawWilayah = (auth && auth.wilayah) ? auth.wilayah : '';
      const wilayahCode = (auth && (auth.wilayahCode || auth.branchCode)) ? (auth.wilayahCode || auth.branchCode).toUpperCase() : '';
      const wilayahCity = rawWilayah.replace(/^Kantor\s+Cabang\s+/i, '').replace(/^Kantor\s+/i, '') || 'Cabang';

      // Sembunyikan banner peringatan jika token sudah valid
      const bannerWarning = document.getElementById('banner-warning-portal');
      if (bannerWarning) {
        if (auth) {
          bannerWarning.classList.add('hidden');
          bannerWarning.style.display = 'none';
        } else {
          bannerWarning.classList.remove('hidden');
          bannerWarning.style.display = '';
        }
      }

      // Elemen Kartu 1: Lingkup Penugasan & JO
      const titleJO = document.getElementById('title-portal-penugasan');
      const subJO = document.getElementById('sub-portal-penugasan');
      const btnJO = document.getElementById('btn-text-portal-penugasan');
      const linkJO = document.getElementById('link-portal-penugasan');
      const sublinkJO = document.getElementById('sublink-portal-penugasan');

      // Elemen Kartu 2: NoLap
      const titleNoLap = document.getElementById('title-portal-nolap');
      const subNoLap = document.getElementById('sub-portal-nolap');
      const btnNoLap = document.getElementById('btn-text-portal-nolap');
      const linkNoLap = document.getElementById('link-portal-nolap');
      const sublinkNoLap = document.getElementById('sublink-portal-nolap');

      // Elemen Kartu 3: Kwitansi
      const titleKw = document.getElementById('title-portal-kwitansi');
      const subKw = document.getElementById('sub-portal-kwitansi');
      const btnKw = document.getElementById('btn-text-portal-kwitansi');
      const linkKw = document.getElementById('link-portal-kwitansi');
      const sublinkKw = document.getElementById('sublink-portal-kwitansi');

      // Elemen Kartu 4: Biaya Operasional (Baru - e-Operasional)
      const kartuEOpr = document.getElementById('kartu-e-operasional');
      const titleEOpr = document.getElementById('title-portal-operasional');
      const subEOpr = document.getElementById('sub-portal-operasional');
      const badgeEOpr = document.getElementById('badge-portal-operasional');
      const linkEOpr = document.getElementById('link-portal-operasional');

      // Elemen Kartu 5: SOP
      const titleSOP = document.getElementById('title-portal-sop');
      const subSOP = document.getElementById('sub-portal-sop');
      const btnSOP = document.getElementById('btn-text-portal-sop');
      const linkSOP = document.getElementById('link-portal-sop');

      // Elemen Kartu 6: Presensi
      const kartuPresensiWrapper = document.getElementById('kartu-presensi-wrapper');
      const linkAbsen = document.getElementById('link-portal-absen');

      if (linkAbsen) {
        linkAbsen.href = 'portal-presensi.html';
        linkAbsen.onclick = null;
      }

      if (isCabang) {
        // ============================================
        // MODE KANTOR CABANG (PLB, PDG, MKS, BDG)
        // ============================================

        // 1. JO Cabang
        if (titleJO) titleJO.textContent = `Lingkup Penugasan & Job Order (JO) Cabang ${wilayahCity}`;
        if (subJO) subJO.textContent = 'Sistem Otomasi SPK Cabang, Surat Tugas & Rekapitulasi Kontrak';
        if (btnJO) btnJO.innerHTML = 'Masuk JO Cabang &nearr;';
        if (linkJO) linkJO.href = 'portal-penugasan-jo.html?mode=mandiri';
        if (sublinkJO) {
          sublinkJO.classList.remove('hidden');
          const sublinkA = sublinkJO.querySelector('a');
          if (sublinkA) sublinkA.href = 'portal-penugasan-jo.html?mode=pusat';
        }

        // 2. NoLap Cabang
        if (titleNoLap) titleNoLap.textContent = `Portal NoLap Mandiri Cabang ${wilayahCity}`;
        if (subNoLap) subNoLap.textContent = 'Penerbitan Laporan Definitif & Registrasi Draf Kewenangan Cabang';
        if (btnNoLap) btnNoLap.innerHTML = '⚡ Masuk Portal Cabang &nearr;';
        if (linkNoLap) linkNoLap.href = 'portal-nolap-cabang.html';
        if (sublinkNoLap) sublinkNoLap.classList.remove('hidden');

        // 3. Kwitansi Cabang
        if (titleKw) titleKw.textContent = `Portal Kwitansi & Keuangan Cabang ${wilayahCity}`;
        if (subKw) subKw.textContent = 'Penerbitan Invoice DP, Kwitansi Resmi & Rekening Kas Cabang';
        if (btnKw) btnKw.innerHTML = 'Masuk Kwitansi Cabang &nearr;';
        if (linkKw) linkKw.href = 'portal-kwitansi.html?mode=mandiri';
        if (sublinkKw) {
          sublinkKw.classList.remove('hidden');
          const sublinkA = sublinkKw.querySelector('a');
          if (sublinkA) sublinkA.href = 'portal-kwitansi.html?mode=pusat';
        }

        // 4. Biaya Operasional (Aktif untuk Cabang dengan badge FORM PENGAJUAN)
        if (kartuEOpr) kartuEOpr.style.display = 'flex';
        if (titleEOpr) titleEOpr.textContent = `Portal Biaya Operasional Cabang ${wilayahCity}`;
        if (subEOpr) subEOpr.textContent = `Pengajuan Survey, Meeting & Beban Operasional Cabang ${wilayahCity}`;
        if (badgeEOpr) {
          badgeEOpr.textContent = 'FORM PENGAJUAN';
          badgeEOpr.className = 'px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase shrink-0';
        }
        if (linkEOpr) {
          linkEOpr.href = wilayahCode ? `portal-operasional.html?branch=${encodeURIComponent(wilayahCode)}` : 'portal-operasional.html';
        }

        // 5. Penegakan Filter RBAC: Sembunyikan mutlak elemen data-access="pusat-only" (Surat Umum)
        document.querySelectorAll('[data-access="pusat-only"]').forEach(el => {
          el.style.display = 'none';
        });

        // 6. SOP Cabang
        if (titleSOP) titleSOP.textContent = `Folder Dokumen & SOP Cabang ${wilayahCity}`;
        if (subSOP) subSOP.textContent = 'Format Laporan, Template & SOP Terkendali Pusat';
        if (btnSOP) btnSOP.innerHTML = '🔒 Minta Akses &nearr;';
        if (linkSOP) {
          linkSOP.href = 'javascript:void(0)';
          linkSOP.removeAttribute('target');
          linkSOP.onclick = (e) => {
            e.preventDefault();
            bukaModalRequestDokumenSOP();
          };
        }

        // Kartu presensi normal (grid 6 kartu simetris 2 kolom = 3 baris)
        if (kartuPresensiWrapper) kartuPresensiWrapper.classList.remove('md:col-span-2');

      } else {
        // ============================================
        // MODE KANTOR PUSAT / SUPER ADMIN / DEFAULT
        // ============================================

        // 1. JO Pusat
        if (titleJO) titleJO.textContent = 'Lingkup Penugasan & Job Order (JO)';
        if (subJO) subJO.textContent = 'Sistem Otomasi SPK, Surat Representasi & 7 Dokumen Bundel JO';
        if (btnJO) btnJO.innerHTML = 'Masuk Portal &nearr;';
        if (linkJO) linkJO.href = 'portal-penugasan-jo.html';
        if (sublinkJO) sublinkJO.classList.add('hidden');

        // 2. NoLap Pusat
        if (titleNoLap) titleNoLap.textContent = 'Portal Nomor Laporan (NoLap)';
        if (subNoLap) subNoLap.textContent = 'Registrasi 7 Segmen Kemenkeu & SPM Mitigasi';
        if (btnNoLap) btnNoLap.innerHTML = 'Masuk Portal &nearr;';
        if (linkNoLap) linkNoLap.href = 'portal-nolap.html';
        if (sublinkNoLap) sublinkNoLap.classList.add('hidden');

        // 3. Kwitansi Pusat
        if (titleKw) titleKw.textContent = 'Portal Kwitansi & Keuangan';
        if (subKw) subKw.textContent = 'Draf Tagihan Cabang & Verifikasi Keuangan Pusat';
        if (btnKw) btnKw.innerHTML = 'Masuk Portal &nearr;';
        if (linkKw) linkKw.href = 'portal-kwitansi.html';
        if (sublinkKw) sublinkKw.classList.add('hidden');

        // 4. Biaya Operasional (Pusat: MEJA APPROVAL 5 TIER)
        if (kartuEOpr) kartuEOpr.style.display = 'flex';
        if (titleEOpr) titleEOpr.textContent = 'Portal Biaya Operasional';
        if (subEOpr) subEOpr.textContent = 'Pengajuan Survey, Meeting & Beban Umum Kantor';
        if (badgeEOpr) {
          badgeEOpr.textContent = 'MEJA APPROVAL 5 TIER';
          badgeEOpr.className = 'px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase shrink-0';
        }
        if (linkEOpr) linkEOpr.href = 'portal-operasional.html';

        // 5. Tampilkan seluruh kartu ber-attribute data-access="pusat-only" secara lengkap
        document.querySelectorAll('[data-access="pusat-only"]').forEach(el => {
          el.style.display = 'flex';
        });

        // 6. SOP Pusat
        if (titleSOP) titleSOP.textContent = 'Folder Dokumen & SOP Cabang';
        if (subSOP) subSOP.textContent = 'Format Laporan, Template & SOP Internal';
        if (btnSOP) btnSOP.innerHTML = 'Buka Drive &nearr;';
        if (linkSOP) {
          linkSOP.href = 'javascript:void(0)';
          linkSOP.removeAttribute('target');
          linkSOP.onclick = (e) => {
            if (e) e.preventDefault();
            bukaAksesSopDrive(e);
          };
        }

        // 7. Presensi membentang 2 kolom penuh agar 7 kartu tersusun simetris
        if (kartuPresensiWrapper) kartuPresensiWrapper.classList.add('md:col-span-2');
      }

      // Pastikan kartu penugasan melewati gerbang login jika belum ada sesi valid
      if (linkJO) {
        if (!auth) {
          linkJO.onclick = function(e) {
            e.preventDefault();
            bukaModalPortal('penugasan');
          };
        } else {
          linkJO.onclick = null;
        }
      }
    }
    window.updateDynamicSmartCards = updateDynamicSmartCards;

    function bukaModalRequestDokumenSOP() {
      let namaCabang = 'Kantor Cabang';
      try {
        const stored = sessionStorage.getItem('kjpp_token_internal');
        if (stored) {
          const sess = JSON.parse(stored);
          if (sess.branch || sess.wilayah) {
            namaCabang = sess.branch || sess.wilayah;
          }
        }
      } catch (e) {}

      const inpCabang = document.getElementById('req-sop-cabang');
      if (inpCabang) inpCabang.value = namaCabang;

      const inpNama = document.getElementById('req-sop-nama');
      const inpDok = document.getElementById('req-sop-dokumen');
      const inpKep = document.getElementById('req-sop-keperluan');
      if (inpNama) inpNama.value = '';
      if (inpDok) inpDok.value = '';
      if (inpKep) inpKep.value = '';

      bukaModal('modal-request-sop');
    }

    function kirimPermohonanSopWA(e) {
      if (e) e.preventDefault();
      const cabang = (document.getElementById('req-sop-cabang')?.value || 'Kantor Cabang').trim();
      const nama = (document.getElementById('req-sop-nama')?.value || '').trim();
      const jabatan = (document.getElementById('req-sop-jabatan')?.value || 'Penilai Lapangan').trim();
      const dokumen = (document.getElementById('req-sop-dokumen')?.value || '').trim();
      const keperluan = (document.getElementById('req-sop-keperluan')?.value || '').trim();

      if (!nama || !dokumen || !keperluan) {
        alert('Mohon lengkapi Nama Pemohon, Dokumen yang Diminta, dan Keperluan Singkat.');
        return;
      }

      const waNumber = '6285110513157'; // WhatsApp Admin Pusat KJPP NSR
      const textMsg = `*PERMOHONAN AKSES DOKUMEN & SOP INTERNAL KJPP NSR*\n\n` +
        `Yth. Admin Pusat KJPP NSR,\n` +
        `Mohon izin mengajukan permohonan berkas template / SOP operasional:\n\n` +
        `• *Kantor Asal* : ${cabang}\n` +
        `• *Nama Pemohon*: ${nama}\n` +
        `• *Jabatan/Peran*: ${jabatan}\n` +
        `• *Dokumen/SOP* : ${dokumen}\n` +
        `• *Keperluan*   : ${keperluan}\n\n` +
        `Mohon bantuan untuk dibukakan izin akses Google Drive atau dikirimkan salinan dokumen tersebut. Terima kasih.`;

      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(textMsg)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      tutupModal('modal-request-sop');
    }

    function bukaModalPortal(targetPortal) {
      try {
        window._targetPortal = targetPortal || null;
        const modal = document.getElementById('modal-portal');
        const formToken = document.getElementById('form-token-portal');
        const panelLayanan = document.getElementById('panel-layanan');
        const labelLokasi = document.getElementById('label-lokasi');
        const pesanError = document.getElementById('pesan-error');
        const pesanErrorText = document.getElementById('pesan-error-text');

        if (!modal) return;
        if (pesanError) pesanError.classList.add('hidden');

        bukaModal('modal-portal');

        const storedSession = sessionStorage.getItem('kjpp_token_internal');
        if (storedSession) {
          try {
            const sess = JSON.parse(storedSession);
            const isExpired = sess.expiresAt && sess.expiresAt < Date.now();
            if (!isExpired) {
              // Evaluasi hak akses kwitansi jika pengguna klik kartu kwitansi
              if (targetPortal === 'kwitansi') {
                if (sess.canAccessKwitansi === false) {
                  if (formToken) formToken.classList.remove('hidden');
                  if (panelLayanan) panelLayanan.classList.add('hidden');
                  if (pesanError && pesanErrorText) {
                    pesanError.classList.remove('hidden');
                    pesanErrorText.innerHTML = `Akses Ditolak: Modul Permintaan Kwitansi &amp; Penagihan hanya dapat diakses oleh Admin Pusat dan Admin Cabang. Token Anda terdaftar sebagai ${sess.roleLabel || sess.role}.`;
                  }
                  const inp = document.getElementById('input-token');
                  if (inp) { inp.value = ''; setTimeout(() => inp.focus(), 150); }
                  return;
                }
                window.location.href = (sess.mode === 'CABANG') ? 'portal-kwitansi.html?mode=mandiri' : 'portal-kwitansi.html';
                return;
              }

              if (targetPortal === 'operasional') {
                const bCode = (sess.wilayahCode || sess.branchCode || '').toUpperCase();
                window.location.href = (sess.isCabang || sess.mode === 'CABANG') && bCode
                  ? `portal-operasional.html?branch=${encodeURIComponent(bCode)}`
                  : 'portal-operasional.html';
                return;
              }

              if (targetPortal === 'penugasan') {
                window.location.href = (sess.mode === 'CABANG') ? 'portal-penugasan-jo.html?mode=mandiri' : 'portal-penugasan-jo.html';
                return;
              }
              if (targetPortal === 'nolap') {
                window.location.href = (sess.mode === 'CABANG') ? 'portal-nolap-cabang.html' : 'portal-nolap.html';
                return;
              }
              if (targetPortal === 'sop') {
                if (sess.isCabang || sess.mode === 'CABANG') {
                  bukaModalRequestDokumenSOP();
                  return;
                }
                if (sess.isSuperAdmin || sess.role === 'SUPER ADMIN') {
                  const url = _dekripsiUrlAman(_ENC_URL_SOP_DRIVE);
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  return;
                }
                bukaModalRequestDokumenSOP();
                return;
              }
              if (targetPortal === 'absen') {
                window.location.href = 'portal-presensi.html';
                return;
              }

              // General launcher: tampilkan panel layanan dengan status verifikasi
              if (labelLokasi) {
                labelLokasi.innerHTML = `Terverifikasi: <strong>${sess.branch || sess.wilayah}</strong> &bull; <span class="uppercase text-emerald-800 font-extrabold">${sess.roleLabel || sess.role}</span>`;
              }
              if (formToken) formToken.classList.add('hidden');
              if (panelLayanan) {
                panelLayanan.classList.remove('hidden');
                updateDynamicSmartCards(sess);
                if (typeof setupPanelKwitansiLink === 'function') {
                  setupPanelKwitansiLink(sess.canAccessKwitansi !== false, sess.roleLabel || sess.role);
                }
              }
              return;
            }
          } catch (e) {
            console.warn('Gagal memproses sesi internal:', e);
          }
        }

        // Default state: formulir input token tampil
        updateDynamicSmartCards(null);
        if (formToken) formToken.classList.remove('hidden');
        if (panelLayanan) panelLayanan.classList.add('hidden');
        const inp = document.getElementById('input-token');
        if (inp) {
          inp.value = '';
          setTimeout(() => inp.focus(), 150);
        }
      } catch (err) {
        console.error('Error saat membuka modal portal:', err);
        try {
          bukaModal('modal-portal');
        } catch (_) {}
      }
    }

    function tutupModalPortal() {
      try {
        tutupModal('modal-portal');
      } catch (err) {
        console.error('Error saat menutup modal portal:', err);
      }
    }

    window.bukaModalPortal = bukaModalPortal;
    window._bukaModalPortalHandler = bukaModalPortal;
    window.tutupModalPortal = tutupModalPortal;

    function toggleTokenVisibility() {
      const inp = document.getElementById('input-token');
      const eyeShow = document.getElementById('icon-eye-show');
      const eyeHide = document.getElementById('icon-eye-hide');
      const btn = document.getElementById('btn-toggle-token');
      if (!inp) return;
      if (inp.type === 'password') {
        inp.type = 'text';
        if (eyeShow) eyeShow.classList.add('hidden');
        if (eyeHide) eyeHide.classList.remove('hidden');
        if (btn) btn.setAttribute('aria-label', 'Sembunyikan token');
      } else {
        inp.type = 'password';
        if (eyeShow) eyeShow.classList.remove('hidden');
        if (eyeHide) eyeHide.classList.add('hidden');
        if (btn) btn.setAttribute('aria-label', 'Tampilkan token');
      }
    }
    window.toggleTokenVisibility = toggleTokenVisibility;

    async function verifikasiTokenPortal(e) {
      if (e) e.preventDefault();
      const inputEl = document.getElementById('input-token');
      const btnSubmit = document.getElementById('btn-submit-token');
      const errEl = document.getElementById('pesan-error');
      const errText = document.getElementById('pesan-error-text');
      if (!inputEl) return;
      const input = inputEl.value.trim();

      if (!input) {
        if (errEl) errEl.classList.remove('hidden');
        if (errText) errText.innerText = 'Silakan masukkan token otorisasi resmi terlebih dahulu.';
        inputEl.focus();
        return;
      }

      if (errEl) errEl.classList.add('hidden');
      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerHTML = '<span>Memverifikasi...</span>'; }

      let auth = null;

      // 1. Validasi Otoritatif Server-Side (PHP cPanel Zero-Trust Endpoint)
      let backendRejectionReason = null;
      let serverContacted = false;

      try {
        const resp = await fetch('/api/auth-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ token: input }),
          credentials: 'include'
        });
        serverContacted = true;
        const srv = await resp.json().catch(() => null);
        if (resp.ok && srv && srv.authenticated && srv.user) {
          auth = {
            ...srv.user,
            valid: true,
            token: input,
            tokenHash: srv.tokenHash || computeTokenHashSync(input),
            sessionChecksum: srv.sessionChecksum,
            expiresAt: srv.expiresAt || (Date.now() + (8 * 3600 * 1000))
          };
        } else {
          // Server merespons namun menolak token (HTTP 401 / 403 / non-auth)
          backendRejectionReason = (srv && srv.error) ? srv.error : 'Akses Ditolak: Token otorisasi tidak valid.';
        }
      } catch (_) {
        // Jika berada di protokol HTTP/HTTPS web, kegagalan fetch adalah kegagalan koneksi backend
        if (window.location.protocol.startsWith('http')) {
          serverContacted = true;
          backendRejectionReason = 'Gagal menghubungi server autentikasi resmi. Akses ditolak.';
        }
      }

      // 2. Fallback Resolver: HANYA jika murni mode file statis offline lokal tanpa web server (file:///)
      // Di hosting web/cPanel (http/https), wajib diverifikasi backend. Dilarang login via fallback browser!
      if (!auth && !serverContacted && window.location.protocol === 'file:') {
        auth = typeof window.resolveUnifiedToken === 'function' ? window.resolveUnifiedToken(input) : null;
      }

      if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = '<span id="btn-submit-text">Verifikasi &amp; Masuk</span> <svg class="w-4 h-4 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'; }

      if (!auth) {
        if (errEl) errEl.classList.remove('hidden');
        if (errText) errText.innerText = 'Token tidak valid. Pastikan memasukkan token resmi KJPP NSR (Admin Pusat, Admin Cabang, Reviewer, Penilai, Surveyor, Marketing, atau Keuangan).';
        inputEl.select();
        return;
      }

      // Pemblokiran akses kwitansi bagi Penilai, Reviewer & Marketing
      if (window._targetPortal === 'kwitansi' && !auth.canAccessKwitansi) {
        if (errEl) errEl.classList.remove('hidden');
        if (errText) {
          errText.innerHTML = `Akses Ditolak: Modul Permintaan Kwitansi &amp; Penagihan hanya dapat diakses oleh Admin Pusat dan Admin Cabang. Token Anda terdaftar sebagai ${auth.roleLabel}.`;
        }
        inputEl.select();
        return;
      }

      // Simpan sesi terpadu dengan proteksi integritas kriptografis
      const branchName = auth.wilayah;
      const tokenHash = auth.tokenHash || (typeof computeTokenHashSync === 'function' ? computeTokenHashSync(auth.token || input) : '');
      const expiresAt = Date.now() + (8 * 3600 * 1000);
      const sessionChecksum = typeof computeSessionChecksum === 'function'
        ? computeSessionChecksum(tokenHash, auth.role, auth.wilayah, expiresAt, auth.isSuperAdmin)
        : 'sig_' + tokenHash;

      const secureAuth = {
        ...auth,
        tokenHash: tokenHash,
        sessionChecksum: sessionChecksum,
        expiresAt: expiresAt
      };

      const sessionObj = {
        ...auth,
        branch: branchName,
        wilayah: branchName,
        token: auth.token || input,
        tokenHash: tokenHash,
        role: auth.role,
        roleLabel: auth.roleLabel,
        mode: auth.mode,
        canAccessKwitansi: auth.canAccessKwitansi,
        seeFee: auth.seeFee,
        sessionChecksum: sessionChecksum,
        expiresAt: expiresAt
      };

      sessionStorage.setItem('NSR_AUTH_HASH', tokenHash);
      sessionStorage.setItem('NSR_SESSION_CHECKSUM', sessionChecksum);
      sessionStorage.setItem('NSR_SESSION_SIG', sessionChecksum);
      sessionStorage.setItem('NSR_USER_SESSION', JSON.stringify(secureAuth));
      sessionStorage.setItem('nsr_nolap_session', JSON.stringify(secureAuth));
      sessionStorage.setItem('TOKEN_AUTH_NSR', auth.token || input);
      sessionStorage.setItem('CURRENT_AUTH_TOKEN', auth.token || input);
      sessionStorage.setItem('NSR_AUTH_TOKEN', auth.token || input);
      sessionStorage.setItem('kjpp_token_internal', JSON.stringify(sessionObj));
      sessionStorage.setItem('kjpp_session_jo', JSON.stringify({
        isLoggedIn: true,
        token: auth.token || input,
        tokenHash: tokenHash,
        role: auth.role,
        roleLabel: auth.roleLabel,
        mode: auth.mode,
        wilayah: auth.wilayah,
        wilayahCode: auth.wilayahCode,
        sessionChecksum: sessionChecksum,
        expiresAt: expiresAt,
        loginAt: new Date().toISOString()
      }));

      // Rute langsung terproteksi sesuai target kartu yang diklik
      if (window._targetPortal === 'kwitansi') {
        window.location.href = (auth.mode === 'CABANG') ? 'portal-kwitansi.html?mode=mandiri' : 'portal-kwitansi.html';
        return;
      }
      if (window._targetPortal === 'operasional') {
        const bCode = (auth.wilayahCode || auth.branchCode || '').toUpperCase();
        window.location.href = (auth.isCabang || auth.mode === 'CABANG') && bCode
          ? `portal-operasional.html?branch=${encodeURIComponent(bCode)}`
          : 'portal-operasional.html';
        return;
      }
      if (window._targetPortal === 'penugasan') {
        window.location.href = (auth.mode === 'CABANG') ? 'portal-penugasan-jo.html?mode=mandiri' : 'portal-penugasan-jo.html';
        return;
      }
      if (window._targetPortal === 'nolap') {
        if (auth.mode === 'CABANG') {
          window.location.href = 'portal-nolap-cabang.html';
        } else {
          window.location.href = 'portal-nolap.html';
        }
        return;
      }
      if (window._targetPortal === 'sop') {
        tutupModalPortal();
        if (auth.isCabang || auth.mode === 'CABANG') {
          bukaModalRequestDokumenSOP();
          return;
        }
        if (auth.isSuperAdmin) {
          const url = _dekripsiUrlAman(_ENC_URL_SOP_DRIVE);
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
        bukaModalRequestDokumenSOP();
        return;
      }
      if (window._targetPortal === 'absen') {
        tutupModalPortal();
        window.location.href = 'portal-presensi.html';
        return;
      }

      // Tampilkan panel layanan operasional (GRID 2-KOLOM 6 MODUL LENGKAP)
      const formToken = document.getElementById('form-token-portal');
      const panelLayanan = document.getElementById('panel-layanan');
      const labelLokasi = document.getElementById('label-lokasi');

      if (labelLokasi) {
        labelLokasi.innerHTML = `Terverifikasi: <strong>${auth.wilayah}</strong> &bull; <span class="uppercase text-emerald-800 font-extrabold">${auth.roleLabel}</span>`;
      }
      if (formToken) formToken.classList.add('hidden');
      if (panelLayanan) {
        panelLayanan.classList.remove('hidden');
        window.updateDynamicSmartCards(auth);
        if (typeof setupPanelKwitansiLink === 'function') {
          setupPanelKwitansiLink(auth.canAccessKwitansi !== false, auth.roleLabel);
        }
      }
      inputEl.value = '';
    }
    window.verifikasiTokenPortal = verifikasiTokenPortal;

    // 6. Reset Sesi
    function resetTokenSesi() {
      sessionStorage.removeItem('NSR_AUTH_TOKEN');
      sessionStorage.removeItem('NSR_USER_SESSION');
      sessionStorage.removeItem('TOKEN_AUTH_NSR');
      sessionStorage.removeItem('CURRENT_AUTH_TOKEN');
      sessionStorage.removeItem('kjpp_token_internal');
      sessionStorage.removeItem('kjpp_session_jo');
      sessionStorage.removeItem('nsr_nolap_session');

      const formToken = document.getElementById('form-token-portal');
      const panelLayanan = document.getElementById('panel-layanan');
      const errEl = document.getElementById('pesan-error');
      if (errEl) errEl.classList.add('hidden');
      if (formToken) formToken.classList.remove('hidden');
      if (panelLayanan) panelLayanan.classList.add('hidden');
      const inp = document.getElementById('input-token');
      if (inp) {
        inp.value = '';
        inp.focus();
      }
    }
    window.resetTokenSesi = resetTokenSesi;
})();
