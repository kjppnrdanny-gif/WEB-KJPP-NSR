const url = "https://script.google.com/macros/s/AKfycbwAq8vKXq8rbKgAtxUlSHkxWqqM7329UZyVtXTmEK0bcX7p9dyaidm7KCXG2iALwZ9d/exec";

const res = await fetch(url, { redirect: "follow" });
const json = await res.json();
console.log("Submissions count:", json.submissions?.length);
if (json.submissions?.length > 0) {
  console.log("First submission keys:", Object.keys(json.submissions[0]));
  console.log("First submission sample:", JSON.stringify(json.submissions[0], null, 2));
}
