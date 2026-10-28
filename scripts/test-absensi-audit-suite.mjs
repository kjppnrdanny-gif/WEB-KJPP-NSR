/**
 * Test Suite: Audit & Stabilisasi Portal Presensi / Absensi KJPP NSR
 * Menguji: Autentikasi NIK + OTP Gmail, Session Security, Geofencing 5 Kantor Cabang,
 * Timezone Awareness (WIB vs WITA Makassar), WFH Geofence, Anti-Double Presensi,
 * Pengajuan Cuti, Riwayat Presensi, dan Kepatuhan UU PDP No. 27/2022.
 */

import assert from "assert";
import fs from "fs";
import path from "path";
import handler from "../netlify/functions/absensi-data-proxy.mjs";

console.log("===============================================================");
console.log("   AUDIT & PENGUJIAN PORTAL PRESENSI / ABSENSI KJPP NSR       ");
console.log("===============================================================");

let passCount = 0;
let failCount = 0;

function assertTest(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

async function callProxy(method, body = {}, headers = {}, query = "") {
  const url = `http://localhost/api/absensi-data-proxy${query ? "?" + query : ""}`;
  const req = new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: method === "POST" ? JSON.stringify(body) : undefined
  });
  const res = await handler(req);
  const json = await res.json();
  return { status: res.status, data: json };
}

async function runTests() {
  console.log("\n[TEST GROUP 1] Healthcheck & Status Proxy");
  {
    const res = await callProxy("GET");
    assertTest("Status endpoint mengembalikan 200 dan status success", () => {
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.status, "success");
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(typeof res.data.total_karyawan, "number");
    });
  }

  console.log("\n[TEST GROUP 2] Verifikasi NIK & Data Master Karyawan");
  {
    // NIK kosong
    const resEmpty = await callProxy("POST", { action: "cekKaryawan", nik: "" });
    assertTest("Penolakan NIK kosong mengembalikan status 400", () => {
      assert.strictEqual(resEmpty.status, 400);
      assert.strictEqual(resEmpty.data.success, false);
    });

    // NIK Tidak Dikenal
    const resInvalid = await callProxy("POST", { action: "cekKaryawan", nik: "NSR-UNKNOWN-999" });
    assertTest("Penolakan NIK tidak terdaftar mengembalikan status 404", () => {
      assert.strictEqual(resInvalid.status, 404);
      assert.strictEqual(resInvalid.data.success, false);
    });

    // NIK Valid (Pusat Jakarta)
    const resJakarta = await callProxy("POST", { action: "cekKaryawan", nik: "NSR-2019-005" });
    assertTest("Verifikasi NIK Pusat Jakarta berhasil dan email disamarkan (masked)", () => {
      assert.strictEqual(resJakarta.status, 200);
      assert.strictEqual(resJakarta.data.success, true);
      assert.strictEqual(resJakarta.data.nik, "NSR-2019-005");
      assert.strictEqual(resJakarta.data.cabang, "Pusat Jakarta");
      assert.ok(resJakarta.data.maskedEmail.includes("*"));
      assert.ok(resJakarta.data.maskedEmail.includes("@gmail.com"));
    });

    // NIK Valid (Makassar)
    const resMakassar = await callProxy("POST", { action: "cekKaryawan", nik: "NSR-2021-030" });
    assertTest("Verifikasi NIK Cabang Makassar berhasil", () => {
      assert.strictEqual(resMakassar.status, 200);
      assert.strictEqual(resMakassar.data.success, true);
      assert.strictEqual(resMakassar.data.cabang, "Cabang Makassar");
    });
  }

  console.log("\n[TEST GROUP 3] Alur Permintaan OTP & Cooldown Rate Limiting");
  let hintOTP = null;
  {
    // Minta OTP pertama kali
    const resOTP1 = await callProxy("POST", { action: "mintaOTP", nik: "NSR-2019-005" });
    assertTest("Permintaan OTP pertama berhasil (6 digit, expiry 5 menit)", () => {
      assert.strictEqual(resOTP1.status, 200);
      assert.strictEqual(resOTP1.data.success, true);
      assert.ok(resOTP1.data.pesan.includes("5 menit"));
      assert.ok(resOTP1.data.test_otp_hint);
      hintOTP = resOTP1.data.test_otp_hint;
      assert.strictEqual(hintOTP.length, 6);
    });

    // Minta OTP kedua kali seketika (cooldown < 60s)
    const resOTP2 = await callProxy("POST", { action: "mintaOTP", nik: "NSR-2019-005" });
    assertTest("Permintaan OTP kedua sebelum 60 detik ditolak (Rate Limited HTTP 429)", () => {
      assert.strictEqual(resOTP2.status, 429);
      assert.strictEqual(resOTP2.data.success, false);
      assert.ok(resOTP2.data.message.includes("Mohon tunggu"));
    });
  }

  console.log("\n[TEST GROUP 4] Verifikasi OTP & Penerbitan Token Sesi");
  let validSessionToken = null;
  {
    // OTP salah format (bukan 6 digit)
    const resWrongFormat = await callProxy("POST", { action: "verifikasiOTP", nik: "NSR-2019-005", otp: "123" });
    assertTest("Verifikasi format OTP < 6 digit ditolak (HTTP 400)", () => {
      assert.strictEqual(resWrongFormat.status, 400);
    });

    // OTP salah nilai 1x
    const resWrongVal = await callProxy("POST", { action: "verifikasiOTP", nik: "NSR-2019-005", otp: "000000" });
    assertTest("Verifikasi OTP salah mengurangi kuota percobaan (HTTP 401)", () => {
      assert.strictEqual(resWrongVal.status, 401);
      assert.ok(resWrongVal.data.message.includes("Sisa percobaan: 2 kali"));
    });

    // Verifikasi dengan OTP yang benar
    const resCorrect = await callProxy("POST", { action: "verifikasiOTP", nik: "NSR-2019-005", otp: hintOTP });
    assertTest("Verifikasi OTP benar menerbitkan sessionToken aktif 12 jam (HTTP 200)", () => {
      assert.strictEqual(resCorrect.status, 200);
      assert.strictEqual(resCorrect.data.success, true);
      assert.ok(resCorrect.data.sessionToken);
      assert.strictEqual(typeof resCorrect.data.sessionToken, "string");
      validSessionToken = resCorrect.data.sessionToken;
    });

    // Menggunakan kembali OTP yang sama (harus hangus / one-time)
    const resReuse = await callProxy("POST", { action: "verifikasiOTP", nik: "NSR-2019-005", otp: hintOTP });
    assertTest("Replay attack kode OTP yang sudah dipakai ditolak (HTTP 400)", () => {
      assert.strictEqual(resReuse.status, 400);
    });
  }

  console.log("\n[TEST GROUP 5] Keamanan Sesi Presensi");
  {
    // Presensi tanpa sessionToken
    const resNoToken = await callProxy("POST", {
      action: "simpanAbsensi",
      nik: "NSR-2019-005",
      gps: "-6.28797,106.82477",
      lokasi: "KANTOR",
      jenis: "Masuk"
    });
    assertTest("Presensi tanpa session token ditolak (HTTP 401 UNAUTHORIZED)", () => {
      assert.strictEqual(resNoToken.status, 401);
      assert.strictEqual(resNoToken.data.code, "UNAUTHORIZED_SESSION");
    });

    // Presensi dengan sessionToken palsu
    const resFakeToken = await callProxy("POST", {
      action: "simpanAbsensi",
      nik: "NSR-2019-005",
      gps: "-6.28797,106.82477",
      sessionToken: "invalid_fake_token_12345",
      lokasi: "KANTOR",
      jenis: "Masuk"
    });
    assertTest("Presensi dengan session token palsu ditolak (HTTP 401)", () => {
      assert.strictEqual(resFakeToken.status, 401);
    });
  }

  console.log("\n[TEST GROUP 6] Geofencing Kantor Cabang & Toleransi Radius (150m)");
  {
    // 1. Presensi Tepat di Kantor Pusat Jakarta (Radius < 150m)
    const resPusatValid = await callProxy("POST", {
      action: "simpanAbsensi",
      nik: "NSR-2019-005",
      sessionToken: validSessionToken,
      gps: "-6.287972658138783,106.82477864308436",
      lokasi: "KANTOR",
      jenis: "Masuk"
    });
    assertTest("Presensi tepat di Kantor Pusat berstatus VALID dan zona waktu WIB", () => {
      assert.strictEqual(resPusatValid.status, 200);
      assert.strictEqual(resPusatValid.data.statusValidasi, "VALID");
      assert.strictEqual(resPusatValid.data.kantor, "Pusat Jakarta");
      assert.ok(resPusatValid.data.jam.includes("WIB"));
    });

    // 2. Anti-Double Submission per Hari (Coba Masuk lagi di hari yang sama)
    const resDup = await callProxy("POST", {
      action: "simpanAbsensi",
      nik: "NSR-2019-005",
      sessionToken: validSessionToken,
      gps: "-6.287972658138783,106.82477864308436",
      lokasi: "KANTOR",
      jenis: "Masuk"
    });
    assertTest("Presensi Masuk kedua kali pada tanggal yang sama ditolak (HTTP 409 DUPLICATE_PRESENSI)", () => {
      assert.strictEqual(resDup.status, 409);
      assert.strictEqual(resDup.data.code, "DUPLICATE_PRESENSI");
    });

    // 3. Presensi Pulang di hari yang sama (diizinkan karena beda jenis)
    const resPulang = await callProxy("POST", {
      action: "simpanAbsensi",
      nik: "NSR-2019-005",
      sessionToken: validSessionToken,
      gps: "-6.287972658138783,106.82477864308436",
      lokasi: "KANTOR",
      jenis: "Pulang"
    });
    assertTest("Presensi Pulang pada tanggal yang sama diizinkan (HTTP 200 VALID)", () => {
      assert.strictEqual(resPulang.status, 200);
      assert.strictEqual(resPulang.data.statusValidasi, "VALID");
    });
  }

  console.log("\n[TEST GROUP 7] Multi-Cabang & Timezone Awareness (WITA Cabang Makassar)");
  {
    // Verifikasi OTP untuk Karyawan Makassar (M. Amin Sade)
    const otpMksReq = await callProxy("POST", { action: "mintaOTP", nik: "NSR-2021-030" });
    const otpMksHint = otpMksReq.data.test_otp_hint;
    const otpMksVerify = await callProxy("POST", { action: "verifikasiOTP", nik: "NSR-2021-030", otp: otpMksHint });
    const sessionTokenMks = otpMksVerify.data.sessionToken;

    // Presensi di Kantor Cabang Makassar (-5.1582, 119.4095)
    const resMakassarValid = await callProxy("POST", {
      action: "simpanAbsensi",
      nik: "NSR-2021-030",
      sessionToken: sessionTokenMks,
      gps: "-5.1582,119.4095",
      lokasi: "KANTOR",
      jenis: "Masuk"
    });
    assertTest("Presensi di Cabang Makassar mendeteksi zona waktu WITA secara otomatis", () => {
      assert.strictEqual(resMakassarValid.status, 200);
      assert.strictEqual(resMakassarValid.data.statusValidasi, "VALID");
      assert.strictEqual(resMakassarValid.data.kantor, "Cabang Makassar");
      assert.ok(resMakassarValid.data.jam.includes("WITA"));
    });

    // Presensi Karyawan Makassar tapi di luar radius kantor (jarak > 150m)
    // Titik berjarak ~5km dari kantor
    const resMakassarInvalid = await callProxy("POST", {
      action: "simpanAbsensi",
      nik: "NSR-2021-030",
      sessionToken: sessionTokenMks,
      gps: "-5.2000,119.4500",
      lokasi: "KANTOR",
      jenis: "Pulang"
    });
    assertTest("Presensi di luar radius kantor ditandai status: TIDAK VALID (>150m)", () => {
      assert.strictEqual(resMakassarInvalid.status, 200);
      assert.strictEqual(resMakassarInvalid.data.statusValidasi, "TIDAK VALID");
      assert.ok(resMakassarInvalid.data.jarak > 150);
    });
  }

  console.log("\n[TEST GROUP 8] Presensi WFH & Registrasi Titik Rumah");
  {
    // Karyawan Bandung (Ahmad Fauzi)
    const otpBdgReq = await callProxy("POST", { action: "mintaOTP", nik: "NSR-2020-012" });
    const otpBdgHint = otpBdgReq.data.test_otp_hint;
    const otpBdgVerify = await callProxy("POST", { action: "verifikasiOTP", nik: "NSR-2020-012", otp: otpBdgHint });
    const sessionTokenBdg = otpBdgVerify.data.sessionToken;

    // Kunci titik WFH baru
    const resLockWFH = await callProxy("POST", {
      action: "simpanWFH",
      nik: "NSR-2020-012",
      sessionToken: sessionTokenBdg,
      alamat: "Jl. Dago Asri No. 10, Bandung",
      gps: "-6.870000,107.610000"
    });
    assertTest("Karyawan berhasil mengunci koordinat WFH (HTTP 200)", () => {
      assert.strictEqual(resLockWFH.status, 200);
      assert.strictEqual(resLockWFH.data.success, true);
    });

    // Presensi WFH dalam radius 100 meter dari titik terkunci
    const resWFHValid = await callProxy("POST", {
      action: "simpanAbsensi",
      nik: "NSR-2020-012",
      sessionToken: sessionTokenBdg,
      gps: "-6.870050,107.610050", // selisih ~7 meter
      lokasi: "WFH",
      jenis: "Masuk"
    });
    assertTest("Presensi WFH di dalam radius 100m berstatus VALID", () => {
      assert.strictEqual(resWFHValid.status, 200);
      assert.strictEqual(resWFHValid.data.statusValidasi, "VALID");
      assert.ok(resWFHValid.data.jarak <= 100);
    });

    // Presensi WFH di luar radius (misal 500m dari rumah)
    const resWFHInvalid = await callProxy("POST", {
      action: "simpanAbsensi",
      nik: "NSR-2020-012",
      sessionToken: sessionTokenBdg,
      gps: "-6.875000,107.615000",
      lokasi: "WFH",
      jenis: "Pulang"
    });
    assertTest("Presensi WFH di luar radius 100m berstatus TIDAK VALID", () => {
      assert.strictEqual(resWFHInvalid.status, 200);
      assert.strictEqual(resWFHInvalid.data.statusValidasi, "TIDAK VALID");
      assert.ok(resWFHInvalid.data.jarak > 100);
    });
  }

  console.log("\n[TEST GROUP 9] Pengajuan Cuti & Riwayat Rekapitulasi");
  {
    // Pengajuan cuti karyawan Pusat
    const resCuti = await callProxy("POST", {
      action: "simpanPengajuanCuti",
      nik: "NSR-2019-005",
      sessionToken: validSessionToken,
      jenisCuti: "Cuti Tahunan",
      tglMulai: "2026-11-01",
      tglSelesai: "2026-11-03",
      alasan: "Keperluan keluarga di luar kota"
    });
    assertTest("Pengajuan cuti terkirim dengan status Menunggu Persetujuan dan durasi terhitung", () => {
      assert.strictEqual(resCuti.status, 200);
      assert.strictEqual(resCuti.data.success, true);
      assert.strictEqual(resCuti.data.durasi, 3);
    });

    // Ambil riwayat presensi tanpa sessionToken
    const resRiwayatNoToken = await callProxy("POST", {
      action: "getRiwayatPresensi",
      nik: "NSR-2019-005"
    });
    assertTest("Permintaan riwayat tanpa token sesi ditolak (HTTP 401)", () => {
      assert.strictEqual(resRiwayatNoToken.status, 401);
    });

    // Ambil riwayat presensi dengan sessionToken valid
    const resRiwayat = await callProxy("POST", {
      action: "getRiwayatPresensi",
      nik: "NSR-2019-005",
      sessionToken: validSessionToken
    });
    assertTest("Karyawan dapat membaca riwayat & rekapitulasi presensi miliknya sendiri", () => {
      assert.strictEqual(resRiwayat.status, 200);
      assert.strictEqual(resRiwayat.data.success, true);
      assert.strictEqual(resRiwayat.data.nik, "NSR-2019-005");
      assert.ok(Array.isArray(resRiwayat.data.riwayat_absensi));
      assert.ok(resRiwayat.data.rekap.total_presensi >= 2);
      assert.ok(Array.isArray(resRiwayat.data.riwayat_cuti));
      assert.strictEqual(resRiwayat.data.rekap.total_pengajuan_cuti, 1);
    });
  }

  console.log("\n[TEST GROUP 10] Audit File Frontend & Kepatuhan Privasi (UU PDP No. 27/2022)");
  {
    const htmlPath = path.resolve("portal-absensi.html");
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    assertTest("portal-absensi.html menyertakan form autentikasi NIK & OTP Gmail", () => {
      assert.ok(htmlContent.includes("auth-card"));
      assert.ok(htmlContent.includes("mintaOTP"));
      assert.ok(htmlContent.includes("verifikasiOTP"));
    });

    assertTest("portal-absensi.html memiliki tab Riwayat & Rekapitulasi Presensi", () => {
      assert.ok(htmlContent.includes("tab-btn-riwayat"));
      assert.ok(htmlContent.includes("panelRiwayat"));
      assert.ok(htmlContent.includes("muatRiwayatPresensi"));
    });

    assertTest("portal-absensi.html menerapkan kamera selfie opt-in dengan pelepasan track stream (UU PDP No. 27/2022)", () => {
      assert.ok(htmlContent.includes("toggleKamera"));
      assert.ok(htmlContent.includes("tutupKamera"));
      assert.ok(htmlContent.includes("track.stop()"));
      assert.ok(htmlContent.includes("UU PDP"));
    });

    assertTest("portal-absensi.html mengarahkan API ke /api/absensi-data-proxy secara aman", () => {
      assert.ok(htmlContent.includes("/api/absensi-data-proxy"));
    });

    const gsPath = path.resolve("gas-absensi-Code.gs");
    const gsContent = fs.readFileSync(gsPath, "utf8");
    assertTest("gas-absensi-Code.gs memiliki handler doPost untuk integrasi luar", () => {
      assert.ok(gsContent.includes("function doPost(e)"));
      assert.ok(gsContent.includes("Asia/Makassar"));
      assert.ok(gsContent.includes("getRiwayatPresensi"));
    });
  }

  console.log("\n===============================================================");
  console.log(`HASIL AKHIR: ${passCount} PASS / ${failCount} FAIL`);
  console.log("===============================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
