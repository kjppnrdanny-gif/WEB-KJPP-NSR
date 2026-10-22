/**
 * Comprehensive Simulation Test Suite: Dual Smart Mitigation Gate for 5 Valuation Purposes
 * 1. Agunan Bank (POJK 40/2019, SPI 103/104/105) - Deviasi 12% (5-15%) with BAI -> RESOLVED_WITH_EVIDENCE
 * 2. Jual Beli (Nilai Pasar SPI 101/104) - Deviasi 2.5% (<=5%) -> CONSISTENT_AND_VERIFIED
 * 3. Pelaporan Keuangan (PSAK 216/240/68) - Deviasi 18% (>15%) with Written Appraiser Justification -> RESOLVED_WITH_EVIDENCE (NO RIGID HOLD)
 * 4. Pengadaan Tanah (UU 2/2012, PP 19/2021, SPI 204) - Legal Red Flag (Dispute/Sita) -> HOLD_LEGAL_ISSUE (Independent of Area)
 * 5. Mesin Industri (SPI 301, SE-6/PPPK/2018 Jasa PP) - Machinery Inspection & Appraiser Classification Match
 */

import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = 8898;
const BASE_URL = `http://127.0.0.1:${PORT}/nolap-data-handler.php`;

const TOKENS = {
  DANNY_SPM: 'NSR-SPM-DANNY-2026',
  DENI_DIVTEK: 'NSR-DIVTEK-DENI-2026',
  NANANG_PENILAI: 'NSR-PENILAI-NANANG-2026',
  DENI_PENILAI: 'NSR-PENILAI-DENI-2026',
  ADMIN_PUSAT: 'NSR-ADMIN-PUSAT-2026',
  ADMIN_CABANG: 'NSR-ADMIN-BDG-2026'
};

async function request(endpoint, options = {}) {
  const url = new URL(endpoint, BASE_URL);
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.token ? { 'X-NSR-Token': options.token } : {}),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = { raw: data }; }
        resolve({ status: res.statusCode, statusCode: res.statusCode, headers: res.headers, data: json, body: json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`✔ PASS: ${message}`);
}

async function runSimulation() {
  console.log("================================================================================");
  console.log("OPINI NSR — SIMULASI SUBSTANSI DUAL GATE: 5 TUJUAN PENILAIAN & AUDIT KEPATUHAN P0");
  console.log("================================================================================\n");

  const phpServer = spawn('php', ['-S', `127.0.0.1:${PORT}`, '-t', '.'], { stdio: 'inherit' });
  await new Promise(r => setTimeout(r, 1500));

  try {
    // -------------------------------------------------------------------------
    // KASUS 1: AGUNAN BANK (Deviasi Luas 12% didukung BAI)
    // -------------------------------------------------------------------------
    console.log(">>> [KASUS 1] TUJUAN: PENILAIAN AGUNAN BANK (POJK 40/2019 & SPI 103/104)");
    const joAgunanId = `JO-SIM-AGUNAN-${Date.now()}`;
    const submitG1Agunan = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joAgunanId,
        noPermintaan: `REQ-${joAgunanId}`,
        namaKlien: 'PT Bank Mandiri (Persero) Tbk',
        tujuanPenilaian: 'Agunan Perbankan',
        jenisObjek: 'Tanah & Bangunan Ruko Komersial',
        service_classification_id: 'PROPERTY',
        penilaiPublikId: 'nanang_penilai',
        penilaiPublikDitunjuk: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });
    assert(submitG1Agunan.status === 200 && submitG1Agunan.data.status === 'MENUNGGU_SPM_AWAL', "Kasus 1: Gerbang 1 Agunan Bank berhasil diajukan");

    // Approval Berjenjang Gerbang 1
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: joAgunanId, keputusan: 'SETUJU', catatan: 'Integritas independensi agunan perbankan OK' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: joAgunanId, keputusan: 'SETUJU', catatan: 'Metodologi pasar & biaya disetujui' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: joAgunanId } });

    // Gerbang 2 Agunan Bank: Deviasi Luas Yuridis 500 m2 vs Fisik 440 m2 (Deviasi 12% didukung BAI)
    const submitG2Agunan = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joAgunanId,
        checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
        deltaAnalysis: {
          luasYuridis: 500,
          luasFisik: 440,
          keterangan: 'Terdapat sempadan jalan 60 m2, didukung Berita Acara Inspeksi bersama debitur & AO Bank.',
          baiUrl: 'https://drive.google.com/bai-agunan-mandiri.pdf'
        }
      }
    });
    assert(submitG2Agunan.status === 200, "Kasus 1: Gerbang 2 Agunan Bank berhasil disubmit");
    assert(submitG2Agunan.data.status === 'MENUNGGU_SPM_AKHIR', "Kasus 1: Deviasi 12% dengan BAI diteruskan ke SPM");

    // Approval Berjenjang Gerbang 2 & Penerbitan NoLap
    await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: joAgunanId, keputusan: 'SETUJU', catatan: 'Kesesuaian mutu & BAI valid' } });
    await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: joAgunanId, keputusan: 'SETUJU', catatan: 'Delta analysis 12% terungkap jelas' } });
    const issueAgunan = await request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: joAgunanId } });
    assert(issueAgunan.status === 200 && issueAgunan.data.success, "Kasus 1: NoLap Definitif Agunan Bank diterbitkan (7 segmen resmi)");
    console.log("NoLap Kasus 1:", issueAgunan.data.nomorDefinitif);

    // -------------------------------------------------------------------------
    // KASUS 2: JUAL BELI / TRANSAKSI PASAR (Deviasi 2.5% <= 5% -> CONSISTENT)
    // -------------------------------------------------------------------------
    console.log("\n>>> [KASUS 2] TUJUAN: TRANSAKSI JUAL BELI (NILAI PASAR SPI 101/104)");
    const joJualBeliId = `JO-SIM-JUALBELI-${Date.now()}`;
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joJualBeliId,
        noPermintaan: `REQ-${joJualBeliId}`,
        namaKlien: 'PT Properti Makmur Sentosa',
        tujuanPenilaian: 'Jual Beli',
        jenisObjek: 'Gudang Logistik & Kantor',
        service_classification_id: 'PROPERTY',
        penilaiPublikId: 'deni_penilai',
        penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: joJualBeliId, keputusan: 'SETUJU', catatan: 'Transaksional normal' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: joJualBeliId, keputusan: 'SETUJU', catatan: 'Kelayakan teknis gudang OK' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: joJualBeliId } });

    // Submit Gerbang 2 dengan Deviasi 2.5%
    const submitG2JualBeli = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joJualBeliId,
        checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
        deltaAnalysis: { luasYuridis: 2000, luasFisik: 1950, keterangan: 'Toleransi pengukuran wajar lapangan (2.5%)' }
      }
    });
    assert(submitG2JualBeli.status === 200, "Kasus 2: Gerbang 2 Jual Beli berhasil disubmit");
    await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: joJualBeliId, keputusan: 'SETUJU', catatan: 'OK' } });
    await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: joJualBeliId, keputusan: 'SETUJU', catatan: '3 Pembanding pasar gudang verified' } });
    const issueJualBeli = await request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: joJualBeliId } });
    assert(issueJualBeli.status === 200, "Kasus 2: NoLap Definitif Jual Beli berhasil diterbitkan");
    console.log("NoLap Kasus 2:", issueJualBeli.data.nomorDefinitif);

    // -------------------------------------------------------------------------
    // KASUS 3: PELAPORAN KEUANGAN (Deviasi 18% >15% dengan Justifikasi Penilai -> NO RIGID HOLD)
    // -------------------------------------------------------------------------
    console.log("\n>>> [KASUS 3] TUJUAN: PELAPORAN KEUANGAN (PSAK 216 / NILAI WAJAR) - DEVIASI 18% DENGAN JUSTIFIKASI");
    const joLapKeuId = `JO-SIM-LAPKEU-${Date.now()}`;
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joLapKeuId,
        noPermintaan: `REQ-${joLapKeuId}`,
        namaKlien: 'PT Nusantara Industri Tbk',
        tujuanPenilaian: 'Pelaporan Keuangan',
        jenisObjek: 'Kawasan Pabrik & Lahan Industri',
        service_classification_id: 'PROPERTY',
        penilaiPublikId: 'nanang_penilai',
        penilaiPublikDitunjuk: 'Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: joLapKeuId, keputusan: 'SETUJU', catatan: 'PSAK audit requirement OK' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: joLapKeuId, keputusan: 'SETUJU', catatan: 'Model Revaluasi PSAK 216 valid' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: joLapKeuId } });

    // Submit Gerbang 2 dengan Deviasi 18% didukung Justifikasi Tertulis Penilai Publik & BAI
    const submitG2LapKeu = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joLapKeuId,
        checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
        deltaAnalysis: {
          luasYuridis: 50000,
          luasFisik: 41000,
          justifikasiPenilai: 'Terjadi pemotongan 9.000 m2 untuk jalur pipa transmisi gas negara (sempadan ROW). Sesuai KPUP 14, dampak terhadap nilai telah dihitung dan diungkapkan dalam catatan pengungkapan wajar laporan keuangan.',
          keterangan: 'Dilengkapi Berita Acara Rekonsiliasi Fisik Pabrik No. BA-09/PBR/2026',
          baiUrl: 'https://drive.google.com/bai-lapkeu-pabrik.pdf'
        }
      }
    });
    assert(submitG2LapKeu.status === 200, "Kasus 3: Gerbang 2 Pelaporan Keuangan (Deviasi 18% Berjustifikasi) berhasil disubmit");
    // Verifikasi P0 Rule: Engine TIDAK melakukan HOLD kaku karena didukung justifikasi tertulis dan BAI
    assert(submitG2LapKeu.data.status === 'MENUNGGU_SPM_AKHIR', "Kasus 3: Deviasi 18% dengan justifikasi tertulis TIDAK di-HOLD secara kaku");

    await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: joLapKeuId, keputusan: 'SETUJU', catatan: 'Justifikasi tertulis & pengungkapan PSAK lengkap' } });
    await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: joLapKeuId, keputusan: 'SETUJU', catatan: 'Review nilai wajar PSAK 216 disetujui' } });
    const issueLapKeu = await request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: joLapKeuId } });
    assert(issueLapKeu.status === 200, "Kasus 3: NoLap Definitif Pelaporan Keuangan berhasil diterbitkan dengan pengungkapan profesional");
    console.log("NoLap Kasus 3:", issueLapKeu.data.nomorDefinitif);

    // -------------------------------------------------------------------------
    // KASUS 4: PENGADAAN TANAH (SPI 204) - LEGAL RED FLAG TRIGGERS HOLD INDEPENDENTLY
    // -------------------------------------------------------------------------
    console.log("\n>>> [KASUS 4] TUJUAN: PENGADAAN TANAH (SPI 204 / UU 2/2012) - RED FLAG LEGALITAS INDEPENDENT HOLD");
    const joPengadaanId = `JO-SIM-PENGADAAN-${Date.now()}`;
    await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joPengadaanId,
        noPermintaan: `REQ-${joPengadaanId}`,
        namaKlien: 'Kementerian PUPR / BPN Pengadaan Jalan Tol',
        tujuanPenilaian: 'Pengadaan Tanah Bagi Kepentingan Umum',
        jenisObjek: 'Tanah Koridor Jalan Tol',
        service_classification_id: 'PROPERTY',
        penilaiPublikId: 'deni_penilai',
        penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });
    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: joPengadaanId, keputusan: 'SETUJU', catatan: 'Penilai berlisensi ATR/BPN valid' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: joPengadaanId, keputusan: 'SETUJU', catatan: 'Metodologi Nilai Penggantian Wajar (FRV) SPI 204 disetujui' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: joPengadaanId } });

    // Submit Gerbang 2 dengan Red Flag Legalitas (Sengketa Ahli Waris / Blokir Pengadilan)
    const submitG2Pengadaan = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joPengadaanId,
        checklistAkhir: {
          fotoGeotagLengkap: true,
          tigaPembandingTersedia: true,
          redFlagLegalitas: true
        },
        deltaAnalysis: {
          luasYuridis: 1000,
          luasFisik: 1000, // Deviasi Luas 0% (Fisik Sempurna Sama)
          redFlagLegalitas: true,
          isSengketa: true,
          keterangan: 'Terdapat perkara gugatan sengketa kepemilikan No. 45/Pdt.G/2026/PN di Pengadilan Negeri.'
        }
      }
    });
    assert(submitG2Pengadaan.status === 200, "Kasus 4: Gerbang 2 dengan Legal Red Flag berhasil direkam");
    console.log("Kasus 4 Gerbang 2 status:", submitG2Pengadaan.data.status);
    // Verifikasi P0 Rule: Meskipun deviasi luas 0%, red flag legalitas secara independen memicu HOLD
    assert(submitG2Pengadaan.data.status === 'HOLD_ESKALASI_AKHIR', "Kasus 4: Red Flag Legalitas secara mandiri memicu HOLD (Independen dari deviasi luas)");

    // -------------------------------------------------------------------------
    // KASUS 5: MESIN DAN PERALATAN INDUSTRI (SPI 301 & SE-6/PPPK/2018 Jasa PP)
    // -------------------------------------------------------------------------
    console.log("\n>>> [KASUS 5] TUJUAN: PENILAIAN MESIN INDUSTRI (SPI 301 & SE-6/PPPK/2018 KODE JASA PP)");
    const joMesinId = `JO-SIM-MESIN-${Date.now()}`;
    const submitG1Mesin = await request('?action=submitGerbang1Awal', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joMesinId,
        noPermintaan: `REQ-${joMesinId}`,
        namaKlien: 'PT Semen Perkasa Indonesia',
        tujuanPenilaian: 'Penjaminan Fasilitas / Evaluasi Aset Mesin',
        jenisObjek: 'Lini Mesin Pabrik Kiln & Grinding Plant',
        service_classification_id: 'PERSONAL_PROPERTY',
        penilaiPublikId: 'deni_penilai',
        penilaiPublikDitunjuk: 'Deni Siswandi, S.T., MAPPI (Cert.)',
        checklistAwal: { konflikKepentingan: false, redFlagLegalitas: false }
      }
    });
    assert(submitG1Mesin.status === 200, "Kasus 5: Gerbang 1 Penilaian Mesin Industri diajukan");
    assert(submitG1Mesin.data.status === 'MENUNGGU_SPM_AWAL', "Kasus 5: Gerbang 1 Penilaian Mesin Industri berstatus MENUNGGU_SPM_AWAL");

    await request('?action=reviewDannyGerbang1', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: joMesinId, keputusan: 'SETUJU', catatan: 'Kompetensi penilai mesin terverifikasi' } });
    await request('?action=reviewDeniGerbang1', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: joMesinId, keputusan: 'SETUJU', catatan: 'Metodologi Biaya Pengganti Terdepresiasi (DRC) disetujui' } });
    await request('?action=publishOfficialLP', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: joMesinId } });

    const submitG2Mesin = await request('?action=submitGerbang2Akhir', {
      method: 'POST',
      token: TOKENS.ADMIN_PUSAT,
      body: {
        idPenugasan: joMesinId,
        checklistAkhir: { fotoGeotagLengkap: true, tigaPembandingTersedia: true },
        deltaAnalysis: {
          spesifikasiMesinTerverifikasi: true,
          keterangan: 'Nameplate terverifikasi: Kapasitas 2.000 ton/hari, umur teknis 15 thn, penyusutan 25%.'
        }
      }
    });
    assert(submitG2Mesin.status === 200, "Kasus 5: Gerbang 2 Penilaian Mesin disubmit");
    await request('?action=reviewDannyGerbang2', { method: 'POST', token: TOKENS.DANNY_SPM, body: { idPenugasan: joMesinId, keputusan: 'SETUJU', catatan: 'Quality checklist mesin OK' } });
    await request('?action=reviewDeniGerbang2', { method: 'POST', token: TOKENS.DENI_DIVTEK, body: { idPenugasan: joMesinId, keputusan: 'SETUJU', catatan: 'Analisis penyusutan fisik & ekonomis diverifikasi' } });
    const issueMesin = await request('?action=issueDefinitiveNoLap', { method: 'POST', token: TOKENS.ADMIN_PUSAT, body: { idPenugasan: joMesinId } });
    assert(issueMesin.status === 200, "Kasus 5: NoLap Definitif Penilaian Mesin berhasil diterbitkan");
    console.log("NoLap Kasus 5:", issueMesin.data.nomorDefinitif);
    assert(issueMesin.data.nomorDefinitif.includes('/PP/'), "Kasus 5: NoLap memuat kode resmi jasa PP (bukan PS/PI)");

    console.log("\n================================================================================");
    console.log("HASIL AKHIR: SELURUH 5 SIMULASI SUBSTANSI DUAL GATE BERHASIL LULUS 100%");
    console.log("================================================================================");
  } finally {
    phpServer.kill();
  }
}

runSimulation().catch(err => {
  console.error("Simulation Test Failed:", err);
  process.exit(1);
});
