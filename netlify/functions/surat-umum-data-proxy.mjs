/**
 * KJPP NSR - Server-Side Protected Data Proxy untuk Portal Surat Umum (SU)
 * Versi 1.0 (Netlify Serverless Adapter): Concurrency-Safe, Strict Head-Office RBAC,
 * Anti-Duplikasi Nomor Resmi (HTTP 409 Conflict) & Idempotency Support.
 */

import {
  verifySessionToken,
  ROLES,
  PERMISSIONS_MATRIX
} from "./lib/auth-core.mjs";
import { PersistentAuthStore } from "./lib/storage-adapter.mjs";

const suratUmumStore = new PersistentAuthStore("surat-umum-queue");
const SURAT_UMUM_KEY = "records_list";

// Data Dummy Awal Resmi Surat Umum (2026)
const INITIAL_DUMMY_SURAT_UMUM = [
  {
    Timestamp: '2026-10-10T08:30:00.000Z',
    No_Urut: 15,
    No_Surat: '0015/NSR/SU-REG/X/2026',
    Tanggal_Surat: '2026-10-10',
    Tujuan_Penerima: 'Pusat Pembinaan Profesi Keuangan (PPPK) Kemenkeu RI',
    Perihal: 'Laporan Triwulan Realisasi Kantor Cabang & Personil Penilai',
    Klasifikasi_Perihal: 'SU-REG',
    Penandatangan: 'Pemimpin Rekan',
    Link_Arsip_Final: 'https://drive.google.com/file/d/demo_final_0015/view',
    Link_File_Mentah: 'https://drive.google.com/file/d/demo_draf_0015/view',
    File_ID_Final: 'demo_final_0015',
    File_ID_Mentah: 'demo_draf_0015',
    Status_Arsip: 'Lengkap'
  },
  {
    Timestamp: '2026-10-06T10:15:00.000Z',
    No_Urut: 14,
    No_Surat: '0014/NSR/SU-KET/X/2026',
    Tanggal_Surat: '2026-10-06',
    Tujuan_Penerima: 'PT Bank Mandiri (Persero) Tbk - Kantor Pusat',
    Perihal: 'Surat Keterangan Pembaruan Izin Cabang & Sertifikasi Penilai Publik',
    Klasifikasi_Perihal: 'SU-KET',
    Penandatangan: 'Manager Legal & Admin',
    Link_Arsip_Final: 'https://drive.google.com/file/d/demo_final_0014/view',
    Link_File_Mentah: '',
    File_ID_Final: 'demo_final_0014',
    File_ID_Mentah: '',
    Status_Arsip: 'Hanya Scan'
  },
  {
    Timestamp: '2026-09-28T14:20:00.000Z',
    No_Urut: 13,
    No_Surat: '0013/NSR/SU-MAP/IX/2026',
    Tanggal_Surat: '2026-09-28',
    Tujuan_Penerima: 'Masyarakat Profesi Penilai Indonesia (MAPPI) DPD DKI Jakarta',
    Perihal: 'Pengiriman Delegasi Pelatihan Standar Penilaian Indonesia SPI 103',
    Klasifikasi_Perihal: 'SU-MAP',
    Penandatangan: 'Pemimpin Rekan',
    Link_Arsip_Final: '',
    Link_File_Mentah: 'https://drive.google.com/file/d/demo_draf_0013/view',
    File_ID_Final: '',
    File_ID_Mentah: 'demo_draf_0013',
    Status_Arsip: 'Hanya Draf'
  }
];

let dummyDatabaseSuratUmum = [...INITIAL_DUMMY_SURAT_UMUM];

export async function _loadSuratUmumDatabase() {
  try {
    const persisted = await suratUmumStore.get(SURAT_UMUM_KEY);
    if (persisted && Array.isArray(persisted) && persisted.length > 0) {
      dummyDatabaseSuratUmum = persisted;
      return dummyDatabaseSuratUmum;
    }
  } catch (err) {
    if (err.message && err.message.includes("STORAGE_SIMULATED_FAILURE")) {
      throw err;
    }
  }
  return dummyDatabaseSuratUmum;
}

export async function _saveSuratUmumDatabase(records) {
  dummyDatabaseSuratUmum = records;
  await suratUmumStore.set(SURAT_UMUM_KEY, records);
}

export function _resetSuratUmumDatabase(initial = INITIAL_DUMMY_SURAT_UMUM) {
  dummyDatabaseSuratUmum = [...initial];
  return suratUmumStore.set(SURAT_UMUM_KEY, dummyDatabaseSuratUmum);
}

function extractSeq(val) {
  if (!val) return 0;
  const s = String(val).trim();
  if (s.indexOf('/') !== -1) {
    const seg = s.split('/')[0].replace(/\D/g, '');
    const n = parseInt(seg, 10);
    return (!isNaN(n) && n < 100000) ? n : 0;
  }
  const n = parseInt(s.replace(/\D/g, ''), 10);
  return (!isNaN(n) && n < 100000) ? n : 0;
}

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-NSR-Token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // 1. Validasi Autentikasi Fail-Closed
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const customHeader = event.headers["x-nsr-token"] || event.headers["X-NSR-Token"] || "";
  const rawToken = authHeader.replace(/^Bearer\s+/i, "").trim() || customHeader.trim();

  let authSession = null;
  if (rawToken) {
    authSession = await verifySessionToken(rawToken);
  }

  if (!authSession || !authSession.valid) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Otorisasi Gagal (401 Unauthorized): Sesi telah kedaluwarsa atau token tidak valid.",
        violation: "UNAUTHORIZED_ACCESS"
      })
    };
  }

  // 2. Enforce Head Office Exclusive Lockdown
  const user = authSession.payload || authSession;
  const isCabang = user.isCabang === true || user.role === ROLES.CABANG || user.role === "ADMIN_CABANG" || (user.branch && String(user.branch).toLowerCase() !== "pusat");
  const isPusat = Boolean(user.isSuperAdmin || user.role === ROLES.ADMIN_PUSAT || user.role === "SUPER_ADMIN" || (user.branch && String(user.branch).toLowerCase() === "pusat")) && !isCabang;

  if (!isPusat) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Akses Ditolak (403 Forbidden): Modul Buku Agenda Surat Umum (SU) merupakan wewenang eksklusif Kantor Pusat (Jakarta) dan tidak dapat diakses oleh Kantor Cabang.",
        violation: "BRANCH_ACCESS_DENIED"
      })
    };
  }

  try {
    let records = await _loadSuratUmumDatabase();

    // -------------------------------------------------------------
    // GET: Ambil Daftar Surat Umum untuk Kantor Pusat
    // -------------------------------------------------------------
    if (event.httpMethod === "GET") {
      const targetYear = parseInt(event.queryStringParameters?.target_year || "2026", 10);
      let maxSeq = 0;
      for (const item of records) {
        const seq = parseInt(item.No_Urut, 10) || extractSeq(item.No_Surat);
        const itemYear = item.Tanggal_Surat ? new Date(item.Tanggal_Surat).getFullYear() : targetYear;
        if (itemYear === targetYear && seq > maxSeq && seq < 50000) {
          maxSeq = seq;
        }
      }

      const sorted = [...records].sort((a, b) => {
        const seqA = parseInt(a.No_Urut, 10) || extractSeq(a.No_Surat);
        const seqB = parseInt(b.No_Urut, 10) || extractSeq(b.No_Surat);
        return seqB - seqA;
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          status: "success",
          scope: "HEAD_OFFICE_EXCLUSIVE",
          year: targetYear,
          maxSeq: Math.max(maxSeq, 15),
          totalRecords: sorted.length,
          data: sorted
        })
      };
    }

    // -------------------------------------------------------------
    // POST: Registrasi Nomor & Upload File Arsip
    // -------------------------------------------------------------
    if (event.httpMethod === "POST") {
      let bodyData = {};
      try {
        bodyData = JSON.parse(event.body || "{}");
      } catch (parseErr) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: "Format payload tidak valid (JSON required)" })
        };
      }

      const action = bodyData.action;

      if (action === "bacaDaftarSurat" || action === "GET_SURAT_UMUM_LIST") {
        const sorted = [...records].sort((a, b) => {
          const seqA = parseInt(a.No_Urut, 10) || extractSeq(a.No_Surat);
          const seqB = parseInt(b.No_Urut, 10) || extractSeq(b.No_Surat);
          return seqB - seqA;
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            status: "success",
            scope: "HEAD_OFFICE_EXCLUSIVE",
            totalRecords: sorted.length,
            data: sorted
          })
        };
      }

      if (action === "CREATE_SURAT_UMUM" || action === "buatSuratUmum") {
        const data = bodyData.data || bodyData;
        let noSurat = String(data.No_Surat || data.no_surat || data.nomorSurat || "").trim();
        const tujuan = String(data.Tujuan_Penerima || data.tujuan_penerima || data.tujuanPenerima || "").trim();
        const perihal = String(data.Perihal || data.perihal || "").trim();
        const tanggal = String(data.Tanggal_Surat || data.tanggal_surat || data.tanggalSurat || new Date().toISOString().split("T")[0]).trim();
        const klasifikasi = String(data.Klasifikasi_Perihal || data.klasifikasi_perihal || data.klasifikasiPerihal || "SU-KET").trim();
        const penandatangan = String(data.Penandatangan || data.penandatangan || "Pemimpin Rekan").trim();

        if (!noSurat) {
          let maxSeq = 0;
          for (const item of records) {
            const seq = parseInt(item.No_Urut, 10) || extractSeq(item.No_Surat);
            if (seq > maxSeq && seq < 50000) maxSeq = seq;
          }
          const nextSeq = Math.max(maxSeq + 1, 16);
          const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
          const now = new Date();
          const romanMonth = romanMonths[now.getMonth()];
          const year = now.getFullYear();
          noSurat = `${String(nextSeq).padStart(4, "0")}/NSR/${klasifikasi}/${romanMonth}/${year}`;
        }

        if (!noSurat || !tujuan || !perihal) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: "Nomor Surat, Tujuan Penerima, dan Perihal wajib diisi lengkap."
            })
          };
        }

        const inputSeq = extractSeq(noSurat);

        // Anti-Duplikasi & Idempotency Check
        for (const item of records) {
          const existNo = String(item.No_Surat || "").trim();
          const existSeq = parseInt(item.No_Urut, 10) || extractSeq(existNo);

          if (existNo.toUpperCase() === noSurat.toUpperCase()) {
            // Idempotency: Jika data sama, kembalikan 200 OK
            if (
              String(item.Perihal || "").trim().toLowerCase() === perihal.toLowerCase() &&
              String(item.Tujuan_Penerima || "").trim().toLowerCase() === tujuan.toLowerCase()
            ) {
              return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                  success: true,
                  idempotent: true,
                  message: `Surat umum nomor ${noSurat} sudah tersimpan sebelumnya (Idempotent).`,
                  record: item
                })
              };
            }

            // Tolak nomor ganda
            return {
              statusCode: 409,
              headers,
              body: JSON.stringify({
                success: false,
                code: "DUPLICATE_NUMBER",
                error: `Nomor surat ${noSurat} sudah terdaftar di Buku Agenda untuk perihal: "${item.Perihal || "-"}".`,
                conflict: item
              })
            };
          }

          if (inputSeq > 0 && existSeq === inputSeq) {
            return {
              statusCode: 409,
              headers,
              body: JSON.stringify({
                success: false,
                code: "DUPLICATE_SEQUENCE",
                error: `Nomor urut #${inputSeq} sudah digunakan oleh surat ${existNo} untuk perihal: "${item.Perihal || "-"}".`,
                conflict: item
              })
            };
          }
        }

        const newRecord = {
          Timestamp: new Date().toISOString(),
          No_Urut: inputSeq > 0 ? inputSeq : (records.length + 1),
          No_Surat: noSurat,
          Tanggal_Surat: tanggal,
          Tujuan_Penerima: tujuan,
          Perihal: perihal,
          Klasifikasi_Perihal: klasifikasi,
          Penandatangan: penandatangan,
          Link_Arsip_Final: "",
          Link_File_Mentah: "",
          File_ID_Final: "",
          File_ID_Mentah: "",
          Status_Arsip: "Kosong"
        };

        records.unshift(newRecord);
        await _saveSuratUmumDatabase(records);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            status: "success",
            noSurat: noSurat,
            message: `Nomor surat ${noSurat} berhasil diregistrasi di Buku Agenda Resmi Kantor Pusat.`,
            record: newRecord
          })
        };
      }

      if (action === "UPLOAD_ARSIP_SURAT_UMUM") {
        const noSurat = String(bodyData.no_surat || "").trim();
        const tipeSlot = String(bodyData.tipe_slot || "FINAL").toUpperCase().trim();

        if (!noSurat) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, error: "Nomor surat target wajib disertakan." })
          };
        }

        const found = records.find(r => String(r.No_Surat || "").toUpperCase() === noSurat.toUpperCase());
        if (!found) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ success: false, error: `Surat umum nomor ${noSurat} tidak ditemukan.` })
          };
        }

        const fileId = "drive_" + Date.now();
        const fileUrl = bodyData.file_url || `https://drive.google.com/file/d/${fileId}/view`;

        if (tipeSlot === "FINAL") {
          found.Link_Arsip_Final = fileUrl;
          found.File_ID_Final = fileId;
        } else {
          found.Link_File_Mentah = fileUrl;
          found.File_ID_Mentah = fileId;
        }

        const hasFinal = Boolean(found.Link_Arsip_Final);
        const hasMentah = Boolean(found.Link_File_Mentah);
        found.Status_Arsip = (hasFinal && hasMentah) ? "Lengkap" : (hasFinal ? "Hanya Scan" : (hasMentah ? "Hanya Draf" : "Kosong"));

        await _saveSuratUmumDatabase(records);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            status: "success",
            file_id: fileId,
            file_url: fileUrl,
            status_arsip: found.Status_Arsip,
            record: found
          })
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: `Aksi '${action}' tidak dikenal.` })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: "Method Not Allowed" })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message || "Internal Server Error" })
    };
  }
};
