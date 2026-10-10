/**
 * Netlify Function: /api/auth-login (OWASP & Concurrency-Hardened Edition)
 * Method: POST
 * 
 * Features:
 * - CSRF Origin / Sec-Fetch-Site verification
 * - Concurrency-safe atomic event-log rate limiting (IP and Account level)
 * - OWASP Scrypt N=32768, r=8, p=3 constant-time password verification
 * - Transparent auto-rehash migration on successful authentication
 * - Account active/inactive lifecycle enforcement
 * - HttpOnly, SameSite=Strict cookie session injection
 * - ZERO credential/token leakage in JSON response
 */

import {
  verifyPassword,
  hashPassword,
  needsRehash,
  createSessionToken,
  checkPersistentRateLimit,
  recordFailedLogin,
  recordSuccessfulRequest,
  resetFailedLogin,
  verifyCsrf,
  getUserAccount,
  setUserAccount,
  PERMISSIONS_MATRIX
} from "./lib/auth-core.mjs";

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

function getClientIp(req) {
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, { allow: "POST" });
  }

  // 1. Proteksi CSRF
  if (!verifyCsrf(req)) {
    return jsonResponse({ error: "Permintaan lintas-situs ditolak (CSRF Protection)" }, 403);
  }

  // 2. Parse Body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return jsonResponse({ error: "Format request tidak valid (JSON required)" }, 400);
  }

  const { identifier, password } = body || {};
  const cleanId = (identifier || "").trim().toLowerCase();
  const cleanPass = password || "";

  if (!cleanId || !cleanPass) {
    return jsonResponse({ error: "Identitas pengguna dan password wajib diisi" }, 400);
  }

  const ip = getClientIp(req);

  // 3. Concurrency-Safe Atomic Rate Limiting
  const rateCheck = await checkPersistentRateLimit(ip, cleanId);
  if (!rateCheck.allowed) {
    const retrySec = rateCheck.retryAfterSeconds || 60;
    const msg = rateCheck.reason === "ACCOUNT_LOCKED"
      ? `Terlalu banyak percobaan gagal pada akun ini. Akses dikunci sementara selama ${retrySec} detik.`
      : `Terlalu banyak permintaan dari jaringan Anda. Coba lagi dalam ${retrySec} detik.`;
    return jsonResponse({ error: msg }, 429, { "retry-after": String(retrySec) });
  }

  // 4. Cari Pengguna di Persistent Store / Dummy Repository
  const user = await getUserAccount(cleanId);
  if (!user) {
    await new Promise((r) => setTimeout(r, 150));
    await recordFailedLogin(cleanId, ip);
    return jsonResponse({ error: "Kredensial tidak valid atau tidak memiliki otorisasi" }, 401);
  }

  // 5. Periksa Status Akun (Aktif vs Nonaktif)
  if (user.isActive === false) {
    return jsonResponse({ error: "Akun ini telah dinonaktifkan oleh Administrator" }, 403);
  }

  // 6. Verifikasi Password dengan OWASP Scrypt p=3 Constant-Time
  const isMatch = verifyPassword(cleanPass, user.passwordHash);
  if (!isMatch) {
    await recordFailedLogin(cleanId, ip);
    return jsonResponse({ error: "Kredensial tidak valid atau tidak memiliki otorisasi" }, 401);
  }

  // 7. Berhasil -> Reset Catatan Percobaan Gagal & Catat Request Sukses
  await resetFailedLogin(cleanId);
  await recordSuccessfulRequest(ip);

  // 8. Auto-Rehash Transparan (Upgrade format hash lama ke OWASP Scrypt p=3 terbaru)
  if (needsRehash(user.passwordHash)) {
    try {
      const newHash = hashPassword(cleanPass);
      user.passwordHash = newHash;
      await setUserAccount(cleanId, user);
    } catch (e) {
      // Rehash gagal jangan menghambat login pengguna
    }
  }

  // 9. Buat Sesi Kriptografis
  const sessionPayload = {
    sub: user.username,
    role: user.role,
    branch: user.branch,
    displayName: user.displayName,
    title: user.title
  };
  const sessionToken = createSessionToken(sessionPayload);

  // 10. Konfigurasi HttpOnly Secure Cookie
  const isDev = process.env.NODE_ENV === "development" || ip === "127.0.0.1";
  const secureFlag = isDev ? "" : "; Secure";
  const cookieHeader = `nsr_session=${encodeURIComponent(
    sessionToken
  )}; Path=/; Max-Age=28800; SameSite=Strict; HttpOnly${secureFlag}`;

  // 11. Respon JSON HANYA mengembalikan profil & izin (TIDAK ADA TOKEN DI JSON!)
  return jsonResponse(
    {
      success: true,
      message: "Autentikasi server berhasil",
      user: {
        username: user.username,
        role: user.role,
        branch: user.branch,
        displayName: user.displayName,
        title: user.title
      },
      permissions: PERMISSIONS_MATRIX[user.role] || {}
    },
    200,
    { "set-cookie": cookieHeader }
  );
};

export const config = {
  path: "/api/auth-login"
};
