const url = "https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec";

try {
  console.log("Testing GET:", url);
  const getRes = await fetch(url, { redirect: "follow" });
  const getText = await getRes.text();
  console.log("GET status:", getRes.status, "Length:", getText.length);
  console.log("GET preview:", getText.slice(0, 500));
} catch (e) {
  console.error("GET error:", e);
}
