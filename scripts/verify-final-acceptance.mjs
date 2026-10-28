import https from "node:https";
import crypto from "node:crypto";

const BASE_URL = "https://kjppnanangrahayu.com";
const OLD_REVOKED_TOKEN = "JKT#00";
const NEW_ROTATED_TOKEN = "NSR-HQ-PROD-2026-X89K2M";

function postJson(path, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = JSON.stringify(payload);
    const req = https.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
        ...headers
      }
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, data: null });
        }
      });
    });
    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

function getJson(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = https.request(url, {
      method: "GET",
      headers
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body, data: null });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  console.log("================================================================================");
  console.log("🚀 MEMULAI SUITE VERIFIKASI AKHIR PENERIMAAN (FINAL ACCEPTANCE CHECK) LIVE CPANEL");
  console.log("================================================================================\n");

  const results = {};

  // ---------------------------------------------------------------------------
  // UJI 1: PENOLAKAN KREDENSIAL LAMA YANG TELAH DICABUT (REVOKED TOKEN CHECK)
  // ---------------------------------------------------------------------------
  console.log("🔒 1. Menguji Pencabutan Token Lama (Revoked Token Gate)...");
  
  // 1a. Ke nolap-data-handler.php
  const resOldNolap = await getJson("/nolap-data-handler.php", { "X-NSR-Token": OLD_REVOKED_TOKEN });
  console.log(`   - nolap-data-handler.php dg token lama -> HTTP ${resOldNolap.status}`);
  if (resOldNolap.status === 401) {
    console.log("     ✓ LULUS: Akses ditolak dengan HTTP 401 Unauthorized.");
    results.revokedNolap = true;
  } else {
    console.error("     ✗ GAGAL: Diharapkan HTTP 401, didapat:", resOldNolap.status);
    results.revokedNolap = false;
  }

  // 1b. Ke auth-handler.php token gate
  const resOldAuth = await postJson("/auth-handler.php?action=token", { token: OLD_REVOKED_TOKEN });
  console.log(`   - auth-handler.php dg token lama -> HTTP ${resOldAuth.status}`);
  if (resOldAuth.status === 401) {
    console.log("     ✓ LULUS: Akses ditolak dengan HTTP 401 Unauthorized.");
    results.revokedAuth = true;
  } else {
    console.error("     ✗ GAGAL: Diharapkan HTTP 401, didapat:", resOldAuth.status);
    results.revokedAuth = false;
  }

  // ---------------------------------------------------------------------------
  // UJI 2: OTORISASI TOKEN BARU TEROTASI (ROTATED SECURE TOKEN)
  // ---------------------------------------------------------------------------
  console.log("\n🔑 2. Menguji Otorisasi Token Baru Terotasi...");
  const resNewNolap = await getJson("/nolap-data-handler.php", { "X-NSR-Token": NEW_ROTATED_TOKEN });
  console.log(`   - nolap-data-handler.php dg token baru -> HTTP ${resNewNolap.status}`);
  if (resNewNolap.status === 200 && resNewNolap.data?.userRole === "ADMIN_PUSAT") {
    console.log(`     ✓ LULUS: Berhasil terautentikasi sebagai ${resNewNolap.data.userRole} (Scope: ${resNewNolap.data.scope}, Total Records: ${resNewNolap.data.totalRecords}).`);
    results.rotatedToken = true;
  } else {
    console.error("     ✗ GAGAL autentikasi token baru:", resNewNolap);
    results.rotatedToken = false;
  }

  // ---------------------------------------------------------------------------
  // UJI 3: SKENARIO A — IDEMPOTENCY KEY RETRY PROTEKSI
  // ---------------------------------------------------------------------------
  console.log("\n🔁 3. Menguji Skenario A: Retry Pengajuan dengan UUID yang Sama...");
  const uuidA = crypto.randomUUID();
  const testPayloadA = {
    action: "submitRequest",
    payload: {
      idempotencyKey: uuidA,
      cabang: "Pusat",
      namaPemohon: "QA Acceptance Tester",
      jabatanPemohon: "QA Engineer",
      emailPemohon: "qa@kjppnanangrahayu.com",
      waPemohon: "081299999999",
      namaKlien: "PT ACCEPTANCE IDEMPOTENCY TEST PERSERO",
      statusKlien: "BUMN",
      alamatKlien: "Jl. MH Thamrin No. 1, Jakarta",
      kontakKlien: "0812345678",
      npwp: "01.234.567.8-012.000",
      kodeNpwp: "1",
      penggunaLaporan: "Bank Mandiri",
      klasifikasiJasa: "PI",
      kodeIndustri: "07",
      tujuanPenilaian: "Penjaminan Utang",
      jenisObjek: "Gedung Kantor",
      lokasiObjek: "Jakarta Pusat",
      deadline: "2026-11-01",
      penilai: "Ir. Nanang Rahayu Junaedi, M.Sc., MAPPI (Cert.)",
      izinPenilai: "00581",
      noSpk: "SPK/ACCEPT-QA/2026/001",
      tglSpk: "2026-10-12",
      tglPenilaian: "2026-10-12",
      dasarNilai: "Nilai Pasar",
      pendekatan: "Biaya",
      bentukLaporan: "Full Form",
      kesimpulanNilai: "25500100000",
      dpp: 25500100,
      nominalPpn: 2805011,
      totalBayar: 28305111,
      terbilang: "Dua Puluh Delapan Juta Tiga Ratus Lima Ribu Seratus Sebelas Rupiah",
      luasTanah: "1000",
      luasBangunan: "2500"
    }
  };

  // Submit Pertama Skenario A
  const submitA1 = await postJson("/nolap-data-handler.php", testPayloadA, { "X-NSR-Token": NEW_ROTATED_TOKEN });
  console.log(`   - Submit A-1 (UUID: ${uuidA}) -> HTTP ${submitA1.status}, NoReq: ${submitA1.data?.noPermintaan}`);
  const reqNumA = submitA1.data?.noPermintaan;

  if (submitA1.status === 200 && reqNumA) {
    // Retry Kedua dengan UUID yang sama persis
    const submitA2 = await postJson("/nolap-data-handler.php", testPayloadA, { "X-NSR-Token": NEW_ROTATED_TOKEN });
    console.log(`   - Submit A-2 RETRY (UUID sama: ${uuidA}) -> HTTP ${submitA2.status}, Duplicate: ${submitA2.data?.duplicate}, Idempotent: ${submitA2.data?.idempotent}, Returned NoReq: ${submitA2.data?.noPermintaan}`);
    
    if (submitA2.status === 200 && submitA2.data?.idempotent === true && submitA2.data?.noPermintaan === reqNumA) {
      console.log(`     ✓ LULUS Skenario A: Request retry mengembalikan record yang sama (${reqNumA}) secara atomik tanpa menduplikasi basis data!`);
      results.skenarioA = true;
    } else {
      console.error("     ✗ GAGAL Skenario A: Retry tidak mengembalikan nomor permohonan yang sama!", submitA2);
      results.skenarioA = false;
    }
  } else {
    console.error("     ✗ GAGAL Submit A-1:", submitA1);
    results.skenarioA = false;
  }

  // ---------------------------------------------------------------------------
  // UJI 4: SKENARIO B — DUA PENGAJUAN SAH IDENTIK DENGAN UUID BERBEDA
  // ---------------------------------------------------------------------------
  console.log("\n🆕 4. Menguji Skenario B: Dua Pengajuan Sah Berbeda dengan Data Isian Identik...");
  const uuidB = crypto.randomUUID();
  const testPayloadB = {
    action: "submitRequest",
    payload: {
      ...testPayloadA.payload,
      idempotencyKey: uuidB // UUID Berbeda untuk transaksi kedua yang sah
    }
  };

  const submitB = await postJson("/nolap-data-handler.php", testPayloadB, { "X-NSR-Token": NEW_ROTATED_TOKEN });
  console.log(`   - Submit B (UUID Baru: ${uuidB}, Isian Identik) -> HTTP ${submitB.status}, NoReq: ${submitB.data?.noPermintaan}`);
  const reqNumB = submitB.data?.noPermintaan;

  if (submitB.status === 200 && reqNumB && reqNumB !== reqNumA) {
    console.log(`     ✓ LULUS Skenario B: Pengajuan sah baru berhasil diterbitkan nomor urut terpisah (${reqNumB} != ${reqNumA}) tanpa diblokir oleh heuristik duplikasi!`);
    results.skenarioB = true;
  } else {
    console.error("     ✗ GAGAL Skenario B:", submitB);
    results.skenarioB = false;
  }

  // ---------------------------------------------------------------------------
  // UJI 5: PENANGANAN RECORD VOID REQ-000015 & PROTEKSI DARI APPROVAL/MUTASI
  // ---------------------------------------------------------------------------
  console.log("\n🛡️ 5. Memeriksa Integritas Record VOID (REQ-000015) & Proteksi Immutability...");
  const dbCheck = await getJson("/nolap-data-handler.php", { "X-NSR-Token": NEW_ROTATED_TOKEN });
  const allRecords = dbCheck.data?.data || [];
  const rec15 = allRecords.find(r => r.noPermintaan === "REQ-000015");

  if (rec15) {
    console.log(`   - Status REQ-000015: '${rec15.status}', isTestRecord: ${rec15.isTestRecord}`);
    const isStatusVoid = (rec15.status === "VOID" && rec15.isTestRecord === true);
    
    // Uji proteksi: Coba approve REQ-000015 -> Wajib ditolak HTTP 400
    const tryApproveVoid = await postJson("/nolap-data-handler.php", {
      action: "approveRequest",
      payload: {
        noPermintaan: "REQ-000015",
        nomorLaporan: "09999/2.0160-00/PI/07/00581/1/X/2026"
      }
    }, { "X-NSR-Token": NEW_ROTATED_TOKEN });

    console.log(`   - Upaya approval pada record VOID REQ-000015 -> HTTP ${tryApproveVoid.status}, Error: ${tryApproveVoid.data?.error}`);

    // Uji proteksi: Coba mutasi mitigasi pada REQ-000015 -> Wajib ditolak HTTP 400
    const tryMutateVoid = await postJson("/nolap-data-handler.php", {
      action: "saveMitigasi",
      payload: {
        noPermintaan: "REQ-000015",
        tipeMitigasi: "tanah",
        mitigasiData: { secA: { namaProyek: "Uji Ilegal Mutasi Void" } }
      }
    }, { "X-NSR-Token": NEW_ROTATED_TOKEN });

    console.log(`   - Upaya simpan mitigasi pada record VOID REQ-000015 -> HTTP ${tryMutateVoid.status}, Error: ${tryMutateVoid.data?.error}`);

    if (isStatusVoid && tryApproveVoid.status === 400 && tryMutateVoid.status === 400) {
      console.log("     ✓ LULUS: REQ-000015 tetap berstatus VOID dan kebal dari approval maupun mutasi!");
      results.req15VoidProtected = true;
    } else {
      console.error("     ✗ GAGAL proteksi VOID pada REQ-000015!");
      results.req15VoidProtected = false;
    }
  } else {
    console.error("     ✗ GAGAL: REQ-000015 tidak ditemukan di database!");
    results.req15VoidProtected = false;
  }

  // ---------------------------------------------------------------------------
  // UJI 6: BERSIHKAN / VOID RECORD UJI DARI SKENARIO A & B
  // ---------------------------------------------------------------------------
  console.log("\n🧹 6. Mengarsipkan Record Uji Skenario A & B ke Status VOID...");
  if (reqNumA) {
    const vA = await postJson("/nolap-data-handler.php", {
      action: "voidRequest",
      payload: {
        noPermintaan: reqNumA,
        reason: "Penandaan VOID Data Uji QA Skenario A Idempotency"
      }
    }, { "X-NSR-Token": NEW_ROTATED_TOKEN });
    console.log(`   - VOID ${reqNumA}: HTTP ${vA.status}, Message: ${vA.data?.message}`);
  }

  if (reqNumB) {
    const vB = await postJson("/nolap-data-handler.php", {
      action: "voidRequest",
      payload: {
        noPermintaan: reqNumB,
        reason: "Penandaan VOID Data Uji QA Skenario B Idempotency"
      }
    }, { "X-NSR-Token": NEW_ROTATED_TOKEN });
    console.log(`   - VOID ${reqNumB}: HTTP ${vB.status}, Message: ${vB.data?.message}`);
  }

  // ---------------------------------------------------------------------------
  // UJI 7: AUDIT PENUGASAN OPERASIONAL RIIL
  // ---------------------------------------------------------------------------
  console.log("\n📋 7. Memeriksa Integritas Penugasan Operasional Riil...");
  const finalDbCheck = await getJson("/nolap-data-handler.php", { "X-NSR-Token": NEW_ROTATED_TOKEN });
  const finalRecords = finalDbCheck.data?.data || [];
  
  const realRecords = ["REQ-000006", "REQ-000007", "REQ-000011", "REQ-000012", "REQ-000014"];
  let allRealIntact = true;
  for (const rId of realRecords) {
    const found = finalRecords.find(r => r.noPermintaan === rId);
    if (found) {
      console.log(`   - ${rId} [${found.cabang}]: ${found.namaKlien} | Status: ${found.status} | NoLap: ${found.nomorLaporan || '-'}`);
    } else {
      console.error(`   ✗ PERINGATAN: ${rId} tidak ditemukan!`);
      allRealIntact = false;
    }
  }
  results.realRecordsIntact = allRealIntact;

  console.log("\n================================================================================");
  console.log("📊 RINGKASAN HASIL VERIFIKASI AKHIR:");
  console.log("================================================================================");
  for (const [k, v] of Object.entries(results)) {
    console.log(`- ${k.padEnd(25)}: ${v ? "✅ LULUS (PASS)" : "❌ GAGAL (FAIL)"}`);
  }

  const allPassed = Object.values(results).every(Boolean);
  console.log("\nSTATUS FINAL:", allPassed ? "🎉 SEMUA PENGUJIAN LULUS DENGAN SEMPURNA" : "⚠️ ADA PENGUJIAN YANG GAGAL");
}

run().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
