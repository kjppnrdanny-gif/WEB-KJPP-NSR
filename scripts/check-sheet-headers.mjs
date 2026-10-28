const url = 'https://docs.google.com/spreadsheets/d/1VJW4nrzc1884kxepxZ2p8zNUcHrCWEqodQQcjeXXg_g/gviz/tq?tqx=out:csv&sheet=Data_Penugasan';

try {
  const res = await fetch(url);
  const csv = await res.text();
  const lines = csv.split(/\r?\n/);
  console.log('Total rows received:', lines.length);
  const header = lines[0];
  console.log('Raw Header:\n', header);
  // parse CSV line with quotes
  const parseCSVLine = (text) => {
    const re = /(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^\",]+)|,/g;
    const elements = [];
    let matches;
    let lastIndex = 0;
    // Simple split if no tricky quotes
    return text.split(',').map(s => s.replace(/^"|"$/g, '').trim());
  };
  const cols = parseCSVLine(header);
  cols.forEach((col, idx) => {
    console.log(`Col ${idx + 1}: ${col}`);
  });
} catch (e) {
  console.error('Fetch error:', e);
}
