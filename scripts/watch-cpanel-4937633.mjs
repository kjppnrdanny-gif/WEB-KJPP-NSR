async function watch() {
  const runMain = '40736466008';
  const runDev = '40736495337';
  console.log(`=== MONITORING CPANEL RUNS: main=${runMain}, dev=${runDev} ===`);
  
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`https://github.com/kjppnrdanny-gif/WEB-KJPP-NSR/actions/runs/${runMain}`);
      const html = await res.text();
      
      let status = 'in_progress';
      if (html.includes('completed successfully')) status = 'success';
      else if (html.includes('This run was cancelled')) status = 'cancelled';
      else if (html.includes('failed') && (html.includes('failure.svg') || html.includes('Job failed'))) status = 'failure';

      console.log(`[Attempt ${i+1}] Run ${runMain} (main) Status: ${status}`);
      if (status === 'success') {
        console.log(`🎉 RUN ${runMain} COMPLETED SUCCESSFULLY! cPanel deployment active.`);
        return 'success';
      }
      if (status === 'failure' || status === 'cancelled') {
        console.log(`⚠️ RUN ${runMain} ended with ${status}`);
        return status;
      }
    } catch (e) {
      console.warn('Poll error:', e.message);
    }
    await new Promise(r => setTimeout(r, 6000));
  }
}

watch().catch(console.error);
