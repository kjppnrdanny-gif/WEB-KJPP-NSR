// scripts/verify-gas-sync.mjs
// Test script for verifying Google Apps Script (GAS) API synchronization

const ENDPOINT_PRIMARY = "https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec";
const ENDPOINT_SU_ALT = "https://script.google.com/macros/s/AKfycbwF5SI6A6hj0yuPBVd8FlRNc7uaXqCNDtoe6RdvlPdL7t33ithJ6TFrHQEB11fxzMqF/exec";

async function testFetch(url, options = {}) {
  const res = await fetch(url, {
    redirect: 'follow',
    ...options
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // not json
  }
  return { status: res.status, ok: res.ok, text, json };
}

async function runTests() {
  console.log("================================================================================");
  console.log("PENGUJIAN SINKRONISASI ENDPOINT GOOGLE APPS SCRIPT (GAS)");
  console.log("Target Primary Endpoint:", ENDPOINT_PRIMARY);
  console.log("================================================================================\n");

  // -----------------------------------------------------------------------------------------
  // UJI 1: GET PENUGASAN & JO
  // -----------------------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("UJI 1: GET PENUGASAN & JO (Verifikasi Jalur DB_PENUGASAN_JO_NSR)");
  const url1 = `${ENDPOINT_PRIMARY}?refresh=true`;
  console.log("GET URL:", url1);
  try {
    const t0 = Date.now();
    const res1 = await testFetch(url1);
    const elapsed = Date.now() - t0;
    console.log(`HTTP Status: ${res1.status} (${elapsed}ms)`);
    if (res1.json) {
      console.log("Response JSON Status:", res1.json.status, "| Success:", res1.json.success);
      console.log("Counter:", JSON.stringify(res1.json.counter));
      console.log("Total Submissions:", res1.json.totalCount || (res1.json.submissions ? res1.json.submissions.length : 0));
      
      const lastNoAdm = res1.json.counter ? (res1.json.counter.LAST_NO_ADM_JO || res1.json.counter.lastNoAdmJO) : undefined;
      console.log("Counter LAST_NO_ADM_JO:", lastNoAdm);
      
      if (res1.json.submissions && res1.json.submissions.length > 0) {
        const foundMakmur = res1.json.submissions.find(s => {
          const deb = String(s.Nama_Debitur_Utama || s.Nama_Debitur || s.debitur_nama || '').toUpperCase();
          return deb.includes('SUMBER MAKMUR');
        });
        if (foundMakmur) {
          console.log("✓ Ditemukan Debitur 'PT SUMBER MAKMUR':", {
            ID_Penugasan: foundMakmur.ID_Penugasan,
            No_Adm_JO: foundMakmur.No_Adm_JO,
            No_Lingkup_Penugasan: foundMakmur.No_Lingkup_Penugasan,
            Debitur: foundMakmur.Nama_Debitur_Utama,
            PemberiTugas: foundMakmur.Nama_Pemberi_Tugas,
            Status: foundMakmur.Status_Approval
          });
        } else {
          console.log("Sampel Submissions (5 pertama):", res1.json.submissions.slice(0, 5).map(s => ({
            ID: s.ID_Penugasan,
            Debitur: s.Nama_Debitur_Utama,
            Adm: s.No_Adm_JO,
            Status: s.Status_Approval
          })));
        }
      }
    } else {
      console.log("Response Text (first 500 chars):", res1.text.substring(0, 500));
    }
  } catch (e1) {
    console.error("❌ UJI 1 Error:", e1);
  }

  // -----------------------------------------------------------------------------------------
  // UJI 2: GET SURAT UMUM
  // -----------------------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("UJI 2: GET SURAT UMUM (Verifikasi Jalur Buku Agenda Surat Umum)");
  const url2 = `${ENDPOINT_PRIMARY}?action=GET_SURAT_UMUM_LIST`;
  console.log("GET URL:", url2);
  try {
    const t0 = Date.now();
    const res2 = await testFetch(url2);
    const elapsed = Date.now() - t0;
    console.log(`HTTP Status: ${res2.status} (${elapsed}ms)`);
    if (res2.json) {
      console.log("Response JSON Status:", res2.json.status, "| Success:", res2.json.success);
      console.log("Target Year:", res2.json.target_year);
      console.log("Max Seq:", res2.json.maxSeq, "| Next Seq:", res2.json.nextSeq);
      console.log("Suggested Nomor:", res2.json.suggestedNomor);
      console.log("Total Count Data Surat:", res2.json.totalCount || (res2.json.data ? res2.json.data.length : 0));
      if (res2.json.data && res2.json.data.length > 0) {
        console.log("Daftar Surat Umum Terdaftar:");
        res2.json.data.forEach((s, idx) => {
          console.log(`  [${idx + 1}] No_Urut: ${s.No_Urut} | No_Surat: ${s.No_Surat} | Perihal: ${s.Perihal} | Tujuan: ${s.Tujuan_Penerima} | Status: ${s.Status_Arsip}`);
        });
      }
    } else {
      console.log("Response Text (first 500 chars):", res2.text.substring(0, 500));
    }
  } catch (e2) {
    console.error("❌ UJI 2 Error:", e2);
  }

  // Cek juga endpoint alternatif yang tercatat di portal-surat-umum.html untuk perbandingan audit
  console.log("\n[Audit Info] Memeriksa juga endpoint SU dari portal-surat-umum.html:");
  console.log("URL:", `${ENDPOINT_SU_ALT}?action=GET_SURAT_UMUM_LIST`);
  try {
    const res2Alt = await testFetch(`${ENDPOINT_SU_ALT}?action=GET_SURAT_UMUM_LIST`);
    console.log(`HTTP Status Alt Endpoint: ${res2Alt.status}`);
    if (res2Alt.json) {
      console.log("Alt Endpoint Response:", {
        status: res2Alt.json.status,
        maxSeq: res2Alt.json.maxSeq,
        nextSeq: res2Alt.json.nextSeq,
        suggestedNomor: res2Alt.json.suggestedNomor,
        totalCount: res2Alt.json.totalCount
      });
      if (res2Alt.json.data && res2Alt.json.data.length > 0) {
        console.log("Data Surat Alt Endpoint:");
        res2Alt.json.data.forEach((s, idx) => {
          console.log(`  [${idx + 1}] No_Urut: ${s.No_Urut} | No_Surat: ${s.No_Surat} | Perihal: ${s.Perihal}`);
        });
      }
    }
  } catch (eAlt) {
    console.error("Alt Endpoint Error:", eAlt.message);
  }

  // -----------------------------------------------------------------------------------------
  // UJI 3: POST ACTION SYNC (Otorisasi Token Tanpa Mengotori Data)
  // -----------------------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("UJI 3: POST ACTION SYNC (Verifikasi Otorisasi Token Tanpa Mengotori Data)");
  console.log("POST URL:", ENDPOINT_PRIMARY);
  const postPayload = {
    action: "SYNC",
    token: (process.env.NSR_KING_TOKEN || "NSR_MOCK_KING_TOKEN")
  };
  console.log("Payload:", JSON.stringify(postPayload));
  try {
    const t0 = Date.now();
    const res3 = await testFetch(ENDPOINT_PRIMARY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postPayload)
    });
    const elapsed = Date.now() - t0;
    console.log(`HTTP Status: ${res3.status} (${elapsed}ms)`);
    if (res3.json) {
      console.log("Response JSON Status:", res3.json.status, "| Success:", res3.json.success);
      console.log("Counter:", JSON.stringify(res3.json.counter));
      console.log("Total Submissions:", res3.json.submissions ? res3.json.submissions.length : 0);
      console.log("Total Master Personil:", res3.json.masterPersonil ? res3.json.masterPersonil.length : 0);
    } else {
      console.log("Response Text (first 500 chars):", res3.text.substring(0, 500));
    }
  } catch (e3) {
    console.error("❌ UJI 3 Error:", e3);
  }

  console.log("\n================================================================================");
  console.log("PENGUJIAN SELESAI");
  console.log("================================================================================");
}

runTests();
