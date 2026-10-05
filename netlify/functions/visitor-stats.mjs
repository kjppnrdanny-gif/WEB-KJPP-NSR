import { getStore } from "@netlify/blobs";
import { createHash, randomUUID } from "node:crypto";

const INITIAL_TOTAL = 18454;
const INITIAL_TODAY = 128;
const INITIAL_DATE = "2026-10-03"; // WIB, rekap awal dari admin
const COOKIE_NAME = "nsr_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;

function jakartaDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function getCookie(header, name) {
  if (!header) return null;
  for (const item of header.split(";")) {
    const [key, ...rest] = item.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function isLikelyBot(userAgent = "") {
  return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|headless|lighthouse/i.test(userAgent);
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      ...extraHeaders,
    },
  });
}

export default async (req) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return json({ error: 'Method not allowed' }, 405, { allow: 'GET, POST' });
  }

  const date = jakartaDate();
  const userAgent = req.headers.get("user-agent") || "";
  const bot = isLikelyBot(userAgent);

  let visitorId = getCookie(req.headers.get("cookie"), COOKIE_NAME);
  let setCookie = null;
  if (!visitorId || !/^[a-f0-9-]{20,80}$/i.test(visitorId)) {
    visitorId = randomUUID();
    setCookie = `${COOKIE_NAME}=${encodeURIComponent(visitorId)}; Max-Age=${ONE_YEAR}; Path=/; SameSite=Lax; Secure; HttpOnly`;
  }

  let total = INITIAL_TOTAL;
  let today = (date === INITIAL_DATE ? INITIAL_TODAY : 0);
  let counted = false;

  try {
    const store = getStore({ name: "nsr-visitor-stats", consistency: "strong" });

    if (!bot) {
      const hash = createHash("sha256").update(visitorId).digest("hex");
      const now = new Date().toISOString();

      const [deviceResult, dayResult] = await Promise.all([
        store.set(`devices/${hash}`, "1", {
          onlyIfNew: true,
          metadata: { firstSeen: now },
        }),
        store.set(`days/${date}/${hash}`, "1", {
          onlyIfNew: true,
          metadata: { seenAt: now },
        }),
      ]);
      counted = Boolean(deviceResult?.modified || dayResult?.modified);
    }

    const [allDevices, todayDevices] = await Promise.all([
      store.list({ prefix: "devices/" }),
      store.list({ prefix: `days/${date}/` }),
    ]);

    total = INITIAL_TOTAL + (allDevices?.blobs?.length || 0);
    today = (date === INITIAL_DATE ? INITIAL_TODAY : 0) + (todayDevices?.blobs?.length || 0);
  } catch (err) {
    console.warn("Netlify Blobs stats fallback:", err?.message || err);
  }

  return json(
    {
      total,
      today,
      date,
      updatedAt: new Date().toISOString(),
      counted: bot ? false : counted,
      method: "anonymous-browser-cookie",
      note: "Approximate unique browsers; not unique people or client count.",
    },
    200,
    setCookie ? { "set-cookie": setCookie } : {}
  );
};

export const config = {
  path: "/api/visitor-stats",
};
