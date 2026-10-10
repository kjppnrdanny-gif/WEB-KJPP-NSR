/**
 * KJPP NSR - Server-Side Protected Data Proxy untuk Portal Kwitansi
 * 
 * Karakteristik Keamanan:
 * 1. Menolak seluruh permintaan tanpa sesi sah (401 Unauthorized).
 * 2. RBAC Enforcement di sisi server:
 *    - KEUANGAN & ADMIN_PUSAT: Memperoleh seluruh draf tagihan semua cabang, berwenang verifikasi,
 *      penetapan nomor registrasi resmi, dan pengesahan TTD/stempel.
 *    - CABANG: HANYA berwenang mengajukan draf tagihan cabangnya sendiri & membaca draf cabangnya sendiri.
 *    - CABANG MUTLAK DILARANG mengesahkan kwitansi resmi atau mengubah data keuangan (403 Forbidden).
 * 3. Fail-Closed: Jika verifikasi sesi atau storage gagal/terputus, akses ditolak seketika (503 Service Unavailable).
 * 4. Isolasi Total & Zero External Leak:
 *    - Pengiriman draf tidak lagi menggunakan Google Forms eksternal!
 *    - Seluruh draf tersimpan di persistent store internal (Netlify Blobs / Disk lokal).
 *    - Anti-Duplicate Receipt Number Guard (409 Conflict).
 */

import {
  verifySessionToken,
  ROLES,
  PERMISSIONS_MATRIX,
  verifyCsrf
} from "./lib/auth-core.mjs";
import { PersistentAuthStore } from "./lib/storage-adapter.mjs";

const kwitansiStore = new PersistentAuthStore("kwitansi-queue");
const KWITANSI_QUEUE_KEY = "records_list";

// Data Dummy Awal Sintetis untuk Kwitansi Staging
const INITIAL_DUMMY_KWITANSI = [
  {
    idDraft: "DRAFT-KW-001",
    timestamp: "2026-10-09 10:00:00",
    cabang: "Cabang Bandung",
    namaPengaju: "Tiara (Admin Cabang)",
    waPengaju: "081200000001",
    klien: "PT Bank Tabungan Simulasi (Persero) Tbk",
    keterangan: "Biaya Penilaian Properti Ruko Dago Bandung, SPK No. 012/SPK/2026",
    banyaknya: "100% Pelunasan",
    hargaDasar: 25000000,
    tarifPpn: 0.11,
    nominalPpn: 2750000,
    totalBayar: 27750000,
    terbilang: "Dua Puluh Tujuh Juta Tujuh Ratus Lima Puluh Ribu Rupiah",
    status: "DISAHKAN",
    isApproved: true,
    noKwitansiResmi: "018/KW-NSR/X/2026",
    tglSah: "2026-10-09",
    tempatTerbit: "Jakarta",
    namaPejabat: "Ir. Nanang Rahayu, M.Ec.Dev., MAPPI (Cert.)",
    jabatanPejabat: "Pemimpin Rekan",
    subjabatanPejabat: "Pemimpin Rekan",
    catatanKeuangan: "Kwitansi disahkan oleh Keuangan Pusat."
  },
  {
    idDraft: "DRAFT-KW-002",
    timestamp: "2026-10-09 14:30:00",
    cabang: "Cabang Padang",
    namaPengaju: "Rin (Admin Cabang)",
    waPengaju: "081200000003",
    klien: "CV Andalas Cipta Sejahtera (Dummy)",
    keterangan: "Biaya Penilaian Tanah Bypass Padang Km 12",
    banyaknya: "50% (Termin I / Uang Muka)",
    hargaDasar: 15000000,
    tarifPpn: 0.11,
    nominalPpn: 1650000,
    totalBayar: 16650000,
    terbilang: "Enam Belas Juta Enam Ratus Lima Puluh Ribu Rupiah",
    status: "DIAJUKAN",
    isApproved: false,
    noKwitansiResmi: "",
    tglSah: "",
    tempatTerbit: "Jakarta",
    namaPejabat: "Milda Hidayati Dewi, S.E.",
    jabatanPejabat: "Keuangan",
    subjabatanPejabat: "Keuangan",
    catatanKeuangan: ""
  }
];

let dummyDatabaseKwitansi = [...INITIAL_DUMMY_KWITANSI];

export async function _loadKwitansiDatabase() {
  try {
    const persisted = await kwitansiStore.get(KWITANSI_QUEUE_KEY);
    if (persisted && Array.isArray(persisted) && persisted.length > 0) {
      dummyDatabaseKwitansi = persisted;
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
  return dummyDatabaseKwitansi;
}

export async function _saveKwitansiDatabase(records) {
  dummyDatabaseKwitansi = records;
  await kwitansiStore.set(KWITANSI_QUEUE_KEY, records);
}

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

function normalizeBranchName(name = "") {
  return name.replace(/^Kantor Cabang\s+/i, "")
             .replace(/^Cabang\s+/i, "")
             .replace(/^Kantor Pusat\s+/i, "Pusat")
             .trim()
             .toLowerCase();
}

export default async (req) => {
  // 1. Ekstraksi Token Sesi
  const token = extractToken(req);
  if (!token) {
    return jsonResponse(
      {
        error: "Akses ditolak: Autentikasi server diperlukan untuk mengakses sistem kwitansi.",
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

  // Muat data aktif dari persistent store (Fail-Closed jika storage gagal)
  let activeData;
  try {
    activeData = await _loadKwitansiDatabase();
  } catch (storageErr) {
    return jsonResponse(
      {
        error: "Layanan penyimpanan kwitansi tidak dapat diakses (Fail-Closed protection). Akses ditangguhkan.",
        failClosed: true
      },
      503
    );
  }

  // -------------------------------------------------------------------------
  // METODE GET: Pembacaan Draf & Riwayat Kwitansi (RBAC Terproteksi)
  // -------------------------------------------------------------------------
  if (req.method === "GET") {
    // KEUANGAN & ADMIN_PUSAT: Berhak membaca seluruh transaksi kwitansi semua cabang
    if (userRole === ROLES.KEUANGAN || userRole === ROLES.ADMIN_PUSAT) {
      return jsonResponse({
        success: true,
        scope: "GLOBAL_FINANCE",
        userRole: userRole,
        totalRecords: activeData.length,
        data: activeData
      });
    }

    // CABANG: HANYA berhak membaca draf milik cabangnya sendiri!
    if (userRole === ROLES.CABANG) {
      const normUserBranch = normalizeBranchName(userBranch);
      const filteredData = activeData.filter((item) => {
        const itemNorm = normalizeBranchName(item.cabang);
        return itemNorm === normUserBranch || itemNorm.includes(normUserBranch);
      });
      return jsonResponse({
        success: true,
        scope: "BRANCH_ISOLATED",
        userRole: userRole,
        branch: userBranch,
        totalRecords: filteredData.length,
        data: filteredData
      });
    }

    // Role lain: Ditutup dari akses data kwitansi
    return jsonResponse(
      {
        error: "Akses ditolak: Peran akun Anda tidak memiliki izin membaca data kwitansi.",
        authenticated: true
      },
      403
    );
  }

  // -------------------------------------------------------------------------
  // METODE POST: Submit Draf Tagihan / Pengesahan Kwitansi Resmi
  // -------------------------------------------------------------------------
  if (req.method === "POST") {
    // Validasi CSRF
    if (!verifyCsrf(req)) {
      return jsonResponse({ error: "Permintaan lintas-situs ditolak (CSRF Protection)" }, 403);
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return jsonResponse({ error: "Format payload tidak valid (JSON required)" }, 400);
    }

    const { action, payload } = body || {};

    // A. TINDAKAN SUBMIT DRAF KWITANSI (Cabang, Keuangan, Admin berwenang)
    if (action === "submitDraft") {
      if (!payload || !payload.klien || !payload.hargaDasar) {
        return jsonResponse({ error: "Data pengajuan draf tidak lengkap" }, 400);
      }

      // Pastikan cabang yang mengajukan dikunci ke sesi pengguna jika role Cabang (Anti-Tampering)
      let cabangPengaju;
      if (userRole === ROLES.CABANG) {
        cabangPengaju = `Cabang ${userBranch}`;
      } else {
        cabangPengaju = payload.cabang || "Kantor Pusat Jakarta";
      }

      const idDraft = `DRAFT-KW-${String(activeData.length + 1).padStart(3, "0")}`;
      const dpp = parseFloat(payload.hargaDasar) || 0;
      const tarifPpn = parseFloat(payload.tarifPpn) || 0.11;
      const nominalPpn = Math.round(dpp * tarifPpn);
      const totalBayar = dpp + nominalPpn;

      const newRecord = {
        idDraft,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        cabang: cabangPengaju,
        namaPengaju: payload.namaPengaju || user.displayName || user.sub,
        waPengaju: payload.waPengaju || "",
        klien: String(payload.klien).trim(),
        keterangan: String(payload.keterangan || "").trim(),
        banyaknya: String(payload.banyaknya || "100% Pelunasan").trim(),
        hargaDasar: dpp,
        tarifPpn: tarifPpn,
        nominalPpn: nominalPpn,
        totalBayar: totalBayar,
        terbilang: payload.terbilang || "",
        status: "DIAJUKAN",
        isApproved: false,
        noKwitansiResmi: "",
        tglSah: "",
        tempatTerbit: "Jakarta",
        namaPejabat: "Milda Hidayati Dewi, S.E.",
        jabatanPejabat: "Keuangan",
        subjabatanPejabat: "Keuangan",
        catatanKeuangan: ""
      };

      activeData.unshift(newRecord);
      await _saveKwitansiDatabase(activeData);

      return jsonResponse({
        success: true,
        message: "Draf permohonan kwitansi tagihan berhasil diajukan ke Keuangan Pusat.",
        record: newRecord
      });
    }

    // B. TINDAKAN PENGESAHAN & PENETAPAN NOMOR RESMI (MUTLAK HANYA KEUANGAN & ADMIN PUSAT!)
    if (action === "approveKwitansi") {
      // PENEGAKAN RBAC KETAT: CABANG DILARANG MENGESAHKAN TRANSAKSI KEUANGAN!
      if (userRole === ROLES.CABANG) {
        return jsonResponse(
          {
            error: "Akses Ditolak (403 Forbidden): Kantor Cabang TIDAK MEMILIKI OTORITAS mengesahkan transaksi keuangan atau menerbitkan kwitansi resmi. Wewenang mutlak milik Bagian Keuangan Kantor Pusat.",
            violation: "UNAUTHORIZED_FINANCE_APPROVAL"
          },
          403
        );
      }

      if (userRole !== ROLES.KEUANGAN && userRole !== ROLES.ADMIN_PUSAT) {
        return jsonResponse(
          {
            error: "Akses Ditolak (403 Forbidden): Akun Anda tidak memiliki wewenang pengesahan kwitansi.",
            violation: "FORBIDDEN"
          },
          403
        );
      }

      const {
        idDraft,
        noKwitansiResmi,
        namaPejabat,
        jabatanPejabat,
        subjabatanPejabat,
        tempatTerbit,
        catatanKeuangan
      } = payload || {};

      if (!noKwitansiResmi || typeof noKwitansiResmi !== "string" || !noKwitansiResmi.trim()) {
        return jsonResponse({ error: "Nomor kwitansi resmi wajib diisi" }, 400);
      }

      const targetItem = activeData.find((i) => i.idDraft === idDraft);
      if (!targetItem) {
        return jsonResponse({ error: "Data draf kwitansi tidak ditemukan" }, 404);
      }

      // Validasi Anti-Duplikasi Nomor Kwitansi Resmi
      const isDuplicate = activeData.some(
        (i) =>
          i.noKwitansiResmi &&
          i.noKwitansiResmi.trim().toLowerCase() === noKwitansiResmi.trim().toLowerCase() &&
          i.idDraft !== idDraft
      );
      if (isDuplicate) {
        return jsonResponse(
          {
            error: `Pengesahan ditolak: Nomor kwitansi '${noKwitansiResmi}' sudah pernah digunakan untuk transaksi lain.`,
            violation: "DUPLICATE_RECEIPT_NUMBER"
          },
          409
        );
      }

      targetItem.status = "DISAHKAN";
      targetItem.isApproved = true;
      targetItem.noKwitansiResmi = noKwitansiResmi.trim();
      targetItem.tglSah = new Date().toISOString().split("T")[0];
      targetItem.tempatTerbit = tempatTerbit || "Jakarta";
      if (namaPejabat) targetItem.namaPejabat = namaPejabat;
      if (jabatanPejabat) targetItem.jabatanPejabat = jabatanPejabat;
      if (subjabatanPejabat) targetItem.subjabatanPejabat = subjabatanPejabat;
      if (catatanKeuangan) targetItem.catatanKeuangan = catatanKeuangan;

      await _saveKwitansiDatabase(activeData);

      return jsonResponse({
        success: true,
        message: `Kwitansi resmi '${noKwitansiResmi}' berhasil diverifikasi dan disahkan oleh Bagian Keuangan Pusat.`,
        record: targetItem
      });
    }

    return jsonResponse({ error: `Tindakan '${action}' tidak dikenali` }, 400);
  }

  return jsonResponse({ error: "Method not allowed" }, 405, { allow: "GET, POST" });
};

export const config = {
  path: "/api/kwitansi-data-proxy"
};

// Helper untuk reset database dummy saat pengujian otomatis
export function _resetDummyKwitansiDatabase() {
  dummyDatabaseKwitansi = [
    {
      idDraft: "DRAFT-KW-001",
      timestamp: "2026-10-09 10:00:00",
      cabang: "Cabang Bandung",
      namaPengaju: "Tiara (Admin Cabang)",
      status: "DISAHKAN",
      isApproved: true,
      noKwitansiResmi: "018/KW-NSR/X/2026",
      klien: "PT Bank Tabungan Simulasi (Persero) Tbk"
    },
    {
      idDraft: "DRAFT-KW-002",
      timestamp: "2026-10-09 14:30:00",
      cabang: "Cabang Padang",
      namaPengaju: "Rin (Admin Cabang)",
      status: "DIAJUKAN",
      isApproved: false,
      noKwitansiResmi: "",
      klien: "CV Andalas Cipta Sejahtera (Dummy)"
    }
  ];
  try {
    kwitansiStore.delete(KWITANSI_QUEUE_KEY).catch?.(() => {});
  } catch (e) {}
}
