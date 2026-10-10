/**
 * KJPP NSR - Test Fixtures: Dummy Users & Mock User Provider
 * (Tahap 2.6B-2C: Isolasi Penuh Akun Dummy dari Runtime Produksi)
 * 
 * Modul ini HANYA berada di direktori 'tests/' dan TIDAK AKAN PERNAH
 * disertakan dalam paket deployment runtime produksi.
 */

import { hashPassword, ROLES } from "../../netlify/functions/lib/auth-core.mjs";

export const TEST_FIXTURE_USERS = {
  "test_admin": {
    username: "test_admin",
    passwordHash: hashPassword("AdminSecret2026!"),
    role: ROLES.ADMIN_PUSAT,
    branch: "Pusat",
    displayName: "Akun Pengujian Admin Pusat",
    title: "Testing Administrator",
    isActive: true
  },
  "test_cabang_bdg": {
    username: "test_cabang_bdg",
    passwordHash: hashPassword("CabangSecret2026!"),
    role: ROLES.CABANG,
    branch: "Bandung",
    displayName: "Akun Pengujian Cabang Bandung",
    title: "Testing Branch Staff Bandung",
    isActive: true
  },
  "test_cabang_pdg": {
    username: "test_cabang_pdg",
    passwordHash: hashPassword("PadangSecret2026!"),
    role: ROLES.CABANG,
    branch: "Padang",
    displayName: "Akun Pengujian Cabang Padang",
    title: "Testing Branch Staff Padang",
    isActive: true
  },
  "test_keuangan": {
    username: "test_keuangan",
    passwordHash: hashPassword("FinanceSecret2026!"),
    role: ROLES.KEUANGAN,
    branch: "Pusat",
    displayName: "Akun Pengujian Bagian Keuangan",
    title: "Testing Finance Manager",
    isActive: true
  },
  "test_surveyor": {
    username: "test_surveyor",
    passwordHash: hashPassword("SurveyorSecret2026!"),
    role: ROLES.STAF_TEKNIS,
    branch: "Pusat",
    displayName: "Akun Pengujian Staf Surveyor",
    title: "Testing Surveyor",
    isActive: true
  },
  "test_deactivated": {
    username: "test_deactivated",
    passwordHash: hashPassword("DeactivatedPass2026!"),
    role: ROLES.CABANG,
    branch: "Padang",
    displayName: "Akun Nonaktif Pengujian",
    title: "Mantan Pegawai",
    isActive: false
  }
};

export class MockUserProvider {
  constructor(users = TEST_FIXTURE_USERS) {
    this.users = { ...users };
  }

  async getUser(username) {
    if (!username) return null;
    const clean = username.toLowerCase();
    return this.users[clean] || null;
  }

  async setUser(username, userData) {
    if (!username) return false;
    this.users[username.toLowerCase()] = userData;
    return true;
  }
}

export function createMockUserProvider(users = TEST_FIXTURE_USERS) {
  return new MockUserProvider(users);
}

export function registerTestUserProvider(setUserProviderFn) {
  const provider = createMockUserProvider();
  setUserProviderFn(provider);
  return provider;
}
