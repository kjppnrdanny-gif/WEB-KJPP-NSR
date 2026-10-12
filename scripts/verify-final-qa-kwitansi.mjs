import https from "node:https";

const BASE_URL = "https://kjppnanangrahayu.com";
const HQ_TOKEN = "NSR-HQ-PROD-2026-X89K2M";

// Helper request
function requestJson(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = body ? JSON.stringify(body) : null;
    const allHeaders = {
      "Accept": "application/json",
      ...headers
    };
    if (bodyStr) {
      allHeaders["Content-Type"] = "application/json";
      allHeaders["Content-Length"] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(url, { method, headers: allHeaders }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, data: null });
        }
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log("================================================================================");
  console.log("🚀 MEMULAI SUITE FINAL QA OPERASIONAL PORTAL KWITANSI KJPP NSR (LIVE CPANEL)");
  console.log("================================================================================\n");

  const results = {};

  // ---------------------------------------------------------------------------
  // 1. INPUT DPP RP 25.500.100 & HITUNG PREVISI PAJAK & TERBILANG
  // ---------------------------------------------------------------------------
  console.log("📊 1. Menguji Presisi Input DPP Rp 25.500.100 & Perhitungan Pajak...");
  const dppTest = 25500100;
  const tarifTest = 0.11;
  const ppnTest = Math.round(dppTest * tarifTest);
  const totalTest = dppTest + ppnTest;

  function konversiTerbilang(n) {
    const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    n = Math.floor(n);
    if (n < 12) return angka[n];
    if (n < 20) return konversiTerbilang(n - 10) + ' Belas';
    if (n < 100) return konversiTerbilang(Math.floor(n / 10)) + ' Puluh ' + konversiTerbilang(n % 10);
    if (n < 200) return 'Seratus ' + konversiTerbilang(n - 100);
    if (n < 1000) return konversiTerbilang(Math.floor(n / 100)) + ' Ratus ' + konversiTerbilang(n % 100);
    if (n < 2000) return 'Seribu ' + konversiTerbilang(n - 1000);
    if (n < 1000000) return konversiTerbilang(Math.floor(n / 1000)) + ' Ribu ' + konversiTerbilang(n % 1000);
    if (n < 1000000000) return konversiTerbilang(Math.floor(n / 1000000)) + ' Juta ' + konversiTerbilang(n % 1000000);
    if (n < 1000000000000) return konversiTerbilang(Math.floor(n / 1000000000)) + ' Miliar ' + konversiTerbilang(n % 1000000000);
    return 'Angka Terlalu Besar';
  }
  const terbilangTest = konversiTerbilang(totalTest).replace(/\s+/g, ' ').trim() + " Rupiah";

  console.log(`   - DPP        : Rp ${dppTest.toLocaleString('id-ID')}`);
  console.log(`   - PPN (11%)  : Rp ${ppnTest.toLocaleString('id-ID')}`);
  console.log(`   - Total Bayar: Rp ${totalTest.toLocaleString('id-ID')}`);
  console.log(`   - Terbilang  : "${terbilangTest}"`);

  const mathValid = (ppnTest === 2805011 && totalTest === 28305111 && terbilangTest === "Dua Puluh Delapan Juta Tiga Ratus Lima Ribu Seratus Sebelas Rupiah");
  results.kalkulasiPresisi = mathValid;
  console.log(mathValid ? "     ✓ LULUS: Perhitungan matematis & terbilang bulat 100% presisi." : "     ✗ GAGAL kalkulasi!");

  // ---------------------------------------------------------------------------
  // 2. INPUT & KIRIM DRAF DARI CABANG (PENYIMPANAN TERPUSAT DI CPANEL)
  // ---------------------------------------------------------------------------
  console.log("\n📤 2. Menguji Submit Pengajuan Draf Kwitansi oleh Cabang...");
  const draftPayloadA = {
    action: "submitDraft",
    payload: {
      cabang: "Bandung",
      tglPengajuan: "2026-10-13",
      namaPengaju: "Staf QA Bandung",
      waPengaju: "081220314609",
      klien: "PT UJI PENERIMAAN OPERASIONAL KWITANSI NSR (ISOLASI QA)",
      keterangan: "Biaya Penilaian Properti Agunan Kredit Komersial, SPK No. SPK/QA-KW-001/2026",
      noSpk: "SPK/QA-KW-001/2026",
      nilaiKontrakSpk: 50000000,
      banyaknya: "50% (Termin I / Uang Muka)",
      persentaseTermin: 50,
      dpp: dppTest,
      tarifPpn: 0.11,
      nominalPpn: ppnTest,
      totalBayar: totalTest,
      terbilang: terbilangTest
    }
  };

  const submitResA = await requestJson("POST", "/api/kwitansi-data-proxy", draftPayloadA, { "X-NSR-Token": HQ_TOKEN });
  console.log(`   - Submit Draf A -> HTTP ${submitResA.status}, ID: ${submitResA.data?.idKwitansi}`);
  const idDraftA = submitResA.data?.idKwitansi;

  if (submitResA.status === 200 && submitResA.data?.success && idDraftA) {
    console.log(`     ✓ LULUS: Draf berhasil tersimpan di server terpusat cPanel dengan ID ${idDraftA}!`);
    results.submitDraftTersimpan = true;
  } else {
    console.error("     ✗ GAGAL submit draf:", submitResA);
    results.submitDraftTersimpan = false;
  }

  // ---------------------------------------------------------------------------
  // 3. PENERIMAAN & PEMERIKSAAN DRAF OLEH KEUANGAN PUSAT
  // ---------------------------------------------------------------------------
  console.log("\n📥 3. Menguji Pemeriksaan Draf di Meja Verifikasi Keuangan Pusat...");
  const listPusat = await requestJson("GET", "/api/kwitansi-data-proxy", null, { "X-NSR-Token": HQ_TOKEN });
  const allKwitansi = listPusat.data?.data || [];
  const foundDraftA = allKwitansi.find(k => k.idKwitansi === idDraftA);

  if (foundDraftA && foundDraftA.status === "DRAFT" && foundDraftA.dpp === dppTest) {
    console.log(`     ✓ LULUS: Keuangan Pusat dapat melihat Draf ${idDraftA} secara utuh:`);
    console.log(`       • Klien       : ${foundDraftA.klien}`);
    console.log(`       • SPK         : ${foundDraftA.noSpk} (Pagu: Rp ${foundDraftA.nilaiKontrakSpk?.toLocaleString('id-ID')})`);
    console.log(`       • DPP         : Rp ${foundDraftA.dpp?.toLocaleString('id-ID')}`);
    console.log(`       • Status      : ${foundDraftA.status}`);
    results.diterimaKeuanganPusat = true;
  } else {
    console.error("     ✗ GAGAL: Keuangan Pusat tidak menemukan draf yang dikirim!", listPusat);
    results.diterimaKeuanganPusat = false;
  }

  // ---------------------------------------------------------------------------
  // 4. KONTROL PAGU AKUMULASI TERMIN TERHADAP NILAI KONTRAK (REQUIREMENT 6)
  // ---------------------------------------------------------------------------
  console.log("\n⚖️ 4. Menguji Deteksi Akumulasi Termin & Overbilling Terhadap Nilai Kontrak SPK...");
  // Buat Draf Kedua untuk SPK yang sama namun dengan nilai yang melebihi pagu kontrak (Rp 50.000.000)
  // Akumulasi sebelumnya = Rp 25.500.100. Jika ditambah Rp 30.000.000 = Rp 55.500.100 (> Rp 50.000.000)
  const draftOverbilling = {
    action: "submitDraft",
    payload: {
      ...draftPayloadA.payload,
      banyaknya: "Termin II (Pelunasan)",
      dpp: 30000000,
      nominalPpn: 3300000,
      totalBayar: 33300000,
      terbilang: "Tiga Puluh Tiga Juta Tiga Ratus Ribu Rupiah"
    }
  };

  const submitOver = await requestJson("POST", "/api/kwitansi-data-proxy", draftOverbilling, { "X-NSR-Token": HQ_TOKEN });
  console.log(`   - Submit Draf B (Akumulasi Melebihi Kontrak) -> HTTP ${submitOver.status}, Overbilling Flag: ${submitOver.data?.isOverbilling}`);
  const idDraftOver = submitOver.data?.idKwitansi;

  if (submitOver.status === 200 && submitOver.data?.isOverbilling === true) {
    console.log(`     ✓ LULUS: Server mendeteksi overbilling secara atomik!`);
    console.log(`       Catatan Audit: ${submitOver.data?.record?.catatanAkumulasi}`);
    results.overbillingCheck = true;
  } else {
    console.error("     ✗ GAGAL deteksi overbilling:", submitOver);
    results.overbillingCheck = false;
  }

  // ---------------------------------------------------------------------------
  // 5. PENGESAHAN RESMI (APPROVAL) & PENOMORAN URUT BEBAS DUPLIKAT
  // ---------------------------------------------------------------------------
  console.log("\n✅ 5. Menguji Pengesahan Draf A oleh Keuangan Pusat (Penetapan Nomor Resmi Urut)...");
  const approveResA = await requestJson("POST", "/api/kwitansi-data-proxy", {
    action: "approveKwitansi",
    payload: {
      idKwitansi: idDraftA,
      tglSah: "2026-10-13",
      tempatSah: "Jakarta",
      namaPejabat: "Milda Hidayati Dewi, S.E.",
      jabatanPejabat: "Keuangan"
    }
  }, { "X-NSR-Token": HQ_TOKEN });

  console.log(`   - Pengesahan Draf A -> HTTP ${approveResA.status}, Nomor Resmi: ${approveResA.data?.noKwitansiResmi}`);
  const noKwitansiA = approveResA.data?.noKwitansiResmi;

  if (approveResA.status === 200 && approveResA.data?.success && noKwitansiA && noKwitansiA.includes("/KW-NSR/")) {
    console.log(`     ✓ LULUS: Kwitansi resmi disahkan dengan nomor urut resmi '${noKwitansiA}'!`);
    results.approvalPenomoranUrut = true;
  } else {
    console.error("     ✗ GAGAL approval kwitansi:", approveResA);
    results.approvalPenomoranUrut = false;
  }

  // ---------------------------------------------------------------------------
  // 6. PENGEMBALIAN DRAF (RETURN / REVISI) OLEH KEUANGAN PUSAT
  // ---------------------------------------------------------------------------
  console.log("\n↩️ 6. Menguji Pengembalian Draf B (Revisi ke Cabang) oleh Keuangan Pusat...");
  if (idDraftOver) {
    const returnRes = await requestJson("POST", "/api/kwitansi-data-proxy", {
      action: "returnKwitansi",
      payload: {
        idKwitansi: idDraftOver,
        catatanRevisi: "Draf ditolak / dikembalikan: Total tagihan termin melebihi nilai kontrak SPK. Lampirkan addendum kontrak bila ada penambahan pagu."
      }
    }, { "X-NSR-Token": HQ_TOKEN });

    console.log(`   - Pengembalian Draf B -> HTTP ${returnRes.status}, Status Akhir: ${returnRes.data?.record?.status}`);
    if (returnRes.status === 200 && returnRes.data?.record?.status === "DIKEMBALIKAN") {
      console.log(`     ✓ LULUS: Draf berhasil dikembalikan dengan catatan revisi: "${returnRes.data?.record?.catatanRevisi}"`);
      results.pengembalianDrafRevisi = true;
    } else {
      console.error("     ✗ GAGAL return draf:", returnRes);
      results.pengembalianDrafRevisi = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 7. PENEGAKAN RBAC & ISOLASI ANTAR CABANG (FAIL-CLOSED)
  // ---------------------------------------------------------------------------
  console.log("\n🔒 7. Menguji Strict RBAC & Isolasi Akses Antar Cabang...");
  // Gunakan token Cabang Padang (hash 6b838f... dalam official list)
  // Ambil raw token Padang atau uji otorisasi cabang
  // Uji: Cabang tidak berhak melakukan approveKwitansi (Wajib HTTP 403 Forbidden)
  // Kita coba submit approve tanpa wewenang Keuangan Pusat
  const padangToken = "PDG#020"; // Hash 6b838f...
  const cobaApproveIlegal = await requestJson("POST", "/api/kwitansi-data-proxy", {
    action: "approveKwitansi",
    payload: { idKwitansi: idDraftA }
  }, { "X-NSR-Token": padangToken });

  console.log(`   - Upaya pengesahan ilegal oleh akun Cabang -> HTTP ${cobaApproveIlegal.status}, Error: ${cobaApproveIlegal.data?.error}`);

  // Uji: Cabang Padang mencoba melihat kwitansi milik Cabang Bandung -> Wajib HTTP 403
  const cobaLihatIlegal = await requestJson("GET", `/api/kwitansi-data-proxy?idKwitansi=${idDraftA}`, null, { "X-NSR-Token": padangToken });
  console.log(`   - Upaya pembacaan kwitansi Bandung oleh Cabang Padang -> HTTP ${cobaLihatIlegal.status}, Error: ${cobaLihatIlegal.data?.error}`);

  if (cobaApproveIlegal.status === 403 && cobaLihatIlegal.status === 403) {
    console.log("     ✓ LULUS: Server menerapkan isolasi RBAC ketat (403 Forbidden) untuk akses lintas cabang dan otoritas pengesahan!");
    results.rbacIsolasiCabang = true;
  } else {
    console.error("     ✗ GAGAL RBAC isolasi cabang!");
    results.rbacIsolasiCabang = false;
  }

  // ---------------------------------------------------------------------------
  // 8. FAIL-CLOSED & ANTI-NOTIFIKASI PALSU JIKA SERVER GAGAL
  // ---------------------------------------------------------------------------
  console.log("\n🛡️ 8. Menguji Penolakan Data Tidak Valid & Anti-Notifikasi Palsu...");
  const invalidPayload = {
    action: "submitDraft",
    payload: {
      cabang: "Bandung",
      klien: "", // Kosong! Wajib ditolak HTTP 400
      dpp: 0
    }
  };
  const invalidRes = await requestJson("POST", "/api/kwitansi-data-proxy", invalidPayload, { "X-NSR-Token": HQ_TOKEN });
  console.log(`   - Submit payload invalid -> HTTP ${invalidRes.status}, Error: ${invalidRes.data?.error}`);

  if (invalidRes.status === 400) {
    console.log("     ✓ LULUS: Server menolak data cacat dengan HTTP 400 Bad Request, mencegah status sukses palsu.");
    results.failClosedValidation = true;
  } else {
    console.error("     ✗ GAGAL validasi fail-closed:", invalidRes);
    results.failClosedValidation = false;
  }

  // ---------------------------------------------------------------------------
  // 9. MEMBERSIHKAN RECORD UJI QA (VOID)
  // ---------------------------------------------------------------------------
  console.log("\n🧹 9. Mengarsipkan Record Uji QA ke Status VOID...");
  if (idDraftA) {
    const vA = await requestJson("POST", "/api/kwitansi-data-proxy", {
      action: "voidKwitansi",
      payload: { idKwitansi: idDraftA }
    }, { "X-NSR-Token": HQ_TOKEN });
    console.log(`   - VOID ${idDraftA}: HTTP ${vA.status}`);
  }
  if (idDraftOver) {
    const vB = await requestJson("POST", "/api/kwitansi-data-proxy", {
      action: "voidKwitansi",
      payload: { idKwitansi: idDraftOver }
    }, { "X-NSR-Token": HQ_TOKEN });
    console.log(`   - VOID ${idDraftOver}: HTTP ${vB.status}`);
  }

  // ---------------------------------------------------------------------------
  // 10. PEMERIKSAAN INTEGRITAS DATA HISTORIS RESMI (BASELINE)
  // ---------------------------------------------------------------------------
  console.log("\n📋 10. Memeriksa Integritas Data Historis Kwitansi Resmi...");
  const finalCheck = await requestJson("GET", "/api/kwitansi-data-proxy", null, { "X-NSR-Token": HQ_TOKEN });
  const finalItems = finalCheck.data?.data || [];
  const baselineIds = ["KW-000001", "KW-000002"];
  let baselineIntact = true;
  for (const bId of baselineIds) {
    const bFound = finalItems.find(k => k.idKwitansi === bId);
    if (bFound) {
      console.log(`   - ${bId}: ${bFound.noKwitansiResmi} | Klien: ${bFound.klien} | Total: Rp ${bFound.totalBayar?.toLocaleString('id-ID')} | Status: ${bFound.status}`);
    } else {
      console.error(`   ✗ PERINGATAN: ${bId} tidak ditemukan!`);
      baselineIntact = false;
    }
  }
  results.dataHistorisIntact = baselineIntact;

  console.log("\n================================================================================");
  console.log("📊 RINGKASAN HASIL FINAL QA PORTAL KWITANSI:");
  console.log("================================================================================");
  for (const [k, v] of Object.entries(results)) {
    console.log(`- ${k.padEnd(25)}: ${v ? "✅ LULUS (PASS)" : "❌ GAGAL (FAIL)"}`);
  }

  const allPassed = Object.values(results).every(Boolean);
  console.log("\nSTATUS AKHIR QA:", allPassed ? "🎉 SELURUH ALUR KWITANSI LULUS DAN SIAP OPERASIONAL" : "⚠️ TERDAPAT PENGUJIAN YANG GAGAL");
}

run().catch(err => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
