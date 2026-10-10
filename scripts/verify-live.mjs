import https from "node:https";

https.get("https://kjppnanangrahayu.com/", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    console.log("Server Content-Length:", res.headers["content-length"]);
    console.log("Last-Modified:", res.headers["last-modified"]);
    console.log("1 Pusat + 4 Cabang (Bandung, Padang, Makassar, Palembang):", data.includes("Bandung, Padang, Makassar, Palembang"));
    console.log("KMK Resmi 248/KM.1/2019:", data.includes("248/KM.1/2019"));
    console.log("WhatsApp Resmi 085110513157:", data.includes("085110513157"));
    console.log("Modal Portal Internal Ada:", data.includes("modal-portal"));
    console.log("Bebas Token Hardcoded Lama:", !data.includes("TOKEN_CABANG_NSR") && !data.includes("MASTER_TOKEN"));
    console.log("Navigasi Legalitas, Layanan, Tim Ada:", 
      data.includes("profil-legalitas.html") && 
      data.includes("layanan.html") && 
      data.includes("tim-cabang.html")
    );
  });
});
