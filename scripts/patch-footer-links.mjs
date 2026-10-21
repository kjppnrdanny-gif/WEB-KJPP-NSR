import fs from 'node:fs';

const files = ['GPS.html', 'gas-portal-absensi-template.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Regex to match the script tag starting with <script src="lib/privacy-consent.js"> and ending with </script>
  const scriptRegex = /<script src="lib\/privacy-consent\.js">[\s\S]*?<\/script>/;
  
  if (!scriptRegex.test(content)) {
    console.error(`Pattern not found in ${file}`);
    continue;
  }

  const cleanScript = `<script>
    // ----------------------------------------------------
    // FOOTER LINKS & PRIVACY MODAL CONTROLLERS (UU PDP)
    // ----------------------------------------------------
    function bukaModalPrivasiKaryawan() {
      var modal = document.getElementById('modal-privasi-karyawan');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        var closeBtn = document.getElementById('btn-tutup-privasi-bawah');
        if (closeBtn) closeBtn.focus();
      }
    }

    function tutupModalPrivasiKaryawan() {
      var modal = document.getElementById('modal-privasi-karyawan');
      if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        var trigger = document.getElementById('btn-privasi-karyawan');
        if (trigger) trigger.focus();
      }
    }

    function bukaTautanEksternal(e, url) {
      if (e && (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1)) {
        return; // Izinkan shortcut new-tab default sistem operasi / browser
      }
      try {
        var win = window.open(url, '_blank', 'noopener,noreferrer');
        if (win && !win.closed) {
          if (e && e.preventDefault) e.preventDefault();
          return;
        }
      } catch (err) {
        // Fallback: biarkan event default tag <a> target="_blank" dijalankan browser
      }
    }

    // Ekspor ke window global untuk memastikan aksesibilitas dalam scope HTML
    window.bukaModalPrivasiKaryawan = bukaModalPrivasiKaryawan;
    window.tutupModalPrivasiKaryawan = tutupModalPrivasiKaryawan;
    window.bukaTautanEksternal = bukaTautanEksternal;

    // Keyboard Accessibility: Escape key handler & backdrop click
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' || event.keyCode === 27) {
        var modalPrivasi = document.getElementById('modal-privasi-karyawan');
        if (modalPrivasi && !modalPrivasi.classList.contains('hidden')) {
          tutupModalPrivasiKaryawan();
        }
        var modalNotif = document.getElementById('modal-notif');
        if (modalNotif && !modalNotif.classList.contains('hidden')) {
          tutupModalNotif();
        }
      }
    });

    document.addEventListener('click', function(event) {
      var modalPrivasi = document.getElementById('modal-privasi-karyawan');
      if (modalPrivasi && event.target === modalPrivasi) {
        tutupModalPrivasiKaryawan();
      }
      var modalNotif = document.getElementById('modal-notif');
      if (modalNotif && event.target === modalNotif) {
        tutupModalNotif();
      }
    });
  </script>`;

  content = content.replace(scriptRegex, cleanScript);
  fs.writeFileSync(file, content, 'utf8');
  console.log(`✓ Clean script successfully applied to ${file}`);
}
