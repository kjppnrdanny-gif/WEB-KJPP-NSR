/**
 * Netlify Function: /api/auth-verify (Fail-Closed & Concurrency-Hardened Edition)
 * Method: GET, POST
 * 
 * Validates session token from HttpOnly cookie against:
 * 1. Cryptographic HMAC-SHA256 signature
 * 2. Expiration timestamp
 * 3. Fail-Closed multi-instance persistent session revocation list
 * 4. Fail-Closed account active/deactivated lifecycle in store
 */

import {
  verifySessionToken,
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

function extractToken(req) {
  // 1. Prioritas Utama: Cookie HttpOnly
  const cookieHeader = req.headers.get("cookie") || "";
  for (const item of cookieHeader.split(";")) {
    const [key, ...rest] = item.trim().split("=");
    if (key === "nsr_session") {
      return decodeURIComponent(rest.join("="));
    }
  }

  // 2. Fallback untuk API test suite (Authorization: Bearer <token>)
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

export default async (req) => {
  if (!["GET", "POST"].includes(req.method)) {
    return jsonResponse({ error: "Method not allowed" }, 405, { allow: "GET, POST" });
  }

  const token = extractToken(req);
  if (!token) {
    return jsonResponse(
      { authenticated: false, error: "Tidak ada sesi aktif (cookie sesi tidak ditemukan)" },
      401
    );
  }

  // Verifikasi Kriptografis, Kedaluwarsa, Pencabutan Persisten, dan Status Akun
  const result = await verifySessionToken(token);
  if (!result.valid) {
    // FAIL-CLOSED: Jika storage sedang tidak dapat diakses, kembalikan 503 (bukan 200)
    if (result.isStorageError) {
      return jsonResponse(
        {
          authenticated: false,
          error: result.error || "Layanan verifikasi sesi sementara tidak dapat diakses (Fail-Closed). Akses ditangguhkan demi keamanan."
        },
        503,
        { "retry-after": "30" }
      );
    }

    const isDeactivated = result.error && result.error.includes("dinonaktifkan");
    return jsonResponse(
      { authenticated: false, error: result.error },
      isDeactivated ? 403 : 401
    );
  }

  const { sub, role, branch, displayName, title, exp } = result.payload;

  return jsonResponse({
    authenticated: true,
    user: {
      username: sub,
      role,
      branch,
      displayName,
      title
    },
    permissions: PERMISSIONS_MATRIX[role] || {},
    sessionExpiresAt: new Date(exp * 1000).toISOString()
  });
};

export const config = {
  path: "/api/auth-verify"
};
