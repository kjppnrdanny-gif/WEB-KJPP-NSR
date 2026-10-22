/**
 * KJPP NSR - Serverless Data Proxy Adapter untuk Portal Presensi & Absensi Karyawan
 * Menghubungkan frontend Portal Presensi KJPP NSR secara langsung ke Google Apps Script SSOT
 * & Google Spreadsheet Database Resmi (ID: 12gf52mLEAizuFvP03DiGddxX6HiYqD6UO5CF0Cl_C3E).
 * Tidak membuat database paralel atau mock in-memory terpisah.
 */

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwI-OQMFWQZrzraGkU0mDY8MD8XjLwpmo0KsOnC-aCaMB_CYDxi_-xgh11NJEwTP3kn/exec";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Session-Token"
    }
  });
}

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Session-Token"
      }
    });
  }

  let payload = {};
  const url = new URL(request.url);

  if (request.method === "POST") {
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }
  } else {
    for (const [key, value] of url.searchParams.entries()) {
      payload[key] = value;
    }
  }

  const action = payload.action || url.searchParams.get("action") || "STATUS";
  payload.action = action;

  // Header session token forward
  const sessionToken = request.headers.get("X-Session-Token");
  if (sessionToken && !payload.sessionToken) {
    payload.sessionToken = sessionToken;
  }

  try {
    const gasRes = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      redirect: "follow",
      body: JSON.stringify(payload)
    });

    const gasText = await gasRes.text();
    let gasJson;
    try {
      gasJson = JSON.parse(gasText);
    } catch {
      gasJson = {
        status: gasRes.ok ? "success" : "error",
        success: gasRes.ok,
        raw: gasText
      };
    }

    return jsonResponse(gasJson, gasRes.status);
  } catch (err) {
    console.error("[Netlify Proxy Error] Gagal meneruskan ke GAS:", err.message);
    return jsonResponse({
      status: "error",
      success: false,
      message: "Gagal terhubung ke backend Google Apps Script: " + err.message
    }, 502);
  }
}
