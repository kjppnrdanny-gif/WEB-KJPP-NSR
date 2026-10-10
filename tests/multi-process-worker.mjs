/**
 * KJPP NSR - Multi-Process Worker Runner
 * Executed in isolated child processes to simulate multi-instance Netlify Functions.
 */

import authLoginHandler from "../staging-isolated-package/netlify/functions/auth-login.mjs";
import authVerifyHandler from "../staging-isolated-package/netlify/functions/auth-verify.mjs";
import authLogoutHandler from "../staging-isolated-package/netlify/functions/auth-logout.mjs";
import nolapProxyHandler from "../staging-isolated-package/netlify/functions/nolap-data-proxy.mjs";
import { sessionRevocationStore } from "../staging-isolated-package/netlify/functions/lib/storage-adapter.mjs";

const action = process.argv[2];
const payloadRaw = process.argv[3];
const payload = payloadRaw ? JSON.parse(payloadRaw) : {};

if (process.env.SIMULATE_STORAGE_FAILURE === "true") {
  sessionRevocationStore.setSimulateFailure(true);
}

function extractCookie(headers) {
  const setCookie = headers.get("set-cookie") || "";
  const match = setCookie.match(/nsr_session=([^;]+)/);
  return match ? match[1] : null;
}

async function run() {
  try {
    if (action === "login") {
      const req = new Request("http://127.0.0.1:8888/api/auth-login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "host": "127.0.0.1:8888",
          "origin": "http://127.0.0.1:8888",
          "x-nf-client-connection-ip": payload.clientIp || "127.0.0.1"
        },
        body: JSON.stringify({
          identifier: payload.identifier,
          password: payload.password
        })
      });
      const res = await authLoginHandler(req);
      const token = extractCookie(res.headers);
      const data = await res.json().catch(() => ({}));
      console.log(JSON.stringify({
        status: res.status,
        token: token,
        data: data
      }));
      return;
    }

    if (action === "verify") {
      const headers = {
        "host": "127.0.0.1:8888",
        "accept": "application/json"
      };
      if (payload.token) {
        headers["cookie"] = `nsr_session=${payload.token}`;
      }
      const req = new Request("http://127.0.0.1:8888/api/auth-verify", {
        method: "GET",
        headers
      });
      const res = await authVerifyHandler(req);
      const data = await res.json().catch(() => ({}));
      console.log(JSON.stringify({
        status: res.status,
        data: data
      }));
      return;
    }

    if (action === "query_proxy") {
      const headers = {
        "host": "127.0.0.1:8888",
        "accept": "application/json"
      };
      if (payload.token) {
        headers["cookie"] = `nsr_session=${payload.token}`;
      }
      const req = new Request("http://127.0.0.1:8888/api/nolap-data-proxy", {
        method: "GET",
        headers
      });
      const res = await nolapProxyHandler(req);
      const data = await res.json().catch(() => ({}));
      console.log(JSON.stringify({
        status: res.status,
        data: data
      }));
      return;
    }

    if (action === "submit_request") {
      const headers = {
        "host": "127.0.0.1:8888",
        "origin": "http://127.0.0.1:8888",
        "content-type": "application/json"
      };
      if (payload.token) {
        headers["cookie"] = `nsr_session=${payload.token}`;
      }
      const req = new Request("http://127.0.0.1:8888/api/nolap-data-proxy", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "submitRequest",
          payload: payload.bodyPayload
        })
      });
      const res = await nolapProxyHandler(req);
      const data = await res.json().catch(() => ({}));
      console.log(JSON.stringify({
        status: res.status,
        data: data
      }));
      return;
    }

    if (action === "approve_request") {
      const headers = {
        "host": "127.0.0.1:8888",
        "origin": "http://127.0.0.1:8888",
        "content-type": "application/json"
      };
      if (payload.token) {
        headers["cookie"] = `nsr_session=${payload.token}`;
      }
      const req = new Request("http://127.0.0.1:8888/api/nolap-data-proxy", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "approveRequest",
          payload: payload.bodyPayload
        })
      });
      const res = await nolapProxyHandler(req);
      const data = await res.json().catch(() => ({}));
      console.log(JSON.stringify({
        status: res.status,
        data: data
      }));
      return;
    }

    if (action === "logout") {
      const headers = {
        "host": "127.0.0.1:8888",
        "origin": "http://127.0.0.1:8888"
      };
      if (payload.token) {
        headers["cookie"] = `nsr_session=${payload.token}`;
      }
      const req = new Request("http://127.0.0.1:8888/api/auth-logout", {
        method: "POST",
        headers
      });
      const res = await authLogoutHandler(req);
      const data = await res.json().catch(() => ({}));
      console.log(JSON.stringify({
        status: res.status,
        data: data
      }));
      return;
    }

    console.error(`Unknown action: ${action}`);
    process.exit(1);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
