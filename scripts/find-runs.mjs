async function findRun() {
  const res = await fetch('https://github.com/kjppnrdanny-gif/WEB-KJPP-NSR/actions');
  const html = await res.text();
  
  // Find all runs/ links
  const matches = [...html.matchAll(/\/actions\/runs\/(\d+)/g)];
  const runIds = [...new Set(matches.map(m => m[1]))];
  console.log('Recent Run IDs found on GitHub Actions page:', runIds.slice(0, 5));
}

findRun().catch(console.error);
