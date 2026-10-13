/**
 * KJPP NANANG RAHAYU SIGIT PARYANTO DAN REKAN (KJPP NSR)
 * MODUL JAVASCRIPT: KEPATUHAN PELINDUNGAN DATA PRIBADI (UU NO. 27/2022) & DISCLAIMER PROFESI
 * 
 * Mengelola:
 * 1. Modal Kebijakan Privasi & Perlindungan Data Klien
 * 2. Modal Disclaimer Profesi Penilai Publik & Informasi Hukum
 * 3. Modal Pemberitahuan Privasi Karyawan (Sistem Presensi)
 * 4. Perekaman Bukti Persetujuan (Proof of Consent) & Integrasi Form RFP
 * 5. Pengelolaan Hak Subjek Data Pribadi
 */

(function () {
  'use strict';

  const PDP_CONFIG = {
    policyVersion: '2.1-2026.10',
    effectiveDate: 'Oktober 2026',
    controllerName: 'KJPP Nanang Rahayu Sigit Paryanto dan Rekan',
    license: 'KMK RI No. 248/KM.1/2019 (KMK No. 2.19.0160)',
    dpoEmail: 'privasi@kjppnanangrahayu.com',
    waContact: '0851-1051-3157',
    apiUrl: '/api/pdp-consent',
    storageKey: 'nsr_pdp_consent_logs',
    employeeAckKey: 'nsr_presensi_privacy_ack'
  };

  // 1. INJEKSI MODAL KEBIJAKAN PRIVASI JIKA BELUM ADA
  function injectPrivacyModal() {
    if (document.getElementById('modal-kebijakan-privasi')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-kebijakan-privasi';
    modal.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md hidden flex items-center justify-center p-3 sm:p-5 transition-opacity duration-200';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-privasi-title');

    modal.innerHTML = `
      <div class="bg-white text-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]">
        
        <!-- Header Modal -->
        <div class="px-5 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-sm shrink-0">🛡️</span>
            <div class="min-w-0">
              <h3 id="modal-privasi-title" class="text-sm sm:text-base font-bold text-white truncate">
                Kebijakan Privasi &amp; Perlindungan Data Klien
              </h3>
              <p class="text-[10.5px] text-slate-400 truncate">Kepatuhan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)</p>
            </div>
          </div>
          <button type="button" onclick="window.tutupModalPrivasi()" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-base transition cursor-pointer shrink-0" aria-label="Tutup Modal">&times;</button>
        </div>

        <!-- Konten Ringkas Kebijakan -->
        <div class="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          <div class="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs">
            <p class="font-bold text-sky-900 mb-1 flex items-center gap-1.5">
              <span>Pengendali Data Pribadi:</span>
              <span class="text-slate-700 font-semibold">KJPP Nanang Rahayu Sigit Paryanto dan Rekan</span>
            </p>
            <p class="text-[11px] text-slate-600">
              Izin Usaha Menteri Keuangan: <strong>KMK No. 248/KM.1/2019</strong> &bull; NIB: 9120403581857 &bull; Kantor Pusat: Jl. Hankam No. 5 RT 006 RW 001, Ragunan, Pasar Minggu, Jakarta Selatan 12550.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-950 text-xs uppercase tracking-wider mb-1">1. Komitmen Kepatuhan</h4>
            <p class="text-slate-600">
              KJPP Nanang Rahayu Sigit Paryanto dan Rekan (KJPP NSR) menghormati privasi serta berkomitmen melindungi data pribadi klien, calon klien, karyawan, dan pihak terkait sesuai dengan ketentuan peraturan perundang-undangan Indonesia, khususnya Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-950 text-xs uppercase tracking-wider mb-1">2. Dasar Hukum &amp; Batasan Pemrosesan</h4>
            <p class="text-slate-600">
              Data pribadi diproses berdasarkan dasar hukum yang sah (Pasal 20 UU PDP), mencakup: (a) persetujuan eksplisit subjek data, (b) pemenuhan permohonan pra-kontraktual atau pelaksanaan kontrak kerja sama penilaian resmi (SPK), (c) pemenuhan kewajiban hukum kepatuhan profesi Penilai Publik (PMK No. 101/PMK.01/2014 jo PMK No. 228/2019), dan (d) kepentingan yang sah secara proporsional.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-950 text-xs uppercase tracking-wider mb-1">3. Kategori Data yang Dikumpulkan</h4>
            <ul class="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li><strong>Calon Klien / Form RFP:</strong> Nama PIC, nomor kontak/WhatsApp, email, instansi, jenis objek, tujuan penilaian, dan lokasi aset.</li>
              <li><strong>Karyawan / Staf:</strong> NIK, nama lengkap, jabatan, riwayat jam kehadiran, koordinat GPS sesaat saat presensi, dan dokumen pengajuan izin/cuti.</li>
              <li><strong>Operasional Cabang:</strong> Data nomor penugasan laporan penilaian (NoLap) dan draf kwitansi termin penagihan.</li>
            </ul>
          </div>

          <div>
            <h4 class="font-bold text-slate-950 text-xs uppercase tracking-wider mb-1">4. Kontrol Keamanan &amp; Penyimpanan Privat</h4>
            <p class="text-slate-600">
              Akses terhadap data dibatasi kepada personel berwenang (Role-Based Access Control) dan pihak yang secara sah diperlukan dalam pelaksanaan pemrosesan. KJPP NSR menerapkan transmisi aman HTTPS/TLS, enkripsi kredensial (SHA-256), perlindungan penyimpanan privat tanpa URL tebakan terbuka, dan audit logging aktivitas. Dokumen awal yang diunggah tidak dipublikasikan ke publik.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-950 text-xs uppercase tracking-wider mb-1">5. Retensi &amp; Hak Subjek Data Pribadi</h4>
            <p class="text-slate-600 mb-2">
              Data disimpan sesuai kebutuhan tujuan pemrosesan, jadwal retensi kepatuhan perizinan Penilai Publik (retensi kertas kerja penilaian minimal 10 tahun sesuai regulasi Kementerian Keuangan), dan kewajiban hukum yang berlaku.
            </p>
            <p class="text-slate-600">
              Subjek data pribadi berhak mengajukan permohonan akses, perbaikan, penarikan persetujuan, atau penghapusan data sesuai Pasal 5–14 UU PDP melalui kanal resmi:
            </p>
            <div class="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-0.5">
              <p>📧 Email DPO / Privasi: <a href="mailto:privasi@kjppnanangrahayu.com" class="text-sky-700 font-bold hover:underline">privasi@kjppnanangrahayu.com</a></p>
              <p>📱 WhatsApp Resmi: <a href="https://wa.me/6285110513157" target="_blank" rel="noopener noreferrer" class="text-emerald-700 font-bold hover:underline">0851-1051-3157</a></p>
            </div>
          </div>

        </div>

        <!-- Footer Modal -->
        <div class="p-3.5 px-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div class="flex items-center gap-2">
            <span class="text-[11px] text-slate-500 font-mono">Versi ${PDP_CONFIG.policyVersion} &bull; ${PDP_CONFIG.effectiveDate}</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="kebijakan-privasi.html" class="px-3.5 py-1.5 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 font-bold text-xs transition">
              Buka Halaman Lengkap &rarr;
            </a>
            <button type="button" onclick="window.tutupModalPrivasi()" class="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer">
              Tutup
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.tutupModalPrivasi();
    });
  }

  // 2. INJEKSI MODAL DISCLAIMER PROFESI JIKA BELUM ADA
  function injectDisclaimerModal() {
    if (document.getElementById('modal-disclaimer')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-disclaimer';
    modal.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md hidden flex items-center justify-center p-3 sm:p-5 transition-opacity duration-200';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-disclaimer-title');

    modal.innerHTML = `
      <div class="bg-white text-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]">
        
        <!-- Header Modal -->
        <div class="px-5 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-sm shrink-0">⚖️</span>
            <div class="min-w-0">
              <h3 id="modal-disclaimer-title" class="text-sm sm:text-base font-bold text-white truncate">
                Disclaimer Profesi &amp; Informasi Hukum
              </h3>
              <p class="text-[10.5px] text-slate-400 truncate">Ketentuan Legal, Standar SPI 103 &amp; Batasan Opini Penilaian</p>
            </div>
          </div>
          <button type="button" onclick="window.tutupModalDisclaimer()" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-base transition cursor-pointer shrink-0" aria-label="Tutup Modal">&times;</button>
        </div>

        <!-- Konten Disclaimer Verbatim -->
        <div class="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs">
            <p class="font-bold text-amber-900 mb-1">Pemberitahuan Resmi Penilai Publik:</p>
            <p class="text-slate-700">
              Informasi pada situs ini disediakan untuk tujuan umum dan edukasi. Opini nilai resmi hanya sah jika diterbitkan dalam bentuk Laporan Penilaian Resmi yang ditandatangani Penilai Publik teregistrasi.
            </p>
          </div>

          <p class="text-slate-600">
            Seluruh artikel, publikasi, informasi regulasi, kajian, dan materi edukasi yang tersedia pada website KJPP Nanang Rahayu Sigit Paryanto dan Rekan (KJPP NSR) disediakan semata-mata untuk tujuan informasi umum dan edukasi.
          </p>

          <p class="text-slate-600">
            Informasi tersebut bukan merupakan opini nilai resmi, laporan penilaian, hasil technical review, pendapat hukum formal, atau nasihat hukum yang ditujukan untuk menyelesaikan keadaan khusus pihak tertentu.
          </p>

          <p class="text-slate-600">
            Opini nilai resmi hanya dapat dihasilkan melalui penugasan profesional yang sah, pelaksanaan proses penilaian sesuai ketentuan dan standar profesi yang berlaku (Standar Penilaian Indonesia &bull; SPI dan Kode Etik Penilai Indonesia &bull; KEPI), serta penerbitan laporan oleh pihak yang berwenang.
          </p>

          <p class="text-slate-600">
            Permohonan informasi, komunikasi awal, pengiriman dokumen, maupun pengisian Form RFP tidak dengan sendirinya membentuk hubungan penugasan profesional.
          </p>

          <p class="text-slate-600 font-semibold text-slate-800">
            Hubungan penugasan jasa penilaian harus dituangkan dalam Surat Perikatan Penugasan (Engagement Letter / SPK) atau perjanjian penugasan resmi yang disepakati para pihak.
          </p>

          <p class="text-slate-600">
            Penggunaan informasi pada website ini tidak menggantikan kebutuhan untuk memperoleh penilaian profesional atau nasihat hukum yang sesuai dengan fakta dan kebutuhan konkret.
          </p>

          <p class="text-slate-500 text-xs italic border-t border-slate-100 pt-3">
            Disclaimer ini tidak menghapus atau membatasi kewajiban dan tanggung jawab hukum maupun profesional KJPP NSR yang berlaku berdasarkan peraturan perundang-undangan dan standar profesi.
          </p>

        </div>

        <!-- Footer Modal -->
        <div class="p-3.5 px-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <a href="disclaimer.html" class="px-3.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 font-bold text-xs transition">
            Buka Halaman Lengkap &rarr;
          </a>
          <button type="button" onclick="window.tutupModalDisclaimer()" class="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer">
            Tutup
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) window.tutupModalDisclaimer();
    });
  }

  // 3. INJEKSI MODAL PEMBERITAHUAN PRIVASI KARYAWAN (PRESENSI)
  function injectEmployeePrivacyModal() {
    if (document.getElementById('modal-privacy-karyawan')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-privacy-karyawan';
    modal.className = 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md hidden flex items-center justify-center p-3 sm:p-5 transition-opacity duration-200';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="bg-slate-900 text-slate-100 rounded-2xl max-w-xl w-full border border-slate-700 shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]">
        <div class="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-sm">👔</span>
            <div>
              <h3 class="text-sm font-bold text-white">Pemberitahuan Privasi Karyawan</h3>
              <p class="text-[10.5px] text-slate-400">Sistem Presensi Online &amp; Layanan Mandiri KJPP NSR</p>
            </div>
          </div>
          <button type="button" onclick="window.tutupModalPrivasiKaryawan()" class="text-slate-400 hover:text-white text-lg font-bold p-1 leading-none">&times;</button>
        </div>

        <div class="p-5 overflow-y-auto space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <p class="font-medium text-white">
            Sistem Presensi Online KJPP NSR memproses data identitas karyawan, waktu kehadiran, dan informasi pendukung yang diperlukan untuk administrasi kepegawaian, pengendalian kehadiran, serta pemenuhan kewajiban atau kebutuhan ketenagakerjaan yang sah.
          </p>

          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-[11.5px]">
            <p><strong class="text-amber-400">1. Dasar Hukum Pemrosesan:</strong> Pelaksanaan perjanjian kerja ketenagakerjaan dan pemenuhan kewajiban hukum pemberi kerja (Pasal 20 ayat (2) huruf b &amp; c UU No. 27/2022).</p>
            <p><strong class="text-amber-400">2. Akses Koordinat GPS:</strong> Koordinat GPS hanya diminta <em>secara sesaat</em> saat Anda menekan tombol simpan presensi atau kunci titik WFH untuk validasi lokasi kerja, bukan pelacakan posisi terus-menerus di luar proses pencatatan presensi.</p>
            <p><strong class="text-amber-400">3. Berkas &amp; Dokumen:</strong> Dokumen izin/cuti yang diunggah disimpan pada folder internal terlindungi dan hanya dapat diakses Bagian SDM &amp; Manajemen yang berwenang.</p>
            <p><strong class="text-amber-400">4. Pembatasan Akses:</strong> Data presensi hanya dapat diakses oleh pihak internal yang memiliki kewenangan sesuai tugasnya dan tidak dipublikasikan ke publik.</p>
          </div>

          <p class="text-slate-400 text-[11px]">
            Dengan mengonfirmasi di bawah ini, Anda menyatakan telah menerima dan memahami pemberitahuan privasi pengelolaan data presensi karyawan KJPP NSR.
          </p>
        </div>

        <div class="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <a href="kebijakan-privasi.html" target="_blank" class="text-sky-400 hover:underline text-[11px]">Baca Kebijakan Lengkap &rarr;</a>
          <button type="button" onclick="window.konfirmasiPrivasiKaryawan()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition">
            Saya Mengerti &amp; Telah Menerima Pemberitahuan
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // GLOBAL FUNCTIONS
  window.bukaModalPrivasi = function () {
    injectPrivacyModal();
    const m = document.getElementById('modal-kebijakan-privasi');
    if (m) m.classList.remove('hidden');
  };

  window.tutupModalPrivasi = function () {
    const m = document.getElementById('modal-kebijakan-privasi');
    if (m) m.classList.add('hidden');
  };

  window.bukaModalDisclaimer = function () {
    injectDisclaimerModal();
    const m = document.getElementById('modal-disclaimer');
    if (m) m.classList.remove('hidden');
  };

  window.tutupModalDisclaimer = function () {
    const m = document.getElementById('modal-disclaimer');
    if (m) m.classList.add('hidden');
  };

  window.bukaModalPrivasiKaryawan = function () {
    injectEmployeePrivacyModal();
    const m = document.getElementById('modal-privacy-karyawan');
    if (m) m.classList.remove('hidden');
  };

  window.tutupModalPrivasiKaryawan = function () {
    const m = document.getElementById('modal-privacy-karyawan');
    if (m) m.classList.add('hidden');
  };

  window.konfirmasiPrivasiKaryawan = function () {
    try {
      localStorage.setItem(PDP_CONFIG.employeeAckKey, JSON.stringify({
        ack: true,
        version: PDP_CONFIG.policyVersion,
        timestamp: new Date().toISOString()
      }));
    } catch (_) {}
    window.tutupModalPrivasiKaryawan();
  };

  // REKAM BUKTI PERSETUJUAN (PROOF OF CONSENT)
  window.rekamPersetujuanPDP = async function (data) {
    const consentPayload = {
      form_type: data.form_type || 'RFP',
      consent_notice: !!data.consent_notice,
      consent_processing: !!data.consent_processing,
      nama: data.nama || '',
      kontak: data.kontak || '',
      instansi: data.instansi || '',
      purpose: data.purpose || 'Permohonan Penawaran Biaya (RFP) KJPP NSR',
      policy_version: PDP_CONFIG.policyVersion,
      client_timestamp: new Date().toISOString()
    };

    // Simpan di local storage sebagai bukti audit klien
    try {
      const logs = JSON.parse(localStorage.getItem(PDP_CONFIG.storageKey) || '[]');
      logs.unshift({
        ...consentPayload,
        local_id: 'LOCAL-' + Date.now()
      });
      if (logs.length > 50) logs.length = 50;
      localStorage.setItem(PDP_CONFIG.storageKey, JSON.stringify(logs));
    } catch (_) {}

    // Kirim ke backend asynchronously
    try {
      fetch(PDP_CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consentPayload)
      }).catch(() => {});
    } catch (_) {}

    return consentPayload;
  };

  // Keyboard shortcut: Escape to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.tutupModalPrivasi();
      window.tutupModalDisclaimer();
      window.tutupModalPrivasiKaryawan();
    }
  });

  // Otomatis cek modal presensi jika di halaman presensi
  document.addEventListener('DOMContentLoaded', () => {
    injectPrivacyModal();
    injectDisclaimerModal();

    if (window.location.pathname.includes('portal-absensi.html') || window.location.pathname.includes('GPS.html')) {
      injectEmployeePrivacyModal();
      try {
        const ackData = localStorage.getItem(PDP_CONFIG.employeeAckKey);
        if (!ackData) {
          // Buka notifikasi setelah jeda singkat
          setTimeout(() => {
            window.bukaModalPrivasiKaryawan();
          }, 600);
        }
      } catch (_) {}
    }
  });

})();
