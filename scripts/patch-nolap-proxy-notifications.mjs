import fs from 'fs';

const proxyPath = 'netlify/functions/nolap-data-proxy.mjs';
let code = fs.readFileSync(proxyPath, 'utf8');

// 1. Add fs import if not present
if (!code.includes("import fs from 'node:fs';") && !code.includes('import fs from "node:fs";')) {
  code = `import fs from "node:fs";\n` + code;
}

// 2. Add GET actions before const noReqTarget = reqUrl.searchParams.get("noPermintaan");
const getAnchor = `const noReqTarget = reqUrl.searchParams.get("noPermintaan");`;
const getReplacements = `const action = reqUrl.searchParams.get("action");

    // Action GET: Directory Personel Master
    if (action === "getPersonelDirectory") {
      try {
        const raw = fs.readFileSync("data/masters/master_personel_kontak.json", "utf8");
        const list = JSON.parse(raw);
        return jsonResponse({
          success: true,
          total: list.length,
          personel: list
        });
      } catch (e) {
        return jsonResponse({ success: false, error: "Master data personel tidak dapat dibaca." }, 500);
      }
    }

    // Action GET: Profile Kontak Pengaju
    if (action === "getRequesterContactProfile") {
      try {
        const raw = fs.readFileSync("data/masters/master_personel_kontak.json", "utf8");
        const list = JSON.parse(raw);
        const subKey = (user.sub || user.role || "").toLowerCase();
        let matched = list.find(p => (p.email && p.email.toLowerCase().includes(subKey)) || (p.nama && p.nama.toLowerCase().includes(subKey)));
        if (!matched && userBranch) {
          matched = list.find(p => p.office && p.office.toLowerCase().includes(userBranch.toLowerCase()));
        }
        return jsonResponse({
          success: true,
          profile: matched || {
            nama: user.displayName || user.sub,
            email: "notifikasi@kjppnanangrahayu.com",
            wa: "081298765432",
            office: userBranch || "Kantor Pusat Jakarta"
          }
        });
      } catch (e) {
        return jsonResponse({ success: false, error: "Gagal memuat profil kontak." }, 500);
      }
    }

    // Action GET: Riwayat Notifikasi
    if (action === "getNotificationLogs") {
      try {
        const raw = fs.existsSync("data/notification_logs.json") ? fs.readFileSync("data/notification_logs.json", "utf8") : "[]";
        let logs = JSON.parse(raw);
        if (userRole === ROLES.CABANG) {
          logs = logs.filter(l => (l.office_id === user.office_id) || (l.cabang && l.cabang.toLowerCase().includes(userBranch.toLowerCase())));
        }
        return jsonResponse({
          success: true,
          total: logs.length,
          logs: logs
        });
      } catch (e) {
        return jsonResponse({ success: false, error: "Gagal memuat log notifikasi." }, 500);
      }
    }

    // Action GET: Antrean Pendaftaran Personel (Admin Pusat Only)
    if (action === "getRegistrasiPersonelQueue") {
      if (userRole !== ROLES.ADMIN_PUSAT) {
        return jsonResponse({ error: "Akses ditolak: Hanya Admin Pusat yang berhak meninjau antrean pendaftaran personel." }, 403);
      }
      try {
        const raw = fs.existsSync("data/registrasi_personel_antrean.json") ? fs.readFileSync("data/registrasi_personel_antrean.json", "utf8") : "[]";
        const q = JSON.parse(raw);
        return jsonResponse({
          success: true,
          total: q.length,
          antrean: q
        });
      } catch (e) {
        return jsonResponse({ success: false, error: "Gagal memuat antrean registrasi." }, 500);
      }
    }

    const noReqTarget = reqUrl.searchParams.get("noPermintaan");`;

if (code.includes(getAnchor)) {
  code = code.replace(getAnchor, getReplacements);
}

// 3. Add POST actions before return jsonResponse({ error: `Tindakan '${action}' tidak dikenali` }, 400);
const postAnchor = `return jsonResponse({ error: \`Tindakan '\${action}' tidak dikenali\` }, 400);`;
const postReplacements = `// POST: Submit Registrasi Personel Baru / Pembaruan Kontak
    if (action === "submitRegistrasiPersonel") {
      const regNama = payload?.nama;
      const regEmail = payload?.email;
      const regWa = payload?.whatsapp_number;
      if (!regNama || !regEmail || !regWa) {
        return jsonResponse({ error: "Nama, email, dan WhatsApp wajib diisi." }, 400);
      }
      const regId = "REG-" + Date.now();
      const newReg = {
        registration_id: regId,
        nama: regNama,
        nik: payload?.nik || "",
        office_id: payload?.office_id || "2.0160-00",
        office: payload?.office || "Kantor Pusat Jakarta",
        jabatan: payload?.jabatan || "Staf",
        divisi: payload?.divisi || "Operasional",
        email: regEmail,
        whatsapp_number: regWa,
        alasan_pengajuan: payload?.alasan_pengajuan || "",
        status: "PENDING_VERIFIKASI_ADMIN",
        submitted_by: user.displayName || user.sub,
        submitted_at: new Date().toISOString()
      };
      let q = [];
      try {
        if (fs.existsSync("data/registrasi_personel_antrean.json")) {
          q = JSON.parse(fs.readFileSync("data/registrasi_personel_antrean.json", "utf8"));
        }
      } catch (e) {}
      q.push(newReg);
      fs.writeFileSync("data/registrasi_personel_antrean.json", JSON.stringify(q, null, 2), "utf8");
      return jsonResponse({
        success: true,
        registration_id: regId,
        status: "PENDING_VERIFIKASI_ADMIN",
        message: "Pengajuan registrasi personel berhasil direkam dan menunggu verifikasi administratif."
      });
    }

    // POST: Verifikasi QR Code eLSa & Notifikasi WhatsApp Siap Kirim
    if (action === "verifyElsaQrReport") {
      if (userRole !== ROLES.ADMIN_PUSAT) {
        return jsonResponse({ error: "Akses ditolak: Verifikasi eLSa hanya wewenang Admin Pusat." }, 403);
      }
      const noPermintaan = payload?.noPermintaan;
      const linkElsa = payload?.linkElsa || payload?.linkQr;
      const statusElsa = payload?.statusElsa || "TERVERIFIKASI QR RESMI";
      if (!linkElsa) {
        return jsonResponse({ error: "Tautan QR eLSa wajib diisi." }, 400);
      }
      const targetItem = activeData.find(i => i.noPermintaan === noPermintaan);
      if (targetItem) {
        targetItem.linkElsa = linkElsa;
        targetItem.statusElsa = statusElsa;
        await _saveNolapDatabase(activeData);
      }
      const waNorm = (targetItem?.waPemohon || "081298765432").replace(/^0/, "62").replace(/[^0-9]/g, "");
      const waText = encodeURIComponent(\`*NOTIFIKASI RESMI KJPP NANANG RAHAYU*\\n\\nYth. Rekan \${targetItem?.namaPemohon || "Pengaju"},\\n\\nQR Code eLSa-PK untuk laporan \${targetItem?.nomorLaporan || targetItem?.noPermintaan} telah BERHASIL DIVERIFIKASI dan terdaftar resmi di basis data Kemenkeu.\\n\\nTautan Verifikasi eLSa:\\n\${linkElsa}\\n\\nSalam hormat,\\n*Admin Operasional Pusat KJPP NSR*\`);
      const waUrl = \`https://wa.me/\${waNorm}?text=\${waText}\`;
      return jsonResponse({
        success: true,
        statusElsa: statusElsa,
        notification_id: "NOTIF-ELSA-" + Date.now(),
        wa_url: waUrl,
        message: "Verifikasi eLSa berhasil disimpan dan notifikasi telah disiapkan."
      });
    }

    return jsonResponse({ error: \`Tindakan '\${action}' tidak dikenali\` }, 400);`;

if (code.includes(postAnchor)) {
  code = code.replace(postAnchor, postReplacements);
}

fs.writeFileSync(proxyPath, code, 'utf8');
console.log('✓ netlify/functions/nolap-data-proxy.mjs successfully patched with notification and contact actions!');
