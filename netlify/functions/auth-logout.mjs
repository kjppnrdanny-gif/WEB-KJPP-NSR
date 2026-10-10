/**
 * Netlify Function: /api/auth-logout (Hardened Edition)
 * Method: POST
 * 
 * Revokes current session token persistently in shared store
 * and clears the HttpOnly cookie. Protected against CSRF.
 */

import {
  verifySessionToken,
  revokeSession,
  verifyCsrf
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
  const cookieHeader = req.headers.get("cookie") || "";
  for (const item of cookieHeader.split(";")) {
    const [key, ...rest] = item.trim().split("=");
    if (key === "nsr_session") {
      return decodeURIComponent(rest.join("="));
    }
  }

  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, { allow: "POST" });
  }

  // 1. Proteksi CSRF
  if (!verifyCsrf(req)) {
    return jsonResponse({ error: "Permintaan logout lintas-situs ditolak (CSRF Protection)" }, 403);
  }

  // 2. Cabut Sesi di Persistent Store
  const token = extractToken(req);
  if (token) {
    const result = await verifySessionToken(token);
    if (result.valid && result.payload?.jti) {
      await revokeSession(result.payload.jti);
    }
  }

  // 3. Hapus Cookie di Browser
  const clearCookieHeader = "nsr_session=; Path=/; Max-Age=0; SameSite=Strict; HttpOnly";

  return jsonResponse(
    {
      success: true,
      message: "Sesi berhasil ditutup dan dicabut secara permanen dari server"
    },
    200,
    { "set-cookie": clearCookieHeader }
  );
};

export const config = {
  path: "/api/auth-logout"
};
