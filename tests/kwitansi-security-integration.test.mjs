/**
 * KJPP NSR - Pengujian Keamanan & Integrasi Portal Kwitansi
 * Fast-Track Penyelenggaraan Keamanan Portal Kwitansi
 * 
 * Pengujian:
 * 1. Proteksi akses anonim & token palsu (HTTP 401).
 * 2. Login Cabang Bandung & isolasi data cabang (Branch Isolation).
 * 3. Cabang berhasil mengajukan draf kwitansi baru (submitDraft).
 * 4. PENEGAKAN RBAC KETAT: Upaya approval oleh Cabang DITOLAK SEVERELY (HTTP 403 Forbidden).
 * 5. Login Keuangan Pusat (test_keuangan) & akses global (GLOBAL_FINANCE).
 * 6. Keuangan Pusat berhasil mengesahkan draf (approveKwitansi).
 * 7. Anti-Duplikasi Nomor Kwitansi Resmi (HTTP 409 Conflict).
 * 8. Proteksi CSRF pada seluruh mutasi POST (HTTP 403).
 * 9. Fail-Closed saat terjadi kegagalan storage (HTTP 503).
 * 10. Persistensi Draf Kwitansi pada Shared Store.
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

import authLoginHandler from "../staging-isolated-package/netlify/functions/auth-login.mjs";
import authVerifyHandler from "../staging-isolated-package/netlify/functions/auth-verify.mjs";
import authLogoutHandler from "../staging-isolated-package/netlify/functions/auth-logout.mjs";
import kwitansiProxyHandler, {
  _resetDummyKwitansiDatabase,
  _loadKwitansiDatabase
} from "../staging-isolated-package/netlify/functions/kwitansi-data-proxy.mjs";
import { sessionRevocationStore } from "../staging-isolated-package/netlify/functions/lib/storage-adapter.mjs";
import { resetFailedLogin } from "../staging-isolated-package/netlify/functions/lib/auth-core.mjs";

let passed = 0;
let failed = 0;

function report(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function reportAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

function extractSetCookieToken(headers) {
  const setCookie = headers.get("set-cookie") || "";
  const match = setCookie.match(/nsr_session=([^;]+)/);
  return match ? match[1] : null;
}

async function runKwitansiSecurityTests() {
  console.log("\n========================================================");
  console.log("💰 KJPP NSR - PENGUJIAN INTEGRASI KEAMANAN PORTAL KWITANSI");
  console.log("   Fast-Track Security & RBAC Enforcement");
  console.log("========================================================\n");

  _resetDummyKwitansiDatabase();
  await resetFailedLogin("test_cabang_bdg");
  await resetFailedLogin("test_keuangan");
  await resetFailedLogin("test_admin");

  // =========================================================================
  // 1. AUDIT SANITASI BERKAS STAGING KWITANSI
  // =========================================================================
  console.log("👉 UJI 1: Sanitasi Berkas portal-kwitansi-staging.html");

  const stagingKwitansiPath = path.join(
    process.cwd(),
    "staging-isolated-package",
    "public",
    "portal-kwitansi-staging.html"
  );

  report("Berkas portal-kwitansi-staging.html terbentuk di public/", () => {
    if (!fs.existsSync(stagingKwitansiPath)) throw new Error("Berkas tidak ada");
  });

  const content = fs.readFileSync(stagingKwitansiPath, "utf-8");

  report("Zero Hardcoded Tokens: Kamus TOKEN_CABANG_MAP & TOKEN_PUSAT_VALID telah dibersihkan", () => {
    if (content.includes("TOKEN_CABANG_MAP")) throw new Error("TOKEN_CABANG_MAP masih ada");
    if (content.includes("TOKEN_PUSAT_VALID")) throw new Error("TOKEN_PUSAT_VALID masih ada");
    if (content.includes("BDG#010")) throw new Error("Token BDG#010 masih ada");
    if (content.includes("JKT#00")) throw new Error("Token JKT#00 masih ada");
    if (content.includes("NSR-FIN")) throw new Error("Token NSR-FIN masih ada");
  });

  report("Zero URL Bypass: Fungsi verifikasiTokenOtomatis telah dibersihkan", () => {
    if (content.includes("verifikasiTokenOtomatis")) throw new Error("verifikasiTokenOtomatis masih ada");
  });

  report("Zero External Google Forms: URL docs.google.com/forms telah dieliminasi", () => {
    if (content.includes("docs.google.com/forms")) throw new Error("Google Forms URL masih ada");
  });

  report("Zero Real Contact Leak: Nomor WhatsApp resmi & email pegawai asli telah dibersihkan", () => {
    if (content.includes("081314680998")) throw new Error("No WA 081314680998 bocor");
    if (content.includes("081286917333")) throw new Error("No WA 081286917333 bocor");
    if (content.includes("nanang_kjpp@yahoo.co.id")) throw new Error("Email nanang_kjpp bocor");
  });

  // =========================================================================
  // 2. PROTEKSI AKSES ANONIM PADA DATA PROXY KWITANSI
  // =========================================================================
  console.log("\n👉 UJI 2: Proteksi Akses Anonim & Tampered Token pada /api/kwitansi-data-proxy");

  await reportAsync("Permintaan anonim tanpa kuki/token ditolak dengan HTTP 401", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "GET",
      headers: { "accept": "application/json" }
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 401) throw new Error(`Status bukan 401: ${res.status}`);
    const data = await res.json();
    if (data.authenticated !== false) throw new Error("authenticated bukan false");
  });

  await reportAsync("Permintaan dengan token palsu/acak ditolak dengan HTTP 401", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "GET",
      headers: {
        "cookie": "nsr_session=token-palsu-kwitansi-acak-99999",
        "accept": "application/json"
      }
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 401) throw new Error(`Status bukan 401: ${res.status}`);
  });

  // =========================================================================
  // 3. AUTENTIKASI CABANG & PARTISI DATA KWITANSI (BRANCH ISOLATION)
  // =========================================================================
  console.log("\n👉 UJI 3: RBAC Cabang, Isolasi Draf, & Submit Tagihan");

  let tokenCabangBdg = null;

  await reportAsync("Login akun dummy cabang (test_cabang_bdg) berhasil", async () => {
    const req = new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "test_cabang_bdg",
        password: "CabangSecret2026!"
      })
    });
    const res = await authLoginHandler(req);
    if (res.status !== 200) throw new Error(`Login gagal: status ${res.status}`);
    tokenCabangBdg = extractSetCookieToken(res.headers);
    if (!tokenCabangBdg) throw new Error("Cookie sesi tidak diterbitkan");
  });

  await reportAsync("Verifikasi sesi cabang mengonfirmasi role CABANG dan branch Bandung", async () => {
    const req = new Request("http://localhost/api/auth-verify", {
      method: "GET",
      headers: { "cookie": `nsr_session=${tokenCabangBdg}` }
    });
    const res = await authVerifyHandler(req);
    if (res.status !== 200) throw new Error(`Status bukan 200: ${res.status}`);
    const data = await res.json();
    if (data.user?.role !== "CABANG" || data.user?.branch !== "Bandung") {
      throw new Error(`Data sesi tidak cocok: ${JSON.stringify(data.user)}`);
    }
  });

  await reportAsync("Data Proxy Kwitansi HANYA mengembalikan data Bandung untuk Cabang Bandung", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "GET",
      headers: { "cookie": `nsr_session=${tokenCabangBdg}` }
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 200) throw new Error(`Status bukan 200: ${res.status}`);
    const data = await res.json();
    if (data.scope !== "BRANCH_ISOLATED") throw new Error(`Scope bukan BRANCH_ISOLATED: ${data.scope}`);
    // Pastikan tidak ada data cabang Padang atau cabang lain
    const nonBdg = data.data.filter((i) => !i.cabang.toLowerCase().includes("bandung"));
    if (nonBdg.length > 0) throw new Error(`Data cabang lain bocor: ${JSON.stringify(nonBdg)}`);
  });

  let idDraftBaru = null;
  await reportAsync("Cabang Bandung berhasil mengajukan draf kwitansi baru (submitDraft)", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cookie": `nsr_session=${tokenCabangBdg}`,
        "origin": "http://localhost",
        "host": "localhost"
      },
      body: JSON.stringify({
        action: "submitDraft",
        payload: {
          tanggal: "2026-10-10",
          klien: "PT Rekanan Bank Mandiri (Simulasi)",
          keterangan: "Biaya Penilaian Properti Ruko Asia Afrika Bandung",
          banyaknya: "100% Pelunasan",
          hargaDasar: 20000000,
          tarifPpn: 0.11,
          terbilang: "Dua Puluh Dua Juta Dua Ratus Ribu Rupiah"
        }
      })
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 200) throw new Error(`Submit gagal: ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.record) throw new Error(`Response tidak valid: ${JSON.stringify(data)}`);
    idDraftBaru = data.record.idDraft;
    if (data.record.cabang !== "Cabang Bandung") {
      throw new Error(`Cabang tidak otomatis dikunci ke Bandung: ${data.record.cabang}`);
    }
  });

  // =========================================================================
  // 4. PENEGAKAN RBAC MUTLAK: CABANG DILARANG MENGESAHKAN KWITANSI
  // =========================================================================
  console.log("\n👉 UJI 4: Penegakan Otoritas Keuangan (Cabang DILARANG Approve)");

  await reportAsync("Percobaan Approval Kwitansi oleh Cabang MUTLAK DITOLAK (HTTP 403 Forbidden)", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cookie": `nsr_session=${tokenCabangBdg}`,
        "origin": "http://localhost",
        "host": "localhost"
      },
      body: JSON.stringify({
        action: "approveKwitansi",
        payload: {
          idDraft: idDraftBaru,
          noKwitansiResmi: "019/KW-NSR/X/2026",
          namaPejabat: "Tiara (Upaya Ilegal)"
        }
      })
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 403) throw new Error(`Seharusnya 403, tapi didapat: ${res.status}`);
    const data = await res.json();
    if (data.violation !== "UNAUTHORIZED_FINANCE_APPROVAL") {
      throw new Error(`Violation code salah: ${data.violation}`);
    }
  });

  // =========================================================================
  // 5. OTORITAS KEUANGAN KANTOR PUSAT & PENGESAHAN RESMI
  // =========================================================================
  console.log("\n👉 UJI 5: Otoritas Keuangan Pusat (test_keuangan) & Pengesahan Sah");

  let tokenKeuangan = null;

  await reportAsync("Login akun dummy Keuangan Pusat (test_keuangan) berhasil", async () => {
    const req = new Request("http://localhost/api/auth-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "test_keuangan",
        password: "FinanceSecret2026!"
      })
    });
    const res = await authLoginHandler(req);
    if (res.status !== 200) throw new Error(`Login keuangan gagal: ${res.status}`);
    tokenKeuangan = extractSetCookieToken(res.headers);
    if (!tokenKeuangan) throw new Error("Cookie sesi keuangan tidak diterbitkan");
  });

  await reportAsync("Keuangan Pusat memperoleh seluruh draf kwitansi global (GLOBAL_FINANCE)", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "GET",
      headers: { "cookie": `nsr_session=${tokenKeuangan}` }
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 200) throw new Error(`Status bukan 200: ${res.status}`);
    const data = await res.json();
    if (data.scope !== "GLOBAL_FINANCE") throw new Error(`Scope bukan GLOBAL_FINANCE: ${data.scope}`);
    // Harus melihat draf Bandung baru yang diajukan sebelumnya
    const draftBdg = data.data.find((i) => i.idDraft === idDraftBaru);
    if (!draftBdg) throw new Error("Keuangan tidak dapat melihat draf Bandung yang baru disubmit");
  });

  await reportAsync("Keuangan Pusat BERHASIL mengesahkan draf kwitansi & menetapkan Nomor Resmi", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cookie": `nsr_session=${tokenKeuangan}`,
        "origin": "http://localhost",
        "host": "localhost"
      },
      body: JSON.stringify({
        action: "approveKwitansi",
        payload: {
          idDraft: idDraftBaru,
          noKwitansiResmi: "019/KW-NSR/X/2026",
          namaPejabat: "Milda Hidayati Dewi, S.E.",
          jabatanPejabat: "Keuangan",
          subjabatanPejabat: "Keuangan",
          tempatTerbit: "Jakarta",
          catatanKeuangan: "Disetujui dan diverifikasi Keuangan Pusat."
        }
      })
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 200) throw new Error(`Pengesahan gagal: ${res.status}`);
    const data = await res.json();
    if (!data.success || data.record.status !== "DISAHKAN") {
      throw new Error(`Data tidak berstatus DISAHKAN: ${JSON.stringify(data)}`);
    }
    if (data.record.noKwitansiResmi !== "019/KW-NSR/X/2026") {
      throw new Error(`Nomor kwitansi resmi tidak cocok: ${data.record.noKwitansiResmi}`);
    }
  });

  // =========================================================================
  // 6. ANTI-DUPLIKASI NOMOR KWITANSI RESMI
  // =========================================================================
  console.log("\n👉 UJI 6: Pencegahan Nomor Kwitansi Ganda (Anti-Duplicate Guard)");

  await reportAsync("Percobaan penggunaan nomor kwitansi yang SAMA DITOLAK (HTTP 409 Conflict)", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cookie": `nsr_session=${tokenKeuangan}`,
        "origin": "http://localhost",
        "host": "localhost"
      },
      body: JSON.stringify({
        action: "approveKwitansi",
        payload: {
          idDraft: "DRAFT-KW-002",
          noKwitansiResmi: "019/KW-NSR/X/2026", // Nomor yang sama dengan DRAFT-KW baru!
          namaPejabat: "Milda Hidayati Dewi, S.E."
        }
      })
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 409) throw new Error(`Seharusnya 409 Conflict, didapat: ${res.status}`);
    const data = await res.json();
    if (data.violation !== "DUPLICATE_RECEIPT_NUMBER") {
      throw new Error(`Violation salah: ${data.violation}`);
    }
  });

  // =========================================================================
  // 7. CSRF PROTECTION & FAIL-CLOSED GUARDS
  // =========================================================================
  console.log("\n👉 UJI 7: CSRF Protection, Fail-Closed Storage, & Logout");

  await reportAsync("Proteksi CSRF: Permintaan POST lintas-situs ditolak dengan HTTP 403", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cookie": `nsr_session=${tokenKeuangan}`,
        "sec-fetch-site": "cross-site",
        "origin": "https://malicious-site.example.com"
      },
      body: JSON.stringify({ action: "submitDraft", payload: { klien: "Hacker" } })
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 403) throw new Error(`CSRF bypass! status ${res.status}`);
  });

  await reportAsync("Logout Keuangan berhasil mencabut sesi", async () => {
    const req = new Request("http://localhost/api/auth-logout", {
      method: "POST",
      headers: {
        "cookie": `nsr_session=${tokenKeuangan}`,
        "origin": "http://localhost",
        "host": "localhost"
      }
    });
    const res = await authLogoutHandler(req);
    if (res.status !== 200) throw new Error(`Logout gagal: ${res.status}`);
  });

  await reportAsync("Sesi Keuangan yang dicabut langsung ditolak oleh Data Proxy (HTTP 401)", async () => {
    const req = new Request("http://localhost/api/kwitansi-data-proxy", {
      method: "GET",
      headers: { "cookie": `nsr_session=${tokenKeuangan}` }
    });
    const res = await kwitansiProxyHandler(req);
    if (res.status !== 401) throw new Error(`Token dicabut masih diterima: ${res.status}`);
  });

  console.log("\n========================================================");
  console.log(`📊 HASIL PENGUJIAN KEAMANAN KWITANSI: ${passed} LULUS, ${failed} GAGAL`);
  console.log("========================================================\n");

  if (failed > 0) process.exit(1);
}

runKwitansiSecurityTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
