import fs from 'node:fs';

let content = fs.readFileSync('backend/job-tracking-handler.php', 'utf8');

// Normalize to LF for matching, then do the replacements
let isCRLF = content.includes('\r\n');
let normalized = content.replace(/\r\n/g, '\n');

// 1. Strip internal opinions from public track response
const oldTrackResp = `    echo json_encode([
        'status' => 'success',
        'message' => 'Status penugasan ditemukan.',
        'data' => $found
    ]);
    exit;`;

const newTrackResp = `    $publicData = $found;
    // Proteksi Kerahasiaan Publik (KEPI & Standar Penilaian):
    // Nilai Opini Rupiah (Pasar & Likuidasi) HANYA tampil di Task Board internal staf dan DISEKA dari publik.
    unset($publicData['opini_nilai_pasar']);
    unset($publicData['opini_nilai_likuidasi']);

    echo json_encode([
        'status' => 'success',
        'message' => 'Status penugasan ditemukan.',
        'data' => $publicData
    ]);
    exit;`;

if (normalized.includes(oldTrackResp)) {
  normalized = normalized.replace(oldTrackResp, newTrackResp);
  console.log('✓ Public opinion values stripping added');
}

// 2. Strip from GAS response if GAS succeeds
const oldGasTrack = `        if ($gasTrack && isset($gasTrack['status']) && $gasTrack['status'] === 'success' && !empty($gasTrack['data'])) {
            echo json_encode([
                'status' => 'success',
                'source' => 'GAS_SSOT_LIVE',
                'data' => $gasTrack['data']
            ]);
            exit;
        }`;

const newGasTrack = `        if ($gasTrack && isset($gasTrack['status']) && $gasTrack['status'] === 'success' && !empty($gasTrack['data'])) {
            $gasData = $gasTrack['data'];
            unset($gasData['opini_nilai_pasar']);
            unset($gasData['opini_nilai_likuidasi']);
            echo json_encode([
                'status' => 'success',
                'source' => 'GAS_SSOT_LIVE',
                'data' => $gasData
            ]);
            exit;
        }`;

if (normalized.includes(oldGasTrack)) {
  normalized = normalized.replace(oldGasTrack, newGasTrack);
  console.log('✓ GAS public opinion values stripping added');
}

// 3. Update advance_milestone to capture SPI/NoLap fields
const oldAdvanceSave = `    $job['current_milestone'] = $targetM;
    $job['current_milestone_title'] = $job['milestones'][$targetM]['title'];
    $job['progress_percent'] = calculateProgress($targetM);
    $job['updated_at'] = date('Y-m-d H:i:s', $now);`;

const newAdvanceSave = `    // Tangkap input substansi SPI & NoLap
    if (!empty($payload['tanggal_penilaian'])) {
        $job['tanggal_penilaian'] = trim((string)$payload['tanggal_penilaian']);
    }
    if (!empty($payload['dokumen_kepemilikan'])) {
        $job['dokumen_kepemilikan'] = trim((string)$payload['dokumen_kepemilikan']);
    }
    if (!empty($payload['nomor_laporan_resmi'])) {
        $job['nomor_laporan_resmi'] = trim((string)$payload['nomor_laporan_resmi']);
    }
    if (isset($payload['opini_nilai_pasar']) && $payload['opini_nilai_pasar'] !== '') {
        $job['opini_nilai_pasar'] = (float)str_replace(['.', ',', ' ', 'Rp', 'rp'], '', (string)$payload['opini_nilai_pasar']);
    }
    if (isset($payload['opini_nilai_likuidasi']) && $payload['opini_nilai_likuidasi'] !== '') {
        $job['opini_nilai_likuidasi'] = (float)str_replace(['.', ',', ' ', 'Rp', 'rp'], '', (string)$payload['opini_nilai_likuidasi']);
    }

    $job['current_milestone'] = $targetM;
    $job['current_milestone_title'] = $job['milestones'][$targetM]['title'];
    $job['progress_percent'] = calculateProgress($targetM);
    $job['updated_at'] = date('Y-m-d H:i:s', $now);`;

if (normalized.includes(oldAdvanceSave)) {
  normalized = normalized.replace(oldAdvanceSave, newAdvanceSave);
  console.log('✓ advance_milestone updated with SPI/NoLap fields');
}

// 4. Update create_job_order
const oldJobDef = `    $newJob = [
        'id' => $joNumber,
        'jo_number' => $joNumber,
        'kode_lacak' => $kodeLacak,
        'spk_number' => $spkNumber,
        'spk_date' => $spkDate,
        'lingkup_penugasan' => $lingkupPenugasan,
        'tanggal_lingkup' => $tanggalLingkup,
        'instansi' => $payload['instansi'] ?? 'PT Bank Tabungan Negara (Persero) Tbk',
        'instansi_singkat' => $payload['instansi_singkat'] ?? 'Bank Rekanan',
        'unit_kerja' => $payload['unit_kerja'] ?? '-',
        'debitur' => $payload['debitur'] ?? 'Debitur Baru',
        'pic_pemohon' => $payload['pic_pemohon'] ?? 'PIC Bank',
        'pic_contact' => $payload['pic_contact'] ?? '081234567890',`;

const newJobDef = `    $pemberiTugas = trim((string)($payload['pemberi_tugas'] ?? $payload['instansi'] ?? 'PT Bank Tabungan Negara (Persero) Tbk'));
    $penggunaLaporan = trim((string)($payload['pengguna_laporan'] ?? $pemberiTugas));
    $debitur = trim((string)($payload['debitur'] ?? 'Debitur Baru'));
    $clientPicName = trim((string)($payload['client_pic_name'] ?? $payload['pic_pemohon'] ?? 'PIC Pemberi Tugas'));
    $clientPicPhone = trim((string)($payload['client_pic_phone'] ?? $payload['pic_contact'] ?? '081288997766'));
    $surveyContactName = trim((string)($payload['survey_contact_name'] ?? ($debitur . ' (Pendamping Lapangan)')));
    $surveyContactPhone = trim((string)($payload['survey_contact_phone'] ?? ''));
    $tujuanPenilaian = trim((string)($payload['tujuan_penilaian'] ?? 'Penjaminan Utang / Agunan Kredit'));
    $klasifikasiIzinObjek = trim((string)($payload['klasifikasi_izin_objek'] ?? 'PS'));
    $dokumenKepemilikan = trim((string)($payload['dokumen_kepemilikan'] ?? 'SHM / Bukti Hak'));

    $newJob = [
        'id' => $joNumber,
        'jo_number' => $joNumber,
        'kode_lacak' => $kodeLacak,
        'spk_number' => $spkNumber,
        'spk_date' => $spkDate,
        'lingkup_penugasan' => $lingkupPenugasan,
        'tanggal_lingkup' => $tanggalLingkup,
        'pemberi_tugas' => $pemberiTugas,
        'pengguna_laporan' => $penggunaLaporan,
        'instansi' => $pemberiTugas,
        'instansi_singkat' => $payload['instansi_singkat'] ?? 'Bank Rekanan',
        'unit_kerja' => $payload['unit_kerja'] ?? '-',
        'debitur' => $debitur,
        'client_pic_name' => $clientPicName,
        'client_pic_phone' => $clientPicPhone,
        'survey_contact_name' => $surveyContactName,
        'survey_contact_phone' => $surveyContactPhone,
        'pic_pemohon' => $clientPicName,
        'pic_contact' => $clientPicPhone,
        'tujuan_penilaian' => $tujuanPenilaian,
        'klasifikasi_izin_objek' => $klasifikasiIzinObjek,
        'dokumen_kepemilikan' => $dokumenKepemilikan,
        'tanggal_penilaian' => $spkDate,
        'nomor_laporan_resmi' => '',
        'opini_nilai_pasar' => 0,
        'opini_nilai_likuidasi' => 0,`;

if (normalized.includes(oldJobDef)) {
  normalized = normalized.replace(oldJobDef, newJobDef);
  console.log('✓ create_job_order updated with SPI 103 & NoLap structure');
}

// 5. Update get_jo_suggestions to supply new fields
const oldSuggItem = `        $suggestions[] = [
            'id_jo' => $j['jo_number'] ?? $id,
            'nomor_spk' => $j['spk_number'] ?? '-',
            'tanggal_spk' => $j['spk_date'] ?? date('Y-m-d'),
            'instansi' => $j['instansi'] ?? '',
            'unit_kerja' => $j['unit_kerja'] ?? '',
            'debitur' => $j['debitur'] ?? '',
            'pic_contact' => $j['pic_contact'] ?? '',`;

const newSuggItem = `        $suggestions[] = [
            'id_jo' => $j['jo_number'] ?? $id,
            'nomor_spk' => $j['spk_number'] ?? '-',
            'tanggal_spk' => $j['spk_date'] ?? date('Y-m-d'),
            'pemberi_tugas' => $j['pemberi_tugas'] ?? ($j['instansi'] ?? ''),
            'pengguna_laporan' => $j['pengguna_laporan'] ?? ($j['pemberi_tugas'] ?? ($j['instansi'] ?? '')),
            'instansi' => $j['pemberi_tugas'] ?? ($j['instansi'] ?? ''),
            'unit_kerja' => $j['unit_kerja'] ?? '',
            'debitur' => $j['debitur'] ?? '',
            'client_pic_name' => $j['client_pic_name'] ?? ($j['pic_pemohon'] ?? ''),
            'client_pic_phone' => $j['client_pic_phone'] ?? ($j['pic_contact'] ?? ''),
            'survey_contact_name' => $j['survey_contact_name'] ?? '',
            'survey_contact_phone' => $j['survey_contact_phone'] ?? '',
            'pic_contact' => $j['client_pic_phone'] ?? ($j['pic_contact'] ?? ''),
            'tujuan_penilaian' => $j['tujuan_penilaian'] ?? 'Penjaminan Utang / Agunan Kredit',
            'klasifikasi_izin_objek' => $j['klasifikasi_izin_objek'] ?? 'PS',
            'dokumen_kepemilikan' => $j['dokumen_kepemilikan'] ?? '',`;

if (normalized.includes(oldSuggItem)) {
  normalized = normalized.replace(oldSuggItem, newSuggItem);
  console.log('✓ get_jo_suggestions updated with new fields');
}

const finalContent = isCRLF ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync('backend/job-tracking-handler.php', finalContent, 'utf8');
console.log('✓ backend/job-tracking-handler.php successfully saved');
