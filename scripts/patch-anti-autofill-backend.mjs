import fs from 'fs';

let c = fs.readFileSync('nolap-data-handler.php', 'utf8');

// 1. In submitGerbang1Awal
const target1 = "$reqNama = trim($reqInput['nama'] ?? ($payload['namaPemohon'] ?? ($payload['pengaju_nama'] ?? '')));";
const repl1 = "$reqNama = trim($reqInput['nama'] ?? ($payload['namaPemohon'] ?? ($payload['pengaju_nama'] ?? ($payload['nama_pengaju'] ?? ''))));";

const targetNik = "$reqNik = trim($reqInput['nik'] ?? ($reqInput['personnel_id'] ?? ($payload['nikPemohon'] ?? ($payload['pengaju_nik'] ?? ''))));";
const replNik = "$reqNik = trim($reqInput['nik'] ?? ($reqInput['personnel_id'] ?? ($payload['nikPemohon'] ?? ($payload['pengaju_nik'] ?? ($payload['nik_pengaju'] ?? '')))));";

const targetJab = "$reqJabatan = trim($reqInput['jabatan'] ?? ($payload['jabatanPemohon'] ?? ($payload['pengaju_jabatan'] ?? '')));";
const replJab = "$reqJabatan = trim($reqInput['jabatan'] ?? ($payload['jabatanPemohon'] ?? ($payload['pengaju_jabatan'] ?? ($payload['jabatan_pengaju'] ?? ''))));";

const targetEmail = "$reqEmail = trim($reqInput['email'] ?? ($payload['emailPemohon'] ?? ($payload['pengaju_email'] ?? '')));";
const replEmail = "$reqEmail = trim($reqInput['email'] ?? ($payload['emailPemohon'] ?? ($payload['pengaju_email'] ?? ($payload['email_pengaju'] ?? ''))));";

const targetWa = "$reqWa = trim($reqInput['whatsapp_number'] ?? ($reqInput['wa'] ?? ($payload['waPemohon'] ?? ($payload['pengaju_wa'] ?? ''))));";
const replWa = "$reqWa = trim($reqInput['whatsapp_number'] ?? ($reqInput['wa'] ?? ($payload['waPemohon'] ?? ($payload['pengaju_wa'] ?? ($payload['wa_pengaju'] ?? '')))));";

c = c.replace(target1, repl1)
     .replace(targetNik, replNik)
     .replace(targetJab, replJab)
     .replace(targetEmail, replEmail)
     .replace(targetWa, replWa);

// Add flat pengaju keys to newRecord in submitGerbang1Awal
const targetRec = "'pengaju' => $pengajuSnapshot";
const replRec = `'pengaju_nama' => $reqNama,
            'pengaju_nik' => $reqNik,
            'pengaju_jabatan' => $reqJabatan,
            'pengaju_email' => $reqEmail,
            'pengaju_wa' => normalisasiNomorWhatsApp($reqWa),
            'contact_status' => 'MANUAL_APPLICANT_INPUT',
            'login_user_id' => $currentUser['sub'] ?? ($currentUser['role'] ?? 'unknown_user'),
            'email_verified' => false,
            'whatsapp_verified' => false,
            'pengaju' => $pengajuSnapshot`;

if (c.includes(targetRec)) {
  c = c.replace(targetRec, replRec.replace(/\n/g, '\r\n'));
}

// 2. In submitRequest
const targetSubmitReq = `    if ($action === 'submitRequest') {
        if (!isset($payload['namaKlien']) || empty(trim($payload['namaKlien']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data pengajuan tidak lengkap']);
            exit;
        }

        // P0 HOTFIX: Validasi Mandatory Kontak Pemohon Manual (Anti-Autofill)
        $namaPemohon = trim($payload['namaPemohon'] ?? '');
        $emailPemohon = trim($payload['emailPemohon'] ?? '');
        $waPemohon = trim($payload['waPemohon'] ?? '');
        $nikPemohon = trim($payload['nikPemohon'] ?? '');
        $jabatanPemohon = trim($payload['jabatanPemohon'] ?? '');`;

const replSubmitReq = `    if ($action === 'submitRequest') {
        $namaKlien = trim($payload['namaKlien'] ?? ($payload['nama_klien'] ?? ''));
        if (empty($namaKlien)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Data pengajuan tidak lengkap: Nama Klien wajib diisi']);
            exit;
        }
        $payload['namaKlien'] = $namaKlien;

        // P0 HOTFIX: Validasi Mandatory Kontak Pemohon Manual (Anti-Autofill)
        $namaPemohon = trim($payload['namaPemohon'] ?? ($payload['pengaju_nama'] ?? ($payload['nama_pengaju'] ?? '')));
        $emailPemohon = trim($payload['emailPemohon'] ?? ($payload['pengaju_email'] ?? ($payload['email_pengaju'] ?? '')));
        $waPemohon = trim($payload['waPemohon'] ?? ($payload['pengaju_wa'] ?? ($payload['wa_pengaju'] ?? '')));
        $nikPemohon = trim($payload['nikPemohon'] ?? ($payload['pengaju_nik'] ?? ($payload['nik_pengaju'] ?? '')));
        $jabatanPemohon = trim($payload['jabatanPemohon'] ?? ($payload['pengaju_jabatan'] ?? ($payload['jabatan_pengaju'] ?? '')));`;

c = c.replace(targetSubmitReq.replace(/\n/g, '\r\n'), replSubmitReq.replace(/\n/g, '\r\n'));

fs.writeFileSync('nolap-data-handler.php', c, 'utf8');
console.log('Update nolap-data-handler.php complete!');
