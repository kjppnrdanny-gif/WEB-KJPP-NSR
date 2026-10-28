import fs from 'fs';

const files = ['portal-presensi.html', 'presensi.html', 'portal-absensi.html'];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

  // 1. elBadgeRoster update
  const oldBadgeBlock = `        const elBadgeBelum = document.getElementById('hr-subtab-badge-belum');
        if (elBadgeBelum) elBadgeBelum.textContent = ringkasan.belum_presensi != null ? ringkasan.belum_presensi : (22 - (ringkasan.hadir_masuk || 0));
        const elBadgeCuti = document.getElementById('hr-subtab-badge-cuti');
        if (elBadgeCuti) elBadgeCuti.textContent = ringkasan.cuti_pending || 0;`;

  const newBadgeBlock = `        const elBadgeBelum = document.getElementById('hr-subtab-badge-belum');
        if (elBadgeBelum) elBadgeBelum.textContent = ringkasan.belum_presensi != null ? ringkasan.belum_presensi : (48 - (ringkasan.hadir_masuk || 0));
        const elBadgeRoster = document.getElementById('hr-subtab-badge-roster');
        if (elBadgeRoster) elBadgeRoster.textContent = (res.karyawan_pusat || []).length || ringkasan.total_karyawan_pusat || 48;
        const elBadgeCuti = document.getElementById('hr-subtab-badge-cuti');
        if (elBadgeCuti) elBadgeCuti.textContent = ringkasan.cuti_pending || 0;`;

  if (content.includes(oldBadgeBlock)) {
    content = content.replace(oldBadgeBlock, newBadgeBlock);
    console.log(`✓ Updated badge block in ${f}`);
  }

  // 2. Metric subtext
  content = content.replace(
    `<span class="text-[9px] text-emerald-400 block mt-0.5">Kantor Pusat</span>`,
    `<span class="text-[9px] text-emerald-400 block mt-0.5">Seluruh Kantor</span>`
  );

  // 3. Subpanel belum text
  content = content.replace(
    `Karyawan Kantor Pusat yang belum mencatatkan presensi Masuk hari ini:`,
    `Karyawan yang belum mencatatkan presensi Masuk hari ini:`
  );

  // 4. Roster card kantor badge
  const oldRosterSub = `<span class="text-[10px] text-slate-400 block truncate">\${k.nik} &bull; \${k.jabatan} (\${k.divisi})</span>`;
  const newRosterSub = `<span class="text-[10px] text-slate-300 block truncate">\${k.nik} &bull; \${k.nama}</span>
            <span class="text-[9.5px] text-amber-300 block truncate font-medium">📍 \${k.kantor || k.cabang || 'Pusat Jakarta'} &bull; \${k.jabatan}</span>`;

  if (content.includes(oldRosterSub)) {
    content = content.replace(oldRosterSub, newRosterSub);
    console.log(`✓ Updated roster card subtext in ${f}`);
  }

  // 5. Roster search filter to include branch
  const oldSearch = `(k.jabatan || '').toLowerCase().includes(kw) ||\n        (k.divisi || '').toLowerCase().includes(kw)`;
  const newSearch = `(k.jabatan || '').toLowerCase().includes(kw) ||\n        (k.divisi || '').toLowerCase().includes(kw) ||\n        (k.kantor || k.cabang || '').toLowerCase().includes(kw)`;

  if (content.includes(oldSearch)) {
    content = content.replace(oldSearch, newSearch);
    console.log(`✓ Updated roster search in ${f}`);
  }

  fs.writeFileSync(f, content.replace(/\n/g, '\r\n'), 'utf8');
});
console.log('✓ All portal files polished!');
