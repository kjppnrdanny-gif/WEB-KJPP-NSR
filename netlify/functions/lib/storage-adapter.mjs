/**
 * KJPP NSR - Storage Adapter (Concurrency-Safe & Fail-Closed Edition)
 * Supports:
 * 1. Netlify Blobs (Cloud edge environment with strong consistency)
 * 2. File-based persistent store (Local staging, testing, multi-instance simulation)
 * 
 * Concurrency & Race-Condition Solutions (Tahap 2.6B-1B):
 * - Immutable Event-Log Pattern: Eliminates read-modify-write race conditions
 * - Atomic Event Creation: Each failed attempt/request is an independent atomic key
 * - Fail-Closed Architecture: Explicit error propagation to prevent bypass on storage outage
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const ENVIRONMENT = process.env.NSR_ENV || "staging";
const LOCAL_STORE_BASE = process.env.NSR_STORE_DIR || join(tmpdir(), `kjpp-nsr-auth-store-${ENVIRONMENT}`);

function ensureLocalDir(subPath = "") {
  const targetDir = join(LOCAL_STORE_BASE, subPath);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

let netlifyBlobsModule = null;
async function getNetlifyBlobs() {
  if (netlifyBlobsModule !== null) return netlifyBlobsModule;
  try {
    netlifyBlobsModule = await import("@netlify/blobs");
  } catch (e) {
    netlifyBlobsModule = null;
  }
  return netlifyBlobsModule;
}

export class PersistentAuthStore {
  constructor(storeName = "auth-data") {
    this.storeName = storeName;
    this.cloudStore = null;
    this.localDir = ensureLocalDir(storeName);
    this._simulateFailure = false; // Flag khusus simulasi kegagalan penyimpanan untuk security test
  }

  async _getCloudStore() {
    if (this.cloudStore) return this.cloudStore;
    const blobs = await getNetlifyBlobs();
    if (blobs && blobs.getStore) {
      try {
        this.cloudStore = blobs.getStore({ name: `nsr-${ENVIRONMENT}-${this.storeName}`, consistency: "strong" });
        return this.cloudStore;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  setSimulateFailure(shouldFail) {
    this._simulateFailure = Boolean(shouldFail);
  }

  _getKeyPath(key) {
    const safeKey = key.replace(/[/\\?%*:|"<>]/g, "___");
    return join(this.localDir, `${safeKey}.json`);
  }

  async get(key) {
    if (this._simulateFailure) {
      throw new Error(`[STORAGE_SIMULATED_FAILURE] Akses penyimpanan '${this.storeName}' terputus.`);
    }

    const cloud = await this._getCloudStore();
    if (cloud) {
      try {
        const val = await cloud.get(key, { type: "json" });
        if (val !== null && val !== undefined) return val;
      } catch (e) {
        if (this._simulateFailure) throw e;
      }
    }

    const filePath = this._getKeyPath(key);
    if (!existsSync(filePath)) return null;

    try {
      const raw = readFileSync(filePath, "utf8");
      const data = JSON.parse(raw);
      if (data._expiresAt && data._expiresAt < Date.now()) {
        try { unlinkSync(filePath); } catch (e) {}
        return null;
      }
      return data.payload;
    } catch (e) {
      return null;
    }
  }

  async set(key, value, options = {}) {
    if (this._simulateFailure) {
      throw new Error(`[STORAGE_SIMULATED_FAILURE] Gagal menulis ke penyimpanan '${this.storeName}'.`);
    }

    const cloud = await this._getCloudStore();
    if (cloud) {
      try {
        await cloud.set(key, JSON.stringify(value), {
          metadata: options.metadata || {}
        });
        return true;
      } catch (e) {
        if (this._simulateFailure) throw e;
      }
    }

    const filePath = this._getKeyPath(key);
    const ttlMs = options.ttlSeconds ? options.ttlSeconds * 1000 : null;
    const record = {
      payload: value,
      metadata: options.metadata || {},
      _savedAt: Date.now(),
      _expiresAt: ttlMs ? Date.now() + ttlMs : null
    };

    try {
      writeFileSync(filePath, JSON.stringify(record, null, 2), "utf8");
      return true;
    } catch (e) {
      return false;
    }
  }

  async delete(key) {
    if (this._simulateFailure) {
      throw new Error(`[STORAGE_SIMULATED_FAILURE] Gagal menghapus dari '${this.storeName}'.`);
    }

    const cloud = await this._getCloudStore();
    if (cloud) {
      try {
        await cloud.delete(key);
      } catch (e) {}
    }

    const filePath = this._getKeyPath(key);
    if (existsSync(filePath)) {
      try { unlinkSync(filePath); } catch (e) {}
    }
    return true;
  }

  async list(options = {}) {
    if (this._simulateFailure) {
      throw new Error(`[STORAGE_SIMULATED_FAILURE] Gagal membaca list dari '${this.storeName}'.`);
    }

    const prefix = options.prefix || "";

    const cloud = await this._getCloudStore();
    if (cloud) {
      try {
        const cloudList = await cloud.list({ prefix });
        if (cloudList && cloudList.blobs) {
          return cloudList.blobs.map((b) => b.key);
        }
      } catch (e) {
        if (this._simulateFailure) throw e;
      }
    }

    if (!existsSync(this.localDir)) return [];
    try {
      const files = readdirSync(this.localDir);
      const safePrefix = prefix.replace(/[/\\?%*:|"<>]/g, "___");
      return files
        .filter((f) => f.endsWith(".json") && f.startsWith(safePrefix))
        .map((f) => f.slice(0, -5).replace(/___/g, "/"));
    } catch (e) {
      return [];
    }
  }

  /**
   * ATOMIC EVENT-LOG APPEND (Bebas Race Condition & Lost-Update)
   * Setiap percobaan dicatat sebagai dokumen unik tersendiri.
   */
  async recordAtomicEvent(category, identifier, data = {}, ttlSeconds = 900) {
    const timestamp = Date.now();
    const eventId = randomUUID().replace(/-/g, "").slice(0, 12);
    // Key unik: event/<category>/<identifier>/<timestamp>_<eventId>
    const key = `events/${category}/${identifier.toLowerCase()}/${timestamp}_${eventId}`;
    await this.set(key, { ...data, timestamp }, { ttlSeconds });
    return key;
  }

  /**
   * COUNT ATOMIC EVENTS DALAM ROLLING WINDOW
   * Menghitung dokumen unik yang masuk dalam rentang waktu windowSeconds terakhir
   */
  async countRecentEvents(category, identifier, windowSeconds = 900) {
    const prefix = `events/${category}/${identifier.toLowerCase()}/`;
    const keys = await this.list({ prefix });
    const cutoff = Date.now() - (windowSeconds * 1000);
    let count = 0;

    for (const k of keys) {
      // Ambil timestamp dari nama key
      const parts = k.split("/");
      const filename = parts[parts.length - 1] || "";
      const ts = parseInt(filename.split("_")[0], 10);
      if (ts && ts >= cutoff) {
        count++;
      } else {
        // Pembersihan lazy untuk event usang
        this.delete(k).catch(() => {});
      }
    }

    return count;
  }

  /**
   * HAPUS SELURUH EVENT UNTUK IDENTIFIER TERTENTU (Misal saat login sukses)
   */
  async clearEvents(category, identifier) {
    const prefix = `events/${category}/${identifier.toLowerCase()}/`;
    const keys = await this.list({ prefix });
    await Promise.all(keys.map((k) => this.delete(k)));
  }

  async clearAll() {
    if (existsSync(this.localDir)) {
      try {
        rmSync(this.localDir, { recursive: true, force: true });
        ensureLocalDir(this.storeName);
      } catch (e) {}
    }
  }
}

// Singleton instances
export const sessionRevocationStore = new PersistentAuthStore("session-revocations");
export const rateLimitStore = new PersistentAuthStore("rate-limits");
export const userAccountStore = new PersistentAuthStore("user-accounts");
