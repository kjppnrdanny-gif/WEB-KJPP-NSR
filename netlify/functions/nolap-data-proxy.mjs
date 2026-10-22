import fs from "node:fs";
/**
 * KJPP NSR - Server-Side Protected Data Proxy untuk Portal NoLap (Tahap 2.6B-2A)
 * 
 * Karakteristik Keamanan:
 * 1. Menolak seluruh permintaan tanpa sesi sah (401 Unauthorized).
 * 2. RBAC Enforcement di sisi server:
 *    - ADMIN_PUSAT: Memperoleh seluruh data pengajuan, berwenang approval & penetapan nomor resmi.
 *    - CABANG: HANYA memperoleh data pengajuan milik cabangnya sendiri (Strict Data Partitioning).
 *    - CABANG DILARANG KERAS melakukan approval / penetapan nomor resmi (403 Forbidden).
 * 3. Fail-Closed: Jika verifikasi sesi gagal/terputus, akses ditolak seketika (503 Service Unavailable).
 * 4. Isolasi Total: Menggunakan penyimpanan dummy in-memory/lokal. TIDAK terhubung ke Google Sheets produksi.
 */

import { createHash } from "node:crypto";
import {
  verifySessionToken,
  ROLES,
  PERMISSIONS_MATRIX,
  verifyCsrf
} from "./lib/auth-core.mjs";
import { PersistentAuthStore } from "./lib/storage-adapter.mjs";

const nolapStore = new PersistentAuthStore("nolap-queue");
const NOLAP_QUEUE_KEY = "active_records";

// Flag Simulasi Transaksi (Hanya dapat diaktifkan secara eksplisit dalam test suite terisolasi)
let _transactionalSimulationEnabled = false;

export function _setTransactionalSimulationMode(enabled) {
  _transactionalSimulationEnabled = Boolean(enabled);
}

// Database Dummy Sintetik untuk Lingkungan Pengembangan & Pengujian Lokal
let dummyDatabaseNoLap = [
  {
    noPermintaan: "REQ-DUMMY-001",
    timestamp: "2026-10-09 09:15:00",
    cabang: "Bandung",
    namaPemohon: "Staf Cabang Bandung (Dummy)",
    jabatanPemohon: "Admin Cabang",
    emailPemohon: "dummy.bdg@example.com",
    waPemohon: "081200000001",
    namaKlien: "PT Rekanan Simulasi Mandiri (Dummy)",
    statusKlien: "Swasta",
    alamatKlien: "Jl. Simulasi No. 10, Bandung",
    kontakKlien: "081200000002",
    klasifikasiJasa: "PI",
    kodeIndustri: "07",
    tujuanPenilaian: "Penjaminan Utang",
    jenisObjek: "Tanah dan Bangunan Ruko",
    lokasiObjek: "Kawasan Niaga Dago, Bandung",
    deadline: "2026-10-15",
    penilai: "Penilai Simulasi Satu",
    izinPenilai: "00581",
    npwp: "00.000.000.0-000.000",
    kodeNpwp: "1",
    penggunaLaporan: "PT Bank Tabungan Simulasi (Persero) Tbk",
    status: "NOMOR DITERBITKAN",
    nomorLaporan: "00531/2.0160-04/PI/07/00581/1/X/2026",
    tglTerbit: "2026-10-09",
    statusElsa: "BELUM INPUT",
    linkElsa: "",
    linkDrive: "https://drive.example.com/dummy/001",
    catatanAdmin: "Nomor resmi disahkan Admin Pusat."
  },
  {
    noPermintaan: "REQ-DUMMY-002",
    timestamp: "2026-10-09 11:30:00",
    cabang: "Padang",
    namaPemohon: "Staf Cabang Padang (Dummy)",
    jabatanPemohon: "Admin Cabang",
    emailPemohon: "dummy.pdg@example.com",
    waPemohon: "081200000003",
    namaKlien: "CV Andalas Cipta Sejahtera (Dummy)",
    statusKlien: "Swasta",
    alamatKlien: "Jl. Khatib Sulaiman No. 5, Padang",
    kontakKlien: "081200000004",
    klasifikasiJasa: "PI",
    kodeIndustri: "03",
    tujuanPenilaian: "Jual Beli",
    jenisObjek: "Tanah Kosong",
    lokasiObjek: "Bypass Padang Km 12",
    deadline: "2026-10-18",
    penilai: "Penilai Simulasi Dua",
    izinPenilai: "00581",
    npwp: "00.000.000.0-000.000",
    kodeNpwp: "1",
    penggunaLaporan: "PT Bank Nagari Simulasi",
    status: "DIAJUKAN",
    nomorLaporan: "",
    tglTerbit: "",
    statusElsa: "BELUM INPUT",
    linkElsa: "",
    linkDrive: "https://drive.example.com/dummy/002",
    catatanAdmin: ""
  },
  {
    noPermintaan: "REQ-DUMMY-003",
    timestamp: "2026-10-09 14:00:00",
    cabang: "Pusat",
    namaPemohon: "Staf Kantor Pusat (Dummy)",
    jabatanPemohon: "Reviewer",
    emailPemohon: "dummy.pst@example.com",
    waPemohon: "081200000005",
    namaKlien: "PT Megah Konstruksi Indonesia (Dummy)",
    statusKlien: "BUMN",
    alamatKlien: "Jl. Jenderal Sudirman Kav. 21, Jakarta",
    kontakKlien: "081200000006",
    klasifikasiJasa: "PS",
    kodeIndustri: "02",
    tujuanPenilaian: "Pelaporan Keuangan",
    jenisObjek: "Mesin dan Peralatan Pabrik",
    lokasiObjek: "Kawasan Industri Pulo Gadung, Jakarta",
    deadline: "2026-10-25",
    penilai: "Penilai Simulasi Tiga",
    izinPenilai: "00581",
    npwp: "00.000.000.0-000.000",
    kodeNpwp: "1",
    penggunaLaporan: "PT Rekanan Korporasi",
    status: "DIAJUKAN",
    nomorLaporan: "",
    tglTerbit: "",
    statusElsa: "BELUM INPUT",
    linkElsa: "",
    linkDrive: "https://drive.example.com/dummy/003",
    catatanAdmin: ""
  }
];

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
      ...extraHeaders
    }
  });
}

export async function _loadNolapDatabase() {
  try {
    const persisted = await nolapStore.get(NOLAP_QUEUE_KEY);
    if (persisted && Array.isArray(persisted) && persisted.length > 0) {
      dummyDatabaseNoLap = persisted;
      return persisted;
    }
  } catch (err) {
    if (err.message && err.message.includes("STORAGE_SIMULATED_FAILURE")) {
      throw err;
    }
  }
  // Di lingkungan produksi, dilarang mengembalikan data dummy sintetis
  if (process.env.NSR_ENV === "production" || process.env.CONTEXT === "production") {
    return [];
  }
  return dummyDatabaseNoLap;
}

export async function _saveNolapDatabase(records) {
  dummyDatabaseNoLap = records;
  await nolapStore.set(NOLAP_QUEUE_KEY, records);
}

function extractToken(req) {
  // 1. Ambil dari HttpOnly Cookie 'nsr_session'
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/nsr_session=([^;]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }

  // 2. Fallback: Authorization Bearer header
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

export default async (req) => {
  // 1. Ekstraksi Token Sesi
  const token = extractToken(req);
  if (!token) {
    return jsonResponse(
      {
        error: "Akses ditolak: Autentikasi server diperlukan untuk membaca atau memproses data NoLap.",
        authenticated: false
      },
      401
    );
  }

  // 2. Verifikasi Token Sesi Kriptografis (Fail-Closed)
  const sessionResult = await verifySessionToken(token);
  if (!sessionResult.valid) {
    const status = sessionResult.isStorageError ? 503 : 401;
    return jsonResponse(
      {
        error: sessionResult.error || "Sesi tidak valid atau telah dicabut",
        authenticated: false
      },
      status
    );
  }

  const user = sessionResult.payload;
  const userRole = user.role;
  const userBranch = (user.branch || "").trim();

  // Muat data aktif dari persistent store (Fail-Closed jika storage putus)
  let activeData;
  try {
    activeData = await _loadNolapDatabase();
  } catch (storageErr) {
    return jsonResponse(
      {
        error: "Layanan antrean NoLap tidak dapat diakses (Fail-Closed protection). Akses ditangguhkan.",
        failClosed: true
      },
      503
    );
  }

  // -------------------------------------------------------------------------
  // METODE GET: Pembacaan Data NoLap Terlindungi (Protected Read)
  // -------------------------------------------------------------------------
  if (req.method === "GET") {
    let reqUrl;
    try {
      reqUrl = new URL(req.url, "http://localhost");
    } catch (e) {
      reqUrl = new URL("http://localhost");
    }
    const action = reqUrl.searchParams.get("action");

    // Action GET: Directory Personel Master
    if (action === "getPersonelDirectory") {
      try {
        const raw = fs.readFileSync("data/masters/master_personel_kontak.json", "utf8");
        const list = JSON.parse(raw);
        return jsonResponse({
          success: true,
          total: list.length,
          personel: list
        });
      } catch (e) {
        return jsonResponse({ success: false, error: "Master data personel tidak dapat dibaca." }, 500);
      }
    }

    // Action GET: Profile Kontak Pengaju
    if (action === "getRequesterContactProfile") {
      try {
        const raw = fs.readFileSync("data/masters/master_personel_kontak.json", "utf8");
        const list = JSON.parse(raw);
        const subKey = (user.sub || user.role || "").toLowerCase();
        let matched = list.find(p => (p.email && p.email.toLowerCase().includes(subKey)) || (p.nama && p.nama.toLowerCase().includes(subKey)));
        if (!matched && userBranch) {
          matched = list.find(p => p.office && p.office.toLowerCase().includes(userBranch.toLowerCase()));
        }
        return jsonResponse({
          success: true,
          profile: matched || {
            nama: user.displayName || user.sub,
            email: "notifikasi@kjppnanangrahayu.com",
            wa: "081298765432",
            office: userBranch || "Kantor Pusat Jakarta"
          }
        });
      } catch (e) {
        return jsonResponse({ success: false, error: "Gagal memuat profil kontak." }, 500);
      }
    }

    // Action GET: Riwayat Notifikasi
    if (action === "getNotificationLogs") {
      try {
        const raw = fs.existsSync("data/notification_logs.json") ? fs.readFileSync("data/notification_logs.json", "utf8") : "[]";
        let logs = JSON.parse(raw);
        if (userRole === ROLES.CABANG) {
          logs = logs.filter(l => (l.office_id === user.office_id) || (l.cabang && l.cabang.toLowerCase().includes(userBranch.toLowerCase())));
        }
        return jsonResponse({
          success: true,
          total: logs.length,
          logs: logs
        });
      } catch (e) {
        return jsonResponse({ success: false, error: "Gagal memuat log notifikasi." }, 500);
      }
    }

    // Action GET: Antrean Pendaftaran Personel (Admin Pusat Only)
    if (action === "getRegistrasiPersonelQueue") {
      if (userRole !== ROLES.ADMIN_PUSAT) {
        return jsonResponse({ error: "Akses ditolak: Hanya Admin Pusat yang berhak meninjau antrean pendaftaran personel." }, 403);
      }
      try {
        const raw = fs.existsSync("data/registrasi_personel_antrean.json") ? fs.readFileSync("data/registrasi_personel_antrean.json", "utf8") : "[]";
        const q = JSON.parse(raw);
        return jsonResponse({
          success: true,
          total: q.length,
          antrean: q
        });
      } catch (e) {
        return jsonResponse({ success: false, error: "Gagal memuat antrean registrasi." }, 500);
      }
    }

    const noReqTarget = reqUrl.searchParams.get("noPermintaan");

    if (noReqTarget) {
      const foundItem = activeData.find((i) => i.noPermintaan === noReqTarget);
      if (!foundItem) {
        return jsonResponse({ error: "Data permohonan NoLap tidak ditemukan" }, 404);
      }
      // Validasi Isolasi Cabang: Cabang dilarang membaca record cabang lain
      if (userRole === ROLES.CABANG && (foundItem.cabang || "").toLowerCase() !== userBranch.toLowerCase()) {
        return jsonResponse(
          {
            error: "Akses Ditolak (403 Forbidden): Kantor Cabang tidak diizinkan mengakses data permohonan kantor lain.",
            violation: "CROSS_BRANCH_ACCESS_DENIED"
          },
          403
        );
      }
      return jsonResponse({
        success: true,
        record: foundItem
      });
    }

    // ADMIN_PUSAT: Berhak membaca SELURUH data antrean dan riwayat
    if (userRole === ROLES.ADMIN_PUSAT) {
      return jsonResponse({
        success: true,
        scope: "GLOBAL_ALL_BRANCHES",
        userRole: userRole,
        totalRecords: activeData.length,
        data: activeData
      });
    }

    // CABANG: HANYA berhak membaca data pengajuan milik cabangnya sendiri!
    if (userRole === ROLES.CABANG) {
      const filteredData = activeData.filter(
        (item) => item.cabang.toLowerCase() === userBranch.toLowerCase()
      );
      return jsonResponse({
        success: true,
        scope: "BRANCH_ISOLATED",
        userRole: userRole,
        branch: userBranch,
        totalRecords: filteredData.length,
        data: filteredData
      });
    }

    // KEUANGAN & SURVEYOR: Diberikan akses sesuai matriks izin
    return jsonResponse({
      success: true,
      scope: "RESTRICTED_VIEW",
      userRole: userRole,
      data: activeData.filter((item) => item.status === "NOMOR DITERBITKAN")
    });
  }

  // -------------------------------------------------------------------------
  // METODE POST: Submit Pengajuan Baru / Tindakan Approval Resmi
  // -------------------------------------------------------------------------
  if (req.method === "POST") {
    // Validasi CSRF
    if (!verifyCsrf(req)) {
      return jsonResponse({ error: "Permintaan ditolak (CSRF Protection)" }, 403);
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return jsonResponse({ error: "Format payload tidak valid (JSON required)" }, 400);
    }

    const { action, payload } = body || {};

    // A. TINDAKAN SUBMIT PENGAJUAN BARU (Cabang & Admin berwenang)
    if (action === "submitRequest") {
      if (!payload || !payload.namaKlien) {
        return jsonResponse({ error: "Data pengajuan tidak lengkap" }, 400);
      }

      // Pastikan cabang yang mengajukan sesuai dengan identitas sesi pengguna
      const cabangPengaju = userRole === ROLES.ADMIN_PUSAT ? (payload.cabang || "Pusat") : userBranch;
      const idReq = `REQ-DUMMY-${String(activeData.length + 1).padStart(3, "0")}`;
      
      const isBooking = payload.modePengajuan === "BOOKING" || Boolean(payload.isBooking);
      const newRecord = {
        ...payload,
        noPermintaan: idReq,
        cabang: cabangPengaju,
        namaPemohon: user.displayName || user.sub,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        status: isBooking ? "BOOKING DIAJUKAN" : "DIAJUKAN",
        nomorLaporan: "",
        tglTerbit: "",
        statusElsa: isBooking ? "MENUNGGU BERKAS FINAL" : "BELUM INPUT"
      };

      activeData.unshift(newRecord);
      await _saveNolapDatabase(activeData);

      return jsonResponse({
        success: true,
        message: "Permohonan nomor laporan berhasil direkam di server terproteksi.",
        record: newRecord
      });
    }

    // B. TINDAKAN FINALISASI BERKAS BOOKING NOLAP
    if (action === "finalizeBookingReport") {
      const noReq = payload?.noPermintaan;
      const noLap = payload?.nomorLaporan;
      const noSpk = payload?.noSpk;

      const target = activeData.find(item => 
        (noReq && item.noPermintaan === noReq) ||
        (noLap && item.nomorLaporan === noLap) ||
        (noSpk && item.noSpk === noSpk)
      );

      if (!target) {
        return jsonResponse({ error: "Data permohonan booking tidak ditemukan" }, 404);
      }

      target.status = "FINAL - SIAP ELSA";
      target.statusElsa = "BELUM INPUT";
      if (payload.kesimpulanNilai) target.kesimpulanNilai = payload.kesimpulanNilai;
      if (payload.tglLaporan) target.tglTerbit = payload.tglLaporan;
      if (payload.fileLaporan) target.fileLaporan = payload.fileLaporan;
      if (payload.filePembanding) target.filePembanding = payload.filePembanding;
      if (payload.fileBai) target.fileBai = payload.fileBai;
      target.linkLaporan = payload.fileLaporan || target.linkLaporan;
      target.linkPembanding = payload.filePembanding || target.linkPembanding;
      target.linkBai = payload.fileBai || target.linkBai;
      target.linkDrive = payload.fileLaporan || target.linkDrive;

      await _saveNolapDatabase(activeData);

      return jsonResponse({
        success: true,
        message: "Berkas booking berhasil difinalisasi dan status dinaikkan menjadi FINAL - SIAP ELSA.",
        record: target
      });
    }

    // C. TINDAKAN APPROVAL / PENETAPAN NOMOR RESMI (MUTLAK HANYA ADMIN_PUSAT!)
    if (action === "approveRequest") {
      if (userRole !== ROLES.ADMIN_PUSAT) {
        return jsonResponse(
          {
            error: "Akses Ditolak (403 Forbidden): Kantor Cabang TIDAK MEMILIKI OTORITAS menetapkan nomor laporan resmi. Wewenang mutlak milik Admin Kantor Pusat.",
            violation: "UNAUTHORIZED_APPROVAL_ATTEMPT"
          },
          403
        );
      }

      // FAIL-CLOSED GUARD UNTUK PENETAPAN NOMOR RESMI
      // Jika penyimpanan transaksional terdistribusi (Distributed Transaction Lock) belum aktif,
      // dan bukan dalam mode simulasi pengujian eksplisit, operasi DITANGGUHKAN SEKETIKA.
      const hasDistributedLock = process.env.NSR_DISTRIBUTED_TRANSACTIONAL_LOCK === "true";
      if (!hasDistributedLock && !_transactionalSimulationEnabled) {
        return jsonResponse(
          {
            error: "Operasi penetapan nomor laporan resmi secara otomatis ditangguhkan (Fail-Closed). Sistem saat ini belum terhubung ke penyimpanan transaksional terdistribusi yang menjamin keunikan nomor lintas-instance serverless. Selama masa transisi, penetapan nomor wajib dilakukan secara manual oleh Admin Kantor Pusat melalui buku register resmi.",
            violation: "TRANSACTIONAL_LOCK_REQUIRED",
            failClosed: true,
            mode: "MANUAL_CENTRAL_REGISTER"
          },
          503
        );
      }

      const dataApprove = payload || body.data || body || {};
      const noPermintaan = dataApprove.noPermintaan || dataApprove.idPermohonan;
      const nomorLaporan = dataApprove.nomorLaporan || dataApprove.nomorLaporanResmi;
      const catatanAdmin = dataApprove.catatanAdmin || "";

      if (!nomorLaporan || typeof nomorLaporan !== "string" || !nomorLaporan.trim()) {
        return jsonResponse({ error: "Nomor laporan resmi wajib diisi" }, 400);
      }

      const targetItem = activeData.find((i) => i.noPermintaan === noPermintaan);
      if (!targetItem) {
        return jsonResponse({ error: "Data permohonan tidak ditemukan" }, 404);
      }

      // Validasi Anti-Duplikasi: Blokir penetapan nomor ganda
      const isDuplicate = activeData.some(
        (i) => i.nomorLaporan && i.nomorLaporan.trim() === nomorLaporan.trim() && i.noPermintaan !== noPermintaan
      );
      if (isDuplicate) {
        return jsonResponse(
          {
            error: `Penetapan nomor ditolak: Nomor laporan '${nomorLaporan}' sudah pernah diterbitkan untuk permohonan lain.`,
            violation: "DUPLICATE_NUMBER_REJECTED"
          },
          409
        );
      }

      targetItem.status = "NOMOR DITERBITKAN";
      targetItem.nomorLaporan = nomorLaporan;
      targetItem.tglTerbit = new Date().toISOString().split("T")[0];
      targetItem.catatanAdmin = catatanAdmin || "Disetujui Admin Pusat.";

      await _saveNolapDatabase(activeData);

      return jsonResponse({
        success: true,
        message: `Nomor laporan resmi '${nomorLaporan}' berhasil ditetapkan oleh Admin Kantor Pusat.`,
        record: targetItem
      });
    }

    // C.1. TINDAKAN REQUEST REVISION (Wewenang ADMIN_PUSAT)
    if (action === "requestRevision") {
      if (userRole !== ROLES.ADMIN_PUSAT) {
        return jsonResponse(
          {
            error: "Akses Ditolak (403 Forbidden): Wewenang meminta revisi pengajuan mutlak milik Admin Kantor Pusat.",
            violation: "UNAUTHORIZED_REVISION_ATTEMPT"
          },
          403
        );
      }

      const { noPermintaan, catatanAdmin } = payload || {};
      const targetItem = activeData.find((i) => i.noPermintaan === noPermintaan);
      if (!targetItem) {
        return jsonResponse({ error: "Data permohonan tidak ditemukan" }, 404);
      }

      targetItem.status = "PERLU REVISI";
      targetItem.catatanAdmin = catatanAdmin || "Status Dikembalikan untuk Revisi.";

      await _saveNolapDatabase(activeData);

      return jsonResponse({
        success: true,
        message: `Permohonan '${noPermintaan}' telah berhasil dikembalikan untuk revisi.`,
        record: targetItem
      });
    }

    // C. TINDAKAN SIMPAN / SINKRONISASI DATA MITIGASI RISIKO (KJPP-RM-CA-01, 02, 03)
    if (action === "saveMitigasi") {
      const { noPermintaan, tipeMitigasi, mitigasiData } = payload || {};
      if (!noPermintaan || !tipeMitigasi || !mitigasiData) {
        return jsonResponse(
          { error: "Parameter mitigasi tidak lengkap (noPermintaan, tipeMitigasi, mitigasiData wajib diisi)" },
          400
        );
      }

      const targetItem = activeData.find((i) => i.noPermintaan === noPermintaan);
      if (!targetItem) {
        return jsonResponse({ error: "Data permohonan NoLap tidak ditemukan di sistem." }, 404);
      }

      // ISOLASI CABANG (Server-side RBAC Enforcement):
      // Staf Cabang DILARANG KERAS menyimpan atau memodifikasi mitigasi milik cabang lain!
      if (userRole === ROLES.CABANG) {
        if ((targetItem.cabang || "").toLowerCase() !== userBranch.toLowerCase()) {
          return jsonResponse(
            {
              error: `Akses Ditolak (403 Forbidden): Cabang '${userBranch}' tidak memiliki kewenangan mengubah data mitigasi milik Cabang '${targetItem.cabang}'.`,
              violation: "CROSS_BRANCH_MITIGASI_TAMPERING_ATTEMPT"
            },
            403
          );
        }
      }

      // VALIDASI APPROVAL:
      // Status 'APPROVED' TIDAK BOLEH ditetapkan oleh Cabang atau peran non-Pusat!
      const isApprovalClaimed = Boolean(
        mitigasiData.statusDokumen === "APPROVED" ||
        mitigasiData.statusApproval === "APPROVED" ||
        mitigasiData.isApproved === true ||
        mitigasiData.rekomendasiKeputusan === "DISETUJUI" ||
        mitigasiData.secF_qc?.f05 === "APPROVED" ||
        mitigasiData.secF_acceptance?.keputusan === "APPROVED" ||
        mitigasiData.sec_acceptance?.keputusan === "APPROVED"
      );

      if (isApprovalClaimed && userRole !== ROLES.ADMIN_PUSAT) {
        return jsonResponse(
          {
            error: "Akses Ditolak (403 Forbidden): Keputusan formal APPROVAL mitigasi risiko hanya dapat disahkan oleh Reviewer Kantor Pusat / Pemimpin Rekan berwenang.",
            violation: "UNAUTHORIZED_MITIGATION_APPROVAL_ATTEMPT"
          },
          403
        );
      }

      // Metadata Audit Server (Server-Side Timestamp & Cryptographic Integrity Hash)
      const serverTimestamp = new Date().toISOString();
      const contentHash = createHash("sha256")
        .update(JSON.stringify(mitigasiData))
        .digest("hex");

      const auditMeta = {
        serverRecordedAt: serverTimestamp,
        serverRecordedBy: user.displayName || user.sub,
        serverRecordedRole: userRole,
        serverBranch: userBranch || targetItem.cabang,
        contentHash: contentHash,
        isApprovedFormal: false
      };

      if (isApprovalClaimed && userRole === ROLES.ADMIN_PUSAT) {
        auditMeta.isApprovedFormal = true;
        auditMeta.serverApprovedAt = serverTimestamp;
        auditMeta.serverApprovedBy = user.displayName || user.sub;
        auditMeta.serverApprovalRole = userRole;
      }

      if (!targetItem.mitigasi) {
        targetItem.mitigasi = {};
      }

      targetItem.mitigasi[tipeMitigasi] = {
        ...mitigasiData,
        _serverAudit: auditMeta,
        lastUpdated: serverTimestamp
      };

      await _saveNolapDatabase(activeData);

      return jsonResponse({
        success: true,
        message: `Data mitigasi risiko (${tipeMitigasi}) untuk permohonan ${noPermintaan} berhasil diverifikasi dan disinkronkan ke server terpusat.`,
        noPermintaan,
        tipeMitigasi,
        serverAudit: auditMeta,
        record: targetItem
      });
    }

    // POST: Submit Registrasi Personel Baru / Pembaruan Kontak
    if (action === "submitRegistrasiPersonel") {
      const regNama = payload?.nama;
      const regEmail = payload?.email;
      const regWa = payload?.whatsapp_number;
      if (!regNama || !regEmail || !regWa) {
        return jsonResponse({ error: "Nama, email, dan WhatsApp wajib diisi." }, 400);
      }
      const regId = "REG-" + Date.now();
      const newReg = {
        registration_id: regId,
        nama: regNama,
        nik: payload?.nik || "",
        office_id: payload?.office_id || "2.0160-00",
        office: payload?.office || "Kantor Pusat Jakarta",
        jabatan: payload?.jabatan || "Staf",
        divisi: payload?.divisi || "Operasional",
        email: regEmail,
        whatsapp_number: regWa,
        alasan_pengajuan: payload?.alasan_pengajuan || "",
        status: "PENDING_VERIFIKASI_ADMIN",
        submitted_by: user.displayName || user.sub,
        submitted_at: new Date().toISOString()
      };
      let q = [];
      try {
        if (fs.existsSync("data/registrasi_personel_antrean.json")) {
          q = JSON.parse(fs.readFileSync("data/registrasi_personel_antrean.json", "utf8"));
        }
      } catch (e) {}
      q.push(newReg);
      fs.writeFileSync("data/registrasi_personel_antrean.json", JSON.stringify(q, null, 2), "utf8");
      return jsonResponse({
        success: true,
        registration_id: regId,
        status: "PENDING_VERIFIKASI_ADMIN",
        message: "Pengajuan registrasi personel berhasil direkam dan menunggu verifikasi administratif."
      });
    }

    // POST: Verifikasi QR Code eLSa & Notifikasi WhatsApp Siap Kirim
    if (action === "verifyElsaQrReport") {
      if (userRole !== ROLES.ADMIN_PUSAT) {
        return jsonResponse({ error: "Akses ditolak: Verifikasi eLSa hanya wewenang Admin Pusat." }, 403);
      }
      const noPermintaan = payload?.noPermintaan;
      const linkElsa = payload?.linkElsa || payload?.linkQr;
      const statusElsa = payload?.statusElsa || "TERVERIFIKASI QR RESMI";
      if (!linkElsa) {
        return jsonResponse({ error: "Tautan QR eLSa wajib diisi." }, 400);
      }
      const targetItem = activeData.find(i => i.noPermintaan === noPermintaan);
      if (targetItem) {
        targetItem.linkElsa = linkElsa;
        targetItem.statusElsa = statusElsa;
        await _saveNolapDatabase(activeData);
      }
      const waNorm = (targetItem?.waPemohon || "081298765432").replace(/^0/, "62").replace(/[^0-9]/g, "");
      const waText = encodeURIComponent(`*NOTIFIKASI RESMI KJPP NANANG RAHAYU*\n\nYth. Rekan ${targetItem?.namaPemohon || "Pengaju"},\n\nQR Code eLSa-PK untuk laporan ${targetItem?.nomorLaporan || targetItem?.noPermintaan} telah BERHASIL DIVERIFIKASI dan terdaftar resmi di basis data Kemenkeu.\n\nTautan Verifikasi eLSa:\n${linkElsa}\n\nSalam hormat,\n*Admin Operasional Pusat KJPP NSR*`);
      const waUrl = `https://wa.me/${waNorm}?text=${waText}`;
      return jsonResponse({
        success: true,
        statusElsa: statusElsa,
        notification_id: "NOTIF-ELSA-" + Date.now(),
        wa_url: waUrl,
        message: "Verifikasi eLSa berhasil disimpan dan notifikasi telah disiapkan."
      });
    }

    return jsonResponse({ error: `Tindakan '${action}' tidak dikenali` }, 400);
  }

  return jsonResponse({ error: "Method not allowed" }, 405, { allow: "GET, POST" });
};

export const config = {
  path: "/api/nolap-data-proxy"
};

// Helper untuk reset database dummy saat pengujian otomatis
export function _resetDummyDatabase() {
  dummyDatabaseNoLap = [
    {
      noPermintaan: "REQ-DUMMY-001",
      timestamp: "2026-10-09 09:15:00",
      cabang: "Bandung",
      namaPemohon: "Staf Cabang Bandung (Dummy)",
      status: "NOMOR DITERBITKAN",
      nomorLaporan: "00531/2.0160-04/PI/07/00581/1/X/2026",
      namaKlien: "PT Rekanan Simulasi Mandiri (Dummy)"
    },
    {
      noPermintaan: "REQ-DUMMY-002",
      timestamp: "2026-10-09 11:30:00",
      cabang: "Padang",
      namaPemohon: "Staf Cabang Padang (Dummy)",
      status: "DIAJUKAN",
      nomorLaporan: "",
      namaKlien: "CV Andalas Cipta Sejahtera (Dummy)"
    },
    {
      noPermintaan: "REQ-DUMMY-003",
      timestamp: "2026-10-09 14:00:00",
      cabang: "Pusat",
      namaPemohon: "Staf Kantor Pusat (Dummy)",
      status: "DIAJUKAN",
      nomorLaporan: "",
      namaKlien: "PT Megah Konstruksi Indonesia (Dummy)"
    }
  ];
  try {
    nolapStore.delete(NOLAP_QUEUE_KEY).catch?.(() => {});
  } catch (e) {}
}
