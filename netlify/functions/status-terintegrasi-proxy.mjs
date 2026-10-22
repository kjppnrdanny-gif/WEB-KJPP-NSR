/**
 * KJPP NSR — Netlify Serverless Function: Status Terintegrasi Lintas Portal (Tahap 3 - Hardened Security)
 * Endpoint: /.netlify/functions/status-terintegrasi-proxy atau /api/status-terintegrasi-proxy
 * 
 * Standar Keamanan & Integritas:
 * - Anti-Celah Autentikasi: Token diverifikasi secara asinkron (await verifySessionToken).
 * - Tanpa Fallback: Tidak ada fallback otomatis ke SUPER ADMIN jika token salah/kedaluwarsa.
 * - Anti-Bypass String / Substring: Dilarang menebak peran dari teks token atau substring.
 * - Strict Server-Side RBAC: Cabang penugasan ditentukan oleh backend (bukan parameter client).
 * - Fail-Closed: Jika cabang penugasan tidak dapat dipastikan secara resmi, tolak (HTTP 403).
 * - Sensor Kerahasiaan (Fee Masking): Nominal disensor untuk Penilai, Reviewer, dan Marketing.
 * - Pembedaan Kegagalan Sumber Data: Bedakan data tidak tersedia vs dokumen belum terhubung.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  verifySessionToken,
  ROLES
} from "./lib/auth-core.mjs";

function normalizeBranchCode(str) {
  if (!str) return '';
  const s = String(str).toUpperCase().trim();
  if (s.includes('PADANG') || s.includes('PDG') || s === '01') return 'PADANG';
  if (s.includes('MAKASSAR') || s.includes('MKS') || s === '02') return 'MAKASSAR';
  if (s.includes('PALEMBANG') || s.includes('PLB') || s === '03') return 'PALEMBANG';
  if (s.includes('BANDUNG') || s.includes('BDG') || s === '04') return 'BANDUNG';
  if (s.includes('PEKANBARU') || s.includes('PKU')) return 'PEKANBARU';
  if (s.includes('PUSAT') || s.includes('JAKARTA') || s.includes('PST') || s === '00') return 'PUSAT';
  return '';
}

function resolveJobBranchStrict(candidateIds, nolapList, operasionalList, kwitansiList) {
  // 1. Cari dari data resmi NoLap
  for (const item of nolapList) {
    const spk = String(item.noSpk || '').toLowerCase();
    const req = String(item.noPermintaan || '').toLowerCase();
    const lap = String(item.nomorLaporan || '').toLowerCase();
    const jo  = String(item.noJo || item.idPenugasan || '').toLowerCase();
    for (const cId of candidateIds) {
      if (cId && (spk === cId || jo === cId || req === cId || lap === cId)) {
        const b = normalizeBranchCode(item.cabang || item.kantorWilayah || item.wilayah);
        if (b) return b;
      }
    }
  }

  // 2. Cari dari data resmi e-Operasional
  for (const opr of operasionalList) {
    const sId = String((opr.survey && opr.survey.idPenugasan) || opr.idPenugasan || '').toLowerCase();
    const sLap = String((opr.survey && opr.survey.nomorLaporan) || '').toLowerCase();
    for (const cId of candidateIds) {
      if (cId && (sId === cId || sLap === cId)) {
        const b = normalizeBranchCode(opr.cabang || opr.kantorCabang || opr.wilayah);
        if (b) return b;
      }
    }
  }

  // 3. Cari dari data resmi Kwitansi
  for (const kw of kwitansiList) {
    const spk = String(kw.noSpk || '').toLowerCase();
    const req = String(kw.noPermintaan || '').toLowerCase();
    const id  = String(kw.idKwitansi || '').toLowerCase();
    const noRes = String(kw.noKwitansiResmi || '').toLowerCase();
    for (const cId of candidateIds) {
      if (cId && (spk === cId || req === cId || id === cId || noRes === cId)) {
        const b = normalizeBranchCode(kw.cabang || kw.kantorCabang || kw.kantorWilayah);
        if (b) return b;
      }
    }
  }

  // 4. Analisis dari pola nomor resmi SPK / JO / ID penugasan
  for (const cId of candidateIds) {
    const up = cId.toUpperCase();
    if (/(?:^|[\/\-_])(PDG|0160-01)(?:$|[\/\-_])/i.test(up) || /^PDG-?\d+/i.test(up)) return 'PADANG';
    if (/(?:^|[\/\-_])(BDG|0160-04)(?:$|[\/\-_])/i.test(up) || /^BDG-?\d+/i.test(up)) return 'BANDUNG';
    if (/(?:^|[\/\-_])(MKS|0160-02)(?:$|[\/\-_])/i.test(up) || /^MKS-?\d+/i.test(up)) return 'MAKASSAR';
    if (/(?:^|[\/\-_])(PLB|0160-03)(?:$|[\/\-_])/i.test(up) || /^PLB-?\d+/i.test(up)) return 'PALEMBANG';
    if (/(?:^|[\/\-_])(PST|JKT|0160-00)(?:$|[\/\-_])/i.test(up) || /^\d{4}\/LP\/NSR\//i.test(up) || /^NSR-2026-/i.test(up)) return 'PUSAT';
  }

  return null;
}

function readDatabaseSafe(relPath) {
  const root = process.cwd();
  try {
    const p = path.join(root, relPath);
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return { available: true, data };
      }
    }
  } catch (e) {}
  return { available: false, data: [] };
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

  // 1. Ekstraksi Token Autentikasi
  let token = null;
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (event.headers['x-nsr-token']) {
    token = String(event.headers['x-nsr-token']).trim();
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

  // Jika token tidak ada sama sekali -> HTTP 401
  if (!token) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Autentikasi Ditolak (401 Unauthorized): Token autentikasi tidak disertakan.",
        violation: "MISSING_TOKEN"
      })
    };
  }

  // Verifikasi Kriptografis Sesi (WAJIB AWAIT! Tidak ada fallback SUPER ADMIN)
  const authRes = await verifySessionToken(token);
  if (!authRes || !authRes.valid || !authRes.payload) {
    return {
      statusCode: authRes?.isStorageError ? 503 : 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: authRes?.error || "Autentikasi Ditolak (401 Unauthorized): Sesi telah kedaluwarsa atau token tidak sah.",
        violation: "INVALID_TOKEN"
      })
    };
  }

  // Dapatkan profil pengguna RESMI dari payload token
  const authUser = authRes.payload;
  const userRole = String(authUser.role || '').toUpperCase();
  const isCabang = Boolean(authUser.isCabang || userRole === 'CABANG' || userRole === 'ADMIN_CABANG' || userRole === 'KEUANGAN_CABANG');
  const userBranch = normalizeBranchCode(authUser.branch || authUser.wilayah || authUser.wilayahCode || '');
  const canSeeFee = Boolean(authUser.seeFee !== false && !['PENILAI', 'REVIEWER', 'MARKETING', 'SURVEYOR'].includes(userRole));

  // 2. Parse Parameter Pencarian
  const q = event.queryStringParameters || {};
  const projectId = String(q.id || body.id || body.projectId || body.ID_Penugasan || '').trim();
  const noSpk = String(q.noSpk || body.noSpk || body.nomor_lp || body.No_Lingkup_Penugasan || '').trim();
  const noJo = String(q.noJo || body.noJo || body.nomor_adm || body.No_Adm_JO || '').trim();

  if (!projectId && !noSpk && !noJo) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "Parameter pencarian tidak lengkap. Sertakan minimal ID Penugasan, No. SPK, atau No. JO.",
        violation: "MISSING_SEARCH_PARAM"
      })
    };
  }

  const candidateIds = [projectId, noSpk, noJo].filter(Boolean).map(s => s.toLowerCase());

  // 3. Baca Sumber Data
  const nolapSource = readDatabaseSafe('data/nolap_database.json');
  const oprSource = readDatabaseSafe('data/operasional_database.json');
  const kwSource = readDatabaseSafe('data/kwitansi_database.json');

  // 4. Penentuan Cabang Penugasan dari Basis Data Resmi & Pola ID (Bukan Parameter Client)
  const resolvedJobBranch = resolveJobBranchStrict(
    candidateIds,
    nolapSource.data,
    oprSource.data,
    kwSource.data
  );

  // Penegakan Hak Akses Cabang (RBAC Data Isolation)
  if (isCabang) {
    // FAIL-CLOSED: Jika identitas kantor penugasan tidak dapat diverifikasi secara resmi -> HTTP 403
    if (!resolvedJobBranch) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "Akses Ditolak (403 Forbidden): Identitas kantor penugasan tidak dapat diverifikasi secara resmi. Akses ditolak (fail-closed protection).",
          violation: "UNVERIFIED_BRANCH_JOB"
        })
      };
    }

    if (userBranch !== resolvedJobBranch) {
      return {
        statusCode: 403,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "Akses Ditolak (403 Forbidden): Anda hanya berwenang memeriksa status penugasan yang menjadi tanggung jawab kantor cabang Anda.",
          violation: "CROSS_BRANCH_ACCESS_DENIED"
        })
      };
    }
  }

  // 5. Pencocokan Ketat NoLap
  const matchedNolap = [];
  if (nolapSource.available) {
    nolapSource.data.forEach(item => {
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
  }

  // 6. Pencocokan Ketat e-Operasional
  const matchedOperasional = [];
  if (oprSource.available) {
    oprSource.data.forEach(opr => {
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
  }

  // 7. Pencocokan Ketat Kwitansi
  const matchedKwitansi = [];
  if (kwSource.available) {
    kwSource.data.forEach(kw => {
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
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true"
    },
    body: JSON.stringify({
      success: true,
      query: {
        id: projectId,
        noSpk,
        noJo,
        resolvedOffice: resolvedJobBranch || 'TIDAK_DAPAT_DIPASTIKAN'
      },
      aksesPengguna: {
        role: userRole,
        isCabang,
        wilayah: authUser.wilayahLabel || authUser.wilayah || 'Pusat',
        canSeeFee
      },
      nolap: {
        terhubung: matchedNolap.length > 0,
        statusKoneksi: nolapSource.available ? 'TERHUBUNG_AKTIF' : 'SUMBER_TIDAK_TERSEDIA',
        statusUtama: !nolapSource.available
          ? 'Sumber Data Tidak Tersedia'
          : (matchedNolap.length > 0 ? matchedNolap[0].statusLabel : 'Belum Terhubung'),
        keterangan: !nolapSource.available
          ? 'Basis data NoLap sedang offline atau berkas tidak tersedia di server.'
          : (matchedNolap.length > 0 ? `Ditemukan ${matchedNolap.length} dokumen resmi.` : 'Tidak ada dokumen resmi NoLap yang terdaftar.'),
        total: matchedNolap.length,
        items: matchedNolap
      },
      operasional: {
        terhubung: matchedOperasional.length > 0,
        statusKoneksi: oprSource.available ? 'TERHUBUNG_AKTIF' : 'SUMBER_TIDAK_TERSEDIA',
        statusUtama: !oprSource.available
          ? 'Sumber Data Tidak Tersedia'
          : (matchedOperasional.length > 0 ? matchedOperasional[0].statusLabel : 'Belum Ada Pengajuan Biaya'),
        keterangan: !oprSource.available
          ? 'Basis data e-Operasional sedang offline atau berkas tidak tersedia di server.'
          : (matchedOperasional.length > 0 ? `Ditemukan ${matchedOperasional.length} pengajuan biaya operasional.` : 'Belum ada pengajuan biaya operasional.'),
        total: matchedOperasional.length,
        items: matchedOperasional
      },
      kwitansi: {
        terhubung: matchedKwitansi.length > 0,
        statusKoneksi: kwSource.available ? 'TERHUBUNG_AKTIF' : 'SUMBER_TIDAK_TERSEDIA',
        statusUtama: !kwSource.available
          ? 'Sumber Data Tidak Tersedia'
          : (matchedKwitansi.length > 0 ? matchedKwitansi[0].statusLabel : 'Belum Ada Kwitansi'),
        keterangan: !kwSource.available
          ? 'Basis data Kwitansi sedang offline atau berkas tidak tersedia di server.'
          : (matchedKwitansi.length > 0 ? `Ditemukan ${matchedKwitansi.length} kwitansi resmi.` : 'Belum ada kwitansi resmi yang diterbitkan.'),
        total: matchedKwitansi.length,
        items: matchedKwitansi
      }
    })
  };
}
