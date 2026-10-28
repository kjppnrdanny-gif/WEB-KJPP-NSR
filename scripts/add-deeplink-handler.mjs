import fs from 'node:fs';

let content = fs.readFileSync('index.html', 'utf8');

const snippet = `
    // Auto-trigger pencarian dari parameter URL (?track= atau ?jo=)
    document.addEventListener('DOMContentLoaded', () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('track') || params.get('jo');
        if (code) {
          const inp = document.getElementById('track-jo-input');
          if (inp) {
            inp.value = code.trim();
            const el = document.getElementById('lacak-penugasan');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              if (typeof eksekusiLacakPenugasanPublik === 'function') {
                eksekusiLacakPenugasanPublik();
              }
            }, 600);
          }
        }
      } catch (e) {
        console.warn('Parameter track error:', e);
      }
    });
`;

if (!content.includes('Auto-trigger pencarian dari parameter URL')) {
  content = content.replace('window.tutupModalTrackingPublik = tutupModalTrackingPublik;', 'window.tutupModalTrackingPublik = tutupModalTrackingPublik;' + snippet);
  fs.writeFileSync('index.html', content, 'utf8');
  console.log('✓ Added deep link handler to index.html');
} else {
  console.log('Deep link handler already present in index.html');
}
