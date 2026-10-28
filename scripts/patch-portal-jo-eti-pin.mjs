import fs from 'fs';

let html = fs.readFileSync('portal-penugasan-jo.html', 'utf8');

// 1. Replace button in panel_deklarasi_eti
const oldButtonHtml = `<button type="button" onclick="deklarasiSemuaIndependen()" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold transition flex items-center gap-1.5 shadow cursor-pointer">
                    <span>✔ Deklarasi Bebas Benturan Kepentingan</span>
                  </button>`;

const newPersonnelSectionHtml = `<!-- Indikator Kepatuhan Per Personel (Zero Omnibus / Individual Tracking) -->
                <div class="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-300">Status Deklarasi Per Personel Tim Penugasan:</span>
                    <span class="text-[10px] text-slate-400">Setiap personel wajib mengonfirmasi independensi secara individual</span>
                  </div>
                  <div id="container-personel-eti-status" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <!-- Dinamis di-render oleh muatStatusDeklarasiPersonel() -->
                  </div>
                </div>`;

// Replace the omnibus button with an informative header status and include the personnel tracking container
if (html.includes(oldButtonHtml)) {
  html = html.replace(oldButtonHtml, `<!-- Omnibus button removed: Declarations must be confirmed individually per personnel -->`);
  console.log('Removed omnibus deklarasiSemuaIndependen button!');
} else {
  console.log('Old button HTML not exact match, searching flexible...');
  const btnRegex = /<button type="button" onclick="deklarasiSemuaIndependen\(\)"[^>]*>[\s\S]*?<\/button>/;
  if (btnRegex.test(html)) {
    html = html.replace(btnRegex, `<!-- Omnibus button removed: Declarations must be confirmed individually per personnel -->`);
    console.log('Removed omnibus button via regex!');
  }
}

// 2. Insert container-personel-eti-status right before the 7 questions table
const tableEtiMarker = `<!-- Tabel 7 Butir Kuesioner ETI Sesuai Master Template JO.xlsx -->`;
if (html.includes(tableEtiMarker)) {
  html = html.replace(tableEtiMarker, `${newPersonnelSectionHtml}\n              ${tableEtiMarker}`);
  console.log('Inserted container-personel-eti-status!');
}

// 3. Update verifikasiKredensialPengesahKing and ETI JS logic
const targetFuncMarker = `function verifikasiKredensialPengesahKing() {`;
const posFunc = html.indexOf(targetFuncMarker);
if (posFunc === -1) {
  console.error("targetFuncMarker not found!");
  process.exit(1);
}

// Find the end of verifikasiKredensialPengesahKing
const posEndFunc = html.indexOf(`window.verifikasiKredensialPengesahKing = verifikasiKredensialPengesahKing;`, posFunc);
if (posEndFunc === -1) {
  console.error("posEndFunc not found!");
  process.exit(1);
}

const targetOldFuncBlock = html.substring(posFunc, posEndFunc + `window.verifikasiKredensialPengesahKing = verifikasiKredensialPengesahKing;`.length);

const newVerifFuncCode = `async function verifikasiKredensialPengesahKing() {
      const pinVal = document.getElementById('input-pin-pengesah-king')?.value?.trim();
      const pinStatus = document.getElementById('badge-status-pin-king');
      const msgVerif = document.getElementById('msg-verifikasi-pengesah-king');
      const op = stateKingOperator;
      const pId = document.getElementById('appr-target-project-id')?.value || (window.DATA_PROYEK_TERPILIH && window.DATA_PROYEK_TERPILIH.id) || '';

      if (!pinVal) {
        alert('Harap masukkan PIN atau token verifikasi pribadi pengesah.');
        return false;
      }

      if (pinStatus) {
        pinStatus.textContent = 'MEMVERIFIKASI...';
        pinStatus.className = 'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40';
      }

      try {
        const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
        const token = (auth && (auth.token || auth.sessionToken)) || localStorage.getItem('opini_session_token') || '';
        
        const res = await fetch('nolap-data-handler.php?action=verifyPengesahKing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'X-Session-Token': token
          },
          body: JSON.stringify({
            operator: op,
            credential: pinVal,
            idPenugasan: pId
          })
        });

        const json = await res.json();
        if (res.ok && json.success && json.verified) {
          stateKingVerifiedPenilai = true;
          window.stateKingVerificationProof = json.verification_proof;
          if (pinStatus) {
            pinStatus.textContent = 'TERVERIFIKASI SAH ✔';
            pinStatus.className = 'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
          }
          if (msgVerif) {
            msgVerif.innerHTML = '<span class="text-emerald-400 font-bold">✔ Identitas ' + (op === 'NANANG' ? 'Ir. Nanang Rahayu' : 'Deni Siswandi, S.T.') + ' terverifikasi sah oleh backend server.</span>';
          }
          return true;
        } else {
          throw new Error(json.error || 'Verifikasi ditolak oleh backend server.');
        }
      } catch (err) {
        stateKingVerifiedPenilai = false;
        window.stateKingVerificationProof = null;
        if (pinStatus) {
          pinStatus.textContent = 'PIN TIDAK COCOK ❌';
          pinStatus.className = 'text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40';
        }
        if (msgVerif) {
          msgVerif.innerHTML = '<span class="text-rose-400 font-bold">❌ ' + (err.message || 'Kredensial pribadi tidak valid.') + '</span>';
        }
        alert('Verifikasi Pengesah Gagal: ' + (err.message || 'Kredensial tidak valid.'));
        return false;
      }
    }
    window.verifikasiKredensialPengesahKing = verifikasiKredensialPengesahKing;`;

html = html.substring(0, posFunc) + newVerifFuncCode + html.substring(posEndFunc + `window.verifikasiKredensialPengesahKing = verifikasiKredensialPengesahKing;`.length);
console.log('Replaced verifikasiKredensialPengesahKing with backend async verification!');

// 4. Replace deklarasiSemuaIndependen with konfirmasiDeklarasiPersonelIndividual and muatStatusDeklarasiPersonel
const targetEtiLogicMarker = `function deklarasiSemuaIndependen() {`;
const posEti = html.indexOf(targetEtiLogicMarker);
if (posEti !== -1) {
  const posEndEti = html.indexOf(`window.deklarasiSemuaIndependen = deklarasiSemuaIndependen;`, posEti);
  if (posEndEti !== -1) {
    const newEtiFuncCode = `// Individual Declaration Per Required Personnel (No Omnibus / No Batch Override)
    function konfirmasiDeklarasiPersonelIndividual(roleKey, namaPersonel) {
      const auth = window.CURRENT_AUTH_SESSION || dapatkanSesiLogin() || userSession;
      const declarantNama = (auth && (auth.displayName || auth.nama)) || userSession.displayName || 'Petugas Penilai';
      
      const confirmed = confirm("Konfirmasi Pernyataan Independensi Individual (KEPI 5.8):\\n\\nPersonel: " + namaPersonel + "\\nPeran: " + roleKey + "\\n\\nApakah Anda atas nama " + namaPersonel + " menyatakan secara sah BEBAS dari benturan kepentingan (afiliasi bisnis, saham, pinjaman kredit, hubungan keluarga, atau ancaman independensi) dengan klien / debitur?\\n\\nKlik OK untuk menyetujui deklarasi independen.");
      if (!confirmed) return;

      let p = window.DATA_PROYEK_TERPILIH || activeProjectData || bangunDraftDariForm();
      p.eti_declarations = p.eti_declarations || {};

      // Get current values from the 7 questions
      const answers = {};
      let hasConflict = false;
      ['a','b','c','d','e','f','g'].forEach(key => {
        const val = document.getElementById('eti_q_' + key)?.value || 'TIDAK';
        answers[key] = val;
        if (val === 'YA') hasConflict = true;
      });

      p.eti_declarations[roleKey] = {
        role: roleKey,
        nama: namaPersonel,
        declared_by: declarantNama,
        declared_at: new Date().toISOString(),
        answers: answers,
        status: hasConflict ? 'CONFLICT_FLAGGED' : 'INDEPENDENT'
      };

      // Simpan ke state
      window.DATA_PROYEK_TERPILIH = p;
      activeProjectData = p;

      evaluasiStatusEtiLive();
      muatStatusDeklarasiPersonel();
    }
    window.konfirmasiDeklarasiPersonelIndividual = konfirmasiDeklarasiPersonelIndividual;

    function muatStatusDeklarasiPersonel() {
      const container = document.getElementById('container-personel-eti-status');
      if (!container) return;

      let p = window.DATA_PROYEK_TERPILIH || activeProjectData || bangunDraftDariForm();
      const declarations = p.eti_declarations || {};

      // Daftar personel yang wajib: Reviewer, Penilai Pelaksana, Asisten
      const requiredList = [];
      const reviewer = p.reviewer || p.penilai_review || 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)';
      requiredList.push({ key: 'REVIEWER', role: 'Reviewer / Penilai Bertanggung Jawab', nama: reviewer });

      const listPenilai = p.listPenilai || (window.currentPenilaiList && window.currentPenilaiList.length > 0 ? window.currentPenilaiList : [{ nama: p.penilai_pelaksana || 'Deni Siswandi, S.T., MAPPI (Cert.)' }]);
      listPenilai.forEach((item, idx) => {
        requiredList.push({ key: 'PENILAI_' + (idx + 1), role: 'Penilai Pelaksana ' + (idx + 1), nama: item.nama });
      });

      const listAsisten = p.listAsisten || (window.currentAsistenList && window.currentAsistenList.length > 0 ? window.currentAsistenList : [{ nama: p.asisten_penilai || 'Asisten Penilai' }]);
      listAsisten.forEach((item, idx) => {
        requiredList.push({ key: 'ASISTEN_' + (idx + 1), role: 'Asisten / Surveyor ' + (idx + 1), nama: item.nama });
      });

      let htmlCards = '';
      requiredList.forEach(item => {
        const dec = declarations[item.key];
        const isDone = Boolean(dec && dec.status === 'INDEPENDENT');
        const isConflict = Boolean(dec && dec.status === 'CONFLICT_FLAGGED');

        let badge = '<span class="text-[9.5px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">BELUM DIISI</span>';
        let actionBtn = '<button type="button" onclick="konfirmasiDeklarasiPersonelIndividual(\\'' + item.key + '\\', \\'' + item.nama.replace(/'/g, "\\\\'") + '\\')" class="mt-1.5 w-full py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[9.5px] font-bold transition">Konfirmasi Deklarasi</button>';

        if (isDone) {
          badge = '<span class="text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">TERKONFIRMASI ✔</span>';
          actionBtn = '<div class="text-[9px] text-emerald-400 mt-1 truncate">Dikonfirmasi: ' + new Date(dec.declared_at).toLocaleDateString('id-ID') + '</div>';
        } else if (isConflict) {
          badge = '<span class="text-[9.5px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">PERLU REVIEW ⚠️</span>';
          actionBtn = '<div class="text-[9px] text-rose-400 mt-1 truncate">Ada potensi benturan kepentingan</div>';
        }

        htmlCards += '<div class="p-2 bg-slate-950 rounded border border-slate-800">' +
          '<div class="flex items-center justify-between gap-1 mb-1">' +
            '<span class="text-[10px] font-bold text-slate-300 truncate">' + item.role + '</span>' +
            badge +
          '</div>' +
          '<div class="text-[10.5px] text-white font-medium truncate">' + item.nama + '</div>' +
          actionBtn +
        '</div>';
      });

      container.innerHTML = htmlCards;
    }
    window.muatStatusDeklarasiPersonel = muatStatusDeklarasiPersonel;`;

    html = html.substring(0, posEti) + newEtiFuncCode + html.substring(posEndEti + `window.deklarasiSemuaIndependen = deklarasiSemuaIndependen;`.length);
    console.log('Replaced deklarasiSemuaIndependen with konfirmasiDeklarasiPersonelIndividual & muatStatusDeklarasiPersonel!');
  }
}

// 5. Update evaluasiStatusEtiLive to require individual confirmations
const posEval = html.indexOf(`function evaluasiStatusEtiLive() {`);
if (posEval !== -1) {
  const posEndEval = html.indexOf(`window.evaluasiStatusEtiLive = evaluasiStatusEtiLive;`, posEval);
  if (posEndEval !== -1) {
    const newEvalCode = `function evaluasiStatusEtiLive() {
      const answers = {};
      let adaBelum = false;
      let adaYa = false;

      ['a','b','c','d','e','f','g'].forEach(key => {
        const val = document.getElementById('eti_q_' + key)?.value || 'BELUM_DIISI';
        answers[key] = val;
        if (val === 'BELUM_DIISI') adaBelum = true;
        if (val === 'YA') adaYa = true;
      });

      let p = window.DATA_PROYEK_TERPILIH || activeProjectData || bangunDraftDariForm();
      const declarations = p.eti_declarations || {};
      
      // Cek apakah ada deklarasi yang konflik
      let conflictInDecl = false;
      let anyDeclDone = false;
      Object.values(declarations).forEach(d => {
        if (d.status === 'CONFLICT_FLAGGED') conflictInDecl = true;
        if (d.status === 'INDEPENDENT') anyDeclDone = true;
      });

      p.eti_answers = answers;
      window.DATA_PROYEK_TERPILIH = p;
      activeProjectData = p;

      const badge = document.getElementById('badge_status_eti');
      const infoEl = document.getElementById('eti_info_deklarasi');

      if (adaYa || conflictInDecl) {
        if (badge) {
          badge.textContent = 'PERLU REVIEW (POTENSI BENTURAN)';
          badge.className = 'px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40';
        }
        if (infoEl) {
          infoEl.innerHTML = '<span class="text-rose-400 font-bold">⚠️ PERHATIAN MUTU: Terdapat potensi benturan kepentingan / relasi pada ETI. Perlu review SPM &amp; persetujuan khusus sebelum penerbitan.</span>';
        }
        p.status_eti = 'PERLU_REVIEW';
      } else if (adaBelum || !anyDeclDone) {
        if (badge) {
          badge.textContent = 'BELUM DIISI / BELUM LENGKAP';
          badge.className = 'px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30';
        }
        if (infoEl) {
          infoEl.innerHTML = '<span class="text-slate-400">Harap setiap personel tim penugasan mengonfirmasi deklarasi independensi individual.</span>';
        }
        p.status_eti = 'BELUM_DIISI';
      } else {
        if (badge) {
          badge.textContent = 'INDEPENDEN (TERVERIFIKASI SEMUA)';
          badge.className = 'px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
        }
        if (infoEl) {
          infoEl.innerHTML = '<span class="text-emerald-400 font-bold">✔ Seluruh butir kuesioner KEPI terkonfirmasi bebas dari benturan kepentingan.</span>';
        }
        p.status_eti = 'INDEPENDEN';
      }
    }
    window.evaluasiStatusEtiLive = evaluasiStatusEtiLive;`;

    html = html.substring(0, posEval) + newEvalCode + html.substring(posEndEval + `window.evaluasiStatusEtiLive = evaluasiStatusEtiLive;`.length);
    console.log('Replaced evaluasiStatusEtiLive with individual-aware logic!');
  }
}

fs.writeFileSync('portal-penugasan-jo.html', html, 'utf8');
console.log('Successfully written portal-penugasan-jo.html!');
