import https from "node:https";

function checkLive() {
  const url = "https://kjppnanangrahayu.com/?v=" + Date.now();
  https.get(url, (res) => {
    let body = "";
    res.on("data", c => body += c);
    res.on("end", () => {
      console.log("HTTP Status:", res.statusCode);
      const cGaleri = body.includes(">Galeri</span>");
      const cKantor = body.includes(">Kantor Cabang</span>");
      const cMutu = body.includes(">NSR Cloud &amp; Mutu</span>");
      const cDataTab = body.includes('data-tab="mutu"');
      const cCssGlow = body.includes("Ikon Menyala (Soft Glow)");
      const noBadge = !body.includes("tab-indicator-badge");

      console.log("1. Label Galeri murni:", cGaleri ? "✓ PASS" : "✗ WAIT DEPLOY");
      console.log("2. Label Kantor Cabang:", cKantor ? "✓ PASS" : "✗ WAIT DEPLOY");
      console.log("3. Label NSR Cloud & Mutu:", cMutu ? "✓ PASS" : "✗ WAIT DEPLOY");
      console.log("4. Attribute data-tab:", cDataTab ? "✓ PASS" : "✗ WAIT DEPLOY");
      console.log("5. CSS Soft Glow aktif:", cCssGlow ? "✓ PASS" : "✗ WAIT DEPLOY");
      console.log("6. Badge AKTIF terhapus:", noBadge ? "✓ PASS" : "✗ WAIT DEPLOY");

      if (cGaleri && cKantor && cMutu && cDataTab && cCssGlow && noBadge) {
        console.log("\n🎉 LIVE DEPLOYMENT BERHASIL 100%!");
      } else {
        console.log("\n⏳ Sedang sinkronisasi via GitHub Actions...");
      }
    });
  }).on("error", (e) => console.error("Error:", e.message));
}

checkLive();
