import fs from 'fs';

const path = 'absensi-data-handler.php';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 1. Patch fetchMasterFromGAS
const oldFetch = `        foreach ($headers as $idx => $h) {
            if ($h === 'NIK') $colNik = $idx;
            else if ($h === 'NAMA' || $h === 'NAMA KARYAWAN') $colNama = $idx;
            else if ($h === 'JABATAN') $colJabatan = $idx;
            else if ($h === 'DIVISI') $colDivisi = $idx;
            else if ($h === 'STATUS') $colStatus = $idx;
            else if ($h === 'ALAMAT WFH') $colAlamatWfh = $idx;
            else if ($h === 'GPS WFH') $colGpsWfh = $idx;
            else if (strpos($h, 'REGISTRASI WFH') !== false) $colTglWfh = $idx;
            else if (strpos($h, 'EMAIL') !== false || $h === 'GMAIL') $colEmail = $idx;
        }

        if ($colNik === -1) $colNik = 0;
        if ($colNama === -1) $colNama = 1;
        if ($colJabatan === -1) $colJabatan = 2;
        if ($colDivisi === -1) $colDivisi = 3;
        if ($colStatus === -1) $colStatus = 4;
        if ($colAlamatWfh === -1) $colAlamatWfh = 5;
        if ($colGpsWfh === -1) $colGpsWfh = 6;
        if ($colTglWfh === -1) $colTglWfh = 7;
        if ($colEmail === -1) $colEmail = 8;

        $roster = [];
        foreach ($res['rows'] as $r) {
            $nik = trim((string)($r[$colNik] ?? ''));
            if (empty($nik)) continue;
            $roster[] = [
                'nik' => $nik,
                'nama' => trim((string)($r[$colNama] ?? '')),
                'jabatan' => trim((string)($r[$colJabatan] ?? '')),
                'divisi' => trim((string)($r[$colDivisi] ?? '')),
                'cabang' => 'Pusat Jakarta',
                'status' => strtoupper(trim((string)($r[$colStatus] ?? 'AKTIF'))),
                'alamat_wfh' => trim((string)($r[$colAlamatWfh] ?? '')),
                'gps_wfh' => trim((string)($r[$colGpsWfh] ?? '')),
                'tgl_reg_wfh' => trim((string)($r[$colTglWfh] ?? '')),
                'email' => trim((string)($r[$colEmail] ?? ''))
            ];
        }`;

const newFetch = `        $colKantor = -1; $colPin = -1;
        foreach ($headers as $idx => $h) {
            if ($h === 'NIK') $colNik = $idx;
            else if ($h === 'NAMA' || $h === 'NAMA KARYAWAN') $colNama = $idx;
            else if ($h === 'JABATAN') $colJabatan = $idx;
            else if ($h === 'DIVISI') $colDivisi = $idx;
            else if ($h === 'STATUS') $colStatus = $idx;
            else if ($h === 'ALAMAT WFH') $colAlamatWfh = $idx;
            else if ($h === 'GPS WFH') $colGpsWfh = $idx;
            else if (strpos($h, 'REGISTRASI WFH') !== false) $colTglWfh = $idx;
            else if (strpos($h, 'EMAIL') !== false || $h === 'GMAIL') $colEmail = $idx;
            else if ($h === 'KANTOR' || $h === 'CABANG') $colKantor = $idx;
            else if (strpos($h, 'PIN') !== false) $colPin = $idx;
        }

        if ($colNik === -1) $colNik = 0;
        if ($colNama === -1) $colNama = 1;
        if ($colJabatan === -1) $colJabatan = 2;
        if ($colDivisi === -1) $colDivisi = 3;
        if ($colStatus === -1) $colStatus = 4;
        if ($colAlamatWfh === -1) $colAlamatWfh = 5;
        if ($colGpsWfh === -1) $colGpsWfh = 6;
        if ($colTglWfh === -1) $colTglWfh = 7;
        if ($colEmail === -1) $colEmail = 8;

        $roster = [];
        foreach ($res['rows'] as $r) {
            $nik = trim((string)($r[$colNik] ?? ''));
            if (empty($nik)) continue;
            $rawKantor = ($colKantor !== -1) ? trim((string)($r[$colKantor] ?? '')) : '';
            $cabang = getCabangFromNIK($nik, $rawKantor);
            $pinVal = ($colPin !== -1) ? trim((string)($r[$colPin] ?? '')) : '';
            if (empty($pinVal)) {
                $pinVal = ($nik === 'NSR-2019-005') ? '889900' : '123456';
            }
            $roster[] = [
                'nik' => $nik,
                'nama' => trim((string)($r[$colNama] ?? '')),
                'jabatan' => trim((string)($r[$colJabatan] ?? '')),
                'divisi' => trim((string)($r[$colDivisi] ?? '')),
                'kantor' => $cabang,
                'cabang' => $cabang,
                'status' => strtoupper(trim((string)($r[$colStatus] ?? 'AKTIF'))),
                'alamat_wfh' => trim((string)($r[$colAlamatWfh] ?? '')),
                'gps_wfh' => trim((string)($r[$colGpsWfh] ?? '')),
                'tgl_reg_wfh' => trim((string)($r[$colTglWfh] ?? '')),
                'email' => trim((string)($r[$colEmail] ?? '')),
                'pin_presensi' => $pinVal
            ];
        }`;

if (!content.includes(oldFetch)) {
  console.error('oldFetch target not found!');
  process.exit(1);
}
content = content.replace(oldFetch, newFetch);
console.log('✓ Replaced fetchMasterFromGAS');

// 2. Patch loadDatabase auto-reconciliation
const oldRecon = `                    if (($ek['nama'] ?? '') !== $mk['nama'] || ($ek['cabang'] ?? '') !== 'Pusat Jakarta') {
                        $ek['nama'] = $mk['nama'];
                        $ek['jabatan'] = $mk['jabatan'];
                        $ek['divisi'] = $mk['divisi'];
                        $ek['cabang'] = 'Pusat Jakarta';
                        if (!empty($mk['email']) && empty($ek['email'])) {
                            $ek['email'] = $mk['email'];
                        }
                        $ek['status'] = 'AKTIF';
                        $needsSave = true;
                    }`;

const newRecon = `                    $mkCabang = $mk['cabang'] ?? $mk['kantor'] ?? 'Pusat Jakarta';
                    if (($ek['nama'] ?? '') !== $mk['nama'] || ($ek['cabang'] ?? '') !== $mkCabang) {
                        $ek['nama'] = $mk['nama'];
                        $ek['jabatan'] = $mk['jabatan'];
                        $ek['divisi'] = $mk['divisi'];
                        $ek['cabang'] = $mkCabang;
                        $ek['kantor'] = $mkCabang;
                        if (!empty($mk['email']) && empty($ek['email'])) {
                            $ek['email'] = $mk['email'];
                        }
                        if (!empty($mk['pin_presensi'])) {
                            $ek['pin_presensi'] = $mk['pin_presensi'];
                        }
                        $ek['status'] = 'AKTIF';
                        $needsSave = true;
                    }`;

if (!content.includes(oldRecon)) {
  console.error('oldRecon target not found!');
  process.exit(1);
}
content = content.replace(oldRecon, newRecon);
console.log('✓ Replaced loadDatabase auto-reconciliation');

// 3. Patch simpanAbsensi multi-office geofencing
const oldGeo = `        // Zona Waktu Kantor Pusat: Asia/Jakarta (WIB)
        $tzObj = new DateTimeZone('Asia/Jakarta');
        $dtNow = new DateTime('now', $tzObj);
        $tglStr = $dtNow->format('Y-m-d');
        $jamStr = $dtNow->format('H:i:s') . ' WIB';
        $timestampStr = $dtNow->format('Y-m-d H:i:s');

        // Validasi Geofence Kantor Pusat Jakarta
        $kantorTerdekat = 'Kantor Pusat Jakarta';
        $jarakMeter = 0;
        $statusValidasi = 'VALID';

        if ($lokasi === 'KANTOR') {
            $jarakMeter = hitungJarakHaversine($userLat, $userLng, PUSAT_LAT, PUSAT_LNG);
            if ($jarakMeter > RADIUS_KANTOR_METER) {
                $statusValidasi = 'TIDAK VALID';
            }
        } elseif ($lokasi === 'WFH') {
            $wfhGps = $profil['gps_wfh'] ?? '';
            foreach ($db['master_wfh'] as $w) {
                if (cocokNIK($w['nik'], $cleanNik)) {
                    $wfhGps = $w['gps'];
                }
            }

            if (!$wfhGps) {
                $kantorTerdekat = 'Rumah WFH (Belum Terdaftar)';
                $jarakMeter = 999999;
                $statusValidasi = 'TIDAK VALID';
            } else {
                $wParts = explode(',', $wfhGps);
                $wLat = (float)trim($wParts[0]);
                $wLng = (float)trim($wParts[1]);
                $jarakMeter = hitungJarakHaversine($userLat, $userLng, $wLat, $wLng);
                $kantorTerdekat = 'Rumah WFH';
                if ($jarakMeter > RADIUS_WFH_METER) {
                    $statusValidasi = 'TIDAK VALID';
                }
            }
        } elseif ($lokasi === 'DINAS LUAR') {
            $kantorTerdekat = 'Lokasi Penugasan Lapangan';
            $jarakMeter = 0;
            $statusValidasi = 'VALID';
        }`;

const newGeo = `        // Multi-Office Geofencing KJPP NSR (5 Kantor Operasional Resmi)
        $kantorTerdekat = 'Pusat Jakarta';
        $jarakMeter = 0;
        $statusValidasi = 'VALID';
        $zonaLabel = 'WIB';

        if ($lokasi === 'KANTOR') {
            global $KANTOR_CABANG;
            $minJarak = INF;
            $bestKantor = 'Pusat Jakarta';
            $toleransi = RADIUS_KANTOR_METER;

            foreach ($KANTOR_CABANG as $kb) {
                $d = hitungJarakHaversine($userLat, $userLng, $kb['lat'], $kb['lng']);
                if ($d < $minJarak) {
                    $minJarak = $d;
                    $bestKantor = $kb['nama'];
                    $toleransi = $kb['radius'] ?? RADIUS_KANTOR_METER;
                }
            }

            $kantorTerdekat = $bestKantor;
            $jarakMeter = round($minJarak);

            if ($minJarak > $toleransi) {
                $statusValidasi = 'TIDAK VALID';
            }
        } elseif ($lokasi === 'WFH') {
            $wfhGps = $profil['gps_wfh'] ?? '';
            foreach ($db['master_wfh'] as $w) {
                if (cocokNIK($w['nik'], $cleanNik)) {
                    $wfhGps = $w['gps'];
                }
            }

            if (!$wfhGps) {
                $kantorTerdekat = 'Rumah WFH (Belum Terdaftar)';
                $jarakMeter = 999999;
                $statusValidasi = 'TIDAK VALID';
            } else {
                $wParts = explode(',', $wfhGps);
                $wLat = (float)trim($wParts[0]);
                $wLng = (float)trim($wParts[1]);
                $jarakMeter = round(hitungJarakHaversine($userLat, $userLng, $wLat, $wLng));
                $kantorTerdekat = 'Rumah WFH';
                if ($jarakMeter > RADIUS_WFH_METER) {
                    $statusValidasi = 'TIDAK VALID';
                }
            }
        } elseif ($lokasi === 'DINAS LUAR') {
            $kantorTerdekat = 'Lokasi Penugasan Lapangan';
            $jarakMeter = 0;
            $statusValidasi = 'VALID';
        }

        // Penyesuaian Zona Waktu (WITA untuk Makassar, WIB untuk lainnya)
        if ($kantorTerdekat === 'Cabang Makassar' || strpos($cleanNik, 'MKS') !== false) {
            $tzObj = new DateTimeZone('Asia/Makassar');
            $zonaLabel = 'WITA';
        } else {
            $tzObj = new DateTimeZone('Asia/Jakarta');
            $zonaLabel = 'WIB';
        }
        $dtNow = new DateTime('now', $tzObj);
        $tglStr = $dtNow->format('Y-m-d');
        $jamStr = $dtNow->format('H:i:s') . ' ' . $zonaLabel;
        $timestampStr = $dtNow->format('Y-m-d H:i:s');`;

if (!content.includes(oldGeo)) {
  console.error('oldGeo target not found!');
  process.exit(1);
}
content = content.replace(oldGeo, newGeo);
console.log('✓ Replaced simpanAbsensi multi-office geofencing');

fs.writeFileSync(path, content.replace(/\n/g, '\r\n'), 'utf8');
console.log('✓ absensi-data-handler.php successfully patched!');
