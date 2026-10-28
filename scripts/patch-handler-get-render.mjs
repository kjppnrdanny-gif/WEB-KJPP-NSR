import fs from 'fs';

let content = fs.readFileSync('nolap-data-handler.php', 'utf8');

function toCrlf(str) {
  return str.replace(/\r?\n/g, '\r\n');
}

const needle = toCrlf(`        if ($found) {
            echo json_encode(['success' => true, 'record' => $found]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data dual gate tidak ditemukan.']);
        }
        exit;
    }`);

const replacement = toCrlf(`        if ($found) {
            echo json_encode(['success' => true, 'record' => $found]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Data dual gate tidak ditemukan.']);
        }
        exit;
    }

    if ($actionGet === 'renderDocumentTemplate') {
        $noReq = trim($_GET['noPermintaan'] ?? ($_GET['noReq'] ?? ''));
        $templateType = strtoupper(trim($_GET['templateType'] ?? ($_GET['templateName'] ?? 'SURAT_TUGAS')));

        $targetItem = null;
        foreach ($records as $item) {
            if (($item['noPermintaan'] ?? '') === $noReq || ($item['idPenugasan'] ?? '') === $noReq) {
                $targetItem = $item;
                break;
            }
        }
        if (!$targetItem) {
            $dgList = muatDatabaseDualGate($dualGateDbFile);
            foreach ($dgList as $item) {
                if (($item['noPermintaan'] ?? '') === $noReq || ($item['idPenugasan'] ?? '') === $noReq) {
                    $targetItem = $item;
                    break;
                }
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

        // Jika request format HTML langsung (buka di tab baru browser)
        if (isset($_GET['raw']) || isset($_GET['print']) || (isset($_SERVER['HTTP_ACCEPT']) && stripos($_SERVER['HTTP_ACCEPT'], 'text/html') !== false && stripos($_SERVER['HTTP_ACCEPT'], 'application/json') === false)) {
            header('Content-Type: text/html; charset=utf-8');
            echo $renderedHtml;
            exit;
        }

        echo json_encode([
            'success'      => true,
            'templateType' => $templateType,
            'docTitle'     => $docTitle,
            'noPermintaan' => $noReq,
            'html'         => $renderedHtml
        ]);
        exit;
    }`);

if (content.includes(needle)) {
  content = content.replace(needle, replacement);
  fs.writeFileSync('nolap-data-handler.php', content, 'utf8');
  console.log('✔ GET renderDocumentTemplate handler added to nolap-data-handler.php');
} else {
  console.error('✘ needle not found in nolap-data-handler.php');
}
