import fs from "fs";

const html = fs.readFileSync("index.html", "utf8");

console.log("==================================================================");
console.log("🚀 VERIFIKASI UNIT REFINEMENT EMPAT TAB HOMEPAGE (INDEX.HTML)");
console.log("==================================================================");

// Check 1: Button IDs
const btnMutu = html.includes('id="tab-btn-mutu"');
const btnLayanan = html.includes('id="tab-btn-layanan"');
const btnGaleri = html.includes('id="tab-btn-galeri"');
const btnKantor = html.includes('id="tab-btn-kantor"');
console.log("1. Button IDs exist:", btnMutu && btnLayanan && btnGaleri && btnKantor ? "✓ LULUS" : "✗ GAGAL");

// Check 2: Labels
const lMutu = html.includes(">NSR Cloud &amp; Mutu</span>");
const lLayanan = html.includes(">Layanan Unggulan</span>");
const lGaleri = html.includes(">Galeri</span>");
const lKantor = html.includes(">Kantor Cabang</span>");
console.log("2. Exact Labels (1. NSR Cloud & Mutu, 2. Layanan Unggulan, 3. Galeri, 4. Kantor Cabang):", lMutu && lLayanan && lGaleri && lKantor ? "✓ LULUS" : "✗ GAGAL");

// Check 3 & 4: Old labels removed from buttons
const oldFlex = html.includes(">Galeri FlexCarousel 3D</span>");
const old5Kantor = html.includes(">5 Kantor &amp; Peta</span>");
console.log("3. Teks 'FlexCarousel 3D' dihapus dari label tombol:", !oldFlex ? "✓ LULUS" : "✗ GAGAL");
console.log("4. Teks '5 Kantor & Peta' diganti menjadi 'Kantor Cabang':", !old5Kantor ? "✓ LULUS" : "✗ GAGAL");

// Check 5: No Aktif badge
const hasAktifBadge = html.includes("tab-indicator-badge");
console.log("5. Tulisan/Badge AKTIF dihapus:", !hasAktifBadge ? "✓ LULUS" : "✗ GAGAL");

// Check 6: data-tab attributes
const dtMutu = html.includes('data-tab="mutu"');
const dtLayanan = html.includes('data-tab="layanan"');
const dtGaleri = html.includes('data-tab="galeri"');
const dtKantor = html.includes('data-tab="kantor"');
console.log("6. data-tab attributes exist:", dtMutu && dtLayanan && dtGaleri && dtKantor ? "✓ LULUS" : "✗ GAGAL");

// Check 7: Grid responsive container
const hasGrid = html.includes("grid grid-cols-2 md:grid-cols-4");
console.log("7. Grid 2 kolom mobile/tablet, 4 kolom desktop:", hasGrid ? "✓ LULUS" : "✗ GAGAL");

// Check 8: Glowing CSS rules
const hasMutuGlow = html.includes('.tab-btn-utama[aria-selected="true"][data-tab="mutu"] .tab-icon');
const hasLayananGlow = html.includes('.tab-btn-utama[aria-selected="true"][data-tab="layanan"] .tab-icon');
const hasGaleriGlow = html.includes('.tab-btn-utama[aria-selected="true"][data-tab="galeri"] .tab-icon');
const hasKantorGlow = html.includes('.tab-btn-utama[aria-selected="true"][data-tab="kantor"] .tab-icon');
console.log("8. Aturan CSS Soft Glow Ikon (Cyan, Emas, Teal, Coral):", hasMutuGlow && hasLayananGlow && hasGaleriGlow && hasKantorGlow ? "✓ LULUS" : "✗ GAGAL");

// Check 9: Galeri Carousel intact
const hasCarouselInit = html.includes("if (kunci === 'galeri')");
console.log("9. Handler FlexCarousel 3D WebGL tetap utuh:", hasCarouselInit ? "✓ LULUS" : "✗ GAGAL");

// Check 10: Map iframe intact
const hasMapInit = html.includes("if (kunci === 'kantor')");
console.log("10. Handler Google Maps 5 Kantor tetap utuh:", hasMapInit ? "✓ LULUS" : "✗ GAGAL");

const allPass = btnMutu && btnLayanan && btnGaleri && btnKantor &&
                lMutu && lLayanan && lGaleri && lKantor &&
                !oldFlex && !old5Kantor && !hasAktifBadge &&
                dtMutu && dtLayanan && dtGaleri && dtKantor &&
                hasGrid && hasMutuGlow && hasLayananGlow && hasGaleriGlow && hasKantorGlow &&
                hasCarouselInit && hasMapInit;

console.log("==================================================================");
console.log("STATUS AKHIR:", allPass ? "🎉 SELURUH PEMERIKSAAN LULUS (100%)" : "❌ ADA PEMERIKSAAN YANG GAGAL");
console.log("==================================================================");

if (!allPass) process.exit(1);
