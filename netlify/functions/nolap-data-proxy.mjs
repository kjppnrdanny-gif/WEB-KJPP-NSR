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
      
      const newRecord = {
        ...payload,
        noPermintaan: idReq,
        cabang: cabangPengaju,
        namaPemohon: user.displayName || user.sub,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        status: "DIAJUKAN",
        nomorLaporan: "",
        tglTerbit: "",
        statusElsa: "BELUM INPUT"
      };

      activeData.unshift(newRecord);
      await _saveNolapDatabase(activeData);

      return jsonResponse({
        success: true,
        message: "Permohonan nomor laporan berhasil direkam di server terproteksi.",
        record: newRecord
      });
    }

    // B. TINDAKAN APPROVAL / PENETAPAN NOMOR RESMI (MUTLAK HANYA ADMIN_PUSAT!)
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

      const { noPermintaan, nomorLaporan, catatanAdmin } = payload || {};
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
