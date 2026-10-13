// scripts/apply-rekanan-update.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Import master dataset
import { DATA_REKANAN, KATEGORI_REKANAN } from '../lib/data-rekanan.js';

const targetHtmlPath = path.join(ROOT_DIR, 'portofolio-rekanan.html');
let html = fs.readFileSync(targetHtmlPath, 'utf8');

console.log('Original portofolio-rekanan.html size:', html.length);

// 1. GENERATE STATIC FILTER BUTTONS
const filterButtonsHtml = `
            <button onclick="filterKategoriRekanan('semua', this)" class="btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-sm shrink-0 whitespace-nowrap">Semua (45)</button>
            <button onclick="filterKategoriRekanan('bank-bumn-bumd', this)" class="btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap">Bank BUMN &amp; BUMD (5)</button>
            <button onclick="filterKategoriRekanan('bank-swasta', this)" class="btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap">Bank Swasta (8)</button>
            <button onclick="filterKategoriRekanan('bumn-anak-usaha', this)" class="btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap">BUMN &amp; Anak Usaha (15)</button>
            <button onclick="filterKategoriRekanan('instansi-pemerintah', this)" class="btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap">Instansi Pemerintah &amp; Lembaga Khusus (3)</button>
            <button onclick="filterKategoriRekanan('perusahaan-swasta', this)" class="btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap">Perusahaan Swasta (3)</button>
            <button onclick="filterKategoriRekanan('pembiayaan-lelang', this)" class="btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap">Pembiayaan, Modal Ventura &amp; Lelang (3)</button>
            <button onclick="filterKategoriRekanan('bpr-bprs', this)" class="btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap">BPR &amp; BPRS (6)</button>
            <button onclick="filterKategoriRekanan('asuransi', this)" class="btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap">Asuransi (2)</button>`;

// 2. GENERATE STATIC DIAMOND HTML (45 logos in rows [4, 6, 8, 9, 8, 6, 4])
const rowPattern = [4, 6, 8, 9, 8, 6, 4];
let staticDiamondHtml = '';
let itemPointer = 0;

function createStaticLogoPill(item) {
  return `              <div class="diamond-logo-pill relative group shrink-0 focus-within:z-40 focus:outline-none" tabindex="0" role="button" aria-label="${item.namaTampilan || item.name}">
                <div class="w-[70px] sm:w-[84px] md:w-[98px] lg:w-[108px] h-[38px] sm:h-[44px] md:h-[48px] lg:h-[50px] px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-white hover:bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md flex items-center justify-center transition-all duration-150 hover:scale-[1.05] active:scale-[1.02]">
                  <img src="${item.src}" alt="${item.alt}" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-150" loading="eager">
                </div>
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex group-focus:flex group-focus-within:flex flex-col items-center z-50 transition-opacity duration-150">
                  <div class="bg-slate-950/95 text-white text-[11px] font-semibold py-2 px-3 rounded-xl shadow-2xl border border-slate-700/80 whitespace-nowrap max-w-[300px] text-center">
                    <span class="text-white block font-bold leading-tight truncate">${item.namaTampilan || item.name}</span>
                    <span class="text-[9px] text-amber-400 font-semibold uppercase tracking-wider block mt-0.5">${item.katNama}</span>
                    ${item.namaHistoris ? `<span class="text-[9px] text-slate-400 font-normal block mt-0.5 italic truncate">Histori: ${item.namaHistoris}</span>` : ''}
                  </div>
                  <div class="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700/80"></div>
                </div>
              </div>`;
}

rowPattern.forEach(rowCount => {
  staticDiamondHtml += `            <div class="diamond-row flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 my-0.5 sm:my-1">\n`;
  for (let i = 0; i < rowCount; i++) {
    if (itemPointer < DATA_REKANAN.length) {
      staticDiamondHtml += createStaticLogoPill(DATA_REKANAN[itemPointer]) + '\n';
      itemPointer++;
    }
  }
  staticDiamondHtml += `            </div>\n`;
});

// 3. GENERATE STATIC TABLE ROWS HTML
let staticTableRowsHtml = '';
DATA_REKANAN.forEach((item, idx) => {
  staticTableRowsHtml += `            <tr class="baris-rekanan hover:bg-slate-50 transition border-b border-slate-100" data-kat="${item.kat}" data-nama="${item.aliasPencarian || item.namaResmi}">
              <td class="p-3 font-mono text-center text-slate-500">${String(item.id).padStart(2, '0')}</td>
              <td class="p-3 font-bold text-slate-900">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                    <img src="${item.src}" alt="${item.alt}" class="max-h-full max-w-full object-contain" loading="lazy">
                  </div>
                  <div>
                    <span class="block">${item.namaTampilan || item.name}</span>
                    ${item.namaHistoris ? `<span class="block text-[10px] text-slate-500 font-normal italic mt-0.5">Histori: ${item.namaHistoris}</span>` : ''}
                  </div>
                </div>
              </td>
              <td class="p-3 text-sky-800 font-semibold text-xs whitespace-nowrap">${item.katNama}</td>
              <td class="p-3 text-slate-600 text-xs">
                <div>${item.desc}</div>
                ${item.lingkupKerjaSama && item.lingkupKerjaSama !== item.desc ? `<div class="text-[11px] text-slate-500 mt-0.5">${item.lingkupKerjaSama}</div>` : ''}
              </td>
              <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">${item.statusKerjaSama || 'Aktif'}</span></td>
            </tr>\n`;
});

// 4. GENERATE JAVASCRIPT LOGIC
const jsDataString = JSON.stringify(DATA_REKANAN, null, 2);
const jsKategoriString = JSON.stringify(KATEGORI_REKANAN, null, 2);

const jsLogicBlock = `
    const KATEGORI_REKANAN = ${jsKategoriString};
    const DATA_REKANAN = ${jsDataString};
    window.KATEGORI_REKANAN = KATEGORI_REKANAN;
    window.DATA_REKANAN = DATA_REKANAN;

    let currentKat = 'semua';
    let currentView = 'diamond';

    function getDiamondRowsPattern(count) {
      if (count <= 0) return [];
      if (count === 1) return [1];
      if (count === 2) return [1, 1];
      if (count === 3) return [1, 2];
      if (count === 4) return [1, 2, 1];
      if (count === 5) return [1, 3, 1];
      if (count === 6) return [1, 2, 2, 1];
      if (count === 7) return [1, 2, 3, 1];
      if (count === 8) return [2, 4, 2];
      if (count === 9) return [2, 5, 2];
      if (count === 10) return [2, 3, 3, 2];
      if (count === 11) return [1, 3, 4, 3];
      if (count === 12) return [2, 4, 4, 2];
      if (count === 13) return [2, 4, 5, 2];
      if (count === 14) return [2, 4, 5, 3];
      if (count === 15) return [2, 4, 5, 4];
      if (count === 16) return [2, 4, 5, 3, 2];
      if (count === 17) return [2, 4, 6, 3, 2];
      if (count === 18) return [2, 4, 6, 4, 2];
      if (count === 19) return [2, 5, 6, 4, 2];
      if (count === 20) return [2, 5, 6, 5, 2];

      const w = window.innerWidth || 1200;
      if (count === 45) {
        if (w >= 1024) return [4, 6, 8, 9, 8, 6, 4];
        if (w >= 640) return [2, 4, 5, 6, 6, 6, 5, 5, 4, 2];
        return [2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2];
      }

      let numRows = Math.min(Math.ceil(count / 3), 7);
      if (numRows % 2 === 0) numRows++;
      let mid = Math.floor(numRows / 2);
      let base = Math.floor(count / numRows);
      let rows = [];
      for (let i = 0; i < numRows; i++) {
        let diff = mid - Math.abs(i - mid);
        rows.push(Math.max(1, base + diff - 1));
      }
      let currentSum = rows.reduce((a, b) => a + b, 0);
      let diff = count - currentSum;
      while (diff > 0) {
        rows[mid]++;
        diff--;
      }
      while (diff < 0) {
        let idx = rows.indexOf(Math.max(...rows));
        rows[idx]--;
        diff++;
      }
      return rows;
    }

    function createLogoElement(item) {
      const el = document.createElement('div');
      el.className = 'diamond-logo-pill relative group shrink-0 focus-within:z-40 focus:outline-none';
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', item.namaTampilan || item.name);

      el.innerHTML = \`
        <div class="w-[70px] sm:w-[84px] md:w-[98px] lg:w-[108px] h-[38px] sm:h-[44px] md:h-[48px] lg:h-[50px] px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-white hover:bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md flex items-center justify-center transition-all duration-150 hover:scale-[1.05] active:scale-[1.02]">
          <img src="\${item.src}" alt="\${item.alt}" class="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition-all duration-150" loading="eager">
        </div>
        <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex group-focus:flex group-focus-within:flex flex-col items-center z-50 transition-opacity duration-150">
          <div class="bg-slate-950/95 text-white text-[11px] font-semibold py-2 px-3 rounded-xl shadow-2xl border border-slate-700/80 whitespace-nowrap max-w-[300px] text-center">
            <span class="text-white block font-bold leading-tight truncate">\${item.namaTampilan || item.name}</span>
            <span class="text-[9px] text-amber-400 font-semibold uppercase tracking-wider block mt-0.5">\${item.katNama}</span>
            \${item.namaHistoris ? \`<span class="text-[9px] text-slate-400 font-normal block mt-0.5 italic truncate">Histori: \${item.namaHistoris}</span>\` : ''}
          </div>
          <div class="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700/80"></div>
        </div>
      \`;
      return el;
    }

    function renderDiamondConstellation(items) {
      const container = document.getElementById('diamond-constellation');
      const counter = document.getElementById('diamond-counter');
      if (!container) return;

      container.innerHTML = '';
      if (counter) {
        counter.textContent = \`Menampilkan \${items.length} dari 45 Rekanan Resmi Terdaftar\`;
      }

      if (items.length === 0) return;

      const pattern = getDiamondRowsPattern(items.length);
      let itemIdx = 0;

      pattern.forEach(rowCount => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'diamond-row flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 my-0.5 sm:my-1';

        for (let i = 0; i < rowCount; i++) {
          if (itemIdx < items.length) {
            rowDiv.appendChild(createLogoElement(items[itemIdx]));
            itemIdx++;
          }
        }
        container.appendChild(rowDiv);
      });
    }

    function renderTableView(items) {
      const tbody = document.getElementById('table-rekanan-body');
      if (!tbody) return;
      tbody.innerHTML = '';

      items.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
        tr.setAttribute('data-kat', item.kat);
        tr.setAttribute('data-nama', item.aliasPencarian || item.namaResmi);
        tr.innerHTML = \`
          <td class="p-3 font-mono text-center text-slate-500">\${String(item.id).padStart(2, '0')}</td>
          <td class="p-3 font-bold text-slate-900">
            <div class="flex items-center gap-3">
              <div class="w-10 h-8 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                <img src="\${item.src}" alt="\${item.alt}" class="max-h-full max-w-full object-contain" loading="lazy">
              </div>
              <div>
                <span class="block">\${item.namaTampilan || item.name}</span>
                \${item.namaHistoris ? \`<span class="block text-[10px] text-slate-500 font-normal italic mt-0.5">Histori: \${item.namaHistoris}</span>\` : ''}
              </div>
            </div>
          </td>
          <td class="p-3 text-sky-800 font-semibold text-xs whitespace-nowrap">\${item.katNama}</td>
          <td class="p-3 text-slate-600 text-xs">
            <div>\${item.desc}</div>
            \${item.lingkupKerjaSama && item.lingkupKerjaSama !== item.desc ? \`<div class="text-[11px] text-slate-500 mt-0.5">\${item.lingkupKerjaSama}</div>\` : ''}
          </td>
          <td class="p-3 text-center"><span class="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px]">\${item.statusKerjaSama || 'Aktif'}</span></td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function getFilteredItems() {
      const q = (document.getElementById('cari-mitra')?.value || '').toLowerCase().trim();
      const btnReset = document.getElementById('btn-reset-cari');
      if (btnReset) {
        if (q || currentKat !== 'semua') btnReset.classList.remove('hidden');
        else btnReset.classList.add('hidden');
      }

      return DATA_REKANAN.filter(item => {
        const matchKat = (currentKat === 'semua' || item.kat === currentKat);
        if (!matchKat) return false;
        if (!q) return true;

        const searchable = [
          item.namaResmi,
          item.namaTampilan,
          item.name,
          item.namaSingkat,
          item.namaHistoris,
          item.aliasPencarian,
          item.indukAfiliasi,
          item.unitOperasional,
          item.wilayahKerja,
          item.katNama,
          item.desc,
          item.lingkupKerjaSama
        ].filter(Boolean).join(' ').toLowerCase();

        return searchable.includes(q);
      });
    }

    function filterMitra() {
      const filtered = getFilteredItems();
      const emptyState = document.getElementById('rekanan-empty-state');
      const viewDiamond = document.getElementById('view-diamond');
      const viewTable = document.getElementById('view-table');

      renderDiamondConstellation(filtered);
      renderTableView(filtered);

      if (filtered.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (viewDiamond) viewDiamond.classList.add('hidden');
        if (viewTable) viewTable.classList.add('hidden');
      } else {
        if (emptyState) emptyState.classList.add('hidden');
        if (currentView === 'diamond') {
          if (viewDiamond) viewDiamond.classList.remove('hidden');
          if (viewTable) viewTable.classList.add('hidden');
        } else {
          if (viewDiamond) viewDiamond.classList.add('hidden');
          if (viewTable) viewTable.classList.remove('hidden');
        }
      }
    }

    function filterKategoriRekanan(kat, btn) {
      currentKat = kat;
      document.querySelectorAll('.btn-kat-rekanan').forEach(b => {
        b.className = 'btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap';
      });
      if (btn) {
        btn.className = 'btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-sm shrink-0 whitespace-nowrap';
      }
      filterMitra();
    }

    function resetFilterMitra() {
      const inp = document.getElementById('cari-mitra');
      if (inp) inp.value = '';
      currentKat = 'semua';
      const allBtn = document.querySelector('.btn-kat-rekanan');
      if (allBtn) {
        document.querySelectorAll('.btn-kat-rekanan').forEach(b => {
          b.className = 'btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 shrink-0 whitespace-nowrap';
        });
        allBtn.className = 'btn-kat-rekanan px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-sm shrink-0 whitespace-nowrap';
      }
      filterMitra();
    }

    function setViewMode(mode) {
      currentView = mode;
      const vd = document.getElementById('view-diamond');
      const vt = document.getElementById('view-table');
      const btnD = document.getElementById('btn-view-diamond');
      const btnT = document.getElementById('btn-view-table');

      if (mode === 'diamond') {
        if (vd) vd.classList.remove('hidden');
        if (vt) vt.classList.add('hidden');
        if (btnD) btnD.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 shadow-sm transition';
        if (btnT) btnT.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition';
      } else {
        if (vd) vd.classList.add('hidden');
        if (vt) vt.classList.remove('hidden');
        if (btnD) btnD.className = 'px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition';
        if (btnT) btnT.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-amber-400 border border-slate-800 shadow-sm transition';
      }
      filterMitra();
    }

    let lastResizeWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      if (Math.abs(window.innerWidth - lastResizeWidth) > 50) {
        lastResizeWidth = window.innerWidth;
        if (currentView === 'diamond') {
          renderDiamondConstellation(getFilteredItems());
        }
      }
    });

    window.addEventListener('DOMContentLoaded', () => {
      filterMitra();
    });
`;

// REPLACE FILTER BAR IN HTML
const filterBarStartMarker = '<!-- Filter Bar Rekanan -->';
const viewDiamondMarker = '<!-- VIEW 1: Diamond Constellation Cluster -->';
const filterBarEndIndex = html.indexOf(viewDiamondMarker);
const filterBarStartIndex = html.indexOf(filterBarStartMarker);

if (filterBarStartIndex === -1 || filterBarEndIndex === -1) {
  throw new Error('Could not find Filter Bar markers in HTML');
}

const newFilterBar = `<!-- Filter Bar Rekanan -->
        <div class="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center gap-3">
          <div class="flex-1 relative flex items-center">
            <div class="absolute left-3.5 text-slate-400 pointer-events-none">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input id="cari-mitra" type="text" onkeyup="filterMitra()" placeholder="Cari rekanan: BRI, Sampoerna, Pertamina, PHSS, PLN, PTPN VIII, Pegadaian, BPR Sukabumi..." class="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:bg-white focus:outline-none transition">
            <button id="btn-reset-cari" type="button" onclick="resetFilterMitra()" class="absolute right-2.5 text-slate-400 hover:text-slate-700 p-1 text-xs hidden" title="Reset pencarian & filter">&times;</button>
          </div>
          <div class="overflow-x-auto no-scrollbar py-1 flex items-center gap-1.5 md:flex-wrap" id="filter-buttons-container">
${filterButtonsHtml}
          </div>
        </div>

        `;

html = html.slice(0, filterBarStartIndex) + newFilterBar + html.slice(filterBarEndIndex);

// REPLACE STATIC DIAMOND CONSTELLATION
const diamondStartMarker = '<div id="diamond-constellation" class="flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 py-2 sm:py-4 overflow-hidden">';
const diamondEndMarker = '<!-- Bottom Summary Bar -->';
const diamondStartIndex = html.indexOf(diamondStartMarker);
const diamondEndIndex = html.indexOf(diamondEndMarker);

if (diamondStartIndex === -1 || diamondEndIndex === -1) {
  throw new Error(`Could not find diamond constellation markers: start=${diamondStartIndex}, end=${diamondEndIndex}`);
}

const newDiamondBlock = `<div id="diamond-constellation" class="flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 py-2 sm:py-4 overflow-hidden">
${staticDiamondHtml}            </div>

            `;

html = html.slice(0, diamondStartIndex) + newDiamondBlock + html.slice(diamondEndIndex);

// REPLACE STATIC TABLE BODY
const tableStartMarker = '<tbody id="table-rekanan-body" class="divide-y divide-slate-100 text-slate-800">';
const tableEndMarker = '</tbody>';
const tableStartIndex = html.indexOf(tableStartMarker);
const tableEndIndex = html.indexOf(tableEndMarker, tableStartIndex);

if (tableStartIndex === -1 || tableEndIndex === -1) {
  throw new Error(`Could not find table body markers: start=${tableStartIndex}, end=${tableEndIndex}`);
}

const newTableBlock = `<tbody id="table-rekanan-body" class="divide-y divide-slate-100 text-slate-800">
${staticTableRowsHtml}            `;

html = html.slice(0, tableStartIndex) + newTableBlock + html.slice(tableEndIndex);

// REPLACE JAVASCRIPT DATA AND FUNCTIONS
const jsStartMarker = html.includes('const KATEGORI_REKANAN = [') ? 'const KATEGORI_REKANAN = [' : 'const DATA_REKANAN = [';
const jsEndMarker = 'function bukaLightbox(src, judul, ket)';
const jsStartIndex = html.indexOf(jsStartMarker);
const jsEndIndex = html.indexOf(jsEndMarker);

if (jsStartIndex === -1 || jsEndIndex === -1) {
  throw new Error('Could not find JavaScript markers');
}

html = html.slice(0, jsStartIndex) + jsLogicBlock.trim() + '\n\n    ' + html.slice(jsEndIndex);

fs.writeFileSync(targetHtmlPath, html, 'utf8');
console.log('✅ Successfully updated portofolio-rekanan.html! New size:', html.length);
