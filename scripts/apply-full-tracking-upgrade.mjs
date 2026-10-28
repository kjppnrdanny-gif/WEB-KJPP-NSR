import fs from 'node:fs';

// =============================================================================
// 1. PATCH PORTAL-TRACKING.HTML JAVASCRIPT
// =============================================================================
let portal = fs.readFileSync('portal-tracking.html', 'utf8');
const isPortalCRLF = portal.includes('\r\n');
portal = portal.replace(/\r\n/g, '\n');

// A. Insert helper functions: togglePenggunaSama, sinkronkanPenggunaLaporan, periksaKepatuhanSpm, sesuaikanFieldMilestone, hubungiPendampingSurvei
const helperFunctions = `
    // Helper SPI 103: Sinkronisasi Pengguna Laporan & Klien
    function togglePenggunaSama(checked) {
      const penggunaInput = document.getElementById('reg-pengguna-laporan');
      const pemberiInput = document.getElementById('reg-pemberi-tugas');
      if (!penggunaInput || !pemberiInput) return;
      if (checked) {
        penggunaInput.value = pemberiInput.value;
        penggunaInput.readOnly = true;
        penggunaInput.classList.add('opacity-75');
      } else {
        penggunaInput.readOnly = false;
        penggunaInput.classList.remove('opacity-75');
        penggunaInput.focus();
      }
    }

    function sinkronkanPenggunaLaporan() {
      const check = document.getElementById('check-pengguna-sama');
      const pemberiInput = document.getElementById('reg-pemberi-tugas');
      const penggunaInput = document.getElementById('reg-pengguna-laporan');
      if (check && check.checked && pemberiInput && penggunaInput) {
        penggunaInput.value = pemberiInput.value;
      }
      const instansiHidden = document.getElementById('reg-instansi');
      if (instansiHidden && pemberiInput) {
        instansiHidden.value = pemberiInput.value;
      }
    }

    // Guardrail SPM: Klasifikasi Kompetensi Izin Objek vs Penilai Publik
    function periksaKepatuhanSpm() {
      const klasifikasi = document.getElementById('reg-klasifikasi-izin-objek')?.value || 'PS';
      const penilai = document.getElementById('reg-penilai')?.value || '';
      const warningEl = document.getElementById('warning-spm-klasifikasi');
      const warningText = document.getElementById('warning-spm-text');
      if (!warningEl) return;

      const isPenilaiPS = penilai.includes('PS-1.') || penilai.includes('Hernita') || penilai.includes('Amin Sade') || penilai.includes('Dharma Priyanto');

      if (klasifikasi === 'P' && isPenilaiPS) {
        warningEl.classList.remove('hidden');
        if (warningText) {
          warningText.innerHTML = 'Objek berklasifikasi Properti (P) wajib ditandatangani oleh Penilai Publik berizin P (Ir. Nanang Rahayu atau Deni Siswandi). Penilai yang Anda pilih berizin PS (Properti Sederhana) sehingga tidak memenuhi syarat kompetensi izin SPI/KEPI.';
        }
      } else {
        warningEl.classList.add('hidden');
      }
    }

    // Dynamic Fields Modal Update Milestone
    function sesuaikanFieldMilestone(targetM) {
      const m3m4Box = document.getElementById('container-field-m03-m04');
      const m6Box = document.getElementById('container-field-m06');
      
      if (m3m4Box) {
        if (targetM === 'M-03' || targetM === 'M-04') {
          m3m4Box.classList.remove('hidden');
        } else {
          m3m4Box.classList.add('hidden');
        }
      }

      if (m6Box) {
        if (targetM === 'M-06') {
          m6Box.classList.remove('hidden');
        } else {
          m6Box.classList.add('hidden');
        }
      }
    }

    // Hubungi Pendamping Lapangan (Tanpa Kode Lacak)
    function hubungiPendampingSurvei(joId) {
      const job = globalJobs.find(x => x.id === joId || x.jo_number === joId);
      if (!job) return alert('Data penugasan tidak ditemukan.');
      
      let surveyPhone = (job.survey_contact_phone || '').replace(/[^0-9]/g, '');
      if (surveyPhone.startsWith('0')) surveyPhone = '62' + surveyPhone.slice(1);
      if (!surveyPhone || surveyPhone.length < 8) {
        return alert('Nomor WhatsApp pendamping survei fisik belum didaftarkan untuk penugasan ini.');
      }

      const surveyName = job.survey_contact_name || 'Bapak/Ibu Pendamping Lapangan';
      const pesan = \`Halo Bapak/Ibu \${surveyName},
Saya dari Tim Penilai Properti KJPP Nanang Rahayu Sigit Paryanto & Rekan (KJPP NSR).

Kami ingin berkoordinasi mengenai jadwal konfirmasi dan pendampingan inspeksi fisik lapangan untuk penugasan penilaian properti:
• Debitur / Objek: \${job.debitur}
• Objek: \${job.jenis_properti}
• Lokasi: \${job.lokasi_aset}

Mohon informasi kesiapan jadwal dan waktu pelaksanaan inspeksi di lokasi. Terima kasih.\`;

      const waUrl = \`https://wa.me/\${surveyPhone}?text=\${encodeURIComponent(pesan)}\`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
`;

// Insert helpers before kirimWaKodeLacak
if (!portal.includes('function periksaKepatuhanSpm()')) {
  portal = portal.replace('function kirimWaKodeLacak(joId)', helperFunctions + '\n    function kirimWaKodeLacak(joId)');
  console.log('✓ Injected helper functions (periksaKepatuhanSpm, togglePenggunaSama, hubungiPendampingSurvei, sesuaikanFieldMilestone)');
}

// B. Replace kirimWaKodeLacak with strict SPI 103 exclusive Pemberi Tugas dispatch
const oldKirimWa = `    function kirimWaKodeLacak(joId) {
      const job = globalJobs.find(x => x.id === joId || x.jo_number === joId);
      if (!job) return alert('Data penugasan tidak ditemukan.');

      let picContact = (job.pic_contact || '').replace(/[^0-9]/g, '');
      if (picContact.startsWith('0')) {
        picContact = '62' + picContact.slice(1);
      }
      if (!picContact || picContact.length < 8) {
        picContact = '6285110513157';
      }

      const picName = job.pic_pemohon || 'Bapak/Ibu PIC Pemohon';
      const pesan = \`Yth. Bapak/Ibu \${picName},
Terima kasih atas kepercayaan penugasan penilaian properti kepada KJPP Nanang Rahayu Sigit Paryanto & Rekan.

Penugasan Anda telah resmi teregistrasi pada sistem OPINI NSR:
• No. SPK / JO: \${job.jo_number}
• Debitur: \${job.debitur}
• Objek & Lokasi: \${job.jenis_properti} - \${job.lokasi_aset}
• Kode Unik Lacak: \${job.kode_lacak || '-'}

Anda dapat memantau tahapan progres pekerjaan secara langsung dan real-time melalui tautan berikut:
https://kjppnanangrahayu.com?track=\${job.kode_lacak || job.jo_number}

Salam hormat,
Administrasi Operasional KJPP NSR\`;

      const waUrl = \`https://wa.me/\${picContact}?text=\${encodeURIComponent(pesan)}\`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }`;

const newKirimWa = `    function kirimWaKodeLacak(joId) {
      const job = globalJobs.find(x => x.id === joId || x.jo_number === joId);
      if (!job) return alert('Data penugasan tidak ditemukan.');

      // Sesuai KEPI & SPI 103: HANYA kirim Kode Lacak ke Kontak Resmi Pemberi Tugas (client_pic_phone)
      let picContact = (job.client_pic_phone || job.pic_contact || '').replace(/[^0-9]/g, '');
      if (picContact.startsWith('0')) {
        picContact = '62' + picContact.slice(1);
      }
      if (!picContact || picContact.length < 8) {
        picContact = '6285110513157';
      }

      const picName = job.client_pic_name || job.pic_pemohon || 'Bapak/Ibu PIC Pemberi Tugas';
      const pemberiTugas = job.pemberi_tugas || job.instansi || 'Pemberi Tugas';
      const penggunaLaporan = job.pengguna_laporan || pemberiTugas;
      const kodeLacak = job.kode_lacak || job.jo_number;

      const pesan = \`Yth. Bapak/Ibu \${picName},
Terima kasih atas kepercayaan penugasan penilaian properti kepada KJPP Nanang Rahayu Sigit Paryanto & Rekan.

Penugasan Anda telah resmi teregistrasi pada sistem OPINI NSR:
• No. SPK / JO: \${job.jo_number} (\${job.spk_number || '-'})
• Pemberi Tugas: \${pemberiTugas}
• Pengguna Laporan: \${penggunaLaporan}
• Debitur / Entitas: \${job.debitur}
• Objek & Lokasi: \${job.jenis_properti} - \${job.lokasi_aset}
• Kode Unik Lacak: \${kodeLacak}

Anda dapat memantau tahapan progres pekerjaan secara langsung dan real-time melalui tautan berikut:
https://kjppnanangrahayu.com/?track=\${encodeURIComponent(kodeLacak)}

Salam hormat,
Administrasi Operasional KJPP NSR\`;

      const waUrl = \`https://wa.me/\${picContact}?text=\${encodeURIComponent(pesan)}\`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }`;

if (portal.includes(oldKirimWa)) {
  portal = portal.replace(oldKirimWa, newKirimWa);
  console.log('✓ Updated kirimWaKodeLacak with strict SPI 103 message template and client_pic_phone');
}

// C. Update renderTaskBoard to show active milestone PIC badge on each row
const oldProgressTd = `            <td class="py-3 px-4">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] border \${mPillClass}">
                <strong class="font-mono">\${j.current_milestone}</strong>: \${j.current_milestone_title}
              </span>
              <div class="w-28 bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div class="\${isDone ? "bg-emerald-500" : "bg-amber-400"} h-1.5 rounded-full transition-all" style="width: \${j.progress_percent}%;"></div>
              </div>
              <span class="text-[9px] font-mono text-slate-400 mt-0.5 block">\${j.progress_percent}% Progres</span>
            </td>`;

const newProgressTd = `            <td class="py-3 px-4">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] border \${mPillClass}">
                <strong class="font-mono">\${j.current_milestone}</strong>: \${j.current_milestone_title}
              </span>
              <div class="w-28 bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div class="\${isDone ? "bg-emerald-500" : "bg-amber-400"} h-1.5 rounded-full transition-all" style="width: \${j.progress_percent}%;"></div>
              </div>
              <div class="flex items-center justify-between text-[9px] mt-0.5">
                <span class="font-mono text-slate-400">\${j.progress_percent}%</span>
                <span class="text-amber-300 font-semibold truncate max-w-[130px]" title="PIC Tahap: \${getPicAssignment(j.current_milestone, j).name}">PIC: \${getPicAssignment(j.current_milestone, j).name}</span>
              </div>
            </td>`;

if (portal.includes(oldProgressTd)) {
  portal = portal.replace(oldProgressTd, newProgressTd);
  console.log('✓ Updated renderTaskBoard with explicit PIC badge on each milestone row');
}

// D. Update bukaModalTracking to populate SPI 103 overview elements
const oldBukaModalPopulate = `      document.getElementById('modal-instansi').textContent = job.instansi;
      document.getElementById('modal-unit-kerja').textContent = job.unit_kerja || job.kantor;
      document.getElementById('modal-debitur').textContent = job.debitur;
      document.getElementById('modal-pic-contact').textContent = 'PIC: ' + (job.pic_pemohon || '-') + ' (' + (job.pic_contact || '-') + ')';`;

const newBukaModalPopulate = `      // SPI 103 Entitas Penugasan & Kontak
      const elPemberi = document.getElementById('modal-pemberi-tugas');
      if (elPemberi) elPemberi.textContent = job.pemberi_tugas || job.instansi || '-';
      
      const elPengguna = document.getElementById('modal-pengguna-laporan');
      if (elPengguna) elPengguna.textContent = job.pengguna_laporan || job.pemberi_tugas || job.instansi || '-';

      const elInstansiOld = document.getElementById('modal-instansi');
      if (elInstansiOld) elInstansiOld.textContent = job.pemberi_tugas || job.instansi || '-';

      const elUnit = document.getElementById('modal-unit-kerja');
      if (elUnit) elUnit.textContent = job.unit_kerja || job.kantor || '-';

      const elDeb = document.getElementById('modal-debitur');
      if (elDeb) elDeb.textContent = job.debitur || '-';

      const elClientPic = document.getElementById('modal-client-pic');
      if (elClientPic) elClientPic.textContent = (job.client_pic_name || job.pic_pemohon || '-') + ' (' + (job.client_pic_phone || job.pic_contact || '-') + ')';

      const elSurveyPic = document.getElementById('modal-survey-pic');
      if (elSurveyPic) elSurveyPic.textContent = job.survey_contact_name ? (job.survey_contact_name + ' (' + (job.survey_contact_phone || '-') + ')') : 'Sama dengan Debitur';

      const elPicContactOld = document.getElementById('modal-pic-contact');
      if (elPicContactOld) elPicContactOld.textContent = 'PIC: ' + (job.client_pic_name || job.pic_pemohon || '-') + ' (' + (job.client_pic_phone || job.pic_contact || '-') + ')';`;

if (portal.includes(oldBukaModalPopulate)) {
  portal = portal.replace(oldBukaModalPopulate, newBukaModalPopulate);
  console.log('✓ Updated bukaModalTracking populate section for SPI 103 client & intended user');
}

// E. Update bukaModalUpdateMilestone to trigger sesuaikanFieldMilestone and fill dynamic fields
const oldBukaModalUpdate = `      // Set target milestone berikutnya
      const mKeys = ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07'];
      const curIdx = mKeys.indexOf(job.current_milestone);
      const nextM = mKeys[Math.min(mKeys.length - 1, curIdx + 1)];
      document.getElementById('update-target-milestone').value = nextM;

      const titleEl = document.getElementById('modal-update-milestone-title');
      if (titleEl) {
        titleEl.textContent = 'Verifikasi Otoritas Milestone [' + nextM + ']';
      }

      // Pre-fill NIK staf aktif
      document.getElementById('update-auth-nik').value = currentUserSession.nik;
      document.getElementById('update-auth-pin').value = '';
      document.getElementById('update-auth-note').value = '';`;

const newBukaModalUpdate = `      // Set target milestone berikutnya
      const mKeys = ['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07'];
      const curIdx = mKeys.indexOf(job.current_milestone);
      const nextM = mKeys[Math.min(mKeys.length - 1, curIdx + 1)];
      const targetSelect = document.getElementById('update-target-milestone');
      if (targetSelect) {
        targetSelect.value = nextM;
        sesuaikanFieldMilestone(nextM);
      }

      // Pre-fill SPI dynamic fields
      const tglPenEl = document.getElementById('update-tanggal-penilaian');
      if (tglPenEl) tglPenEl.value = job.tanggal_penilaian || new Date().toISOString().split('T')[0];

      const dokHakEl = document.getElementById('update-dokumen-kepemilikan');
      if (dokHakEl) dokHakEl.value = job.dokumen_kepemilikan || '';

      const noLapEl = document.getElementById('update-nomor-laporan-resmi');
      if (noLapEl) noLapEl.value = job.nomor_laporan_resmi || '';

      const nilaiPasarEl = document.getElementById('update-opini-nilai-pasar');
      if (nilaiPasarEl) nilaiPasarEl.value = job.opini_nilai_pasar || '';

      const nilaiLiqEl = document.getElementById('update-opini-nilai-likuidasi');
      if (nilaiLiqEl) nilaiLiqEl.value = job.opini_nilai_likuidasi || '';

      const titleEl = document.getElementById('modal-update-milestone-title');
      if (titleEl) {
        titleEl.textContent = 'Verifikasi Otoritas Milestone [' + nextM + ']';
      }

      // Pre-fill NIK staf aktif
      document.getElementById('update-auth-nik').value = currentUserSession.nik;
      document.getElementById('update-auth-pin').value = '';
      document.getElementById('update-auth-note').value = '';`;

if (portal.includes(oldBukaModalUpdate)) {
  portal = portal.replace(oldBukaModalUpdate, newBukaModalUpdate);
  console.log('✓ Updated bukaModalUpdateMilestone with dynamic SPI field initialization');
}

// F. Update eksekusiUpdateMilestone payload
const oldUpdatePayload = `      const payload = {
        jo: document.getElementById('update-jo-id').value,
        target_milestone: document.getElementById('update-target-milestone').value,
        nik: document.getElementById('update-auth-nik').value.trim(),
        pin: document.getElementById('update-auth-pin').value.trim(),
        note: document.getElementById('update-auth-note').value.trim()
      };`;

const newUpdatePayload = `      const payload = {
        jo: document.getElementById('update-jo-id').value,
        target_milestone: document.getElementById('update-target-milestone').value,
        nik: document.getElementById('update-auth-nik').value.trim(),
        pin: document.getElementById('update-auth-pin').value.trim(),
        note: document.getElementById('update-auth-note').value.trim(),
        tanggal_penilaian: document.getElementById('update-tanggal-penilaian')?.value || '',
        dokumen_kepemilikan: document.getElementById('update-dokumen-kepemilikan')?.value.trim() || '',
        nomor_laporan_resmi: document.getElementById('update-nomor-laporan-resmi')?.value.trim() || '',
        opini_nilai_pasar: document.getElementById('update-opini-nilai-pasar')?.value.trim() || '',
        opini_nilai_likuidasi: document.getElementById('update-opini-nilai-likuidasi')?.value.trim() || ''
      };`;

if (portal.includes(oldUpdatePayload)) {
  portal = portal.replace(oldUpdatePayload, newUpdatePayload);
  console.log('✓ Updated eksekusiUpdateMilestone payload with SPI 103/105 substance values');
}

// G. Update terapkanTarikDataJO to auto-fill SPI 103 fields
const oldTarikApply = `      // Auto-populate seluruh field (Tetap isian bebas dan dapat diedit fleksibel)
      document.getElementById('reg-instansi').value = s.instansi || '';
      document.getElementById('reg-spk-number').value = s.nomor_spk || '';
      document.getElementById('reg-spk-date').value = s.tanggal_spk || new Date().toISOString().split('T')[0];
      document.getElementById('reg-lingkup-penugasan').value = s.lingkup_penugasan || '';
      document.getElementById('reg-tgl-lingkup').value = s.tanggal_lingkup || (s.tanggal_spk || new Date().toISOString().split('T')[0]);
      document.getElementById('reg-unit-kerja').value = s.unit_kerja || '';
      document.getElementById('reg-debitur').value = s.debitur || '';
      document.getElementById('reg-pic-contact').value = s.pic_contact || '';
      document.getElementById('reg-jenis-properti').value = s.jenis_properti || 'Tanah & Bangunan';
      document.getElementById('reg-luas-tanah').value = s.luas_tanah || '';
      document.getElementById('reg-luas-bangunan').value = s.luas_bangunan || '';
      document.getElementById('reg-lokasi-aset').value = s.lokasi_aset || '';`;

const newTarikApply = `      // Auto-populate seluruh field SPI 103 (Tetap isian bebas dan dapat diedit fleksibel)
      const pTugas = s.pemberi_tugas || s.instansi || '';
      const pLaporan = s.pengguna_laporan || pTugas;
      const cPicPhone = s.client_pic_phone || s.pic_contact || '';
      const cPicName = s.client_pic_name || s.pic_pemohon || '';
      const sPicPhone = s.survey_contact_phone || '';
      const sPicName = s.survey_contact_name || '';

      const elPemberi = document.getElementById('reg-pemberi-tugas'); if (elPemberi) elPemberi.value = pTugas;
      const elPengguna = document.getElementById('reg-pengguna-laporan'); if (elPengguna) elPengguna.value = pLaporan;
      const elInstansi = document.getElementById('reg-instansi'); if (elInstansi) elInstansi.value = pTugas;
      const elSpk = document.getElementById('reg-spk-number'); if (elSpk) elSpk.value = s.nomor_spk || s.spk_number || '';
      const elSpkDate = document.getElementById('reg-spk-date'); if (elSpkDate) elSpkDate.value = s.tanggal_spk || s.spk_date || new Date().toISOString().split('T')[0];
      const elTujuan = document.getElementById('reg-tujuan-penilaian'); if (elTujuan) elTujuan.value = s.tujuan_penilaian || 'Penjaminan Utang / Agunan Kredit';
      const elKlas = document.getElementById('reg-klasifikasi-izin-objek'); if (elKlas) elKlas.value = s.klasifikasi_izin_objek || 'PS';
      const elDok = document.getElementById('reg-dokumen-kepemilikan'); if (elDok) elDok.value = s.dokumen_kepemilikan || '';
      const elLingkup = document.getElementById('reg-lingkup-penugasan'); if (elLingkup) elLingkup.value = s.lingkup_penugasan || '';
      const elTglLingkup = document.getElementById('reg-tgl-lingkup'); if (elTglLingkup) elTglLingkup.value = s.tanggal_lingkup || (s.tanggal_spk || new Date().toISOString().split('T')[0]);
      const elUnit = document.getElementById('reg-unit-kerja'); if (elUnit) elUnit.value = s.unit_kerja || '';
      const elDebitur = document.getElementById('reg-debitur'); if (elDebitur) elDebitur.value = s.debitur || '';
      const elClientPic = document.getElementById('reg-client-pic-name'); if (elClientPic) elClientPic.value = cPicName;
      const elClientPhone = document.getElementById('reg-client-pic-phone'); if (elClientPhone) elClientPhone.value = cPicPhone;
      const elSurveyPic = document.getElementById('reg-survey-contact-name'); if (elSurveyPic) elSurveyPic.value = sPicName;
      const elSurveyPhone = document.getElementById('reg-survey-contact-phone'); if (elSurveyPhone) elSurveyPhone.value = sPicPhone;
      const elJenis = document.getElementById('reg-jenis-properti'); if (elJenis) elJenis.value = s.jenis_properti || 'Tanah & Bangunan';
      const elLuasT = document.getElementById('reg-luas-tanah'); if (elLuasT) elLuasT.value = s.luas_tanah || '';
      const elLuasB = document.getElementById('reg-luas-bangunan'); if (elLuasB) elLuasB.value = s.luas_bangunan || '';
      const elLokasi = document.getElementById('reg-lokasi-aset'); if (elLokasi) elLokasi.value = s.lokasi_aset || '';`;

if (portal.includes(oldTarikApply)) {
  portal = portal.replace(oldTarikApply, newTarikApply);
  console.log('✓ Updated terapkanTarikDataJO with complete SPI 103 auto-fill');
}

// H. Update eksekusiRegistrasiJO payload and confirmation modal display
const oldRegPayload = `      const payload = {
        spk_number: document.getElementById('reg-spk-number').value.trim(),
        spk_date: document.getElementById('reg-spk-date').value,
        lingkup_penugasan: document.getElementById('reg-lingkup-penugasan').value.trim(),
        tanggal_lingkup: document.getElementById('reg-tgl-lingkup').value,
        instansi: document.getElementById('reg-instansi').value.trim(),
        unit_kerja: document.getElementById('reg-unit-kerja').value.trim(),
        kantor: document.getElementById('reg-kantor').value,
        debitur: document.getElementById('reg-debitur').value.trim(),
        pic_contact: document.getElementById('reg-pic-contact').value.trim(),
        jenis_properti: document.getElementById('reg-jenis-properti').value.trim(),
        luas_tanah: document.getElementById('reg-luas-tanah').value.trim(),
        luas_bangunan: document.getElementById('reg-luas-bangunan').value.trim(),
        lokasi_aset: document.getElementById('reg-lokasi-aset').value.trim(),
        penilai_pelaksana: document.getElementById('reg-surveyor').value.trim(),
        surveyor: document.getElementById('reg-surveyor').value.trim(),
        reviewer: reviewerVal,
        reviewer_spm: reviewerVal,
        penilai_publik: penilaiVal,
        sla_target_text: document.getElementById('reg-sla-days').value.trim(),
        sla_days: parseInt(document.getElementById('reg-sla-days').value) || 3,
        catatan: document.getElementById('reg-catatan').value.trim(),
        auth_nik: currentUserSession.nik
      };`;

const newRegPayload = `      const pemberiTugas = (document.getElementById('reg-pemberi-tugas')?.value || document.getElementById('reg-instansi')?.value || '').trim();
      const penggunaLaporan = (document.getElementById('reg-pengguna-laporan')?.value || pemberiTugas).trim();
      const clientPicName = (document.getElementById('reg-client-pic-name')?.value || '').trim();
      const clientPicPhone = (document.getElementById('reg-client-pic-phone')?.value || '').trim();
      const surveyContactName = (document.getElementById('reg-survey-contact-name')?.value || '').trim();
      const surveyContactPhone = (document.getElementById('reg-survey-contact-phone')?.value || '').trim();
      const tujuanPenilaian = (document.getElementById('reg-tujuan-penilaian')?.value || 'Penjaminan Utang / Agunan Kredit').trim();
      const klasifikasiIzin = document.getElementById('reg-klasifikasi-izin-objek')?.value || 'PS';
      const dokumenKepemilikan = (document.getElementById('reg-dokumen-kepemilikan')?.value || '').trim();

      const payload = {
        pemberi_tugas: pemberiTugas,
        pengguna_laporan: penggunaLaporan,
        instansi: pemberiTugas,
        client_name: pemberiTugas,
        client_pic_name: clientPicName,
        client_pic_phone: clientPicPhone,
        pic_pemohon: clientPicName,
        pic_contact: clientPicPhone,
        survey_contact_name: surveyContactName,
        survey_contact_phone: surveyContactPhone,
        tujuan_penilaian: tujuanPenilaian,
        klasifikasi_izin_objek: klasifikasiIzin,
        dokumen_kepemilikan: dokumenKepemilikan,
        spk_number: document.getElementById('reg-spk-number').value.trim(),
        spk_date: document.getElementById('reg-spk-date').value,
        lingkup_penugasan: document.getElementById('reg-lingkup-penugasan').value.trim(),
        tanggal_lingkup: document.getElementById('reg-tgl-lingkup').value,
        unit_kerja: document.getElementById('reg-unit-kerja').value.trim(),
        kantor: document.getElementById('reg-kantor').value,
        debitur: document.getElementById('reg-debitur').value.trim(),
        jenis_properti: document.getElementById('reg-jenis-properti').value.trim(),
        luas_tanah: document.getElementById('reg-luas-tanah').value.trim(),
        luas_bangunan: document.getElementById('reg-luas-bangunan').value.trim(),
        lokasi_aset: document.getElementById('reg-lokasi-aset').value.trim(),
        penilai_pelaksana: document.getElementById('reg-surveyor').value.trim(),
        surveyor: document.getElementById('reg-surveyor').value.trim(),
        reviewer: reviewerVal,
        reviewer_spm: reviewerVal,
        penilai_publik: penilaiVal,
        sla_target_text: document.getElementById('reg-sla-days').value.trim(),
        sla_days: parseInt(document.getElementById('reg-sla-days').value) || 3,
        catatan: document.getElementById('reg-catatan').value.trim(),
        auth_nik: currentUserSession.nik
      };`;

if (portal.includes(oldRegPayload)) {
  portal = portal.replace(oldRegPayload, newRegPayload);
  console.log('✓ Updated eksekusiRegistrasiJO payload with all SPI 103 fields');
}

// I. Update success handling in eksekusiRegistrasiJO to show modal-konfirmasi-registrasi
const oldRegSuccess = `        if (res && res.status === 'success') {
          alert('✓ Sukses! Job Order baru berhasil diterbitkan:\\n\\n• Nomor JO: ' + res.data.jo_number + '\\n• Kode Lacak Unik: ' + (res.data.kode_lacak || '-') + '\\n• Debitur: ' + (res.data.debitur || '-') + '\\n• Kantor: ' + (res.data.kantor || '-') + '\\n\\nKode Lacak ini dapat diberikan langsung kepada PIC Pemohon / Debitur untuk melacak penugasan di halaman beranda.');
          document.getElementById('form-registrasi-jo').reset();
          document.getElementById('tarik-feedback-banner')?.classList.add('hidden');
          switchTab('board');
          await muatDataTaskBoard();
        } else {`;

const newRegSuccess = `        if (res && res.status === 'success') {
          newlyCreatedJobForDispatch = res.data;

          // Isi data modal konfirmasi registrasi
          const elJoNum = document.getElementById('confirm-jo-number'); if (elJoNum) elJoNum.textContent = res.data.jo_number || '-';
          const elTrk = document.getElementById('confirm-kode-lacak'); if (elTrk) elTrk.textContent = res.data.kode_lacak || '-';
          const elPem = document.getElementById('confirm-pemberi-tugas'); if (elPem) elPem.textContent = res.data.pemberi_tugas || res.data.instansi || '-';
          const elDeb = document.getElementById('confirm-debitur'); if (elDeb) elDeb.textContent = res.data.debitur || '-';
          const elPic = document.getElementById('confirm-pic'); if (elPic) elPic.textContent = (res.data.client_pic_name || res.data.pic_pemohon || 'PIC') + ' (' + (res.data.client_pic_phone || res.data.pic_contact || '-') + ')';

          document.getElementById('modal-konfirmasi-registrasi').classList.remove('hidden');

          document.getElementById('form-registrasi-jo').reset();
          document.getElementById('tarik-feedback-banner')?.classList.add('hidden');
          await muatDataTaskBoard();
        } else {`;

if (portal.includes(oldRegSuccess)) {
  portal = portal.replace(oldRegSuccess, newRegSuccess);
  console.log('✓ Updated eksekusiRegistrasiJO to display modal-konfirmasi-registrasi with Pemberi Tugas dispatch');
}

fs.writeFileSync('portal-tracking.html', isPortalCRLF ? portal.replace(/\n/g, '\r\n') : portal, 'utf8');
console.log('✓ portal-tracking.html fully updated');

// =============================================================================
// 2. PATCH INDEX.HTML PUBLIC STEPPER MODAL & SCRIPT
// =============================================================================
let indexHtml = fs.readFileSync('index.html', 'utf8');
const isIndexCRLF = indexHtml.includes('\r\n');
indexHtml = indexHtml.replace(/\r\n/g, '\n');

// A. Overview Card in Public Stepper Modal
const oldPubOverview = `          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Instansi Pemohon:</span>
              <strong id="pub-modal-instansi" class="text-white">PT Bank Tabungan Negara (Persero) Tbk</strong>
              <p id="pub-modal-unit-kerja" class="text-[11px] text-sky-400">KC Jakarta Harmoni</p>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Nama Debitur:</span>
              <strong id="pub-modal-debitur" class="text-amber-300">PT Bangun Prima Perkasa</strong>
              <p id="pub-modal-pic-contact" class="text-[11px] text-slate-400">PIC: Bambang Sudarsono (081288997766)</p>
            </div>
          </div>`;

const newPubOverview = `          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Pemberi Tugas (Client - SPI 103):</span>
              <strong id="pub-modal-pemberi-tugas" class="text-white block">-</strong>
              <p class="text-[11px] text-slate-400">Pengguna Laporan: <span id="pub-modal-pengguna-laporan" class="text-sky-300 font-medium">-</span></p>
              <p id="pub-modal-unit-kerja" class="text-[10px] text-slate-500 font-mono">-</p>
              <input type="hidden" id="pub-modal-instansi">
            </div>
            <div class="space-y-0.5">
              <span class="text-[10px] text-slate-400 uppercase font-semibold block">Nama Debitur / Entitas:</span>
              <strong id="pub-modal-debitur" class="text-amber-300 block">-</strong>
              <p class="text-[11px] text-slate-300">PIC Pemberi Tugas: <span id="pub-modal-pic-contact" class="text-emerald-400 font-mono font-medium">-</span></p>
              <p id="pub-modal-tujuan" class="text-[10px] text-slate-400 font-medium"></p>
            </div>
          </div>`;

if (indexHtml.includes(oldPubOverview)) {
  indexHtml = indexHtml.replace(oldPubOverview, newPubOverview);
  console.log('✓ Updated index.html public stepper overview card with client & intended user');
} else {
  console.log('oldPubOverview in index.html not matched (might be already modified)');
}

// B. Script in index.html: bukaModalTrackingPublik
const oldPubScriptPopulate = `      document.getElementById('pub-modal-spk-number').textContent = job.spk_number || '-';
      document.getElementById('pub-modal-instansi').textContent = job.instansi || '-';
      document.getElementById('pub-modal-unit-kerja').textContent = job.unit_kerja || job.kantor || '-';
      document.getElementById('pub-modal-debitur').textContent = job.debitur || '-';
      document.getElementById('pub-modal-pic-contact').textContent = 'PIC: ' + (job.pic_pemohon || '-') + ' (' + (job.pic_contact || '-') + ')';`;

const newPubScriptPopulate = `      document.getElementById('pub-modal-spk-number').textContent = job.spk_number || '-';
      const elPem = document.getElementById('pub-modal-pemberi-tugas'); if (elPem) elPem.textContent = job.pemberi_tugas || job.instansi || '-';
      const elPeng = document.getElementById('pub-modal-pengguna-laporan'); if (elPeng) elPeng.textContent = job.pengguna_laporan || job.pemberi_tugas || job.instansi || '-';
      const elInst = document.getElementById('pub-modal-instansi'); if (elInst) elInst.textContent = job.pemberi_tugas || job.instansi || '-';
      const elUnit = document.getElementById('pub-modal-unit-kerja'); if (elUnit) elUnit.textContent = job.unit_kerja || job.kantor || '-';
      const elDeb = document.getElementById('pub-modal-debitur'); if (elDeb) elDeb.textContent = job.debitur || '-';
      const elPic = document.getElementById('pub-modal-pic-contact'); if (elPic) elPic.textContent = (job.client_pic_name || job.pic_pemohon || '-') + ' (' + (job.client_pic_phone || job.pic_contact || '-') + ')';
      const elTuj = document.getElementById('pub-modal-tujuan'); if (elTuj) elTuj.textContent = job.tujuan_penilaian ? ('Tujuan: ' + job.tujuan_penilaian) : '';`;

if (indexHtml.includes(oldPubScriptPopulate)) {
  indexHtml = indexHtml.replace(oldPubScriptPopulate, newPubScriptPopulate);
  console.log('✓ Updated bukaModalTrackingPublik populate script in index.html');
}

fs.writeFileSync('index.html', isIndexCRLF ? indexHtml.replace(/\n/g, '\r\n') : indexHtml, 'utf8');
console.log('✓ index.html fully updated');
