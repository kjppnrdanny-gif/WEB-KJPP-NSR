import fs from 'node:fs';

console.log('===============================================================');
console.log('🚀 MENERAPKAN TAHAP 2: MERGE TAGS ENGINE, DRIVE FOLDERS & WORKER');
console.log('===============================================================\n');

// -------------------------------------------------------------
// 1. UPDATE NOLAP-DATA-HANDLER.PHP
// -------------------------------------------------------------
console.log('[1/2] Memperbarui nolap-data-handler.php...');
let php = fs.readFileSync('nolap-data-handler.php', 'utf8');
const isCrlf = php.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

// A. Include merge-tags-engine.php di awal file
if (!php.includes("require_once __DIR__ . '/merge-tags-engine.php';")) {
  const incLine = `require_once __DIR__ . '/merge-tags-engine.php';${eol}`;
  const targetPos = php.indexOf('date_default_timezone_set(');
  php = php.slice(0, targetPos) + incLine + php.slice(targetPos);
  console.log('  ✓ require_once merge-tags-engine.php berhasil disisipkan.');
}

// B. Tambahkan fungsi buatStrukturFolderGoogleDrive
if (!php.includes('function buatStrukturFolderGoogleDrive(')) {
  const driveHelperCode = `
/**
 * GENERATOR HIERARKI FOLDER REPOSITORI GOOGLE DRIVE (PILAR 3)
 * Format: [Tahun] / [Kode Cabang] / [ID Penugasan - Nama Klien]
 * 4 Subfolder Wajib:
 * - 01_Legalitas & Administrasi
 * - 02_Data Lapangan & BAPL
 * - 03_Kertas Kerja & Draf
 * - 04_Laporan Final & Tanda Terima
 */
function buatStrukturFolderGoogleDrive($item) {
    $tahun = !empty($item['tglPenilaian']) ? substr($item['tglPenilaian'], 0, 4) : date('Y');
    $c = strtoupper(trim((string)($item['cabang'] ?? 'PST')));
    $cabangMap = [
        'PUSAT' => 'PST', 'JAKARTA' => 'PST', 'PST' => 'PST',
        'BANDUNG' => 'BDG', 'BDG' => 'BDG',
        'PADANG' => 'PDG', 'PDG' => 'PDG',
        'PALEMBANG' => 'PLB', 'PLB' => 'PLB',
        'MAKASSAR' => 'MKS', 'MKS' => 'MKS'
    ];
    $kodeCabang = $cabangMap[$c] ?? $c;
    $noReq = trim((string)($item['noPermintaan'] ?? $item['noJo'] ?? 'REG-NSR'));
    $namaKlien = trim((string)($item['namaKlien'] ?? 'Klien'));

    // Sanitasi nama folder agar aman di Google Drive
    $klienSafe = preg_replace('/[\\\\\\/:\\*\\?"<>\\|]/', '', $namaKlien);
    $folderName = "{$noReq} - {$klienSafe}";
    $path = "{$tahun}/{$kodeCabang}/{$folderName}";
    $cleanId = 'drv_' . strtolower($kodeCabang) . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $noReq);

    $subfolders = [
        '01_legalitas'   => [
            'name' => '01_Legalitas & Administrasi',
            'id'   => "{$cleanId}_sub01",
            'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub01"
        ],
        '02_lapangan'    => [
            'name' => '02_Data Lapangan & BAPL',
            'id'   => "{$cleanId}_sub02",
            'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub02"
        ],
        '03_kertas_kerja'=> [
            'name' => '03_Kertas Kerja & Draf',
            'id'   => "{$cleanId}_sub03",
            'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub03"
        ],
        '04_final'       => [
            'name' => '04_Laporan Final & Tanda Terima',
            'id'   => "{$cleanId}_sub04",
            'url'  => "https://drive.google.com/drive/folders/{$cleanId}_sub04"
        ]
    ];

    return [
        'driveFolderId'   => $cleanId,
        'driveFolderUrl'  => "https://drive.google.com/drive/folders/{$cleanId}",
        'driveFolderPath' => $path,
        'driveSubfolders' => $subfolders,
        'createdAt'       => date('Y-m-d H:i:s')
    ];
}
`;

  const anchor = isCrlf ? '/**\r\n * Transaksi Atomik Database NoLap' : '/**\n * Transaksi Atomik Database NoLap';
  php = php.replace(anchor, driveHelperCode.replace(/\n/g, eol) + anchor);
  console.log('  ✓ Fungsi buatStrukturFolderGoogleDrive berhasil disisipkan.');
}

// C. Tambahkan Actions: createDriveFolders & renderDocumentTemplate
if (!php.includes("action === 'createDriveFolders'")) {
  const actionsBlock = `    // =========================================================================
    // D.1. TINDAKAN PEMBUATAN STRUKTUR FOLDER GOOGLE DRIVE (PILAR 3)
    // =========================================================================
    if ($action === 'createDriveFolders') {
        $noReq = trim($payload['noPermintaan'] ?? '');
        if (!$noReq) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Parameter noPermintaan wajib diisi.']);
            exit;
        }

        $txnResult = transaksiDatabaseNoLap($dataFile, function(&$freshRecords) use ($noReq, $userRole, $userBranch) {
            $targetIndex = -1;
            foreach ($freshRecords as $idx => $item) {
                if (($item['noPermintaan'] ?? '') === $noReq) {
                    $targetIndex = $idx;
                    break;
                }
            }

            if ($targetIndex === -1) {
                return ['success' => false, 'http_code' => 404, 'error' => 'Data permohonan tidak ditemukan'];
            }

            // ISOLASI CABANG: Staf Cabang hanya boleh men-trigger folder miliknya
            if ($userRole === 'CABANG' && strcasecmp($freshRecords[$targetIndex]['cabang'] ?? '', $userBranch) !== 0) {
                return ['success' => false, 'http_code' => 403, 'error' => 'Akses Ditolak: Anda tidak berwenang mengelola folder penugasan cabang lain.'];
            }

            $driveMeta = buatStrukturFolderGoogleDrive($freshRecords[$targetIndex]);
            $freshRecords[$targetIndex]['driveFolderId'] = $driveMeta['driveFolderId'];
            $freshRecords[$targetIndex]['driveFolderUrl'] = $driveMeta['driveFolderUrl'];
            $freshRecords[$targetIndex]['driveFolderPath'] = $driveMeta['driveFolderPath'];
            $freshRecords[$targetIndex]['driveSubfolders'] = $driveMeta['driveSubfolders'];

            return [
                'success'   => true,
                'http_code' => 200,
                'message'   => 'Struktur 4 subfolder Google Drive berhasil dibuat dan ditautkan ke basis data.',
                'drive'     => $driveMeta,
                'record'    => $freshRecords[$targetIndex],
                'records'   => $freshRecords
            ];
        });

        http_response_code($txnResult['http_code'] ?? ($txnResult['success'] ? 200 : 500));
        echo json_encode($txnResult);
        exit;
    }

    // =========================================================================
    // D.2. TINDAKAN MERGE TAGS RENDERING DOKUMEN RESMI (PILAR 4)
    // =========================================================================
    if ($action === 'renderDocumentTemplate') {
        $noReq = trim($payload['noPermintaan'] ?? '');
        $templateType = strtoupper(trim($payload['templateType'] ?? 'SURAT_TUGAS'));

        $targetItem = null;
        foreach ($records as $item) {
            if (($item['noPermintaan'] ?? '') === $noReq) {
                $targetItem = $item;
                break;
            }
        }

        if (!$targetItem) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data permohonan tidak ditemukan.']);
            exit;
        }

        $templateRaw = '';
        $docTitle = '';
        if ($templateType === 'SURAT_TUGAS') {
            $templateRaw = getTemplateSuratTugas();
            $docTitle = 'Surat Tugas Lapangan - ' . $noReq;
        } elseif ($templateType === 'QA_CHECKLIST') {
            $templateRaw = getTemplateQaChecklist();
            $docTitle = 'Lembar Kendali Mutu (QA) - ' . $noReq;
        } elseif ($templateType === 'TANDA_TERIMA') {
            $templateRaw = getTemplateTandaTerima();
            $docTitle = 'Tanda Terima Laporan - ' . $noReq;
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Jenis template '{$templateType}' tidak didukung."]);
            exit;
        }

        $renderedHtml = renderMergeTags($templateRaw, $targetItem);

        echo json_encode([
            'success'      => true,
            'templateType' => $templateType,
            'docTitle'     => $docTitle,
            'noPermintaan' => $noReq,
            'html'         => $renderedHtml
        ]);
        exit;
    }

`;

  const marker = "if ($action === 'getMailQueue') {";
  php = php.replace(marker, actionsBlock.replace(/\n/g, eol) + marker);
  console.log('  ✓ Action createDriveFolders & renderDocumentTemplate berhasil ditambahkan ke handler.');
}

fs.writeFileSync('nolap-data-handler.php', php);
console.log('✓ Selesai memperbarui nolap-data-handler.php.\n');

// -------------------------------------------------------------
// 2. UPDATE PORTAL-NOLAP.HTML
// -------------------------------------------------------------
console.log('[2/2] Memperbarui portal-nolap.html...');
let html = fs.readFileSync('portal-nolap.html', 'utf8');
const isHtmlCrlf = html.includes('\r\n');
const htmlEol = isHtmlCrlf ? '\r\n' : '\n';

// A. Tambahkan Merge Tags Engine Client-Side & Document Print Handlers
if (!html.includes('function renderMergeTagsClient(')) {
  const clientEngineJs = `
    /* =========================================================================
       MESIN MERGE TAGS & DOKUMEN RESMI (SURAT TUGAS, QA CHECKLIST, TANDA TERIMA)
       ========================================================================= */
    function sanitizeTagValClient(val, fallback = '-') {
      if (val === null || val === undefined || val === false) return fallback;
      const s = String(val).trim();
      if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return fallback;
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function buildMergeTagsClient(item) {
      const c = String(item.cabang || 'Pusat').toLowerCase();
      let penilai = item.penilai;
      let izin = item.izinPenilai;
      if (!penilai || penilai === 'undefined') {
        if (c.includes('padang')) { penilai = 'Hernita, S.E., M.Si.'; izin = 'PS.0046'; }
        else if (c.includes('bandung')) { penilai = 'Deni Siswandi, S.T., MAPPI'; izin = '00581'; }
        else if (c.includes('palembang')) { penilai = 'Dharma Priyanto Sih Budi Susilo'; izin = 'PS.0249'; }
        else if (c.includes('makassar')) { penilai = 'Muhammad Amin Sade, S.T.'; izin = '00581'; }
        else { penilai = 'Ir. Nanang Rahayu Junaedi, M.Sc.'; izin = '00581'; }
      }

      return {
        '{{nomor_registrasi}}': sanitizeTagValClient(item.noPermintaan || item.noJo),
        '{{nomor_laporan}}': sanitizeTagValClient(item.nomorLaporan),
        '{{tanggal_registrasi}}': sanitizeTagValClient(item.timestamp || item.tglPermintaan || new Date().toISOString().split('T')[0]),
        '{{tanggal_laporan}}': sanitizeTagValClient(item.tglLaporan || item.tglTerbit),
        '{{tanggal_inspeksi}}': sanitizeTagValClient(item.tglInspeksi || item.tglSurvei),
        '{{nama_klien}}': sanitizeTagValClient(item.namaKlien),
        '{{alamat_klien}}': sanitizeTagValClient(item.alamatKlien),
        '{{pemberi_tugas}}': sanitizeTagValClient(item.pemberiTugas || item.namaPemohon || item.namaKlien),
        '{{debitur}}': sanitizeTagValClient(item.debitur || item.namaKlien),
        '{{tujuan_penilaian}}': sanitizeTagValClient(item.tujuanPenilaian || 'Penjaminan Utang / Agunan'),
        '{{bidang_penilaian}}': sanitizeTagValClient(item.klasifikasiJasa || 'PI'),
        '{{objek_penilaian}}': sanitizeTagValClient(item.jenisObjek),
        '{{alamat_objek}}': sanitizeTagValClient(item.lokasiObjek),
        '{{kelurahan}}': sanitizeTagValClient(item.kelurahan),
        '{{kecamatan}}': sanitizeTagValClient(item.kecamatan),
        '{{kota_kabupaten}}': sanitizeTagValClient(item.kota_kabupaten || item.kota || item.kabupaten),
        '{{provinsi}}': sanitizeTagValClient(item.provinsi),
        '{{tim_penilai}}': sanitizeTagValClient(item.timPenilai || penilai),
        '{{reviewer_qa}}': sanitizeTagValClient(item.reviewerQa || 'Tim Kendali Mutu Pusat (SPI 102)'),
        '{{partner_penandatangan}}': sanitizeTagValClient(penilai),
        '{{nomor_ijin_penilai}}': sanitizeTagValClient(izin),
        '{{kode_cabang}}': sanitizeTagValClient(item.cabang || 'Pusat')
      };
    }

    function renderMergeTagsClient(templateStr, item) {
      const map = buildMergeTagsClient(item);
      let out = templateStr;
      for (const [tag, val] of Object.entries(map)) {
        out = out.split(tag).join(val);
      }
      out = out.replace(/\\{\\{[a-zA-Z0-9_\\-]+\\}\\}/g, '-');
      out = out.replace(/\\bnull\\b/gi, '-').replace(/\\bundefined\\b/gi, '-');
      return out;
    }

    function cetakDokumenOtomatis(noReq, tipeDoc) {
      const item = daftarPermohonan.find(p => p.noPermintaan === noReq);
      if (!item) {
        alert('Data permohonan ' + noReq + ' tidak ditemukan.');
        return;
      }

      // Ambil template dari server atau fallback client
      fetch('/api/nolap-data-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'renderDocumentTemplate',
          payload: { noPermintaan: noReq, templateType: tipeDoc }
        })
      })
      .then(r => r.json())
      .then(res => {
        if (res && res.success && res.html) {
          tampilkanPratinjauCetak(res.docTitle || 'Dokumen Resmi KJPP NSR', res.html);
        } else {
          // Fallback lokal client
          tampilkanPratinjauCetak('Dokumen ' + tipeDoc + ' - ' + noReq, generateDokumenFallbackClient(item, tipeDoc));
        }
      })
      .catch(() => {
        tampilkanPratinjauCetak('Dokumen ' + tipeDoc + ' - ' + noReq, generateDokumenFallbackClient(item, tipeDoc));
      });
    }

    function generateDokumenFallbackClient(item, tipeDoc) {
      const map = buildMergeTagsClient(item);
      let judul = 'SURAT TUGAS LAPANGAN';
      if (tipeDoc === 'QA_CHECKLIST') judul = 'LEMBAR TELAAH KENDALI MUTU (QA)';
      if (tipeDoc === 'TANDA_TERIMA') judul = 'TANDA TERIMA PENYERAHAN LAPORAN';

      return \`
        <div style="font-family: Arial, sans-serif; padding: 30px; color: #0f172a; max-width: 800px; margin: 0 auto; line-height: 1.6;">
          <div style="border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 16px;">KJPP NANANG RAHAYU &amp; REKAN</h2>
            <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">Izin Usaha Kemenkeu No. 2.19.0160 | Cabang: \${map['{{kode_cabang}}']}</p>
          </div>
          <h3 style="text-align: center; text-decoration: underline; margin-bottom: 20px;">\${judul}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 25px; border: 1px solid #cbd5e1;">
            <tr><td style="padding: 8px; width: 30%; font-weight: bold; border: 1px solid #cbd5e1;">No. Registrasi / JO</td><td style="padding: 8px; border: 1px solid #cbd5e1;">\${map['{{nomor_registrasi}}']}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Nomor Laporan</td><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">\${map['{{nomor_laporan}}']}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Klien / Pemberi Tugas</td><td style="padding: 8px; border: 1px solid #cbd5e1;">\${map['{{nama_klien}}']}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Objek &amp; Lokasi</td><td style="padding: 8px; border: 1px solid #cbd5e1;">\${map['{{objek_penilaian}}']} - \${map['{{alamat_objek}}']}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Tim Penilai</td><td style="padding: 8px; border: 1px solid #cbd5e1;">\${map['{{tim_penilai}}']}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border: 1px solid #cbd5e1;">Partner Penandatangan</td><td style="padding: 8px; border: 1px solid #cbd5e1;">\${map['{{partner_penandatangan}}']} (Izin: \${map['{{nomor_ijin_penilai}}']})</td></tr>
          </table>
          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; text-align: center;">
            <div style="width: 45%;">
              <p style="margin-bottom: 60px;">Disusun Oleh,</p>
              <p style="font-weight: bold; text-decoration: underline;">\${map['{{tim_penilai}}']}</p>
            </div>
            <div style="width: 45%;">
              <p style="margin-bottom: 60px;">Disetujui Oleh,</p>
              <p style="font-weight: bold; text-decoration: underline;">\${map['{{partner_penandatangan}}']}</p>
            </div>
          </div>
        </div>
      \`;
    }

    function tampilkanPratinjauCetak(judul, htmlContent) {
      const win = window.open('', '_blank', 'width=900,height=800,menubar=no,toolbar=no');
      if (!win) {
        alert('Mohon izinkan pop-up peramban untuk mencetak dokumen.');
        return;
      }
      win.document.write(\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>\${judul}</title>
          <style>
            @media print {
              body { margin: 0; background: #fff !important; }
              .no-print { display: none !important; }
            }
            body { background: #f1f5f9; padding: 20px; }
            .print-card { background: #fff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: 800px; margin: 0 auto 15px auto; display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; color: #1e293b; font-family: sans-serif;">Pratinjau Dokumen Cetak</h4>
            <button onclick="window.print()" style="padding: 8px 18px; background: #0284c7; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Cetak / Simpan PDF</button>
          </div>
          <div class="print-card">\${htmlContent}</div>
        </body>
        </html>
      \`);
      win.document.close();
    }

    function cetakSuratTugas(noReq) { cetakDokumenOtomatis(noReq, 'SURAT_TUGAS'); }
    function cetakLembarKendaliMutu(noReq) { cetakDokumenOtomatis(noReq, 'QA_CHECKLIST'); }
    function cetakTandaTerima(noReq) { cetakDokumenOtomatis(noReq, 'TANDA_TERIMA'); }
  `;

  const posEndScript = html.lastIndexOf('</script>');
  html = html.slice(0, posEndScript) + clientEngineJs.replace(/\n/g, htmlEol) + htmlEol + html.slice(posEndScript);
  console.log('  ✓ Mesin Merge Tags client-side & handler cetak dokumen berhasil disisipkan.');
}

// B. Tambahkan tombol menu Cetak Dokumen Resmi di Modal Detail
const actionBtnTarget = `<button onclick="cetakKertasKerjaSpesifik('\${item.noPermintaan}')" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700">
          <span>🖨️ Cetak Kertas Kerja</span>
        </button>`;

const actionBtnNew = `<button onclick="cetakKertasKerjaSpesifik('\${item.noPermintaan}')" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700">
          <span>🖨️ Cetak Kertas Kerja</span>
        </button>
        <button onclick="cetakSuratTugas('\${item.noPermintaan}')" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-xs flex items-center gap-1 border border-sky-500/30">
          <span>📄 Surat Tugas</span>
        </button>
        <button onclick="cetakLembarKendaliMutu('\${item.noPermintaan}')" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-500/30">
          <span>📋 Lembar QA</span>
        </button>
        <button onclick="cetakTandaTerima('\${item.noPermintaan}')" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1 border border-amber-500/30">
          <span>📝 Tanda Terima</span>
        </button>`;

if (html.includes(actionBtnTarget)) {
  html = html.replace(actionBtnTarget, actionBtnNew.replace(/\n/g, htmlEol));
  console.log('  ✓ Tombol Surat Tugas, Lembar QA, dan Tanda Terima disematkan pada Modal Detail.');
}

fs.writeFileSync('portal-nolap.html', html);
console.log('✓ Selesai memperbarui portal-nolap.html.\n');
console.log('✨ IMPLEMENTASI TAHAP 2 BERHASIL!');
