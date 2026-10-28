import fs from 'fs';

let c = fs.readFileSync('nolap-data-handler.php', 'utf8');

const target = `        echo json_encode([
            'success' => true,
            'message' => 'Pengajuan Lingkup Penugasan & Mitigasi Awal berhasil didaftarkan.',
            'idPenugasan' => $idPenugasan,
            'status' => $statusAwal,
            'emailNotification' => $mailJob ? 'ANTRIAN' : 'GAGAL',
            'waManualLink' => $waLink
        ]);`;

const repl = `        echo json_encode([
            'success' => true,
            'message' => 'Pengajuan Lingkup Penugasan & Mitigasi Awal berhasil didaftarkan.',
            'idPenugasan' => $idPenugasan,
            'status' => $statusAwal,
            'data' => $newRecord,
            'emailNotification' => $mailJob ? 'ANTRIAN' : 'GAGAL',
            'waManualLink' => $waLink
        ]);`;

c = c.replace(target.replace(/\n/g, '\r\n'), repl.replace(/\n/g, '\r\n'));

fs.writeFileSync('nolap-data-handler.php', c, 'utf8');
console.log('Update nolap-data-handler.php data response complete!');
