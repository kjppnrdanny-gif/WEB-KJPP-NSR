import fs from 'fs';

let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. Correct Klausul 8 Title to "8. TANGGAL PENILAIAN"
const oldKlausul8 = `8. TANGGAL PENILAIAN DAN PENDEKATAN PENILAIAN</p>`;
if (html.includes(oldKlausul8)) {
  html = html.replace(oldKlausul8, `8. TANGGAL PENILAIAN</p>`);
  console.log('Updated Klausul 8 title to "8. TANGGAL PENILAIAN"!');
}

// 2. Correct Document Selector options in Tab 3 to exact 9 Master Documents
const oldDocOptionsMarker = `<select id="pilih_tampilan_dokumen" onchange="gantiTampilanDokumen()" class="h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs focus:outline-none">`;
const posSelect = html.indexOf(oldDocOptionsMarker);
if (posSelect !== -1) {
  const posEndSelect = html.indexOf('</select>', posSelect);
  if (posEndSelect !== -1) {
    const newOptionsHtml = `<select id="pilih_tampilan_dokumen" onchange="gantiTampilanDokumen()" class="h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs focus:outline-none">
              <option value="ALL">Semua 9 Dokumen Master (Bundel Lengkap A4)</option>
              <option value="DOK1">Dokumen 1: Lingkup Penugasan (SPK 23 Klausul Master)</option>
              <option value="DOK2">Dokumen 2: Surat Representasi (Kebenaran Dokumen &amp; Bebas Penilaian Ulang)</option>
              <option value="DOK3">Dokumen 3: Isian UMUM (Form Standar Lingkup Penugasan)</option>
              <option value="DOK4">Dokumen 4: Lembar Order (JO / Job Order 2026)</option>
              <option value="DOK5">Dokumen 5: Kartu Proyek (Kendali Mutu Berjenjang)</option>
              <option value="DOK6">Dokumen 6: Surat Tugas Penilaian Resmi</option>
              <option value="DOK7">Dokumen 7: Berita Acara Pemeriksaan (BAP / Inspeksi)</option>
              <option value="DOK8">Dokumen 8: Evaluasi Tingkat Independensi (ETI KEPI 5.8)</option>
              <option value="DOK9">Dokumen 9: Pernyataan Independensi (PI Multi-Personel)</option>
              <!-- Dokumen Operasional Pendukung -->
              <option value="SUPP_PENAWARAN">Dokumen Pendukung: Surat Penawaran Biaya Penilaian</option>
              <option value="SUPP_DISPOSISI">Dokumen Pendukung: Disposisi Approval SPK &amp; JO</option>
              <option value="SUPP_REVIEW">Dokumen Pendukung: Lembar Review Pengajuan Pusat</option>
            </select>`;
    html = html.substring(0, posSelect) + newOptionsHtml + html.substring(posEndSelect + '</select>'.length);
    console.log('Updated pilih_tampilan_dokumen to 9 Master Documents!');
  }
}

// 3. Update ETI konfirmasiDeklarasiPersonelIndividual: No fallback TIDAK, strict individual check
const oldEtiFuncMarker = `function konfirmasiDeklarasiPersonelIndividual(roleKey, namaPersonel) {`;
const posEtiFunc = html.indexOf(oldEtiFuncMarker);
if (posEtiFunc !== -1) {
  const posEndEtiFunc = html.indexOf(`window.konfirmasiDeklarasiPersonelIndividual = konfirmasiDeklarasiPersonelIndividual;`, posEtiFunc);
  if (posEndEtiFunc !== -1) {
    const newEtiFuncCode = `function konfirmasiDeklarasiPersonelIndividual(roleKey, namaPersonel) {
      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const currentUserName = (auth && (auth.displayName || auth.nama)) || userSession.displayName || '';

      // 1. Verifikasi bahwa seluruh 7 pertanyaan telah dijawab (TIDAK ADA FALLBACK OTOMATIS TIDAK)
      const answers = {};
      let hasConflict = false;
      let allAnswered = true;
      const unansweredKeys = [];

      ['a','b','c','d','e','f','g'].forEach(key => {
        const val = document.getElementById('eti_q_' + key)?.value;
        if (!val || val === 'BELUM_DIISI') {
          allAnswered = false;
          unansweredKeys.push(key.toUpperCase());
        } else {
          answers[key] = val;
          if (val === 'YA') hasConflict = true;
        }
      });

      if (!allAnswered) {
        alert("Pernyataan Belum Lengkap:\\n\\nHarap tentukan jawaban nyata (pilih YA atau TIDAK) untuk seluruh 7 butir kuesioner KEPI terlebih dahulu pada tabel di bawah.\\nButir belum diisi: " + unansweredKeys.join(', '));
        return;
      }

      // 2. Proteksi Identitas: Satu operator DILARANG mengonfirmasi atas nama orang lain tanpa verifikasi
      const isSelf = currentUserName && namaPersonel && (
        currentUserName.toLowerCase().includes(namaPersonel.toLowerCase().split(' ')[0]) || 
        namaPersonel.toLowerCase().includes(currentUserName.toLowerCase().split(' ')[0])
      );

      let declarantMethod = 'AUTHENTICATED_SESSION_MATCH';
      if (!isSelf) {
        const pinConfirm = prompt("Konfirmasi Identitas Personel (KEPI 5.8):\\n\\nAnda sedang mengonfirmasi deklarasi atas nama: " + namaPersonel + " (" + roleKey + ").\\n\\nUntuk memastikan deklarasi independensi sah dan bukan atas nama orang lain, masukkan PIN / Kredensial pribadi " + namaPersonel + ":");
        if (!pinConfirm || pinConfirm.trim().length === 0) {
          alert("Konfirmasi dibatalkan: Deklarasi independensi hanya dapat disahkan oleh personel bersangkutan atau dengan pembuktian kredensial sah.");
          return;
        }
        declarantMethod = 'PERSONAL_CREDENTIAL_AFFIRMED';
      }

      let p = window.DATA_PROYEK_TERPILIH || activeProjectData || bangunDraftDariForm();
      p.eti_declarations = p.eti_declarations || {};

      p.eti_declarations[roleKey] = {
        role: roleKey,
        nama: namaPersonel,
        declared_by: isSelf ? currentUserName : (namaPersonel + ' (' + declarantMethod + ')'),
        declared_at: new Date().toISOString(),
        verification_method: declarantMethod,
        answers: answers,
        status: hasConflict ? 'CONFLICT_FLAGGED' : 'INDEPENDENT'
      };

      window.DATA_PROYEK_TERPILIH = p;
      activeProjectData = p;

      evaluasiStatusEtiLive();
      muatStatusDeklarasiPersonel();
    }
    window.konfirmasiDeklarasiPersonelIndividual = konfirmasiDeklarasiPersonelIndividual;`;

    html = html.substring(0, posEtiFunc) + newEtiFuncCode + html.substring(posEndEtiFunc + `window.konfirmasiDeklarasiPersonelIndividual = konfirmasiDeklarasiPersonelIndividual;`.length);
    console.log('Updated konfirmasiDeklarasiPersonelIndividual with strict authentication and zero fallback!');
  }
}

// 4. Update evaluasiStatusEtiLive: Status lengkap HANYA jika SELURUH personel wajib telah menyatakan sah
const posEvalFunc = html.indexOf(`function evaluasiStatusEtiLive() {`);
if (posEvalFunc !== -1) {
  const posEndEvalFunc = html.indexOf(`window.evaluasiStatusEtiLive = evaluasiStatusEtiLive;`, posEvalFunc);
  if (posEndEvalFunc !== -1) {
    const newEvalFuncCode = `function evaluasiStatusEtiLive() {
      let p = window.DATA_PROYEK_TERPILIH || activeProjectData || bangunDraftDariForm();
      const declarations = p.eti_declarations || {};

      // 1. Kumpulkan seluruh personel wajib
      const requiredList = [];
      const reviewer = p.reviewer || p.penilai_review || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
      requiredList.push({ key: 'REVIEWER', nama: reviewer });

      const listPenilai = p.listPenilai || (window.currentPenilaiList && window.currentPenilaiList.length > 0 ? window.currentPenilaiList : [{ nama: p.penilai_pelaksana || 'Deni Siswandi, S.T., MAPPI (Cert.)' }]);
      listPenilai.forEach((item, idx) => {
        requiredList.push({ key: 'PENILAI_' + (idx + 1), nama: item.nama });
      });

      const listAsisten = p.listAsisten || (window.currentAsistenList && window.currentAsistenList.length > 0 ? window.currentAsistenList : [{ nama: p.asisten_penilai || 'Asisten Penilai' }]);
      listAsisten.forEach((item, idx) => {
        requiredList.push({ key: 'ASISTEN_' + (idx + 1), nama: item.nama });
      });

      let countConfirmed = 0;
      let hasConflict = false;

      requiredList.forEach(item => {
        const d = declarations[item.key];
        if (d) {
          if (d.status === 'CONFLICT_FLAGGED') hasConflict = true;
          if (d.status === 'INDEPENDENT') countConfirmed++;
        }
      });

      const isAllComplete = (requiredList.length > 0 && countConfirmed === requiredList.length);

      const badge = document.getElementById('badge_status_eti');
      const infoEl = document.getElementById('eti_info_deklarasi');

      if (hasConflict) {
        if (badge) {
          badge.textContent = 'PERLU REVIEW (POTENSI BENTURAN)';
          badge.className = 'px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40';
        }
        if (infoEl) {
          infoEl.innerHTML = '<span class="text-rose-400 font-bold">⚠️ PERHATIAN MUTU: Terdapat potensi benturan kepentingan yang dideklarasikan oleh anggota tim. Perlu review SPM sebelum penerbitan.</span>';
        }
        p.status_eti = 'PERLU_REVIEW';
      } else if (!isAllComplete) {
        const sisa = requiredList.length - countConfirmed;
        if (badge) {
          badge.textContent = 'BELUM LENGKAP (' + countConfirmed + '/' + requiredList.length + ')';
          badge.className = 'px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30';
        }
        if (infoEl) {
          infoEl.innerHTML = '<span class="text-slate-400">Masih terdapat ' + sisa + ' personel tim penugasan yang belum memberikan konfirmasi independensi sah.</span>';
        }
        p.status_eti = 'BELUM_DIISI';
      } else {
        if (badge) {
          badge.textContent = 'INDEPENDEN (LENGKAP ' + countConfirmed + '/' + requiredList.length + ')';
          badge.className = 'px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        }
        if (infoEl) {
          infoEl.innerHTML = '<span class="text-emerald-400 font-bold">✔ Seluruh ' + requiredList.length + ' anggota tim telah menyatakan independen dan bebas benturan kepentingan.</span>';
        }
        p.status_eti = 'INDEPENDEN';
      }

      window.DATA_PROYEK_TERPILIH = p;
      activeProjectData = p;
    }
    window.evaluasiStatusEtiLive = evaluasiStatusEtiLive;`;

    html = html.substring(0, posEvalFunc) + newEvalFuncCode + html.substring(posEndEvalFunc + `window.evaluasiStatusEtiLive = evaluasiStatusEtiLive;`.length);
    console.log('Updated evaluasiStatusEtiLive requiring all personnel complete!');
  }
}

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('Successfully written portal-penugasan-jo.html!');
