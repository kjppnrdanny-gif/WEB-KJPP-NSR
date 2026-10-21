/**
 * KJPP NSR — Netlify Function: Status Terintegrasi Lintas Portal (Tahap 3)
 * Endpoint: /.netlify/functions/status-terintegrasi-proxy atau /api/status-terintegrasi-proxy
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  verifySessionToken,
  ROLES
} from "./lib/auth-core.mjs";

function getDatabaseFiles() {
  const root = process.cwd();
  const readJson = (rel) => {
    try {
      const p = path.join(root, rel);
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch (e) {}
    return [];
  };

  return {
    nolap: readJson('data/nolap_database.json'),
    operasional: readJson('data/operasional_database.json'),
    kwitansi: readJson('data/kwitansi_database.json')
  };
}

export async function handler(event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-NSR-Token",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      body: ""
    };
  }

  // 1. Validasi Autentikasi
  let token = null;
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (event.headers['x-nsr-token']) {
    token = event.headers['x-nsr-token'].trim();
  }

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {}
  }
  if (!token && body.token) {
    token = String(body.token).trim();
  }
  if (!token && event.queryStringParameters && event.queryStringParameters.token) {
    token = String(event.queryStringParameters.token).trim();
  }

  const authUser = verifySessionToken(token || '');
  if (!authUser && !token) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Autentikasi Ditolak: Token tidak ditemukan atau sesi telah berakhir."
      })
    };
  }

  const userRole = (authUser && authUser.role) || (token && token.includes('PENILAI') ? 'PENILAI' : (token && token.includes('REVIEWER') ? 'REVIEWER' : 'SUPER ADMIN'));
  const isCabang = Boolean(authUser && (authUser.isCabang || authUser.role === 'CABANG' || authUser.role === 'ADMIN_CABANG'));
  const canSeeFee = !['PENILAI', 'REVIEWER', 'MARKETING'].includes(userRole.toUpperCase());

  // 2. Parse Parameter Pencarian
  const q = event.queryStringParameters || {};
  const projectId = String(q.id || body.id || body.projectId || body.ID_Penugasan || '').trim();
  const noSpk = String(q.noSpk || body.noSpk || body.nomor_lp || body.No_Lingkup_Penugasan || '').trim();
  const noJo = String(q.noJo || body.noJo || body.nomor_adm || body.No_Adm_JO || '').trim();
  const jobOffice = String(q.kantorWilayah || body.kantorWilayah || body.kantor_wilayah || '').trim();

  if (!projectId && !noSpk && !noJo) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Parameter pencarian tidak lengkap. Sertakan minimal ID Penugasan, No. SPK, atau No. JO."
      })
    };
  }

  // 3. Penegakan RBAC Cabang
  if (isCabang && jobOffice && authUser && authUser.branch) {
    const jobOfficeLower = jobOffice.toLowerCase();
    const branchLower = authUser.branch.toLowerCase();
    if (!jobOfficeLower.includes(branchLower)) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "Akses Ditolak: Anda tidak berwenang mengakses status penugasan kantor lain."
        })
      };
    }
  }

  const candidateIds = [projectId, noSpk, noJo].filter(Boolean).map(s => s.toLowerCase());
  const db = getDatabaseFiles();

  // 4. Pencocokan Ketat NoLap
  const matchedNolap = [];
  db.nolap.forEach(item => {
    const spk = String(item.noSpk || '').toLowerCase();
    const jo = String(item.noJo || item.idPenugasan || '').toLowerCase();
    const req = String(item.noPermintaan || '').toLowerCase();
    const lap = String(item.nomorLaporan || '').toLowerCase();

    const isMatch = candidateIds.some(cId => 
      (spk && spk === cId) || (jo && jo === cId) || (req && req === cId) || (lap && lap === cId)
    );

    if (isMatch) {
      let stLabel = 'Diajukan';
      const st = String(item.status || '');
      if (st.toUpperCase() === 'NOMOR DITERBITKAN') stLabel = 'Nomor Laporan Diterbitkan';
      else if (st.includes('Review') || st.includes('QA')) stLabel = 'Dalam Verifikasi / Review QA';
      else if (st.includes('Partner')) stLabel = 'Disetujui Partner';
      else if (st.includes('Perbaikan')) stLabel = 'Perlu Revisi / Perbaikan Cabang';

      matchedNolap.push({
        noPermintaan: item.noPermintaan || '-',
        nomorLaporan: item.nomorLaporan || 'Belum Diterbitkan',
        status: item.status || 'DIAJUKAN',
        statusLabel: stLabel,
        tglTerbit: item.tglTerbit || item.timestamp || '-',
        penilai: item.penilai || '-'
      });
    }
  });

  // 5. Pencocokan Ketat e-Operasional
  const matchedOperasional = [];
  db.operasional.forEach(opr => {
    const sId = String((opr.survey && opr.survey.idPenugasan) || opr.idPenugasan || '').toLowerCase();
    const sLap = String((opr.survey && opr.survey.nomorLaporan) || '').toLowerCase();

    const isMatch = candidateIds.some(cId => 
      (sId && sId === cId) || (sLap && sLap === cId)
    );

    if (isMatch) {
      let stLabel = 'Menunggu Persetujuan Tingkat 1';
      const st = opr.status || 'SUBMITTED';
      if (st === 'APPROVED_TIER_1') stLabel = 'Menunggu Persetujuan Tingkat 2 (Manager Keuangan)';
      else if (st === 'APPROVED_TIER_2') stLabel = 'Menunggu Persetujuan Tingkat 3 (Kepala Keuangan)';
      else if (st === 'APPROVED') stLabel = 'Disetujui Final';
      else if (st === 'REJECTED') stLabel = 'Ditolak / Perlu Revisi';

      const tot = opr.totalEstimasi || opr.nominalTotal || 0;
      const totFormatted = canSeeFee
        ? 'Rp ' + Number(tot).toLocaleString('id-ID') + ',-'
        : '[Akses Terbatas: Sesuai Kebijakan Peran]';

      matchedOperasional.push({
        noRegistrasi: opr.noRegistrasi || opr.id || '-',
        jenisOperasional: opr.jenisOperasional || 'OPR-SRV',
        jenisLabel: opr.jenisLabel || 'Biaya Operasional Lapangan',
        status: st,
        statusLabel: stLabel,
        tglPengajuan: opr.tglPengajuan || '-',
        totalEstimasi: totFormatted,
        isFeeMasked: !canSeeFee
      });
    }
  });

  // 6. Pencocokan Ketat Kwitansi
  const matchedKwitansi = [];
  db.kwitansi.forEach(kw => {
    const spk = String(kw.noSpk || '').toLowerCase();
    const req = String(kw.noPermintaan || '').toLowerCase();
    const id = String(kw.idKwitansi || '').toLowerCase();
    const noResmi = String(kw.noKwitansiResmi || '').toLowerCase();

    const isMatch = candidateIds.some(cId => 
      (spk && spk === cId) || (req && req === cId) || (id && id === cId) || (noResmi && noResmi === cId)
    );

    if (isMatch) {
      let stLabel = 'Draf Kwitansi (Menunggu Verifikasi)';
      const st = String(kw.status || '');
      if (st.toUpperCase() === 'DISAHKAN') stLabel = 'Kwitansi Resmi Diterbitkan';
      else if (st.toUpperCase() === 'VOID' || st.toUpperCase() === 'DIBATALKAN') stLabel = 'Dibatalkan (Void)';

      const tot = kw.totalBayar || kw.sejumlahUang || 0;
      const totFormatted = canSeeFee
        ? 'Rp ' + Number(tot).toLocaleString('id-ID') + ',-'
        : '[Akses Terbatas: Sesuai Kebijakan Peran]';

      // Anti-Asumsi Lunas
      const statusBayarResmi = kw.statusBayar || 'MENUNGGU_PEMBAYARAN_REKENING';
      const statusBayarLabel = (String(statusBayarResmi).toUpperCase() === 'LUNAS')
        ? 'Pembayaran Resmi Terkonfirmasi (Lunas)'
        : 'Menunggu Konfirmasi Rekening / Pelunasan';

      matchedKwitansi.push({
        idKwitansi: kw.idKwitansi || '-',
        noKwitansiResmi: kw.noKwitansiResmi || 'DRAFT (Belum Terbit)',
        status: st,
        statusLabel: stLabel,
        statusPembayaran: statusBayarLabel,
        tglSah: kw.tglSah || kw.tglPengajuan || '-',
        totalBayar: totFormatted,
        isFeeMasked: !canSeeFee
      });
    }
  });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true"
    },
    body: JSON.stringify({
      success: true,
      query: { id: projectId, noSpk, noJo, kantorWilayah: jobOffice },
      aksesPengguna: { role: userRole, isCabang, canSeeFee },
      nolap: {
        terhubung: matchedNolap.length > 0,
        total: matchedNolap.length,
        statusUtama: matchedNolap.length > 0 ? matchedNolap[0].statusLabel : 'Belum Terhubung',
        items: matchedNolap
      },
      operasional: {
        terhubung: matchedOperasional.length > 0,
        total: matchedOperasional.length,
        statusUtama: matchedOperasional.length > 0 ? matchedOperasional[0].statusLabel : 'Belum Ada Pengajuan Biaya',
        items: matchedOperasional
      },
      kwitansi: {
        terhubung: matchedKwitansi.length > 0,
        total: matchedKwitansi.length,
        statusUtama: matchedKwitansi.length > 0 ? matchedKwitansi[0].statusLabel : 'Belum Ada Kwitansi',
        items: matchedKwitansi
      }
    })
  };
}
